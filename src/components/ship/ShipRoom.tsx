"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AgentInstance } from "@/types/agent";
import type { BotDir, RoomDef } from "@/lib/ship/rooms";
import {
  CELL, POSE_CELL, WALK_COLS, WALK_ROWS, POSE_COLS, POSE_ROWS,
  WALK_FRAMES, DIRIDX, SPEED_PX_S, STRIDE_PX, ACCEL_MS,
  WALK_SHEET, POSE_SHEET,
} from "@/lib/ship/rooms";
import { hueRotateDeg } from "@/lib/ship/recolor";
import { roleGlyph, twemojiUrl, IDLE_LOOK, IDLE_DOZE } from "@/lib/ship/expressions";

/** Sinal de Reação efêmera vindo do maestro (ShipView). `nonce` força reanimar. */
export interface ReactionSignal {
  emoji: string;
  nonce: number;
}

interface ShipRoomProps {
  agent: AgentInstance;
  room: RoomDef;
  isFocused: boolean;
  isWorking: boolean;
  onSelect: (slug: string) => void;
  /** Escala do robô (1 = normal; <1 encolhe — "mais espaço"). */
  scale: number;
  /** Reação (emoji) a tocar na bolha; null = nenhuma (ADR-0013). */
  reaction: ReactionSignal | null;
}

interface BotState {
  x: number; // posição viva (% do módulo) — fonte da verdade, não lida do style
  y: number;
  dir: BotDir;
  flip: boolean;
  frame: number;
}

/** Movimento em curso, integrado pelo loop rAF (ADR-0012). */
interface Move {
  sx: number; sy: number; // origem (%)
  tx: number; ty: number; // destino (%)
  dist: number;           // distância total do trajeto (px reais)
  T: number;              // duração total (ms)
  ta: number;             // duração da rampa de aceleração (ms)
  tCruise: number;        // duração do cruzeiro (ms)
  tp: number;             // tempo até o pico (perfil triangular, ms)
  vmax: number;           // velocidade de cruzeiro (px/ms)
  accel: number;          // aceleração (px/ms²)
  trap: boolean;          // true = trapézio; false = triângulo (move curto)
  t0: number;             // performance.now() no início
  sPrev: number;          // distância percorrida no frame anterior (px)
  onArrive?: () => void;
}

/**
 * Uma sala da nave: bounds invisíveis + robô que perambula em rajadas (idle),
 * caminha até o console ao ser focado e entra em pose de trabalho durante a
 * missão. Locomoção por loop rAF — cadência por distância, velocidade
 * trapezoidal, posição em estado próprio (ADR-0012).
 */
