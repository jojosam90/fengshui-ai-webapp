"use client";

import { useState } from "react";

export interface MonthDatum {
  label: string;
  /** 公历月份，如「2月」 */
  num: string;
  sub: string;
  value: number;
  note: string;
}

const GRID = [25, 50, 75, 100];

/** 单系列柱状图：12 个流月评分，高亮当前月，悬停/点按显示详情 */
export default function MonthChart({ data, current }: { data: MonthDatum[]; current: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? current;
  const d = data[shown];

  return (
    <div>
      <div className="relative h-44 pl-7 sm:h-48 lg:h-44">
        {/* 网格线与刻度 */}
        {GRID.map((g) => (
          <div key={g} className="pointer-events-none absolute inset-x-0 left-7 border-t border-line/70" style={{ bottom: `${g}%` }}>
            <span className="absolute -left-7 -top-2 w-6 text-right text-xs tabular-nums text-muted">{g}</span>
          </div>
        ))}
        <div className="absolute inset-x-0 bottom-0 left-7 border-t border-line" />

        <div className="relative flex h-full items-end gap-[2px] sm:gap-1">
          {data.map((m, i) => {
            const isCur = i === current;
            const isHover = i === hover;
            return (
              <button
                key={m.label}
                type="button"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => setHover(i)}
                className="group relative flex h-full flex-1 items-end justify-center outline-none"
                aria-label={`${m.label}（${m.num}） ${m.sub}：${m.value}分`}
              >
                <div
                  className={`w-full max-w-7 rounded-t-[4px] transition-colors ${
                    isCur ? "bg-cinnabar" : isHover ? "bg-gold" : "bg-gold/45"
                  }`}
                  style={{ height: `${m.value}%` }}
                />
                {isCur && (
                  <span className="absolute text-xs font-bold tabular-nums text-ink" style={{ bottom: `calc(${m.value}% + 2px)` }}>
                    {m.value}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-1.5 flex gap-[2px] pl-7 sm:gap-1">
        {data.map((m, i) => (
          <span key={m.label} className={`flex-1 text-center text-xs leading-tight ${i === current ? "font-bold text-cinnabar" : "text-muted"}`}>
            {/* 手机：每列约 25px，只显示地支与月份数字；平板以上显示完整标签 */}
            <span className="sm:hidden">{m.label[0]}</span>
            <span className="hidden sm:inline">{m.label}</span>
            <span className="block whitespace-nowrap">
              <span className="sm:hidden">{parseInt(m.num, 10)}</span>
              <span className="hidden sm:inline">({m.num})</span>
            </span>
          </span>
        ))}
      </div>

      {/* 详情（悬停提示的常驻版，手机上同样可读） */}
      <div className="mt-3 flex items-start gap-3 rounded-xl bg-card-2 p-3 text-sm" aria-live="polite">
        <span className="font-serif text-2xl font-bold tabular-nums">{d.value}</span>
        <div className="min-w-0">
          <p className="font-semibold">
            {d.label}（{d.num}） · {d.sub}
            {shown === current && <span className="ml-1.5 whitespace-nowrap rounded bg-cinnabar px-1 text-xs text-white">本月</span>}
          </p>
          <p className="text-xs text-muted">{d.note}</p>
        </div>
      </div>
    </div>
  );
}
