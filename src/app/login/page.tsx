import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Bagua from "@/components/Bagua";
import LoginForm from "@/components/LoginForm";
import { SESSION_COOKIE, authConfig, verifySession } from "@/lib/auth";

export const metadata: Metadata = { title: "登录 · 玄机 AI 风水命理" };

const FEATURES = [
  { title: "八字 · 紫微 精准排盘", desc: "四柱十神、十四主星、十二宫，程序精确推算，结果可复核。" },
  { title: "奇门 · 飞星 趋吉避凶", desc: "此刻最佳方位、流年九宫吉凶、家居布局一目了然。" },
  { title: "AI 大师 随时解惑", desc: "已读取您的命盘与今日黄历，事业、财运、感情、择日皆可相询。" },
];

/** 只允许站内相对路径，防止开放重定向 */
const safeNext = (v: string | string[] | undefined) =>
  typeof v === "string" && v.startsWith("/") && !v.startsWith("//") ? v : "/";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const next = safeNext((await searchParams).next);
  if (verifySession((await cookies()).get(SESSION_COOKIE)?.value)) redirect(next);

  const cfg = authConfig();

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      {/* 品牌区 */}
      <section
        className="relative overflow-hidden px-6 py-5 text-[#f6efe2] lg:flex lg:w-[52%] lg:flex-col lg:px-14 lg:py-12"
        style={{
          background:
            "radial-gradient(120% 80% at 0% 0%, rgba(220,171,82,0.22) 0%, transparent 55%), radial-gradient(90% 70% at 100% 100%, rgba(179,38,30,0.35) 0%, transparent 60%), linear-gradient(145deg, #2a1d15 0%, #3d271c 50%, #5a3322 100%)",
        }}
      >
        {/* 八卦背景 */}
        <Bagua className="spin-slow pointer-events-none absolute -bottom-40 -right-40 h-[34rem] w-[34rem] text-[#dcab52] opacity-[0.13] max-lg:-right-16 max-lg:-top-16 max-lg:h-48 max-lg:w-48" />
        <div className="relative flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- 静态 SVG 标志 */}
          <img src="/icon.svg" alt="" className="h-11 w-11 shrink-0 rounded-xl ring-1 ring-[#dcab52]/40" />
          <div>
            <p className="font-serif text-xl font-bold leading-tight">玄机</p>
            <p className="text-xs tracking-[0.25em] text-[#dcab52]">AI 风水命理</p>
          </div>
        </div>

        <div className="relative my-auto hidden max-w-xl py-10 lg:block">
          <h1 className="font-serif text-5xl font-bold leading-tight">
            传统命理，
            <br />
            <span className="text-[#f0cf8a]">一键洞察每一天。</span>
          </h1>
          <p className="mt-5 text-lg text-[#f6efe2]/80">八字、紫微、奇门、飞星、黄历与 AI 大师 —— 千年智慧，以现代方式为您解读。</p>
          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#dcab52]/15 text-[#f0cf8a] ring-1 ring-[#dcab52]/45">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                    <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-lg font-semibold">{f.title}</span>
                  <span className="block text-sm text-[#f6efe2]/70">{f.desc}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative hidden text-xs text-[#f6efe2]/55 lg:block">
          历法数据：寿星天文历 · iztro 紫微斗数 · 内容仅供娱乐与传统文化参考
        </p>
      </section>

      {/* 登录表单 */}
      <section className="flex flex-1 items-center justify-center bg-card px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <h2 className="font-serif text-3xl font-bold lg:text-4xl">欢迎回来</h2>
          <p className="mt-2 text-muted">登录查看您的每日运势、命盘与 AI 命理大师。</p>
          <LoginForm
            next={next}
            defaultUsername={cfg.prefill ? cfg.username : ""}
            defaultPassword={cfg.prefill ? cfg.password : ""}
          />
          <p className="mt-6 text-center text-xs text-muted">登录状态将在本设备保持 7 天</p>
        </div>
      </section>
    </div>
  );
}
