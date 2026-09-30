import Anthropic from "@anthropic-ai/sdk";
import { cookies } from "next/headers";
import { getDayAlmanac } from "@/lib/almanac";
import { type BirthInfo, baziSummary, computeBazi } from "@/lib/bazi";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { annualAndMonthlyStars, kuaNumber, STARS } from "@/lib/fengshui";
import { computeQimen, qimenSummary } from "@/lib/qimen";
import { computeZiwei, ziweiSummary } from "@/lib/ziwei";

export const maxDuration = 120;

// 模型服务：默认直连 Anthropic；设置 ANTHROPIC_BASE_URL 可接入兼容 Anthropic 接口的服务（如小米 MiMo）
const client = new Anthropic();
const BASE_URL = process.env.ANTHROPIC_BASE_URL;
const IS_ANTHROPIC = !BASE_URL || BASE_URL.includes("api.anthropic.com");
const MODEL = process.env.AI_MODEL || (IS_ANTHROPIC ? "claude-opus-5" : "mimo-v2.6-pro");

const MAX_TURNS = 24;
const MAX_CHARS = 4000;

const SYSTEM_PROMPT = `你是「玄机」App 中的 AI 命理大师，精通子平八字、紫微斗数、周易六爻、玄空飞星、八宅风水、择日与中国传统民俗文化。

回答原则：
- 使用用户所选的中文字体作答（见资料中的「回答语言」），语气温和、睿智、有亲和力，像一位可信赖的老师傅。
- 命盘、黄历、飞星等数据已由程序精确计算并提供在下方「资料」中。请以这些数据为准进行解读，不要自行重新排盘或编造不同的干支。
- 若用户尚未提供出生信息而问题需要命盘，请温和地提醒对方到「我的」页面填写档案。
- 解读要具体、有依据（点明所依据的十神、五行、卦象或星曜），并给出可执行的建议（如颜色、方位、时间、行动）。
- 保持积极正向：指出风险时同时给出化解方法，避免宿命论与制造焦虑。
- 涉及健康、法律、投资、重大医疗决定时，提醒用户咨询相关专业人士；不要预测死亡、重大疾病或具体灾难日期。
- 排版适合手机阅读：短段落，可用少量「**加粗**」和以「- 」开头的列表，不要使用表格或 # 标题。一般回答控制在 300–600 字，除非用户要求详细。
- 命理内容仅供娱乐与文化参考。`;

type IncomingMessage = { role: "user" | "assistant"; content: string };

