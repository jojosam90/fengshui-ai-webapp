import { Solar } from "lunar-javascript";

/** 时家转盘奇门（拆补法） */

export const PALACE_DIR: Record<number, string> = {
  1: "北", 2: "西南", 3: "东", 4: "东南", 5: "中", 6: "西北", 7: "西", 8: "东北", 9: "南",
};
export const PALACE_GUA: Record<number, string> = {
  1: "坎", 2: "坤", 3: "震", 4: "巽", 5: "中", 6: "乾", 7: "兑", 8: "艮", 9: "离",
};

/** 外八宫顺时针次序（坎→艮→震→巽→离→坤→兑→乾） */
const RING = [1, 8, 3, 4, 9, 2, 7, 6];
const ringIdx = (p: number) => RING.indexOf(p);

const STAR_HOME: Record<number, string> = {
  1: "天蓬", 8: "天任", 3: "天冲", 4: "天辅", 9: "天英", 2: "天芮", 7: "天柱", 6: "天心", 5: "天禽",
};
const DOOR_HOME: Record<number, string> = {
  1: "休门", 8: "生门", 3: "伤门", 4: "杜门", 9: "景门", 2: "死门", 7: "惊门", 6: "开门",
};
const GODS = ["值符", "螣蛇", "太阴", "六合", "白虎", "玄武", "九地", "九天"];
const QI_YI = ["戊", "己", "庚", "辛", "壬", "癸", "丁", "丙", "乙"];
const XUN_YI: Record<string, string> = { 甲子: "戊", 甲戌: "己", 甲申: "庚", 甲午: "辛", 甲辰: "壬", 甲寅: "癸" };

// 节气 → [上元, 中元, 下元] 局数
const YANG_JU: Record<string, number[]> = {
  冬至: [1, 7, 4], 小寒: [2, 8, 5], 大寒: [3, 9, 6], 立春: [8, 5, 2], 雨水: [9, 6, 3], 惊蛰: [1, 7, 4],
  春分: [3, 9, 6], 清明: [4, 1, 7], 谷雨: [5, 2, 8], 立夏: [4, 1, 7], 小满: [5, 2, 8], 芒种: [6, 3, 9],
};
const YIN_JU: Record<string, number[]> = {
  夏至: [9, 3, 6], 小暑: [8, 2, 5], 大暑: [7, 1, 4], 立秋: [2, 5, 8], 处暑: [1, 4, 7], 白露: [9, 3, 6],
  秋分: [7, 1, 4], 寒露: [6, 9, 3], 霜降: [5, 8, 2], 立冬: [6, 9, 3], 小雪: [5, 8, 2], 大雪: [4, 7, 1],
};

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";
const ganZhiIndex = (gz: string) => {
  const g = GAN.indexOf(gz[0]);
  const z = ZHI.indexOf(gz[1]);
  for (let i = g; i < 60; i += 10) if (i % 12 === z) return i;
  return -1;
};
const ganZhiAt = (i: number) => GAN[i % 10] + ZHI[i % 12];

const BRANCH_PALACE: Record<string, number> = {
  子: 1, 丑: 8, 寅: 8, 卯: 3, 辰: 4, 巳: 4, 午: 9, 未: 2, 申: 2, 酉: 7, 戌: 6, 亥: 6,
};
const HORSE: Record<string, string> = {
  申: "寅", 子: "寅", 辰: "寅", 寅: "申", 午: "申", 戌: "申", 巳: "亥", 酉: "亥", 丑: "亥", 亥: "巳", 卯: "巳", 未: "巳",
};

