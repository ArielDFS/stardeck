# CLAUDE.md — NEXUS HUB

> Fonte única de contexto do projeto. Consolida escopo, decisões, glossário e ADRs.
> Projeto: Gamified AI Agent Hub (codinome `NEXUS HUB`) | Autor: Ariel Ferreira (AFS Intelligence)

---

## 0. Idioma & convenções para o Claude Code

- **Sempre responder ao usuário (Ariel) em português do Brasil** — explicações, perguntas, documentação voltada ao usuário.
- Código, nomes de identificadores e termos técnicos consagrados permanecem em inglês quando for a convenção (ex.: `AgentConfig`, `systemPrompt`).
- Este arquivo é o contexto principal. Mantê-lo atualizado conforme as decisões evoluem.

---

## 1. Visão geral

Plataforma web com estética sci-fi/cyberpunk onde agentes de IA são apresentados como **personagens especializados**. O usuário lança missões (tarefas de IA), acompanha respostas em streaming e evolui um perfil gamificado.

**Por que existe (em ordem de prioridade):**
1. **Portfólio de alto impacto visual** para LinkedIn/GitHub — objetivo central.
2. Demonstrar domínio de AI Engineering + Full-Stack + UX avançada.
3. Base extensível para produto/SaaS futuro (AFS Intelligence) — secundário.

**Regra de desempate:** quando portfólio-impacto e base-de-produto conflitarem, **portfólio vence** (ver §3 e ADR-0001).

- **Deploy:** Vercel (frontend + API Routes). Railway/FastAPI só no backlog.
- **Licença:** MIT (open-source).

---

## 2. Glossário de domínio (linguagem canônica)

Termos abaixo são opinionados: quando há sinônimos, use o canônico e evite os listados.

### Atores

- **Visitante** — pessoa anônima que abre o demo hospedado **sem login** (ex.: recrutador vindo do LinkedIn). Joga na hora, estado em `localStorage`, rodando na key do host sob tier grátis limitado.
  _Evite:_ usuário anônimo, guest, lead.
- **Comandante** — Visitante que criou conta e tem identidade persistente. Perfil gamificado (XP, nível, histórico) salvo no servidor. **Diferido para Fase 2.**
  _Evite:_ usuário logado, player, conta.
- **Self-Hoster** — desenvolvedor que clona o repo open-source e roda localmente com a própria API key (BYOK) via `.env.local`.
  _Evite:_ contribuidor, dev, usuário self-hosted.

### Núcleo

- **Agente** — personagem de IA especializado (ex.: NEXUS, o SQL Analyst). Definido por classe, system prompt, modelo primário/fallback e identidade visual.
  _Evite:_ bot, assistente, persona.
- **Missão** — uma execução de tarefa: input de um ator → Agente → resposta em streaming. Unidade que gera XP e é persistida no histórico.
  _Evite:_ tarefa, query, request, job.
- **Créditos** — recurso **puramente cosmético/de jogo** gasto por missão. **NÃO é proteção de custo**: vive em `localStorage` para o Visitante e é trivialmente burlável. A proteção real é server-side (ver §6).
  _Evite:_ saldo. (Tokens = consumo real de LLM, conceito distinto.)
- **BYOK** (Bring Your Own Key) — o ator fornece a própria API key. Obrigatório para o Self-Hoster; opcional para o Visitante que queira destravar modelos premium.

---

## 3. Escopo do MVP (afiado pós-grelha)

### ✅ Dentro do MVP

- **Demo público, sem login, 100% `localStorage`** (XP, nível, créditos cosméticos, agente ativo, histórico local). Sem Supabase/auth.
- **Único backend:** API Route que faz proxy de LLM, com rate-limit por IP + kill-switch de orçamento.
- **Modelos grátis/baratos** (Gemini/Groq) na key do host; **BYOK opcional** destrava premium (Claude).
- **5 agentes:** NEXUS (SQL), ECHO (relatório), FORGE (código sem execução), PHANTOM (resumo) — puro-LLM — + **ARIA (busca web real via Tavily/Brave)**.
- **Gamificação local:** XP + níveis visíveis; todos os agentes **visíveis**, avançados destravam em **1–2 missões** (thresholds mínimos no demo).
- **Cena de assinatura — A NAVE (vista A, estilo FTL):** corte transversal de uma nave; cada agente vive em um **módulo** no casco. O agente focado **trabalha** (módulo brilhando, scanline, barras de atividade) enquanto a resposta streama num **console docado** embaixo, com um **prompt pequeno**. Os outros módulos têm **vida ambiente** (idle). Tokens fluem conforme chegam, **sem delay artificial**. Ver §10.1 e ADR-0007.
- Deploy público na Vercel + README premium com GIF demo.

