"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore } from "react";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import { DOOR_LUCK, QIMEN_GRID, computeQimen } from "@/lib/qimen";
import { subscribeClock } from "@/lib/useToday";

const pad = (n: number) => String(n).padStart(2, "0");
const toLocalInput = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

const DOOR_TONE: Record<string, string> = { 吉: "text-good", 中: "text-gold", 凶: "text-bad" };

export default function QimenPage() {
  // 当前时辰：挂载后读取，并随时钟自动更新（每小时换局）
  const nowKey = useSyncExternalStore(subscribeClock, () => toLocalInput(new Date()).slice(0, 13), () => "");
  const [picked, setPicked] = useState<string | null>(null);
  const [matter, setMatter] = useState("");
  const value = picked ?? (nowKey ? `${nowKey}:00` : "");

  const q = useMemo(() => (value ? computeQimen(new Date(value)) : null), [value]);
  const [focus, setFocus] = useState<number | null>(null);

  if (!q) return <PageHeader title="奇门遁甲" />;
  const byNum = Object.fromEntries(q.palaces.map((p) => [p.num, p]));
  const sel = byNum[focus ?? q.best[0]?.num ?? 1];

  const ask = `我用奇门遁甲为「${matter || "近期所求之事"}」起局（${q.dateText}，${q.yang ? "阳" : "阴"}遁${q.ju}局，值符${q.zhiFu}，值使${q.zhiShi}）。请分析吉凶、最佳行动方位与时机。`;

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader info="qimen" title="奇门遁甲" subtitle="时家转盘 · 拆补法" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-start lg:gap-5">
      <div className="space-y-4 lg:col-span-3">
      <section className="card space-y-3 p-3.5">
        <div className="grid grid-cols-5 gap-2 lg:grid-cols-1">
          <label className="col-span-3 text-sm text-muted lg:col-span-1">
            起局时间
            <input
              type="datetime-local"
              className="input mt-1"
              value={value}
              onChange={(e) => {
                setPicked(e.target.value);
                setFocus(null);
              }}
            />
          </label>
          <label className="col-span-2 text-sm text-muted lg:col-span-1">
            所问之事
            <input className="input mt-1" placeholder="如：签约" value={matter} maxLength={40} onChange={(e) => setMatter(e.target.value)} />
          </label>
        </div>
        {picked && (
          <button className="text-sm text-cinnabar" onClick={() => setPicked(null)}>回到当前时辰</button>
        )}
      </section>

      <section className="card p-3.5">
        <div className="grid grid-cols-4 gap-y-1 text-center text-sm">
          {["年", "月", "日", "时"].map((l, i) => (
            <div key={l}>
              <p className="text-xs text-muted">{l}柱</p>
              <p className="font-serif text-lg font-bold">{q.pillars[i]}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-sm">
          {q.jieQi}{q.yuan} · <b className="text-cinnabar">{q.yang ? "阳" : "阴"}遁{q.ju}局</b> · 旬首{q.xunShou}
        </p>
        <p className="text-center text-sm text-muted">值符 {q.zhiFu} · 值使 {q.zhiShi} · 旬空 {q.kongWang}</p>
        {q.special.map((s) => (
          <p key={s} className="mt-2 rounded-lg bg-gold-soft px-3 py-1.5 text-center text-xs text-gold">{s}</p>
        ))}
      </section>

      </div>

      <section className="lg:col-span-5">
        <p className="mb-1.5 text-center text-xs text-muted">上南 · 下北 · 左东 · 右西</p>
        <div className="grid grid-cols-3 gap-1.5">
          {QIMEN_GRID.map((n) => {
            const p = byNum[n];
            if (n === 5) {
              return (
                <div key={n} className="flex aspect-square flex-col items-center justify-center rounded-xl bg-card-2 text-center">
                  <p className="text-xs text-muted">中五宫</p>
                  <p className="font-serif text-2xl font-bold text-gold">{p.earth}</p>
                  <p className="text-xs text-muted">寄坤二宫</p>
                </div>
              );
            }
            const door = DOOR_LUCK[p.door!];
            const active = sel.num === n;
            return (
              <button
                key={n}
                onClick={() => setFocus(n)}
                className={`relative flex aspect-square flex-col justify-between rounded-xl border-2 p-1.5 text-left transition ${
                  active ? "border-cinnabar bg-cinnabar-soft" : "border-line bg-card"
                }`}
              >
                <div className="flex items-start justify-between text-xs lg:text-xs">
                  <span className="font-medium text-gold">{p.god}</span>
                  <span className="text-muted">{p.gua}{p.num}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xl font-bold leading-none lg:text-3xl">
                    {p.heaven}
                    {p.heaven2 && <span className="text-sm text-muted">{p.heaven2}</span>}
                  </span>
                  <span className="text-xs lg:text-sm">{p.star}{p.star2 && <span className="block text-xs text-muted">{p.star2}</span>}</span>
                </div>
                <div className="flex items-end justify-between">
                  <span className="font-serif text-base text-muted leading-none lg:text-xl">{p.earth}</span>
                  <span className={`text-xs font-bold lg:text-sm ${DOOR_TONE[door.luck]}`}>{p.door}</span>
                </div>
                <div className="absolute left-1/2 top-1 flex -translate-x-1/2 gap-0.5">
                  {p.kong && <span className="rounded-sm bg-ink/70 px-0.5 text-xs text-paper">空</span>}
                  {p.horse && <span className="rounded-sm bg-water px-0.5 text-xs text-white">马</span>}
                </div>
              </button>
            );
          })}
        </div>
        <p className="mt-1.5 text-center text-xs text-muted">每宫：上八神 · 中天盘干与九星 · 下地盘干与八门</p>
      </section>

      <div className="space-y-4 lg:col-span-4">
      <section className="card fade-up p-3.5" key={sel.num}>
        <p className="text-xs text-muted">{sel.gua}{sel.num}宫 · {sel.dir}方</p>
        <p className="font-serif text-xl font-bold">
          {sel.door} · {sel.star} · {sel.god}
        </p>
        <p className="mt-2 text-sm">
          <span className={`font-semibold ${DOOR_TONE[DOOR_LUCK[sel.door!].luck]}`}>{sel.door}（{DOOR_LUCK[sel.door!].luck}）</span>：宜{DOOR_LUCK[sel.door!].desc}
        </p>
        <p className="mt-1 text-sm text-muted">
          天盘{sel.heaven}{sel.heaven2 ?? ""}加地盘{sel.earth}
          {sel.kong && "，逢旬空，所求多虚"}
          {sel.horse && "，驿马临宫，主变动、出行"}
        </p>
        {sel.patterns.map((t) => (
          <p key={t} className="mt-1 text-sm text-cinnabar">◆ {t}</p>
        ))}
      </section>

      {q.best.length > 0 && (
        <section className="card p-3.5">
          <h2 className="mb-2 font-serif text-lg font-bold">此时吉方</h2>
          <div className="grid grid-cols-3 gap-2 text-center">
            {q.best.map((p, i) => (
              <button key={p.num} onClick={() => setFocus(p.num)} className={`rounded-xl p-2.5 ${i === 0 ? "seal" : "bg-card-2"}`}>
                <p className="font-serif text-2xl font-bold">{p.dir}</p>
                <p className="text-xs opacity-80">{p.door}</p>
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">出行、谈判、求财时，可朝向或前往吉方行事。</p>
        </section>
      )}

      <Link href={`/master?q=${encodeURIComponent(ask)}&qt=${encodeURIComponent(value)}`} className="btn-primary flex items-center justify-center gap-2">
        <Icon name="sparkle" className="h-5 w-5" /> 请 AI 大师解盘
      </Link>
      </div>
      </div>
    </div>
  );
}
