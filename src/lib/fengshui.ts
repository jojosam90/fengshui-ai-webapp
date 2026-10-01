import { Solar } from "lunar-javascript";
import type { Gender } from "./bazi";

export type Direction = "东南" | "南" | "西南" | "东" | "中" | "西" | "东北" | "北" | "西北";

/** 九宫格显示顺序（上南下北，传统罗盘朝向） */
export const GRID_ORDER: Direction[] = ["东南", "南", "西南", "东", "中", "西", "东北", "北", "西北"];

/** 洛书飞星顺序：中 → 西北 → 西 → 东北 → 南 → 北 → 西南 → 东 → 东南 */
const FLIGHT_PATH: Direction[] = ["中", "西北", "西", "东北", "南", "北", "西南", "东", "东南"];

export interface StarInfo {
  number: number;
  name: string;
  alias: string;
  wx: string;
  luck: "大吉" | "吉" | "平" | "凶" | "大凶";
  effect: string;
  advice: string;
}

// 九运（2024–2043）视角下的星曜吉凶
export const STARS: Record<number, StarInfo> = {
  1: { number: 1, name: "一白", alias: "贪狼星", wx: "水", luck: "吉", effect: "主人缘、桃花、事业升迁", advice: "宜摆放水种植物或鱼缸，保持明亮整洁" },
  2: { number: 2, name: "二黑", alias: "病符星", wx: "土", luck: "凶", effect: "主疾病、健康欠佳", advice: "宜放铜葫芦或金属摆件化解，避免长期久坐此方" },
  3: { number: 3, name: "三碧", alias: "是非星", wx: "木", luck: "凶", effect: "主口舌是非、官非争执", advice: "宜用红色物品或红灯化解，忌放绿植" },
  4: { number: 4, name: "四绿", alias: "文昌星", wx: "木", luck: "吉", effect: "主学业、考试、文思", advice: "宜设书桌，摆放文昌塔或四支富贵竹" },
  5: { number: 5, name: "五黄", alias: "廉贞星", wx: "土", luck: "大凶", effect: "主灾祸、意外，最忌动土", advice: "宜静不宜动，可放铜铃或六帝钱化煞" },
  6: { number: 6, name: "六白", alias: "武曲星", wx: "金", luck: "吉", effect: "主权力、偏财、贵人", advice: "宜摆放金属饰品，适合作为办公位" },
  7: { number: 7, name: "七赤", alias: "破军星", wx: "金", luck: "凶", effect: "九运退气，主破财、盗窃、口舌", advice: "宜用蓝色、黑色或静水化解，注意门窗安全" },
  8: { number: 8, name: "八白", alias: "左辅星", wx: "土", luck: "吉", effect: "主正财、置业，九运仍为生气之星", advice: "宜摆放黄水晶或陶瓷聚宝盆" },
  9: { number: 9, name: "九紫", alias: "右弼星", wx: "火", luck: "大吉", effect: "九运当旺，主喜庆、名声、姻缘", advice: "宜用红色、紫色装饰，保持光线充足" },
};

export type StarGrid = Record<Direction, number>;

export function flyStars(center: number): StarGrid {
  const grid = {} as StarGrid;
  FLIGHT_PATH.forEach((dir, i) => {
    grid[dir] = ((center - 1 + i) % 9) + 1;
  });
  return grid;
}

export function annualAndMonthlyStars(date: Date) {
  const lunar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate()).getLunar();
  // getIndex(): 0 → 一白 ... 8 → 九紫
  const yearCenter = lunar.getYearNineStar().getIndex() + 1;
  const monthCenter = lunar.getMonthNineStar().getIndex() + 1;
  return {
    yearGanZhi: lunar.getYearInGanZhiByLiChun() as string,
    monthGanZhi: lunar.getMonthInGanZhiExact() as string,
    year: flyStars(yearCenter),
    month: flyStars(monthCenter),
    yearCenter,
    monthCenter,
  };
}

// ---------------- 八宅 · 命卦 ----------------

export interface Gua {
  number: number;
  name: string;
  group: "东四命" | "西四命";
  sitting: Direction;
}

const GUA: Record<number, Omit<Gua, "number">> = {
  1: { name: "坎", group: "东四命", sitting: "北" },
  2: { name: "坤", group: "西四命", sitting: "西南" },
  3: { name: "震", group: "东四命", sitting: "东" },
  4: { name: "巽", group: "东四命", sitting: "东南" },
  6: { name: "乾", group: "西四命", sitting: "西北" },
  7: { name: "兑", group: "西四命", sitting: "西" },
  8: { name: "艮", group: "西四命", sitting: "东北" },
  9: { name: "离", group: "东四命", sitting: "南" },
};

export type MansionKey = "生气" | "天医" | "延年" | "伏位" | "祸害" | "五鬼" | "六煞" | "绝命";