### ❌ Fora do MVP (backlog)

- Supabase / Comandante / auth / histórico-no-banco / migração `localStorage → conta`.
- **Streak diário** (sem sentido para Visitante anônimo de visita única).
- Recarga diária de créditos, bônus de streak.
- Agentes **VEGA** (visualização) e **ORACLE** (forecasting) — exigem infra real.
- **FastAPI / Railway / sklearn**, sandbox de execução de código.
- Pagamentos, API pública, mobile nativo, multi-tenant, integrações (Slack/Notion), marketplace de agentes, missão em cadeia.

---

## 4. Stack & decisões técnicas

### Frontend
| Tecnologia | Versão | Decisão |
|------------|--------|---------|
| Next.js (App Router) | 15 | SSR, API Routes, streaming nativo, deploy Vercel zero-config. (Doc original dizia 14+; subimos para 15 por compatibilidade com Node 24.) |
| TypeScript | 5+ | Tipagem de agentes, missões e estado. |
| Tailwind CSS | 3+ | Velocidade de estilização. |
| Framer Motion | 11+ | Animações (holograma, transições, terminal). |
| Zustand | 4+ | Estado global leve (agente ativo, missão em andamento, XP otimista). |
| React Query | 5+ | Fetching/cache (histórico) — entra junto com persistência. |

### Backend / API
| Tecnologia | Uso |
|------------|-----|
| Next.js API Routes | Proxy/orquestração das chamadas LLM, rate-limit, kill-switch. |
| Google AI Studio (Gemini) | Provedor do **host** — chamado direto (free tier estável). |
| OpenRouter | Gateway usado **só para premium/BYOK** (Claude). Ver ADR-0006. |
| Tavily/Brave (free) | Ferramenta de busca web do agente ARIA. |
| Supabase | **Fase 2** — Auth + DB do Comandante. |
| FastAPI (Railway) | **Backlog** — só se VEGA/ORACLE forem ativados. |

### LLMs & roteamento
| Provedor | Modelo | Uso | Acesso |
|----------|--------|-----|--------|
| Google Gemini (direto) | gemini-2.5-flash | **Host** do demo — Google AI Studio | grátis até cota |
| Anthropic Claude (via OpenRouter) | claude-sonnet-4.6 | Premium — só via **BYOK** do visitante | chave do visitante |

**Estratégia de roteamento:** Missão → se há BYOK + premium → OpenRouter (Claude, chave do visitante); senão → Gemini direto (host) → resposta em streaming → terminal.

> Nota: o OpenRouter `:free` mostrou-se saturado/instável para um demo público (rate-limit upstream). Por isso o host migrou para Gemini direto. Ver ADR-0006.

---

## 5. Arquitetura

```
┌────────────────────────────────────────────────────────────┐
│                     VISITANTE (Browser)                     │
│   Agent Grid ──▶ Mission Terminal (streaming)   Top HUD     │
│        │ POST /api/agents/[slug]/run                        │
└────────┼────────────────────────────────────────────────────┘
         ▼
┌────────────────────────────────────────────────────────────┐
│                   NEXT.JS API ROUTES                        │
│   /api/agents/[slug]/run ─▶ rate-limit → kill-switch →      │
│                              Agent Resolver → OpenRouter     │
│                              (ARIA: + ferramenta de busca)   │
└────────────────────────────────────────────────────────────┘
         │ stream (SSE / ReadableStream)
         ▼  back to terminal
```

Estado de gamificação (XP/nível/créditos/histórico) é **client-side** em `localStorage` no MVP.

---

## 6. Proteção de custo (server-side)

O demo é público, sem login, e chama LLMs reais. Defesa em camadas (ADR-0002):
1. **Modelos grátis/baratos** (Gemini/Groq) na key do host; Claude só via BYOK.
2. **Rate-limit por IP** na API Route.
3. **Kill-switch de orçamento diário global** — desliga chamadas ao ultrapassar teto configurável.
4. **BYOK opcional** — Visitante cola a própria key para destravar premium.

> Os **créditos** da UI são desacoplados do consumo real de tokens. A "carteira" de verdade é o servidor.

---

## 7. Estrutura de pastas (estado atual)

