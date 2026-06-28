"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { AgentInstance } from "@/types/agent";
import { useRosterStore } from "@/store/rosterStore";
import { useProfileStore } from "@/store/profileStore";
import { useHydrated } from "@/hooks/useHydrated";
import { hueRotateDeg } from "@/lib/ship/recolor";
import {
  COSMETICS, cosmeticSrc, cosmeticUnlockLabel,
  COSMETIC_PORTRAIT_W, COSMETIC_PORTRAIT_TOP, COSMETIC_PORTRAIT_LEFT,
} from "@/lib/ship/cosmetics";
import { BotSprite } from "./BotSprite";

interface AgentCardProps {
  agent: AgentInstance;
  open: boolean;
  onClose: () => void;
  /** Abre já no editor expandido (agente recém-criado). */
  defaultEditing?: boolean;
}

/**
 * Card-inspetor/editor do agente (§10.2, ADR-0010). Abre ao focar um módulo.
 * Retrato = zoom do sprite existente (sem asset novo), tingido por código.
 * Nome/role/cor refletem na nave em tempo real (a nave lê o mesmo Roster).
 */
export function AgentCard({
  agent,
  open,
  onClose,
  defaultEditing = false,
}: AgentCardProps) {
  const updateAgent = useRosterStore((s) => s.updateAgent);
  const resetAgent = useRosterStore((s) => s.resetAgent);
  const deleteAgent = useRosterStore((s) => s.deleteAgent);
  const stats = useProfileStore((s) => s.agentStats[agent.slug]);
  const unlockedCosmetics = useProfileStore((s) => s.unlockedCosmetics);
  const unlockAllCosmetics = useProfileStore((s) => s.unlockAllCosmetics);
  const isDev = process.env.NODE_ENV === "development";
  const hydrated = useHydrated();
  const [editing, setEditing] = useState(defaultEditing);

  const accent = agent.accentColor;
  const equipped = agent.equippedCosmetic;
  const hasSearch = agent.capabilities.includes("web_search");
  const prefersPremium = agent.model.prefer === "premium" && agent.model.premium;

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key={agent.slug}
          initial={{ opacity: 0, x: 24, scale: 0.96 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: 24, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="absolute right-2 top-2 z-30 w-64 overflow-hidden rounded-lg border bg-void/95 backdrop-blur-sm"
          style={{ borderColor: accent, boxShadow: `0 0 22px ${accent}55` }}
        >
          {/* retrato (zoom do rosto do sprite) */}
          <div
            className="relative h-28 overflow-hidden border-b"
            style={{
              borderColor: `${accent}66`,
              background: `radial-gradient(circle at 50% 35%, ${accent}33, transparent 70%)`,
            }}
          >
            {/* zoom no rosto: BotSprite grande dentro da caixa recortada.
                top/altura ajustáveis como o BAY até enquadrar o rosto. */}
            <BotSprite
              pose="idle"
              accent={accent}
              className="pointer-events-none absolute left-1/2 h-44 w-44 -translate-x-1/2"
              style={{ top: "-4%" }}
            />
            {equipped && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cosmeticSrc(equipped, "front")}
                alt=""
                draggable={false}
                className="pointer-events-none absolute object-contain"
                style={{
                  width: COSMETIC_PORTRAIT_W,
                  top: COSMETIC_PORTRAIT_TOP,
                  left: COSMETIC_PORTRAIT_LEFT,
                  transform: "translate(-50%, -50%)",
                  filter: `hue-rotate(${hueRotateDeg(accent)}deg)`,
                }}
              />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar card"
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border border-border bg-void/80 font-mono text-[11px] text-text-muted transition hover:text-text"
            >
              ×
            </button>
          </div>

          {/* identidade editável */}
          <div className="space-y-2 px-3 py-2.5">
            <input
              value={agent.name}
              onChange={(e) => updateAgent(agent.slug, { name: e.target.value })}
              maxLength={18}
              className="w-full bg-transparent font-display text-sm font-bold tracking-[0.1em] outline-none"
              style={{ color: accent }}
            />
            <input
              value={agent.role}
              onChange={(e) => updateAgent(agent.slug, { role: e.target.value })}
              maxLength={28}
              placeholder="função do agente"
              className="w-full bg-transparent font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted outline-none placeholder:text-text-dim"
            />

            {/* badges derivados */}
            <div className="flex flex-wrap gap-1">
              {hasSearch && <Badge accent={accent}>BUSCA</Badge>}
              <Badge accent={accent}>{prefersPremium ? "CLAUDE" : "GEMINI"}</Badge>
              <Badge accent={accent}>⚡{agent.xpReward}</Badge>
            </div>

            {/* stats de gamificação */}
            <p className="font-mono text-[9px] text-text-dim">
              {hydrated
                ? `${stats?.missions ?? 0} missões concluídas`
                : "—"}
            </p>

            {/* ações */}
            <div className="flex gap-1.5 pt-0.5">
              <CardButton accent={accent} onClick={() => setEditing((v) => !v)}>
                {editing ? "Fechar editor" : "Editar agente"}
              </CardButton>
            </div>

            {/* editor expandido */}
            <AnimatePresence initial={false}>
              {editing && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden border-t border-border/60 pt-2"
                >
                  <Field label="System prompt">
                    <textarea
                      value={agent.systemPrompt}
                      onChange={(e) =>
                        updateAgent(agent.slug, { systemPrompt: e.target.value })
                      }
                      rows={4}
                      placeholder="Como esse agente pensa e responde..."
                      className="w-full resize-none rounded border border-border bg-surface-2 px-2 py-1.5 font-mono text-[10px] leading-relaxed text-text outline-none focus:border-cyan"
                    />
                  </Field>

                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-text-muted">
                      Busca web
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateAgent(agent.slug, {
                          capabilities: hasSearch ? [] : ["web_search"],
                        })
                      }
                      className="rounded border px-2 py-0.5 font-mono text-[9px] tracking-wide transition"
                      style={{
                        borderColor: hasSearch ? accent : "#1E3A5F",
                        color: hasSearch ? accent : "#5A7A94",
                      }}
                    >
                      {hasSearch ? "LIGADA" : "desligada"}
                    </button>
                  </div>

                  <Field label="Cor da sala">
                    <input
                      type="color"
                      value={accent}
                      onChange={(e) =>
                        updateAgent(agent.slug, { accentColor: e.target.value })
                      }
                      className="h-7 w-full cursor-pointer rounded border border-border bg-surface-2"
                    />
                  </Field>

                  <Field label="Cosmético">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        title="Nenhum"
                        onClick={() =>
                          updateAgent(agent.slug, { equippedCosmetic: null })
                        }
                        className="flex h-8 w-8 items-center justify-center rounded border bg-surface-2 font-mono text-[10px] text-text-muted"
                        style={{ borderColor: !equipped ? accent : "#1E3A5F" }}
                      >
                        —
                      </button>
                      {COSMETICS.map((c) => {
                        const unlocked =
                          hydrated && unlockedCosmetics.includes(c.id);
                        return (
                          <button
                            key={c.id}
                            type="button"
                            disabled={!unlocked}
                            title={
                              unlocked
                                ? c.name
                                : `${c.name} — destrava: ${cosmeticUnlockLabel(c)}`
                            }
                            onClick={() =>
                              updateAgent(agent.slug, { equippedCosmetic: c.id })
                            }
                            className="relative flex h-8 w-8 items-center justify-center rounded border bg-surface-2 disabled:cursor-not-allowed"
                            style={{
                              borderColor:
                                equipped === c.id ? accent : "#1E3A5F",
                              opacity: unlocked ? 1 : 0.35,
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={cosmeticSrc(c.id, "front")}
                              alt={c.name}
                              draggable={false}
                              className="h-full w-full object-contain p-0.5"
                              style={{
                                filter: `hue-rotate(${hueRotateDeg(accent)}deg)`,
                              }}
                            />
                            {!unlocked && (
                              <span className="absolute inset-0 flex items-center justify-center text-[9px]">
                                🔒
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                    {isDev && unlockedCosmetics.length < COSMETICS.length && (
                      <button
                        type="button"
                        onClick={unlockAllCosmetics}
                        className="mt-1 font-mono text-[8px] uppercase tracking-wider text-text-dim underline transition hover:text-cyan"
                      >
                        destravar tudo (dev)
                      </button>
                    )}
                  </Field>

                  {agent.model.premium && (
                    <Field label="Modelo">
                      <select
                        value={agent.model.prefer ?? "host"}
                        onChange={(e) =>
                          updateAgent(agent.slug, {
                            model: {
                              ...agent.model,
                              prefer: e.target.value as "host" | "premium",
                            },
                          })
                        }
                        className="w-full rounded border border-border bg-surface-2 px-2 py-1 font-mono text-[10px] text-text outline-none focus:border-cyan"
                      >
                        <option value="host">Gemini (host)</option>
                        <option value="premium">Claude (premium / BYOK)</option>
                      </select>
                    </Field>
                  )}

                  <div className="flex gap-1.5 pt-1">
                    {agent.blueprintSlug && (
                      <CardButton
                        accent="#5A7A94"
                        onClick={() => resetAgent(agent.slug)}
                      >
                        Restaurar padrão
                      </CardButton>
                    )}
                    <CardButton
                      accent="#FF4C4C"
                      onClick={() => {
                        deleteAgent(agent.slug);
                        onClose();
                      }}
                    >
                      Apagar
                    </CardButton>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function Badge({
  accent,
  children,
}: {
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className="rounded px-1.5 py-0.5 font-mono text-[8px] font-bold tracking-[0.1em]"
      style={{ color: accent, backgroundColor: `${accent}1A` }}
    >
      {children}
    </span>
  );
}

function CardButton({
  accent,
  onClick,
  children,
}: {
  accent: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-1 rounded border px-2 py-1 font-display text-[9px] tracking-[0.1em] transition hover:brightness-125"
      style={{ borderColor: `${accent}99`, color: accent }}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-dim">
        {label}
      </span>
      {children}
    </label>
  );
}
