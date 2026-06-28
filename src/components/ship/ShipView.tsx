"use client";

import { useRef, useState } from "react";
import { useMission } from "@/hooks/useMission";
import { useShipStore } from "@/store/shipStore";
import {
  useRosterStore, SHIP_CELLS, byCell, ZOOM_STEP,
} from "@/store/rosterStore";
import { useProfileStore } from "@/store/profileStore";
import { ROOMS, SHIP_ASPECT } from "@/lib/ship/rooms";
import { TopHUD } from "@/components/hud/TopHUD";
import { XPRewardToast, type ToastReward } from "@/components/hud/XPRewardToast";
import { SpaceBackground } from "./SpaceBackground";
import { ShipFX } from "./ShipFX";
import { ShipRoom } from "./ShipRoom";
import { RoomDecor } from "./RoomDecor";
import { ShipBuilder } from "./ShipBuilder";
import { AgentCard } from "./AgentCard";
import { ModuleConsole } from "./ModuleConsole";

export function ShipView() {
  const focusedSlug = useShipStore((s) => s.focusedSlug);
  const setFocus = useShipStore((s) => s.setFocus);
  const cardOpen = useShipStore((s) => s.cardOpen);
  const cardEditing = useShipStore((s) => s.cardEditing);
  const closeCard = useShipStore((s) => s.closeCard);
  const buildMode = useShipStore((s) => s.buildMode);
  const toggleBuild = useShipStore((s) => s.toggleBuild);
  const instances = useRosterStore((s) => s.instances);
  const createAgent = useRosterStore((s) => s.createAgent);
  const shipZoom = useRosterStore((s) => s.shipZoom);
  const setShipZoom = useRosterStore((s) => s.setShipZoom);
  const recordMission = useProfileStore((s) => s.recordMission);
  const mission = useMission();
  const [reward, setReward] = useState<ToastReward | null>(null);
  const shipRef = useRef<HTMLDivElement>(null);

  // >1 = nave mais espaçosa → sprites/props encolhem (scale < 1).
  const scale = 1 / shipZoom;
  const cellMap = byCell(instances);
  const focusedAgent =
    instances.find((a) => a.slug === focusedSlug) ?? instances[0];

  const isWorking = (slug: string) =>
    mission.agentSlug === slug &&
    (mission.status === "PROCESSING" || mission.status === "STREAMING");

  // criar agente numa célula vaga → foca e abre o card já no editor
  const handleCreate = (cell: number) => {
    const slug = createAgent(cell);
    if (slug) setFocus(slug, true);
  };

  return (
    <main className="relative flex h-screen flex-col overflow-hidden">
      <SpaceBackground />
      <ShipFX shipRef={shipRef} />

      {/* cabeçalho */}
      <header className="relative z-10 flex items-center justify-between border-b border-border/50 px-6 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-pulse-cyan rounded-full bg-cyan" />
          <h1 className="font-display text-base font-bold tracking-[0.2em]">
            NEXUS<span className="text-cyan"> HUB</span>
          </h1>
        </div>
        <div className="flex items-center gap-5">
          <TopHUD />
          <div className="flex items-center gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-text-dim">
              espaço
            </span>
            <button
              type="button"
              aria-label="Menos espaço"
              onClick={() => setShipZoom(shipZoom - ZOOM_STEP)}
              className="flex h-5 w-5 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition hover:border-cyan hover:text-cyan"
            >
              −
            </button>
            <button
              type="button"
              aria-label="Mais espaço"
              onClick={() => setShipZoom(shipZoom + ZOOM_STEP)}
              className="flex h-5 w-5 items-center justify-center rounded border border-border font-mono text-xs text-text-muted transition hover:border-cyan hover:text-cyan"
            >
              +
            </button>
          </div>
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
            {buildMode ? "✓ CUSTOMIZANDO" : "CUSTOMIZAR NAVE"}
          </button>
        </div>
      </header>

      {/* convés — a nave (render real) com as salas por cima */}
      <section className="relative z-10 flex flex-1 items-center justify-center overflow-hidden p-2">
        <div
          ref={shipRef}
          className={`ship-bg ${buildMode ? "build" : ""}`}
          style={{
            aspectRatio: SHIP_ASPECT,
            height: "100%",
            maxWidth: "100%",
          }}
        >
          {/* decoração (grid + props) — todas as salas, atrás dos robôs */}
          {ROOMS.map((room, i) => (
            <RoomDecor key={`decor-${i}`} cell={i} box={room.box} scale={scale} />
          ))}

          {/* células: robô (ocupada) ou botão "+ novo agente" (vaga) */}
          {Array.from({ length: SHIP_CELLS }, (_, i) => {
            const room = ROOMS[i];
            if (!room) return null;
            const agent = cellMap.get(i);
            if (agent) {
              return (
                <ShipRoom
                  key={agent.slug}
                  agent={agent}
                  room={room}
                  isFocused={focusedSlug === agent.slug}
                  isWorking={isWorking(agent.slug)}
                  onSelect={setFocus}
                  scale={scale}
                />
              );
            }
            // célula vaga — só fora do modo customização
            if (buildMode) return null;
            return (
              <button
                key={`empty-${i}`}
                type="button"
                onClick={() => handleCreate(i)}
                title="Criar um agente nesta sala"
                className="group absolute flex items-center justify-center rounded border border-dashed border-border/60 bg-void/20 transition hover:border-cyan/70 hover:bg-cyan/5"
                style={{
                  left: `${room.box.l}%`,
                  top: `${room.box.t}%`,
                  width: `${room.box.w}%`,
                  height: `${room.box.h}%`,
                }}
              >
                <span className="font-mono text-[9px] tracking-widest text-text-dim transition group-hover:text-cyan">
                  + AGENTE
                </span>
              </button>
            );
          })}

          {focusedAgent && (
            <AgentCard
              key={focusedAgent.slug}
              agent={focusedAgent}
              open={cardOpen}
              onClose={closeCard}
              defaultEditing={cardEditing}
            />
          )}
        </div>
      </section>

      {/* console docado + prompt pequeno */}
      <div className="relative z-10 flex justify-center px-2 pb-2">
        <div className="w-full max-w-5xl">
          <ModuleConsole
            agent={focusedAgent}
            status={mission.status}
            output={mission.output}
            steps={mission.steps}
            error={mission.error}
            durationMs={mission.durationMs}
            isThisAgent={mission.agentSlug === focusedAgent.slug}
            onLaunch={(input) =>
              mission.run(focusedAgent.slug, input, {
                agent: {
                  systemPrompt: focusedAgent.systemPrompt,
                  model: focusedAgent.model,
                  capabilities: focusedAgent.capabilities,
                },
                onComplete: ({ durationMs }) => {
                  const r = recordMission(focusedAgent, durationMs);
                  setReward({ ...r, id: Date.now() });
                },
              })
            }
          />
        </div>
      </div>

      <ShipBuilder shipRef={shipRef} />
      {buildMode && (
        <p className="pointer-events-none fixed bottom-1 left-1/2 z-[60] -translate-x-1/2 font-mono text-[10px] text-text-muted">
          arraste props da paleta → solte numa sala · arraste pra fora p/ apagar
        </p>
      )}

      <XPRewardToast reward={reward} onDone={() => setReward(null)} />
    </main>
  );
}
