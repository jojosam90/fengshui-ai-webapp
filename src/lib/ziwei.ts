import { astro } from "iztro";
import type { BirthInfo } from "./bazi";

export interface ZwStar {
  name: string;
  brightness?: string;
  mutagen?: string;
}

export interface ZwPalace {
  index: number;
  name: string;
  stem: string;
  branch: string;
  isBody: boolean;
  major: ZwStar[];
  minor: ZwStar[];
  adjective: string[];
  changsheng: string;
  decadal: [number, number];
}

export interface ZiweiResult {
  solarDate: string;
  lunarDate: string;
  chineseDate: string;
  time: string;
  timeRange: string;
  zodiac: string;
  sign: string;
  soul: string;
  body: string;
  fiveElementsClass: string;
  palaces: ZwPalace[];
  /** 运限：各自所在宫位的 index */
  horoscope: {
    age: number;
    decadalIndex: number;
    decadalGanZhi: string;
    yearlyIndex: number;
    yearlyGanZhi: string;
    yearlyMutagen: string[];
  };
  hourAssumed: boolean;
}

/** iztro 时辰序号：0 早子 · 1 丑 … 11 亥 · 12 晚子 */
function timeIndex(hour: number) {
  if (hour === 23) return 12;
  return Math.floor((hour + 1) / 2);
}

type RawStar = { name: string; brightness?: string; mutagen?: string };
const star = (s: RawStar): ZwStar => ({ name: s.name, brightness: s.brightness || undefined, mutagen: s.mutagen || undefined });

export function computeZiwei(info: BirthInfo, now = new Date()): ZiweiResult {
  const hourAssumed = !!info.hourUnknown;
  const a = astro.bySolar(
    `${info.year}-${info.month}-${info.day}`,
    hourAssumed ? 6 : timeIndex(info.hour),
    info.gender === "male" ? "男" : "女",
    true,
    "zh-CN",
  );
  const h = a.horoscope(now);

  return {
    solarDate: a.solarDate,
    lunarDate: a.lunarDate,
    chineseDate: a.chineseDate,
    time: a.time,
    timeRange: a.timeRange,
    zodiac: a.zodiac,
    sign: a.sign,
    soul: a.soul,
    body: a.body,
    fiveElementsClass: a.fiveElementsClass,
    palaces: a.palaces.map((p) => ({
      index: p.index,
      name: p.name,
      stem: p.heavenlyStem,
      branch: p.earthlyBranch,
      isBody: p.isBodyPalace,
      major: p.majorStars.map(star),
      minor: p.minorStars.map(star),
      adjective: p.adjectiveStars.map((s) => s.name),
      changsheng: p.changsheng12,
      decadal: [p.decadal.range[0], p.decadal.range[1]],
    })),
    horoscope: {
      age: h.age.nominalAge,
      decadalIndex: h.decadal.index,
      decadalGanZhi: h.decadal.heavenlyStem + h.decadal.earthlyBranch,
      yearlyIndex: h.yearly.index,
      yearlyGanZhi: h.yearly.heavenlyStem + h.yearly.earthlyBranch,
      yearlyMutagen: h.yearly.mutagen,
    },
    hourAssumed,
  };
}

export const MUTAGEN_NAMES = ["化禄", "化权", "化科", "化忌"];

export function ziweiSummary(z: ZiweiResult): string {
  const fmt = (s: ZwStar) => s.name + (s.brightness ?? "") + (s.mutagen ? `化${s.mutagen}` : "");
  const lines = z.palaces.map(
    (p) =>
      `${p.name}（${p.stem}${p.branch}${p.isBody ? "，身宫" : ""}）：主星${p.major.map(fmt).join("、") || "无（空宫）"}；辅星${p.minor.map(fmt).join("、") || "无"}；大限${p.decadal[0]}-${p.decadal[1]}岁`,
  );
  const dec = z.palaces[z.horoscope.decadalIndex];
  const yr = z.palaces[z.horoscope.yearlyIndex];
  return [
    `紫微命盘：${z.fiveElementsClass}，命主${z.soul}，身主${z.body}${z.hourAssumed ? "（时辰不详，按午时排盘）" : ""}`,
    ...lines,
    `当前虚岁${z.horoscope.age}，大限${z.horoscope.decadalGanZhi}在原局${dec.name}；流年${z.horoscope.yearlyGanZhi}命宫在原局${yr.name}，流年四化：${z.horoscope.yearlyMutagen.map((s, i) => s + MUTAGEN_NAMES[i]).join("、")}`,
  ].join("\n");
}

