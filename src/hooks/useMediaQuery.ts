"use client";

import { useEffect, useState } from "react";

/**
 * Casa uma media query e re-renderiza quando ela muda. SSR-safe: começa `false`
 * (servidor + 1º render do cliente) e atualiza após montar. Usada para mobile /
 * orientação / tipo de ponteiro na responsividade (ADR-0014).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener("change", onChange);
    return () => m.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}
