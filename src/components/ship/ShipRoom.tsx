"use client";

import { useEffect, useMemo, useRef } from "react";
import type { AgentInstance } from "@/types/agent";
import type { BotDir, RoomDef } from "@/lib/ship/rooms";
import {
  CELL, POSE_CELL, WALK_COLS, WALK_ROWS, POSE_COLS, POSE_ROWS,
  WALK_FRAMES, DIRIDX, WALK_SPEED, FRAME_MS, MIN_DUR,
  WALK_SHEET, POSE_SHEET,
} from "@/lib/ship/rooms";
import { hueRotateDeg } from "@/lib/ship/recolor";
import {
  cosmeticSrc, dirToCosmetic,
  COSMETIC_W_RATIO, COSMETIC_DY_RATIO, COSMETIC_DX_RATIO,
} from "@/lib/ship/cosmetics";

interface ShipRoomProps {
  agent: AgentInstance;
  room: RoomDef;
  isFocused: boolean;
  isWorking: boolean;
  onSelect: (slug: string) => void;
  /** Escala do robô (1 = normal; <1 encolhe — "mais espaço"). */
  scale: number;
}

interface BotState {
  dir: BotDir;
  flip: boolean;
  frame: number;
  walkTimer: ReturnType<typeof setInterval> | null;
}

/**
 * Uma sala da nave: bounds invisíveis + robô que perambula em rajadas (idle),
 * caminha até o console ao ser focado e entra em pose de trabalho durante a
 * missão. Lógica portada verbatim de _mockups/ship-render.html (refs imperativos).
 */
