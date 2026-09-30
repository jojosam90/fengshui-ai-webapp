"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import FloatingCompass, { type Point } from "./FloatingCompass";
import Icon from "./Icon";
import ProfileSwitcher from "./ProfileSwitcher";
import ScriptToggle from "./ScriptToggle";
import TabBar from "./TabBar";
import { computeBazi } from "@/lib/bazi";
import { logout } from "@/lib/logout";
import { NAV_GROUPS, isActive } from "@/lib/nav";
import { useProfile } from "@/lib/profile";

const NavContext = createContext<{ open: () => void; openCompass: () => void; compassOpen: boolean }>({
  open: () => {},
  openCompass: () => {},
  compassOpen: false,
});
/** open：手机端打开导航抽屉；openCompass：打开可拖动的罗盘浮窗 */
export const useNav = () => useContext(NavContext);

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex-1 space-y-2 overflow-y-auto px-3 pb-2 [@media(min-height:880px)]:space-y-3 [@media(min-height:960px)]:space-y-4">
      {NAV_GROUPS.map((g, gi) => (
        <div key={gi}>
          {g.title && <p className="mb-0.5 px-3 text-xs font-semibold tracking-widest text-muted [@media(min-height:880px)]:mb-1">{g.title}</p>}
          <ul className="space-y-0.5">
            {g.items.map((it) => {
              const active = isActive(pathname, it.href);
              return (
                <li key={it.href}>
                  <Link
                    href={it.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-1 text-xs transition [@media(min-height:850px)]:py-1.5 [@media(min-height:960px)]:py-2 ${
                      active ? "bg-cinnabar-soft font-semibold text-cinnabar" : "text-ink/80 hover:bg-card-2"
                    }`}
                  >
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg font-serif text-sm font-bold ${
                        active ? "seal" : "bg-card-2 text-muted"
                      }`}
                    >
                      {it.glyph}
                    </span>
                    {it.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function ProfileCard({ onNavigate, user }: { onNavigate?: () => void; user: string | null }) {
  const [profile] = useProfile();
  const bazi = useMemo(() => (profile ? computeBazi(profile) : null), [profile]);
  return (
    <div className="space-y-2 border-t border-line p-2.5">
      <ProfileSwitcher size="sm" />
      {bazi && (
        <Link href="/bazi" onClick={onNavigate} className="block rounded-xl border border-line bg-card px-3 py-2 hover:bg-card-2 [@media(max-height:820px)]:hidden">
          <p className="text-xs text-muted">{profile?.name ?? "我"}的命盘</p>
          <p className="font-serif text-base font-bold tracking-wider">
            {bazi.pillars.map((p) => p.gan + p.zhi).join(" ")}
          </p>
          <p className="text-xs text-muted">
            日主{bazi.dayMaster}{bazi.dayMasterWx} · {bazi.shengXiaoWx} · 喜{bazi.favorable.join("")}
          </p>
        </Link>
      )}
      <button
        onClick={() => void logout()}
        className="seal flex w-full items-center justify-center gap-2 rounded-xl py-1.5 text-sm font-semibold transition hover:opacity-90"
      >
        <Icon name="logout" className="h-4 w-4" /> 退出登录
      </button>
      <div className="flex items-center justify-between gap-2">
        <Link href="/profile" onClick={onNavigate} className="flex min-w-0 items-center gap-2">
          <span className="seal flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-serif">
            {profile?.name?.[0] ?? "缘"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{profile?.name ?? "缘主"}</span>
            <span className="block truncate text-xs text-muted">{user ? `已登录 · ${user}` : (profile?.place ?? "我的档案")}</span>
          </span>
        </Link>
        <ScriptToggle />
      </div>
    </div>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 px-5 py-3">
      {/* eslint-disable-next-line @next/next/no-img-element -- 静态 SVG 标志 */}
      <img src="/icon.svg" alt="" className="h-9 w-9 shrink-0 rounded-xl shadow-sm" />
      <span>
        <span className="block font-serif text-lg font-bold leading-tight">玄机</span>
        <span className="block text-xs tracking-[0.2em] text-muted">AI 风水命理</span>
      </span>
    </Link>
  );
}

export default function AppShell({ children, user }: { children: React.ReactNode; user: string | null }) {
  const [drawer, setDrawer] = useState(false);
  const [compassOpen, setCompassOpen] = useState(false);
  const [compassPos, setCompassPos] = useState<Point | null>(null);
  const pathname = usePathname();
  const ctx = useMemo(
    () => ({
      open: () => setDrawer(true),
      openCompass: () => {
        // 首次打开：桌面放在右上，手机居中偏上；之后沿用上次拖动的位置
        setCompassPos(
          (p) =>
            p ??
            (window.innerWidth >= 1024
              ? { x: window.innerWidth - 480 - 32, y: 96 }
              : { x: Math.max(8, (window.innerWidth - Math.min(480, window.innerWidth - 16)) / 2), y: 72 }),
        );
        setCompassOpen(true);
      },
      compassOpen,
    }),
    [compassOpen],
  );

  // 抽屉打开时锁定背景滚动
  useEffect(() => {
    document.body.style.overflow = drawer ? "hidden" : "";
  }, [drawer]);

  const isChat = pathname.startsWith("/master");

  // 登录页全屏显示，不带侧边栏与底部导航
  if (pathname === "/login") return <>{children}</>;

  return (
    <NavContext.Provider value={ctx}>
      {/* 桌面侧边栏 */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-card lg:flex">
        <Brand />
        <NavList />
        <ProfileCard user={user} />
      </aside>

      {/* 手机抽屉 */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button className="absolute inset-0 bg-ink/40" aria-label="关闭菜单" onClick={() => setDrawer(false)} />
          <aside className="fade-up relative flex h-full w-72 max-w-[85%] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between pr-3">
              <Brand />
              <button onClick={() => setDrawer(false)} className="rounded-full p-2 text-muted hover:bg-card-2" aria-label="关闭菜单">
                <Icon name="close" className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setDrawer(false)} />
            <ProfileCard user={user} onNavigate={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <main
          className={`mx-auto w-full px-4 pt-2 md:px-6 lg:px-8 lg:pt-6 ${
            isChat ? "max-w-3xl pb-28 lg:pb-6" : "max-w-7xl pb-28 lg:pb-12"
          }`}
        >
          {children}
        </main>
      </div>

      <div className="lg:hidden">
        <TabBar />
      </div>

      {compassOpen && compassPos && (
        <FloatingCompass pos={compassPos} onMove={setCompassPos} onClose={() => setCompassOpen(false)} />
      )}
    </NavContext.Provider>
  );
}
