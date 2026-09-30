"use client";

import { useEffect, useRef, useState } from "react";
import { type HourLuck, TIAN_SHEN_INFO } from "@/lib/almanac";

const W = 320;

/**
 * 时辰格：悬停（桌面）或点按（手机）显示详情卡——为什么吉/凶、宜做什么、忌做什么。
 * 详情卡为 fixed 定位，自动避开屏幕边缘。
 */
export default function HourCell({
  h,
  animal,
  isNow,
  dim,
  className,
  children,
}: {
  h: HourLuck;
  /** 用户生肖（时辰冲本命时提醒） */
  animal?: string;
  isNow?: boolean;
  /** 凶时辰淡化显示（只淡化格子内容，不影响详情卡） */
  dim?: boolean;
  className: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top?: number; bottom?: number; maxH: number } | null>(null);

  const open = () => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.min(Math.max(8, r.left + r.width / 2 - W / 2), window.innerWidth - W - 8);
    // 放在空间较大的一侧；空间不够时限制高度并可滚动
    const spaceBelow = window.innerHeight - r.bottom - 16;
    const spaceAbove = r.top - 16;
    const below = spaceBelow >= 420 || spaceBelow >= spaceAbove;
    setPos(
      below
        ? { left, top: r.bottom + 8, maxH: spaceBelow }
        : { left, bottom: window.innerHeight - r.top + 8, maxH: spaceAbove },
    );
  };
  const close = () => setPos(null);

  // 点其他地方或滚动页面时关闭（手机上点空白处不一定会让格子失焦）
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

  const info = TIAN_SHEN_INFO[h.tianShen];
  const clash = animal && h.chongAnimal === animal;

  return (
    <div
      ref={ref}
      tabIndex={0}
      role="button"
      aria-expanded={!!pos}
      aria-label={`${h.zhi}时 ${h.range} ${h.luck}，查看详情`}
      onMouseEnter={open}
      onMouseLeave={close}
      onFocus={open}
      onBlur={close}
      className={`${className} cursor-pointer outline-none transition hover:ring-2 hover:ring-gold/50 focus-visible:ring-2 focus-visible:ring-gold`}
    >
      <div className={dim ? "opacity-60" : ""}>{children}</div>

      {pos && (
        <div
          role="tooltip"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, width: W, maxWidth: "calc(100vw - 16px)", maxHeight: pos.maxH }}
          className="fade-up pointer-events-none fixed overflow-hidden z-[60] rounded-2xl border border-gold/40 bg-card p-3.5 text-left text-sm shadow-2xl"
        >
          <div className="flex items-baseline justify-between gap-2">
            <p className="font-serif text-lg font-bold">
              {h.zhi}时 <span className="text-sm font-normal text-muted">{h.ganZhi} · {h.range}</span>
            </p>
            <span className={`shrink-0 rounded-md px-2 py-0.5 text-sm font-bold text-white ${h.luck === "吉" ? "bg-good" : "bg-bad"}`}>
              {h.luck}
            </span>
          </div>
          {isNow && <p className="mt-1 text-sm font-semibold text-gold">● 此刻正值此时辰</p>}

          <p className="mt-2 leading-relaxed">
            <b className={h.huangDao ? "text-good" : "text-bad"}>
              值神{h.tianShen}（{h.huangDao ? "黄道" : "黑道"}）
            </b>
            ：{info?.why}
          </p>
          <p className="mt-1 leading-relaxed text-muted">{info?.tip}</p>

          <div className="mt-2.5 space-y-1.5">
            <p className="rounded-lg bg-good/10 px-2.5 py-1.5 leading-relaxed">
              <b className="text-good">宜</b>　{h.yi.length ? h.yi.join("、") : "无特别宜事"}
            </p>
            <p className="rounded-lg bg-bad/10 px-2.5 py-1.5 leading-relaxed">
              <b className="text-bad">忌</b>　{h.ji.length ? h.ji.join("、") : "无特别忌事"}
            </p>
          </div>

          <p className="mt-2 text-muted">
            冲{h.chong} · 煞{h.sha} · 喜神{h.xiShen} · 财神{h.caiShen}
          </p>
          {clash && (
            <p className="mt-1.5 rounded-lg bg-bad/10 px-2.5 py-1.5 font-semibold text-bad">
              此时辰冲属{animal}，与您相冲，重要事情尽量避开。
            </p>
          )}
        </div>
      )}
    </div>
  );
}
