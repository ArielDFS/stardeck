"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentInstance } from "@/types/agent";
import { useShipStore } from "@/store/shipStore";
import {
  useRosterStore, SHIP_CELLS, byCell, ZOOM_STEP, ZOOM_MIN, ZOOM_MAX,
} from "@/store/rosterStore";
import { hueRotateDeg } from "@/lib/ship/recolor";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { AgentEditor } from "@/components/ship/AgentEditor";
import { TopHUD } from "./TopHUD";
import { ByokKey } from "./ByokKey";

interface ManifestoProps {
  /** Slug do agente rodando a missão real agora (ou null) — Atividade ao vivo. */
  workingSlug: string | null;
}

type Activity = "working" | "focused" | "idle";

function modelLabel(a: AgentInstance): { label: string; premium: boolean } {
  const premium = a.model.prefer === "premium" && Boolean(a.model.premium);
  return { label: premium ? "CLAUDE" : "GEMINI", premium };
}

/**
 * Manifesto (ADR-0011): drawer de gerência em overlay. Surfaceia o Roster
 * (Atividade + badges), progressão e ajustes — e hospeda o EDITOR do agente
 * (a edição migrou do card pra cá). Clicar numa linha FOCA (drawer fica aberto);
 * "editar" abre a view de edição. Assinatura = trilho na cor da sala + cascata.
 */