```
nexus-hub/
├── public/ship/                 # assets 2D da nave (PNG) + ASSETS.md (guia de geração)
│   ├── hull-exterior.png        # casco (gerado por IA, recortado)
│   ├── bot-idle.png  bot-working.png   # robô uniforme (2 poses, aparados)
│   └── ASSETS.md                # manifesto/guia de geração dos assets
├── src/
│   ├── app/
│   │   ├── layout.tsx           # fontes (Orbitron/JetBrains/Inter), metadata
│   │   ├── page.tsx             # renderiza <ShipView/>
│   │   ├── globals.css          # tokens + animações (scanline, bob do robô, etc.)
│   │   └── api/agents/[slug]/run/route.ts   # proxy LLM + busca + stream de eventos NDJSON
│   ├── components/ship/         # ShipView, AgentModule (robô+tint), ModuleConsole
│   ├── agents/                  # registry + config (index, nexus, aria, echo, forge, phantom)
│   ├── lib/
│   │   ├── llm/                 # gemini.ts (host), openrouter.ts (premium/BYOK), stream.ts (extractors), events.ts (NDJSON)
│   │   └── search/tavily.ts     # busca web da ARIA
│   ├── hooks/useMission.ts      # dispara missão + parseia eventos (token/step/done/error)
│   ├── store/shipStore.ts       # Zustand: agente focado
│   └── types/                   # agent.ts, mission.ts (+ MissionEvent/MissionStep)
├── .env.local.example
├── CLAUDE.md  README.md
└── tailwind.config.ts  next.config.mjs  tsconfig.json
```

> A construir nas próximas fatias: `lib/gamification/`, `lib/storage/`, `lib/guards/`, `components/TopHUD`, `XPRewardToast`.
> Diferido (backlog): `src/lib/supabase/`, `supabase/migrations/`, `python-api/`, assets `equip-*`/`room-*`.

---

## 8. Agentes — especificação

```typescript
// src/types/agent.ts
export type AgentClass =
  | 'SQL_ANALYST' | 'RESEARCH_SCOUT' | 'REPORT_WRITER'
  | 'CODE_BUILDER' | 'SUMMARIZER'

export interface AgentConfig {
  slug: string
  name: string
  class: AgentClass
  tagline: string
  description: string
  avatarUrl: string
  accentColor: string
  model: { primary: string; fallback: string }
  systemPrompt: string
  inputPlaceholder: string
  usesSearch?: boolean        // true só para ARIA (ferramenta de busca)
  xpReward: number
  unlockLevel: number         // mínimo no MVP (destrava em 1-2 missões)
}
```

### Tabela de agentes (MVP)
| Slug | Nome | Classe | Host (Gemini direto) | Premium (BYOK / OpenRouter) | XP | Unlock | Ferramenta |
|------|------|--------|----------------------|-----------------------------|----|--------|-----------|
| `nexus`   | NEXUS   | SQL Analyst    | gemini-2.5-flash | anthropic/claude-sonnet-4.6 | 100 | 0 | — |
| `aria`    | ARIA    | Research Scout | gemini-2.5-flash | anthropic/claude-sonnet-4.6 | 80  | 0 | **busca web** |
| `phantom` | PHANTOM | Summarizer     | gemini-2.5-flash | —                           | 60  | 1 | — |
| `echo`    | ECHO    | Report Writer  | gemini-2.5-flash | anthropic/claude-sonnet-4.6 | 150 | 1 | — |
| `forge`   | FORGE   | Code Builder   | gemini-2.5-flash | anthropic/claude-sonnet-4.6 | 120 | 2 | — (gera código, **não executa**) |

> ARIA é **honesta sobre busca**: faz busca web real (Tavily/Brave), não alucina fatos atuais. Distingue-a de PHANTOM (resumo de texto fornecido).

### Exemplo de config
```typescript
// src/agents/nexus.ts
export const NEXUS: AgentConfig = {
  slug: 'nexus',
  name: 'NEXUS',
  class: 'SQL_ANALYST',
  tagline: 'Fala SQL. Pensa em dados.',
  systemPrompt: `
    Você é NEXUS, agente analista especializado em SQL e bancos de dados.
    Transforme linguagem natural em queries SQL precisas e eficientes.
    Regras: explique a lógica; identifique o SGBD pelo contexto (default PostgreSQL);
    comentários inline; sugira índices quando relevante; responda em pt-BR.
    Formato: 1) breve análise 2) query em bloco de código 3) explicação passo a passo 4) melhorias opcionais.
  `,
  model: { host: 'gemini-2.5-flash', premium: 'anthropic/claude-sonnet-4.6' },
  inputPlaceholder: 'Ex: "Liste os 10 produtos mais vendidos por categoria no último mês"',
  xpReward: 100, unlockLevel: 0,
  accentColor: '#00F5FF', avatarUrl: '/agents/nexus.svg',
}
```

