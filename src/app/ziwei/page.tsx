"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import ProfileGate from "@/components/ProfileGate";
import ZiweiChart, { Mutagen } from "@/components/ZiweiChart";
import type { BirthInfo } from "@/lib/bazi";
import { useToday } from "@/lib/useToday";
import { BRIGHTNESS_INFO, MAJOR_STAR_INFO, MUTAGEN_NAMES, PALACE_INFO, computeZiwei, plainReading } from "@/lib/ziwei";

function ZiweiView({ profile }: { profile: BirthInfo }) {
  // 大限 / 流年 / 流年四化随日期更新（跨日、跨年自动重算）
  const today = useToday();
  const z = useMemo(() => computeZiwei(profile, today ?? undefined), [profile, today]);
  const soulIndex = z.palaces.find((p) => p.name === "命宫")!.index;
  const [sel, setSel] = useState<number>(soulIndex);
  const p = z.palaces[sel];
  const info = PALACE_INFO[p.name];


  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader info="ziwei" title="紫微斗数" subtitle={`${profile.name ?? "我"}的命盘 · ${z.fiveElementsClass}`} />

      {z.hourAssumed && (
        <p className="rounded-xl bg-gold-soft px-3 py-2 text-xs text-gold">
          紫微斗数以时辰定命宫，您的档案未填写出生时间，暂按午时排盘，结果仅供参考。
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-start lg:gap-5">
      <div className="space-y-3 lg:col-span-3">
      <ZiweiChart
        z={z}
        selected={sel}
        onSelect={setSel}
        center={
          <>
            <p className="font-serif text-base font-bold xl:text-xl">{profile.name ?? "命主"}</p>
            <p className="text-xs text-muted xl:text-sm">{profile.gender === "male" ? "男" : "女"} · 属{z.zodiac} · {z.sign}</p>
            <p className="mt-1 font-serif text-xs tracking-wide xl:text-lg">{z.chineseDate}</p>
            <p className="text-xs text-muted xl:text-sm">{z.lunarDate} {z.time}</p>
            <p className="mt-1.5 text-xs xl:text-base">
              <span className="font-bold text-cinnabar">{z.fiveElementsClass}</span>
            </p>
            <p className="text-xs xl:text-sm">命主 {z.soul} · 身主 {z.body}</p>
            <p className="mt-1 text-xs text-muted xl:text-xs">
              虚岁{z.horoscope.age} · 大限{z.horoscope.decadalGanZhi} · 流年{z.horoscope.yearlyGanZhi}
            </p>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
        <span>四化：</span>
        {["禄", "权", "科", "忌"].map((m) => (
          <span key={m} className="flex items-center gap-0.5"><Mutagen m={m} />化{m}</span>
        ))}
        <span className="flex items-center gap-0.5"><span className="rounded-sm bg-gold px-0.5 text-xs text-white">限</span>当前大限</span>
        <span className="flex items-center gap-0.5"><span className="rounded-sm bg-cinnabar px-0.5 text-xs text-white">年</span>流年命宫</span>
      </div>

      </div>

      <div className="space-y-4 lg:sticky lg:top-6 lg:col-span-2">
      <section className="card fade-up p-3.5" key={sel}>
        <div className="flex items-baseline justify-between">
          <h2 className="font-serif text-xl font-bold">
            {info.title}
            {p.isBody && <span className="ml-1.5 rounded bg-gold px-1 text-xs font-normal text-white">身宫</span>}
          </h2>
          <span className="text-sm text-muted">{p.stem}{p.branch} · 大限 {p.decadal[0]}–{p.decadal[1]} 岁</span>
        </div>
        <p className="mt-1 text-sm text-muted">{info.desc}</p>

        <div className="mt-3 space-y-2">
          {p.major.length === 0 && (
            <p className="rounded-xl bg-card-2 px-3 py-2 text-sm">
              空宫 · 借对宫「{z.palaces[(sel + 6) % 12].name}」：
              <b className="text-cinnabar">
                {z.palaces[(sel + 6) % 12].major.map((s) => s.name + (s.brightness ?? "")).join("、") || "无主星"}
              </b>
            </p>
          )}
          {/* 主星：一行标签（亮度、四化）；星曜含义见下方白话解读，并可悬停查看 */}
          {p.major.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {p.major.map((s) => (
                <span
                  key={s.name}
                  title={MAJOR_STAR_INFO[s.name]}
                  className="inline-flex items-center gap-1 rounded-lg bg-card-2 px-2.5 py-1 text-sm font-semibold"
                >
                  <span className="text-cinnabar">{s.name}</span>
                  {s.brightness && <span className="text-xs font-normal text-muted">{s.brightness}（{BRIGHTNESS_INFO[s.brightness]}）</span>}
                  {s.mutagen && <Mutagen m={s.mutagen} />}
                </span>
              ))}
            </div>
          )}
        </div>

        {p.minor.length > 0 && (
          <p className="mt-3 text-sm">
            <span className="text-muted">辅星：</span>
            {p.minor.map((s) => s.name + (s.mutagen ? `(化${s.mutagen})` : "")).join("、")}
          </p>
        )}
        {p.adjective.length > 0 && (
          <p className="mt-1 truncate text-xs text-muted" title={`杂曜：${p.adjective.join("、")} · 长生：${p.changsheng}`}>长生：{p.changsheng} · 杂曜：{p.adjective.join("、")}</p>
        )}

        <div className="mt-3 rounded-xl border border-gold/25 bg-gold-soft/40 p-3">
          <p className="mb-1.5 text-xs font-semibold text-gold">💬 白话解读</p>
          <div className="space-y-1.5 text-sm leading-relaxed">
            {plainReading(z, sel).map((t, i, arr) => (
              <p key={i} className={i === arr.length - 1 ? "font-semibold" : ""}>{t}</p>
            ))}
          </div>
        </div>
      </section>

      <section className="card p-3.5 text-sm">
        <h2 className="mb-2 font-serif text-lg font-bold">当前运限</h2>
        <p>
          大限 <b className="text-gold">{z.horoscope.decadalGanZhi}</b> 在「{z.palaces[z.horoscope.decadalIndex].name}」· 流年{" "}
          <b className="text-cinnabar">{z.horoscope.yearlyGanZhi}</b> 在「{z.palaces[z.horoscope.yearlyIndex].name}」
        </p>
        <p className="mt-1 text-muted">
          流年四化：{z.horoscope.yearlyMutagen.map((s, i) => `${s}${MUTAGEN_NAMES[i]}`).join("、")}
        </p>
      </section>

      <Link href="/palaces" className="btn-primary flex items-center justify-center gap-2">
        十二宫逐宫详解 <Icon name="chevron" className="h-4 w-4" />
      </Link>
      </div>
      </div>
    </div>
  );
}

export default function ZiweiPage() {
  return (
    <ProfileGate title="紫微斗数" subtitle="十四主星 · 十二宫 · 四化">
      {(profile) => <ZiweiView profile={profile} />}
    </ProfileGate>
  );
}