export function Manifesto({ workingSlug }: ManifestoProps) {
  const open = useShipStore((s) => s.manifestoOpen);
  const close = useShipStore((s) => s.closeManifesto);
  const focusedSlug = useShipStore((s) => s.focusedSlug);
  const focusOnly = useShipStore((s) => s.focusOnly);
  const editAgent = useShipStore((s) => s.editAgent);
  const editingSlug = useShipStore((s) => s.editingSlug);
  const closeEditor = useShipStore((s) => s.closeEditor);
  const buildMode = useShipStore((s) => s.buildMode);
  const toggleBuild = useShipStore((s) => s.toggleBuild);

  const instances = useRosterStore((s) => s.instances);
  const createAgent = useRosterStore((s) => s.createAgent);
  const shipZoom = useRosterStore((s) => s.shipZoom);
  const setShipZoom = useRosterStore((s) => s.setShipZoom);

  // build mode usa drag de mouse → escondido no touch (ADR-0014).
  const coarsePointer = useMediaQuery("(pointer: coarse)");

  // Esc: na edição volta pra lista; na lista fecha o Manifesto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (useShipStore.getState().editingSlug) closeEditor();
      else close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, closeEditor]);

  const occupied = byCell(instances);
  const freeCells = Array.from({ length: SHIP_CELLS }, (_, i) => i).filter(
    (i) => !occupied.has(i),
  );
  const sorted = [...instances].sort((a, b) => a.cell - b.cell);
  const editingAgent = editingSlug
    ? instances.find((a) => a.slug === editingSlug)
    : undefined;

  const activityOf = (slug: string): Activity =>
    slug === workingSlug ? "working" : slug === focusedSlug ? "focused" : "idle";

  const ACTIVITY_LABEL: Record<Activity, string> = {
    working: "em missão",
    focused: "focado",
    idle: "idle",
  };

  const handleCreate = () => {
    if (freeCells.length === 0) return;
    const slug = createAgent(freeCells[0]!);
    if (slug) editAgent(slug);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* scrim — na edição fica leve (preview ao vivo da nave atrás) */}
          <motion.div
            className={`fixed inset-0 z-40 ${
              editingAgent ? "bg-void/40" : "bg-void/70 backdrop-blur-[2px]"
            }`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={close}
          />

          <motion.aside
            className="manifesto fixed left-0 top-0 z-50 flex h-full w-[330px] max-w-[88vw] flex-col border-r border-border bg-surface/95 backdrop-blur-md"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "tween", duration: 0.28, ease: "easeOut" }}
            aria-label="Manifesto da tripulação"
          >
            {editingAgent ? (
              /* ===== view de edição ===== */
              <>
                <header className="flex items-center justify-between border-b border-border/70 px-3 py-3">
                  <button
                    type="button"
                    onClick={closeEditor}
                    className="flex items-center gap-1.5 font-mono text-[10px] tracking-wide text-text-muted transition hover:text-cyan"
                  >
                    ← tripulação
                  </button>
                  <h2
                    className="truncate font-display text-[12px] tracking-[0.16em]"
                    style={{ color: editingAgent.accentColor }}
                  >
                    EDITAR {editingAgent.name}
                  </h2>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar Manifesto"
                    className="flex h-6 w-6 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition hover:border-cyan hover:text-cyan"
                  >
                    ✕
                  </button>
                </header>
                <div className="flex-1 overflow-y-auto px-3 py-3">
                  <AgentEditor agent={editingAgent} onDeleted={closeEditor} />
                </div>
              </>
            ) : (
              /* ===== view de lista (Roster + progressão + ajustes) ===== */
              <>
                <header className="flex items-center justify-between border-b border-border/70 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 animate-pulse-cyan rounded-full bg-cyan" />
                    <h2 className="font-display text-[12px] tracking-[0.22em] text-text">
                      TRIPULAÇÃO
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={close}
                    aria-label="Fechar Manifesto"
                    className="flex h-6 w-6 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition hover:border-cyan hover:text-cyan"
                  >
                    ✕
                  </button>
                </header>

                {/* lista do Roster */}
                <div className="flex-1 overflow-y-auto px-2 py-2">
                  <ul className="space-y-1">
                    {sorted.map((a, i) => {
                      const act = activityOf(a.slug);
                      const accent = a.accentColor;
                      const m = modelLabel(a);
                      const hasSearch = a.capabilities.includes("web_search");
                      return (
                        <li key={a.slug}>
                          <div
                            className={`manifesto-row group relative flex cursor-pointer items-center gap-3 rounded-md py-2 pl-4 pr-2 transition ${
                              a.slug === focusedSlug ? "bg-void/70" : "hover:bg-void/40"
                            }`}
                            style={
                              {
                                "--accent": accent,
                                "--hue": `${hueRotateDeg(accent)}deg`,
                              } as React.CSSProperties
                            }
                            onClick={() => focusOnly(a.slug)}
                          >
                            <span
                              className="manifesto-rail"
                              style={{ animationDelay: `${i * 55}ms` }}
                            />
                            <span className={`manifesto-node ${act}`} aria-hidden />

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className="truncate font-display text-[12px] tracking-wide"
                                  style={{
                                    color:
                                      a.slug === focusedSlug ? accent : "#C9D6DF",
                                  }}
                                >
                                  {a.name}
                                </span>
                                <span
                                  className="shrink-0 font-mono text-[9px] uppercase tracking-[0.1em]"
                                  style={{ color: act === "idle" ? "#5A7A94" : accent }}
                                >
                                  {ACTIVITY_LABEL[act]}
                                </span>
                              </div>
                              <div className="mt-0.5 flex items-center gap-1.5">
                                <span className="truncate font-mono text-[10px] text-text-muted">
                                  {a.role}
                                </span>
                                <span className="ml-auto flex shrink-0 items-center gap-1">
                                  <span
                                    className="rounded-sm border px-1 py-px font-mono text-[8px] tracking-wide"
                                    style={{
                                      borderColor: m.premium ? "#7B2FBE66" : "#1E3A5F",
                                      color: m.premium ? "#A56BD6" : "#5A7A94",
                                    }}
                                  >
                                    {m.label}
                                  </span>
                                  {hasSearch && (
                                    <span
                                      className="rounded-sm border px-1 py-px font-mono text-[8px] tracking-wide"
                                      style={{ borderColor: `${accent}66`, color: accent }}
                                    >
                                      BUSCA
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                editAgent(a.slug);
                              }}
                              className="shrink-0 rounded border border-border/0 px-1.5 py-1 font-mono text-[9px] tracking-wide text-text-dim opacity-0 transition group-hover:opacity-100 hover:border-border hover:text-text"
                            >
                              editar
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  <button
                    type="button"
                    onClick={handleCreate}
                    disabled={freeCells.length === 0}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border/70 py-2 font-mono text-[10px] tracking-wide text-text-muted transition hover:border-cyan/70 hover:text-cyan disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    + novo agente
                    <span className="text-text-dim">
                      ({freeCells.length} célula{freeCells.length === 1 ? "" : "s"} livre
                      {freeCells.length === 1 ? "" : "s"})
                    </span>
                  </button>
                </div>

                {/* progressão */}
                <div className="border-t border-border/70 px-4 py-3">
                  <p className="mb-2 font-display text-[9px] tracking-[0.2em] text-text-dim">
                    PROGRESSÃO
                  </p>
                  <TopHUD />
                </div>

                {/* ajustes */}
                <div className="flex items-center justify-between gap-2 border-t border-border/70 px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-dim">
                      espaço
                    </span>
                    <button
                      type="button"
                      aria-label="Menos espaço"
                      onClick={() => setShipZoom(shipZoom - ZOOM_STEP)}
                      disabled={shipZoom <= ZOOM_MIN}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition hover:border-cyan hover:text-cyan disabled:opacity-30"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      aria-label="Mais espaço"
                      onClick={() => setShipZoom(shipZoom + ZOOM_STEP)}
                      disabled={shipZoom >= ZOOM_MAX}
                      className="flex h-5 w-5 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition hover:border-cyan hover:text-cyan disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>

                  {!coarsePointer && (
                    <button
                      type="button"
                      onClick={toggleBuild}
                      className="rounded border px-2.5 py-1 font-display text-[9px] tracking-[0.12em] transition"
                      style={{
                        borderColor: buildMode ? "#00F5FF" : "#1E3A5F",
                        color: buildMode ? "#00F5FF" : "#5A7A94",
                        boxShadow: buildMode ? "0 0 12px #00F5FF55" : undefined,
                      }}
                    >
                      {buildMode ? "✓ CUSTOMIZANDO" : "CUSTOMIZAR"}
                    </button>
                  )}

                  <ByokKey placement="up" />
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
