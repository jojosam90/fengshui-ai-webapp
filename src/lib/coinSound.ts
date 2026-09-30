"use client";

import { useSyncExternalStore } from "react";

/**
 * 铜钱音效：优先播放真实录音（public/sounds，CC0 公有领域，来自 BigSoundBank），
 * 录音未载入时退回 Web Audio 实时合成。
 * - shake：铜钱在杯中摇动的「哗啦」声
 * - drop：单枚铜钱落地、弹跳至静止（三段不同录音，三枚钱各用一段）
 */

const KEY = "xuanji.coinSound.v1";
const listeners = new Set<() => void>();
let ctx: AudioContext | null = null;

function readEnabled() {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setCoinSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // 忽略
  }
  listeners.forEach((l) => l());
}

export function useCoinSound(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readEnabled,
    () => true,
  );
}

/** 在用户点击时调用，确保浏览器允许播放声音 */
export function unlockAudio() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

// ---------------- 真实录音 ----------------

const SHAKE_URL = "/sounds/coin-shake.wav";
const DROP_URLS = ["/sounds/coin-drop-1.wav", "/sounds/coin-drop-2.wav", "/sounds/coin-drop-3.wav"];
let shakeBuf: AudioBuffer | null = null;
let dropBufs: AudioBuffer[] = [];
let loading: Promise<void> | null = null;

/** 预载录音（页面打开时调用；AudioContext 可先以暂停状态建立） */
export function preloadCoinSounds() {
  if (typeof window === "undefined" || loading) return;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    ctx = new Ctor();
  }
  const c = ctx;
  const load = (url: string) =>
    fetch(url)
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(url))))
      .then((b) => c.decodeAudioData(b));
  loading = Promise.all([load(SHAKE_URL), ...DROP_URLS.map(load)])
    .then(([shake, ...drops]) => {
      shakeBuf = shake;
      dropBufs = drops;
    })
    .catch(() => {
      // 载入失败：保持合成音效
    });
}

function playBuffer(c: AudioContext, buf: AudioBuffer, t: number, gain: number, rate: number) {
  const src = c.createBufferSource();
  src.buffer = buf;
  src.playbackRate.value = rate;
  const g = c.createGain();
  g.gain.value = gain;
  src.connect(g).connect(c.destination);
  src.start(t);
}

let dropTurn = 0;

// ---------------- 合成（后备） ----------------

/** 高 Q 共振峰输出很小，需放大到可听音量（经离线渲染校准） */
const RING_GAIN = 620;

