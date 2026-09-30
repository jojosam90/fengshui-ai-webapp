export interface NavItem {
  href: string;
  label: string;
  glyph: string;
}

export const NAV_GROUPS: { title?: string; items: NavItem[] }[] = [
  { items: [{ href: "/", label: "仪表盘", glyph: "盘" }] },
  {
    title: "命理七大板块",
    items: [
      { href: "/bazi", label: "八字命盘", glyph: "命" },
      { href: "/ziwei", label: "紫微斗数", glyph: "紫" },
      { href: "/qimen", label: "奇门遁甲", glyph: "奇" },
      { href: "/fengshui", label: "玄空飞星", glyph: "星" },
      { href: "/almanac", label: "黄历宜忌", glyph: "历" },
      { href: "/luck", label: "大运流年", glyph: "运" },
      { href: "/palaces", label: "十二宫", glyph: "宫" },
    ],
  },
  {
    title: "更多工具",
    items: [
      { href: "/iching", label: "周易占卜", glyph: "卦" },
      { href: "/master", label: "AI 大师", glyph: "师" },
    ],
  },
  { title: "个人", items: [{ href: "/profile", label: "我的档案", glyph: "我" }] },
];

export const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");
