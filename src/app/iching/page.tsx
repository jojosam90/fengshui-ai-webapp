"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import CoinTray, { type CoinFace } from "@/components/CoinTray";
import Icon from "@/components/Icon";
import PageHeader from "@/components/PageHeader";
import TopicPicker from "@/components/TopicPicker";
import { EMPERORS } from "@/components/WuDiCoin";
import { setCoinSound, unlockAudio, useCoinSound } from "@/lib/coinSound";
import { type Hexagram, type LineValue, castResult, isChanging, isYang, tossLine } from "@/lib/iching";
import type { IChingSelection } from "@/lib/ichingTopics";

const LINE_NAME: Record<LineValue, string> = { 6: "老阴 ×", 7: "少阳", 8: "少阴", 9: "老阳 ○" };

function Line({ yang, changing, small }: { yang: boolean; changing?: boolean; small?: boolean }) {
  const color = changing ? "bg-cinnabar" : "bg-ink";
  const h = small ? "h-1.5" : "h-3";
  return yang ? (
    <div className={`${h} w-full rounded-sm ${color}`} />
  ) : (
    <div className="flex w-full gap-[18%]">
      <div className={`${h} flex-1 rounded-sm ${color}`} />
      <div className={`${h} flex-1 rounded-sm ${color}`} />
    </div>
  );
}

