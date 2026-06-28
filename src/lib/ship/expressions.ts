/**
 * Expressões dos robôs (ADR-0013): glifo temático por `role` + emoji de Reação.
 * A bolha sobre o robô ("Bolha de expressão") renderiza emoji vendorizado do
 * Twemoji (assets em /public/emoji), para ficar igual em qualquer SO (ADR-0006:
 * estabilidade do demo > conveniência). Ver glossário §2 e §10.3.
 */

/** Eventos que disparam uma Reação efêmera (emoji na bolha). */
export type ReactionEvent =
  | "focus"
  | "missionStart"
  | "missionDone"
  | "missionError"
  | "levelUp";

/** Emoji por evento de Reação. */
export const REACTION_EMOJI: Record<ReactionEvent, string> = {
  focus: "👋",
  missionStart: "⚡",
  missionDone: "✅",
  missionError: "⚠️",
  levelUp: "🎉",
};

/** Sabores ocasionais de idle (além do glifo temático). */
export const IDLE_LOOK = "👀";
export const IDLE_DOZE = "😴";

/**
 * Glifo temático por palavra-chave no `role` (texto livre — ADR-0010). Cobre os
 * 5 Blueprints (cujos roles já contêm essas palavras) e agentes custom com a
 * MESMA lógica, sem mapa por slug. Primeiro match vence.
 */
const ROLE_GLYPHS: { kw: string[]; emoji: string }[] = [
  { kw: ["sql", "data", "dado", "banco", "query", "analy", "analis"], emoji: "🗄️" },
  { kw: ["research", "scout", "busca", "search", "web", "pesquis"], emoji: "🔍" },
  { kw: ["code", "dev", "program", "build", "forge", "engenh", "código", "codigo"], emoji: "💻" },
  { kw: ["report", "write", "redator", "copy", "escrit", "relat", "text"], emoji: "📝" },
  { kw: ["summar", "resum", "phantom", "síntese", "sintese", "tldr"], emoji: "📄" },
  { kw: ["design", "art", "visual", "ux", "ui"], emoji: "🎨" },
  { kw: ["forecast", "predict", "oracle", "trend", "futuro", "previs"], emoji: "📈" },
  { kw: ["chat", "assist", "support", "suporte", "ajuda"], emoji: "💬" },
  { kw: ["secur", "segur", "guard", "defen"], emoji: "🛡️" },
  { kw: ["math", "calc", "número", "numero", "estat"], emoji: "🧮" },
];

/** Pool de fallback p/ roles sem match — variado, escolhido de forma estável. */
const FALLBACK_GLYPHS = ["✨", "🤖", "⚙️", "🛰️", "📡", "💡", "🔧"];

/** Hash estável (string → inteiro) para escolher o fallback por agente. */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Glifo temático do agente. `role` casa por palavra-chave; sem match, escolhe um
 * fallback estável a partir do `seed` (slug) — agentes custom não ficam iguais.
 */
export function roleGlyph(role: string, seed: string): string {
  const r = role.toLowerCase();
  for (const g of ROLE_GLYPHS) {
    if (g.kw.some((k) => r.includes(k))) return g.emoji;
  }
  return FALLBACK_GLYPHS[hash(seed) % FALLBACK_GLYPHS.length];
}

// ===== Twemoji: emoji (codepoint) → arquivo SVG vendorizado =====
const CP_ZWJ = 0x200d; // junta sequências (família, profissões…)
const CP_VS16 = 0xfe0f; // seletor de variação "emoji" — Twemoji omite do nome

/**
 * URL do SVG vendorizado (Twemoji) para um emoji. Converte para codepoints hex
 * separados por '-' e remove o seletor VS16 (0xFE0F) — salvo em sequências ZWJ,
 * onde o Twemoji o mantém —, replicando o algoritmo de nome de arquivo dele.
 */
export function twemojiUrl(emoji: string): string {
  const cps = Array.from(emoji, (ch) => ch.codePointAt(0) ?? 0);
  const hasZwj = cps.includes(CP_ZWJ);
  const used = hasZwj ? cps : cps.filter((c) => c !== CP_VS16);
  return `/emoji/${used.map((c) => c.toString(16)).join("-")}.svg`;
}
