import { Solar, LunarUtil } from "lunar-javascript";
import {
  type WuXing, WUXING_ORDER, GAN_WX, ZHI_WX, SHENG, KE, generatorOf, controllerOf,
} from "./wuxing";

export type Gender = "male" | "female";

export interface BirthInfo {
  name?: string;
  gender: Gender;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** 时辰不详：时柱不参与计算 */
  hourUnknown?: boolean;
  /** 出生地（仅作记录与 AI 参考） */
  place?: string;
}

export interface HiddenStem {
  gan: string;
  wx: WuXing;
  shiShen: string;
}

export interface Pillar {
  label: "年柱" | "月柱" | "日柱" | "时柱";
  gan: string;
  zhi: string;
  ganWx: WuXing;
  zhiWx: WuXing;
  /** 天干十神（日柱为"日主"） */
  shiShen: string;
  hidden: HiddenStem[];
  naYin: string;
}

export interface DaYun {
  ganZhi: string;
  startYear: number;
  endYear: number;
  startAge: number;
  shiShen: string;
}

export interface BaziResult {
  input: BirthInfo;
  solarText: string;
  lunarText: string;
  shengXiao: string;
  /** 五行生肖，如「土属蛇」（取生肖年天干五行） */
  shengXiaoWx: string;
  pillars: Pillar[];
  dayMaster: string;
  dayMasterWx: WuXing;
  /** 五行力量（加权） */
  scores: Record<WuXing, number>;
  percents: Record<WuXing, number>;
  /** 同党（比劫+印）占比 */
  supportRatio: number;
  strength: "身强" | "身弱" | "中和";
  favorable: WuXing[];
  unfavorable: WuXing[];
  missing: WuXing[];
  daYun: DaYun[];
  qiYunText: string;
  /** 出生的农历年（虚岁起算年） */
  birthLunarYear: number;
  mingGong: string;
  taiYuan: string;
  kongWang: string;
}

// 藏干权重：本气 / 中气 / 余气
const HIDDEN_WEIGHTS = [[1], [0.7, 0.3], [0.6, 0.3, 0.1]];

export const shiShenOf = (dayGan: string, otherGan: string): string =>
  LunarUtil.SHI_SHEN[dayGan + otherGan];