// ---------------- 解读资料 ----------------

export const PALACE_INFO: Record<string, { title: string; desc: string }> = {
  命宫: { title: "命宫", desc: "一生命运总纲，代表性格、才华、外貌气质与人生格局。" },
  兄弟: { title: "兄弟宫", desc: "兄弟姐妹、同辈与合伙关系，也可看现金周转。" },
  夫妻: { title: "夫妻宫", desc: "婚姻感情、配偶特质与相处模式。" },
  子女: { title: "子女宫", desc: "子女缘分、晚辈关系、性生活与创造力。" },
  财帛: { title: "财帛宫", desc: "求财方式、理财能力与一生财运。" },
  疾厄: { title: "疾厄宫", desc: "身体体质、易患疾病与心理状态。" },
  迁移: { title: "迁移宫", desc: "外出发展、旅行、社会形象与机遇。" },
  仆役: { title: "交友宫（仆役）", desc: "朋友、同事、下属与人际网络。" },
  官禄: { title: "官禄宫", desc: "事业方向、工作表现与社会地位。" },
  田宅: { title: "田宅宫", desc: "不动产、居家环境与家族运势。" },
  福德: { title: "福德宫", desc: "精神生活、兴趣嗜好、福分与心境。" },
  父母: { title: "父母宫", desc: "父母长辈、上司关系与文书运。" },
};

export const MAJOR_STAR_INFO: Record<string, string> = {
  紫微: "帝星，主尊贵、领导力与自尊心，喜百官朝拱。",
  天机: "智慧之星，主机敏、谋略与变动，善于思考策划。",
  太阳: "光明之星，主博爱、名声与付出，宜公众事业。",
  武曲: "正财星，主刚毅果断、理财能力，重实际。",
  天同: "福星，主温和知足、享受生活与人缘。",
  廉贞: "次桃花与囚星，主精明、公关能力与感情纠葛。",
  天府: "财库之星，主稳重保守、善于守成与管理。",
  太阴: "田宅主、财星，主温柔细腻、积蓄与家庭。",
  贪狼: "桃花与欲望之星，主多才多艺、交际与野心。",
  巨门: "暗星，主口才、思辨与是非，宜以口为业。",
  天相: "印星，主稳重公正、协调与服务精神。",
  天梁: "荫星，主清高、照顾他人、逢凶化吉。",
  七杀: "将星，主冲劲、魄力与开创，宜独当一面。",
  破军: "耗星，主破旧立新、冒险与变革。",
};

export const BRIGHTNESS_INFO: Record<string, string> = {
  庙: "最旺", 旺: "旺", 得: "得地", 利: "利", 平: "平", 不: "不得地", 陷: "落陷",
};

/** 命盘九宫格位置（地支 → [行, 列]），中间 2×2 为命主信息 */
export const BRANCH_CELL: Record<string, [number, number]> = {
  巳: [0, 0], 午: [0, 1], 未: [0, 2], 申: [0, 3],
  辰: [1, 0], 酉: [1, 3],
  卯: [2, 0], 戌: [2, 3],
  寅: [3, 0], 丑: [3, 1], 子: [3, 2], 亥: [3, 3],
};

// ---------------- 宫位强弱与白话解读 ----------------

export const LUCKY_STARS = new Set(["左辅", "右弼", "文昌", "文曲", "天魁", "天钺", "禄存", "天马"]);
export const SHA_STARS = new Set(["擎羊", "陀罗", "火星", "铃星", "地空", "地劫"]);
const BRIGHT_SCORE: Record<string, number> = { 庙: 2, 旺: 2, 得: 1, 利: 1, 平: 0, 不: -1, 陷: -2 };

