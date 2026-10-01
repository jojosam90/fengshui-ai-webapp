"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import IdealHouse from "@/components/IdealHouse";
import PageHeader from "@/components/PageHeader";
import type { Gender } from "@/lib/bazi";
import {
  type Direction, GRID_ORDER, MOUNTAINS, PERIODS, STARS, annualAndMonthlyStars, houseChart, kuaNumber, mansionsFor, yearlyReading,
  starTimeliness,
} from "@/lib/fengshui";
import { useProfile } from "@/lib/profile";
import { useToday } from "@/lib/useToday";

const luckText = (l: string) => (l.includes("吉") ? "text-good" : l === "大凶" ? "text-bad" : "text-muted");

const LUCK_STYLE: Record<string, string> = {
  大吉: "bg-cinnabar-soft border-cinnabar/40",
  吉: "bg-good/10 border-good/30",
  平: "bg-card-2 border-line",
  凶: "bg-card-2 border-line",
  大凶: "bg-ink/10 border-ink/30",
};

function FlyingStars() {
  const today = useToday();
  const [mode, setMode] = useState<"year" | "month">("year");
  const [focus, setFocus] = useState<Direction | null>(null);
  const data = useMemo(() => (today ? annualAndMonthlyStars(today) : null), [today]);
  if (!data) return <div className="h-80 animate-pulse rounded-2xl bg-card-2" />;

  const grid = data[mode];
  const sel = focus ?? (Object.keys(grid) as Direction[]).find((d) => grid[d] === 9)!;
  const star = STARS[grid[sel]];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-card-2 p-1 text-sm lg:col-span-12 lg:max-w-md">
        {(["year", "month"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`rounded-lg py-2 font-medium ${mode === m ? "bg-card shadow-sm" : "text-muted"}`}
          >
            {m === "year" ? `${data.yearGanZhi}年 流年飞星` : `${data.monthGanZhi}月 流月飞星`}
          </button>
        ))}
      </div>

      <section className="card p-3 lg:col-span-5 lg:p-3.5">
        <p className="mb-2 text-center text-xs text-muted">上南 · 下北 · 左东 · 右西（传统罗盘方位）</p>
        <div className="grid grid-cols-3 gap-1.5">
          {GRID_ORDER.map((dir) => {
            const s = STARS[grid[dir]];
            const active = dir === sel;
            return (
              <button
                key={dir}
                onClick={() => setFocus(dir)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 transition ${LUCK_STYLE[s.luck]} ${active ? "!border-cinnabar ring-2 ring-cinnabar/30" : ""}`}
              >
                <span className="text-xs text-muted">{dir}</span>
                <span className="font-serif text-3xl font-bold">{s.number}</span>
                <span className="text-xs">{s.name}{s.alias.slice(0, 2)}</span>
                <span className={`text-xs font-bold ${s.luck.includes("吉") ? "text-good" : s.luck === "大凶" ? "text-bad" : "text-muted"}`}>
                  {s.luck}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="space-y-4 lg:col-span-7">
      <section className="card fade-up p-3.5" key={sel + mode}>
        <p className="text-xs text-muted">{sel === "中" ? "中宫" : `${sel}方`}</p>
        <p className="font-serif text-xl font-bold">
          {star.name}{star.alias} <span className="text-sm font-normal text-muted">（五行属{star.wx}·{star.luck}）</span>
        </p>
        <p className="mt-2 text-sm">{star.effect}</p>
        <p className="mt-2 rounded-xl bg-card-2 p-3 text-sm">
          <span className="font-semibold text-gold">布局建议：</span>{star.advice}
        </p>
      </section>

      {/* 九宫一览（桌面端显示，手机端点格子查看） */}
      <section className="card hidden divide-y divide-line lg:grid xl:grid-cols-2 xl:divide-y-0">
        {GRID_ORDER.filter((d) => d !== "中").map((dir) => {
          const s = STARS[grid[dir]];
          const good = s.luck.includes("吉");
          return (
            <button
              key={dir}
              onClick={() => setFocus(dir)}
              className={`flex gap-3 p-3 text-left hover:bg-card-2 xl:border-b xl:border-line ${dir === sel ? "bg-cinnabar-soft" : ""}`}
            >
              <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-serif font-bold text-white ${good ? "bg-good" : s.luck === "大凶" ? "bg-bad" : "bg-muted"}`}>
                {s.number}
              </span>
              <span className="min-w-0 text-sm">
                <span className="block font-semibold">{dir} · {s.name}{s.alias}（{s.luck}）</span>
                <span className="block text-xs text-muted">{s.effect}</span>
              </span>
            </button>
          );
        })}
      </section>

      <p className="text-xs leading-relaxed text-muted">
        现为下元九运（2024–2043），九紫右弼为当运旺星。{mode === "year" ? "流年飞星每年立春交替" : "流月飞星按节气交替"}，
        五黄、二黑所在方位宜静不宜动，避免装修动土。
      </p>
      </div>
    </div>
  );
}

