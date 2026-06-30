"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMission } from "@/hooks/useMission";
import { useShipStore } from "@/store/shipStore";
import { useRosterStore, SHIP_CELLS, byCell } from "@/store/rosterStore";
import { useProfileStore } from "@/store/profileStore";
import { useSettingsStore } from "@/store/settingsStore";
import { useHydrated } from "@/hooks/useHydrated";
import { levelForXp, levelProgress } from "@/lib/gamification/levels";
import { ROOMS } from "@/lib/ship/rooms";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { Manifesto } from "@/components/hud/Manifesto";
import { XPRewardToast, type ToastReward } from "@/components/hud/XPRewardToast";
import { SpaceBackground } from "./SpaceBackground";
import { ShipFX } from "./ShipFX";
import { ShipRoom, type ReactionSignal } from "./ShipRoom";
import { REACTION_EMOJI } from "@/lib/ship/expressions";
import { RoomDecor } from "./RoomDecor";
import { ShipBuilder } from "./ShipBuilder";
import { AgentCard } from "./AgentCard";
import { ModuleConsole } from "./ModuleConsole";

export function ShipView() {
  const focusedSlug = useShipStore((s) => s.focusedSlug);
  const setFocus = useShipStore((s) => s.setFocus);
  const cardOpen = useShipStore((s) => s.cardOpen);
  const closeCard = useShipStore((s) => s.closeCard);
  const buildMode = useShipStore((s) => s.buildMode);
  const toggleManifesto = useShipStore((s) => s.toggleManifesto);
  const editAgent = useShipStore((s) => s.editAgent);
  const instances = useRosterStore((s) => s.instances);
  const createAgent = useRosterStore((s) => s.createAgent);
  const shipZoom = useRosterStore((s) => s.shipZoom);
  const recordMission = useProfileStore((s) => s.recordMission);
  const xp = useProfileStore((s) => s.xp);
  const byokKey = useSettingsStore((s) => s.byokKey);
  const geminiKey = useSettingsStore((s) => s.geminiKey);
  const hydrated = useHydrated();
  const mission = useMission();
  const [reward, setReward] = useState<ToastReward | null>(null);
  const shipRef = useRef<HTMLDivElement>(null);

  // dica de horizontal: só em retrato + touch, dismissível, some na paisagem (ADR-0014).
  const portraitTouch = useMediaQuery("(pointer: coarse) and (orientation: portrait)");
  const [hintDismissed, setHintDismissed] = useState(false);
  const showRotateHint = portraitTouch && !hintDismissed;

  // ===== Reações (ADR-0013): o ShipView é o maestro de emoji por evento =====
  const [reactSig, setReactSig] = useState<
    ({ slug: string } & ReactionSignal) | null
  >(null);
  const nonceRef = useRef(0);
  const justLeveledRef = useRef(false);
  const fire = useCallback((slug: string, emoji: string) => {
    nonceRef.current += 1;
    setReactSig({ slug, emoji, nonce: nonceRef.current });
  }, []);

  // >1 = nave mais espaçosa → sprites/props encolhem (scale < 1).
  const scale = 1 / shipZoom;
  const cellMap = byCell(instances);
  const focusedAgent =
    instances.find((a) => a.slug === focusedSlug) ?? instances[0];

  const isWorking = (slug: string) =>
    mission.agentSlug === slug &&
    (mission.status === "PROCESSING" || mission.status === "STREAMING");

  // Atividade ao vivo: quem roda a missão real agora (1 por vez — ADR-0007).
  const workingSlug =
    mission.status === "PROCESSING" || mission.status === "STREAMING"
      ? mission.agentSlug
      : null;
  const focusedWorking = workingSlug === focusedAgent.slug;

  // pip de nível no topo (progressão detalhada vive no Manifesto)
  const shownXp = hydrated ? xp : 0;
  const level = levelForXp(shownXp);
  const progress = levelProgress(shownXp);

  // criar agente numa célula vaga → abre o editor no Manifesto (ADR-0011)
  const handleCreate = (cell: number) => {
    const slug = createAgent(cell);
    if (slug) editAgent(slug);
  };

  // Reação ao focar (👋) — pula o foco inicial do load.
  const firstFocus = useRef(true);
  useEffect(() => {
    if (firstFocus.current) {
      firstFocus.current = false;
      return;
    }
    if (focusedSlug) fire(focusedSlug, REACTION_EMOJI.focus);
  }, [focusedSlug, fire]);

  // Reação por transição de Atividade da missão (início/fim/erro).
  const prevStatus = useRef(mission.status);
  useEffect(() => {
    const s = mission.status;
    const slug = mission.agentSlug;
    if (s !== prevStatus.current && slug) {
      if (s === "PROCESSING") fire(slug, REACTION_EMOJI.missionStart);
      else if (s === "COMPLETED") {
        // level-up (🎉) já disparou no onComplete e tem prioridade sobre o ✅.
        if (justLeveledRef.current) justLeveledRef.current = false;
        else fire(slug, REACTION_EMOJI.missionDone);
      } else if (s === "ERROR") fire(slug, REACTION_EMOJI.missionError);
    }
    prevStatus.current = s;
  }, [mission.status, mission.agentSlug, fire]);

  // tecla M abre/fecha o Manifesto (ignora quando digitando num campo).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        toggleManifesto();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggleManifesto]);

  return (
    <main className="relative flex h-screen flex-col overflow-hidden">
      <SpaceBackground />
      <ShipFX shipRef={shipRef} />

      {/* barra de status fina (ADR-0011) — gerência mora no Manifesto (☰) */}
      <header className="relative z-30 flex items-center justify-between border-b border-border/50 px-4 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleManifesto}
            aria-label="Abrir Manifesto (tecla M)"
            title="Tripulação · M"
            className="flex h-7 w-7 flex-col items-center justify-center gap-[3px] rounded border border-border transition hover:border-cyan"
          >
            <span className="h-px w-3.5 bg-text-muted transition-colors" />
            <span className="h-px w-3.5 bg-text-muted transition-colors" />
            <span className="h-px w-3.5 bg-text-muted transition-colors" />
          </button>
          <h1 className="font-display text-sm font-bold tracking-[0.2em]">
            STAR<span className="text-cyan">DECK</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* agente focado + Atividade (texto some em telas estreitas — ADR-0014) */}
          <div className="flex items-center gap-2">
            <span
              className={`h-1.5 w-1.5 rounded-full ${focusedWorking ? "animate-pulse" : ""}`}
              style={{
                backgroundColor: focusedAgent.accentColor,
                boxShadow: `0 0 6px ${focusedAgent.accentColor}`,
              }}
            />
            <span
              className="hidden font-display text-[11px] tracking-[0.14em] sm:inline"
              style={{ color: focusedAgent.accentColor }}
            >
              {focusedAgent.name}
            </span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-text-muted sm:inline">
              {focusedWorking ? "em missão" : "focado"}
            </span>
          </div>

          {/* pip de nível → abre o Manifesto (progressão detalhada lá dentro) */}
          <button
            type="button"
            onClick={toggleManifesto}
            title="Progressão · Manifesto"
            className="flex items-center gap-1.5 rounded border border-border px-2 py-1 transition hover:border-cyan"
          >
            <span className="font-display text-[10px] font-bold tracking-[0.12em] text-cyan">
              NÍV {level.level}
            </span>
            <span className="h-1 w-12 overflow-hidden rounded-full bg-surface-2">
              <span
                className="block h-full rounded-full bg-cyan shadow-glow-cyan transition-[width] duration-500 ease-out"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </span>
          </button>
        </div>
      </header>

      <Manifesto workingSlug={workingSlug} />

      {/* convés — a nave (render real) com as salas por cima */}
      <section className="ship-stage relative z-10 flex flex-1 items-center justify-center overflow-hidden p-2">
        <div ref={shipRef} className={`ship-bg ${buildMode ? "build" : ""}`}>
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
                  reaction={reactSig?.slug === agent.slug ? reactSig : null}
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
            />
          )}
        </div>

        {/* dica de horizontal (retrato + touch) — some sozinha na paisagem */}
        {showRotateHint && (
          <button
            type="button"
            onClick={() => setHintDismissed(true)}
            className="absolute bottom-2 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-cyan/40 bg-void/85 px-3 py-1.5 font-mono text-[10px] tracking-wide text-text-muted backdrop-blur-sm"
          >
            <span className="text-cyan">↻</span> melhor na horizontal
            <span className="text-text-dim">· toque p/ fechar</span>
          </button>
        )}
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
                apiKey: byokKey || undefined,
                geminiKey: geminiKey || undefined,
                agent: {
                  systemPrompt: focusedAgent.systemPrompt,
                  model: focusedAgent.model,
                  capabilities: focusedAgent.capabilities,
                },
                onComplete: ({ durationMs }) => {
                  const r = recordMission(focusedAgent, durationMs);
                  setReward({ ...r, id: Date.now() });
                  // level-up (🎉) tem prioridade sobre o ✅ de fim de missão.
                  if (r.leveledUp) {
                    justLeveledRef.current = true;
                    fire(focusedAgent.slug, REACTION_EMOJI.levelUp);
                  }
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