export const DOOR_LUCK: Record<string, { score: number; luck: string; desc: string }> = {
  开门: { score: 3, luck: "吉", desc: "开创、求职、开业、求财" },
  休门: { score: 3, luck: "吉", desc: "休养、求见贵人、婚嫁、调解" },
  生门: { score: 3, luck: "吉", desc: "求财、置业、经营、生产" },
  景门: { score: 1, luck: "中", desc: "考试、宣传、文书、献策" },
  杜门: { score: 0, luck: "中", desc: "躲避、保密、技术研究" },
  伤门: { score: -2, luck: "凶", desc: "索债、竞技、捕猎，余事不宜" },
  惊门: { score: -2, luck: "凶", desc: "诉讼、口舌、惊恐之事" },
  死门: { score: -3, luck: "凶", desc: "吊丧、刑戮，诸事不宜" },
};
export const STAR_LUCK: Record<string, number> = {
  天辅: 1.5, 天心: 1.5, 天任: 1.5, 天禽: 1.5, 天冲: 1, 天英: 0, 天蓬: -1.5, 天芮: -1.5, 天柱: -1,
};
export const GOD_LUCK: Record<string, number> = {
  值符: 1, 太阴: 1, 六合: 1, 九地: 0.5, 九天: 0.5, 螣蛇: -1, 白虎: -1, 玄武: -1,
};

export interface QimenPalace {
  num: number;
  dir: string;
  gua: string;
  earth: string;
  heaven: string;
  /** 寄坤二宫的天禽所携带的中五宫天盘干 */
  heaven2?: string;
  star: string;
  star2?: string;
  door?: string;
  god?: string;
  kong: boolean;
  horse: boolean;
  score: number;
  patterns: string[];
}

export interface QimenResult {
  dateText: string;
  pillars: string[];
  jieQi: string;
  yuan: "上元" | "中元" | "下元";
  yang: boolean;
  ju: number;
  xunShou: string;
  zhiFu: string;
  zhiShi: string;
  kongWang: string;
  palaces: QimenPalace[];
  special: string[];
  best: QimenPalace[];
}

