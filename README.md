# 🛸 STARDECK

> **Monte sua tripulação de agentes de IA e lance missões reais — numa nave-mãe sci-fi, com streaming ao vivo.**

**Gamified AI Agent Crew** · por Ariel Ferreira (AFS Intelligence) · `Next.js 15` · `TypeScript`

<!-- 🔗 Demo ao vivo: https://stardeck.vercel.app  (atualize após o deploy) -->
> 🔗 **Demo ao vivo:** _link adicionado após o deploy na Vercel_

<!-- 📸 Adicione um GIF/screenshot da nave aqui: ![STARDECK](docs/demo.gif) -->

---

## ✨ O que é

STARDECK apresenta agentes de IA como **personagens de uma nave** (vista top-down, estilo _FTL_). Cada agente vive num módulo e executa um tipo de missão com um **LLM real**, em **streaming**. Você monta a sua tripulação, lança tarefas e vê cada robô trabalhando no seu módulo.

É um projeto de portfólio focado em **AI Engineering + Full-Stack + UX**.

## 🎮 Destaques

- **5 agentes em streaming** — cada um com um system prompt especializado; a resposta aparece token a token num console docado.
- **Busca web real (ARIA)** — pesquisa na web (Tavily) com os **passos de busca visíveis** antes da resposta — sem alucinar fatos atuais.
- **Monte sua tripulação** — crie, edite e apague agentes (nome, cor, função, prompt, capacidades e modelo). Os 5 presets são só o ponto de partida.
- **Gamificação local** — XP, níveis e progressão por missão, tudo em `localStorage` (sem login).
- **Nave viva** — robôs caminham, perambulam e **reagem com emoji** ao foco, ao level-up e ao fim de missão; locomoção fluida por loop `requestAnimationFrame` + sombra de contato.
- **BYOK opcional** — cole sua chave para destravar modelos premium (Claude). O host roda em tier grátis (Gemini).
- **Proteção de custo** — rate-limit por IP + kill-switch de orçamento no servidor.
- **Responsivo** e com `prefers-reduced-motion`.

## 🤖 Agentes

| Agente | Classe | O que faz | Ferramenta |
|--------|--------|-----------|------------|
| **NEXUS** | SQL Analyst | Linguagem natural → queries SQL precisas e comentadas | — |
| **ARIA** | Research Scout | Pesquisa na web em tempo real e sintetiza com fontes citadas | 🔍 busca (Tavily) |
| **ECHO** | Report Writer | Relatórios, e-mails e documentos profissionais | — |
| **FORGE** | Code Builder | Gera código limpo e explicado (sem execução) | — |
| **PHANTOM** | Summarizer | Condensa textos longos em resumos com pontos-chave | — |

> A nave nasce com os 5 montados; 3 módulos ficam **vagos** para você criar os seus.

## 🛠️ Stack

- **Next.js 15** (App Router) · **TypeScript** · **Tailwind CSS** · **Framer Motion** · **Zustand**
- **LLMs:** Google Gemini (host, free tier) via API direta · Claude via **OpenRouter** (BYOK, opcional)
- **Busca:** Tavily · **Streaming:** `ReadableStream` + eventos **NDJSON** (`step`/`token`/`done`/`error`) · **Deploy:** Vercel

## 🧠 Como funciona

```
Visitante → console → POST /api/agents/[slug]/run
                          │  rate-limit por IP → kill-switch de orçamento
                          │  resolve { modelo, systemPrompt, capacidades }
                          │  (ARIA: + ferramenta de busca web)
                          ▼
                 LLM com stream → eventos NDJSON (step/token/done/error)
                          ▼
            console renderiza os tokens conforme chegam (sem delay)
```

Todo o estado de jogo (XP, nível, tripulação, customização) vive no **`localStorage`** — sem backend de dados, sem login. O único server-side é a API Route que faz proxy do LLM, com os guards de custo. O **host** usa Gemini direto (estável e grátis); **premium** (Claude) só com a chave do próprio visitante (BYOK).

## 🚀 Rodando localmente

```bash
git clone <repo>
cd stardeck
npm install
cp .env.local.example .env.local   # preencha as chaves
npm run dev                        # http://localhost:3000
```

### Variáveis de ambiente

| Variável | Obrigatória? | Para quê |
|----------|--------------|----------|
| `GEMINI_API_KEY` | ✅ sim | Host dos agentes — crie grátis em [aistudio.google.com](https://aistudio.google.com/apikey) |
| `TAVILY_API_KEY` | recomendada | Busca web da ARIA — grátis em [tavily.com](https://app.tavily.com/) |
| `OPENROUTER_API_KEY` | opcional | Modelos premium (Claude) via BYOK |
| `DAILY_BUDGET_USD` | opcional | Kill-switch de orçamento diário do host (ausente = sem teto) |
| `RATE_LIMIT_PER_IP` | opcional | Missões por IP por janela de 60s (default 10) |

## 📄 Licença

MIT.

---

<sub>Projeto: STARDECK · AFS Intelligence</sub>
