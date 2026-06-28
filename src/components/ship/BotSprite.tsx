"use client";

import type { CSSProperties } from "react";
import { spriteFilter } from "@/lib/ship/recolor";

/**
 * Renderiza um frame do robô a partir do sheet `bot-pose-cut.png` (3×2, alpha):
 *   colunas = direção (0 frente / 1 costas / 2 perfil)
 *   linhas  = pose (0 idle / 1 working)
 * Usa a versão "-cut" (xadrez removido + transparente). Fatiado por
 * background-position (sem asset individual). Recolor por código (ADR-0009/0010).
 */
export type BotPose = "idle" | "working";

const SHEET = "/ship/bot-pose-cut.png";

const FRAME: Record<BotPose, { col: number; row: number }> = {
  idle: { col: 0, row: 0 }, // frente, parado
  working: { col: 0, row: 1 }, // frente, trabalhando
};

const COLS = 3;
const ROWS = 2;

interface BotSpriteProps {
  pose?: BotPose;
  accent: string;
  className?: string;
  style?: CSSProperties;
}

export function BotSprite({
  pose = "idle",
  accent,
  className = "",
  style,
}: BotSpriteProps) {
  const f = FRAME[pose];
  return (
    <div
      className={className}
      style={{
        backgroundImage: `url(${SHEET})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: `${COLS * 100}% ${ROWS * 100}%`,
        backgroundPosition: `${(f.col / (COLS - 1)) * 100}% ${(f.row / (ROWS - 1)) * 100}%`,
        filter: `${spriteFilter(accent)} drop-shadow(0 0 5px ${accent}66)`,
        ...style,
      }}
    />
  );
}