/** 三方四正：对宫与两个三合宫 */
export const sanFang = (z: ZiweiResult, index: number) => ({
  opposite: z.palaces[(index + 6) % 12],
  trine: [z.palaces[(index + 4) % 12], z.palaces[(index + 8) % 12]],
});

/** 宫位强弱评估（本宫为主，三方四正减半计） */
export function assessPalace(z: ZiweiResult, index: number) {
  const p = z.palaces[index];
  const { opposite, trine } = sanFang(z, index);
  let score = 0;
  for (const s of p.major) score += BRIGHT_SCORE[s.brightness ?? "平"] ?? 0;
  for (const q of [p, opposite, ...trine]) {
    const w = q === p ? 1 : 0.5;
    for (const s of [...q.major, ...q.minor]) {
      if (LUCKY_STARS.has(s.name)) score += w;
      if (SHA_STARS.has(s.name)) score -= w;
      if (s.mutagen === "禄" || s.mutagen === "权" || s.mutagen === "科") score += w;
      if (s.mutagen === "忌") score -= 1.5 * w;
    }
  }
  if (score >= 3) return { label: "强旺", tone: "bg-good/15 text-good", plain: "你的强项，可大胆发挥。" };
  if (score >= 1) return { label: "偏吉", tone: "bg-good/10 text-good", plain: "整体偏好，顺势而为。" };
  if (score > -1) return { label: "平稳", tone: "bg-card-2 text-muted", plain: "不好不坏，看自己经营。" };
  if (score > -3) return { label: "需留意", tone: "bg-gold-soft text-gold", plain: "有起伏，多用点心会更顺。" };
  return { label: "多波折", tone: "bg-bad/15 text-bad", plain: "挑战较多，稳扎稳打。" };
}


const STAR_PLAIN: Record<string, string> = {
  紫微: "有领导气质，爱面子",
  天机: "点子多，但易想太多",
  太阳: "热心付出，重名声",
  武曲: "果断务实，对钱敏感",
  天同: "性格温和，懂得享受",
  廉贞: "精明会交际，感情较复杂",
  天府: "稳重，善守钱财资源",
  太阴: "细心温柔，重视家庭",
  贪狼: "多才多艺，爱交际",
  巨门: "口才好，易惹口舌",
  天相: "公正协调，乐于助人",
  天梁: "爱照顾人，常遇贵人",
  七杀: "冲劲大，敢闯敢拼",
  破军: "爱变化，敢推倒重来",
};

/** 星曜力量（简短标注） */
const BRIGHT_PLAIN = (b?: string) =>
  b === "庙" || b === "旺" ? "强" : b === "得" || b === "利" ? "佳" : b === "不" || b === "陷" ? "弱" : "平";

const MUTAGEN_PLAIN: Record<string, string> = {
  禄: "化禄：有好运，易得好处",
  权: "化权：你说了算，有掌控力",
  科: "化科：名声好，易遇贵人",
  忌: "化忌：易有烦恼或卡住，要多用心",
};

/** 用大白话解读一个宫位，返回若干段文字 */
export function plainReading(z: ZiweiResult, index: number): string[] {
  const p = z.palaces[index];
  const { opposite } = sanFang(z, index);
  const out: string[] = [];

  // 宫位含义、空宫借星、身宫已在面板标题与标签中显示，这里只讲星曜
  if (p.major.length === 0) out.push("空宫：易受外界影响，变化多。");
  for (const s of p.major.length ? p.major : opposite.major) {
    out.push(`${s.name}（${BRIGHT_PLAIN(s.brightness)}）：${STAR_PLAIN[s.name]}。`);
  }

  for (const s of [...p.major, ...p.minor].filter((x) => x.mutagen)) out.push(`${s.name}${MUTAGEN_PLAIN[s.mutagen!]}。`);

  const lucky = p.minor.filter((s) => LUCKY_STARS.has(s.name)).map((s) => s.name);
  const sha = p.minor.filter((s) => SHA_STARS.has(s.name)).map((s) => s.name);
  if (lucky.length) out.push(`吉星${lucky.join("、")}：加分，易得助力。`);
  if (sha.length) out.push(`煞星${sha.join("、")}：有些阻力，遇事冷静。`);


  const verdict = assessPalace(z, index);
  out.push(`总评：${verdict.label}——${verdict.plain}`);
  return out;
}