export const MANSIONS: Record<MansionKey, { luck: "吉" | "凶"; desc: string; use: string }> = {
  生气: { luck: "吉", desc: "最旺之方，主事业、财运、活力", use: "大门、主卧、办公桌朝向" },
  天医: { luck: "吉", desc: "主健康、贵人、疾病康复", use: "卧室、厨房灶口朝向" },
  延年: { luck: "吉", desc: "主感情和睦、人际、长寿", use: "主卧、客厅、夫妻房" },
  伏位: { luck: "吉", desc: "主平稳、安定、自我提升", use: "书房、冥想、床头朝向" },
  祸害: { luck: "凶", desc: "主口舌、小病、琐事不顺", use: "卫生间、储物间" },
  五鬼: { luck: "凶", desc: "主火灾、盗窃、是非小人", use: "卫生间、杂物间" },
  六煞: { luck: "凶", desc: "主桃花劫、破财、人际纠纷", use: "卫生间、洗衣房" },
  绝命: { luck: "凶", desc: "最凶之方，主重病、大破财", use: "卫生间、储藏室，勿作卧室" },
};

const MANSION_TABLE: Record<number, Record<MansionKey, Direction>> = {
  1: { 生气: "东南", 天医: "东", 延年: "南", 伏位: "北", 祸害: "西", 五鬼: "东北", 六煞: "西北", 绝命: "西南" },
  2: { 生气: "东北", 天医: "西", 延年: "西北", 伏位: "西南", 祸害: "东", 五鬼: "东南", 六煞: "南", 绝命: "北" },
  3: { 生气: "南", 天医: "北", 延年: "东南", 伏位: "东", 祸害: "西南", 五鬼: "西北", 六煞: "东北", 绝命: "西" },
  4: { 生气: "北", 天医: "南", 延年: "东", 伏位: "东南", 祸害: "西北", 五鬼: "西南", 六煞: "西", 绝命: "东北" },
  6: { 生气: "西", 天医: "东北", 延年: "西南", 伏位: "西北", 祸害: "东南", 五鬼: "东", 六煞: "北", 绝命: "南" },
  7: { 生气: "西北", 天医: "西南", 延年: "东北", 伏位: "西", 祸害: "北", 五鬼: "南", 六煞: "东南", 绝命: "东" },
  8: { 生气: "西南", 天医: "西北", 延年: "西", 伏位: "东北", 祸害: "南", 五鬼: "北", 六煞: "东", 绝命: "东南" },
  9: { 生气: "东", 天医: "东南", 延年: "北", 伏位: "南", 祸害: "东北", 五鬼: "西", 六煞: "西南", 绝命: "西北" },
};

const digitSum = (n: number): number => (n < 10 ? n : digitSum(String(n).split("").reduce((s, d) => s + Number(d), 0)));

/** 命卦以立春为年界 */
export function kuaNumber(year: number, month: number, day: number, gender: Gender, hour = 12, minute = 0): Gua {
  const lunar = Solar.fromYmdHms(year, month, day, hour, minute, 0).getLunar();
  // 立春前出生归上一年（精确到立春交节时刻）
  const y = lunar.getYearInGanZhiExact() === ganZhiOfYear(year) ? year : year - 1;
  const s = digitSum(y % 100);
  let n: number;
  if (gender === "male") {
    n = digitSum(y < 2000 ? 10 - s : 9 - s);
    if (n === 0) n = 9;
    if (n === 5) n = 2;
  } else {
    n = digitSum(y < 2000 ? 5 + s : 6 + s);
    if (n === 5) n = 8;
  }
  return { number: n, ...GUA[n] };
}

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";
const ganZhiOfYear = (y: number) => GAN[(y - 4) % 10] + ZHI[(y - 4) % 12];

/** 方位五行对应的催旺颜色 */
const DIR_COLORS: Record<Direction, string> = {
  东: "绿色、青色", 东南: "绿色、青色", 南: "红色、紫色", 西南: "黄色、米色", 东北: "黄色、米色",
  中: "黄色、米色", 西: "白色、金色", 西北: "白色、金色", 北: "黑色、蓝色",
};

/** 吉方催旺、凶方化解的摆设建议 */
const LAYOUT_TIPS: Record<MansionKey, string> = {
  生气: "摆放绿植或富贵竹，保持光线充足",
  天医: "放铜葫芦或药箱，保持整洁通风",
  延年: "挂风铃或摆成双成对的饰物，利人缘感情",
  伏位: "放书桌或文昌塔，保持安静整洁",
  祸害: "宜放铜葫芦或金属摆件化解，避免长期久坐此方",
  五鬼: "宜放黄色陶瓷或水晶化解（土泄火），忌红色与明火",
  六煞: "宜放绿植泄水气，保持干燥，勿放床位",
  绝命: "宜放黑曜石或水种植物化解（水泄金），勿作卧室、少停留",
};

