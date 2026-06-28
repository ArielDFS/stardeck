/**
 * Geometria da nave (portada de _mockups/ship-render.html).
 * Caixas das salas em % do render `ship-render.png` (aspect 1536/1024).
 * O índice = célula do Roster (ADR-0010): 0..4 = salas de agente, 5..7 = vagas.
 */

export interface RoomBox {
  l: number;
  t: number;
  w: number;
  h: number;
}

export interface WorkSpot {
  x: number;
  y: number;
  dir: BotDir;
}

export type BotDir = "down" | "up" | "side";

export interface RoomDef {
  box: RoomBox;
  /** Onde o robô fica ao ser focado (caminha até aqui e trabalha). */
  work: WorkSpot;
}

/** 8 células. As 5 primeiras casam com SEED_LAYOUT [nexus,aria,echo,forge,phantom]. */
export const ROOMS: RoomDef[] = [
  { box: { l: 31, t: 17.5, w: 11, h: 14.5 }, work: { x: 60, y: 33, dir: "up" } }, // 0 NEXUS
  { box: { l: 44, t: 20, w: 9, h: 13 }, work: { x: 50, y: 22, dir: "up" } }, // 1 ARIA
  { box: { l: 55, t: 20, w: 9, h: 13 }, work: { x: 45, y: 25, dir: "up" } }, // 2 ECHO
  { box: { l: 31, t: 54, w: 10, h: 12 }, work: { x: 11, y: 17, dir: "up" } }, // 3 FORGE
  { box: { l: 43, t: 54, w: 10, h: 12 }, work: { x: 25, y: 15, dir: "up" } }, // 4 PHANTOM
  { box: { l: 29, t: 38, w: 12, h: 11 }, work: { x: 50, y: 28, dir: "up" } }, // 5 vaga
  { box: { l: 44, t: 38, w: 20, h: 11 }, work: { x: 50, y: 28, dir: "up" } }, // 6 vaga
  { box: { l: 55, t: 54, w: 9, h: 11 }, work: { x: 50, y: 28, dir: "up" } }, // 7 vaga
];

/** Razão de aspecto do render, para as % das salas baterem. */
export const SHIP_ASPECT = "1536 / 1024";

// ===== constantes do sprite direcional (verbatim do mockup) =====
export const CELL = 40; // escala de exibição (px) — menor = robô menor
export const POSE_CELL = Math.round(CELL * 1.116); // poses preenchem menos a célula
export const WALK_COLS = 6;
export const WALK_ROWS = 3;
export const POSE_COLS = 3;
export const POSE_ROWS = 2;
export const WALK_FRAMES = 6;
export const DIRIDX: Record<BotDir, number> = { down: 0, up: 1, side: 2 };
export const WALK_SPEED = 0.04; // %-do-módulo por ms
export const FRAME_MS = 90;
export const MIN_DUR = 600;

export const WALK_SHEET = "/ship/bot-walk-cut.png";
export const POSE_SHEET = "/ship/bot-pose-cut.png";

/** Posições dos propulsores em % do render (para os jatos do FX). */
export const THRUSTERS = [
  { x: 10, y: 15 },
  { x: 7, y: 71 },
];
