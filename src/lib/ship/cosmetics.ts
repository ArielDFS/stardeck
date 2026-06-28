/**
 * Catálogo de cosméticos do robô (ADR-0009). Recompensas visuais (chapéus/itens
 * de cabeça) — a **única trava de progressão** do projeto. Desbloqueio por
 * nível/nº de missões.
 *
 * Assets em `public/ship/cosmetics/<id>-<dir>.png` (alpha real), 1 PNG por
 * direção. Direções casam com `bot-pose-cut.png`: front (down) / back (up) / side.
 */
import type { BotDir } from "./rooms";

export type CosmeticUnlock = { level: number } | { missions: number };
export type CosmeticDir = "front" | "back" | "side";

export interface Cosmetic {
  id: string;
  name: string;
  unlock: CosmeticUnlock;
}

export const COSMETICS: Cosmetic[] = [
  { id: "headset", name: "Headset Tático", unlock: { level: 2 } },
  { id: "mask", name: "Máscara de Combate", unlock: { missions: 5 } },
  { id: "antenna", name: "Antena Relay", unlock: { level: 3 } },
  { id: "hat", name: "Boné de Capitão", unlock: { level: 4 } },
  { id: "crown", name: "Coroa do Arquiteto", unlock: { level: 6 } },
];

export const COSMETICS_PATH = "/ship/cosmetics/";

// Calibração do encaixe na cabeça do ROBÔ (relativo ao CELL) — afinar olhando.
export const COSMETIC_W_RATIO = 0.5; // largura do cosmético / CELL
export const COSMETIC_DY_RATIO = -0.08; // deslocamento vertical (negativo = sobe)
export const COSMETIC_DX_RATIO = 0; // deslocamento horizontal (negativo = esquerda)

// Calibração do cosmético no RETRATO do card (enquadramento diferente: cabeça+peito).
export const COSMETIC_PORTRAIT_W = "34%"; // largura relativa à caixa do retrato
export const COSMETIC_PORTRAIT_TOP = "28%"; // centro vertical na caixa (menor = mais alto)
export const COSMETIC_PORTRAIT_LEFT = "54%"; // centro horizontal na caixa (menor = esquerda)

const BY_ID = new Map(COSMETICS.map((c) => [c.id, c]));

export function cosmeticName(id: string): string {
  return BY_ID.get(id)?.name ?? id;
}

/** Caminho do PNG de um cosmético numa direção. */
export function cosmeticSrc(id: string, dir: CosmeticDir): string {
  return `${COSMETICS_PATH}${id}-${dir}.png`;
}

/** Direção do robô (down/up/side) → sufixo do arquivo do cosmético. */
export function dirToCosmetic(dir: BotDir): CosmeticDir {
  return dir === "up" ? "back" : dir === "side" ? "side" : "front";
}

/** IDs que deveriam estar desbloqueados para um nível + total de missões. */
export function cosmeticsUnlockedFor(
  level: number,
  totalMissions: number,
): string[] {
  return COSMETICS.filter((c) =>
    "level" in c.unlock
      ? level >= c.unlock.level
      : totalMissions >= c.unlock.missions,
  ).map((c) => c.id);
}

/** Texto curto da regra de desbloqueio (para o card). */
export function cosmeticUnlockLabel(c: Cosmetic): string {
  return "level" in c.unlock
    ? `Nível ${c.unlock.level}`
    : `${c.unlock.missions} missões`;
}
