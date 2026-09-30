import type { BaziResult } from "./bazi";
import type { LiuNian, LiuYue } from "./luck";
import { yearGanZhi } from "./luck";
import { WX_INDUSTRY } from "./talent";
import { GAN_WX, KE, ZHI_WX, WX_DIRECTION, WX_LUCKY_COLORS, type WuXing } from "./wuxing";

/** 五行墓库：财星所入之库即「财库」 */
const MU_KU: Record<WuXing, string> = { 木: "未", 火: "戌", 土: "辰", 金: "丑", 水: "辰" };
const CHONG: Record<string, string> = { 辰: "戌", 戌: "辰", 丑: "未", 未: "丑" };

export interface WealthAnalysis {
  favorable: { wx: WuXing; colors: string; direction: string }[];
  star: {
    wx: WuXing;
    /** 命局中出现的正/偏财位置 */
    spots: string[];
    percent: number;
    isFav: boolean;
    kind: "正财" | "偏财" | "正偏皆有" | "不现";
    verdict: string;
  };
  ku: {
    zhi: string;
    /** 命局中财库所在柱 */
    inChart: string[];
    /** 未来十二年内补库（逢库）与开库（冲库）之年 */
    fillYears: number[];
    openYears: number[];
    verdict: string;
  };
  goodYears: LiuNian[];
  goodMonths: LiuYue[];
  advice: string[];
}

const isWealth = (s: string) => s === "正财" || s === "偏财";

export function wealthAnalysis(r: BaziResult, years: LiuNian[], months: LiuYue[], thisYear: number): WealthAnalysis {
  const favorable = r.favorable.map((wx) => ({ wx, colors: WX_LUCKY_COLORS[wx].slice(0, 2).join("、"), direction: WX_DIRECTION[wx] }));

  // ---- 财星 ----
  const wx = KE[r.dayMasterWx];
  const spots: string[] = [];
  let zheng = 0;
  let pian = 0;
  for (const p of r.pillars) {
    const pos = p.label[0];
    if (p.label !== "日柱" && isWealth(p.shiShen)) {
      spots.push(`${pos}干${p.gan}（${p.shiShen}）`);
      if (p.shiShen === "正财") zheng++;
      else pian++;
    }
    p.hidden.forEach((h, i) => {
      if (!isWealth(h.shiShen)) return;
      if (i === 0) spots.push(`${pos}支${p.zhi}藏${h.gan}（${h.shiShen}）`);
      if (h.shiShen === "正财") zheng++;
      else pian++;
    });
  }
  const percent = r.percents[wx];
  const isFav = r.favorable.includes(wx);
  const kind = zheng && pian ? "正偏皆有" : zheng ? "正财" : pian ? "偏财" : "不现";
  const strong = percent >= 25;
  const weak = percent <= 10;
  const verdict =
    kind === "不现"
      ? "财星不现，靠专业"
      : isFav
        ? weak
          ? "偏弱，需主动开源"
          : "财星有力，敢出手"
        : r.strength === "身弱" && strong
          ? "财多身弱，量力行"
          : "非喜用，宜守成";

  // ---- 财库 ----
  const zhi = MU_KU[wx];
  const inChart = r.pillars.filter((p) => p.zhi === zhi).map((p) => p.label);
  const fillYears: number[] = [];
  const openYears: number[] = [];
  for (let y = thisYear; y < thisYear + 12; y++) {
    const z = yearGanZhi(y)[1];
    if (z === zhi) fillYears.push(y);
    if (z === CHONG[zhi]) openYears.push(y);
  }
  const kuVerdict = inChart.length
    ? `${inChart.map((l) => l[0]).join("")}柱带库，善积蓄`
    : "无库，先存后花";

  // ---- 旺财时机：财星透干、财坐地支，或喜用天干且评分较高 ----
  const pick = <T extends LiuNian | LiuYue>(list: T[]) =>
    list
      .filter(
        (x) =>
          isWealth(x.shiShen) ||
          (ZHI_WX[x.ganZhi[1]] === wx && x.score >= 60) ||
          (r.favorable.includes(GAN_WX[x.ganZhi[0]]) && x.score >= 75),
      )
      .sort((a, b) => b.score - a.score);
  const goodYears = pick(years).slice(0, 3);
  const goodMonths = pick(months).slice(0, 4);

  // ---- 建议 ----
  const advice: string[] = [];
  if (r.strength === "身强") advice.push("身强担财：可创业投资、争取提成");
  else if (r.strength === "身弱") advice.push("身弱借力：稳薪、合伙为主，先充电再投资");
  else advice.push("命局中和：正职为本、副业为辅");
  if (kind === "偏财" || kind === "正偏皆有") advice.push("偏财有缘：生意、销售、投资副业");
  else advice.push("正财为主：靠专业稳定累积，少投机");
  advice.push(`行业首选：${WX_INDUSTRY[r.favorable[0]].split("、").slice(0, 3).join("、")}`);

  return {
    favorable,
    star: { wx, spots, percent, isFav, kind, verdict },
    ku: { zhi, inChart, fillYears, openYears, verdict: kuVerdict },
    goodYears,
    goodMonths,
    advice,
  };
}

