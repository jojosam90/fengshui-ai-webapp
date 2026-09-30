import type { BaziResult } from "./bazi";
import { GAN_WX, KE, SHENG, WUXING_ORDER, ZHI_WX, controllerOf, generatorOf, type WuXing } from "./wuxing";

/** 五行对应行业 */
export const WX_INDUSTRY: Record<WuXing, string> = {
  木: "教育出版、医药保健、园艺林业、服装家具",
  火: "能源电力、IT 电子、传媒广告、餐饮美业",
  土: "房地产、建筑工程、农业物流、保险中介",
  金: "金融银行、机械汽车、法律司法、珠宝精工",
  水: "贸易航运、旅游酒店、饮品水产、咨询自媒体",
};

type God = "比劫" | "印星" | "食伤" | "财星" | "官杀";

const GOD_ROLE: Record<God, string> = {
  比劫: "合伙创业、销售拓展、体育竞技",
  印星: "教育学术、研究咨询、行政文职",
  食伤: "创意设计、技术专长、演艺自媒体",
  财星: "经商贸易、投资理财、财务市场",
  官杀: "管理领导、公职体制、法律军警",
};

function godOf(dm: WuXing, wx: WuXing): God {
  if (wx === dm) return "比劫";
  if (wx === generatorOf(dm)) return "印星";
  if (wx === SHENG[dm]) return "食伤";
  if (wx === KE[dm]) return "财星";
  return "官杀";
}

export type Fit = "首选" | "次选" | "可选" | "慎选";

export interface IndustryRow {
  wx: WuXing;
  god: God;
  fit: Fit;
  industries: string;
}

/** 按喜用神排行业：喜用在前、忌神在后 */
export function industriesFor(r: BaziResult): { rows: IndustryRow[]; role: { god: God; wx: WuXing; text: string } } {
  const rank = (w: WuXing) => {
    const f = r.favorable.indexOf(w);
    if (f >= 0) return f;
    return r.unfavorable.includes(w) ? 10 : 5;
  };
  const rows = [...WUXING_ORDER]
    .sort((a, b) => rank(a) - rank(b))
    .map((wx): IndustryRow => {
      const f = r.favorable.indexOf(wx);
      const fit: Fit = f === 0 ? "首选" : f > 0 ? "次选" : r.unfavorable.includes(wx) ? "慎选" : "可选";
      return { wx, god: godOf(r.dayMasterWx, wx), fit, industries: WX_INDUSTRY[wx] };
    });
  const wx = r.favorable[0];
  const god = godOf(r.dayMasterWx, wx);
  return { rows, role: { god, wx, text: GOD_ROLE[god] } };
}

export interface Talent {
  key: string;
  label: string;
  score: number;
  level: "突出" | "良好" | "平稳" | "待加强";
  note: string;
}

const clamp = (n: number) => Math.round(Math.max(30, Math.min(95, n)));
const levelOf = (s: number): Talent["level"] => (s >= 80 ? "突出" : s >= 65 ? "良好" : s >= 50 ? "平稳" : "待加强");

/**
 * 天赋雷达（简化算法，仅供参考）：
 * 以十神五行力量占比（理想约 20%）＋ 喜忌加减 ＋ 常见组合（食伤生财、官印相生等）估分。
 */
export function talentProfile(r: BaziResult, year = new Date().getFullYear()): Talent[] {
  const dm = r.dayMasterWx;
  const total = WUXING_ORDER.reduce((s, w) => s + r.scores[w], 0);
  const wxOf: Record<God, WuXing> = { 比劫: dm, 印星: generatorOf(dm), 食伤: SHENG[dm], 财星: KE[dm], 官杀: controllerOf(dm) };
  // 比劫不计日主本身
  const share = (g: God) => Math.max(0, r.scores[wxOf[g]] - (g === "比劫" ? 1 : 0)) / total;
  const presence = (s: number) => Math.max(-20, 35 - Math.abs(s - 0.2) * 200);
  const favAdj = (wx: WuXing) => (r.favorable.includes(wx) ? 12 : r.unfavorable.includes(wx) ? -10 : 0);
  const tag = (wx: WuXing) => (r.favorable.includes(wx) ? "，为喜用" : r.unfavorable.includes(wx) ? "，为忌神" : "");
  const pct = (g: God) => `${g}（${wxOf[g]}）占 ${Math.round(share(g) * 100)}%${tag(wxOf[g])}`;

  const cai = share("财星");
  const guan = share("官杀");
  const shi = share("食伤");
  const yin = share("印星");
  const bi = share("比劫");
  const male = r.input.gender === "male";
  const spouse: God = male ? "财星" : "官杀";

  // 当前大运五行
  const dy = r.daYun.find((d) => year >= d.startYear && year <= d.endYear) ?? r.daYun[0];
  const dyWx = dy ? [GAN_WX[dy.ganZhi[0]], ZHI_WX[dy.ganZhi[1]]] : [];
  const luck = dyWx.reduce((s, w) => s + (r.favorable.includes(w) ? 15 : r.unfavorable.includes(w) ? -12 : 0), 58);

  const raw: Omit<Talent, "level">[] = [
    {
      key: "wealth",
      label: "财运",
      score: 40 + presence(cai) + favAdj(wxOf.财星) + (shi > 0.1 ? 6 : 0) - (r.strength === "身弱" && cai > 0.3 ? 8 : 0),
      note: `${pct("财星")}${shi > 0.1 ? "；食伤生财，靠本事赚钱" : ""}`,
    },
    {
      key: "career",
      label: "事业",
      score: 40 + presence(guan) + favAdj(wxOf.官杀) + (yin > 0.1 ? 6 : 0),
      note: `${pct("官杀")}${yin > 0.1 ? "；官印相生，易得提拔" : ""}`,
    },
    {
      key: "love",
      label: "感情",
      score: 50 + presence(male ? cai : guan) * 0.8 + favAdj(wxOf[spouse]) - (male && bi > 0.3 ? 8 : 0) - (!male && shi > 0.3 ? 8 : 0),
      note: `${male ? "妻" : "夫"}星为${pct(spouse)}`,
    },
    {
      key: "talent",
      label: "才华",
      score: 40 + presence(shi) + favAdj(wxOf.食伤) + (yin > 0.15 ? 5 : 0),
      note: `${pct("食伤")}，主创意与表达`,
    },
    {
      key: "social",
      label: "人缘",
      score: 40 + presence(bi) + favAdj(dm) + (yin > 0.1 ? 5 : 0),
      note: `${pct("比劫")}，主朋友与合作`,
    },
    {
      key: "luck",
      label: "运势",
      score: luck,
      note: dy ? `当前大运 ${dy.ganZhi}（${dyWx.join("、")}）${dyWx.some((w) => r.favorable.includes(w)) ? "，行喜用运" : "，宜稳守"}` : "大运未起",
    },
  ];
  return raw.map((t) => {
    const score = clamp(t.score);
    return { ...t, score, level: levelOf(score) };
  });
}
