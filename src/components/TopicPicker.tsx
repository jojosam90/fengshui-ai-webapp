"use client";

import { useEffect, useState } from "react";
import Icon from "./Icon";
import { ICHING_CATEGORIES, type IChingSelection } from "@/lib/ichingTopics";

/** 选择求测方向：大类手风琴（一次展开一个），点选具体问题后关闭 */
export default function TopicPicker({
  value,
  onSelect,
  onClose,
}: {
  value: IChingSelection | null;
  onSelect: (s: IChingSelection) => void;
  onClose: () => void;
}) {
  const [openCat, setOpenCat] = useState<string | null>(value?.category ?? null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="选择求测方向">
      <button className="absolute inset-0 bg-ink/40" aria-label="关闭" onClick={onClose} />
      <div className="fade-up relative flex max-h-[88dvh] w-full flex-col rounded-t-3xl bg-paper shadow-2xl sm:max-w-lg sm:rounded-3xl">
        <div className="flex items-center justify-between px-5 pb-3 pt-5">
          <h2 className="font-serif text-2xl font-bold">选择求测方向</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full bg-card-2 text-muted hover:text-ink" aria-label="关闭">
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <div className="pb-safe space-y-2.5 overflow-y-auto px-5 pb-6">
          {ICHING_CATEGORIES.map((cat) => {
            const open = openCat === cat.name;
            return (
              <div key={cat.name} className={open ? "overflow-hidden rounded-xl bg-card-2" : ""}>
                <button
                  onClick={() => setOpenCat(open ? null : cat.name)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between rounded-xl border border-line border-l-4 border-l-cinnabar bg-card px-5 py-4 text-left shadow-sm"
                >
                  <span className="font-serif text-lg font-bold">{cat.name}</span>
                  <span className="flex items-center gap-2">
                    {value?.category === cat.name && !open && (
                      <span className="rounded bg-cinnabar-soft px-1.5 text-xs text-cinnabar">{value.topic.title}</span>
                    )}
                    <Icon name="chevron" className={`h-4 w-4 text-muted transition ${open ? "rotate-90" : ""}`} />
                  </span>
                </button>

                {open && (
                  <ul className="fade-up space-y-2 p-3">
                    {cat.topics.map((t) => {
                      const selected = value?.category === cat.name && value.topic.title === t.title;
                      return (
                        <li key={t.title}>
                          <button
                            onClick={() => onSelect({ category: cat.name, topic: t })}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg border px-4 py-3 text-left transition hover:border-gold ${
                              selected ? "border-cinnabar bg-cinnabar-soft" : "border-line bg-card"
                            }`}
                          >
                            <span className="shrink-0 font-serif font-bold">{t.title}</span>
                            <span className="truncate text-sm text-muted">{t.desc}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
