"use client";

import { useSyncExternalStore } from "react";

export type Script = "cn" | "tw";

export const SCRIPT_KEY = "xuanji.script.v1";
const listeners = new Set<() => void>();

function read(): Script {
  try {
    return localStorage.getItem(SCRIPT_KEY) === "tw" ? "tw" : "cn";
  } catch {
    return "cn";
  }
}

export function setScript(s: Script) {
  const prev = read();
  try {
    localStorage.setItem(SCRIPT_KEY, s);
  } catch {
    // 忽略
  }
  // 页面文字已被改写为繁体，切回简体需重新载入以恢复原文
  if (prev === "tw" && s === "cn") {
    window.location.reload();
    return;
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** 当前字体：简体 cn / 繁体 tw（服务端渲染时为 cn） */
export function useScript(): Script {
  return useSyncExternalStore(subscribe, read, () => "cn");
}
