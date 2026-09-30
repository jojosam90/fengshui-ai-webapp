"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * 时钟订阅：每 30 秒检查一次，页面重新可见（切回标签页、手机解锁）时立即检查。
 * 配合 useSyncExternalStore 使用——只有快照值变化（如跨过午夜）才会触发重新渲染。
 */
export function subscribeClock(cb: () => void) {
  const id = window.setInterval(cb, 30_000);
  const onVisible = () => {
    if (document.visibilityState === "visible") cb();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", cb);
  return () => {
    window.clearInterval(id);
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", cb);
  };
}

const todayKey = () => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

/**
 * 客户端本地日期，跨过午夜自动更新；服务端渲染时为 null（避免时区造成水合不一致）。
 * 所有依赖今天的内容（运势、黄历、飞星、流月等）都由此驱动，因此每天自动刷新。
 */
export function useToday(): Date | null {
  const key = useSyncExternalStore(subscribeClock, todayKey, () => null);
  return useMemo(() => {
    if (!key) return null;
    const [y, m, d] = key.split("-").map(Number);
    return new Date(y, m - 1, d);
  }, [key]);
}

const ZHI = "子丑寅卯辰巳午未申酉戌亥";
/** 23:00–00:59 为子时，其后每两小时一个时辰 */
export const zhiOfHour = (h: number) => ZHI[Math.floor(((h + 1) % 24) / 2)];

/** 当前时辰地支，随时钟自动更新；服务端渲染时为 null */
export function useCurrentZhi(): string | null {
  return useSyncExternalStore(subscribeClock, () => zhiOfHour(new Date().getHours()), () => null);
}