---

## 9. Gamificação (MVP, local)

### Níveis
```typescript
// src/lib/gamification/levels.ts
export const LEVELS = [
  { level: 1, title: 'Recruta',      xpRequired: 0    },
  { level: 2, title: 'Operativo',    xpRequired: 300  },
  { level: 3, title: 'Especialista', xpRequired: 800  },
  { level: 4, title: 'Agente',       xpRequired: 1800 },
  { level: 5, title: 'Comandante',   xpRequired: 3500 },
  { level: 6, title: 'Arquiteto',    xpRequired: 6000 },
] as const
```
> No demo, os `unlockLevel` dos agentes são mínimos (0–2) para destravar tudo em 1–2 missões.

### Cálculo de XP
```typescript
// src/lib/gamification/xp.ts — baseXP do agente; +20 se durationMs < 3000;
// +50% se primeiro uso do agente. (Bônus de streak: backlog.)
```

### Créditos (cosméticos)
Custo por missão (apenas UI): PHANTOM 2, ARIA 3, NEXUS 4, FORGE 5, ECHO 6. Sem recarga real no MVP.

---

## 10. Fluxo de missão (streaming)

```
1. Visitante digita e clica "LANÇAR MISSÃO"
2. useMission → POST /api/agents/[slug]/run
3. API: rate-limit por IP → kill-switch de orçamento
4. Agent Resolver monta { model, systemPrompt, userMessage } (ARIA: + busca)
5. OpenRouter com stream: true → ReadableStream/SSE para o browser
6. useStreaming consome o stream → MissionOutput renderiza tokens conforme chegam (sem delay)
7. Ao concluir: salva Missão no localStorage, calcula XP
8. profileStore atualiza XP → XPRewardToast "+XP"
9. Se subir de nível: animação de level-up + destrava agente
```

Estados da missão: `STANDBY → PROCESSING → STREAMING → COMPLETED` (ou `ERROR`).

### 10.1. A Nave (interface principal)

A tela principal é uma **nave top-down (estilo FTL)** — substitui o `CommandCenter` de grid+terminal. Decisões:

- **Layout:** vista top-down; **8 módulos** no casco em grade 4×2 (**5 agentes + 3 vagos** reservados p/ futuros agentes — ex.: VEGA, ORACLE) + **Ponte/Reator** decorativa, com proa/cockpit na direita e motores na popa.
- **Arte:** **2D ilustrado chapado (estilo FTL), gerada por IA**, em **camadas modulares** (casco externo + tiles de chão/parede + equipamento por agente + sala-vaga). A grade é montada por **código** a partir de peças atômicas. Estados (idle/focused/working) são **glows CSS** tingidos por accent, não assets. Guia de geração: `public/ship/ASSETS.md`. (Reverte a decisão "CSS/SVG geométrico" original — ver ADR-0007.) A nave SVG atual é placeholder até os PNGs chegarem.
- **Personagens:** cada agente é representado por um **robô uniforme** (mesmo chassi) no seu módulo. Gera-se **1 robô** com accent ciano; a cor por agente é aplicada por **código** (`hue-rotate`) — sem regenerar por agente. O robô **caminha de verdade** (ciclo de caminhada em sprite sheet, ainda de **um único robô**) + poses idle/working. Coreografia (ver ADR-0008): o **agente focado** caminha até o console (micro-passo curto) e entra em pose de trabalho com partículas intensas durante o stream; os **agentes idle** perambulam pelo cômodo em **rajadas ocasionais** (timing aleatório por agente). **Partículas** sempre ligadas em todos os módulos, intensificadas no foco. (Reverte a cláusula "sem perambular / sprite único sem frames" da ADR-0007.)
- **Concorrência:** **um agente roda a missão real por vez** (o focado). Os demais módulos têm **vida de idle** — a nave parece viva sem orquestrar missões concorrentes. Concorrência real = backlog ("Missão em Cadeia").
- **Seleção:** **clicar no módulo** foca o agente (borda ciano pulsante); o prompt passa a mirar nele.
- **Saída:** **console docado embaixo** (sempre visível) onde o texto streama, com **prompt pequeno** abaixo. A nave fica sempre em cena.
- **"Executando funções":** mostrar **eventos de função reais onde existem** — o caso de ouro é a **ARIA** (passos da busca: `BUSCANDO → N fontes → sintetizando`). Agentes puro-LLM mostram só o estado "trabalhando" + texto (sem fases falsas).
- **Protocolo de stream:** a rota emite **eventos estruturados** (`step` = evento de função/ferramenta; `token` = delta de texto; `done` = fim), não texto puro. O streaming de texto da Fatia 1 vira a base, envelopada por esse protocolo.

