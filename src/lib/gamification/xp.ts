import type { AgentConfig } from "@/types/agent";

/** Bônus de missão rápida (durationMs abaixo deste limite). */
const FAST_MISSION_MS = 3000;
const FAST_MISSION_BONUS = 20;
/** Multiplicador no primeiro uso de um agente. */
const FIRST_USE_MULTIPLIER = 1.5;

/**
 * XP de uma missão concluída (CLAUDE.md §9):
 * baseXP do agente; +20 se durationMs < 3000; +50% se primeiro uso do agente.
 * (Bônus de streak: backlog.)
 */
export function computeXp(
  agent: AgentConfig,
  durationMs: number,
  isFirstUse: boolean,
): number {
  let xp = agent.xpReward;
  if (durationMs > 0 && durationMs < FAST_MISSION_MS) xp += FAST_MISSION_BONUS;
  if (isFirstUse) xp = Math.round(xp * FIRST_USE_MULTIPLIER);
  return xp;
}
