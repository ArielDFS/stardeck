"use client";

import { AnimatePresence, motion } from "framer-motion";
import type { AgentInstance } from "@/types/agent";
import { useProfileStore } from "@/store/profileStore";
import { useShipStore } from "@/store/shipStore";
import { useHydrated } from "@/hooks/useHydrated";
import { BotSprite } from "./BotSprite";

interface AgentCardProps {
  agent: AgentInstance;
  open: boolean;
  onClose: () => void;
}

/**
 * Card-inspetor SÓ-LEITURA do agente (§10.2, ADR-0011). Abre ao focar um módulo
 * (clique no robô). Retrato = zoom do sprite existente, tingido por código.
 * A edição mora no Manifesto: "Editar agente" abre a view de edição lá.
 */
export function AgentCard({ agent, open, onClose }: AgentCardProps) {
  const stats = useProfileStore((s) => s.agentStats[agent.slug]);
  const editAgent = useShipStore((s) => s.editAgent);
  const hydrated = useHydrated();

  const accent = agent.accentColor;
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
          className="absolute right-2 top-2 z-30 w-64 max-w-[calc(100%-1rem)] overflow-hidden rounded-lg border bg-void/95 backdrop-blur-sm"
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
            <BotSprite
              pose="idle"
              accent={accent}
              className="pointer-events-none absolute left-1/2 h-44 w-44 -translate-x-1/2"
              style={{ top: "-4%" }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar card"
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded border border-border bg-void/80 font-mono text-[11px] text-text-muted transition hover:text-text"
            >
              ×
            </button>
          </div>

          {/* identidade (só-leitura) */}
          <div className="space-y-2 px-3 py-2.5">
            <h3
              className="font-display text-sm font-bold tracking-[0.1em]"
              style={{ color: accent }}
            >
              {agent.name}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-text-muted">
              {agent.role || "—"}
            </p>

            {/* badges derivados */}
            <div className="flex flex-wrap gap-1">
              {hasSearch && <Badge accent={accent}>BUSCA</Badge>}
              <Badge accent={accent}>{prefersPremium ? "CLAUDE" : "GEMINI"}</Badge>
              <Badge accent={accent}>⚡{agent.xpReward}</Badge>
            </div>

            {/* stats de gamificação */}
            <p className="font-mono text-[9px] text-text-dim">
              {hydrated ? `${stats?.missions ?? 0} missões concluídas` : "—"}
            </p>

            {/* ação → editor no Manifesto */}
            <button
              type="button"
              onClick={() => editAgent(agent.slug)}
              className="w-full rounded border px-2 py-1.5 font-display text-[9px] tracking-[0.1em] transition hover:brightness-125"
              style={{
                borderColor: accent,
                color: accent,
                backgroundColor: `${accent}14`,
              }}
            >
              Editar agente
            </button>
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
