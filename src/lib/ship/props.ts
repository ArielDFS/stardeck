/**
 * Catálogo de props (mobília/equipamento) e helpers do modo de customização
 * da nave (ADR-0010). Portado de _mockups/ship-render.html — agora feature do
 * usuário, não ferramenta de dev. Assets frontais em /ship/props/*.png.
 */

/** Um prop colocado numa sala: posição em % da sala, largura em px. */
export interface PropPlacement {
  id: string;
  f: string; // nome do asset (sem .png)
  x: number; // % da largura da sala
  y: number; // % da altura da sala
  w: number; // largura em px
}

export const PROPS_LIST = [
  "antenna", "archive-console", "charging-pod", "control-terminal",
  "fabricator", "holo-desk", "lockers", "pipes-vent", "plant",
  "radar-dish", "reactor-core", "server-rack", "supply-crates",
] as const;

/** Largura padrão (px) por prop — footprint coerente (planta pequena, lockers grande). */
export const PROP_SIZE: Record<string, number> = {
  plant: 24, "charging-pod": 32, antenna: 38, "server-rack": 42,
  "archive-console": 42, "reactor-core": 44, fabricator: 44, "pipes-vent": 46,
  "radar-dish": 46, "supply-crates": 50, "control-terminal": 50,
  "holo-desk": 52, lockers: 56,
};
export const PROP_W = 48; // fallback

/** Grade de snap por sala (ajuste p/ alinhar ao piso). */
export const GRID_COLS = 8;
export const GRID_ROWS = 6;

export const PROPS_PATH = "/ship/props/";

export function propWidth(f: string): number {
  return PROP_SIZE[f] ?? PROP_W;
}

/** Snap de um valor 0..100 para o centro da célula da grade (n divisões). */
export function snap(v: number, n: number): number {
  const cell = 100 / n;
  let i = Math.round(v / cell - 0.5);
  i = Math.max(0, Math.min(n - 1, i));
  return +((i + 0.5) * cell).toFixed(1);
}

export function newPropId(): string {
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
