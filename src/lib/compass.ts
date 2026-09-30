"use client";

import { useCallback, useEffect, useState } from "react";
import type { LuopanMarker } from "@/components/Luopan";
import { MOUNTAINS } from "./fengshui";

const DIR_DEG: Record<string, number> = { 北: 0, 东北: 45, 东: 90, 东南: 135, 南: 180, 西南: 225, 西: 270, 西北: 315 };
const dirDeg = (desc: string) => DIR_DEG[desc.replace("正", "")] ?? 0;

/** 角度所在的二十四山 */
export const mountainAt = (deg: number) => MOUNTAINS[Math.floor(((((deg - 337.5) % 360) + 360) % 360) / 15)];

/** 今日吉神方位标记（同方位时略微错开） */
export function godMarkers(xiShen: string, caiShen: string, fuShen: string): LuopanMarker[] {
  return [
    { deg: dirDeg(caiShen), label: `财神 ${caiShen}`, color: "var(--gold)" },
    { deg: dirDeg(xiShen) + (xiShen === caiShen ? 8 : 0), label: `喜神 ${xiShen}`, color: "var(--cinnabar)" },
    { deg: dirDeg(fuShen) + (fuShen === caiShen || fuShen === xiShen ? -8 : 0), label: `福神 ${fuShen}`, color: "var(--good)" },
  ];
}

type OrientationEventCtor = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<"granted" | "denied"> };

/** 设备朝向（度，0=北，顺时针）。需用户点击开启；桌面端无传感器时为 null */
export function useHeading() {
  const [heading, setHeading] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "on" | "denied" | "unsupported">("idle");

  useEffect(() => {
    if (state !== "on") return;
    const onAbs = (e: DeviceOrientationEvent) => {
      if (e.alpha != null) setHeading((360 - e.alpha) % 360);
    };
    const onRel = (e: DeviceOrientationEvent & { webkitCompassHeading?: number }) => {
      if (typeof e.webkitCompassHeading === "number") setHeading(e.webkitCompassHeading);
      else if (e.absolute && e.alpha != null) setHeading((360 - e.alpha) % 360);
    };
    window.addEventListener("deviceorientationabsolute", onAbs as EventListener);
    window.addEventListener("deviceorientation", onRel as EventListener);
    return () => {
      window.removeEventListener("deviceorientationabsolute", onAbs as EventListener);
      window.removeEventListener("deviceorientation", onRel as EventListener);
    };
  }, [state]);

  const enable = useCallback(async () => {
    if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
      setState("unsupported");
      return;
    }
    const Ctor = DeviceOrientationEvent as OrientationEventCtor;
    try {
      // iOS 13+ 需用户授权
      if (typeof Ctor.requestPermission === "function") {
        const res = await Ctor.requestPermission();
        if (res !== "granted") return setState("denied");
      }
      setState("on");
    } catch {
      setState("denied");
    }
  }, []);

  return { heading, state, enable };
}
