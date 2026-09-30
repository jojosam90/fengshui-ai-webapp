"use client";

import Link from "next/link";
import { useMemo, useRef } from "react";
import Icon from "./Icon";
import Luopan from "./Luopan";
import { getDayAlmanac } from "@/lib/almanac";
import { godMarkers, mountainAt, useHeading } from "@/lib/compass";
import { useToday } from "@/lib/useToday";

export interface Point {
  x: number;
  y: number;
}

/** 可自由拖动的罗盘浮窗：不遮挡页面操作，点 × 关闭 */
export default function FloatingCompass({
  pos,
  onMove,
  onClose,
}: {
  pos: Point;
  onMove: (p: Point) => void;
  onClose: () => void;
}) {
  const today = useToday();
  const markers = useMemo(() => {
    if (!today) return [];
    const a = getDayAlmanac(today);
    return godMarkers(a.xiShen, a.caiShen, a.fuShen);
  }, [today]);
  const { heading, state, enable } = useHeading();
  const facing = heading ?? 0;
  const live = state === "on" && heading != null;

  const box = useRef<HTMLDivElement>(null);
  const drag = useRef<{ dx: number; dy: number } | null>(null);

  const clamp = (x: number, y: number): Point => {
    const w = box.current?.offsetWidth ?? 480;
    return {
      x: Math.min(Math.max(x, 8 - w + 80), window.innerWidth - 80),
      y: Math.min(Math.max(y, 8), window.innerHeight - 56),
    };
  };

  const onPointerDown = (e: React.PointerEvent) => {
    // 按钮、链接等仍可正常点击
    if ((e.target as HTMLElement).closest("button, a, input")) return;
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    onMove(clamp(e.clientX - drag.current.dx, e.clientY - drag.current.dy));
  };
  const endDrag = () => {
    drag.current = null;
  };

  return (
    <div
      ref={box}
      role="dialog"
      aria-label="罗盘（可拖动）"
      style={{ left: pos.x, top: pos.y, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className="fade-up fixed z-[45] w-[30rem] max-w-[calc(100vw-1rem)] cursor-grab select-none rounded-2xl border border-gold/40 bg-card shadow-2xl active:cursor-grabbing"
    >
      <div className="flex items-center justify-between border-b border-line px-3 py-2">
        <div className="flex items-center gap-1.5 text-sm font-semibold">
          <Icon name="compass" className="h-4 w-4 text-gold" />
          罗盘
          <span className="text-xs font-normal text-muted">· 拖动移动</span>
        </div>
        <button onClick={onClose} className="rounded-full p-1 text-muted hover:bg-card-2 hover:text-ink" aria-label="关闭罗盘">
          <Icon name="close" className="h-5 w-5" />
        </button>
      </div>

      <div className="p-3">
        <Luopan markers={markers} rotation={-facing} className="pointer-events-none mx-auto aspect-square w-full max-w-[26rem]" />

        <div className="mt-2 flex items-center justify-between gap-2 text-xs">
          {live ? (
            <p>
              朝向 <b className="font-serif text-base tabular-nums">{Math.round(facing)}°</b> · 坐
              <b className="text-cinnabar">{mountainAt(facing + 180).name}</b>向<b className="text-cinnabar">{mountainAt(facing).name}</b>
            </p>
          ) : (
            <ul className="flex flex-wrap gap-x-2.5 gap-y-0.5">
              {markers.map((m) => (
                <li key={m.label} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: m.color }} />
                  {m.label}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-2.5">
          {live ? (
            <Link href={`/fengshui?tab=house&sit=${mountainAt(facing + 180).name}`} className="btn-primary block text-center text-sm">
              以此坐向排宅盘
            </Link>
          ) : (
            <button onClick={() => void enable()} className="btn-ghost w-full text-sm">
              开启指南针（手机）
            </button>
          )}
          <p className="mt-1.5 text-xs leading-snug text-muted">
            {state === "denied"
              ? "未获授权，请在浏览器设置中允许「动作与方向」。"
              : state === "unsupported"
                ? "此设备不支持方向传感器，请用手机打开。"
                : state === "on" && heading == null
                  ? "等待传感器数据…（需在 HTTPS 下使用）"
                  : live
                    ? "红色三角为手机朝向；站在屋内面向大门测量。"
                    : "北朝上 · 圆点为今日吉神方位。"}
          </p>
        </div>
      </div>
    </div>
  );
}