export function computeQimen(date: Date): QimenResult {
  const solar = Solar.fromYmdHms(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes(), 0);
  const lunar = solar.getLunar();

  // ---- 定局 ----
  const jq: string = lunar.getPrevJieQi(false).getName();
  const yang = jq in YANG_JU;
  const dayGZ: string = lunar.getDayInGanZhiExact();
  const dayIdx = ganZhiIndex(dayGZ);
  const fuTouZhi = ganZhiAt(dayIdx - (dayIdx % 5))[1];
  const yuanIdx = "子午卯酉".includes(fuTouZhi) ? 0 : "寅申巳亥".includes(fuTouZhi) ? 1 : 2;
  const ju = (yang ? YANG_JU : YIN_JU)[jq][yuanIdx];

  // ---- 地盘 ----
  const earth: Record<number, string> = {};
  QI_YI.forEach((g, i) => {
    const p = yang ? ((ju - 1 + i) % 9) + 1 : ((ju - 1 - i + 90) % 9) + 1;
    earth[p] = g;
  });
  const palaceOfEarth = (g: string) => Number(Object.keys(earth).find((k) => earth[+k] === g));

  // ---- 旬首 · 值符 · 值使 ----
  const hourGZ: string = lunar.getTimeInGanZhi();
  const hourIdx = ganZhiIndex(hourGZ);
  const xunIdx = hourIdx - (hourIdx % 10);
  const xunShou = ganZhiAt(xunIdx);
  const xunYi = XUN_YI[xunShou];
  const fuPalace = palaceOfEarth(xunYi);
  const zhiFu = STAR_HOME[fuPalace];
  const zhiShi = DOOR_HOME[fuPalace === 5 ? 2 : fuPalace];
  const fuOrigin = fuPalace === 5 ? 2 : fuPalace;

  // 天盘：值符随时干（甲时用旬首仪）
  const hourStem = hourGZ[0] === "甲" ? xunYi : hourGZ[0];
  let fuTarget = palaceOfEarth(hourStem);
  if (fuTarget === 5) fuTarget = 2;
  const starShift = ringIdx(fuTarget) - ringIdx(fuOrigin);

  // 值使：自值符原宫按洛书数序行 (时辰距旬首) 步
  const steps = hourIdx - xunIdx;
  let shiTarget = yang ? ((fuPalace - 1 + steps) % 9) + 1 : ((fuPalace - 1 - steps + 90) % 9) + 1;
  if (shiTarget === 5) shiTarget = 2;
  const doorShift = ringIdx(shiTarget) - ringIdx(fuOrigin);

  const kongWang: string = lunar.getTimeXunKong();
  const kongPalaces = new Set([...kongWang].map((z) => BRANCH_PALACE[z]));
  const horsePalace = BRANCH_PALACE[HORSE[hourGZ[1]]];

  const palaces: QimenPalace[] = [];
  for (const p of RING) {
    const i = ringIdx(p);
    const from = RING[(i - starShift + 16) % 8];
    const door = DOOR_HOME[RING[(i - doorShift + 16) % 8]];
    const godOffset = yang ? (i - ringIdx(fuTarget) + 16) % 8 : (ringIdx(fuTarget) - i + 16) % 8;
    palaces.push({
      num: p,
      dir: PALACE_DIR[p],
      gua: PALACE_GUA[p],
      earth: earth[p],
      heaven: earth[from],
      heaven2: from === 2 ? earth[5] : undefined,
      star: STAR_HOME[from],
      star2: from === 2 ? "天禽" : undefined,
      door,
      god: GODS[godOffset],
      kong: kongPalaces.has(p),
      horse: p === horsePalace,
      score: 0,
      patterns: [],
    });
  }
  palaces.push({
    num: 5, dir: "中", gua: "中", earth: earth[5], heaven: earth[5], star: "天禽", kong: false, horse: false, score: 0, patterns: [],
  });

  // ---- 格局与评分 ----
  for (const p of palaces) {
    if (p.num === 5) continue;
    if (p.heaven === "戊" && p.earth === "丙") p.patterns.push("青龙返首（大吉）");
    if (p.heaven === "丙" && p.earth === "戊") p.patterns.push("飞鸟跌穴（大吉）");
    if ("乙丙丁".includes(p.heaven) && ["开门", "休门", "生门"].includes(p.door!)) p.patterns.push(`三奇得使（${p.heaven}奇临${p.door}）`);
    if (p.heaven === "庚") p.patterns.push("庚金临宫，主阻隔");
    p.score =
      DOOR_LUCK[p.door!].score +
      STAR_LUCK[p.star] +
      GOD_LUCK[p.god!] +
      ("乙丙丁".includes(p.heaven) ? 1.5 : 0) +
      (p.heaven === "庚" ? -1 : 0) +
      (p.kong ? -2 : 0) +
      (p.patterns.some((t) => t.includes("大吉")) ? 2 : 0);
  }

  const special: string[] = [];
  if (starShift === 0) special.push("伏吟局：宜守旧待时，不宜妄动");
  if (Math.abs(starShift) === 4) special.push("反吟局：事多反复，宜速战速决");

  const best = palaces
    .filter((p) => p.num !== 5 && !p.kong && DOOR_LUCK[p.door!].score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return {
    dateText: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日 ${String(solar.getHour()).padStart(2, "0")}:${String(solar.getMinute()).padStart(2, "0")}`,
    pillars: [lunar.getYearInGanZhiByLiChun(), lunar.getMonthInGanZhiExact(), dayGZ, hourGZ],
    jieQi: jq,
    yuan: (["上元", "中元", "下元"] as const)[yuanIdx],
    yang,
    ju,
    xunShou: `${xunShou}${xunYi}`,
    zhiFu,
    zhiShi,
    kongWang,
    palaces,
    special,
    best,
  };
}

export function qimenSummary(q: QimenResult): string {
  const cells = q.palaces
    .filter((p) => p.num !== 5)
    .map((p) => `${p.gua}${p.num}宫(${p.dir})：天盘${p.heaven}${p.heaven2 ?? ""} 地盘${p.earth} ${p.star}${p.star2 ? "/" + p.star2 : ""} ${p.door} ${p.god}${p.kong ? " 空亡" : ""}${p.horse ? " 马星" : ""}${p.patterns.length ? " 格局:" + p.patterns.join("、") : ""}`);
  return [
    `奇门遁甲（时家转盘·拆补法）：${q.dateText}，四柱${q.pillars.join(" ")}`,
    `${q.jieQi}${q.yuan}，${q.yang ? "阳" : "阴"}遁${q.ju}局，旬首${q.xunShou}，值符${q.zhiFu}，值使${q.zhiShi}，旬空${q.kongWang}`,
    ...cells,
    q.special.join("；"),
  ].filter(Boolean).join("\n");
}

/** 九宫显示顺序：上南下北 */
export const QIMEN_GRID = [4, 9, 2, 3, 5, 7, 8, 1, 6];
