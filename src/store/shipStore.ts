"use client";

import { create } from "zustand";

interface ShipState {
  /** Slug do agente atualmente focado (mira do prompt). */
  focusedSlug: string;
  /** Card-inspetor aberto? (§10.2 — clique foca E abre; fechar mantém foco.) */
  cardOpen: boolean;
  /** Abrir o card já no editor expandido? (true ao criar um agente novo.) */
  cardEditing: boolean;
  /** Foca o agente E abre o card. `editing` abre direto no editor. */
  setFocus: (slug: string, editing?: boolean) => void;
  /** Fecha o card sem perder o foco. */
  closeCard: () => void;
  /** Modo de customização da nave ligado? (props/decoração — ADR-0010.) */
  buildMode: boolean;
  /** Liga/desliga o modo de customização (fecha o card ao entrar). */
  toggleBuild: () => void;
}

export const useShipStore = create<ShipState>((set) => ({
  focusedSlug: "nexus",
  cardOpen: false,
  cardEditing: false,
  setFocus: (slug, editing = false) =>
    set({ focusedSlug: slug, cardOpen: true, cardEditing: editing }),
  closeCard: () => set({ cardOpen: false }),
  buildMode: false,
  toggleBuild: () =>
    set((s) => ({ buildMode: !s.buildMode, cardOpen: false })),
}));
