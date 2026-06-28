/**
 * Recolor do robô uniforme por código (ADR-0009/0010).
 *
 * O sprite base é ciano (#00F5FF ≈ hue 182°, saturação ~100%). Para tingir o
 * robô na cor de um agente, derivamos um filtro CSS a partir do accentColor —
 * assim funciona para os 5 Blueprints E para agentes criados do zero, sem mapa
 * fixo nem regenerar arte por agente.
 */

const BASE_HUE = 182; // hue do ciano do sprite

interface Hsl {
  h: number;
  s: number; // 0..100
  l: number; // 0..100
}

export function hexToHsl(hex: string): Hsl {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;

  let hue = 0;
  let sat = 0;
  if (d !== 0) {
    sat = d / (1 - Math.abs(2 * l - 1));
    switch (max) {
      case r:
        hue = ((g - b) / d) % 6;
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return { h: hue, s: sat * 100, l: l * 100 };
}

/** Graus de hue-rotate do ciano-base para o accent (caminho mais curto). */
export function hueRotateDeg(accentColor: string): number {
  const { h } = hexToHsl(accentColor);
  let rotate = Math.round(h - BASE_HUE);
  if (rotate > 180) rotate -= 360;
  if (rotate < -180) rotate += 360;
  return rotate;
}

/**
 * Filtro CSS que tinge o sprite ciano para o accent do agente.
 * Mantém a luminância do sprite; ajusta matiz e saturação.
 */
export function spriteFilter(accentColor: string): string {
  const { s } = hexToHsl(accentColor);
  const sat = Math.max(0, Math.min(2, s / 100)).toFixed(2);
  return `hue-rotate(${hueRotateDeg(accentColor)}deg) saturate(${sat})`;
}
