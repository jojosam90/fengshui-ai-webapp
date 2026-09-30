"use client";

import { useMemo, useState } from "react";
import HourCell from "@/components/HourCell";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { ACTIVITIES, findGoodDays, getDayAlmanac, getMonthGrid } from "@/lib/almanac";
import { computeBazi } from "@/lib/bazi";
import { useProfile } from "@/lib/profile";
import { useCurrentZhi, useToday } from "@/lib/useToday";

function ZeRi({ today, onPick }: { today: Date; onPick: (d: Date) => void }) {
  const [profile] = useProfile();
  const [act, setAct] = useState(ACTIVITIES[1].key);
  const [range, setRange] = useState(60);
  const [avoid, setAvoid] = useState(true);
  const animal = useMemo(() => (profile ? computeBazi(profile).shengXiao : undefined), [profile]);
  const days = useMemo(
    () => findGoodDays(act, today, range, avoid ? animal : undefined),
    [act, today, range, avoid, animal],
  );

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:items-start lg:gap-5">
      <section className="card space-y-3 p-3.5 lg:sticky lg:top-6">
        <p className="text-sm text-muted">选择要办的事</p>
        <div className="flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => (
            <button
              key={a.key}
              onClick={() => setAct(a.key)}
              className={`rounded-full border px-3 py-1.5 text-sm ${act === a.key ? "border-cinnabar bg-cinnabar-soft font-semibold text-cinnabar" : "border-line bg-card"}`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <div className="flex items-center justify-between gap-2 text-sm">
          <div className="flex gap-1 rounded-lg bg-card-2 p-1">
            {[30, 60, 90].map((n) => (
              <button key={n} onClick={() => setRange(n)} className={`rounded-md px-2.5 py-1 ${range === n ? "bg-card shadow-sm" : "text-muted"}`}>
                {n}天
              </button>
            ))}
          </div>
          {animal && (
            <label className="flex items-center gap-1.5 text-muted">
              <input type="checkbox" checked={avoid} onChange={(e) => setAvoid(e.target.checked)} className="h-4 w-4 accent-[var(--cinnabar)]" />
              避开冲{animal}日
            </label>
          )}
        </div>
      </section>

      <div className="space-y-3 lg:col-span-2">
      <p className="text-sm text-muted">
        未来 {range} 天共 <b className="text-cinnabar">{days.length}</b> 个宜「{ACTIVITIES.find((a) => a.key === act)!.label}」的日子
      </p>
      <section className="card grid divide-y divide-line xl:grid-cols-2 xl:divide-y-0">
        {days.length === 0 && <p className="p-3.5 text-center text-sm text-muted">此期间暂无合适日子，可扩大范围</p>}
        {days.map((d) => (
          <button key={d.date.toISOString()} onClick={() => onPick(d.date)} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-card-2 active:bg-card-2 xl:border-b xl:border-line xl:odd:border-r">
            <div className="w-[4.75rem] shrink-0 text-center">
              <p className="whitespace-nowrap font-serif text-base font-bold leading-tight">{d.solarText}</p>
              <p className="text-xs text-muted">{d.weekText}</p>
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <p>
                农历{d.lunarText} · {d.ganZhiDay}日
              </p>
              <p className="text-xs text-muted">
                <span className={d.huangDao ? "text-good" : ""}>{d.tianShen}{d.huangDao ? "黄道" : "黑道"}</span> · {d.zhiXing}日 · {d.chong}
              </p>
            </div>
            <span className="shrink-0 text-sm tracking-tighter text-gold">{"★".repeat(d.stars)}<span className="text-line">{"★".repeat(5 - d.stars)}</span></span>
          </button>
        ))}
      </section>
      <p className="text-center text-xs text-muted">星级综合黄道吉日、建除十二神评定；重大事项建议结合个人八字再作斟酌</p>
      </div>
    </div>
  );
}

