"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { BirthInfo } from "./bazi";
import { DEFAULT_PROFILES } from "./defaultProfile";

/**
 * 多档案：内置档案 + 当前选中的档案。
 * - 当前档案 id 存在 ACTIVE_KEY；
 * - 每个档案的修改分别存在 overrideKey(id)（缘主沿用旧键名，保留之前的修改）。
 * 全站通过 useProfile() 读取当前档案，切换后所有页面自动重新计算。
 */
const ACTIVE_KEY = "xuanji.activeProfile.v1";
const overrideKey = (id: string) => (id === "p1" ? "xuanji.profile.v2" : `xuanji.profile.v2.${id}`);
const listeners = new Set<() => void>();
const OLD_DEFAULT_NAMES = new Set(["缘主", "缘主 2"]);

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function activeId(): string {
  const id = get(ACTIVE_KEY);
  return DEFAULT_PROFILES.some((p) => p.id === id) ? id! : DEFAULT_PROFILES[0].id;
}

/** 快照：当前 id + 各档案的修改（字符串，便于 useSyncExternalStore 比较） */
function snapshot(): string {
  return JSON.stringify([activeId(), DEFAULT_PROFILES.map((p) => get(overrideKey(p.id)))]);
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => (e.key === ACTIVE_KEY || e.key?.startsWith("xuanji.profile.v2")) && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

const notify = () => listeners.forEach((l) => l());

/** 保存当前档案的修改；传 null 恢复为内置资料 */
export function saveProfile(p: BirthInfo | null) {
  try {
    const key = overrideKey(activeId());
    if (p) localStorage.setItem(key, JSON.stringify(p));
    else localStorage.removeItem(key);
  } catch {
    // 隐私模式等情况下无法持久化，忽略
  }
  notify();
}

/** 切换当前档案 */
export function setActiveProfile(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // 忽略
  }
  notify();
}

export interface ProfileListItem {
  id: string;
  profile: BirthInfo;
  active: boolean;
  edited: boolean;
}

function parse(snap: string): { active: string; list: ProfileListItem[] } {
  const [active, overrides] = JSON.parse(snap) as [string, (string | null)[]];
  const list = DEFAULT_PROFILES.map((d, i) => {
    let profile = d.profile;
    const raw = overrides[i];
    if (raw) {
      try {
        const saved = JSON.parse(raw) as BirthInfo;
        // 旧版默认名称（缘主 / 缘主 2）视为未改名，使用当前内置名称
        const name = saved.name && !OLD_DEFAULT_NAMES.has(saved.name) ? saved.name : d.profile.name;
        profile = { ...saved, name };
      } catch {
        // 损坏的数据忽略，使用内置资料
      }
    }
    return { id: d.id, profile, active: d.id === active, edited: !!raw };
  });
  return { active, list };
}

function useSnapshot(): string | undefined {
  return useSyncExternalStore(subscribe, snapshot, () => undefined);
}

/**
 * 返回 [profile, ready, isDefault]。ready 为 false 时处于服务端渲染/水合阶段；
 * isDefault 表示当前档案未被修改（使用内置资料）。
 */
export function useProfile(): [BirthInfo | null, boolean, boolean] {
  const snap = useSnapshot();
  return useMemo(() => {
    if (snap === undefined) return [null, false, false];
    const cur = parse(snap).list.find((p) => p.active)!;
    return [cur.profile, true, !cur.edited];
  }, [snap]);
}

/** 所有档案列表（用于切换器） */
export function useProfileList(): ProfileListItem[] {
  const snap = useSnapshot();
  return useMemo(() => (snap === undefined ? [] : parse(snap).list), [snap]);
}