function parseMessages(value: unknown): Anthropic.Beta.BetaMessageParam[] | null {
  if (!Array.isArray(value) || value.length === 0) return null;
  const msgs = value
    .filter(
      (m): m is IncomingMessage =>
        !!m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.trim() !== "",
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
  // 对话必须以 user 开头、以 user 结尾
  while (msgs.length && msgs[0].role !== "user") msgs.shift();
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") return null;
  return msgs;
}

function parseProfile(value: unknown): BirthInfo | null {
  if (!value || typeof value !== "object") return null;
  const p = value as Record<string, unknown>;
  const nums = ["year", "month", "day", "hour", "minute"].map((k) => p[k]);
  if (!nums.every((n) => typeof n === "number" && Number.isInteger(n))) return null;
  const [year, month, day, hour, minute] = nums as number[];
  if (year < 1901 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31 || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  if (p.gender !== "male" && p.gender !== "female") return null;
  return {
    name: typeof p.name === "string" ? p.name.slice(0, 20) : undefined,
    gender: p.gender,
    year, month, day, hour, minute,
    hourUnknown: p.hourUnknown === true,
    place: typeof p.place === "string" ? p.place.slice(0, 30) : undefined,
  };
}

function parseDate(value: unknown): Date {
  if (typeof value === "string" && /^\d{4}-\d{1,2}-\d{1,2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    if (!Number.isNaN(date.getTime())) return date;
  }
  return new Date();
}

function parseQimenTime(value: unknown): Date | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function buildContext(profile: BirthInfo | null, today: Date, qimenTime: Date | null): string {
  const a = getDayAlmanac(today);
  const fs = annualAndMonthlyStars(today);
  const starLine = (grid: Record<string, number>) =>
    Object.entries(grid).map(([dir, n]) => `${dir}${STARS[n].name}`).join(" ");

  const parts = [
    `【今日】公历${a.solarText} ${a.weekText}；农历${a.lunarMonthDay}；${a.ganZhiYear}年 ${a.ganZhiMonth}月 ${a.ganZhiDay}日`,
    `宜：${a.yi.join("、")}；忌：${a.ji.join("、")}；${a.chong} ${a.sha}；财神${a.caiShen} 喜神${a.xiShen}；值神${a.tianShen}(${a.tianShenLuck})；${a.zhiXing}日`,
    `【流年飞星 ${fs.yearGanZhi}年】${starLine(fs.year)}`,
    `【流月飞星 ${fs.monthGanZhi}月】${starLine(fs.month)}`,
  ];

  if (profile) {
    const bazi = computeBazi(profile);
    const gua = kuaNumber(profile.year, profile.month, profile.day, profile.gender, profile.hour, profile.minute);
    parts.push(
      `【用户八字命盘】\n${baziSummary(bazi)}`,
      `命卦：${gua.name}卦（${gua.number}），${gua.group}`,
      `【用户紫微斗数命盘】\n${ziweiSummary(computeZiwei(profile, today))}`,
    );
  } else {
    parts.push("【用户命盘】用户尚未填写出生信息。");
  }
  if (qimenTime) parts.push(`【用户所起奇门局】\n${qimenSummary(computeQimen(qimenTime))}`);
  return parts.join("\n");
}

export async function POST(req: Request) {
  // 代理层已拦截未登录请求；此处再次校验，确保付费接口不被绕过
  if (!verifySession((await cookies()).get(SESSION_COOKIE)?.value)) {
    return Response.json({ error: "请先登录" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json(
      { error: "AI 大师尚未开通：服务器未配置 ANTHROPIC_API_KEY。" },
      { status: 503 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }

  const messages = parseMessages(body.messages);
  if (!messages) return Response.json({ error: "消息格式错误" }, { status: 400 });

  const traditional = body.script === "tw";
  const context =
    `回答语言：${traditional ? "繁体中文（台湾用字）" : "简体中文"}\n` +
    buildContext(parseProfile(body.profile), parseDate(body.today), parseQimenTime(body.qimenTime));

  const system: Anthropic.TextBlockParam[] = [
    { type: "text", text: SYSTEM_PROMPT },
    { type: "text", text: `以下是程序计算的资料（可信）：
${context}` },
  ];

  // Anthropic 专有参数（拒答自动回退、effort）只在直连 Anthropic 时发送；兼容服务使用标准 Messages 参数
  const stream = IS_ANTHROPIC
    ? client.beta.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        thinking: { type: "adaptive" },
        output_config: { effort: "medium" },
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        system,
        messages,
      })
    : client.messages.stream({
        model: MODEL,
        max_tokens: 16000,
        system,
        messages: messages as Anthropic.MessageParam[],
      });
  const events = stream as unknown as AsyncIterable<Anthropic.MessageStreamEvent>;

  const encoder = new TextEncoder();
  const body$ = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of events) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          controller.enqueue(encoder.encode("\n\n（抱歉，这个问题大师暂时无法回答，请换个问法试试。）"));
        } else if (final.stop_reason === "max_tokens") {
          controller.enqueue(encoder.encode("\n\n（回答较长已截断，可以让大师「继续」。）"));
        }
      } catch (err) {
        console.error("[chat] stream error", err);
        const msg =
          err instanceof Anthropic.AuthenticationError
            ? "服务未配置 API 密钥，请联系管理员设置 ANTHROPIC_API_KEY。"
            : err instanceof Anthropic.RateLimitError
              ? "当前咨询人数较多，请稍后再试。"
              : "大师暂时无法连线，请稍后再试。";
        controller.enqueue(encoder.encode(`\n\n⚠️ ${msg}`));
      } finally {
        controller.close();
      }
    },
    cancel() {
      stream.abort();
    },
  });

  return new Response(body$, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
