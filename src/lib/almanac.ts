import { Solar } from "lunar-javascript";

export interface HourLuck {
  zhi: string;
  ganZhi: string;
  range: string;
  luck: "吉" | "凶";
  /** 时辰值神（十二天神）及黄道/黑道 */
  tianShen: string;
  huangDao: boolean;
  yi: string[];
  ji: string[];
  /** 冲的生肖，如「(壬午)马」 */
  chong: string;
  chongAnimal: string;
  sha: string;
  xiShen: string;
  caiShen: string;
}

/** 十二值神白话：为什么吉 / 凶，以及适合做什么 */
export const TIAN_SHEN_INFO: Record<string, { why: string; tip: string }> = {
  青龙: { why: "青龙为黄道吉神，主喜庆与顺利，贵人易现。", tip: "适合谈生意、签约、见客户、开始新计划。" },
  明堂: { why: "明堂为黄道吉神，主贵人扶持、光明正大。", tip: "适合拜访长辈上司、面试、提出请求。" },
  金匮: { why: "金匮为黄道吉神，主财库与收藏，利求财。", tip: "适合收款、理财、谈钱、办喜事。" },
  天德: { why: "天德为黄道吉神，能化解凶煞，诸事平安。", tip: "适合处理重要事务、调解矛盾、祈福。" },
  玉堂: { why: "玉堂为黄道吉神，主文书、名誉与贵人。", tip: "适合写作、提交文件、考试、搬迁入宅。" },
  司命: { why: "司命为黄道吉神，白天办事顺利。", tip: "适合处理日常事务、求财、家中事务。" },
  天刑: { why: "天刑为黑道凶神，主刑伤、官非与冲突。", tip: "这段时间诸事不宜，避免争执、签约与冒险。" },
  朱雀: { why: "朱雀为黑道凶神，主口舌是非与文书纠纷。", tip: "说话多留余地，避免吵架、诉讼与签重要文件。" },
  白虎: { why: "白虎为黑道凶神，主意外、伤病与冲突。", tip: "注意交通与人身安全，避免剧烈运动和冒险。" },
  天牢: { why: "天牢为黑道凶神，主受困、拖延与束缚。", tip: "不宜开始新事情或出远门，宜静心处理手头工作。" },
  玄武: { why: "玄武为黑道凶神，主盗失、欺骗与暗中损失。", tip: "看好财物，谨防受骗，不宜借贷与投资决定。" },
  勾陈: { why: "勾陈为黑道凶神，主纠缠、拖延与反复。", tip: "事情容易拖拉，不宜催促结果，耐心等待为上。" },
};

export interface DayAlmanac {
  date: Date;
  solarText: string;
  weekText: string;
  lunarMonthDay: string;
  lunarYearText: string;
  ganZhiYear: string;
  ganZhiMonth: string;
  ganZhiDay: string;
  shengXiao: string;
  yi: string[];
  ji: string[];
  chong: string;
  sha: string;
  xiShen: string;
  caiShen: string;
  fuShen: string;
  yangGui: string;
  zhiXing: string;
  xiu: string;
  xiuLuck: string;
  tianShen: string;
  tianShenLuck: string;
  pengZu: string[];
  jiShen: string[];
  xiongSha: string[];
  naYin: string;
  jieQi: string;
  nextJieQi: { name: string; date: string };
  festivals: string[];
  hours: HourLuck[];
}

const HOUR_RANGES: Record<string, string> = {
  子: "23:00-01:00", 丑: "01:00-03:00", 寅: "03:00-05:00", 卯: "05:00-07:00",
  辰: "07:00-09:00", 巳: "09:00-11:00", 午: "11:00-13:00", 未: "13:00-15:00",
  申: "15:00-17:00", 酉: "17:00-19:00", 戌: "19:00-21:00", 亥: "21:00-23:00",
};

