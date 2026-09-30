"use client";

import { useEffect, useRef } from "react";
import TurtleShell from "./TurtleShell";
import WuDiCoin, { type Emperor } from "./WuDiCoin";
import { playClink, playLanding, playToss, preloadCoinSounds } from "@/lib/coinSound";

export type CoinFace = 2 | 3; // 3 = 字（阳），2 = 背（阴）

/** 铜钱平放在布上的俯视倾角 */
const TILT = 52;
/** 落点（占卦布宽高的比例）：上一枚、下两枚，与实物摆放相似 */
const SLOTS: [number, number][] = [
  [0.22, 0.36],
  [0.14, 0.72],
  [0.4, 0.7],
];

/**
 * 龟甲摇卦：tossKey 变化时，三枚五帝钱收入龟甲 → 龟甲摇动 → 倾出铜钱翻转落布 → 回弹静止，
 * 结束后回调 onLanded。使用 Web Animations API，落点与翻转圈数随机。
 */
export default function CoinTray({
  coins,
  tossKey,
  emperors,
  fast = false,
  onLanded,
}: {
  coins: CoinFace[] | null;
  tossKey: number;
  emperors: Emperor[];
  fast?: boolean;
  onLanded: () => void;
}) {
  const tray = useRef<HTMLDivElement>(null);
  const shell = useRef<HTMLDivElement>(null);
  const movers = useRef<(HTMLDivElement | null)[]>([]);
  const flippers = useRef<(HTMLDivElement | null)[]>([]);
  const shadows = useRef<(HTMLDivElement | null)[]>([]);
  // 每枚铜钱当前落点（像素）与翻转角度，下次从这里收回
  const rest = useRef<{ x: number; y: number; rx: number; rz: number }[] | null>(null);
  const landed = useRef(onLanded);
  // 预载真实铜钱录音
  useEffect(() => preloadCoinSounds(), []);
  useEffect(() => {
    landed.current = onLanded;
  }, [onLanded]);

  /** 某落点的像素坐标（铜钱中心） */
  const slotPx = (i: number, jitter = 0) => {
    const W = tray.current?.clientWidth ?? 360;
    const H = tray.current?.clientHeight ?? 240;
    const j = () => (Math.random() * 2 - 1) * jitter;
    return { x: SLOTS[i][0] * W + j(), y: SLOTS[i][1] * H + j() };
  };

  useEffect(() => {
    if (!tossKey || !coins) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dur = reduce ? 1 : fast ? 900 : 1700;
    const W = tray.current?.clientWidth ?? 360;
    const H = tray.current?.clientHeight ?? 240;
    // 龟甲口（铜钱倾出处）：俯视龟甲的左端（头部）
    const mouth = { x: W * 0.58, y: H * 0.52 };
    const from = rest.current ?? [0, 1, 2].map((i) => ({ ...slotPx(i), rx: 0, rz: 0 }));
    const anims: Animation[] = [];

    // 龟甲：摇动（0.16–0.55）→ 抬起倾倒（0.55–0.7）→ 放回
    if (shell.current && !reduce) {
      const shake: Keyframe[] = [{ transform: "none", offset: 0 }, { transform: "none", offset: 0.16 }];
      for (let k = 0; k < 8; k++) {
        const s = k % 2 ? 1 : -1;
        shake.push({ transform: `translate(${s * 5}px, ${-3 - (k % 3) * 2}px) rotate(${s * 7}deg)`, offset: 0.16 + (k + 1) * 0.045 });
      }
      // 俯视：拿起（放大）并向左倾，倒出铜钱
      shake.push(
        { transform: "translate(-8px, -6px) rotate(-10deg) scale(1.1)", offset: 0.66 },
        { transform: "translate(-6px, -4px) rotate(-8deg) scale(1.08)", offset: 0.74 },
        { transform: "none", offset: 0.9 },
        { transform: "none", offset: 1 },
      );
      anims.push(shell.current.animate(shake, { duration: dur, easing: "ease-in-out" }));
    }

    const next = coins.map((face, i) => {
      const mover = movers.current[i];
      const flipper = flippers.current[i];
      const shadow = shadows.current[i];
      const p0 = from[i];
      const p1 = { ...slotPx(i, 8), rx: 0, rz: 0 };
      const turns = 2 + i + Math.floor(Math.random() * 2);
      // 字面朝上 → 整圈；背面朝上 → 多翻半圈
      const base = Math.ceil(p0.rx / 360) * 360;
      p1.rx = base + turns * 360 + (face === 3 ? 0 : 180);
      p1.rz = Math.round((Math.random() - 0.5) * 60);
      if (!mover || !flipper || !shadow) return p1;

      const lag = reduce ? 0 : i * 0.03;
      const out = 0.58 + lag; // 倾出时刻
      const land = 0.84 + lag; // 落布时刻
      const mid = { x: (mouth.x + p1.x) / 2, y: Math.min(mouth.y, p1.y) - H * 0.28 };
      const at = (x: number, y: number, s = 1) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${s})`;
      const opts: KeyframeAnimationOptions = { duration: dur, fill: "forwards" };

      anims.push(
        mover.animate(
          [
            { transform: at(p0.x, p0.y), opacity: 1, offset: 0, easing: "ease-in" },
            // 收入龟甲
            { transform: at(mouth.x, mouth.y, 0.6), opacity: 0, offset: 0.14 },
            { transform: at(mouth.x, mouth.y, 0.6), opacity: 0, offset: out },
            // 倾出、抛落
            { transform: at(mouth.x - 10, mouth.y - 6, 0.8), opacity: 1, offset: out + 0.03, easing: "cubic-bezier(.2,.7,.4,1)" },
            { transform: at(mid.x, mid.y, 1.05), opacity: 1, offset: (out + land) / 2 + 0.01, easing: "cubic-bezier(.6,0,.9,.5)" },
            { transform: at(p1.x, p1.y), opacity: 1, offset: land, easing: "ease-out" },
            { transform: at(p1.x, p1.y - 10), opacity: 1, offset: Math.min(0.95, land + 0.06), easing: "ease-in" },
            { transform: at(p1.x, p1.y), opacity: 1, offset: 1 },
          ],
          opts,
        ),
        flipper.animate(
          [
            { transform: `rotateX(${p0.rx}deg) rotateZ(${p0.rz}deg)`, offset: 0 },
            { transform: `rotateX(${p0.rx}deg) rotateZ(${p0.rz}deg)`, offset: out },
            { transform: `rotateX(${p1.rx}deg) rotateZ(${p1.rz}deg)`, offset: land },
            { transform: `rotateX(${p1.rx}deg) rotateZ(${p1.rz}deg)`, offset: 1 },
          ],
          opts,
        ),
        shadow.animate(
          [
            { transform: at(p0.x, p0.y + 6), opacity: 0.5, offset: 0 },
            { transform: at(mouth.x, mouth.y + 6, 0.6), opacity: 0, offset: 0.14 },
            { transform: at(mouth.x, mouth.y + 6, 0.6), opacity: 0, offset: out },
            { transform: at(mid.x, (mouth.y + p1.y) / 2 + 6, 0.5), opacity: 0.18, offset: (out + land) / 2 + 0.01 },
            { transform: at(p1.x, p1.y + 6), opacity: 0.5, offset: land },
            { transform: at(p1.x, p1.y + 6, 0.85), opacity: 0.4, offset: Math.min(0.95, land + 0.06) },
            { transform: at(p1.x, p1.y + 6), opacity: 0.5, offset: 1 },
          ],
          opts,
        ),
      );

      if (!reduce) playLanding((dur / 1000) * land, [1, 1.06, 0.95][i]);
      return p1;
    });
    rest.current = next;

    // 龟甲摇动声与动画同步
    if (!reduce) playToss((dur / 1000) * 0.18);
    else coins.forEach((_, i) => playClink(i * 0.06, 0.7, [1, 1.06, 0.95][i]));

    let cancelled = false;
    Promise.all(anims.map((a) => a.finished))
      .then(() => !cancelled && landed.current())
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // 仅在新一次抛掷时触发
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tossKey]);

  // 初始摆放：未摇卦时三枚铜钱静置在布上
  useEffect(() => {
    if (rest.current) return;
    [0, 1, 2].forEach((i) => {
      const { x, y } = slotPx(i);
      const t = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      const m = movers.current[i];
      const s = shadows.current[i];
      if (m) m.style.transform = t;
      if (s) s.style.transform = `translate(${x}px, ${y + 6}px) translate(-50%, -50%)`;
    });
  }, []);

  return (
    <div
      ref={tray}
      className="relative mx-auto h-60 w-full max-w-md overflow-hidden rounded-[1.6rem] sm:h-72"
      style={{
        // 深色绒布
        background: "radial-gradient(ellipse at 42% 32%, #3d4352 0%, #2a2e39 50%, #181b22 100%)",
        boxShadow: "inset 0 8px 24px rgba(0,0,0,.45), inset 0 -10px 30px rgba(0,0,0,.35), 0 6px 18px rgba(0,0,0,.18)",
      }}
      aria-live="polite"
    >
      {/* 绒布纹理 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />

      {/* 龟甲（俯视） */}
      <div className="absolute right-[4%] top-1/2 w-[42%] -translate-y-1/2">
        <div ref={shell} className="origin-center" style={{ filter: "drop-shadow(0 12px 10px rgba(0,0,0,.55))" }}>
          <TurtleShell className="h-auto w-full" />
        </div>
      </div>

      {[0, 1, 2].map((i) => (
        <div key={i}>
          {/* 影子 */}
          <div
            ref={(el) => {
              shadows.current[i] = el;
            }}
            className="absolute left-0 top-0 h-5 w-16 rounded-[50%] bg-black/70 blur-[5px] sm:w-20"
            style={{ opacity: 0.5 }}
          />
          {/* 位移 */}
          <div
            ref={(el) => {
              movers.current[i] = el;
            }}
            className="absolute left-0 top-0 h-[4.5rem] w-[4.5rem] sm:h-[5.4rem] sm:w-[5.4rem]"
            style={{ perspective: 520 }}
          >
            {/* 平放倾角 */}
            <div className="h-full w-full" style={{ transform: `rotateX(${TILT}deg)`, transformStyle: "preserve-3d" }}>
              {/* 翻转（两面） */}
              <div
                ref={(el) => {
                  flippers.current[i] = el;
                }}
                className="relative h-full w-full"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden" }}>
                  <WuDiCoin emperor={emperors[i]} side="front" className="h-full w-full" />
                </div>
                <div className="absolute inset-0" style={{ backfaceVisibility: "hidden", transform: "rotateX(180deg)" }}>
                  <WuDiCoin emperor={emperors[i]} side="back" className="h-full w-full" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
