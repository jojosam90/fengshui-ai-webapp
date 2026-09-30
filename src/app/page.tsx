"use client";

import Link from "next/link";
import { useMemo, useSyncExternalStore } from "react";
import { useNav } from "@/components/AppShell";
import CompassButton from "@/components/CompassButton";
import HourCell from "@/components/HourCell";
import Icon from "@/components/Icon";
import MonthChart from "@/components/MonthChart";
import ScriptToggle from "@/components/ScriptToggle";
import { getDayAlmanac } from "@/lib/almanac";
import { ageOn, computeBazi, currentDaYun } from "@/lib/bazi";
import { getDailyFortune } from "@/lib/fortune";
import { liuNianOf, liuNianYear, liuYueOf } from "@/lib/luck";
import { useProfile } from "@/lib/profile";
import { subscribeClock, useCurrentZhi, useToday } from "@/lib/useToday";


function Stat({
  glyph, tone, value, label, sub, href, className = "",
}: { glyph: string; tone: string; value: string; label: string; sub?: React.ReactNode; href: string; className?: string }) {
  return (
    <Link href={href} className={`card flex min-w-0 items-center gap-3 p-3 transition hover:shadow-md sm:p-3.5 md:gap-2 md:p-3 xl:gap-3 xl:p-3.5 ${className}`}>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-bold text-white shadow-sm md:h-9 md:w-9 md:text-base xl:h-12 xl:w-12 xl:text-lg ${tone}`}>
        {glyph}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-serif text-lg font-bold leading-tight md:text-base xl:text-xl">{value}</span>
        <span className="block truncate text-xs text-muted">{label}</span>
        {sub && <span className="block truncate text-xs">{sub}</span>}
      </span>
    </Link>
  );
}

function greeting(h: number) {
  if (h < 5) return "夜深了";
  if (h < 11) return "早安";
  if (h < 13) return "午安";
  if (h < 18) return "下午好";
  return "晚上好";
}

export default function Home() {
  const today = useToday();
  const [profile] = useProfile();
  const { open } = useNav();
  const hour = useSyncExternalStore(subscribeClock, () => new Date().getHours(), () => 12);
  const nowZhi = useCurrentZhi();

  const data = useMemo(() => {
    if (!today || !profile) return null;
    const almanac = getDayAlmanac(today);
    const bazi = computeBazi(profile);
    const fortune = getDailyFortune(bazi, today);
    const dy = currentDaYun(bazi, today.getFullYear());
    // 流年以立春为界
    const y = liuNianYear(today);
    const ln = liuNianOf(bazi, y, y)[0];
    const months = liuYueOf(bazi, y);
    const curMonth = Math.max(0, months.findIndex((m) => m.ganZhi === almanac.ganZhiMonth));
    return { almanac, bazi, fortune, dy, y, ln, months, curMonth };
  }, [today, profile]);

  if (!data || !today) {
    return (
      <div className="grid gap-4 pt-4 lg:grid-cols-3">
        {[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-card-2" />)}
      </div>
    );
  }
  const { almanac: a, fortune: f, dy, y, ln, months, curMonth } = data;
  const name = profile?.name ?? "缘主";

  return (
    <div className="space-y-4 pt-2 lg:space-y-4 lg:pt-0">
      {/* 页首 */}
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs tracking-widest text-muted lg:hidden">
            玄机<span className="text-cinnabar"> ✦ </span>AI 风水命理
          </p>
          <h1 className="font-serif text-2xl font-bold lg:text-3xl">
            {greeting(hour)}，{name}
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            {a.solarText} {a.weekText} · 农历{a.lunarMonthDay} · {a.ganZhiYear}年 {a.ganZhiMonth}月 {a.ganZhiDay}日 · 虚岁
            {ageOn(data.bazi, today).nominal}岁
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <CompassButton />
          <Link href="/almanac" className="btn-ghost hidden items-center gap-1.5 text-sm lg:flex">
            <Icon name="calendar" className="h-4 w-4" /> 择吉日
          </Link>
          <Link href="/master" className="btn-primary hidden items-center gap-1.5 text-sm lg:flex">
            <Icon name="sparkle" className="h-4 w-4" /> 问 AI 大师
          </Link>
          <span className="lg:hidden"><ScriptToggle /></span>
          <button onClick={open} className="rounded-full p-1.5 text-muted hover:bg-card-2 lg:hidden" aria-label="打开菜单">
            <Icon name="menu" />
          </button>
        </div>
      </header>

      {/* 指标卡 */}
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-5">
        <Stat href="/luck" glyph="运" tone="bg-gradient-to-br from-[#d0452f] to-[#b3261e]" value={`${f.score} 分`} label="今日运势" sub={<span className="text-cinnabar">{f.keyword}</span>} />
        <Stat href="/almanac" glyph="历" tone="bg-gradient-to-br from-[#d6a347] to-[#a87622]" value={a.lunarMonthDay} label={`农历 · ${a.ganZhiDay}日`} sub={<span className="text-muted">{a.chong}</span>} />
        <Stat
          href="/almanac"
          glyph="神"
          tone="bg-gradient-to-br from-[#5fb87b] to-[#2f7d4f]"
          value={`${a.tianShen} · ${a.zhiXing}日`}
          label="值神 · 建除"
          sub={<span className={a.tianShenLuck === "吉" ? "text-good" : "text-bad"}>{a.tianShenLuck === "吉" ? "黄道吉日" : "黑道日"}</span>}
        />
        <Stat href="/luck" glyph="限" tone="bg-gradient-to-br from-[#8a63c9] to-[#5b3a9a]" value={dy ? `${dy.ganZhi}运` : "—"} label={dy ? `当前大运 ${dy.startYear}–${dy.endYear}` : "当前大运"} sub={dy && <span className="text-gold">{dy.shiShen}运</span>} />
        <Stat className="col-span-2 md:col-span-1" href="/luck" glyph="年" tone="bg-gradient-to-br from-[#5b9ad6] to-[#2d6aa3]" value={`${ln.ganZhi}年 ${ln.score}分`} label={`${y} 流年`} sub={<span className="text-cinnabar">{ln.theme.keyword}</span>} />
      </section>

      {/* 主区：左 2/3 · 右 1/3 */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-4">
        <div className="space-y-4 lg:col-span-8 xl:col-span-7 lg:space-y-4">
          {/* 今日运势 */}
          <div className="card p-3.5 sm:p-4 lg:py-3">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                <svg viewBox="0 0 36 36" className="absolute inset-0 -rotate-90" aria-hidden>
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--line)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--cinnabar)" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${f.score} 100`} />
                </svg>
                <span className="font-serif text-2xl font-bold">{f.score}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted">今日个人运势 · 流日{f.dayGanZhi}（{f.shiShen}）</p>
                <p className="font-serif text-2xl font-bold text-cinnabar">{f.keyword}</p>
                <p className="mt-0.5 text-xs text-muted">
                  幸运色 {f.luckyColors.join("、")} · 数字 {f.luckyNumbers.join("、")} · 财位 {f.luckyDirection}
                </p>
              </div>
              <Link
                href={`/master?q=${encodeURIComponent(`请结合我的八字，详细解读我今天（${a.solarText}）的运势，并给出具体的开运建议。`)}`}
                className="btn-ghost flex basis-full items-center justify-center gap-1.5 text-sm sm:basis-auto"
              >
                <Icon name="sparkle" className="h-4 w-4 text-cinnabar" /> 深度解读
              </Link>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm md:grid-cols-4">
              {[
                ["事业", f.career],
                ["财运", f.wealth],
                ["感情", f.love],
                ["健康", f.health],
              ].map(([k, v]) => (
                <div key={k} className="rounded-xl bg-card-2 px-2.5 py-2">
                  <dt className="text-xs font-semibold text-gold">{k}</dt>
                  <dd className="mt-0.5 leading-snug">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* 流月运势图 */}
          <div className="card p-3.5 sm:p-4 lg:py-3">
            <div className="mb-3 flex items-end justify-between gap-2">
              <div>
                <h2 className="font-serif text-lg font-bold">{y}年 流月运势</h2>
                <p className="text-xs text-muted">按节气分月，依您的八字喜忌评分</p>
              </div>
              <Link href="/luck" className="flex items-center text-sm text-cinnabar">
                大运流年 <Icon name="chevron" className="h-4 w-4" />
              </Link>
            </div>
            <MonthChart
              current={curMonth}
              data={months.map((m) => ({
                label: m.name.slice(0, 2),
                num: `${parseInt(m.start, 10)}月`,
                sub: `${m.ganZhi}月 · ${m.shiShen} · ${m.jie}${m.start}起`,
                value: m.score,
                note: `「${m.theme.keyword}」${m.theme.career}；${m.theme.wealth}`,
              }))}
            />
          </div>
        </div>

        {/* 右栏：平板两列并排，桌面单列 */}
        <div className="grid grid-cols-1 content-start gap-4 md:grid-cols-2 lg:col-span-4 lg:grid-cols-1 lg:gap-4 xl:col-span-5">
          <div className="card p-3.5 sm:p-4 lg:py-3">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-lg font-bold">今日宜忌</h2>
              <Link href="/almanac" className="text-sm text-cinnabar">完整黄历</Link>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex gap-2 rounded-xl bg-good/10 px-2.5 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-good font-serif text-xs font-bold text-white">宜</span>
                <p className="min-w-0 truncate leading-relaxed" title={a.yi.join("、")}>{a.yi.join("　")}</p>
              </div>
              <div className="flex gap-2 rounded-xl bg-bad/10 px-2.5 py-1.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-bad font-serif text-xs font-bold text-white">忌</span>
                <p className="min-w-0 truncate leading-relaxed" title={a.ji.join("、")}>{a.ji.join("　")}</p>
              </div>
            </div>
            {/* 吉神方位：单行显示（喜 西南），节省高度 */}
            <div className="mt-1.5 grid grid-cols-4 gap-1.5 text-center">
              {[
                ["喜神", a.xiShen],
                ["财神", a.caiShen],
                ["福神", a.fuShen],
                ["贵神", a.yangGui],
              ].map(([k, v]) => (
                <p key={k} title={`${k} ${v}`} className="whitespace-nowrap rounded-lg bg-card-2 py-1 text-sm">
                  <span className="text-muted">{k[0]}</span> <b className="font-serif text-gold">{v}</b>
                </p>
              ))}
            </div>
          </div>

          <div className="card p-3.5 sm:p-4 lg:py-3">
            <div className="mb-1.5 flex items-baseline justify-between">
              <h2 className="font-serif text-lg font-bold">今日时辰吉凶</h2>
              {nowZhi && <span className="text-xs text-muted">此刻 <b className="text-gold">{nowZhi}时</b></span>}
            </div>
            <div className="grid grid-cols-3 gap-x-1.5 gap-y-3 pt-1 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-3">
              {a.hours.map((h) => (
                <HourCell
                  key={h.zhi}
                  h={h}
                  animal={data.bazi.shengXiao}
                  isNow={h.zhi === nowZhi}
                  dim={h.luck !== "吉" && h.zhi !== nowZhi}
                  className={`relative rounded-lg py-1 text-center ${h.luck === "吉" ? "bg-good/10" : "bg-card-2"} ${h.zhi === nowZhi ? "hour-now" : ""}`}
                >
                  {h.zhi === nowZhi && (
                    <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gold px-1.5 text-xs font-bold leading-4 text-white shadow">此刻</span>
                  )}
                  <p className="font-serif text-sm font-bold">{h.zhi}时</p>
                  <p className="whitespace-nowrap text-xs tabular-nums tracking-tight text-muted">{h.range}</p>
                  <p className={`text-xs font-bold ${h.luck === "吉" ? "text-good" : "text-bad"}`}>{h.luck}</p>
                </HourCell>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
