"use client";

import { useEffect, useState } from "react";

/**
 * true após a montagem no cliente. Use para adiar a leitura de stores
 * persistidos (localStorage) e evitar hydration mismatch no SSR.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