export function layoutTip(key: MansionKey, direction: Direction): string {
  return MANSIONS[key].luck === "吉" ? `宜用${DIR_COLORS[direction]}装饰，${LAYOUT_TIPS[key]}` : LAYOUT_TIPS[key];
}

export function mansionsFor(gua: Gua) {
  const table = MANSION_TABLE[gua.number];
  return (Object.keys(table) as MansionKey[]).map((k) => ({ key: k, direction: table[k], ...MANSIONS[k], tip: layoutTip(k, table[k]) }));
}

// ---------------- 玄空飞星 · 宅运盘 ----------------

const LOSHU_DIR: Record<number, Direction> = {
  1: "北", 2: "西南", 3: "东", 4: "东南", 5: "中", 6: "西北", 7: "西", 8: "东北", 9: "南",
};

/** 二十四山（自壬起顺时针），每宫三山：地元、天元、人元 */
export const MOUNTAINS: { name: string; palace: Direction; pos: 0 | 1 | 2; yang: boolean; deg: number }[] = (() => {
  const names = "壬子癸丑艮寅甲卯乙辰巽巳丙午丁未坤申庚酉辛戌乾亥";
  const palaces: Direction[] = ["北", "东北", "东", "东南", "南", "西南", "西", "西北"];
  // 坎离震兑三山：阳阴阴；乾坤艮巽三山：阴阳阳
  const cardinal = new Set<Direction>(["北", "南", "东", "西"]);
  return [...names].map((name, i) => {
    const palace = palaces[Math.floor(i / 3)];
    const pos = (i % 3) as 0 | 1 | 2;
    const yang = cardinal.has(palace) ? pos === 0 : pos !== 0;
    return { name, palace, pos, yang, deg: (345 + i * 15) % 360 };
  });
})();

export const PERIODS = [
  { n: 7, years: "1984–2003" },
  { n: 8, years: "2004–2023" },
  { n: 9, years: "2024–2043" },
  { n: 1, years: "2044–2063" },
];

function fly(center: number, forward: boolean): StarGrid {
  const grid = {} as StarGrid;
  FLIGHT_PATH.forEach((dir, i) => {
    grid[dir] = ((((center - 1 + (forward ? i : -i)) % 9) + 9) % 9) + 1;
  });
  return grid;
}

function subStarForward(n: number, own: (typeof MOUNTAINS)[number]) {
  if (n === 5) return own.yang;
  const palace = LOSHU_DIR[n];
  return MOUNTAINS.find((m) => m.palace === palace && m.pos === own.pos)!.yang;
}

export interface HouseChart {
  period: number;
  sit: (typeof MOUNTAINS)[number];
  face: (typeof MOUNTAINS)[number];
  base: StarGrid;
  mountain: StarGrid;
  water: StarGrid;
  pattern: { name: string; desc: string; good: boolean };
}

export function houseChart(period: number, sitName: string): HouseChart {
  const sitIdx = MOUNTAINS.findIndex((m) => m.name === sitName);
  const sit = MOUNTAINS[sitIdx];
  const face = MOUNTAINS[(sitIdx + 12) % 24];
  const base = fly(period, true);
  const mc = base[sit.palace];
  const wc = base[face.palace];
  const mountain = fly(mc, subStarForward(mc, sit));
  const water = fly(wc, subStarForward(wc, face));

  const mAtSit = mountain[sit.palace] === period;
  const mAtFace = mountain[face.palace] === period;
  const wAtSit = water[sit.palace] === period;
  const wAtFace = water[face.palace] === period;
  const pattern =
    mAtSit && wAtFace
      ? { name: "旺山旺向", desc: "当运山星到坐、向星到向，丁财两旺之局。", good: true }
      : mAtFace && wAtSit
        ? { name: "上山下水", desc: "山星到向、向星到坐，损丁破财，需以形峦（向方见山、坐方见水）化解。", good: false }
        : mAtFace && wAtFace
          ? { name: "双星到向", desc: "旺星齐聚向方，旺财；向方宜有水亦宜有山（如高楼）。", good: true }
          : { name: "双星会坐", desc: "旺星齐聚坐方，旺丁；坐方宜有山亦宜有水。", good: true };

  return { period, sit, face, base, mountain, water, pattern };
}

/** 以元运论星之衰旺 */
export function starTimeliness(star: number, period: number): { label: string; good: boolean } {
  const d = (star - period + 9) % 9;
  if (d === 0) return { label: "当旺", good: true };
  if (d === 1 || d === 2) return { label: "生气", good: true };
  if (d === 8) return { label: "退气", good: star !== 5 };
  if ([2, 3, 5, 7].includes(star)) return { label: "煞气", good: false };
  return { label: "死气", good: false };
}

