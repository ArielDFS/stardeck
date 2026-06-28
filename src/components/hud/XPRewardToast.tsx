"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { MissionReward } from "@/store/profileStore";
import { cosmeticName } from "@/lib/ship/cosmetics";

/** Recompensa a exibir; `id` (timestamp) força reanimar a cada missão. */
export type ToastReward = MissionReward & { id: number };

interface XPRewardToastProps {
  reward: ToastReward | null;
  onDone: () => void;
}

/** Toast "+XP" (e level-up) que sobe e some ao concluir uma missão (§9, §10). */
export function XPRewardToast({ reward, onDone }: XPRewardToastProps) {
  const hasCosmetic = (reward?.unlockedCosmetics?.length ?? 0) > 0;

  useEffect(() => {
    if (!reward) return;
    const longer = reward.leveledUp || hasCosmetic;
    const t = setTimeout(onDone, longer ? 3400 : 2400);
    return () => clearTimeout(t);
  }, [reward, onDone, hasCosmetic]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
      <AnimatePresence>
        {reward && (
          <motion.div
            key={reward.id}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -24, scale: 0.95 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="flex flex-col items-center gap-1"
          >
            <span className="rounded-full border border-cyan/60 bg-void/90 px-4 py-1.5 font-display text-sm font-bold tracking-[0.12em] text-cyan shadow-glow-cyan">
              +{reward.gained} XP
            </span>
            {reward.leveledUp && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.25, type: "spring", stiffness: 300 }}
                className="rounded-full border border-gold/70 bg-void/90 px-3 py-1 font-display text-[11px] font-bold tracking-[0.16em] text-gold shadow-glow-gold"
              >
                NÍVEL {reward.newLevel} ALCANÇADO
              </motion.span>
            )}
            {hasCosmetic &&
              reward.unlockedCosmetics.map((id, i) => (
                <motion.span
                  key={id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.35 + i * 0.12, type: "spring", stiffness: 300 }}
                  className="rounded-full border border-violet/70 bg-void/90 px-3 py-1 font-display text-[10px] font-bold tracking-[0.14em] text-violet shadow-glow-violet"
                >
                  COSMÉTICO: {cosmeticName(id).toUpperCase()}
                </motion.span>
              ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
