export type WuXing = "木" | "火" | "土" | "金" | "水";

export const WUXING_ORDER: WuXing[] = ["木", "火", "土", "金", "水"];

export const GAN_WX: Record<string, WuXing> = {
  甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土",
  己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
};

export const ZHI_WX: Record<string, WuXing> = {
  子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火",
  午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水",
};

export const ZHI_ANIMAL: Record<string, string> = {
  子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇",
  午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪",
};

/** X 生 SHENG[X] */
export const SHENG: Record<WuXing, WuXing> = { 木: "火", 火: "土", 土: "金", 金: "水", 水: "木" };
/** X 克 KE[X] */
export const KE: Record<WuXing, WuXing> = { 木: "土", 土: "水", 水: "火", 火: "金", 金: "木" };

export const generatorOf = (wx: WuXing) => WUXING_ORDER.find((w) => SHENG[w] === wx)!;
export const controllerOf = (wx: WuXing) => WUXING_ORDER.find((w) => KE[w] === wx)!;

export const WX_LUCKY_COLORS: Record<WuXing, string[]> = {
  木: ["绿色", "青色"],
  火: ["红色", "紫色"],
  土: ["黄色", "咖啡色"],
  金: ["白色", "金色"],
  水: ["黑色", "蓝色"],
};

/** 河图数 */
export const WX_NUMBERS: Record<WuXing, number[]> = {
  水: [1, 6], 火: [2, 7], 木: [3, 8], 金: [4, 9], 土: [5, 0],
};

export const WX_DIRECTION: Record<WuXing, string> = {
  木: "东方", 火: "南方", 土: "中央", 金: "西方", 水: "北方",
};

export const WX_TRAITS: Record<WuXing, string> = {
  木: "仁厚正直，富有生长力与进取心",
  火: "热情开朗，行动力强，重礼节",
  土: "稳重诚信，包容踏实，重承诺",
  金: "果断刚毅，重义气，有原则",
  水: "聪慧灵活，善于变通，思维敏捷",
};

/** Tailwind-friendly CSS variable names per element (see globals.css). */
export const WX_CLASS: Record<WuXing, string> = {
  木: "wx-wood", 火: "wx-fire", 土: "wx-earth", 金: "wx-metal", 水: "wx-water",
};

// ---------- 地支关系 ----------

const pairKey = (a: string, b: string) => [a, b].sort().join("");

const LIU_HE = new Set(["子丑", "寅亥", "卯戌", "辰酉", "巳申", "午未"].map((p) => pairKey(p[0], p[1])));
const LIU_CHONG = new Set(["子午", "丑未", "寅申", "卯酉", "辰戌", "巳亥"].map((p) => pairKey(p[0], p[1])));
const LIU_HAI = new Set(["子未", "丑午", "寅巳", "卯辰", "申亥", "酉戌"].map((p) => pairKey(p[0], p[1])));
const XING = new Set(["子卯", "寅巳", "巳申", "寅申", "丑戌", "戌未", "丑未"].map((p) => pairKey(p[0], p[1])));
const SELF_XING = new Set(["辰", "午", "酉", "亥"]);
const SAN_HE = ["申子辰", "亥卯未", "寅午戌", "巳酉丑"];

export type ZhiRelation = "六合" | "三合" | "六冲" | "相害" | "相刑" | "自刑" | "比和" | "无";

export function zhiRelation(a: string, b: string): ZhiRelation {
  const k = pairKey(a, b);
  if (LIU_HE.has(k)) return "六合";
  if (a !== b && SAN_HE.some((g) => g.includes(a) && g.includes(b))) return "三合";
  if (LIU_CHONG.has(k)) return "六冲";
  if (LIU_HAI.has(k)) return "相害";
  if (XING.has(k)) return "相刑";
  if (a === b) return SELF_XING.has(a) ? "自刑" : "比和";
  return "无";
}
