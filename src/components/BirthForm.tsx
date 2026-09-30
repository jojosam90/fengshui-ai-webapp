"use client";

import { useId, useState } from "react";
import type { BirthInfo, Gender } from "@/lib/bazi";

const pad = (n: number) => String(n).padStart(2, "0");
const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function BirthForm({
  initial,
  submitLabel = "开始排盘",
  onSubmit,
  namePlaceholder = "如：张三（选填）",
}: {
  initial?: BirthInfo | null;
  submitLabel?: string;
  onSubmit: (info: BirthInfo) => void;
  namePlaceholder?: string;
}) {
  const id = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<Gender>(initial?.gender ?? "male");
  const [date, setDate] = useState(
    initial ? `${initial.year}-${pad(initial.month)}-${pad(initial.day)}` : "1995-06-15",
  );
  const [time, setTime] = useState(initial ? `${pad(initial.hour)}:${pad(initial.minute)}` : "12:00");
  const [hourUnknown, setHourUnknown] = useState(initial?.hourUnknown ?? false);
  const [place, setPlace] = useState(initial?.place ?? "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const [y, m, d] = date.split("-").map(Number);
    const [hh, mm] = time.split(":").map(Number);
    if (!y || !m || !d) return;
    onSubmit({ name: name.trim() || undefined, gender, year: y, month: m, day: d, hour: hh || 0, minute: mm || 0, hourUnknown, place: place.trim() || undefined });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label htmlFor={`${id}-name`} className="mb-1.5 block text-sm text-muted">姓名 / 昵称</label>
        <input id={`${id}-name`} className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={namePlaceholder} maxLength={20} />
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm text-muted">性别</legend>
        <div className="grid grid-cols-2 gap-2">
          {(["male", "female"] as const).map((g) => (
            <button
              type="button"
              key={g}
              onClick={() => setGender(g)}
              className={`rounded-xl border py-2.5 font-medium transition ${gender === g ? "border-cinnabar bg-cinnabar-soft text-cinnabar" : "border-line bg-card"}`}
              aria-pressed={gender === g}
            >
              {g === "male" ? "男 · 乾造" : "女 · 坤造"}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid grid-cols-5 gap-2">
        <div className="col-span-3">
          <label htmlFor={`${id}-date`} className="mb-1.5 block text-sm text-muted">出生日期（公历）</label>
          <input id={`${id}-date`} type="date" required min="1901-01-01" max={todayIso()} className="input" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="col-span-2">
          <label htmlFor={`${id}-time`} className="mb-1.5 block text-sm text-muted">出生时间</label>
          <input id={`${id}-time`} type="time" disabled={hourUnknown} className="input disabled:opacity-40" value={time} onChange={(e) => setTime(e.target.value)} />
        </div>
      </div>

      <div>
        <label htmlFor={`${id}-place`} className="mb-1.5 block text-sm text-muted">出生地（选填）</label>
        <input id={`${id}-place`} className="input" value={place} onChange={(e) => setPlace(e.target.value)} placeholder="如：马来西亚怡保" maxLength={30} />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={hourUnknown} onChange={(e) => setHourUnknown(e.target.checked)} className="h-4 w-4 accent-[var(--cinnabar)]" />
        不清楚出生时辰（将只排年、月、日三柱）
      </label>

      <button type="submit" className="btn-primary w-full">{submitLabel}</button>
    </form>
  );
}
