"use client";

import { setScript, useScript } from "@/lib/script";

export default function ScriptToggle() {
  const script = useScript();
  return (
    <div className="flex rounded-full border border-line bg-card p-0.5 text-xs" role="group" aria-label="简繁切换">
      {(["cn", "tw"] as const).map((s) => (
        <button
          key={s}
          onClick={() => setScript(s)}
          aria-pressed={script === s}
          className={`rounded-full px-2 py-0.5 font-medium ${script === s ? "seal" : "text-muted"}`}
        >
          {s === "cn" ? "简" : "繁"}
        </button>
      ))}
    </div>
  );
}