export function computeBazi(input: BirthInfo): BaziResult {
  const hour = input.hourUnknown ? 12 : input.hour;
  const minute = input.hourUnknown ? 0 : input.minute;
  const solar = Solar.fromYmdHms(input.year, input.month, input.day, hour, minute, 0);
  const lunar = solar.getLunar();
  const ec = lunar.getEightChar();
  // 以早子时为当日（sect 2 为晚子时算次日，保持默认 1）
  const dayGan: string = ec.getDayGan();

  const raw: [Pillar["label"], string, string, string, string[]][] = [
    ["年柱", ec.getYearGan(), ec.getYearZhi(), ec.getYearNaYin(), ec.getYearHideGan()],
    ["月柱", ec.getMonthGan(), ec.getMonthZhi(), ec.getMonthNaYin(), ec.getMonthHideGan()],
    ["日柱", ec.getDayGan(), ec.getDayZhi(), ec.getDayNaYin(), ec.getDayHideGan()],
    ["时柱", ec.getTimeGan(), ec.getTimeZhi(), ec.getTimeNaYin(), ec.getTimeHideGan()],
  ];

  const pillars: Pillar[] = raw
    .filter(([label]) => !(input.hourUnknown && label === "时柱"))
    .map(([label, gan, zhi, naYin, hide]) => ({
      label,
      gan,
      zhi,
      ganWx: GAN_WX[gan],
      zhiWx: ZHI_WX[zhi],
      shiShen: label === "日柱" ? "日主" : shiShenOf(dayGan, gan),
      hidden: hide.map((g) => ({ gan: g, wx: GAN_WX[g], shiShen: shiShenOf(dayGan, g) })),
      naYin,
    }));

  // ---- 五行力量 ----
  const scores = Object.fromEntries(WUXING_ORDER.map((w) => [w, 0])) as Record<WuXing, number>;
  for (const p of pillars) {
    scores[p.ganWx] += 1;
    // 月令当旺，权重加倍
    const factor = p.label === "月柱" ? 2 : 1;
    const weights = HIDDEN_WEIGHTS[p.hidden.length - 1];
    p.hidden.forEach((h, i) => (scores[h.wx] += weights[i] * factor));
  }
  const total = WUXING_ORDER.reduce((s, w) => s + scores[w], 0);
  const percents = Object.fromEntries(
    WUXING_ORDER.map((w) => [w, Math.round((scores[w] / total) * 100)]),
  ) as Record<WuXing, number>;

  // ---- 身强身弱 与 喜用神（简化扶抑法）----
  const dmWx = GAN_WX[dayGan];
  const resource = generatorOf(dmWx); // 印
  const output = SHENG[dmWx]; // 食伤
  const wealth = KE[dmWx]; // 财
  const officer = controllerOf(dmWx); // 官杀
  const supportRatio = (scores[dmWx] + scores[resource]) / total;
  const strength = supportRatio >= 0.55 ? "身强" : supportRatio <= 0.42 ? "身弱" : "中和";

  let favorable: WuXing[];
  let unfavorable: WuXing[];
  if (strength === "身弱") {
    favorable = [resource, dmWx].sort((a, b) => scores[a] - scores[b]);
    unfavorable = [officer, wealth, output].sort((a, b) => scores[b] - scores[a]);
  } else if (strength === "身强") {
    favorable = [output, wealth, officer].sort((a, b) => scores[a] - scores[b]);
    unfavorable = [resource, dmWx].sort((a, b) => scores[b] - scores[a]);
  } else {
    // 中和：取最弱之二行调候
    favorable = [...WUXING_ORDER].sort((a, b) => scores[a] - scores[b]).slice(0, 2);
    unfavorable = [...WUXING_ORDER].sort((a, b) => scores[b] - scores[a]).slice(0, 1);
  }

  const missing = WUXING_ORDER.filter(
    (w) => !pillars.some((p) => p.ganWx === w || p.zhiWx === w),
  );

  // ---- 大运 ----
  const yun = ec.getYun(input.gender === "male" ? 1 : 0);
  // 虚岁按农历年（春节）计：出生即 1 岁，每过一个春节加 1 岁
  const birthLunarYear: number = lunar.getYear();
  const qiYun = yun.getStartSolar();
  const daYun: DaYun[] = yun
    .getDaYun()
    .slice(1, 9)
    .map((d: { getGanZhi(): string; getStartYear(): number; getEndYear(): number }, i: number) => {
      // 第 i 步大运于起运日后 10·i 年交运，取交运当天的农历年算虚岁
      const day = qiYun.getMonth() === 2 && qiYun.getDay() === 29 ? 28 : qiYun.getDay();
      const at = Solar.fromYmd(qiYun.getYear() + i * 10, qiYun.getMonth(), day).getLunar().getYear();
      return {
        ganZhi: d.getGanZhi(),
        startYear: d.getStartYear(),
        endYear: d.getEndYear(),
        startAge: at - birthLunarYear + 1,
        shiShen: shiShenOf(dayGan, d.getGanZhi()[0]),
      };
    });
  // 以虚岁表述起运：如「虚岁5岁起运（1993年3月25日交运），每十年换一步大运」
  const qiYunText = `虚岁${daYun[0]?.startAge ?? 1}岁起运（${qiYun.getYear()}年${qiYun.getMonth()}月${qiYun.getDay()}日交运），每十年换一步大运`;

  return {
    input,
    solarText: `${input.year}年${input.month}月${input.day}日${input.hourUnknown ? "（时辰不详）" : ` ${ampm(hour, minute)}`}`,
    lunarText: `农历${lunar.getYearInGanZhi()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}${input.hourUnknown ? "" : ` ${lunar.getTimeZhi()}时`}`,
    // 生肖按民间习惯以农历新年为界；八字年柱则以立春为界（两者在正月初一至立春之间出生时会不同）
    shengXiao: lunar.getYearShengXiao(),
    shengXiaoWx: `${GAN_WX[lunar.getYearGan()]}属${lunar.getYearShengXiao()}`,
    pillars,
    dayMaster: dayGan,
    dayMasterWx: dmWx,
    scores,
    percents,
    supportRatio,
    strength,
    favorable,
    unfavorable,
    missing,
    daYun,
    qiYunText,
    birthLunarYear,
    mingGong: ec.getMingGong(),
    taiYuan: ec.getTaiYuan(),
    kongWang: ec.getDayXunKong(),
  };
}

const pad = (n: number) => String(n).padStart(2, "0");
/** 12 小时制：03:00 AM / 11:33 AM / 01:30 PM */
const ampm = (h: number, m: number) => `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(m)} ${h < 12 ? "AM" : "PM"}`;

/** 当前所行大运 */
/** 某日的虚岁（按农历年，每过春节加一岁）与周岁 */
export function ageOn(r: BaziResult, date: Date) {
  const lunarYear: number = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar().getYear();
  const { year, month, day } = r.input;
  const beforeBirthday = date.getMonth() + 1 < month || (date.getMonth() + 1 === month && date.getDate() < day);
  return { nominal: lunarYear - r.birthLunarYear + 1, actual: date.getFullYear() - year - (beforeBirthday ? 1 : 0) };
}

export function currentDaYun(r: BaziResult, year = new Date().getFullYear()) {
  return r.daYun.find((d) => year >= d.startYear && year <= d.endYear);
}

