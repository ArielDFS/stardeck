"use client";

import { useEffect, useRef } from "react";
import { useShipStore } from "@/store/shipStore";
import { useRosterStore } from "@/store/rosterStore";
import { ROOMS, type RoomBox } from "@/lib/ship/rooms";
import {
  PROPS_LIST, PROPS_PATH, GRID_COLS, GRID_ROWS, propWidth, snap,
} from "@/lib/ship/props";

interface ShipBuilderProps {
  shipRef: React.RefObject<HTMLDivElement | null>;
}

interface Hit {
  cell: number;
  box: RoomBox;
}

/**
 * Modo de customização da nave (ADR-0010): paleta de props + arrastar/soltar
 * com snap na grade. Soltar numa sala adiciona/move; soltar fora apaga.
 * Lógica portada do build mode do mockup — agora feature do usuário.
 */
export function ShipBuilder({ shipRef }: ShipBuilderProps) {
  const buildMode = useShipStore((s) => s.buildMode);
  const shipZoom = useRosterStore((s) => s.shipZoom);
  const addProp = useRosterStore((s) => s.addProp);
  const moveProp = useRosterStore((s) => s.moveProp);
  const movePropToCell = useRosterStore((s) => s.movePropToCell);
  const removeProp = useRosterStore((s) => s.removeProp);

  const spawnRef = useRef<string | null>(null);
  const ghostRef = useRef<HTMLImageElement | null>(null);
  const dragRef = useRef<{ el: HTMLElement; cell: number; id: string } | null>(
    null,
  );

  // hit-test: célula sob um ponto da tela (via % do render)
  const moduleAt = (cx: number, cy: number): Hit | null => {
    const r = shipRef.current?.getBoundingClientRect();
    if (!r) return null;
    const px = ((cx - r.left) / r.width) * 100;
    const py = ((cy - r.top) / r.height) * 100;
    for (let i = ROOMS.length - 1; i >= 0; i--) {
      const b = ROOMS[i].box;
      if (px >= b.l && px <= b.l + b.w && py >= b.t && py <= b.t + b.h)
        return { cell: i, box: b };
    }
    return null;
  };
  // % local dentro de uma sala
  const pctIn = (box: RoomBox, cx: number, cy: number) => {
    const r = shipRef.current!.getBoundingClientRect();
    const px = ((cx - r.left) / r.width) * 100;
    const py = ((cy - r.top) / r.height) * 100;
    return { x: ((px - box.l) / box.w) * 100, y: ((py - box.t) / box.h) * 100 };
  };

  useEffect(() => {
    if (!buildMode) return;

    const moveGhost = (x: number, y: number) => {
      if (ghostRef.current) {
        ghostRef.current.style.left = x + "px";
        ghostRef.current.style.top = y + "px";
      }
    };

    const onDown = (e: MouseEvent) => {
      if (spawnRef.current) return;
      const t = e.target as HTMLElement;
      if (t.closest(".pal-item")) return; // tratado no React
      const el = t.closest(".ship-prop") as HTMLElement | null;
      if (!el) return;
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = {
        el,
        cell: Number(el.dataset.cell),
        id: el.dataset.propId!,
      };
      el.classList.add("dragging");
    };

    const onMove = (e: MouseEvent) => {
      if (spawnRef.current) {
        moveGhost(e.clientX, e.clientY);
        return;
      }
      const drag = dragRef.current;
      if (!drag) return;
      const box = ROOMS[drag.cell].box;
      const p = pctIn(box, e.clientX, e.clientY);
      drag.el.style.left = p.x.toFixed(1) + "%";
      drag.el.style.top = p.y.toFixed(1) + "%";
    };

    const onUp = (e: MouseEvent) => {
      const hit = moduleAt(e.clientX, e.clientY);
      // soltar item da paleta
      if (spawnRef.current) {
        if (hit) {
          const pos = pctIn(hit.box, e.clientX, e.clientY);
          addProp(
            hit.cell,
            spawnRef.current,
            snap(pos.x, GRID_COLS),
            snap(pos.y, GRID_ROWS),
          );
        }
        ghostRef.current?.remove();
        ghostRef.current = null;
        spawnRef.current = null;
        return;
      }
      // soltar um prop existente
      const drag = dragRef.current;
      if (!drag) return;
      drag.el.classList.remove("dragging");
      if (!hit) {
        removeProp(drag.cell, drag.id); // fora de qualquer sala → apaga
      } else {
        const pos = pctIn(hit.box, e.clientX, e.clientY);
        const sx = snap(pos.x, GRID_COLS);
        const sy = snap(pos.y, GRID_ROWS);
        if (hit.cell === drag.cell) moveProp(drag.cell, drag.id, sx, sy);
        else movePropToCell(drag.cell, hit.cell, drag.id, sx, sy);
      }
      dragRef.current = null;
    };

    document.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      ghostRef.current?.remove();
      ghostRef.current = null;
      spawnRef.current = null;
      dragRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buildMode]);

  // iniciar spawn de um prop da paleta
  const startSpawn = (f: string, e: React.MouseEvent) => {
    e.preventDefault();
    spawnRef.current = f;
    const g = document.createElement("img");
    g.className = "prop-ghost";
    g.src = `${PROPS_PATH}${f}.png`;
    g.style.width = propWidth(f) / shipZoom + "px";
    g.style.left = e.clientX + "px";
    g.style.top = e.clientY + "px";
    document.body.appendChild(g);
    ghostRef.current = g;
  };

  if (!buildMode) return null;

  return (
    <div className="prop-palette">
      {PROPS_LIST.map((f) => (
        <div
          key={f}
          className="pal-item"
          title={f}
          onMouseDown={(e) => startSpawn(f, e)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${PROPS_PATH}${f}.png`} alt={f} />
          <span>{f}</span>
        </div>
      ))}
    </div>
  );
}
