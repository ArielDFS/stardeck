"use client";

import { useCallback, useRef, useState } from "react";
import type { MissionEvent, MissionStatus, MissionStep } from "@/types/mission";

/** Config da instância de Agente enviada ao servidor (ADR-0010 #8). */
interface AgentRunConfig {
  systemPrompt: string;
  model: { host: string; premium?: string; prefer?: "host" | "premium" };
  capabilities: string[];
}

interface RunOptions {
  apiKey?: string;
  /** Config editada do agente (prompt/modelo/capacidades) — vale no servidor. */
  agent?: AgentRunConfig;
  /** Chamado quando a missão conclui com sucesso (evento `done`). */
  onComplete?: (result: { durationMs: number; modelUsed: string | null }) => void;
}

interface UseMissionState {
  agentSlug: string | null;
  status: MissionStatus;
  output: string;
  steps: MissionStep[];
  error: string | null;
  durationMs: number | null;
  modelUsed: string | null;
}

const INITIAL: UseMissionState = {
  agentSlug: null,
  status: "STANDBY",
  output: "",
  steps: [],
  error: null,
  durationMs: null,
  modelUsed: null,
};

/**
 * Executa missões contra qualquer agente e consome o stream de eventos
 * NDJSON (step/token/done/error), renderizando os tokens conforme chegam.
 */
export function useMission() {
  const [state, setState] = useState<UseMissionState>(INITIAL);
  const abortRef = useRef<AbortController | null>(null);

  const run = useCallback(
    async (agentSlug: string, input: string, options: RunOptions = {}) => {
      const trimmed = input.trim();
      if (!trimmed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const startedAt = performance.now();
      setState({
        agentSlug,
        status: "PROCESSING",
        output: "",
        steps: [],
        error: null,
        durationMs: null,
        modelUsed: null,
      });

      const applyEvent = (e: MissionEvent, acc: { text: string }) => {
        switch (e.type) {
          case "token":
            acc.text += e.text;
            setState((s) => ({ ...s, status: "STREAMING", output: acc.text }));
            break;
          case "step":
            setState((s) => {
              const steps = [...s.steps];
              const i = steps.findIndex((st) => st.id === e.id);
              const step: MissionStep = {
                id: e.id,
                label: e.label,
                status: e.status,
                detail: e.detail,
              };
              if (i >= 0) steps[i] = step;
              else steps.push(step);
              return { ...s, steps };
            });
            break;
          case "done": {
            const durationMs = Math.round(performance.now() - startedAt);
            setState((s) => ({
              ...s,
              status: "COMPLETED",
              modelUsed: e.modelUsed ?? s.modelUsed,
              durationMs,
            }));
            options.onComplete?.({ durationMs, modelUsed: e.modelUsed ?? null });
            break;
          }
          case "error":
            setState((s) => ({ ...s, status: "ERROR", error: e.message }));
            break;
        }
      };

      try {
        const res = await fetch(`/api/agents/${agentSlug}/run`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            input: trimmed,
            apiKey: options.apiKey,
            agent: options.agent,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({}));
          setState((s) => ({
            ...s,
            status: "ERROR",
            error: err.error ?? `Erro ${res.status}.`,
          }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        const acc = { text: "" };
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.trim()) continue;
            try {
              applyEvent(JSON.parse(line) as MissionEvent, acc);
            } catch {
              // linha parcial/inválida — ignora
            }
          }
        }
      } catch (err) {
        if (controller.signal.aborted) return;
        setState((s) => ({
          ...s,
          status: "ERROR",
          error: err instanceof Error ? err.message : "Erro de rede.",
        }));
      }
    },
    [],
  );

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setState(INITIAL);
  }, []);

  return { ...state, run, reset };
}
