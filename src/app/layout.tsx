import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Noto_Serif_SC } from "next/font/google";
import ScriptConverter, { SCRIPT_BOOTSTRAP } from "@/components/ScriptConverter";
import AppShell from "@/components/AppShell";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import "./globals.css";

const notoSerif = Noto_Serif_SC({
  variable: "--font-noto-serif",
  weight: ["500", "700"],
  preload: false,
  display: "swap",
});

export const metadata: Metadata = {
  title: "玄机 · AI 风水命理",
  description: "八字排盘、紫微斗数、奇门遁甲、玄空飞星、每日黄历、周易占卜与 AI 命理大师 —— 传统智慧，现代解读。",
  applicationName: "玄机",
  appleWebApp: { capable: true, title: "玄机", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6efe2" },
    { media: "(prefers-color-scheme: dark)", color: "#13100c" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return (
    <html lang="zh-CN" className={`${notoSerif.variable} antialiased`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_BOOTSTRAP }} />
      </head>
      <body className="min-h-dvh">
        <ScriptConverter />
        <AppShell user={user}>{children}</AppShell>
      </body>
    </html>
  );
}
