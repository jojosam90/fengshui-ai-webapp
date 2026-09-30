"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 悬停（桌面）或点按（手机）显示说明卡。说明卡固定显示在目标上方，并避开左右屏幕边缘；
 * 上方空间不足时限制高度。
 */
export default function HoverTip({
  tip,
  width = 340,
  label,
  className = "",
  children,
}: {
  tip: React.ReactNode;
  width?: number;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; bottom: number; maxH: number; arrow: number } | null>(null);

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const w = Math.min(width, window.innerWidth - 16);
    const center = r.left + r.width / 2;
    const left = Math.min(Math.max(8, center - w / 2), window.innerWidth - w - 8);
    setPos({ left, bottom: window.innerHeight - r.top + 10, maxH: r.top - 18, arrow: center - left });
  };
  const close = () => setPos(null);

  const opened = !!pos;
  useEffect(() => {
    if (!opened) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) {
        ref.current?.blur();
        close();
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", close, true);
    };
  }, [opened]);

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="button"
      aria-expanded={opened}
      aria-label={label}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      className={`cursor-help outline-none transition hover:bg-card-2 focus-visible:ring-2 focus-visible:ring-gold ${className}`}
    >
      {children}
      {pos && (
        <div
          role="tooltip"
          style={{ left: pos.left, bottom: pos.bottom, width: Math.min(width, window.innerWidth - 16), maxHeight: pos.maxH }}
          className="fade-up pointer-events-none fixed z-[60] rounded-2xl border border-gold/40 bg-card p-3.5 text-left text-sm leading-relaxed shadow-2xl"
        >
          <div className="max-h-full overflow-hidden">{tip}</div>
          {/* 指向目标的小箭头 */}
          <span
            className="absolute -bottom-[7px] h-3 w-3 -translate-x-1/2 rotate-45 border-b border-r border-gold/40 bg-card"
            style={{ left: pos.arrow }}
          />
        </div>
      )}
    </div>
  );
}