> Mockup de referência (descartável): `_mockups/ship-layouts.html`.

---

## 11. Design system & tokens

```typescript
// tailwind.config.ts
colors: {
  void:'#050A14', surface:'#0D1B2A', 'surface-2':'#112233', border:'#1E3A5F',
  cyan:'#00F5FF', violet:'#7B2FBE', 'red-alert':'#FF4C4C', gold:'#FFD700',
  text:'#C9D6DF', 'text-muted':'#5A7A94', 'text-dim':'#2E4A63',
}
fontFamily: { display:['Orbitron','monospace'], mono:['JetBrains Mono','monospace'], body:['Inter','sans-serif'] }
animation: { 'pulse-cyan','scan-line','float-up','hologram-in' }
boxShadow: { 'glow-cyan','glow-violet','glow-gold' }
```
Componentes base: Button (primary/ghost/danger/ghost-violet), Badge (class/level/status/xp), ProgressBar (XP com glow), Tooltip (dark + borda cyan), Modal (backdrop blur), Terminal (fundo void, mono, cursor piscante).

---

## 12. Roadmap de implementação (fatias verticais)

> **Estado atual (jun/2026):** Fatias 0–2 concluídas. App roda local com nave FTL, 5 agentes em streaming, ARIA com busca real. Próxima: Fatia 3. A cena da nave foi **reprototipada** em `_mockups/ship-render.html` (render único + robôs animados + FX de starfield/motores), ainda a portar pro `ShipView` real.

- **Fatia 0 — Esqueleto que roda:** ✅ Next.js 15 + TS + Tailwind + tokens.
- **Fatia 1 — Missão real ponta-a-ponta:** ✅ NEXUS → API Route proxy → Gemini streaming → terminal. *Risco técnico maior eliminado.*
- **Fatia 2 — A Nave (top-down/FTL) + 5 agentes:** ✅ `ShipView` com casco PNG (gerado por IA, recortado), 8 módulos (5 agentes + 3 vagos), **clicar-pra-focar**, console docado + prompt pequeno, **robôs** (idle/working, tingidos por agente via `hue-rotate`). Rota com **protocolo de eventos** (`step`/`token`/`done`/`error`). **ARIA + busca real (Tavily)** com passos visíveis. Ver §10.1.
  - _Pendência de polimento:_ módulos maiores/mais "cômodo" (limitado pela altura do convés — eventual casco com convés mais alto); afinar tints; assets `equip-*`.
- **Fatia 3 — Gamificação local:** XP/níveis em `localStorage`, `TopHUD`, `XPRewardToast`, desbloqueio dos módulos vagos, level-up. ⬅️ **próxima**
- **Fatia 4 — Proteção + BYOK:** rate-limit por IP, kill-switch de orçamento, campo de BYOK opcional.
- **Fatia 5 — Polimento + deploy final:** responsividade, deploy Vercel, GIF/Loom.

### Protótipo visual da nave — `_mockups/ship-render.html` (jun/2026)
Antes de portar pra componentes React, a cena foi prototipada em HTML/CSS/JS puro, validando: **render único** da nave como fundo (`ship-render.png`); módulos posicionados por % sobre as salas (caixas afináveis); **máquina de estados do robô** (idle/walk/working) com perambular em rajadas dentro da sala; **clique no robô** pra focar (glow seguindo a silhueta do sprite + nome flutuante acima dele); **glow neon ambiente por sala** (CSS `mix-blend-mode:screen`, cor do agente); console docado com streaming; e **canvas de FX** (starfield direita→esquerda com parallax + jatos dos propulsores). Mockups anteriores (descartáveis): `ship-code-only.html` (POC procedural rejeitado), `ship-topdown.html`. Esses aprendizados serão portados pro `ShipView` real na Fatia 5.

