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

- **Blueprint** — semente **imutável no código** de um agente (ex.: NEXUS, ARIA). Define os valores iniciais (nome, cor, system prompt, capacidades, modelo, identidade visual). Não é editável pelo ator; serve de ponto de partida e de "restaurar padrão". Os 5 presets do MVP são Blueprints.
  _Evite:_ preset (informal ok), template, receita.
- **Agente** — **instância viva** de um agente na nave do ator, semeada de um Blueprint e **editável** (nome, cor, tagline, system prompt, capacidades, modelo, cosméticos). Persistida no `localStorage` (copy-on-write: editar o Agente nunca altera o Blueprint). É o que ocupa uma célula da nave e roda Missões.
  _Evite:_ bot, assistente, persona, personagem (o Blueprint é a definição; o Agente é a instância).
- **Roster** — o conjunto de Agentes que o ator montou na nave (em `localStorage`). Semeado dos 5 Blueprints no primeiro load; editável até o teto de células do casco.
  _Evite:_ tripulação (ok informal), lista, time.
- **Capacidade** — habilidade de ferramenta que um Agente pode ter ligada (começa por **busca web**; ARIA = Blueprint com busca ligada). Distinta do system prompt (comportamento textual). Renderiza eventos de função visíveis no console (§10.1).
  _Evite:_ tool, skill, função (ambíguo).
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
- **5 agentes-semente (Blueprints):** NEXUS (SQL), ECHO (relatório), FORGE (código sem execução), PHANTOM (resumo) — puro-LLM — + **ARIA (busca web real via Tavily/Brave)**. A nave **nasce com eles montados** (ADR-0010).
- **Construtor de agentes (ADR-0010):** o ator edita/cria/apaga **Agentes** (instâncias no `localStorage`, semeadas dos Blueprints, copy-on-write) — nome, cor, `role` livre, system prompt, **capacidades** (busca web on/off) e **modelo** (host/premium). Casco = grade de **8 células** fixas, cor da sala por código. "Restaurar padrão" re-semeia. _(Puxado do backlog para o MVP.)_
- **Gamificação local:** XP + níveis visíveis; **todos os agentes sempre disponíveis** (a trava por nível foi removida). A **única recompensa de progressão são os cosméticos** (desbloqueados por nível/missões — ADR-0009).
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
// src/types/agent.ts  (shape-alvo pós-ADR-0010)

// Capacidades de ferramenta que um Agente pode ligar (extensível).
export type Capability = 'web_search'

// AgentConfig = shape compartilhado por Blueprint (semente imutável no código)
// e Agente (instância editável no localStorage). Ver glossário §2 + ADR-0010.
export interface AgentConfig {
  slug: string
  name: string
  role: string                // TEXTO LIVRE (ex.: 'SQL Analyst', 'Copywriter') — substitui o enum AgentClass; é só rótulo/badge (ADR-0010)
  tagline: string
  description: string
  avatarUrl: string
  accentColor: string         // cor da sala aplicada por código (glow CSS), não pintada no render do casco
  model: {
    host: string              // ex.: 'gemini-2.5-flash'
    premium?: string          // ex.: 'anthropic/claude-sonnet-4.6' (só via BYOK)
    prefer?: 'host' | 'premium' // premium sem BYOK → cai pro host com aviso
  }
  systemPrompt: string
  inputPlaceholder: string
  capabilities: Capability[]  // [] = puro-LLM; ['web_search'] = ex-ARIA. Substitui usesSearch (ADR-0010)
  xpReward: number
}

