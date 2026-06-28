/** Tabela de níveis (CLAUDE.md §9). Thresholds de XP acumulado. */
export const LEVELS = [
  { level: 1, title: "Recruta", xpRequired: 0 },
  { level: 2, title: "Operativo", xpRequired: 300 },
  { level: 3, title: "Especialista", xpRequired: 800 },
  { level: 4, title: "Agente", xpRequired: 1800 },
  { level: 5, title: "Comandante", xpRequired: 3500 },
  { level: 6, title: "Arquiteto", xpRequired: 6000 },
] as const;

export type LevelInfo = (typeof LEVELS)[number];

/** Nível atual para um total de XP acumulado. */
export function levelForXp(xp: number): LevelInfo {
  let current: LevelInfo = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.xpRequired) current = lvl;
    else break;
  }
  return current;
}

/** Próximo nível (ou null se já está no topo). */
export function nextLevel(xp: number): LevelInfo | null {
  return LEVELS.find((l) => l.xpRequired > xp) ?? null;
}

/**
 * Progresso (0..1) dentro do nível atual rumo ao próximo.
 * Retorna 1 quando no nível máximo.
 */
export function levelProgress(xp: number): number {
  const current = levelForXp(xp);
  const next = nextLevel(xp);
  if (!next) return 1;
  const span = next.xpRequired - current.xpRequired;
  if (span <= 0) return 1;
  return Math.min(1, Math.max(0, (xp - current.xpRequired) / span));
}