### Backlog de polimento de frontend/animação (alvo: Fatia 5)
- **Vida & movimento:** robô "respirando" no idle; nave flutuando (bob+sway) + parallax de mouse; flicker nos motores.
- **Cinematográfico:** spotlight no foco (escurece o resto da nave + micro-zoom/pan); entrada na carga (salas acendem em sequência).
- **Terminal/HUD:** dock estilo terminal de verdade (avatar do agente, chips de status, contador de tokens, scanlines, borda no accent); **XP toast + barra de XP** (puxa a Fatia 3).
- **Acabamento/engenharia:** `prefers-reduced-motion`; pausar FX com aba oculta; tooltip no hover do robô (nome/classe/tagline); responsividade mobile; som sutil (opcional).

**Backlog (pós-MVP):** Supabase/Comandante/auth, histórico-no-banco, streak, VEGA, ORACLE/FastAPI, custom agents, marketplace, missão em cadeia.

---

## 13. Variáveis de ambiente

```bash
# .env.local
# === LLM HOST (obrigatório) ===
GEMINI_API_KEY=...                    # Google AI Studio — host do demo (free tier)
# === LLM PREMIUM / BYOK (opcional) ===
OPENROUTER_API_KEY=sk-or-...          # só para premium (Claude) via BYOK
# === BUSCA (ARIA — Fatia 2) ===
TAVILY_API_KEY=...                    # ou BRAVE_API_KEY
# === GUARDS (Fatia 4) ===
DAILY_BUDGET_USD=5                    # kill-switch de orçamento
RATE_LIMIT_PER_IP=10                  # missões/IP/janela
# === APP ===
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=NEXUS HUB
# === FASE 2 (diferido) ===
# NEXT_PUBLIC_SUPABASE_URL=...
# SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 14. Decisões registradas (ADRs)

### ADR-0001 — MVP é client-only (localStorage); backend só para proxy de LLM
**Contexto:** doc original previa Supabase já na Fase 1; objetivo central é portfólio-primeiro (link rápido, sem fricção de login).
**Decisão:** MVP 100% client-side (XP/nível/créditos/histórico em `localStorage`); único server-side é a API Route de proxy de LLM (+ guards). Supabase/auth/Comandante/histórico-no-banco → Fase 2.
**Razão:** o Visitante nunca vê auth/persistência no demo; construir isso no caminho crítico só atrasaria o link.
**Consequência:** estado do Visitante é efêmero por navegador; migração `localStorage → conta` na Fase 2 exigirá merge (dívida conhecida).

### ADR-0002 — Proteção de custo: tier grátis na key do host + BYOK opcional
**Contexto:** demo público, sem login, chamando LLMs reais; "créditos" em `localStorage` são burláveis e não protegem custo.
**Decisão:** (1) modelos grátis/baratos (Gemini/Groq) na key do host, Claude só via BYOK; (2) rate-limit por IP; (3) kill-switch de orçamento diário; (4) BYOK opcional para premium. Créditos permanecem cosméticos.
**Razão:** mantém o "uau" sem fricção para o recrutador enquanto protege a carteira do host; open-source resolve o Self-Hoster, não o demo hospedado.
**Consequência:** a carteira real é o servidor; créditos da UI desacoplados do consumo de tokens; precisa de teto configurável + contadores de rate-limit.

### ADR-0003 — App Router (Next.js)
**Decisão:** App Router. **Razão:** Server Components reduzem JS no cliente, layouts aninhados, API Routes coexistem; streaming nativo via `ReadableStream`/SSE (WebSocket é overkill para fluxo unidirecional).

### ADR-0004 — Zustand para estado global
**Decisão:** Zustand em vez de Redux/Context. **Razão:** zero boilerplate, ~1kb, compatível com Server Components; estado simples não justifica Redux.

### ADR-0005 — OpenRouter como gateway LLM (parcialmente superado pelo ADR-0006)
**Decisão:** OpenRouter como camada de abstração. **Razão:** uma key, um endpoint, streaming nativo, troca de modelo sem alterar código.
**Atualização:** mantido **apenas** para o caminho premium/BYOK (Claude). O host migrou para Gemini direto — ver ADR-0006.

### ADR-0006 — Host usa Gemini direto; OpenRouter só para premium/BYOK
**Contexto:** durante a validação da Fatia 1, os modelos `:free` do OpenRouter mostraram-se saturados e instáveis (HTTP 429 upstream, contas free tier compartilhadas). Isso é inaceitável para o demo público, onde o recrutador não pode bater num erro de rate-limit (conflito direto com o objetivo portfólio-primeiro).
**Decisão:** o **host** chama a API do **Google AI Studio (Gemini) diretamente** (`gemini-2.5-flash`), cujo free tier é mais generoso e estável. O **OpenRouter** fica reservado ao caminho **premium/BYOK** (Claude com a chave do visitante). Há dois adaptadores em `src/lib/llm/` (`gemini.ts` e `openrouter.ts`) com um parser SSE comum.
**Razão:** estabilidade do demo > pureza do gateway único. O free tier do Gemini entrega o "uau" sem custo nem 429.
**Consequência:** duas integrações de provedor em vez de uma; `GEMINI_API_KEY` passa a ser a chave obrigatória do host. O kill-switch/rate-limit (ADR-0002) ainda se aplica à rota.

### ADR-0007 — Interface principal é "A Nave" (corte FTL) + stream de eventos estruturados
**Contexto:** a cena de assinatura original era um grid de agentes + terminal grande. O autor redefiniu o conceito: uma **nave** onde cada agente vive num **módulo** e é visto "trabalhando", com a caixa de prompt pequena embaixo. Isso cria a tensão espetáculo × legibilidade do texto.
**Decisão:** a tela principal é uma **nave top-down (estilo FTL)**. **Um agente roda missão real por vez** (foco por clique no módulo); os demais ficam em **idle animado**. A resposta streama num **console docado** embaixo. A rota evolui de texto puro para um **stream de eventos estruturados** (`step`/`token`/`done`) para suportar **eventos de função reais** (ex.: a busca da ARIA). Supera a "cena de assinatura" antiga e os componentes `AgentGrid`/`AgentHologram` planejados.
**Razão:** o conceito de nave é um diferencial visual muito mais forte para portfólio; concorrência simulada (1 real + idle) entrega o "uau" sem rearquitetura; eventos estruturados permitem mostrar funções reais sem teatro falso.
**Atualização (arte):** a decisão inicial de "arte 100% CSS/SVG geométrico, sem sprites" foi **revertida** a pedido do autor: a nave passa a usar **arte 2D ilustrada chapada (estilo FTL), gerada por IA, em camadas modulares** (8 módulos = 5 agentes + 3 vagos + Ponte). A grade é montada por código a partir de peças atômicas; estados continuam em CSS. Trade-off aceito: mais produção de assets em troca do look 2D rico. Guia: `public/ship/ASSETS.md`.
**Consequência:** `useMission` (texto puro da Fatia 1) será envelopado pelo protocolo de eventos; componentes `ShipView`/`AgentModule`/`ShipFrame` (SVG = placeholder até os PNGs); referências visuais: `_mockups/ship-layouts.html` + `public/ship/ASSETS.md`.

### ADR-0008 — Camada tycoon é cenário (cosmética); dioramas vivos com agentes que caminham
**Contexto:** o autor trouxe referências visuais em vídeo (estilo "simulador de empresa de IA": `REVENUE`/`ORDERS`/`PRODUCTS LIVE`/`Day`/velocidade 2x–10x, cômodos-diorama ricos, personagens andando e trabalhando). Alvo de arte: a referência mais coesa e detalhada (img 3). Isso levanta duas tensões: (a) virar um **jogo de simulação** vs. manter o **hub de agentes** atual; (b) **agentes andando** vs. a ADR-0007 ("sem perambular / sprite único sem frames").
**Decisão:** **(A) A camada tycoon é puramente cosmética (set dressing).** A interação real continua sendo "Visitante digita → **1 agente roda missão LLM real** → streaming no console docado". `REVENUE`/`ORDERS`/`Day`/velocidade são **vida ambiente fake**, sem economia simulada por baixo. **(B) Dioramas vivos:** os agentes **caminham de verdade** (ciclo de caminhada em sprite sheet de **um único robô**, recolorido por `hue-rotate`); **partículas** fazem o trabalho pesado de "vida". Coreografia: focado caminha ao console + pose de trabalho + partículas intensas durante o stream; idle perambula em **rajadas ocasionais**; partículas sempre ligadas, intensificadas no foco.
**Razão:** regra de desempate do §1 (**portfólio vence**) — a Opção A entrega o "uau" visual da referência **sem rearquitetar** e mantém a IA real como a estrela (a Opção B — simulação real — canibalizaria a mensagem "a IA é de verdade" e seria um projeto de jogo de meses). O andar real foi mantido a pedido do autor por dar sensação de **nave habitada**, mas contido a **um robô** (custo de assets controlado) e com partículas carregando a leitura de "trabalhando".
**Consequência:** reverte as cláusulas "sem perambular por corredores" e "movimento por CSS sobre sprite único (sem frames)" da ADR-0007 (§10.1 atualizado). Custo extra: sprite sheet de caminhada (frames de **um** robô) + sistema de partículas.
**Resolução parcial (POC):** foi montado um protótipo **100% código** (`_mockups/ship-code-only.html`) para testar a Opção 1 (nave procedural neon/CSS). O autor **rejeitou** esse registro — escolheu o **look pintado/ilustrado da img 3**, em **vista top-down FTL** (olhando para dentro do cômodo, não elevação/diorama). Isso fecha a Pergunta de arte a favor de **assets pintados pré-renderizados** (Opção 3), não montagem procedural. O **robô do agente** já foi gerado como **sprite sheet pintado** (ciclo de caminhada, 8 frames / 2×4, vista 3/4 frontal, visor+peito ciano).
**Pipeline da nave (decidido):** a nave inteira é **um render coeso único** (gerado num prompt só, estilo img 3) — não arte montada por cômodo. Trade-off aceito: **layout congelado** (adicionar VEGA/ORACLE depois = regerar a nave) em troca de coerência visual máxima. As camadas interativas (robô, partículas, glow de foco, console) ficam **por cima via código**. Layout = **híbrido**: casco orgânico (proa/cockpit + naceles de motor) envolvendo um **miolo de salas em grade regular 4×2** — dá o "hero" da img 3 sem mapeamento irregular; o código ancora robô/hotspot por célula. Fundo = **transparente** ao redor do casco (starfield/nebulosa em **CSS animado**, partículas reforçáveis depois); o render traz só **casco + salas + ponte** com alpha. Cada sala é pintada na **cor do seu agente** (multicolor estilo img 3); os robôs recolorem por `hue-rotate` p/ casar. Prompt completo em `public/ship/ASSETS.md` (§ "Prompt da nave (render único)").
**HUD tycoon (decidido):** o HUD cosmético (Revenue/Orders/Day/velocidade) está **descartado por enquanto** — não entra no MVP. Pode voltar como enfeite depois.
**Estados do robô (decidido):** máquina de 3 estados por sprite — **idle** (`bot-idle.png`, parado), **walking** (`bot-walk` sheet, 2 ciclos de 4 frames: linha 0 anda ←, linha 1 anda →), **working** (`bot-working.png`, no console). O idle/working nascem virados p/ esquerda; direita = espelho CSS (`scaleX(-1)`). A caminhada usa arte direcional real (sem espelho).
**Movimento do sprite (decidido → revertido):** ~~opção 1 — frontal + espelho horizontal; sem 4-direcional~~. **Revertido:** com o movimento real em **2 eixos** dentro da sala, o sprite só-lateral lia errado no vertical (perfil deslizando pra cima/baixo). Agora **3-direcional: DOWN (de frente) / UP (de costas) / SIDE (perfil, espelhado p/ L↔R)**, **6 frames** por ciclo de caminhada, **+ idle e working também direcionais** (down/up/side). Gerado por IA em **2 sheets** (walk = 3×6; poses idle+working = 2×3), **referenciando o robô existente** p/ consistência. O código escolhe a linha pela direção do **eixo dominante** do movimento (|dx|>|dy| → SIDE + flip pelo sinal de dx; senão UP se dy<0, DOWN se dy>0). Prompts no `ASSETS.md`.
**Props de decoração das salas (em andamento):** equipamento e mobília são gerados por IA (ChatGPT/DALL·E) como **sprite sheets** e **fatiados por código** em props individuais com alpha → `public/ship/props/`. Pipeline: os sheets vêm em RGB com xadrez "transparente" achatado → remover o xadrez (flood-fill por borda) + slice 4×3 + trim no alpha. A 1ª leva saiu **isométrica/diagonal** e foi **rejeitada** (conflito de perspectiva: sala top-down + robô frontal + prop 3/4 = três ângulos brigando, e props diagonais não encostam na parede). Decisão: **regerar em vista FRONTAL/elevação** (props encostam na parede de fundo, casam com o ângulo do robô). Prompts (atlas + frontal) e pipeline detalhados no `ASSETS.md`. Recolor: props ficam **ciano**; o accent por agente vem do **glow ambiente da sala** (CSS), não de `hue-rotate` por prop. _Obs.: as props foram tiradas do mockup enquanto a leva frontal é regerada._

---

*Documento mantido por AFS Intelligence | Projeto: NEXUS HUB | Última consolidação: 2026-06-26*