function HouseChartView({ initialSit }: { initialSit?: string }) {
  const today = useToday();
  const [period, setPeriod] = useState(9);
  const [sit, setSit] = useState(initialSit && MOUNTAINS.some((m) => m.name === initialSit) ? initialSit : "子");
  const [focus, setFocus] = useState<Direction | null>(null);
  const h = useMemo(() => houseChart(period, sit), [period, sit]);
  const annual = useMemo(() => (today ? annualAndMonthlyStars(today) : null), [today]);
  const sel = focus ?? h.face.palace;
  const mT = starTimeliness(h.mountain[sel], 9);
  const wT = starTimeliness(h.water[sel], 9);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
      <div className="space-y-4 lg:col-span-4">
      <section className="card grid grid-cols-2 gap-2 p-3.5 lg:grid-cols-1">
        <label className="text-sm text-muted">
          建成元运
          <select className="input mt-1" value={period} onChange={(e) => setPeriod(Number(e.target.value))}>
            {PERIODS.map((p) => (
              <option key={p.n} value={p.n}>{p.n}运（{p.years}）</option>
            ))}
          </select>
        </label>
        <label className="text-sm text-muted">
          坐山（背后方向）
          <select className="input mt-1" value={sit} onChange={(e) => { setSit(e.target.value); setFocus(null); }}>
            {MOUNTAINS.map((m) => (
              <option key={m.name} value={m.name}>{m.name}山 · {m.palace} {m.deg}°</option>
            ))}
          </select>
        </label>
        <p className="col-span-2 text-xs text-muted lg:col-span-1">
          以指南针站在屋内面向大门（或主要采光面）测量，背后为坐、前方为向。当前：<b className="text-ink">{h.sit.name}山{h.face.name}向</b>
        </p>
      </section>

      <section className={`rounded-2xl p-3 text-center ${h.pattern.good ? "bg-good/10" : "bg-bad/10"}`}>
        <p className={`font-serif text-xl font-bold ${h.pattern.good ? "text-good" : "text-bad"}`}>{h.pattern.name}</p>
        <p className="mt-0.5 text-xs text-muted">{h.pattern.desc}</p>
      </section>

      </div>

      <section className="card p-3 lg:col-span-5 lg:p-3.5">
        <p className="mb-2 text-center text-xs text-muted">上南 · 下北 · 大字左为山星（人丁）、右为向星（财运），绿色为当运吉星</p>
        <div className="grid grid-cols-3 gap-1.5">
          {GRID_ORDER.map((dir) => {
            const isSit = dir === h.sit.palace;
            const isFace = dir === h.face.palace;
            const mt = starTimeliness(h.mountain[dir], 9);
            const wt = starTimeliness(h.water[dir], 9);
            // 底色：山向皆吉为吉、一吉为平、皆衰为凶（与流年飞星同一套配色）
            const tone = wt.good && mt.good ? LUCK_STYLE["吉"] : wt.good || mt.good ? LUCK_STYLE["平"] : LUCK_STYLE["凶"];
            return (
              <button
                key={dir}
                onClick={() => setFocus(dir)}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 transition ${tone} ${
                  dir === sel ? "!border-cinnabar ring-2 ring-cinnabar/30" : ""
                }`}
              >
                <span className="text-xs text-muted">{dir}</span>
                <span className="flex items-baseline gap-2 font-serif text-3xl font-bold leading-tight">
                  <span className={mt.good ? "text-good" : ""} title="山星（人丁）">{h.mountain[dir]}</span>
                  <span className={wt.good ? "text-good" : ""} title="向星（财运）">{h.water[dir]}</span>
                </span>
                <span className="text-xs">运星 {h.base[dir]}</span>
                <span className="text-xs font-bold text-cinnabar">{annual && dir !== "中" ? `流年 ${annual.year[dir]}` : " "}</span>
                {(isSit || isFace) && (
                  <span className={`absolute right-1.5 top-1.5 rounded px-1 text-xs font-bold text-white ${isFace ? "bg-cinnabar" : "bg-ink/70"}`}>
                    {isFace ? "向" : "坐"}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="card fade-up space-y-2 p-3.5 text-sm lg:col-span-3" key={sel + sit + period}>
        <p className="font-serif text-lg font-bold">{sel === "中" ? "中宫" : `${sel}方`}{sel === h.face.palace ? "（向）" : sel === h.sit.palace ? "（坐）" : ""}</p>
        <p>
          山星 <b>{STARS[h.mountain[sel]].name}</b>（九运{mT.label}）：
          {mT.good ? "宜静，适合卧室、书房，或摆放高柜、靠山。" : "不宜久坐久卧，可作储物、卫浴。"}
        </p>
        <p>
          向星 <b>{STARS[h.water[sel]].name}</b>（九运{wT.label}）：
          {wT.good ? "宜动，适合开门、客厅、摆放流水或鱼缸催财。" : "宜静不宜动，避免开门与放水。"}
        </p>
        <p className="text-xs text-muted">{STARS[h.water[sel]].advice}</p>
      </section>
    </div>
  );
}

const TONE: Record<"good" | "bad" | "mid", string> = {
  good: "bg-good/10 border-good/30 text-good",
  bad: "bg-bad/10 border-bad/30 text-bad",
  mid: "bg-gold-soft border-gold/30 text-gold",
};

function LiuNianView() {
  const [profile, ready] = useProfile();
  const today = useToday();
  const thisYear = (today ?? new Date()).getFullYear();
  const [year, setYear] = useState<number | null>(null);
  const y = year ?? thisYear + 1;
  const gua = useMemo(
    () => (profile ? kuaNumber(profile.year, profile.month, profile.day, profile.gender, profile.hour, profile.minute) : null),
    [profile],
  );
  const r = useMemo(() => (gua ? yearlyReading(y, gua) : null), [gua, y]);

  if (!ready || !today) return <div className="h-80 animate-pulse rounded-2xl bg-card-2" />;
  if (!gua || !r) {
    return (
      <p className="card p-4 text-sm text-muted">
        请先 <Link href="/profile" className="text-cinnabar underline">设置档案</Link>，以推算命卦与流年。
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
      <div className="flex gap-2 lg:col-span-12">
        {[thisYear, thisYear + 1, thisYear + 2].map((yy) => (
          <button
            key={yy}
            onClick={() => setYear(yy)}
            className={`rounded-full border px-4 py-1.5 text-base ${yy === y ? "border-cinnabar bg-cinnabar-soft font-semibold text-cinnabar" : "border-line bg-card"}`}
          >
            {yy}
            {yy === thisYear && <span className="ml-1 text-sm text-muted">今年</span>}
          </button>
        ))}
      </div>

      <section className="card p-3 lg:col-span-5 lg:p-3.5">
        <p className="mb-2 text-center text-xs text-muted">{r.year}年飞星 · 上南 · 下北 · 左东 · 右西（金框为本命位）</p>
        <div className="grid grid-cols-3 gap-1.5">
          {GRID_ORDER.map((dir) => {
            const st = STARS[r.stars[dir]];
            const mine = dir === r.myDir;
            const tags = [dir === r.taiSui && "太岁", dir === r.suiPo && "岁破", dir === r.sanSha && "三煞"].filter(Boolean) as string[];
            return (
              <div
                key={dir}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 text-center ${LUCK_STYLE[st.luck]} ${mine ? "!border-gold ring-2 ring-gold/40" : ""}`}
              >
                <span className="text-xs text-muted">{dir}</span>
                <span className="font-serif text-3xl font-bold">{st.number}</span>
                <span className="text-xs">{st.name}{st.alias.slice(0, 2)}</span>
                <span className={`text-xs font-bold ${luckText(st.luck)}`}>{st.luck}</span>
                {/* 角标：单字，避免与方位文字重叠（图例中有说明） */}
                {mine && (
                  <span title="本命位" className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded bg-gold text-xs font-bold text-white">命</span>
                )}
                {tags.length > 0 && (
                  <span className="absolute right-1 top-1 flex gap-0.5">
                    {tags.map((t) => (
                      <span key={t} title={t} className="flex h-5 w-5 items-center justify-center rounded bg-bad/15 text-xs font-bold text-bad">
                        {t === "太岁" ? "岁" : t === "岁破" ? "破" : "煞"}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="space-y-4 lg:col-span-7">
      <section className="card space-y-2 p-3.5 lg:px-5 lg:py-3.5">
          <div className="flex items-center gap-4">
            <span className="seal flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-serif text-3xl font-bold">{gua.name}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-muted">{profile?.name ?? "您"}的命卦 · 本命位 {r.myDir}</p>
              <p className="font-serif text-xl font-bold">
                {r.year} {r.ganZhi}年 · {gua.name}卦
              </p>
            </div>
            <span className={`shrink-0 rounded-lg border px-2.5 py-1 text-sm font-bold ${TONE[r.verdict.tone]}`}>{r.verdict.label}</span>
          </div>

          <ul className="space-y-1.5">
            {r.flags.map((f) => (
              <li key={f.label} className={`rounded-xl border p-3 text-xs leading-relaxed ${TONE[f.tone]}`}>
                <b className="mr-1.5 font-serif">{f.label}</b>
                <span className="text-ink">{f.text}</span>
              </li>
            ))}
          </ul>

          <p className="text-sm leading-relaxed text-muted">
            {r.year}年：太岁在<b className="text-ink">{r.taiSui}</b> · 岁破在<b className="text-ink">{r.suiPo}</b> · 三煞在
            <b className="text-ink">{r.sanSha}</b> · 五黄在<b className="text-ink">{(Object.keys(r.stars) as Direction[]).find((d) => r.stars[d] === 5)}</b>
            。以上方位当年忌动土装修。流年以立春为界。
          </p>
        </section>
        {/* 图例：颜色与吉凶说明（紧凑版，每行一行） */}
        <section className="card px-3.5 py-3 lg:px-5">
          <h3 className="mb-1.5 font-serif text-lg font-bold">颜色与吉凶说明</h3>
          <ul className="divide-y divide-line/70 text-sm">
            {[
              ["bg-cinnabar-soft border-cinnabar/40", "红", "大吉", "text-good", "九紫", "当运旺星，主喜庆名声，宜多用"],
              ["bg-good/10 border-good/30", "绿", "吉", "text-good", "一白 四绿 六白 八白", "利人缘文昌财运，宜常用"],
              ["bg-card-2 border-line", "褐", "凶", "text-muted", "二黑 三碧 七赤", "病痛口舌破财，宜静可化解"],
              ["bg-ink/10 border-ink/30", "灰", "大凶", "text-bad", "五黄", "灾祸意外，忌动土，宜铜铃化煞"],
            ].map(([swatch, color, luck, tone, stars, desc]) => (
              <li key={luck} className="flex items-center gap-2 py-1.5">
                <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border-2 text-xs ${swatch}`}>{color}</span>
                <b className={`w-10 shrink-0 ${tone}`}>{luck}</b>
                <span className="w-44 shrink-0 max-md:hidden">{stars}</span>
                <span className="min-w-0 text-muted">{desc}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-gold font-bold text-white">命</span>本命位
            </span>
            <span className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-bad/15 font-bold text-bad">岁</span>太岁
            </span>
            <span className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-bad/15 font-bold text-bad">破</span>岁破
            </span>
            <span className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded bg-bad/15 font-bold text-bad">煞</span>三煞
            </span>
            <span>（当年忌动土）</span>
          </p>
        </section>
      </div>
    </div>
  );
}

function EightMansions({ showHouse, setShowHouse }: { showHouse: boolean; setShowHouse: (v: boolean) => void }) {
  const [profile, ready] = useProfile();
  const [manual, setManual] = useState<{ year: number; gender: Gender } | null>(null);
  const [year, setYear] = useState(1990);
  const [gender, setGender] = useState<Gender>("female");

  const gua = useMemo(() => {
    if (manual) return kuaNumber(manual.year, 6, 1, manual.gender);
    if (profile) return kuaNumber(profile.year, profile.month, profile.day, profile.gender, profile.hour, profile.minute);
    return null;
  }, [manual, profile]);

  if (!ready) return <div className="h-80 animate-pulse rounded-2xl bg-card-2" />;

  if (!gua) {
    return (
      <section className="card space-y-4 p-3.5 lg:max-w-xl">
        <p className="text-sm text-muted">输入出生年份与性别，推算您的命卦与吉凶方位。</p>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number" inputMode="numeric" min={1901} max={2100} className="input"
            value={year} onChange={(e) => setYear(Number(e.target.value))} aria-label="出生年份"
          />
          <select className="input" value={gender} onChange={(e) => setGender(e.target.value as Gender)} aria-label="性别">
            <option value="male">男</option>
            <option value="female">女</option>
          </select>
        </div>
        <button className="btn-primary w-full" onClick={() => setManual({ year, gender })}>推算命卦</button>
        <p className="text-xs text-muted">
          提示：1-2 月立春前出生者请填上一年，或 <Link href="/profile" className="text-cinnabar underline">设置完整档案</Link> 自动精确计算。
        </p>
      </section>
    );
  }

  const list = mansionsFor(gua);
  const byDir = Object.fromEntries(list.map((m) => [m.direction, m])) as Record<Direction, (typeof list)[number]>;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-4">
      <section className="card flex items-center gap-3 px-3.5 py-2.5 lg:col-span-12">
        <span className="seal flex h-12 w-12 shrink-0 items-center justify-center rounded-xl font-serif text-2xl font-bold">{gua.name}</span>
        <div>
          <p className="font-serif text-lg font-bold">
            {gua.name}卦（{gua.number}） · {gua.group}
            <span className="ml-2 font-sans text-xs font-normal text-muted">{profile && !manual ? `${profile.name ?? "您"}的命卦` : "命卦"}</span>
          </p>
          <p className="text-sm text-muted">宜住坐{gua.sitting}之宅，吉方为{gua.group === "东四命" ? "东、东南、南、北" : "西、西北、西南、东北"}</p>
        </div>
      </section>

      <section className="card p-3 lg:col-span-5 lg:p-3.5">
        <p className="mb-2 text-center text-xs text-muted">上南下北 · 左东右西 · 按命卦排吉凶</p>
        <div className="grid grid-cols-3 gap-1.5">
          {GRID_ORDER.map((dir) => {
            const m = byDir[dir];
            if (!m) {
              return (
                <div key={dir} className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 ${LUCK_STYLE["平"]}`}>
                  <span className="text-xs text-muted">中</span>
                  <span className="font-serif text-3xl font-bold text-gold">☯</span>
                  <span className="text-xs">太极</span>
                  <span className="text-xs">{" "}</span>
                </div>
              );
            }
            const good = m.luck === "吉";
            return (
              <div key={dir} className={`flex aspect-square flex-col items-center justify-center rounded-xl border-2 ${LUCK_STYLE[good ? "吉" : "凶"]}`}>
                <span className="text-xs text-muted">{dir}</span>
                <span className="font-serif text-3xl font-bold">{m.key}</span>
                <span className="text-xs">{m.use.split("、")[0].replace(/朝向$/, "")}</span>
                <span className={`text-xs font-bold ${good ? "text-good" : "text-muted"}`}>{m.luck}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="flex flex-col items-start gap-3 lg:col-span-7">
      <section className="card grid w-full divide-y divide-line xl:grid-cols-2 xl:divide-y-0">
        {list.map((m) => (
          <div key={m.key} className="flex gap-2.5 px-3 py-2 xl:border-b xl:border-line">
            <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white ${m.luck === "吉" ? "bg-good" : "bg-bad"}`}>
              {m.luck}
            </span>
            <div className="text-sm leading-snug">
              <p className="font-semibold">{m.key} · {m.direction}</p>
              <p className="text-xs text-muted">{m.desc}</p>
              <p className="text-xs text-gold">宜作：{m.use}</p>
              <p className="text-xs">
                <b className={m.luck === "吉" ? "text-good" : "text-bad"}>布局建议：</b>
                {m.tip}
              </p>
            </div>
          </div>
        ))}
      </section>
        {/* 桌面版按钮在页首（罗盘旁），手机版保留在此 */}
        <button onClick={() => setShowHouse(true)} className="btn-primary px-5 py-2 text-base lg:hidden">
          理想宅设计图
        </button>
      </div>
      {showHouse && <IdealHouse gua={gua} mansions={list} onClose={() => setShowHouse(false)} />}

      {manual && (
        <button className="btn-ghost w-full" onClick={() => setManual(null)}>重新输入</button>
      )}
    </div>
  );
}

function FengshuiInner() {
  const params = useSearchParams();
  const initial = params.get("tab");
  const [tab, setTab] = useState<"house" | "stars" | "bazhai" | "liunian">(
    initial === "bazhai" ? "bazhai" : initial === "stars" ? "stars" : initial === "liunian" ? "liunian" : "house",
  );
  const [showHouse, setShowHouse] = useState(false);
  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader
        info="fengshui"
        title="玄空飞星"
        subtitle="宅运盘 · 流年流月 · 八宅命卦 · 批流年"
        actions={
          tab === "bazhai" ? (
            <button onClick={() => setShowHouse(true)} className="btn-primary text-sm">
              理想宅设计图
            </button>
          ) : undefined
        }
      />
      <div className="flex gap-5 border-b border-line">
        {([
          ["house", "玄空宅盘"],
          ["stars", "流年飞星"],
          ["bazhai", "八宅命卦"],
          ["liunian", "批流年"],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`-mb-px border-b-2 pb-2 font-serif text-base font-bold ${tab === k ? "border-cinnabar text-cinnabar" : "border-transparent text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === "house" ? <HouseChartView initialSit={params.get("sit") ?? undefined} /> : tab === "stars" ? <FlyingStars /> : tab === "bazhai" ? <EightMansions showHouse={showHouse} setShowHouse={setShowHouse} /> : <LiuNianView />}
    </div>
  );
}

export default function FengshuiPage() {
  return (
    <Suspense fallback={<PageHeader title="居家风水" />}>
      <FengshuiInner />
    </Suspense>
  );
}