const WEEK = ["日", "一", "二", "三", "四", "五", "六"];
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function AlmanacPage() {
  const today = useToday();
  const nowZhi = useCurrentZhi();
  const [profile] = useProfile();
  const animal = useMemo(() => (profile ? computeBazi(profile).shengXiao : undefined), [profile]);
  const [picked, setPicked] = useState<Date | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [tab, setTab] = useState<"day" | "zeri">("day");

  const selected = picked ?? today;
  const ym = view ?? (today ? { y: today.getFullYear(), m: today.getMonth() + 1 } : null);
  const viewY = ym?.y;
  const viewM = ym?.m;
  const grid = useMemo(() => (viewY && viewM ? getMonthGrid(viewY, viewM) : []), [viewY, viewM]);
  const a = useMemo(() => (selected ? getDayAlmanac(selected) : null), [selected]);

  const shift = (delta: number) => {
    if (!ym) return;
    const d = new Date(ym.y, ym.m - 1 + delta, 1);
    setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
  };

  if (!today || !a || !ym) return <PageHeader title="黄历宜忌" back={false} />;
  const viewingToday = sameDay(a.date, today);

  return (
    <div className="space-y-4 lg:space-y-3">
      <PageHeader info="almanac" title="黄历宜忌" subtitle="每日宜忌 · 吉神方位 · 时辰吉凶 · 择日" back={false} />

      <div className="grid grid-cols-2 gap-2 rounded-xl bg-card-2 p-1 text-sm lg:max-w-sm">
        {([
          ["day", "每日黄历"],
          ["zeri", "择吉日"],
        ] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-lg py-2 font-medium ${tab === k ? "bg-card shadow-sm" : "text-muted"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "zeri" ? (
        <ZeRi
          today={today}
          onPick={(d) => {
            setPicked(d);
            setView({ y: d.getFullYear(), m: d.getMonth() + 1 });
            setTab("day");
            window.scrollTo({ top: 0 });
          }}
        />
      ) : (
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">

      {/* 月历 */}
      <section className="card p-3 lg:col-span-5 lg:px-3.5 lg:py-2.5">
        <div className="mb-1 flex items-center justify-between px-1">
          <button onClick={() => shift(-1)} className="rounded-full p-1.5 hover:bg-card-2" aria-label="上个月">
            <Icon name="back" className="h-5 w-5" />
          </button>
          <button
            className="font-serif text-lg font-bold"
            onClick={() => {
              setView(null);
              setPicked(null);
            }}
          >
            {ym.y}年{ym.m}月
          </button>
          <button onClick={() => shift(1)} className="rounded-full p-1.5 hover:bg-card-2" aria-label="下个月">
            <Icon name="chevron" className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-xs text-muted sm:mb-0.5">
          {WEEK.map((w) => <div key={w} className="py-1">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {grid.map((c) => {
            const isSel = sameDay(c.date, a.date);
            const isToday = sameDay(c.date, today);
            return (
              <button
                key={c.date.toISOString()}
                onClick={() => {
                  setPicked(c.date);
                  if (!c.inMonth) setView({ y: c.date.getFullYear(), m: c.date.getMonth() + 1 });
                }}
                className={`flex aspect-square flex-col items-center justify-center rounded-lg transition sm:aspect-auto sm:h-12 lg:h-11 ${
                  isSel ? "seal" : isToday ? "bg-cinnabar-soft" : "hover:bg-card-2"
                } ${c.inMonth ? "" : "opacity-35"}`}
              >
                <span className="text-xs font-semibold leading-none">{c.day}</span>
                <span className={`mt-1 max-w-full truncate px-0.5 text-xs leading-none ${isSel ? "" : c.isFestival ? "text-cinnabar" : "text-muted"}`}>
                  {c.lunarLabel}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 当日详情 */}
      <section className="card fade-up p-3.5 lg:col-span-7 lg:px-5 lg:py-3.5" key={a.solarText}>
        <div className="text-center">
          <p className="text-sm text-muted">{a.solarText} {a.weekText}</p>
          <p className="my-0.5 font-serif text-4xl font-bold text-cinnabar">{a.lunarMonthDay}</p>
          <p className="text-sm">
            {a.ganZhiYear}年 {a.ganZhiMonth}月 {a.ganZhiDay}日 · 属{a.shengXiao}
          </p>
          {a.festivals.length > 0 && <p className="mt-1 text-sm font-medium text-cinnabar">{a.festivals.join(" · ")}</p>}
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex gap-3 rounded-xl bg-good/10 px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-good font-serif text-lg font-bold text-white">宜</span>
            <p className="text-sm leading-relaxed">{a.yi.join("　")}</p>
          </div>
          <div className="flex gap-3 rounded-xl bg-bad/10 px-3 py-2">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-bad font-serif text-lg font-bold text-white">忌</span>
            <p className="text-sm leading-relaxed">{a.ji.join("　")}</p>
          </div>
        </div>

        <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
          {[
            ["冲煞", `${a.chong} ${a.sha}`],
            ["值神", `${a.tianShen}（${a.tianShenLuck}）`],
            ["建除十二神", `${a.zhiXing}日`],
            ["二十八宿", `${a.xiu}（${a.xiuLuck}）`],
            ["纳音", a.naYin],
            ["节气", `${a.jieQi} → ${a.nextJieQi.name} ${a.nextJieQi.date.slice(5)}`],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="text-xs text-muted">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-3.5 lg:col-span-5">
        <h2 className="mb-3 font-serif text-lg font-bold">吉神方位</h2>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ["喜神", a.xiShen],
            ["财神", a.caiShen],
            ["福神", a.fuShen],
            ["贵神", a.yangGui],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl bg-card-2 py-2.5">
              <p className="text-xs text-muted">{k}</p>
              <p className="font-serif text-lg font-bold text-gold">{v}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
          <div>
            <p className="mb-1 text-muted">吉神宜趋</p>
            <p>{a.jiShen.join(" ") || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-muted">凶煞宜忌</p>
            <p>{a.xiongSha.join(" ") || "—"}</p>
          </div>
        </div>
      </section>

      <section className="card p-3.5 lg:col-span-7">
        <h2 className="mb-3 font-serif text-lg font-bold">{viewingToday ? "今日时辰吉凶" : `${a.solarText} 时辰吉凶`}</h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 xl:grid-cols-6">
          {a.hours.map((h) => (
            <HourCell
              key={h.zhi}
              h={h}
              animal={animal}
              isNow={viewingToday && h.zhi === nowZhi}
              dim={h.luck !== "吉" && !(viewingToday && h.zhi === nowZhi)}
              className={`relative rounded-xl border py-2 text-center ${h.luck === "吉" ? "border-good/30 bg-good/10" : "border-line bg-card-2"} ${viewingToday && h.zhi === nowZhi ? "hour-now" : ""}`}
            >
              {viewingToday && h.zhi === nowZhi && (
                <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-1.5 text-xs font-bold leading-4 text-white shadow">此刻</span>
              )}
              <p className="font-serif font-bold">{h.zhi}时</p>
              <p className="whitespace-nowrap text-xs tabular-nums tracking-tight text-muted">{h.range}</p>
              <p className={`text-xs font-bold ${h.luck === "吉" ? "text-good" : "text-bad"}`}>{h.luck}</p>
            </HourCell>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted">彭祖百忌：{a.pengZu.join("；")}</p>
      </section>
      </div>
      )}
    </div>
  );
}
