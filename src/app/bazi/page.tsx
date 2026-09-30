"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import BirthForm from "@/components/BirthForm";
import FloatingWindow from "@/components/FloatingWindow";
import HoverTip from "@/components/HoverTip";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import TalentRadar from "@/components/TalentRadar";
import WuxingBars, { wxText } from "@/components/WuxingBars";
import WuxingDiagram from "@/components/WuxingDiagram";
import { type BirthInfo, computeBazi, currentDaYun, explainTerms } from "@/lib/bazi";
import { saveProfile, useProfile } from "@/lib/profile";
import { liuNianYear } from "@/lib/luck";
import { useToday } from "@/lib/useToday";
import { type Fit, industriesFor, talentProfile } from "@/lib/talent";
import { WX_LUCKY_COLORS, WX_DIRECTION, WX_TRAITS } from "@/lib/wuxing";

export default function BaziPage() {
  const [profile, ready] = useProfile();
  const [other, setOther] = useState<BirthInfo | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showWuxing, setShowWuxing] = useState(false);
  const [showTalent, setShowTalent] = useState(false);

  const subject = other ?? profile;
  const r = useMemo(() => (subject ? computeBazi(subject) : null), [subject]);
  // 当前大运、流年相关内容随日期更新（跨年自动刷新）
  const today = useToday();
  const thisYear = liuNianYear(today ?? new Date());
  const cur = r ? currentDaYun(r, thisYear) : undefined;
  const terms = useMemo(() => (r ? explainTerms(r, thisYear) : null), [r, thisYear]);
  const career = useMemo(() => (r ? industriesFor(r) : null), [r]);
  const talents = useMemo(() => (r ? talentProfile(r, thisYear) : []), [r, thisYear]);

  if (!ready) return <PageHeader title="八字排盘" />;

  if (!r || !terms || !career || showForm) {
    return (
      <div>
        <PageHeader title="八字排盘" subtitle="输入出生信息，推演四柱命盘" />
        <section className="card p-3.5 lg:max-w-2xl lg:p-5">
          <BirthForm
            initial={showForm ? null : profile}
            onSubmit={(info) => {
              if (!profile) saveProfile(info);
              else setOther(info);
              setShowForm(false);
            }}
          />
          {!profile && <p className="mt-3 text-center text-xs text-muted">首次排盘将自动保存为您的档案</p>}
          {showForm && (
            <button className="btn-ghost mt-2 w-full" onClick={() => setShowForm(false)}>取消</button>
          )}
        </section>
      </div>
    );
  }

  const rows: { label: string; render: (i: number) => React.ReactNode }[] = [
    { label: "十神", render: (i) => <span className="text-xs text-gold">{r.pillars[i].shiShen}</span> },
    {
      label: "天干",
      render: (i) => <span className={`font-serif text-3xl font-bold lg:text-4xl ${wxText(r.pillars[i].ganWx)}`}>{r.pillars[i].gan}</span>,
    },
    {
      label: "地支",
      render: (i) => <span className={`font-serif text-3xl font-bold lg:text-4xl ${wxText(r.pillars[i].zhiWx)}`}>{r.pillars[i].zhi}</span>,
    },
    {
      label: "藏干",
      render: (i) => (
        <div className="space-y-0.5 text-xs leading-tight">
          {r.pillars[i].hidden.map((h) => (
            <div key={h.gan}>
              <span className={wxText(h.wx)}>{h.gan}</span>
              <span className="text-muted">{h.shiShen}</span>
            </div>
          ))}
        </div>
      ),
    },
    { label: "纳音", render: (i) => <span className="text-xs text-muted">{r.pillars[i].naYin}</span> },
  ];

  const askPrompt = `请详细解读${other ? "这位朋友" : "我"}的八字命盘：性格特点、事业方向、财运、感情婚姻、健康注意事项，以及当前大运与${thisYear}年流年的运势。`;

  return (
    <div className="space-y-4">
      <PageHeader info="bazi"
        title={`${r.input.name ?? (other ? "他人" : "我")}的命盘`}
        subtitle={`${r.solarText} · ${r.lunarText}${r.input.place ? ` · ${r.input.place}` : ""}`}
        actions={
          <>
            {other && <button className="btn-ghost text-sm" onClick={() => setOther(null)}>返回我的命盘</button>}
            <button className="btn-ghost text-sm" onClick={() => setShowForm(true)}>为他人排盘</button>
            {!other && (
              <Link href={`/master?q=${encodeURIComponent(askPrompt)}`} className="btn-primary flex items-center gap-1.5 text-sm">
                <Icon name="sparkle" className="h-4 w-4" /> AI 解读命盘
              </Link>
            )}
          </>
        }
      />

      <div className="flex gap-2 lg:hidden">
        {other && (
          <button className="btn-ghost flex-1 text-sm" onClick={() => setOther(null)}>返回我的命盘</button>
        )}
        <button className="btn-ghost flex-1 text-sm" onClick={() => setShowForm(true)}>为他人排盘</button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
      {/* 四柱 */}
      <section className="card flex flex-col overflow-hidden lg:col-span-5">
        <div className="grid border-b border-line bg-card-2 text-center text-sm" style={{ gridTemplateColumns: `2.6rem repeat(${r.pillars.length}, 1fr)` }}>
          <div className="py-2 text-xs text-muted">{r.input.gender === "male" ? "乾造" : "坤造"}</div>
          {r.pillars.map((p) => (
            <div key={p.label} className="py-2 font-medium">{p.label}</div>
          ))}
        </div>
        {rows.map((row) => (
          <div key={row.label} className="grid flex-1 items-center border-b border-line/60 text-center last:border-0" style={{ gridTemplateColumns: `2.6rem repeat(${r.pillars.length}, 1fr)` }}>
            <div className="py-2 text-xs text-muted">{row.label}</div>
            {r.pillars.map((_, i) => (
              <div key={i} className="py-1.5 lg:py-2">{row.render(i)}</div>
            ))}
          </div>
        ))}
      </section>

      {/* 适合行业 */}
      <section className="card flex flex-col p-3.5 lg:col-span-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-bold">
            适合行业
          </h2>
          <button
            onClick={() => setShowTalent(true)}
            aria-pressed={showTalent}
            className={`btn-ghost flex shrink-0 items-center gap-1 px-3 py-1 text-sm ${showTalent ? "!border-gold text-gold" : ""}`}
          >
            <Icon name="sparkle" className="h-4 w-4 text-gold" /> 天赋雷达
          </button>
        </div>
        <div className="divide-y divide-line/70">
          {career.rows.map((row) => (
            <div key={row.wx} className="flex items-start gap-2.5 py-1">
              <span className={`w-6 shrink-0 text-center font-serif text-xl font-bold leading-7 ${wxText(row.wx)}`}>{row.wx}</span>
              <span className={`mt-0.5 shrink-0 rounded-md px-1.5 text-xs font-bold leading-6 ${FIT_CLASS[row.fit]}`}>{row.fit}</span>
              <p className={`min-w-0 text-xs leading-snug ${row.fit === "慎选" ? "text-muted line-through decoration-muted/40" : ""}`}>
                {row.industries}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-auto rounded-xl bg-gold-soft/60 px-2.5 py-1.5 text-xs leading-snug">
          用神<b className={wxText(career.role.wx)}>{career.role.wx}</b>为<b>{career.role.god}</b>，角色宜：{career.role.text}
        </p>
      </section>

      {/* 日主 */}
      <section className="card p-3.5 lg:col-span-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-card-2 font-serif text-3xl font-bold ${wxText(r.dayMasterWx)}`}>
            {r.dayMaster}
          </span>
          <div>
            <p className="text-sm text-muted">日主 · 命主本人</p>
            <p className="font-serif text-xl font-bold">
              {r.dayMaster}{r.dayMasterWx}命 · <span className="text-cinnabar">{r.strength}</span>
            </p>
          </div>
        </div>
        <p className="mt-3 text-sm leading-relaxed">
          {r.dayMasterWx}命之人{WX_TRAITS[r.dayMasterWx]}。命局中同党力量约占 {Math.round(r.supportRatio * 100)}%，
          {r.strength === "身强" ? "自身能量充沛，宜泄耗以求平衡" : r.strength === "身弱" ? "自身能量偏弱，宜生扶以增助力" : "五行较为平衡"}。
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl bg-good/10 p-2.5">
            <p className="text-xs text-muted">喜用五行</p>
            <p className="font-serif text-lg font-bold">
              {r.favorable.map((w) => <span key={w} className={`mr-1 ${wxText(w)}`}>{w}</span>)}
            </p>
          </div>
          <div className="rounded-xl bg-bad/10 p-2.5">
            <p className="text-xs text-muted">忌用五行</p>
            <p className="font-serif text-lg font-bold">
              {r.unfavorable.map((w) => <span key={w} className={`mr-1 ${wxText(w)}`}>{w}</span>)}
            </p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">
          开运建议：多用{WX_LUCKY_COLORS[r.favorable[0]].join("、")}，常往{WX_DIRECTION[r.favorable[0]]}发展。
          （喜用神采用简化扶抑法推算，仅供参考）
        </p>
      </section>

      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* 五行 */}
      <section className="card p-3.5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="font-serif text-lg font-bold">
            五行分布
            {r.missing.length > 0 && <span className="ml-2 text-sm font-normal text-cinnabar">五行缺{r.missing.join("、")}</span>}
          </h2>
          <button
            onClick={() => setShowWuxing(true)}
            aria-pressed={showWuxing}
            className={`btn-ghost flex shrink-0 items-center gap-1 px-3 py-1 text-sm ${showWuxing ? "!border-gold text-gold" : ""}`}
          >
            <span className="font-serif font-bold text-gold">☯</span> 五行
          </button>
        </div>
        <WuxingBars percents={r.percents} highlight={r.favorable} />
      </section>

      <div className="flex flex-col gap-4 lg:col-span-2 lg:gap-3">
      {/* 大运 */}
      <section id="dayun" className="card scroll-mt-20 p-3.5">
        <h2 className="font-serif text-lg font-bold">大运</h2>
        <p className="mb-3 text-xs text-muted">{r.qiYunText}</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-8 lg:overflow-visible lg:px-0">
          {r.daYun.map((d) => {
            const active = d === cur;
            return (
              <div
                key={d.ganZhi}
                className={`w-[4.5rem] shrink-0 rounded-xl border p-2 text-center lg:w-auto ${active ? "border-cinnabar bg-cinnabar-soft" : "border-line bg-card-2"}`}
              >
                <p className="text-xs text-muted">虚岁{d.startAge}</p>
                <p className="font-serif text-xl font-bold">{d.ganZhi}</p>
                <p className="text-xs text-gold">{d.shiShen}</p>
                <p className="text-xs text-muted">{d.startYear}</p>
                {active && <p className="mt-0.5 text-xs font-bold text-cinnabar">当前</p>}
              </div>
            );
          })}
        </div>
      </section>

        <section className="card grid grid-cols-3 divide-x divide-line p-1.5 text-center text-sm">
          {(["mingGong", "taiYuan", "kongWang"] as const).map((k) => {
            const t = terms[k];
            return (
              <HoverTip
                key={k}
                label={`${t.title}：${r[k]}，查看说明`}
                className="rounded-lg px-1 py-1.5"
                tip={
                  <>
                    <p className="font-serif text-lg font-bold">
                      {t.title} <span className="text-cinnabar">{r[k]}</span>
                    </p>
                    <p className="mt-1">{t.what}</p>
                    <p className="mt-1.5 font-semibold">{t.mine}</p>
                    <p className="mt-1.5 rounded-lg bg-gold-soft/70 px-2.5 py-1.5 text-muted">💡 {t.tip}</p>
                  </>
                }
              >
                <p className="text-xs text-muted">
                  {t.title} <span className="text-gold">ⓘ</span>
                </p>
                <p className="font-serif font-bold">{r[k]}</p>
              </HoverTip>
            );
          })}
        </section>
      </div>

      </div>


      {!other && (
        <Link href={`/master?q=${encodeURIComponent(askPrompt)}`} className="btn-primary flex items-center justify-center gap-2 lg:hidden">
          <Icon name="sparkle" className="h-5 w-5" /> 请 AI 大师解读命盘
        </Link>
      )}
      {showTalent && (
        <FloatingWindow title={<><Icon name="sparkle" className="h-5 w-5 text-gold" /> 天赋雷达</>} onClose={() => setShowTalent(false)}>
          <div className="mx-auto aspect-[344/262] w-full max-w-[22rem]">
            <TalentRadar data={talents} />
          </div>
          <ul className="mt-1 divide-y divide-line/70">
            {talents.map((t) => (
              <li key={t.key} className="flex items-baseline gap-2 py-1">
                <span className="w-9 shrink-0 font-bold">{t.label}</span>
                <span className="w-7 shrink-0 text-right font-serif font-bold text-cinnabar">{t.score}</span>
                <span className={`shrink-0 rounded-md px-1.5 text-xs font-bold ${LEVEL_CLASS[t.level]}`}>{t.level}</span>
                <span className="min-w-0 text-xs leading-snug text-muted">{t.note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted">依十神力量、喜忌与当前大运估算，仅供参考。</p>
        </FloatingWindow>
      )}
      {showWuxing && (
        <FloatingWindow title={<><span className="font-serif text-gold">☯</span> 五行生克</>} onClose={() => setShowWuxing(false)}>
          <div className="mx-auto aspect-square w-full max-w-[26rem]">
            <WuxingDiagram percents={r.percents} dayMaster={r.dayMasterWx} favorable={r.favorable} />
          </div>
          <p className="mt-2 text-sm leading-relaxed">
            <b className="text-good">相生</b>（外圈）：木生火、火生土、土生金、金生水、水生木。
            <br />
            <b className="text-cinnabar">相克</b>（内星）：木克土、土克水、水克火、火克金、金克木。
          </p>
          <p className="mt-1 text-xs text-muted">
            圆内为您命局的五行占比；红色虚线圈为日主（{r.dayMaster}
            {r.dayMasterWx}），标「喜用」者宜多补。
          </p>
        </FloatingWindow>
      )}
    </div>
  );
}

const FIT_CLASS: Record<Fit, string> = {
  首选: "bg-good text-white",
  次选: "bg-good/15 text-good",
  可选: "bg-card-2 text-muted",
  慎选: "bg-bad/10 text-bad",
};

const LEVEL_CLASS: Record<string, string> = {
  突出: "bg-good text-white",
  良好: "bg-good/15 text-good",
  平稳: "bg-gold-soft text-gold",
  待加强: "bg-bad/10 text-bad",
};
