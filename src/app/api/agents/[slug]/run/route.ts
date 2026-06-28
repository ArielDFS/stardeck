import { NextRequest } from "next/server";
import { getAgent } from "@/agents";
import { streamGemini } from "@/lib/llm/gemini";
import { streamChatCompletion, type ChatMessage } from "@/lib/llm/openrouter";
import { geminiDelta, openRouterDelta, type DeltaExtractor } from "@/lib/llm/stream";
import { emit, readSSEDeltas } from "@/lib/llm/events";
import { tavilySearch, buildSearchContext } from "@/lib/search/tavily";

// Streaming exige runtime Node (não Edge) para o pipe de ReadableStream.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Config resolvida do agente enviada pelo cliente (ADR-0010 #8). */
interface AgentOverride {
  systemPrompt?: string;
  model?: { host: string; premium?: string; prefer?: "host" | "premium" };
  capabilities?: string[];
}

interface RunBody {
  input?: string;
  /** Chave OpenRouter do visitante (BYOK) — destrava o modelo premium. */
  apiKey?: string;
  /** Config da instância de Agente (prompt/modelo/capacidades editados). */
  agent?: AgentOverride;
}

const MAX_PROMPT = 8000;

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  let body: RunBody;
  try {
    body = (await req.json()) as RunBody;
  } catch {
    return Response.json({ error: "Corpo inválido." }, { status: 400 });
  }

  // Resolve a config: prioriza a override do cliente; cai no Blueprint por slug.
  const blueprint = getAgent(slug);
  const ov = body.agent;
  const systemPrompt = (ov?.systemPrompt ?? blueprint?.systemPrompt ?? "").slice(
    0,
    MAX_PROMPT,
  );
  const model = ov?.model ?? blueprint?.model;
  const capabilities = ov?.capabilities ?? blueprint?.capabilities ?? [];

  if (!model?.host) {
    return Response.json(
      { error: "Agente sem configuração de modelo." },
      { status: 400 },
    );
  }

  const input = body.input?.trim();
  if (!input) {
    return Response.json(
      { error: "Input da missão é obrigatório." },
      { status: 400 },
    );
  }

  // Roteamento de modelo (ADR-0010 #8): premium só com BYOK; senão cai pro host.
  const byokKey = body.apiKey?.trim();
  const prefersPremium = model.prefer === "premium" && Boolean(model.premium);
  const usePremium = prefersPremium && Boolean(byokKey);

  const geminiKey = process.env.GEMINI_API_KEY;
  if (!usePremium && !geminiKey) {
    return Response.json(
      {
        error:
          "Nenhuma API key disponível. Configure GEMINI_API_KEY no servidor ou forneça a sua chave OpenRouter (BYOK) para o modelo premium.",
      },
      { status: 503 },
    );
  }

  // A partir daqui devolvemos um stream de eventos NDJSON (status 200).
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        // Aviso: preferiu premium mas não há BYOK → usando o host.
        if (prefersPremium && !byokKey) {
          emit(controller, {
            type: "step",
            id: "model",
            label: "Modelo premium requer BYOK — usando host (Gemini)",
            status: "done",
          });
        }

        // Ferramenta de busca (capacidade web_search — ex.: ARIA).
        let userMessage = input;
        if (capabilities.includes("web_search")) {
          const tavilyKey = process.env.TAVILY_API_KEY;
          if (tavilyKey) {
            emit(controller, {
              type: "step",
              id: "search",
              label: "Buscando na web",
              status: "running",
              detail: input,
            });
            try {
              const results = await tavilySearch(input, tavilyKey, req.signal);
              emit(controller, {
                type: "step",
                id: "search",
                label: "Busca concluída",
                status: "done",
                detail: `${results.length} fontes`,
              });
              userMessage = buildSearchContext(input, results);
            } catch {
              emit(controller, {
                type: "step",
                id: "search",
                label: "Busca indisponível (erro)",
                status: "done",
              });
            }
          } else {
            emit(controller, {
              type: "step",
              id: "search",
              label: "Busca indisponível (sem TAVILY_API_KEY)",
              status: "done",
            });
          }
        }

        let upstream: Response;
        let modelUsed: string;
        let extractor: DeltaExtractor;

        if (usePremium) {
          const messages: ChatMessage[] = [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ];
          modelUsed = model.premium!;
          extractor = openRouterDelta;
          upstream = await streamChatCompletion({
            model: modelUsed,
            messages,
            apiKey: byokKey!,
            signal: req.signal,
          });
        } else {
          modelUsed = model.host;
          extractor = geminiDelta;
          upstream = await streamGemini({
            model: modelUsed,
            systemPrompt,
            userMessage,
            apiKey: geminiKey!,
            signal: req.signal,
          });
        }

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          emit(controller, {
            type: "error",
            message: `Falha ao chamar o modelo (HTTP ${upstream.status}). ${detail.slice(0, 200)}`,
          });
          controller.close();
          return;
        }

        await readSSEDeltas(upstream.body, extractor, (text) => {
          emit(controller, { type: "token", text });
        });

        emit(controller, { type: "done", modelUsed });
        controller.close();
      } catch (err) {
        emit(controller, {
          type: "error",
          message: err instanceof Error ? err.message : "Erro inesperado.",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
