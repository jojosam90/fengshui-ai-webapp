import { Solar } from "lunar-javascript";
import type { BaziResult } from "./bazi";
import { type PeriodEval, evaluatePeriod } from "./fortune";

const GAN = "甲乙丙丁戊己庚辛壬癸";
const ZHI = "子丑寅卯辰巳午未申酉戌亥";
export const yearGanZhi = (y: number) => GAN[(y - 4) % 10] + ZHI[(y - 4) % 12];

/** 流年以立春为界：立春前仍属上一年（如 1 月仍行上年干支） */
export function liuNianYear(date: Date): number {
  const y = date.getFullYear();
  const gz: string = Solar.fromYmd(y, date.getMonth() + 1, date.getDate()).getLunar().getYearInGanZhiByLiChun();
  return gz === yearGanZhi(y) ? y : y - 1;
}

export interface LiuNian extends PeriodEval {
  year: number;
  age: number;
  ganZhi: string;
}

export interface LiuYue extends PeriodEval {
  index: number;
  name: string;
  ganZhi: string;
  jie: string;
  start: string;
}

const MONTH_NAMES = ["寅月(正)", "卯月(二)", "辰月(三)", "巳月(四)", "午月(五)", "未月(六)", "申月(七)", "酉月(八)", "戌月(九)", "亥月(十)", "子月(冬)", "丑月(腊)"];

export function liuNianOf(bazi: BaziResult, startYear: number, endYear: number): LiuNian[] {
  const out: LiuNian[] = [];
  for (let y = startYear; y <= endYear; y++) {
    const gz = yearGanZhi(y);
    // 虚岁按农历年计（出生农历年为 1 岁）
    out.push({ year: y, age: y - bazi.birthLunarYear + 1, ganZhi: gz, ...evaluatePeriod(bazi, gz[0], gz[1], "流年") });
  }
  return out;
}

/** 某年（立春起）的十二流月，按节气交接 */
export function liuYueOf(bazi: BaziResult, year: number): LiuYue[] {
  return MONTH_NAMES.map((name, i) => {
    // 每月中旬必在该节令之内
    const m = i + 2;
    const solar = m <= 12 ? Solar.fromYmd(year, m, 20) : Solar.fromYmd(year + 1, m - 12, 20);
    const lunar = solar.getLunar();
    const gz: string = lunar.getMonthInGanZhiExact();
    const jie = lunar.getPrevJie();
    return {
      index: i,
      name,
      ganZhi: gz,
      jie: jie.getName(),
      start: jie.getSolar().toYmd().slice(5).replace("-", "/"),
      ...evaluatePeriod(bazi, gz[0], gz[1], "流月"),
    };
  });
}

export function daYunEval(bazi: BaziResult) {
  return bazi.daYun.map((d) => ({ ...d, ...evaluatePeriod(bazi, d.ganZhi[0], d.ganZhi[1], "大运") }));
}
