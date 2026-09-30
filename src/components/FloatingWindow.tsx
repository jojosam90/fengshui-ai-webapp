"use client";

import { useRef, useState } from "react";
import Icon from "./Icon";

/** 可拖动的浮窗（与罗盘浮窗同样大小与样式），点 × 关闭 */
export default function FloatingWindow({
  title,
  hint = "拖动移动",
  onClose,
  children,
}: {
  title: React.ReactNode;
  hint?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);
  const [pos, setPos] = useState(() =>
    typeof window === "undefined"
      ? { x: 16, y: 72 }
      : window.innerWidth >= 1024
        ? { x: window.innerWidth - 480 - 32, y: 96 }
        : { x: Math.max(8, (window.innerWidth - Math.min(480, window.innerWidth - 16)) / 2), y: 72 },
  );

  const clamp = (x: number, y: number) => {
    const w = box.current?.offsetWidth ?? 480;
    return {
      x: Math.min(Math.max(x, 8 - w + 80), window.innerWidth - 80),
      y: Math.min(Math.max(y, 8), window.innerHeight - 56),
    };
  };

  return (
    <div
      ref={box}
      role="dialog"
      aria-label={typeof title === "string" ? title : "浮窗"}
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest("button, a, input")) return;
        drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => drag.current && setPos(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy))}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      className="fade-up fixed z-[45] w-[30rem] max-w-[calc(100vw-1rem)] cursor-grab select-none rounded-2xl border border-gold/40 bg-card shadow-2xl active:cursor-grabbing"
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          {title}
          <span className="text-xs font-normal text-muted">· {hint}</span>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-card-2 hover:text-ink" aria-label="关闭">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>
      <div className="p-3">{children}</div>
    </div>
  );
}
