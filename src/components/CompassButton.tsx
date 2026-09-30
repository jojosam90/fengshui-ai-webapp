"use client";

import { useNav } from "./AppShell";
import Icon from "./Icon";

/** 打开罗盘浮窗：桌面端显示文字按钮，手机端显示图标 */
export default function CompassButton({ className = "" }: { className?: string }) {
  const { openCompass, compassOpen } = useNav();
  return (
    <>
      <button
        onClick={openCompass}
        aria-pressed={compassOpen}
        className={`btn-ghost hidden items-center gap-1.5 text-sm lg:flex ${compassOpen ? "!border-gold text-gold" : ""} ${className}`}
      >
        <Icon name="compass" className="h-4 w-4" /> 打开罗盘
      </button>
      <button
        onClick={openCompass}
        aria-label="打开罗盘"
        aria-pressed={compassOpen}
        className={`rounded-full p-1.5 hover:bg-card-2 lg:hidden ${compassOpen ? "text-gold" : "text-muted"} ${className}`}
      >
        <Icon name="compass" />
      </button>
    </>
  );
}