/** 共享的白噪声（激励源），避免每次重新生成 */
let noise: AudioBuffer | null = null;
function noiseBuf(c: AudioContext) {
  if (!noise || noise.sampleRate !== c.sampleRate) {
    noise = c.createBuffer(1, Math.ceil(c.sampleRate * 0.5), c.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return noise;
}

/**
 * 铜钱「模态」撞击：一小段噪声激励多个高 Q 带通共振峰（黄铜的非谐波泛音），
 * 听起来是「叮」一声真实的金属敲击，而不是电子音。
 */
function strike(c: AudioContext, t: number, gain: number, pitch: number, out: AudioNode, ring = 1) {
  const src = c.createBufferSource();
  src.buffer = noiseBuf(c);
  const env = c.createGain();
  env.gain.setValueAtTime(gain, t);
  env.gain.exponentialRampToValueAtTime(0.0001, t + 0.006); // 短促的激励
  // 激励先过低通：像软一点的撞击，减少刺耳的「咔」
  const soft = c.createBiquadFilter();
  soft.type = "lowpass";
  soft.frequency.value = 3200;
  src.connect(soft).connect(env);
  // 清代铜钱（小而厚的黄铜片）的主要共振：[频率 Hz, 余音秒数, 相对音量]
  // 偏低、偏暖的音色（去掉 6kHz 以上刺耳的高频泛音）
  const modes: [number, number, number][] = [
    [1480, 0.2, 1],
    [2610, 0.13, 0.5],
    [3900, 0.08, 0.2],
  ];
  for (const [f0, decay, amp] of modes) {
    const f = Math.min(f0 * pitch * (0.985 + Math.random() * 0.03), c.sampleRate / 2.2);
    const bp = c.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = f;
    // 共振衰减时间 τ ≈ Q / (π·f)，由目标余音反推 Q
    bp.Q.value = Math.max(5, decay * ring * Math.PI * f);
    const g = c.createGain();
    g.gain.value = amp * RING_GAIN;
    env.connect(bp).connect(g).connect(out);
  }
  src.start(t, Math.random() * 0.4);
  src.stop(t + 0.02);
}

/** 落在木制卦盘上的闷声「咚」 */
function thud(c: AudioContext, t: number, gain: number, out: AudioNode) {
  const src = c.createBufferSource();
  src.buffer = noiseBuf(c);
  const lp = c.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 420;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  src.connect(lp).connect(g).connect(out);
  src.start(t, Math.random() * 0.4);
  src.stop(t + 0.07);
}

function master(c: AudioContext, vol: number) {
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -18;
  comp.ratio.value = 4;
  // 整体再削一点高频，让声音更柔和
  const warm = c.createBiquadFilter();
  warm.type = "lowpass";
  warm.frequency.value = 4500;
  warm.Q.value = 0.5;
  const g = c.createGain();
  g.gain.value = vol;
  comp.connect(warm).connect(g).connect(c.destination);
  return comp;
}

/** 摇卦：三枚铜钱在手中互相碰撞的「沙沙叮叮」声 */
export function playToss(delaySec = 0) {
  if (!readEnabled()) return;
  const c = unlockAudio();
  if (!c) return;
  const t0 = c.currentTime + delaySec;
  if (shakeBuf) {
    playBuffer(c, shakeBuf, t0, 0.9, 0.95 + Math.random() * 0.1);
    return;
  }
  const out = master(c, 0.2);
  const n = 7 + Math.floor(Math.random() * 3);
  for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.045 + Math.random() * 0.025;
    strike(c, t, 0.25 + Math.random() * 0.2, 0.95 + Math.random() * 0.15, out, 0.35); // 互碰：短促、较闷
  }
}

/**
 * 铜钱落盘：先一声「叮」+ 木盘闷响，再像硬币在桌上打转停下那样，
 * 间隔越来越短、越来越轻的「嗒嗒嗒…」直到静止。
 */
export function playLanding(delaySec = 0, pitch = 1) {
  if (!readEnabled()) return;
  const c = unlockAudio();
  if (!c) return;
  let t = c.currentTime + delaySec;
  if (dropBufs.length) {
    // 三枚钱轮流用不同录音，并按 pitch 微调音高，避免听起来重复
    playBuffer(c, dropBufs[dropTurn++ % dropBufs.length], t, 0.9, pitch);
    return;
  }
  const out = master(c, 0.55);
  strike(c, t, 1, pitch, out, 1);
  thud(c, t, 0.9, out);
  // 回弹一次
  t += 0.11 + Math.random() * 0.03;
  strike(c, t, 0.5, pitch, out, 0.9);
  thud(c, t, 0.35, out);
  // 打转收尾：间隔与音量逐渐衰减
  let gap = 0.075;
  let amp = 0.2;
  while (gap > 0.014 && amp > 0.03) {
    t += gap;
    strike(c, t, amp, pitch * 0.97, out, 0.4);
    gap *= 0.8;
    amp *= 0.84;
  }
}

/** 兼容旧调用：单次轻「叮」 */
export function playClink(delaySec = 0, strength = 1, pitch = 1) {
  if (!readEnabled()) return;
  const c = unlockAudio();
  if (!c) return;
  if (dropBufs.length) {
    playBuffer(c, dropBufs[dropTurn++ % dropBufs.length], c.currentTime + delaySec, 0.7 * strength, pitch);
    return;
  }
  strike(c, c.currentTime + delaySec, strength, pitch, master(c, 0.5), 1);
}
