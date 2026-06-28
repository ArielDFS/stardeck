"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AgentConfig } from "@/types/agent";
import { computeXp } from "@/lib/gamification/xp";
import { levelForXp } from "@/lib/gamification/levels";
import { COSMETICS, cosmeticsUnlockedFor } from "@/lib/ship/cosmetics";

interface AgentStat {
  /** Missões concluídas com este agente. */
  missions: number;
  /** Timestamp (ms) do último uso. */
  lastUsedAt: number | null;
}

/** Resultado de registrar uma missão — alimenta o XPRewardToast e o level-up. */
export interface MissionReward {
  gained: number;
  totalXp: number;
  leveledUp: boolean;
  newLevel: number;
  /** Cosméticos recém-desbloqueados nesta missão (ADR-0009). */
  unlockedCosmetics: string[];
}

interface ProfileState {
  /** XP acumulado do ator. */
  xp: number;
  /** Estatísticas por slug de agente. */
  agentStats: Record<string, AgentStat>;
  /** Cosméticos desbloqueados (ADR-0009 — storage cosmetic-aware desde a Fatia 3). */
  unlockedCosmetics: string[];

  /** Registra uma missão concluída, concede XP e retorna o resultado. */
  recordMission: (agent: AgentConfig, durationMs: number) => MissionReward;
  /** DEV: destrava todos os cosméticos (para calibração). */
  unlockAllCosmetics: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      xp: 0,
      agentStats: {},
      unlockedCosmetics: [],

      recordMission: (agent, durationMs) => {
        const { xp, agentStats, unlockedCosmetics } = get();
        const prev = agentStats[agent.slug];
        const isFirstUse = !prev || prev.missions === 0;

        const gained = computeXp(agent, durationMs, isFirstUse);
        const totalXp = xp + gained;

        const leveledUp = levelForXp(totalXp).level > levelForXp(xp).level;
        const newLevel = levelForXp(totalXp).level;

        // total de missões após esta (todas as células) — gate de cosméticos.
        const totalMissions =
          Object.values(agentStats).reduce((s, a) => s + a.missions, 0) + 1;
        const newlyUnlocked = cosmeticsUnlockedFor(newLevel, totalMissions).filter(
          (id) => !unlockedCosmetics.includes(id),
        );

        set({
          xp: totalXp,
          agentStats: {
            ...agentStats,
            [agent.slug]: {
              missions: (prev?.missions ?? 0) + 1,
              lastUsedAt: Date.now(),
            },
          },
          unlockedCosmetics: newlyUnlocked.length
            ? [...unlockedCosmetics, ...newlyUnlocked]
            : unlockedCosmetics,
        });

        return {
          gained,
          totalXp,
          leveledUp,
          newLevel,
          unlockedCosmetics: newlyUnlocked,
        };
      },

      unlockAllCosmetics: () =>
        set({ unlockedCosmetics: COSMETICS.map((c) => c.id) }),
    }),
    {
      name: "nexus-profile",
      version: 1,
    },
  ),
);