// ---------------- 流年财帛宫 / 田宅宫 ----------------

export interface YearlyPalace {
  /** 流年宫名，如「流年财帛宫」 */
  title: string;
  branch: string;
  /** 所落原局宫位 */
  natalName: string;
  stars: string[];
  /** 流年四化落入本宫，如「武曲化禄」 */
  mutagens: string[];
  /** 流耀（流禄、流羊等） */
  flow: string[];
  label: "大吉" | "偏吉" | "平稳" | "留意";
  advice: string;
}

const YEARLY_ADVICE: Record<"财帛" | "田宅", Record<YearlyPalace["label"], string>> = {
  财帛: {
    大吉: "进财顺，可积极开源、谈加薪或投资",
    偏吉: "财运向好，正职之外可试副业",
    平稳: "收支平稳，按计划理财",
    留意: "防破财，勿借贷担保、少投机",
  },
  田宅: {
    大吉: "利置业、买房装修、搬迁",
    偏吉: "家宅安稳，可规划置业",
    平稳: "维持现状，量力而为",
    留意: "暂缓大额置业，防房产纠纷",
  },
};

/** 取某年（农历年中）流年财帛宫与田宅宫 */
export function yearlyWealthPalaces(info: BirthInfo, year: number): YearlyPalace[] {
  const z = computeZiwei(info, new Date(year, 5, 15));
  const a = astro.bySolar(
    `${info.year}-${info.month}-${info.day}`,
    info.hourUnknown ? 6 : timeIndex(info.hour),
    info.gender === "male" ? "男" : "女",
    true,
    "zh-CN",
  );
  const h = a.horoscope(new Date(year, 5, 15));
  const names = h.yearly.palaceNames as string[];
  const mut = h.yearly.mutagen as string[];

  return (["财帛", "田宅"] as const).map((key) => {
    const idx = names.findIndex((n) => n === key);
    const p = z.palaces[idx];
    const all = [...p.major, ...p.minor];
    const mutagens = mut.flatMap((s, i) => (all.some((x) => x.name === s) ? [`${s}${MUTAGEN_NAMES[i]}`] : []));
    const flow = (h.yearly.stars?.[idx] ?? []).map((s) => s.name);

    // 原局宫位强弱 ＋ 流年四化 ＋ 流禄/流羊
    const base = { 强旺: 2, 偏吉: 1, 平稳: 0, 需留意: -1, 多波折: -2 }[assessPalace(z, idx).label] ?? 0;
    let score = base;
    for (const m of mutagens) score += m.endsWith("化禄") ? 2 : m.endsWith("化忌") ? -2.5 : 1;
    if (flow.includes("流禄")) score += 1;
    if (flow.includes("流羊") || flow.includes("流陀")) score -= 0.5;
    const label: YearlyPalace["label"] = score >= 2.5 ? "大吉" : score >= 1 ? "偏吉" : score > -1 ? "平稳" : "留意";

    return {
      title: `流年${key}宫`,
      branch: p.branch,
      natalName: p.name,
      // 空宫借对宫主星
      stars: p.major.length
        ? p.major.map((s) => s.name + (s.brightness ? `(${s.brightness})` : ""))
        : [`空宫·借${sanFang(z, idx).opposite.major.map((s) => s.name).join("") || "无"}`],
      mutagens,
      flow: flow.filter((f) => f === "流禄" || f === "流羊" || f === "流陀" || f === "流马"),
      label,
      advice: YEARLY_ADVICE[key][label],
    };
  });
}
