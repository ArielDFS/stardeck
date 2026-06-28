"use client";

import { useProfileStore } from "@/store/profileStore";
import { useHydrated } from "@/hooks/useHydrated";
import { levelForXp, nextLevel, levelProgress } from "@/lib/gamification/levels";

/** HUD de progressão no topo: nível, título e barra de XP (CLAUDE.md §9). */
export function TopHUD() {
  const hydrated = useHydrated();
  const xp = useProfileStore((s) => s.xp);

  // Antes da hidratação, mostra o estado-base (nível 1, 0 XP) — casa com o SSR.
  const shownXp = hydrated ? xp : 0;
  const level = levelForXp(shownXp);
  const next = nextLevel(shownXp);
  const progress = levelProgress(shownXp);

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <span className="font-display text-[10px] font-bold tracking-[0.14em] text-cyan">
          NÍV {level.level}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted">
          {level.title}
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-cyan shadow-glow-cyan transition-[width] duration-500 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        <span className="font-mono text-[9px] tabular-nums text-text-muted">
          {next ? `${shownXp}/${next.xpRequired}` : `${shownXp} XP`}
        </span>
      </div>
    </div>
  );
}