export function ShipRoom({
  agent,
  room,
  isFocused,
  isWorking,
  onSelect,
  scale,
}: ShipRoomProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const cosmeticRef = useRef<HTMLImageElement>(null);
  const ctrlRef = useRef<{
    startWorking: () => void;
    stopWorking: () => void;
    refreshCosmetic: () => void;
  } | null>(null);

  // estado vivo lido pelos timers: perambula quando NÃO está em missão.
  const workingRef = useRef(isWorking);
  workingRef.current = isWorking;
  // cosmético equipado, lido pela camada imperativa
  const equippedRef = useRef(agent.equippedCosmetic);
  equippedRef.current = agent.equippedCosmetic;

  const accent = agent.accentColor;
  const hue = `${hueRotateDeg(accent)}deg`;

  // posições aleatórias estáveis das partículas
  const particles = useMemo(
    () =>
      Array.from({ length: 5 }, () => ({
        left: `${15 + Math.random() * 70}%`,
        top: `${40 + Math.random() * 50}%`,
        delay: `${Math.random() * 4.2}s`,
      })),
    [],
  );

  // ===== máquina de estados (montada uma vez) =====
  useEffect(() => {
    const unit = unitRef.current;
    const bot = botRef.current;
    if (!unit || !bot) return;
    const st: BotState = { dir: "down", flip: false, frame: 0, walkTimer: null };
    let wanderTimer: ReturnType<typeof setTimeout> | null = null;
    let arriveTimer: ReturnType<typeof setTimeout> | null = null;

    const updateCosmetic = () => {
      const cos = cosmeticRef.current;
      if (!cos) return;
      const id = equippedRef.current;
      if (!id) {
        cos.style.display = "none";
        return;
      }
      cos.style.display = "block";
      cos.style.width = `${CELL * COSMETIC_W_RATIO}px`;
      cos.src = cosmeticSrc(id, dirToCosmetic(st.dir));
      const flip = st.dir === "side" && st.flip ? -1 : 1;
      cos.style.transform = `translate(-50%,-50%) translate(${COSMETIC_DX_RATIO * CELL}px, ${COSMETIC_DY_RATIO * CELL}px) scaleX(${flip})`;
    };
    const applyFlip = () => {
      bot.style.transform = `translate(-50%,-50%) scaleX(${st.dir === "side" && st.flip ? -1 : 1})`;
      updateCosmetic();
    };
    const setWalkCell = () => {
      bot.style.backgroundPosition = `${-st.frame * CELL}px ${-DIRIDX[st.dir] * CELL}px`;
    };
    const startWalkAnim = () => {
      if (st.walkTimer) return;
      st.walkTimer = setInterval(() => {
        st.frame = (st.frame + 1) % WALK_FRAMES;
        setWalkCell();
      }, FRAME_MS);
    };
    const stopWalkAnim = () => {
      if (st.walkTimer) clearInterval(st.walkTimer);
      st.walkTimer = null;
      st.frame = 0;
    };
    const showWalk = () => {
      unit.classList.remove("idle");
      bot.style.backgroundImage = `url(${WALK_SHEET})`;
      bot.style.width = CELL + "px";
      bot.style.height = CELL + "px";
      bot.style.backgroundSize = `${WALK_COLS * CELL}px ${WALK_ROWS * CELL}px`;
      applyFlip();
      setWalkCell();
      startWalkAnim();
    };
    const showPose = (poseRow: number) => {
      stopWalkAnim();
      bot.style.backgroundImage = `url(${POSE_SHEET})`;
      bot.style.width = POSE_CELL + "px";
      bot.style.height = POSE_CELL + "px";
      bot.style.backgroundSize = `${POSE_COLS * POSE_CELL}px ${POSE_ROWS * POSE_CELL}px`;
      bot.style.backgroundPosition = `${-DIRIDX[st.dir] * POSE_CELL}px ${-poseRow * POSE_CELL}px`;
      applyFlip();
    };
    const showIdle = () => {
      unit.classList.add("idle");
      showPose(0);
    };
    const showWorking = () => {
      unit.classList.remove("idle");
      showPose(1);
    };

    const moveUnit = (x: number, y: number, dur?: number) => {
      const cx = parseFloat(unit.style.left) || 50;
      const cy = parseFloat(unit.style.top) || 60;
      const dx = x - cx, dy = y - cy;
      if (Math.abs(dx) >= Math.abs(dy)) {
        st.dir = "side";
        st.flip = dx > 0;
      } else {
        st.dir = dy < 0 ? "up" : "down";
        st.flip = false;
      }
      if (dur == null) {
        const d = Math.hypot(dx, dy);
        dur = Math.max(MIN_DUR, d / WALK_SPEED);
      }
      showWalk();
      unit.style.transition = `left ${dur}ms linear, top ${dur}ms linear`;
      unit.style.left = x + "%";
      unit.style.top = y + "%";
      if (arriveTimer) clearTimeout(arriveTimer);
      arriveTimer = setTimeout(() => {
        if (!workingRef.current) showIdle();
      }, dur);
      return dur;
    };

    const tick = () => {
      if (!workingRef.current) {
        const x = 18 + Math.random() * 64;
        const y = 42 + Math.random() * 40;
        moveUnit(x, y);
      }
      wanderTimer = setTimeout(tick, 2600 + Math.random() * 4200);
    };

    // posição inicial + idle + começa a perambular
    unit.style.left = "50%";
    unit.style.top = "62%";
    showIdle();
    wanderTimer = setTimeout(tick, 1200 + Math.random() * 2000);

    // expõe a API para os effects reativos
    ctrlRef.current = {
      // missão começou: caminha até o console e entra em pose de trabalho
      startWorking: () => {
        const w = room.work;
        const d = moveUnit(w.x, w.y);
        if (arriveTimer) clearTimeout(arriveTimer);
        arriveTimer = setTimeout(() => {
          st.dir = w.dir;
          st.flip = false;
          applyFlip();
          showWorking();
        }, d + 20);
      },
      // missão terminou: volta ao idle; o perambular reassume no próximo tick
      stopWorking: () => showIdle(),
      // re-aplica o cosmético (ao equipar/desequipar)
      refreshCosmetic: () => updateCosmetic(),
    };

    return () => {
      if (wanderTimer) clearTimeout(wanderTimer);
      if (arriveTimer) clearTimeout(arriveTimer);
      stopWalkAnim();
      ctrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // missão: vai ao console e trabalha; senão perambula (mesmo sendo o focado)
  useEffect(() => {
    if (isWorking) ctrlRef.current?.startWorking();
    else ctrlRef.current?.stopWorking();
  }, [isWorking]);

  // cosmético equipado mudou → re-aplica na camada do robô
  useEffect(() => {
    ctrlRef.current?.refreshCosmetic();
  }, [agent.equippedCosmetic]);

  return (
    <div
      ref={moduleRef}
      className={`ship-module ${isFocused ? "focused" : ""}`}
      style={
        {
          left: `${room.box.l}%`,
          top: `${room.box.t}%`,
          width: `${room.box.w}%`,
          height: `${room.box.h}%`,
          "--accent": accent,
          "--hue": hue,
        } as React.CSSProperties
      }
    >
      <div className="ship-particles">
        {particles.map((p, i) => (
          <i key={i} style={{ left: p.left, top: p.top, animationDelay: p.delay }} />
        ))}
      </div>
      <div
        ref={unitRef}
        className="ship-unit idle"
        style={{
          width: CELL,
          height: CELL,
          marginLeft: -CELL / 2,
          marginTop: -CELL / 2,
          left: "50%",
          top: "62%",
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(agent.slug);
        }}
      >
        <span className="ship-label">{agent.name}</span>
        <div className="ship-thought">
          <i />
          <i />
          <i />
        </div>
        <div
          className="ship-bot-wrap"
          style={{ "--bot-scale": scale } as React.CSSProperties}
        >
          <div ref={botRef} className="ship-bot" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={cosmeticRef} className="ship-cosmetic" alt="" />
        </div>
      </div>
    </div>
  );
}
