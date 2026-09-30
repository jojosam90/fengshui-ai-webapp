"use client";

import { useMemo, useState } from "react";
import PageHeader from "@/components/PageHeader";
import ProfileGate from "@/components/ProfileGate";
import { type BirthInfo, computeBazi } from "@/lib/bazi";
import { daYunEval, liuNianOf, liuNianYear, liuYueOf } from "@/lib/luck";
import { useToday } from "@/lib/useToday";
import { wealthAnalysis } from "@/lib/wealth";
import { yearlyWealthPalaces } from "@/lib/ziwei";
import { wxText } from "@/components/WuxingBars";

const scoreTone = (s: number) => (s >= 80 ? "bg-good" : s >= 65 ? "bg-gold" : s >= 55 ? "bg-earth/70" : "bg-bad");
const scoreText = (s: number) => (s >= 80 ? "text-good" : s >= 65 ? "text-gold" : s >= 55 ? "text-earth" : "text-bad");

function LuckView({ profile, today }: { profile: BirthInfo; today: Date }) {
  const bazi = useMemo(() => computeBazi(profile), [profile]);
  const dayun = useMemo(() => daYunEval(bazi), [bazi]);
  // 流年以立春为界，跨年（立春）后自动切换
  const thisYear = useMemo(() => liuNianYear(today), [today]);
  const curIdx = Math.max(0, dayun.findIndex((d) => thisYear >= d.startYear && thisYear <= d.endYear));

  // 选择只在当年有效：跨年后自动回到当前大运 / 今年
  const [dPick, setDPick] = useState<{ year: number; idx: number } | null>(null);
  const dIdx = dPick?.year === thisYear ? dPick.idx : curIdx;
  const setDIdx = (idx: number) => setDPick({ year: thisYear, idx });
  const d = dayun[dIdx];
  // 流年只显示：去年、今年、明年
  const years = useMemo(() => liuNianOf(bazi, thisYear - 1, thisYear + 1), [bazi, thisYear]);
  // 求财时机看得更远：今年起未来五年
  const wealthYears = useMemo(() => liuNianOf(bazi, thisYear, thisYear + 5), [bazi, thisYear]);
  const [yPick, setYPick] = useState<{ year: number; value: number } | null>(null);
  const year = yPick?.year === thisYear ? yPick.value : thisYear;
  const setYear = (value: number) => setYPick({ year: thisYear, value });
  const activeYear = years.some((y) => y.year === year) ? year : thisYear;
  const ln = years.find((y) => y.year === activeYear)!;
  const dayunOf = (y: number) => dayun.find((x) => y >= x.startYear && y <= x.endYear);
  const lnDayun = dayunOf(activeYear) ?? d;
  const months = useMemo(() => liuYueOf(bazi, activeYear), [bazi, activeYear]);
  const [mIdx, setMIdx] = useState<number | null>(null);
  const month = mIdx === null ? null : months[mIdx];
  const yPalaces = useMemo(() => yearlyWealthPalaces(profile, activeYear), [profile, activeYear]);
  const wealth = useMemo(() => wealthAnalysis(bazi, wealthYears, months, thisYear), [bazi, wealthYears, months, thisYear]);


  return (
    <div className="space-y-3">
      <PageHeader info="luck" title="大运 · 流年 · 流月" subtitle={`${profile.name ?? "我"} · 日主${bazi.dayMaster}${bazi.dayMasterWx} · 喜${bazi.favorable.join("")}`} />

      {/* 大运 */}
      <section>
        <h2 className="mb-1 font-serif text-lg font-bold">十年大运</h2>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 pt-2 md:-mx-6 md:px-6 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0">
          {dayun.map((x, i) => (
            <button
              key={x.ganZhi}
              onClick={() => {
                setDIdx(i);
                setMIdx(null);
              }}
              className={`relative w-[4.6rem] shrink-0 rounded-xl border px-2 py-1 text-center lg:w-auto ${i === dIdx ? "border-cinnabar bg-cinnabar-soft" : "border-line bg-card"}`}
            >
              {/* 「当前」改为角标，不占额外高度 */}
              {i === curIdx && (
                <span className="absolute -right-1 -top-2 rounded-full bg-cinnabar px-1.5 text-xs font-bold leading-5 text-white shadow">当前</span>
              )}
              <p className="text-xs text-muted">虚岁{x.startAge}起</p>
              <p className="font-serif text-xl font-bold">{x.ganZhi}</p>
              <p className="text-xs text-gold">{x.shiShen}</p>
              <div className="mx-auto mt-1 h-1 w-10 overflow-hidden rounded-full bg-card-2">
                <div className={`h-full ${scoreTone(x.score)}`} style={{ width: `${x.score}%` }} />
              </div>
            </button>
          ))}
        </div>
        <div className="card mt-1.5 px-3.5 py-1.5 text-sm">
          <p>
            <b className="font-serif text-base">{d.ganZhi}运</b>（{d.startYear}–{d.endYear}）· {d.shiShen}运 ·
            <span className={`ml-1 font-bold ${scoreText(d.score)}`}>{d.score}分</span>
            <span className="ml-2 text-muted">主题「{d.theme.keyword}」</span>
          </p>
          <p className="mt-0.5 text-muted">
            {d.theme.career}；{d.theme.wealth}。{d.notes.length > 0 && <>{d.notes.join("；")}。</>}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start lg:gap-x-4">
      {/* 流年 */}
      <section>
        <h2 className="mb-1 font-serif text-lg font-bold">
          流年 <span className="text-sm font-normal text-muted">去年 · 今年 · 明年</span>
        </h2>
        <div className="card divide-y divide-line">
          {years.map((y, i) => {
            const active = y.year === activeYear;
            // 本年换大运时标注
            const yd = dayunOf(y.year);
            const newDayun = i > 0 && yd && yd !== dayunOf(y.year - 1) ? yd : null;
            return (
              <button
                key={y.year}
                onClick={() => {
                  setYear(y.year);
                  setMIdx(null);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${active ? "bg-cinnabar-soft" : ""}`}
              >
                <span className="w-12 text-sm tabular-nums">
                  {y.year}
                  {y.year === thisYear && <span className="block text-xs text-cinnabar">今年</span>}
                  {y.year === thisYear - 1 && <span className="block text-xs text-muted">去年</span>}
                  {y.year === thisYear + 1 && <span className="block text-xs text-muted">明年</span>}
                </span>
                <span className="w-12 font-serif text-lg font-bold">{y.ganZhi}</span>
                <span className="w-10 text-xs text-gold">
                  {y.shiShen}
                  {newDayun && <span className="block whitespace-nowrap text-xs text-cinnabar">入{newDayun.ganZhi}运</span>}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-card-2">
                  <div className={`h-full rounded-full ${scoreTone(y.score)}`} style={{ width: `${y.score}%` }} />
                </div>
                <span className={`w-7 text-right text-sm font-bold tabular-nums ${scoreText(y.score)}`}>{y.score}</span>
              </button>
            );
          })}
        </div>
        <div className="card fade-up mt-2 p-3.5 text-sm" key={activeYear}>
          <p className="font-serif text-base font-bold">
            {activeYear}年 {ln.ganZhi} · 虚岁{ln.age} · <span className="text-cinnabar">{ln.theme.keyword}</span>
            <span className="ml-1.5 text-xs font-normal text-muted">（行{lnDayun.ganZhi}大运）</span>
          </p>
          <dl className="mt-1.5 grid grid-cols-2 gap-1.5">
            {[
              ["事业", ln.theme.career],
              ["财运", ln.theme.wealth],
              ["感情", ln.theme.love],
              ["健康", ln.theme.health],
            ].map(([k, v]) => (
              <div key={k} className="rounded-lg bg-card-2 px-2 py-1.5 text-xs leading-snug">
                <dt className="inline font-semibold text-gold">{k} </dt>
                <dd className="inline">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-1.5 grid grid-cols-2 gap-1.5">
            {yPalaces.map((yp) => (
              <div key={yp.title} className="rounded-lg border border-gold/30 bg-card p-2" title={`落原局${yp.natalName}（${yp.branch}）`}>
                <p className="flex items-center justify-between gap-1 text-xs font-semibold text-gold">
                  <span>
                    {yp.title} <span className="font-normal text-muted">{yp.branch}</span>
                  </span>
                  <span className={`rounded px-1.5 font-bold ${PALACE_TONE[yp.label]}`}>{yp.label}</span>
                </p>
                <p className="text-xs leading-snug">
                  {yp.stars.join(" ")}
                  {[...yp.mutagens, ...yp.flow].map((m) => (
                    <span key={m} className={`ml-1 font-bold ${m.endsWith("忌") || m === "流羊" || m === "流陀" ? "text-bad" : "text-good"}`}>
                      {m}
                    </span>
                  ))}
                </p>
                <p className="text-xs leading-snug text-muted">{yp.advice}</p>
              </div>
            ))}
          </div>
          {ln.notes.length > 0 && <p className="mt-2 text-xs text-muted">{ln.notes.join("；")}</p>}
        </div>
      </section>

      {/* 流月 */}
      <section>
        <h2 className="mb-1 font-serif text-lg font-bold">
          {activeYear}年 流月 <span className="text-sm font-normal text-muted">点月份看详情 · 以节气为界</span>
        </h2>
        <div className="grid grid-cols-4 gap-1">
          {months.map((m) => (
            <button
              key={m.index}
              onClick={() => setMIdx(m.index)}
              className={`rounded-xl border px-1.5 py-1 text-center ${mIdx === m.index ? "border-cinnabar bg-cinnabar-soft" : "border-line bg-card"}`}
            >
              <p className="text-xs text-muted">{m.name}</p>
              <p className="font-serif text-lg font-bold leading-tight">{m.ganZhi}</p>
              <p className="text-xs">
                <span className="text-gold">{m.shiShen}</span> <b className={scoreText(m.score)}>{m.score}</b>
              </p>
            </button>
          ))}
        </div>
        {month ? (
          <div className="card fade-up mt-2 p-3.5 text-sm" key={month.index}>
            <p className="font-serif text-base font-bold">
              {month.name} {month.ganZhi} · <span className="text-cinnabar">{month.theme.keyword}</span>
            </p>
            <p className="text-xs text-muted">{month.jie}（{month.start}）起</p>
            <p className="mt-2">{month.theme.career}；{month.theme.wealth}；{month.theme.love}；{month.theme.health}。</p>
            {month.notes.length > 0 && <p className="mt-1 text-xs text-muted">{month.notes.join("；")}</p>}
          </div>
        ) : null}

        {/* 求财指南 */}
        <div className="card mt-1.5 px-3 py-2 text-sm">
          <h3 className="font-serif text-base font-bold">
            求财指南 <span className="text-xs font-normal text-muted">喜用神 · 财星 · 财库</span>
          </h3>
          <div className="mt-1.5 grid grid-cols-1 gap-1.5 sm:grid-cols-[auto_1fr_1fr]">
            <div className="rounded-lg bg-good/10 px-2.5 py-1.5">
              <p className="text-xs font-semibold text-good">喜用神</p>
              {wealth.favorable.map((f) => (
                <p key={f.wx} className="text-xs leading-snug">
                  <b className={`font-serif ${wxText(f.wx)}`}>{f.wx}</b> {f.direction} · {f.colors.split("、")[0]}
                </p>
              ))}
            </div>
            <div className="rounded-lg bg-gold-soft/60 px-2.5 py-1.5" title={wealth.star.spots.join("；")}>
              <p className="text-xs font-semibold text-gold">
                财星 <b className={`font-serif ${wxText(wealth.star.wx)}`}>{wealth.star.wx}</b>
                <span className="ml-1 font-normal text-ink">{wealth.star.percent}%</span>
              </p>
              <p className="text-xs leading-snug">
                {wealth.star.kind}
                {wealth.star.isFav && <b className="text-good"> · 喜用</b>}
              </p>
              <p className="text-xs leading-snug text-muted">{wealth.star.verdict}</p>
            </div>
            <div className="rounded-lg bg-card-2 px-2.5 py-1.5">
              <p className="text-xs font-semibold text-gold">
                财库 <b className="font-serif text-ink">{wealth.ku.zhi}</b>
              </p>
              <p className="text-xs leading-snug">{wealth.ku.verdict}</p>
              <p className="text-xs leading-snug text-muted">
                {/* 按年份先后排列 */}
                {[
                  { y: wealth.ku.fillYears[0], t: "补库" },
                  { y: wealth.ku.openYears[0], t: "开库" },
                ]
                  .filter((e) => e.y)
                  .sort((a, b) => a.y - b.y)
                  .map((e) => `${e.y}${e.t}`)
                  .join(" → ")}
              </p>
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-snug">
            <b className="text-cinnabar">旺财时机</b>{" "}
            {wealth.goodYears.length ? wealth.goodYears.map((y) => `${y.year}${y.ganZhi}（${y.shiShen}）`).join("、") : "近年宜稳守"}
            {wealth.goodMonths.length > 0 && (
              <span className="text-muted">
                {" "}· {activeYear}年旺月：{wealth.goodMonths.map((m) => m.name[0]).join("、")}月
              </span>
            )}
          </p>
          <ul className="mt-1 space-y-0.5 text-xs leading-snug">
            {wealth.advice.map((a) => (
              <li key={a} className="flex gap-1.5">
                <span className="text-gold">◆</span>
                {a}
              </li>
            ))}
          </ul>
        </div>
      </section>
      </div>
    </div>
  );
}

const PALACE_TONE: Record<string, string> = {
  大吉: "bg-good text-white",
  偏吉: "bg-good/15 text-good",
  平稳: "bg-card-2 text-muted",
  留意: "bg-bad/10 text-bad",
};

export default function LuckPage() {
  const today = useToday();
  return (
    <ProfileGate title="大运 · 流年 · 流月" subtitle="十年大运与年月运程">
      {(profile) => (today ? <LuckView profile={profile} today={today} /> : <PageHeader title="大运 · 流年 · 流月" />)}
    </ProfileGate>
  );
}
