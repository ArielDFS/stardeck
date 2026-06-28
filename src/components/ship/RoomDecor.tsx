"use client";

import { useRosterStore } from "@/store/rosterStore";
import type { RoomBox } from "@/lib/ship/rooms";
import { GRID_COLS, GRID_ROWS, PROPS_PATH } from "@/lib/ship/props";

interface RoomDecorProps {
  cell: number;
  box: RoomBox;
  /** Escala dos props (1 = normal; <1 encolhe — "mais espaço"). */
  scale: number;
}

/**
 * Camada de decoração de uma sala: a grade de snap (visível só no modo
 * customização) e os props colocados. Renderizada atrás do robô.
 */
export function RoomDecor({ cell, box, scale }: RoomDecorProps) {
  const props = useRosterStore((s) => s.roomProps[cell]);

  return (
    <div
      className="absolute"
      style={{
        left: `${box.l}%`,
        top: `${box.t}%`,
        width: `${box.w}%`,
        height: `${box.h}%`,
      }}
    >
      <div
        className="ship-grid"
        style={{
          backgroundSize: `${100 / GRID_COLS}% 100%, 100% ${100 / GRID_ROWS}%`,
        }}
      />
      {(props ?? []).map((p) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.id}
          className="ship-prop"
          src={`${PROPS_PATH}${p.f}.png`}
          alt={p.f}
          draggable={false}
          data-cell={cell}
          data-prop-id={p.id}
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.w * scale}px`,
          }}
        />
      ))}
    </div>
  );
}
