"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNav } from "./AppShell";
import CompassButton from "./CompassButton";
import Icon from "./Icon";
import ModuleIntro from "./ModuleIntro";
import type { MODULE_INFO } from "@/lib/moduleInfo";

export default function PageHeader({
  title,
  subtitle,
  back = true,
  actions,
  actionsFirst = false,
  info,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  /** 桌面端标题右侧的操作区 */
  actions?: React.ReactNode;
  /** 操作区放在「打开罗盘」左侧 */
  actionsFirst?: boolean;
  /** 模块说明：标题旁显示 ⓘ，点击展开 */
  info?: keyof typeof MODULE_INFO;
}) {
  const router = useRouter();
  const { open } = useNav();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 -mx-4 mb-3 flex items-center gap-2 bg-paper/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:static lg:mx-0 lg:mb-5 lg:bg-transparent lg:px-0 lg:py-0 lg:backdrop-blur-none">
        {back && (
          <button
            onClick={() => (history.length > 1 ? router.back() : router.push("/"))}
            className="-ml-2 rounded-full p-1.5 text-muted hover:bg-card-2 lg:hidden"
            aria-label="返回"
          >
            <Icon name="back" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h1 className="truncate font-serif text-xl font-bold leading-tight lg:text-3xl">{title}</h1>
            {info && (
              <button
                onClick={() => setShowInfo((v) => !v)}
                aria-expanded={showInfo}
                aria-controls={`intro-${info}`}
                aria-label={showInfo ? "收起说明" : "这是什么？查看说明"}
                title="这是什么？"
                className={`shrink-0 rounded-full p-1 transition ${showInfo ? "bg-gold text-white" : "text-gold hover:bg-gold-soft"}`}
              >
                <Icon name="info" className="h-5 w-5 lg:h-6 lg:w-6" />
              </button>
            )}
          </div>
          {subtitle && <p className="truncate text-xs text-muted lg:mt-1 lg:text-sm">{subtitle}</p>}
        </div>
        <div className={`flex shrink-0 items-center gap-2 ${actionsFirst ? "flex-row-reverse" : ""}`}>
          <CompassButton />
          {actions && <div className="hidden items-center gap-2 lg:flex">{actions}</div>}
        </div>
        <button onClick={open} className="-mr-1.5 rounded-full p-1.5 text-muted hover:bg-card-2 lg:hidden" aria-label="打开菜单">
          <Icon name="menu" />
        </button>
      </header>
      {info && showInfo && <ModuleIntro id={info} onClose={() => setShowInfo(false)} />}
    </>
  );
}
