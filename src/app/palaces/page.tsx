"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import ProfileGate from "@/components/ProfileGate";
import { Mutagen } from "@/components/ZiweiChart";
import type { BirthInfo } from "@/lib/bazi";
import { useToday } from "@/lib/useToday";
import { BRIGHTNESS_INFO, LUCKY_STARS, MAJOR_STAR_INFO, PALACE_INFO, SHA_STARS, assessPalace, computeZiwei } from "@/lib/ziwei";

const ORDER = ["命宫", "兄弟", "夫妻", "子女", "财帛", "疾厄", "迁移", "仆役", "官禄", "田宅", "福德", "父母"];
function PalacesView({ profile }: { profile: BirthInfo }) {
  // 大限 / 流年 / 流年四化随日期更新（跨日、跨年自动重算）
  const today = useToday();
  const z = useMemo(() => computeZiwei(profile, today ?? undefined), [profile, today]);
  const byName = Object.fromEntries(z.palaces.map((p) => [p.name, p]));
  // 已展开的宫位；「全部展开 / 全部收起」一键切换
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());
  const allOpen = openSet.size === ORDER.length;
  const toggleAll = () => setOpenSet(allOpen ? new Set() : new Set(ORDER));
  const toggleAllBtn = (
    <button onClick={toggleAll} aria-pressed={allOpen} className="btn-ghost flex items-center gap-1.5 text-sm">
      <Icon name="chevron" className={`h-4 w-4 transition ${allOpen ? "-rotate-90" : "rotate-90"}`} />
      {allOpen ? "全部收起" : "全部展开"}
    </button>
  );

  return (
    <div className="space-y-3 lg:space-y-5">
      <PageHeader info="palaces"
        title="十二宫详解"
        subtitle={`紫微斗数 · ${profile.name ?? "我"}的命盘`}
        actions={
          <>
            {toggleAllBtn}
            <Link href="/ziwei" className="btn-ghost text-sm">查看紫微命盘</Link>
          </>
        }
      />
      <div className="flex justify-end lg:hidden">{toggleAllBtn}</div>
      <p className="text-xs leading-relaxed text-muted">
        每宫以本宫为主，参看对宫与三合宫（合称「三方四正」）。吉星：左辅、右弼、文昌、文曲、天魁、天钺、禄存；
        煞星：擎羊、陀罗、火星、铃星、地空、地劫。
      </p>

      {/* 全部展开时：每行等高，且所有行取最高卡片的高度（auto-rows-fr） */}
      <div className={`grid gap-3 md:grid-cols-2 xl:grid-cols-3 lg:gap-4 ${allOpen ? "auto-rows-fr items-stretch" : "md:items-start"}`}>
      {ORDER.map((name) => {
        const p = byName[name];
        if (!p) return null;
        const i = p.index;
        const opposite = z.palaces[(i + 6) % 12];
        const trine = [z.palaces[(i + 4) % 12], z.palaces[(i + 8) % 12]];
        const tag = assessPalace(z, i);
        const info = PALACE_INFO[name];
        const lucky = p.minor.filter((s) => LUCKY_STARS.has(s.name)).map((s) => s.name);
        const sha = p.minor.filter((s) => SHA_STARS.has(s.name)).map((s) => s.name);
        const ask = `请详细解读我紫微命盘的「${info.title}」（${p.stem}${p.branch}），主星${p.major.map((s) => s.name).join("、") || "空宫"}，结合三方四正分析。`;

        return (
          <details
            key={name}
            className="card group h-full overflow-hidden"
            open={openSet.has(name)}
            onToggle={(e) => {
              const isOpen = (e.currentTarget as HTMLDetailsElement).open;
              setOpenSet((prev) => {
                if (prev.has(name) === isOpen) return prev;
                const next = new Set(prev);
                if (isOpen) next.add(name);
                else next.delete(name);
                return next;
              });
            }}
          >
            <summary className="flex cursor-pointer list-none items-center gap-3 p-3.5">
              <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl font-serif text-lg font-bold ${name === "命宫" ? "seal" : "bg-card-2"}`}>
                {info.title[0]}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-serif text-base font-bold">
                  {info.title}
                  <span className="ml-1.5 text-xs font-normal text-muted">{p.stem}{p.branch}</span>
                  {p.isBody && <span className="ml-1 rounded bg-gold px-1 text-xs font-normal text-white">身宫</span>}
                </p>
                <p className="truncate text-sm text-cinnabar">
                  {p.major.length ? p.major.map((s) => s.name + (s.mutagen ? `化${s.mutagen}` : "")).join(" · ") : `空宫（借${opposite.name}）`}
                </p>
              </div>
              <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${tag.tone}`}>{tag.label}</span>
              <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted transition group-open:rotate-90" />
            </summary>

            <div className="space-y-2 border-t border-line px-4 pb-4 pt-3 text-sm">
              <p className="text-muted">{info.desc}</p>
              {(p.major.length ? p.major : opposite.major).map((s) => (
                <p key={s.name}>
                  <b className="text-cinnabar">{s.name}</b>
                  {s.brightness && <span className="text-xs text-muted">（{BRIGHTNESS_INFO[s.brightness]}）</span>}
                  {s.mutagen && <Mutagen m={s.mutagen} />}：{MAJOR_STAR_INFO[s.name]}
                </p>
              ))}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-good/10 p-2">吉星：{lucky.join("、") || "无"}</div>
                <div className="rounded-lg bg-bad/10 p-2">煞星：{sha.join("、") || "无"}</div>
              </div>
              <p className="text-xs text-muted">
                三方四正：对宫{opposite.name}（{opposite.major.map((s) => s.name).join("、") || "空"}）· {trine
                  .map((t) => `${t.name}（${t.major.map((s) => s.name).join("、") || "空"}）`)
                  .join(" · ")}
              </p>
              <p className="text-xs text-muted">大限：{p.decadal[0]}–{p.decadal[1]} 岁 · 长生：{p.changsheng}</p>
              <Link href={`/master?q=${encodeURIComponent(ask)}`} className="inline-flex items-center gap-1 text-cinnabar">
                <Icon name="sparkle" className="h-4 w-4" /> AI 大师深入解读
              </Link>
            </div>
          </details>
        );
      })}
      </div>

      <Link href="/ziwei" className="btn-ghost flex items-center justify-center lg:hidden">查看紫微命盘</Link>
    </div>
  );
}

export default function PalacesPage() {
  return (
    <ProfileGate title="十二宫详解" subtitle="紫微斗数逐宫解读">
      {(profile) => <PalacesView profile={profile} />}
    </ProfileGate>
  );
}