function HexCard({ hex, label, values }: { hex: Hexagram; label: string; values?: number[] }) {
  return (
    <div className="card fade-up p-3.5">
      <div className="flex items-start gap-4">
        <div className="flex w-16 shrink-0 flex-col-reverse gap-1.5 pt-1">
          {(values ?? [...hex.lower.lines, ...hex.upper.lines]).map((v, i) => (
            <Line key={i} yang={v === 1} small />
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted">{label} · 第{hex.number}卦</p>
          <p className="font-serif text-2xl font-bold">
            {hex.fullName}
          </p>
          <p className="text-xs text-muted">
            上{hex.upper.name}{hex.upper.symbol}（{hex.upper.image}） 下{hex.lower.name}{hex.lower.symbol}（{hex.lower.image}）
          </p>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-card-2 p-3 font-serif text-xs leading-relaxed">
        <span className="text-gold">卦辞：</span>{hex.name}：{hex.judgment}
      </p>
      <p className="mt-2 text-sm leading-relaxed">{hex.meaning}</p>
    </div>
  );
}

const emperorsFor = (n: number) => [0, 1, 2].map((i) => EMPERORS[(n + i) % EMPERORS.length]);
const FACE_NAME: Record<CoinFace, string> = { 3: "字", 2: "背" };

export default function IChingPage() {
  const [question, setQuestion] = useState("");
  const [topic, setTopic] = useState<IChingSelection | null>(null);
  const [picker, setPicker] = useState(false);
  const closePicker = useCallback(() => setPicker(false), []);
  const [values, setValues] = useState<LineValue[]>([]);
  const [lastCoins, setLastCoins] = useState<CoinFace[] | null>(null);
  const [tossKey, setTossKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [auto, setAuto] = useState(false);
  const soundOn = useCoinSound();
  const pending = useRef<LineValue | null>(null);

  const done = values.length === 6;
  const result = done ? castResult(values) : null;
  const autoRunning = auto && !done;

  const toss = useCallback(() => {
    if (pending.current !== null) return;
    unlockAudio();
    const t = tossLine();
    pending.current = t.value;
    setLastCoins(t.coins);
    setBusy(true);
    setTossKey((k) => k + 1);
  }, []);

  // 铜钱落定后才记下这一爻
  const onLanded = useCallback(() => {
    const v = pending.current;
    pending.current = null;
    if (v !== null) setValues((prev) => (prev.length < 6 ? [...prev, v] : prev));
    setBusy(false);
  }, []);

  // 一键起卦：一爻落定后自动接着摇下一爻
  useEffect(() => {
    if (!autoRunning || busy) return;
    const t = window.setTimeout(toss, 180);
    return () => window.clearTimeout(t);
  }, [autoRunning, busy, values.length, toss]);

  function reset() {
    pending.current = null;
    setAuto(false);
    setBusy(false);
    setValues([]);
    setLastCoins(null);
  }

  const matter = [topic && `${topic.category} · ${topic.topic.title}（${topic.topic.desc}）`, question.trim()]
    .filter(Boolean)
    .join("：");
  const askPrompt = result
    ? `我以周易六爻占问：「${matter || "近期运势"}」。得本卦「${result.primary.fullName}」（第${result.primary.number}卦）${
        result.changed ? `，动爻为${result.changingLabels.join("、")}，变卦「${result.changed.fullName}」` : "，六爻安静无动爻"
      }。请结合卦象、爻辞为我详细解读，并给出建议。`
    : "";

  const lastValue = values[values.length - 1];

  return (
    <div className="space-y-4 lg:space-y-5">
      <PageHeader info="iching" title="周易占卜" subtitle="心诚则灵 · 一事一占" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-5">
      <section className="card p-3.5 lg:sticky lg:top-6 lg:p-5">
        <p className="mb-1.5 text-sm text-muted">求测方向</p>
        <button
          onClick={() => setPicker(true)}
          disabled={values.length > 0 || busy}
          className="input mb-3 flex items-center justify-between gap-2 text-left disabled:opacity-60"
          aria-haspopup="dialog"
        >
          {topic ? (
            <span className="min-w-0">
              <span className="font-semibold">
                {topic.category} · <span className="text-cinnabar">{topic.topic.title}</span>
              </span>
              <span className="block truncate text-xs text-muted">{topic.topic.desc}</span>
            </span>
          ) : (
            <span className="text-muted">请选择要问的方向（感情、事业、财运…）</span>
          )}
          <Icon name="chevron" className="h-4 w-4 shrink-0 text-muted" />
        </button>

        <label htmlFor="q" className="mb-1.5 block text-sm text-muted">
          {topic ? "补充具体情况（选填）" : "心中默念所问之事"}
        </label>
        <input
          id="q"
          className="input"
          placeholder={topic ? `如：${topic.topic.desc.split(" · ")[0]}？` : "如：这次换工作是否顺利？"}
          value={question}
          maxLength={80}
          disabled={values.length > 0 || busy}
          onChange={(e) => setQuestion(e.target.value)}
        />

        {picker && (
          <TopicPicker
            value={topic}
            onClose={closePicker}
            onSelect={(t) => {
              setTopic(t);
              setPicker(false);
            }}
          />
        )}

        {/* 五帝钱卦盘 */}
        <div className="relative mt-6">
          <button
            onClick={() => {
              setCoinSound(!soundOn);
              if (!soundOn) unlockAudio();
            }}
            aria-pressed={soundOn}
            aria-label={soundOn ? "关闭铜钱声音" : "开启铜钱声音"}
            title={soundOn ? "关闭声音" : "开启声音"}
            className="absolute right-3 top-3 z-10 rounded-full bg-black/30 px-2 py-0.5 text-sm text-[#f0cf8a] hover:bg-black/45"
          >
            {soundOn ? "🔊 声音" : "🔇 静音"}
          </button>
          <CoinTray coins={lastCoins} tossKey={tossKey} emperors={emperorsFor(Math.max(0, tossKey - 1))} fast={autoRunning} onLanded={onLanded} />
        </div>

        <p className="mt-3 min-h-6 text-center text-sm" aria-live="polite">
          {busy ? (
            <span className="text-muted">铜钱落下中…</span>
          ) : lastCoins && lastValue ? (
            <>
              第 {values.length} 爻：
              <b className="font-serif">{lastCoins.map((c) => FACE_NAME[c]).join(" · ")}</b>
              <span className="mx-1 text-muted">→</span>
              <b className={isChanging(lastValue) ? "text-cinnabar" : "text-gold"}>
                {LINE_NAME[lastValue]}（{lastValue}）
              </b>
            </>
          ) : (
            <span className="text-muted">五帝钱：顺治 · 康熙 · 雍正 · 乾隆 · 嘉庆</span>
          )}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {!done ? (
            <>
              <button className="btn-primary" onClick={toss} disabled={busy || autoRunning}>
                摇卦（第 {Math.min(values.length + 1, 6)} 爻）
              </button>
              <button className="btn-ghost disabled:opacity-50" onClick={() => { setAuto(true); if (!busy) toss(); }} disabled={autoRunning}>
                {autoRunning ? "起卦中…" : "一键起卦"}
              </button>
            </>
          ) : (
            <button className="btn-ghost col-span-2 flex items-center justify-center gap-1.5" onClick={reset}>
              <Icon name="refresh" className="h-4 w-4" /> 重新起卦
            </button>
          )}
        </div>
        <p className="mt-3 text-center text-xs text-muted">三钱法：字为阳记三，背为阴记二；六次成卦，自下而上</p>
      </section>

      {result ? (
        <div className="space-y-4">
          {matter && (
            <div className="rounded-2xl border border-gold/25 bg-gold-soft/50 px-4 py-3 text-sm">
              <span className="mr-1.5 rounded bg-gold px-1.5 py-0.5 text-xs font-semibold text-white">所问</span>
              {topic && (
                <b className="font-serif">
                  {topic.category} · <span className="text-cinnabar">{topic.topic.title}</span>
                </b>
              )}
              {question.trim() && <span className="text-muted">{topic ? "：" : ""}{question.trim()}</span>}
            </div>
          )}
          <HexCard hex={result.primary} label="本卦" values={values.map((v) => (isYang(v) ? 1 : 0))} />
          {result.changed ? (
            <>
              <p className="text-center text-sm text-muted">
                动爻：<span className="font-bold text-cinnabar">{result.changingLabels.join("、")}</span> ↓ 变卦
              </p>
              <HexCard hex={result.changed} label="变卦" />
            </>
          ) : (
            <p className="text-center text-sm text-muted">六爻安静，以本卦卦辞为断</p>
          )}
          <Link href={`/master?q=${encodeURIComponent(askPrompt)}`} className="btn-primary flex items-center justify-center gap-2">
            <Icon name="sparkle" className="h-5 w-5" /> 请 AI 大师详解此卦
          </Link>
        </div>
      ) : (
        <section className="card flex flex-col p-4 lg:min-h-[34rem] lg:p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="font-serif text-lg font-bold">卦象</h2>
            <span className="text-sm text-muted">{values.length} / 6 爻</span>
          </div>
          <p className="text-xs text-muted">自下而上，每摇一次得一爻</p>

          <div className="mx-auto my-auto flex w-full max-w-sm flex-col-reverse gap-3 py-6">
            {Array.from({ length: 6 }, (_, i) => {
              const v = values[i];
              const isNew = i === values.length - 1;
              return (
                <div key={i} className={`flex items-center gap-3 ${isNew ? "fade-up" : ""}`}>
                  <span className="w-6 text-right font-serif text-sm text-muted">{["初", "二", "三", "四", "五", "上"][i]}</span>
                  <div className="flex-1">
                    {v ? (
                      <Line yang={isYang(v)} changing={isChanging(v)} />
                    ) : (
                      <div className={`h-3 rounded-sm border border-dashed ${i === values.length ? "border-gold" : "border-line"}`} />
                    )}
                  </div>
                  <span className={`w-14 text-xs ${v && isChanging(v) ? "font-semibold text-cinnabar" : "text-muted"}`}>
                    {v ? LINE_NAME[v] : i === values.length ? "待摇" : ""}
                  </span>
                </div>
              );
            })}
          </div>

          {values.length === 0 && (
            <p className="text-center text-sm text-muted">
              <span className="font-serif text-gold">心诚则灵</span> · 默念所问之事，摇卦六次，卦象将显示于此
            </p>
          )}
        </section>
      )}
      </div>
    </div>
  );
}
