"use client";

import { setActiveProfile, useProfileList } from "@/lib/profile";

/** 档案切换：点选即切换，全站资料自动按新档案重新计算 */
export default function ProfileSwitcher({ size = "md" }: { size?: "sm" | "md" }) {
  const list = useProfileList();
  if (list.length < 2) return null;
  return (
    <div role="radiogroup" aria-label="切换档案" className="flex flex-wrap gap-1.5">
      {list.map((p) => (
        <button
          key={p.id}
          role="radio"
          aria-checked={p.active}
          onClick={() => !p.active && setActiveProfile(p.id)}
          className={`rounded-full border font-medium transition ${size === "sm" ? "px-2.5 py-0 text-xs" : "px-3.5 py-1 text-sm"} ${
            p.active ? "border-cinnabar bg-cinnabar text-white" : "border-line bg-card text-muted hover:border-gold hover:text-ink"
          }`}
        >
          {p.profile.name ?? p.id}
        </button>
      ))}
    </div>
  );
}
