"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Ajustes do ator persistidos no navegador (BYOK, ADR-0002/0015). Duas chaves,
 * só no localStorage, enviadas apenas na missão do ator:
 *  - `byokKey`  → chave OpenRouter (premium/Claude). Nome mantido por compat (ADR-0015 #5).
 *  - `geminiKey`→ chave de host (Gemini): roda o modelo base na cota do Visitante,
 *                 escapando da cota de teste limitada do host. Não destrava modelo novo.
 */
interface SettingsState {
  byokKey: string;
  setByokKey: (k: string) => void;
  clearByokKey: () => void;
  geminiKey: string;
  setGeminiKey: (k: string) => void;
  clearGeminiKey: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      byokKey: "",
      setByokKey: (k) => set({ byokKey: k.trim() }),
      clearByokKey: () => set({ byokKey: "" }),
      geminiKey: "",
      setGeminiKey: (k) => set({ geminiKey: k.trim() }),
      clearGeminiKey: () => set({ geminiKey: "" }),
    }),
    { name: "nexus-settings", version: 1 },
  ),
);