// Instância na nave do usuário (o "Agente" do glossário §2).
export interface AgentInstance extends AgentConfig {
  blueprintSlug: string | null   // de qual Blueprint foi semeado (null = criado do zero)
  cell: number                   // célula do casco (0..7)
  equippedCosmetic: string | null
}
```

### Tabela de agentes (MVP) — os 5 **Blueprints** (sementes imutáveis; ADR-0010)
> "Classe" abaixo é o `role` (texto livre) do Blueprint; o ator pode mudá-lo na instância.

| Slug | Nome | Role | Host (Gemini direto) | Premium (BYOK / OpenRouter) | XP | Unlock | Capacidade |
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
  xpReward: 100,
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
> A trava de agentes por nível (`unlockLevel`) foi **removida** — todos os agentes ficam sempre disponíveis. A progressão acontece via **cosméticos** (ADR-0009).

### Cálculo de XP
```typescript
// src/lib/gamification/xp.ts — baseXP do agente; +20 se durationMs < 3000;
// +50% se primeiro uso do agente. (Bônus de streak: backlog.)
```

### Créditos (cosméticos)
Custo por missão (apenas UI): PHANTOM 2, ARIA 3, NEXUS 4, FORGE 5, ECHO 6. Sem recarga real no MVP.

### Cosméticos do robô (ADR-0009)
Recompensas visuais (ex.: chapéus) **desbloqueadas por gamificação** — XP/nível/nº de missões, não compra nem seletor livre. São o vetor de variedade dos robôs (chassi único; ver ADR-0009).
- **Schema (`localStorage`, definido já na Fatia 3 — *cosmetic-aware*):** `unlockedCosmetics: string[]` (ids globais desbloqueados) + `equippedCosmetic: Record<agentSlug, cosmeticId | null>` (o que cada robô veste).
- **Regras de desbloqueio:** catálogo em `src/lib/ship/cosmetics.ts` (`{ level } | { missions }`), avaliado em `recordMission` (auto-unlock no level-up/missões); o `XPRewardToast` anuncia. É a **única trava de progressão** do projeto.
- **Render (feito):** 1 PNG por cosmético **por direção** em `public/ship/cosmetics/<id>-<dir>.png` (front/back/side, casando com `bot-pose-cut.png`). Camada `.ship-cosmetic` sobre o robô (`ShipRoom`, atualizada imperativamente pela direção + flip, recolorida pelo mesmo `--hue` do agente), overlay frontal no retrato do card e **seletor no editor** (desbloqueados clicáveis; travados em 🔒 com a regra). Calibração de encaixe em `COSMETIC_W_RATIO`/`COSMETIC_DY_RATIO` (`lib/ship/cosmetics.ts`). Cosméticos reais: headset, mask, antenna, hat, crown.

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
- **Seleção:** **clicar no módulo/robô** foca o agente (borda pulsante na cor dele) **e abre o card-inspetor** ancorado na sala (ver §10.2); o prompt passa a mirar nele. Fechar o card mantém o foco.
- **Saída:** **console docado embaixo** (sempre visível) onde o texto streama, com **prompt pequeno** abaixo. A nave fica sempre em cena.
- **"Executando funções":** mostrar **eventos de função reais onde existem** — o caso de ouro é a **ARIA** (passos da busca: `BUSCANDO → N fontes → sintetizando`). Agentes puro-LLM mostram só o estado "trabalhando" + texto (sem fases falsas).
- **Protocolo de stream:** a rota emite **eventos estruturados** (`step` = evento de função/ferramenta; `token` = delta de texto; `done` = fim), não texto puro. O streaming de texto da Fatia 1 vira a base, envelopada por esse protocolo.

> Mockup de referência (descartável): `_mockups/ship-layouts.html`.

### 10.2. Card do agente (inspetor/editor — porta de entrada do construtor)

Clicar no robô **foca + abre um card** ancorado na sala. Esse card **é o inspetor que expande pro editor** (não é componente separado do construtor da ADR-0010 — é o mesmo). Decisões:

- **Retrato:** **zoom do rosto do sprite existente** via CSS (`overflow-hidden` + `scale` + `object-position` na cabeça) — **sem asset novo** —, tingido na cor do agente com o mesmo filtro do módulo (`TINT[slug]` + `accentColor`). O **cosmético equipado** (ADR-0009) aparece no retrato.
- **Neon:** borda/glow no `accentColor` (mesmo padrão de `box-shadow` que o módulo já usa).
- **Campos editáveis (instância de Agente, copy-on-write no `localStorage` — ADR-0010):** `name` e `role` (texto livre) inline no card; o editor expandido cobre system prompt, **toggle de capacidade** (busca on/off), **seletor de modelo** (host/premium) e **color picker** da cor da sala.
- **Preview ao vivo:** digitar o nome atualiza a plaquinha sobre o módulo na hora; o color picker muda o **glow da sala em tempo real** (casa com a cor-por-código da ADR-0010).
- **Badges derivados (não digitados):** `BUSCA` (de `capabilities`), `GEMINI`/`CLAUDE` (do modelo), custo em créditos.
- **Stats de gamificação:** missões rodadas, XP gerado, último uso — do histórico `localStorage` (Fatia 3).
- **Ações:** **Restaurar padrão** (re-semeia do Blueprint, só se editado), **Apagar**, e célula vaga → **"+ Novo agente"** / **Duplicar**.
- **Escopo:** núcleo do card (retrato + nome/role + preview ao vivo + editor + restaurar/apagar/criar + stats) entra na **Fatia 3** (é o construtor ganhando rosto). Reações/polimento → Fatia 5 (ver backlog).

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

> **Estado atual (jun/2026):** Fatias 0–2 concluídas; **Fatia 3 em andamento**. O **port do mockup** `_mockups/ship-render.html` para o `ShipView` real **foi feito** (antecipado da Fatia 5 a pedido do autor): `SpaceBackground` + `ShipFX` (starfield/jatos/bob), nave em render único, `ShipRoom` (robô direcional com perambular/foco→trabalho/partículas/glow), e o **build mode** portado como **feature do usuário** (`ShipBuilder`/`RoomDecor` + props persistidos). Já no app: roster (ADR-0010), gamificação/XP (TopHUD/XPRewardToast), card do agente (§10.2), customização (props + zoom/espaço), e a **rota aceitando a config editada do cliente** (prompt/capacidade/modelo da instância valem no LLM; premium-sem-BYOK cai pro host com aviso — ADR-0010 #8). **Criar agente em célula vaga** funciona (clicar "+ AGENTE" → `createAgent` + card no editor; ciclo criar→editar→usar fechado; agentes custom são host-only por ora). **Trava por `unlockLevel` removida** (agentes sempre disponíveis); a única progressão são os **cosméticos** (catálogo + auto-unlock + **render** prontos: assets em `public/ship/cosmetics/`, overlay direcional no robô + retrato do card + seletor; falta só **calibração fina** do encaixe na cabeça). Falta na Fatia 3: casco neutro (ADR-0010) e calibração fina de coordenadas.

- **Fatia 0 — Esqueleto que roda:** ✅ Next.js 15 + TS + Tailwind + tokens.
- **Fatia 1 — Missão real ponta-a-ponta:** ✅ NEXUS → API Route proxy → Gemini streaming → terminal. *Risco técnico maior eliminado.*
- **Fatia 2 — A Nave (top-down/FTL) + 5 agentes:** ✅ `ShipView` com casco PNG (gerado por IA, recortado), 8 módulos (5 agentes + 3 vagos), **clicar-pra-focar**, console docado + prompt pequeno, **robôs** (idle/working, tingidos por agente via `hue-rotate`). Rota com **protocolo de eventos** (`step`/`token`/`done`/`error`). **ARIA + busca real (Tavily)** com passos visíveis. Ver §10.1.
  - _Pendência de polimento:_ módulos maiores/mais "cômodo" (limitado pela altura do convés — eventual casco com convés mais alto); afinar tints; assets `equip-*`.
- **Fatia 3 — Gamificação local + Construtor de agentes:** XP/níveis em `localStorage`, `TopHUD`, `XPRewardToast`, desbloqueio dos módulos vagos, level-up. **Nasce *cosmetic-aware*** (ADR-0009) e **roster/blueprint-aware** (ADR-0010): storage guarda `unlockedCosmetics[]` + o **Roster** (instâncias de Agente, copy-on-write dos 5 Blueprints). Inclui a **UI do construtor** (editar/criar/apagar Agente: nome, cor, `role`, prompt, capacidades, modelo) e o **refactor de casco** puxado da Fatia 5 (casco neutro de 8 células + cor da sala por código), que o construtor exige. Fatia grande por decisão consciente (inchaço aceito). ⬅️ **próxima**
- **Fatia 4 — Proteção + BYOK:** rate-limit por IP, kill-switch de orçamento, campo de BYOK opcional.
- **Fatia 5 — Polimento + deploy final:** responsividade, deploy Vercel, GIF/Loom. Inclui a **camada de cosméticos** (ADR-0009): render dos cosméticos sobre o robô via âncora por direção/frame, equipar/desequipar a partir do que está desbloqueado, e **estados/interações novos** (celebração no level-up, reação ao foco, micro-interação no clique/hover).

### Protótipo visual da nave — `_mockups/ship-render.html` (jun/2026)
Antes de portar pra componentes React, a cena foi prototipada em HTML/CSS/JS puro, validando: **render único** da nave como fundo (`ship-render.png`); módulos posicionados por % sobre as salas (caixas afináveis); **máquina de estados do robô** (idle/walk/working) com perambular em rajadas dentro da sala; **clique no robô** pra focar (glow seguindo a silhueta do sprite + nome flutuante acima dele); **glow neon ambiente por sala** (CSS `mix-blend-mode:screen`, cor do agente); console docado com streaming; e **canvas de FX** (starfield direita→esquerda com parallax + jatos dos propulsores). Mockups anteriores (descartáveis): `ship-code-only.html` (POC procedural rejeitado), `ship-topdown.html`. Esses aprendizados serão portados pro `ShipView` real na Fatia 5.

### Backlog de polimento de frontend/animação (alvo: Fatia 5)
- **Vida & movimento:** robô "respirando" no idle; nave flutuando (bob+sway) + parallax de mouse; flicker nos motores.
- **Cinematográfico:** spotlight no foco (escurece o resto da nave + micro-zoom/pan); entrada na carga (salas acendem em sequência).
- **Terminal/HUD:** dock estilo terminal de verdade (avatar do agente, chips de status, contador de tokens, scanlines, borda no accent); **XP toast + barra de XP** (puxa a Fatia 3).
- **Acabamento/engenharia:** `prefers-reduced-motion`; pausar FX com aba oculta; tooltip no hover do robô (nome/role/tagline); responsividade mobile; som sutil (opcional).
- **Card do agente (§10.2) — reações & extras:** **reação do robô ao abrir o card** (vira pra "câmera"/pose alerta/aceno — micro-estado novo, ADR-0009); **conector de mira** (traço sutil ligando o robô focado ao prompt); **exportar/importar agente como JSON** (encaixa no open-source §1; semente de futuro marketplace); navegação por teclado (Esc fecha, Enter salva, setas trocam de agente); som sutil ao abrir o card.

**Backlog (pós-MVP):** Supabase/Comandante/auth, histórico-no-banco, streak, VEGA, ORACLE/FastAPI, marketplace, missão em cadeia. _(custom agents foi promovido ao MVP — ADR-0010.)_

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
**Atualização (superado pela ADR-0010):** o "layout congelado com salas pintadas na cor do agente" **cai**. Como os agentes agora são customizáveis (cor/quantidade/função pelo ator), o casco passa a ser um **render único neutro/dessaturado com 8 células fixas**, e a **cor de cada sala é aplicada por código** (glow CSS), não pintada no render. O **render único** sobrevive (não viramos casco procedural — ver ADR-0010), mas perde a cor por sala. Atualizar o prompt no `ASSETS.md` para casco neutro.
**HUD tycoon (decidido):** o HUD cosmético (Revenue/Orders/Day/velocidade) está **descartado por enquanto** — não entra no MVP. Pode voltar como enfeite depois.
**Estados do robô (decidido):** máquina de 3 estados por sprite — **idle** (`bot-idle.png`, parado), **walking** (`bot-walk` sheet, 2 ciclos de 4 frames: linha 0 anda ←, linha 1 anda →), **working** (`bot-working.png`, no console). O idle/working nascem virados p/ esquerda; direita = espelho CSS (`scaleX(-1)`). A caminhada usa arte direcional real (sem espelho).
**Movimento do sprite (decidido → revertido):** ~~opção 1 — frontal + espelho horizontal; sem 4-direcional~~. **Revertido:** com o movimento real em **2 eixos** dentro da sala, o sprite só-lateral lia errado no vertical (perfil deslizando pra cima/baixo). Agora **3-direcional: DOWN (de frente) / UP (de costas) / SIDE (perfil, espelhado p/ L↔R)**, **6 frames** por ciclo de caminhada, **+ idle e working também direcionais** (down/up/side). Gerado por IA em **2 sheets** (walk = 3×6; poses idle+working = 2×3), **referenciando o robô existente** p/ consistência. O código escolhe a linha pela direção do **eixo dominante** do movimento (|dx|>|dy| → SIDE + flip pelo sinal de dx; senão UP se dy<0, DOWN se dy>0). Prompts no `ASSETS.md`.
**Props de decoração das salas (em andamento):** equipamento e mobília são gerados por IA (ChatGPT/DALL·E) como **sprite sheets** e **fatiados por código** em props individuais com alpha → `public/ship/props/`. Pipeline: os sheets vêm em RGB com xadrez "transparente" achatado → remover o xadrez (flood-fill por borda) + slice 4×3 + trim no alpha. A 1ª leva saiu **isométrica/diagonal** e foi **rejeitada** (conflito de perspectiva: sala top-down + robô frontal + prop 3/4 = três ângulos brigando, e props diagonais não encostam na parede). Decisão: **regerar em vista FRONTAL/elevação** (props encostam na parede de fundo, casam com o ângulo do robô). Prompts (atlas + frontal) e pipeline detalhados no `ASSETS.md`. Recolor: props ficam **ciano**; o accent por agente vem do **glow ambiente da sala** (CSS), não de `hue-rotate` por prop.
**Atualização (resolvido):** a **leva frontal foi gerada e validada** (13 props em `public/ship/props/*.png`, elevação/frontal, ciano, alpha) e está **em uso no app**. O antigo "build mode" do mockup (autoria de props) foi **portado como feature do usuário** (não dev-only) — ver ADR-0010 (build mode).

---

### ADR-0009 — Granularidade por robô via cosméticos desbloqueáveis (set dressing gamificado)
**Contexto:** o autor quer a nave mais "viva" — mais granularidade por robô, **cosméticos** (ex.: chapéus), mais **estados e interações**. Isso reabre as ADR-0007/0008, que fixaram deliberadamente "um único robô recolorido por `hue-rotate`, variedade só por cor" para conter custo de assets.
**Decisão:**
- **(A) Identidade por chassi único + camada de cosméticos.** Mantém-se **um robô base** (sem arte própria por agente); a variedade visual passa a vir de **cosméticos sobrepostos** + glow da sala, não de `hue-rotate`/arte por agente. Reverte a cláusula "variedade só por cor" das ADR-0007/0008 (rejeitadas as alternativas "robô distinto por agente" e "híbrido por classe" por custo de arte).
- **(B) Cosméticos são recompensa de gamificação.** Desbloqueados por XP/nível/nº de missões — **não** há loja por créditos nem seletor livre. Estende a Fatia 3 (dá à progressão um motivo de continuar que o XP sozinho não tem).
- **(C) Cronograma: implementação visual/interativa na Fatia 5 (polimento)**, mas a **Fatia 3 nasce *cosmetic-aware*** — o schema de `localStorage` já guarda `unlockedCosmetics[]` + `equippedCosmetic` (por agente) e as regras de desbloqueio são definidas junto com o XP. Evita migração de dados depois.
- **(D) Técnico — cosmético como camada com âncora, nunca assado no sprite.** Cada cosmético é uma camada renderizada por cima do robô, posicionada por um **JSON de âncora de cabeça por direção (down/up/side) e por frame** do ciclo. Permite N cosméticos × 1 chassi sem explosão combinatória. Pipeline: gerar cosméticos por IA com âncora consistente → slice → JSON de offsets.
- **(E) Mais estados/interações.** Ampliar a máquina de estados do robô além de idle/walk/working: ex. **celebração no level-up**, reação ao foco, micro-interação no clique/hover. (Detalhamento dos estados fica na Fatia 5.)
**Razão:** regra de desempate do §1 (**portfólio vence**) — cosméticos entregam "vivo" + gancho de progressão **sem** multiplicar arte por agente nem virar um editor de personagem (que seria projeto à parte e canibalizaria o foco na IA real).
**Consequência:** o custo de assets passa a ser **por cosmético** (não por robô); é preciso um pipeline de geração de cosméticos com âncora + slicer + JSON de offsets; a Fatia 3 ganha campos de cosmético no storage; ADR-0007/0008 atualizadas na cláusula de "variedade".

### ADR-0010 — Agentes customizáveis pelo ator (construtor completo) sobre grade fixa
**Contexto:** a premissa do projeto é que cada pessoa monte agentes que atendam à **sua** necessidade ("nem todo mundo precisa de um especialista em SQL"). Hoje os agentes são fixos: nome/cor/quadrante/função fixos, definidos como módulos estáticos em `src/agents/`. "custom agents" estava no backlog pós-MVP; esta ADR **promove ao MVP**.
**Decisão (8 pontos, decididos numa grelha):**
1. **Construtor completo** — o ator pode **criar, editar e apagar** agentes (não só recolorir/renomear). Rejeitadas: "reconfigurar slots", "roster por catálogo", "só cosmético".
2. **Nave nasce com os 5 presets montados**, customização **opt-in** — protege o tempo-até-uau do Visitante (§1). Rejeitada a nave em branco.
3. **Grade de slots fixos (8 células), não layout procedural** — o casco continua sendo **um render único**, mas **neutro**, com a **cor da sala aplicada por código** (glow CSS, casa com ADR-0009). Salva a parte cara da ADR-0007/0008 e evita o casco procedural já reprovado (`ship-code-only.html`). Teto de agentes = nº de células (8).
4. **Função = system prompt + capacidades + modelo.** Capacidade inicial: **busca web (on/off)** — transforma o diferencial da ARIA num bloco reutilizável (eventos de função visíveis no §10.1). Modelo escolhível por agente (host/premium).
5. **Copy-on-write + distinção Blueprint/Agente** (glossário §2 atualizado): **Blueprint** = semente imutável no código; **Agente** = instância editável no `localStorage`, semeada do Blueprint; "restaurar padrão" re-semeia. Mantém ADR-0001 (client-only).
6. **`AgentClass` (enum de 5) → `role` (texto livre + sugestões).** O `class` não tinha lógica atrelada (confirmado no código: só `usesSearch` dirige comportamento), então a troca é barata e abre a customização no ponto-chave.
7. **Tudo na Fatia 3** — gamificação + roster + construtor + refactor de casco juntos. Consequência aceita conscientemente: a Fatia 3 incha e **puxa o refactor de casco** (neutro + cor por código) da Fatia 5 pra frente.
8. **Agentes custom rodam na key do host**, protegidos pelos guards da Fatia 4 (rate-limit + kill-switch; busca consome cota Tavily do host). Sem exigir BYOK — menos fricção; os presets preservam a identidade. Defaults: premium sem BYOK → cai pro host com aviso; nave pode ficar vazia; "restaurar padrão" traz os Blueprints de volta.
**Razão:** regra de desempate do §1 (**portfólio vence**) — um construtor funcional é um diferencial forte ("monte sua tripulação de IA") **sem** virar casco procedural nem editor de personagem pesado. A grade fixa + cor-por-código entrega liberdade de função/identidade mantendo o "hero" visual coeso.
**Consequência:** supera o "layout congelado / salas pintadas" da ADR-0008 (casco vira neutro; cor por código); `usesSearch` → `capabilities[]`; `AgentClass` → `role`; `AgentInstance` (instância) entra ao lado de `AgentConfig`; `src/agents/` vira **seeds (Blueprints)** + um store de runtime do Roster; o storage da Fatia 3 precisa ser roster/blueprint-aware desde o início; regerar o casco neutro no `ASSETS.md`. Risco conhecido: Fatia 3 grande.
**Atualização (build mode = feature do usuário):** o autor decidiu que a **customização da nave** inclui **decorar as salas com props** (mobília/equipamento). O antigo "build mode" do mockup (autoria de props com paleta + arrastar/soltar + snap na grade, ligado por tecla-E dev) foi **portado como feature do usuário final** — toggle "CUSTOMIZAR NAVE" no HUD. Os props são **persistidos por célula** no `localStorage` (`roomProps: Record<cell, PropPlacement[]>` no roster store). Cobre salas de agente **e** células vagas. Componentes: `ShipBuilder` (paleta + drag/drop/snap), `RoomDecor` (grid + props por sala). Catálogo em `src/lib/ship/props.ts`.
**Zoom/espaço da nave:** controle "espaço" (−/+) no HUD que **encolhe robôs e props** (`shipZoom` persistido no roster store; `scale = 1/shipZoom`). Como a nave já é limitada pela altura da tela, "esticar a nave" transbordaria — então a impressão de "mais espaço" vem de encolher os sprites, mantendo a nave encaixada. Não-destrutivo (o `w` dos props é base; o zoom é só multiplicador de exibição). Robô escala via wrapper `.ship-bot-wrap` (não conflita com flip/breathe).

---

*Documento mantido por AFS Intelligence | Projeto: NEXUS HUB | Última consolidação: 2026-06-27*
