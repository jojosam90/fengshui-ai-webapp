# 玄机 · AI 风水命理

A mobile-first Chinese (简体中文) Feng Shui & metaphysics web app, inspired by [FengShui AI](https://fengshui-ai.com/).
All readings are **computed deterministically first** (via [`lunar-javascript`](https://github.com/6tail/lunar-javascript)), then explained by an AI master powered by Claude.

## Features

The home page is organised around seven sections (命理七大板块):

| Section | Route | What it does |
|---|---|---|
| 八字命盘 | `/bazi` | Four Pillars, 十神, 藏干, 纳音, 五行 distribution, 身强/弱, 喜用神, 大运, 命宫/胎元/空亡 |
| 紫微斗数 | `/ziwei` | Full Zi Wei chart via [`iztro`](https://github.com/SylarLong/iztro): 14 主星 with brightness, 辅星, 生年四化, 五行局, 命主/身主, current 大限 & 流年 |
| 奇门遁甲 | `/qimen` | 时家转盘奇门 (拆补法): 局数, 地盘/天盘, 九星, 八门, 八神, 旬空, 马星, 伏吟/反吟, key 格局, recommended directions |
| 玄空飞星 | `/fengshui` | 宅运盘 (运星/山星/向星 by 元运 + 24 山, 旺山旺向/上山下水…), annual & monthly stars, 八宅命卦 |
| 黄历宜忌 | `/almanac` | Month calendar; daily 宜忌, 冲煞, 值神, 建除, 二十八宿, 吉神方位, 时辰吉凶; 择吉日 search (30/60/90 days) |
| 大运流年 | `/luck` | 大运 → 流年 → 流月 drill-down, each scored against the natal chart |
| 十二宫 | `/palaces` | Zi Wei palace-by-palace reading with 三方四正, 吉星/煞星 and a strength tag |

More tools: 周易占卜 (`/iching`), AI 大师 chat (`/master`), profile (`/profile`).

**简 / 繁 toggle** (home header or 我的): the UI is written in Simplified Chinese and converted
on the fly to Traditional (Taiwan) with [`opencc-js`](https://github.com/nk2028/opencc-js), loaded only when needed.
The AI master replies in the selected script.

## Getting started

```bash
npm install
cp .env.example .env.local   # then set ANTHROPIC_API_KEY
npm run dev                  # http://localhost:3000
```

Everything except the AI master works without an API key.

## Project layout

```
src/lib/        calculation engines (pure TS, shared by client and server)
  bazi.ts       Four Pillars, strength, favorable elements, luck pillars
  almanac.ts    daily almanac + month grid
  fortune.ts    personal daily fortune
  iching.ts     hexagram data + coin casting
  fengshui.ts   flying stars, Kua number, Eight Mansions
  ziwei.ts      Zi Wei chart wrapper + palace/star texts
  qimen.ts      Qi Men Dun Jia engine
  luck.ts       大运 / 流年 / 流月
  wuxing.ts     five elements & branch relations
src/app/api/chat/route.ts   Claude streaming endpoint (claude-opus-5)
```

## Login

All pages and `/api/chat` require a session (`src/proxy.ts`; the chat route re-checks it).
The login page pre-fills the account for one-click sign-in; sessions are HMAC-signed httpOnly cookies valid for 7 days.
Configure in `.env.local`: `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET`, and `AUTH_PREFILL=false` to require typing the password.

## Notes

- 喜用神 uses a simplified 扶抑 method, and the UI labels it as such.
- The app shows readings as entertainment and cultural reference only.
- Before a public launch, add rate limiting / auth to `/api/chat`: it calls a paid API.