export function getDayAlmanac(date: Date): DayAlmanac {
  const solar = Solar.fromYmd(date.getFullYear(), date.getMonth() + 1, date.getDate());
  const lunar = solar.getLunar();
  const next = lunar.getNextJieQi();

  // getTimes() 含早子时与晚子时，去掉末尾重复的晚子时
  const hours: HourLuck[] = lunar
    .getTimes()
    .slice(0, 12)
    // lunar-javascript 的 LunarTime（无类型定义）
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((t: any): HourLuck => ({
      zhi: t.getZhi(),
      ganZhi: t.getGanZhi(),
      range: HOUR_RANGES[t.getZhi()],
      luck: t.getTianShenLuck(),
      tianShen: t.getTianShen(),
      huangDao: t.getTianShenType() === "黄道",
      yi: (t.getYi() as string[]).filter((x) => x !== "无"),
      ji: (t.getJi() as string[]).filter((x) => x !== "无"),
      chong: t.getChongDesc(),
      chongAnimal: t.getChongShengXiao(),
      sha: t.getSha(),
      xiShen: t.getPositionXiDesc(),
      caiShen: t.getPositionCaiDesc(),
    }));

  return {
    date,
    solarText: `${solar.getYear()}年${solar.getMonth()}月${solar.getDay()}日`,
    weekText: `星期${solar.getWeekInChinese()}`,
    lunarMonthDay: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    lunarYearText: `${lunar.getYearInGanZhi()}${lunar.getYearShengXiao()}年`,
    ganZhiYear: lunar.getYearInGanZhiByLiChun(),
    ganZhiMonth: lunar.getMonthInGanZhiExact(),
    ganZhiDay: lunar.getDayInGanZhi(),
    shengXiao: lunar.getYearShengXiao(),
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    chong: `冲${lunar.getDayChongDesc()}`,
    sha: `煞${lunar.getDaySha()}`,
    xiShen: lunar.getDayPositionXiDesc(),
    caiShen: lunar.getDayPositionCaiDesc(),
    fuShen: lunar.getDayPositionFuDesc(),
    yangGui: lunar.getDayPositionYangGuiDesc(),
    zhiXing: lunar.getZhiXing(),
    xiu: `${lunar.getXiu()}${lunar.getZheng()}${lunar.getAnimal()}`,
    xiuLuck: lunar.getXiuLuck(),
    tianShen: lunar.getDayTianShen(),
    tianShenLuck: lunar.getDayTianShenLuck(),
    pengZu: [lunar.getPengZuGan(), lunar.getPengZuZhi()],
    jiShen: lunar.getDayJiShen(),
    xiongSha: lunar.getDayXiongSha(),
    naYin: lunar.getDayNaYin(),
    jieQi: lunar.getJieQi() || lunar.getPrevJieQi().getName(),
    nextJieQi: { name: next.getName(), date: next.getSolar().toYmd() },
    festivals: [...lunar.getFestivals(), ...solar.getFestivals()],
    hours,
  };
}

export interface CalendarCell {
  date: Date;
  day: number;
  lunarLabel: string;
  inMonth: boolean;
  isFestival: boolean;
}

/** 月历网格（周日开头，6 行） */
export function getMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const start = new Date(first);
  start.setDate(1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const lunar = solar.getLunar();
    const festival = lunar.getFestivals()[0] || solar.getFestivals()[0];
    const jieQi = lunar.getJieQi();
    const label =
      festival ?? (jieQi || (lunar.getDay() === 1 ? `${lunar.getMonthInChinese()}月` : lunar.getDayInChinese()));
    return {
      date: d,
      day: d.getDate(),
      lunarLabel: label,
      inMonth: d.getMonth() === month - 1,
      isFestival: Boolean(festival || jieQi),
    };
  });
}

// ---------------- 择日 ----------------

export const ACTIVITIES: { key: string; label: string; terms: string[] }[] = [
  { key: "marry", label: "嫁娶结婚", terms: ["嫁娶"] },
  { key: "move", label: "搬家入宅", terms: ["入宅", "移徙"] },
  { key: "open", label: "开业开市", terms: ["开市"] },
  { key: "sign", label: "签约交易", terms: ["立券", "交易"] },
  { key: "travel", label: "出行旅游", terms: ["出行"] },
  { key: "build", label: "装修动土", terms: ["动土", "修造"] },
  { key: "bed", label: "安床", terms: ["安床"] },
  { key: "pray", label: "祭祀祈福", terms: ["祭祀", "祈福"] },
  { key: "doctor", label: "求医治病", terms: ["求医", "治病"] },
  { key: "engage", label: "订婚纳采", terms: ["纳采", "订盟"] },
];

const GOOD_ZHIXING = new Set(["除", "危", "定", "执", "成", "开"]);

export interface GoodDay {
  date: Date;
  solarText: string;
  weekText: string;
  lunarText: string;
  ganZhiDay: string;
  tianShen: string;
  huangDao: boolean;
  zhiXing: string;
  chong: string;
  stars: number;
  matched: string[];
}

/** 在 days 天内寻找宜做某事的日子；avoidAnimal 为用户生肖（排除冲本命之日） */
export function findGoodDays(activityKey: string, from: Date, days: number, avoidAnimal?: string): GoodDay[] {
  const act = ACTIVITIES.find((a) => a.key === activityKey)!;
  const out: GoodDay[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
    const solar = Solar.fromYmd(d.getFullYear(), d.getMonth() + 1, d.getDate());
    const lunar = solar.getLunar();
    const yi: string[] = lunar.getDayYi();
    const ji: string[] = lunar.getDayJi();
    const matched = act.terms.filter((t) => yi.includes(t));
    if (!matched.length || act.terms.some((t) => ji.includes(t))) continue;
    const chong: string = lunar.getDayChongShengXiao();
    if (avoidAnimal && chong === avoidAnimal) continue;

    const huangDao = lunar.getDayTianShenType() === "黄道";
    const zhiXing: string = lunar.getZhiXing();
    const stars = 1 + (huangDao ? 2 : 0) + (GOOD_ZHIXING.has(zhiXing) ? 1 : 0) + (matched.length > 1 ? 1 : 0);
    out.push({
      date: d,
      solarText: `${d.getMonth() + 1}月${d.getDate()}日`,
      weekText: `周${solar.getWeekInChinese()}`,
      lunarText: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      ganZhiDay: lunar.getDayInGanZhi(),
      tianShen: lunar.getDayTianShen(),
      huangDao,
      zhiXing,
      chong: `冲${lunar.getDayChongDesc()}`,
      stars: Math.min(5, stars),
      matched,
    });
  }
  return out;
}