/** 供 AI 大师使用的命盘摘要（纯文本） */
export function baziSummary(r: BaziResult): string {
  const pillarText = r.pillars
    .map((p) => `${p.label} ${p.gan}${p.zhi}（天干${p.shiShen}，藏干${p.hidden.map((h) => h.gan + h.shiShen).join("、")}，纳音${p.naYin}）`)
    .join("\n");
  const cur = currentDaYun(r);
  return [
    `称呼：${r.input.name || "缘主"}；性别：${r.input.gender === "male" ? "男" : "女"}`,
    `出生：公历${r.solarText}；${r.lunarText}；生肖${r.shengXiao}${r.input.place ? `；出生地${r.input.place}` : ""}`,
    shengXiaoNote(r),
    `四柱：\n${pillarText}`,
    `日主：${r.dayMaster}${r.dayMasterWx}，${r.strength}（同党占比${Math.round(r.supportRatio * 100)}%）`,
    `五行占比：${WUXING_ORDER.map((w) => `${w}${r.percents[w]}%`).join(" ")}${r.missing.length ? `；缺${r.missing.join("、")}` : ""}`,
    `喜用神（简化扶抑法）：${r.favorable.join("、")}；忌：${r.unfavorable.join("、")}`,
    `命宫${r.mingGong}，胎元${r.taiYuan}，日柱空亡${r.kongWang}`,
    `大运（${r.qiYunText}）：${r.daYun.map((d) => `${d.ganZhi}(虚岁${d.startAge}起，${d.startYear}-${d.endYear})`).join(" ")}`,
    cur ? `当前大运：${cur.ganZhi}（${cur.shiShen}运）` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

// ---------------- 命宫 · 胎元 · 空亡 白话解释 ----------------

const ZHI_ANIMALS: Record<string, string> = {
  子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇", 午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪",
};
const GAN_S = "甲乙丙丁戊己庚辛壬癸";
const ZHI_S = "子丑寅卯辰巳午未申酉戌亥";

export interface PlainTerm {
  title: string;
  what: string;
  mine: string;
  tip: string;
}

/** 命宫、胎元、空亡的白话解释（结合本人命盘） */
export function explainTerms(r: BaziResult, thisYear: number): Record<"mingGong" | "taiYuan" | "kongWang", PlainTerm> {
  const gz = (s: string) => `${s[0]}属${GAN_WX[s[0]]}、${s[1]}属${ZHI_WX[s[1]]}`;

  // 空亡：原局哪一柱落空，未来哪些年份逢空
  const kw = [...r.kongWang];
  const hitPillars = r.pillars.filter((p) => p.label !== "日柱" && kw.includes(p.zhi)).map((p) => `${p.label}（${p.gan}${p.zhi}）`);
  const years: string[] = [];
  for (let y = thisYear; y < thisYear + 12 && years.length < 2; y++) {
    const z = ZHI_S[(y - 4) % 12];
    if (kw.includes(z)) years.push(`${y}年（${GAN_S[(y - 4) % 10]}${z}）`);
  }

  return {
    mingGong: {
      title: "命宫",
      what: "由出生月份与时辰推算出的「命运之宫」，好比一个人的底色，反映先天性格、人生格局与一生的大方向。",
      mine: `您的命宫为「${r.mingGong}」（${gz(r.mingGong)}）。`,
      tip: `命宫五行与日主（${r.dayMaster}${r.dayMasterWx}）相生则一生较顺，相克则需多靠后天努力。`,
    },
    taiYuan: {
      title: "胎元",
      what: "受孕的月份（出生月往前推约十个月），代表先天禀赋、体质根基与祖上的庇荫。",
      mine: `您的胎元为「${r.taiYuan}」（${gz(r.taiYuan)}）。`,
      tip: `胎元五行若为您的喜用（${r.favorable.join("、")}），代表先天底子好、易得长辈助力。`,
    },
    kongWang: {
      title: "空亡",
      what: "以日柱所在的「旬」（十天干配十二地支）推出，空出没配到的两个地支即为空亡。遇到空亡，相关的人和事容易「落空」、虚而不实。",
      mine: `您的空亡为「${r.kongWang}」（${kw.map((z) => `${z}${ZHI_ANIMALS[z]}`).join("、")}）。${
        hitPillars.length ? `原局中${hitPillars.join("、")}逢空，该柱代表的事情较难抓牢。` : "原局四柱没有落入空亡，影响较小。"
      }`,
      tip: years.length
        ? `流年逢空：${years.join("、")}，这些年份重要的承诺、合作、投资要多做确认，别只听口头答应。`
        : "近年流年没有逢空，可以放心推进计划。",
    },
  };
}

const YEAR_ANIMAL: Record<string, string> = {
  子: "鼠", 丑: "牛", 寅: "虎", 卯: "兔", 辰: "龙", 巳: "蛇", 午: "马", 未: "羊", 申: "猴", 酉: "鸡", 戌: "狗", 亥: "猪",
};

/** 生肖（农历新年为界）与年柱（立春为界）不一致时的说明；一致时返回空字符串 */
export function shengXiaoNote(r: BaziResult): string {
  const y = r.pillars[0];
  const pillarAnimal = YEAR_ANIMAL[y.zhi];
  if (pillarAnimal === r.shengXiao) return "";
  return `生肖按农历新年计为属${r.shengXiao}；八字以立春为岁首，出生时尚未立春，故年柱为${y.gan}${y.zhi}（${pillarAnimal}）。`;
}
