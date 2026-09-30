import type { BirthInfo } from "./bazi";

export interface ProfileEntry {
  id: string;
  profile: BirthInfo;
}

/**
 * 内置档案（可在「我的」页面切换；修改后的资料按档案分别保存在本机）。
 * 时间均为出生地当地时间（马来西亚 UTC+8）。
 */
export const DEFAULT_PROFILES: ProfileEntry[] = [
  {
    // 缘主（A）：公历 1990-01-15 上午 11:33 · 农历己巳年十二月十九 · 马来西亚怡保 · 男
    id: "p1",
    profile: { name: "缘主（A）", gender: "male", year: 1990, month: 1, day: 15, hour: 11, minute: 33, place: "马来西亚怡保" },
  },
  {
    // 缘主（B）：公历 1995-02-04 凌晨 03:00 · 马来西亚芙蓉 · 女
    // 注：生肖按农历新年属猪（乙亥）；1995 年立春在 2 月 4 日 15:12，故八字年柱仍为甲戌
    id: "p2",
    profile: { name: "缘主（B）", gender: "female", year: 1995, month: 2, day: 4, hour: 3, minute: 0, place: "马来西亚芙蓉" },
  },
];

export const DEFAULT_PROFILE = DEFAULT_PROFILES[0].profile;