// ---------------- 批流年：命卦位 × 流年飞星 × 太岁 ----------------

const BRANCH_DIR: Record<string, Direction> = {
  子: "北", 丑: "东北", 寅: "东北", 卯: "东", 辰: "东南", 巳: "东南",
  午: "南", 未: "西南", 申: "西南", 酉: "西", 戌: "西北", 亥: "西北",
};
const OPPOSITE: Record<Direction, Direction> = {
  北: "南", 南: "北", 东: "西", 西: "东", 东北: "西南", 西南: "东北", 东南: "西北", 西北: "东南", 中: "中",
};
/** 三煞方：申子辰年在南，寅午戌年在北，巳酉丑年在东，亥卯未年在西 */
const SAN_SHA: Record<string, Direction> = {
  申: "南", 子: "南", 辰: "南", 寅: "北", 午: "北", 戌: "北", 巳: "东", 酉: "东", 丑: "东", 亥: "西", 卯: "西", 未: "西",
};

/** 流年飞星落到本命卦位时的白话提示 */
const STAR_YEAR_ADVICE: Record<number, { tone: "good" | "bad" | "mid"; text: string }> = {
  1: { tone: "good", text: "一白贪狼到本命位：人缘好，利事业、桃花与贵人，适合主动争取机会。" },
  2: { tone: "bad", text: "二黑病符到本命位：身体容易出小毛病，注意作息与体检，少熬夜。" },
  3: { tone: "bad", text: "三碧是非星到本命位：容易口舌是非、与人争执，尽量不要吵架，说话多留余地。" },
  4: { tone: "good", text: "四绿文昌到本命位：利学习、考试、写作与签约，适合进修考证。" },
  5: { tone: "bad", text: "五黄大煞到本命位：最凶之年，防意外与破财，重大决定要谨慎，家中本命方位忌动土。" },
  6: { tone: "good", text: "六白武曲到本命位：贵人相助，利升职与偏财，可以积极进取。" },
  7: { tone: "bad", text: "七赤破军到本命位：防破财、被骗与口舌，钱财往来要小心，出门注意安全。" },
  8: { tone: "good", text: "八白左辅到本命位：正财稳定，利置业、储蓄与长远规划。" },
  9: { tone: "good", text: "九紫右弼到本命位：喜庆之年，利姻缘、名声与人气，适合办喜事。" },
};

export interface YearlyReading {
  year: number;
  ganZhi: string;
  center: number;
  stars: StarGrid;
  taiSui: Direction;
  suiPo: Direction;
  sanSha: Direction;
  myDir: Direction;
  myStar: number;
  flags: { label: string; tone: "good" | "bad" | "mid"; text: string }[];
  verdict: { label: string; tone: "good" | "bad" | "mid" };
}

/** 批流年：以命卦所属方位（伏位）对照当年飞星与太岁 */
export function yearlyReading(year: number, gua: Gua): YearlyReading {
  const lunar = Solar.fromYmd(year, 6, 1).getLunar();
  const ganZhi: string = lunar.getYearInGanZhiByLiChun();
  const center = lunar.getYearNineStar().getIndex() + 1;
  const stars = flyStars(center);
  const zhi = ganZhi[1];
  const taiSui = BRANCH_DIR[zhi];
  const suiPo = OPPOSITE[taiSui];
  const sanSha = SAN_SHA[zhi];
  const myDir = gua.sitting;
  const myStar = stars[myDir];

  const flags: YearlyReading["flags"] = [];
  const s = STAR_YEAR_ADVICE[myStar];
  flags.push({ label: `${STARS[myStar].name}${STARS[myStar].alias}`, tone: s.tone, text: s.text });
  if (myDir === taiSui)
    flags.push({ label: "坐太岁", tone: "bad", text: `今年太岁在${taiSui}，正落在您的本命卦位（${gua.name}）。凡事宜低调，尽量不要吵架，防口舌是非；可在${taiSui}方保持安静、不宜动土。` });
  if (myDir === suiPo)
    flags.push({ label: "冲岁破", tone: "bad", text: `今年岁破在${suiPo}，与您的本命卦位相冲。变动较多，重大决定三思，避免冲动换工作或投资。` });
  if (myDir === sanSha)
    flags.push({ label: "逢三煞", tone: "bad", text: `今年三煞在${sanSha}，与本命卦位同方。忌在此方动土装修，也不宜背坐此方。` });

  const bad = flags.filter((f) => f.tone === "bad").length;
  const verdict =
    bad >= 2 ? { label: "谨慎之年", tone: "bad" as const } : bad === 1 ? { label: s.tone === "good" ? "吉中带忧" : "宜守不宜攻", tone: "mid" as const } : { label: "顺遂之年", tone: "good" as const };

  return { year, ganZhi, center, stars, taiSui, suiPo, sanSha, myDir, myStar, flags, verdict };
}
