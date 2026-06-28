"use client";

import { useEffect, useRef } from "react";
import { THRUSTERS } from "@/lib/ship/rooms";

interface ShipFXProps {
  /** Elemento da nave (para bob + ancorar os jatos dos propulsores). */
  shipRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Canvas de FX (portado do mockup): starfield direita→esquerda com parallax,
 * jatos aditivos nos propulsores e flutuação (bob) da nave.
 */
export function ShipFX({ shipRef }: ShipFXProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;

    const NSTARS = 300;
    const STAR_SPEED = 0.6;
    const JET_PER_FRAME = 4;

    let W = 0,
      H = 0,
      DPR = 1;
    function resize() {
      DPR = Math.min(2, window.devicePixelRatio || 1);
      cv!.width = innerWidth * DPR;
      cv!.height = innerHeight * DPR;
      W = cv!.width;
      H = cv!.height;
      cv!.style.width = innerWidth + "px";
      cv!.style.height = innerHeight + "px";
    }
    resize();
    addEventListener("resize", resize);

    const COLORS = [
      "#ffffff", "#ffffff", "#ffffff", "#ffffff",
      "#bfe9ff", "#cda6ff", "#ffe7a6", "#ffb3da",
    ];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);

    interface Star { x: number; y: number; z: number; r: number; c: string; }
    function mkStar(atRight: boolean): Star {
      return {
        x: atRight ? W + 2 : Math.random() * W,
        y: Math.random() * H,
        z: rnd(0.3, 2),
        r: rnd(0.4, 1.6) * DPR,
        c: COLORS[(Math.random() * COLORS.length) | 0],
      };
    }
    const stars: Star[] = [];
    for (let i = 0; i < NSTARS; i++) stars.push(mkStar(false));

    interface Jet { x: number; y: number; vx: number; vy: number; life: number; r: number; }
    const jets: Jet[] = [];
    let last = performance.now();
    let raf = 0;

    function frame(now: number) {
      const dt = Math.min(50, now - last);
      last = now;
      ctx!.clearRect(0, 0, W, H);

      const shipEl = shipRef.current;
      if (shipEl) {
        const bob = Math.sin(now * 0.0011) * 3.5;
        shipEl.style.transform = `translateY(${bob.toFixed(2)}px)`;
      }

      // estrelas: direita → esquerda (parallax)
      for (const s of stars) {
        s.x -= s.z * dt * STAR_SPEED * DPR;
        if (s.x < -3) Object.assign(s, mkStar(true));
        ctx!.globalAlpha = 0.45 + s.z * 0.22;
        ctx!.fillStyle = s.c;
        ctx!.beginPath();
        ctx!.arc(s.x, s.y, s.r, 0, 7);
        ctx!.fill();
        if (s.z > 1.3) {
          ctx!.globalAlpha *= 0.22;
          ctx!.fillRect(s.x, s.y - s.r * 0.4, s.z * 5 * DPR, s.r * 0.8);
        }
      }
      ctx!.globalAlpha = 1;

      // jatos dos propulsores (aditivo p/ glow)
      if (shipEl) {
        const r = shipEl.getBoundingClientRect();
        for (const t of THRUSTERS) {
          const ox = (r.left + (t.x / 100) * r.width) * DPR;
          const oy = (r.top + (t.y / 100) * r.height) * DPR;
          for (let k = 0; k < JET_PER_FRAME; k++)
            jets.push({
              x: ox, y: oy + rnd(-6, 6) * DPR,
              vx: -rnd(2.2, 5) * DPR, vy: rnd(-0.4, 0.4) * DPR,
              life: 1, r: rnd(1.4, 3.2) * DPR,
            });
        }
      }
      ctx!.globalCompositeOperation = "lighter";
      for (let i = jets.length - 1; i >= 0; i--) {
        const j = jets[i];
        j.x += j.vx * dt * 0.1;
        j.y += j.vy * dt * 0.1;
        j.life -= dt * 0.0017;
        if (j.life <= 0) {
          jets.splice(i, 1);
          continue;
        }
        ctx!.globalAlpha = Math.max(0, j.life);
        ctx!.fillStyle =
          j.life > 0.6 ? "#cffaff" : j.life > 0.32 ? "#00F5FF" : "#0a78ff";
        ctx!.beginPath();
        ctx!.arc(j.x, j.y, j.r * (0.4 + j.life * 0.8), 0, 7);
        ctx!.fill();
      }
      ctx!.globalCompositeOperation = "source-over";
      ctx!.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("resize", resize);
    };
  }, [shipRef]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-[1]"
    />
  );
}
