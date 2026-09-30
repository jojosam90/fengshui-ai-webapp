"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "./Icon";

const TABS = [
  { href: "/", label: "首页", icon: "home" },
  { href: "/bazi", label: "八字", icon: "bazi" },
  { href: "/master", label: "大师", icon: "master", accent: true },
  { href: "/almanac", label: "黄历", icon: "calendar" },
  { href: "/profile", label: "我的", icon: "user" },
];

export default function TabBar() {
  const pathname = usePathname();
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/95 backdrop-blur">
      <ul className="mx-auto flex max-w-lg items-end justify-around px-2 pt-1.5">
        {TABS.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <li key={t.href} className="flex-1">
              <Link
                href={t.href}
                className={`flex flex-col items-center gap-0.5 py-1 text-xs ${active ? "text-cinnabar" : "text-muted"}`}
                aria-current={active ? "page" : undefined}
              >
                {t.accent ? (
                  <span className="seal -mt-5 flex h-12 w-12 items-center justify-center rounded-full shadow-lg ring-4 ring-paper">
                    <Icon name={t.icon} className="h-6 w-6" />
                  </span>
                ) : (
                  <Icon name={t.icon} className="h-6 w-6" />
                )}
                <span className={active ? "font-semibold" : ""}>{t.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