export function ShipRoom({
  agent,
  room,
  isFocused,
  isWorking,
  onSelect,
  scale,
  reaction,
}: ShipRoomProps) {
  const moduleRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);
  const botRef = useRef<HTMLDivElement>(null);
  const ctrlRef = useRef<{
    startWorking: () => void;
    stopWorking: () => void;
  } | null>(null);

  // Bolha de expressão (ADR-0013): null = pontinhos "..."; senão um emoji.
  // Reações (evento) preemptam o sabor de idle por um tempo travado.
  const [expr, setExpr] = useState<string | null>(null);
  const exprCtrlRef = useRef<{ react: (emoji: string) => void } | null>(null);
  const glyph = useMemo(
    () => roleGlyph(agent.role, agent.slug),
    [agent.role, agent.slug],
  );
  const glyphRef = useRef(glyph);
  glyphRef.current = glyph;

  // estado vivo lido pelos timers: perambula quando NÃO está em missão.
  const workingRef = useRef(isWorking);
  workingRef.current = isWorking;

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
    const module = moduleRef.current;
    const unit = unitRef.current;
    const bot = botRef.current;
    if (!module || !unit || !bot) return;

    const st: BotState = { x: 50, y: 62, dir: "down", flip: false, frame: 0 };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // tamanho do módulo em px reais — base da cadência/velocidade em pixels.
    const size = { w: 1, h: 1 };
    const measure = () => {
      const r = module.getBoundingClientRect();
      if (r.width) size.w = r.width;
      if (r.height) size.h = r.height;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(module);

    let move: Move | null = null;
    let raf: number | null = null;
    let strideAcc = 0; // px percorridos desde o último avanço de frame
    let wanderTimer: ReturnType<typeof setTimeout> | null = null;
    let idleExprTimer: ReturnType<typeof setTimeout> | null = null;

    // ---- Bolha de expressão (ADR-0013) ----
    // lockUntil: enquanto > now, uma Reação detém a bolha e o idle não a toca.
    let exprLock = 0;
    let exprRevert: ReturnType<typeof setTimeout> | null = null;
    const showExpr = (emoji: string, ttl: number, isReaction: boolean) => {
      const now = Date.now();
      if (!isReaction && now < exprLock) return; // reação ainda manda
      if (isReaction) exprLock = now + ttl;
      if (exprRevert) clearTimeout(exprRevert);
      setExpr(emoji);
      exprRevert = setTimeout(() => {
        setExpr(null);
        exprRevert = null;
      }, ttl);
    };
    // exposto ao effect de Reação (fora deste closure)
    exprCtrlRef.current = {
      react: (emoji) => showExpr(emoji, 1900, true),
    };
    // sabor de idle ocasional: glifo temático, "olhar em volta" ou cochilar.
    const scheduleIdleExpr = () => {
      idleExprTimer = setTimeout(
        () => {
          if (!workingRef.current && Date.now() >= exprLock) {
            const roll = Math.random();
            const emoji =
              roll < 0.55 ? glyphRef.current : roll < 0.8 ? IDLE_LOOK : IDLE_DOZE;
            showExpr(emoji, 2400, false);
          }
          scheduleIdleExpr();
        },
        5000 + Math.random() * 5000,
      );
    };

    // ---- visuais do sprite ----
    const applyFlip = () => {
      bot.style.transform = `translate(-50%,-50%) scaleX(${st.dir === "side" && st.flip ? -1 : 1})`;
    };
    const setWalkCell = () => {
      bot.style.backgroundPosition = `${-st.frame * CELL}px ${-DIRIDX[st.dir] * CELL}px`;
    };
    const setUnitPos = () => {
      unit.style.left = st.x + "%";
      unit.style.top = st.y + "%";
    };
    const showWalk = () => {
      unit.classList.remove("idle");
      bot.style.backgroundImage = `url(${WALK_SHEET})`;
      bot.style.width = CELL + "px";
      bot.style.height = CELL + "px";
      bot.style.backgroundSize = `${WALK_COLS * CELL}px ${WALK_ROWS * CELL}px`;
      applyFlip();
      setWalkCell();
    };
    const showPose = (poseRow: number) => {
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

    // ---- perfil de velocidade trapezoidal: distância percorrida em t ms ----
    const distAt = (m: Move, t: number): number => {
      if (t >= m.T) return m.dist;
      if (t <= 0) return 0;
      if (m.trap) {
        const dAcc = 0.5 * m.vmax * m.ta;
        if (t < m.ta) return 0.5 * m.accel * t * t;
        if (t < m.ta + m.tCruise) return dAcc + m.vmax * (t - m.ta);
        const td = t - m.ta - m.tCruise;
        return dAcc + m.vmax * m.tCruise + m.vmax * td - 0.5 * m.accel * td * td;
      }
      // triangular (move curto demais para atingir cruzeiro)
      if (t < m.tp) return 0.5 * m.accel * t * t;
      const tr = m.T - t;
      return m.dist - 0.5 * m.accel * tr * tr;
    };

    const cancelMove = () => {
      move = null;
      if (raf != null) cancelAnimationFrame(raf);
      raf = null;
      strideAcc = 0;
    };

    const frame = (now: number) => {
      if (!move) { raf = null; return; }
      const t = now - move.t0;
      const s = distAt(move, t);
      const frac = move.dist > 0 ? s / move.dist : 1;
      st.x = move.sx + (move.tx - move.sx) * frac;
      st.y = move.sy + (move.ty - move.sy) * frac;
      setUnitPos();
      // cadência por distância: avança o frame a cada STRIDE_PX percorridos
      strideAcc += Math.max(0, s - move.sPrev);
      move.sPrev = s;
      while (strideAcc >= STRIDE_PX) {
        st.frame = (st.frame + 1) % WALK_FRAMES;
        strideAcc -= STRIDE_PX;
      }
      setWalkCell();
      if (t >= move.T) {
        st.x = move.tx; st.y = move.ty;
        setUnitPos();
        const cb = move.onArrive;
        cancelMove();
        // NÃO reseta st.frame: a passada continua de onde parou no próximo
        // movimento → o ciclo de 6 frames aparece inteiro ao longo do tempo.
        cb?.();
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    // inicia um deslocamento até (tx,ty) em % do módulo; origem = posição viva.
    const startMove = (tx: number, ty: number, onArrive?: () => void) => {
      const dxpx = ((tx - st.x) / 100) * size.w;
      const dypx = ((ty - st.y) / 100) * size.h;
      // direção pelo eixo dominante em PIXELS (módulo não é quadrado)
      if (Math.abs(dxpx) >= Math.abs(dypx)) {
        st.dir = "side";
        st.flip = dxpx > 0;
      } else {
        st.dir = dypx < 0 ? "up" : "down";
        st.flip = false;
      }
      const dist = Math.hypot(dxpx, dypx);
      if (reduce || dist < 0.5) {
        // movimento reduzido ou trajeto desprezível: teleporta
        st.x = tx; st.y = ty;
        setUnitPos();
        onArrive?.();
        return;
      }
      const vmax = SPEED_PX_S / 1000; // px/ms
      const ta = ACCEL_MS;
      const accel = vmax / ta;
      const dAcc = 0.5 * vmax * ta;
      let T: number, tCruise = 0, tp = 0, trap: boolean;
      if (dist >= 2 * dAcc) {
        trap = true;
        tCruise = (dist - 2 * dAcc) / vmax;
        T = 2 * ta + tCruise;
      } else {
        trap = false;
        const vp = Math.sqrt(accel * dist);
        tp = vp / accel;
        T = 2 * tp;
      }
      cancelMove();
      move = { sx: st.x, sy: st.y, tx, ty, dist, T, ta, tCruise, tp, vmax, accel, trap, t0: performance.now(), sPrev: 0, onArrive };
      showWalk();
      raf = requestAnimationFrame(frame);
    };

    const tick = () => {
      if (!workingRef.current && !move) {
        const x = 18 + Math.random() * 64;
        const y = 42 + Math.random() * 40;
        startMove(x, y, () => { if (!workingRef.current) showIdle(); });
      }
      wanderTimer = setTimeout(tick, 2600 + Math.random() * 4200);
    };

    // posição inicial + idle + começa a perambular (exceto reduced-motion)
    setUnitPos();
    showIdle();
    if (!reduce) {
      wanderTimer = setTimeout(tick, 1200 + Math.random() * 2000);
      scheduleIdleExpr();
    }

    // expõe a API para os effects reativos
    ctrlRef.current = {
      // missão começou: caminha até o console e entra em pose de trabalho
      startWorking: () => {
        const w = room.work;
        startMove(w.x, w.y, () => {
          st.dir = w.dir;
          st.flip = false;
          applyFlip();
          showWorking();
        });
      },
      // missão terminou: para onde estiver e volta ao idle; o perambular reassume.
      stopWorking: () => {
        cancelMove();
        showIdle();
      },
    };

    return () => {
      if (wanderTimer) clearTimeout(wanderTimer);
      if (idleExprTimer) clearTimeout(idleExprTimer);
      if (exprRevert) clearTimeout(exprRevert);
      cancelMove();
      ro.disconnect();
      ctrlRef.current = null;
      exprCtrlRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // missão: vai ao console e trabalha; senão perambula (mesmo sendo o focado)
  useEffect(() => {
    if (isWorking) ctrlRef.current?.startWorking();
    else ctrlRef.current?.stopWorking();
  }, [isWorking]);

  // Reação (ADR-0013): o maestro manda um emoji por nonce → toca na bolha.
  useEffect(() => {
    if (reaction) exprCtrlRef.current?.react(reaction.emoji);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reaction?.nonce]);

  return (
    <div
      ref={moduleRef}
      className={`ship-module ${isFocused ? "focused" : ""} ${isWorking ? "working" : ""}`}
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
      <div className="ship-roomglow" />
      <div className="ship-particles">
        {particles.map((p, i) => (
          <i key={i} style={{ left: p.left, top: p.top, animationDelay: p.delay }} />
        ))}
      </div>
      <div
        ref={unitRef}
        className="ship-unit idle"
        // left/top são dirigidos imperativamente pelo loop rAF (não no inline,
        // senão um re-render do React reverteria a posição). ADR-0012.
        style={{
          width: CELL,
          height: CELL,
          marginLeft: -CELL / 2,
          marginTop: -CELL / 2,
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(agent.slug);
        }}
      >
        <span className="ship-label">{agent.name}</span>
        {/* Bolha de expressão: emoji (Reação/sabor) ou os pontinhos de idle. */}
        <div className={`ship-thought ${expr ? "expr" : ""}`}>
          {expr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="ship-emoji" src={twemojiUrl(expr)} alt="" draggable={false} />
          ) : (
            <>
              <i />
              <i />
              <i />
            </>
          )}
        </div>
        <div
          className="ship-bot-wrap"
          style={{ "--bot-scale": scale } as React.CSSProperties}
        >
          <div className="ship-shadow" />
          <div ref={botRef} className="ship-bot" />
        </div>
      </div>
    </div>
  );
}
