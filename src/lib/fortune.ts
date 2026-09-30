import { Solar } from "lunar-javascript";
import { type BaziResult, shiShenOf } from "./bazi";
import { GAN_WX, WX_LUCKY_COLORS, WX_NUMBERS, ZHI_ANIMAL, ZHI_WX, zhiRelation } from "./wuxing";

export interface ShiShenTheme {
  keyword: string;
  base: number;
  career: string;
  wealth: string;
  love: string;
  health: string;
}

// 流日天干对日主的十神 → 当日主题
const THEMES: Record<string, ShiShenTheme> = {
  比肩: { keyword: "同心协力", base: 70, career: "适合团队合作，同事助力多", wealth: "财运平稳，避免与人合伙投资", love: "朋友聚会中易结善缘", health: "精力充沛，适度运动" },
  劫财: { keyword: "守财为上", base: 58, career: "竞争压力较大，宜专注本职", wealth: "易有意外开销，谨慎借贷", love: "注意沟通方式，避免争执", health: "注意情绪起伏，早睡养神" },
  食神: { keyword: "心宽福至", base: 82, career: "灵感丰富，利创意与表达", wealth: "小有进账，适合享受生活", love: "气氛轻松愉快，桃花温和", health: "口福佳，注意饮食节制" },
  伤官: { keyword: "锋芒内敛", base: 62, career: "才华易显，但忌顶撞上司", wealth: "适合技能变现，勿冲动消费", love: "言语需温柔，忌挑剔", health: "思虑较多，宜放松身心" },
  偏财: { keyword: "财星高照", base: 85, career: "业务拓展顺利，贵人带财", wealth: "偏财运佳，可小试身手", love: "异性缘旺，社交活跃", health: "应酬多，注意肠胃" },
  正财: { keyword: "稳中求进", base: 80, career: "踏实肯干必有回报", wealth: "正财稳定，适合理财规划", love: "感情稳定，适合陪伴家人", health: "作息规律，身体无忧" },
  七杀: { keyword: "化压为动", base: 60, career: "压力与机遇并存，迎难而上", wealth: "不宜高风险投资", love: "易有摩擦，多一分包容", health: "注意安全，避免过度劳累" },
  正官: { keyword: "贵人扶持", base: 78, career: "利考核、面试与晋升", wealth: "收入稳定，名誉带财", love: "适合确认关系或见家长", health: "身体状态良好" },
  偏印: { keyword: "静心悟道", base: 66, career: "适合研究、学习与规划", wealth: "财运一般，宜守不宜攻", love: "易有孤独感，主动联系亲友", health: "注意睡眠质量" },
  正印: { keyword: "福荫庇护", base: 84, career: "长辈贵人相助，利学习考试", wealth: "有得贵人馈赠之象", love: "感情温馨，家庭和睦", health: "身心舒畅，宜调养" },
};

const RELATION_ADJ: Record<string, { adj: number; text: string }> = {
  六合: { adj: 8, text: "流日与日支六合，人和事顺" },
  三合: { adj: 6, text: "流日与日支三合，易得助力" },
  六冲: { adj: -12, text: "流日冲日支，出行、决策宜谨慎" },
  相害: { adj: -6, text: "流日与日支相害，提防小人口舌" },
  相刑: { adj: -5, text: "流日与日支相刑，凡事三思而行" },
  自刑: { adj: -3, text: "流日与日支自刑，勿钻牛角尖" },
};

export interface DailyFortune {
  score: number;
  keyword: string;
  shiShen: string;
  dayGanZhi: string;
  career: string;
  wealth: string;
  love: string;
  health: string;
  notes: string[];
  luckyColors: string[];
  luckyNumbers: number[];
  luckyDirection: string;
}

export function getDailyFortune(bazi: BaziResult, date: Date): DailyFortune {
  const lunar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
  const dayGan: string = lunar.getDayGan();
  const dayZhi: string = lunar.getDayZhi();
  const { shiShen, theme, score, notes } = evaluatePeriod(bazi, dayGan, dayZhi, "今日");

  const useWx = bazi.favorable[0];
  return {
    score,
    keyword: theme.keyword,
    shiShen,
    dayGanZhi: dayGan + dayZhi,
    career: theme.career,
    wealth: theme.wealth,
    love: theme.love,
    health: theme.health,
    notes,
    luckyColors: WX_LUCKY_COLORS[useWx],
    luckyNumbers: WX_NUMBERS[useWx],
    luckyDirection: lunar.getDayPositionCaiDesc(),
  };
}

export interface PeriodEval {
  shiShen: string;
  theme: ShiShenTheme;
  score: number;
  notes: string[];
}

/** 以流运干支对照命局评分（流日 / 流月 / 流年 / 大运通用） */
export function evaluatePeriod(bazi: BaziResult, gan: string, zhi: string, label: string): PeriodEval {
  const shiShen = shiShenOf(bazi.dayMaster, gan);
  const theme = THEMES[shiShen];
  const notes: string[] = [];
  let score = theme.base;

  const dayPillar = bazi.pillars.find((p) => p.label === "日柱")!;
  const rel = RELATION_ADJ[zhiRelation(zhi, dayPillar.zhi)];
  if (rel) {
    score += rel.adj;
    notes.push(rel.text.replace("流日", label));
  }

  const yearZhi = bazi.pillars[0].zhi;
  const taiSui = zhiRelation(zhi, yearZhi);
  if (taiSui === "六冲") {
    score -= 6;
    notes.push(`${label}冲${ZHI_ANIMAL[yearZhi]}，属${ZHI_ANIMAL[yearZhi]}者宜低调行事`);
  } else if (label === "流年" && (taiSui === "比和" || taiSui === "自刑")) {
    score -= 3;
    notes.push(`流年值太岁（本命年），宜稳中求进`);
  }

  const wx = GAN_WX[gan];
  if (bazi.favorable.includes(wx)) {
    score += 6;
    notes.push(`${label}天干属${wx}，为喜用五行，运势加分`);
  } else if (bazi.unfavorable.includes(wx)) {
    score -= 4;
    notes.push(`${label}天干属${wx}，为忌神五行，宜稳守`);
  }
  const zwx = ZHI_WX[zhi];
  if (bazi.favorable.includes(zwx)) score += 3;
  else if (bazi.unfavorable.includes(zwx)) score -= 2;

  return { shiShen, theme, score: Math.max(35, Math.min(98, score)), notes };
}
