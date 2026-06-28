"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AGENTS, getAgent } from "@/agents";
import type { AgentConfig, AgentInstance } from "@/types/agent";
import type { PropPlacement } from "@/lib/ship/props";
import { newPropId, propWidth } from "@/lib/ship/props";

/** Nº de células do casco (ADR-0010: grade fixa). */
export const SHIP_CELLS = 8;

/** Layout-semente: quais Blueprints ocupam quais células no primeiro load. */
const SEED_LAYOUT = ["nexus", "aria", "echo", "forge", "phantom"] as const;

/** Modelo host padrão para agentes criados do zero. */
const DEFAULT_HOST_MODEL = "gemini-2.5-flash";

/** Semeia uma instância de Agente a partir de um Blueprint (copy-on-write). */
function seedFromBlueprint(bp: AgentConfig, cell: number): AgentInstance {
  return { ...bp, blueprintSlug: bp.slug, cell, equippedCosmetic: null };
}

/** Roster inicial: os 5 Blueprints montados nas células 0..4 (ADR-0010). */
function buildSeedRoster(): AgentInstance[] {
  const bySlug = new Map(AGENTS.map((a) => [a.slug, a]));
  return SEED_LAYOUT.flatMap((slug, cell) => {
    const bp = bySlug.get(slug);
    return bp ? [seedFromBlueprint(bp, cell)] : [];
  });
}

interface RosterState {
  /** Instâncias de Agente na nave do ator (persistidas). */
  instances: AgentInstance[];
  /** Props de decoração por célula (0..7) — modo de customização (ADR-0010). */
  roomProps: Record<number, PropPlacement[]>;
  /** Fator de "espaço" da nave: >1 encolhe robôs/props (mais espaçosa). */
  shipZoom: number;

  /** Edita uma instância (copy-on-write; nunca toca o Blueprint). */
  updateAgent: (slug: string, patch: Partial<AgentInstance>) => void;
  /** Re-semeia a instância a partir do seu Blueprint ("restaurar padrão"). */
  resetAgent: (slug: string) => void;
  /** Remove a instância, liberando a célula. */
  deleteAgent: (slug: string) => void;
  /** Cria um Agente do zero numa célula vaga. Retorna o slug ou null se cheia. */
  createAgent: (cell: number, patch?: Partial<AgentInstance>) => string | null;

  /** Coloca um prop numa sala. Retorna o id criado. */
  addProp: (cell: number, f: string, x: number, y: number) => string;
  /** Move um prop dentro da mesma sala. */
  moveProp: (cell: number, id: string, x: number, y: number) => void;
  /** Move um prop de uma sala para outra. */
  movePropToCell: (
    from: number,
    to: number,
    id: string,
    x: number,
    y: number,
  ) => void;
  /** Remove um prop (ex.: arrastado para fora). */
  removeProp: (cell: number, id: string) => void;

  /** Ajusta o fator de espaço da nave (clampado em [1, 2.4]). */
  setShipZoom: (z: number) => void;
}

/** Limites do fator de espaço. */
export const ZOOM_MIN = 1;
export const ZOOM_MAX = 2.4;
export const ZOOM_STEP = 0.2;

export const useRosterStore = create<RosterState>()(
  persist(
    (set, get) => ({
      instances: buildSeedRoster(),
      roomProps: {},
      shipZoom: 1,

      updateAgent: (slug, patch) =>
        set((s) => ({
          instances: s.instances.map((a) =>
            a.slug === slug ? { ...a, ...patch, slug: a.slug } : a,
          ),
        })),

      resetAgent: (slug) =>
        set((s) => ({
          instances: s.instances.map((a) => {
            if (a.slug !== slug || !a.blueprintSlug) return a;
            const bp = getAgent(a.blueprintSlug);
            return bp ? seedFromBlueprint(bp, a.cell) : a;
          }),
        })),

      deleteAgent: (slug) =>
        set((s) => ({
          instances: s.instances.filter((a) => a.slug !== slug),
        })),

      createAgent: (cell, patch) => {
        const taken = new Set(get().instances.map((a) => a.cell));
        if (cell < 0 || cell >= SHIP_CELLS || taken.has(cell)) return null;
        const slug = `custom-${Date.now().toString(36)}`;
        const fresh: AgentInstance = {
          slug,
          name: "NOVO AGENTE",
          role: "Generalista",
          tagline: "",
          description: "",
          avatarUrl: "",
          accentColor: "#00F5FF",
          model: { host: DEFAULT_HOST_MODEL },
          systemPrompt: "",
          inputPlaceholder: "Descreva a missão...",
          capabilities: [],
          xpReward: 80,
          blueprintSlug: null,
          cell,
          equippedCosmetic: null,
          ...patch,
        };
        set((s) => ({ instances: [...s.instances, fresh] }));
        return slug;
      },

      addProp: (cell, f, x, y) => {
        const id = newPropId();
        const prop: PropPlacement = { id, f, x, y, w: propWidth(f) };
        set((s) => ({
          roomProps: {
            ...s.roomProps,
            [cell]: [...(s.roomProps[cell] ?? []), prop],
          },
        }));
        return id;
      },

      moveProp: (cell, id, x, y) =>
        set((s) => ({
          roomProps: {
            ...s.roomProps,
            [cell]: (s.roomProps[cell] ?? []).map((p) =>
              p.id === id ? { ...p, x, y } : p,
            ),
          },
        })),

      movePropToCell: (from, to, id, x, y) =>
        set((s) => {
          const prop = (s.roomProps[from] ?? []).find((p) => p.id === id);
          if (!prop) return s;
          return {
            roomProps: {
              ...s.roomProps,
              [from]: (s.roomProps[from] ?? []).filter((p) => p.id !== id),
              [to]: [...(s.roomProps[to] ?? []), { ...prop, x, y }],
            },
          };
        }),

      removeProp: (cell, id) =>
        set((s) => ({
          roomProps: {
            ...s.roomProps,
            [cell]: (s.roomProps[cell] ?? []).filter((p) => p.id !== id),
          },
        })),

      setShipZoom: (z) =>
        set({ shipZoom: Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z)) }),
    }),
    {
      name: "nexus-roster",
      version: 1,
    },
  ),
);

/** Seletores derivados (uso fora de componentes ou em selectors). */
export function getInstance(
  instances: AgentInstance[],
  slug: string,
): AgentInstance | undefined {
  return instances.find((a) => a.slug === slug);
}

/** Mapa célula → instância (células vagas ficam de fora). */
export function byCell(instances: AgentInstance[]): Map<number, AgentInstance> {
  return new Map(instances.map((a) => [a.cell, a]));
}
