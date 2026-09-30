import { createHmac, timingSafeEqual } from "crypto";

/** 登录会话：HMAC 签名的 httpOnly Cookie（服务端使用） */

export const SESSION_COOKIE = "xj_session";
export const SESSION_DAYS = 7;

export function authConfig() {
  const username = process.env.AUTH_USERNAME || "admin";
  const password = process.env.AUTH_PASSWORD || "xuanji888";
  // 未设置 AUTH_SECRET 时由账号密码派生（更换密码即令旧会话失效）
  const secret = process.env.AUTH_SECRET || `xuanji:${username}:${password}`;
  // 一键登录：登录页预填账号密码（默认开启；设为 false 则需手动输入）
  const prefill = process.env.AUTH_PREFILL !== "false";
  return { username, password, secret, prefill };
}

const sign = (data: string, secret: string) => createHmac("sha256", secret).update(data).digest("base64url");

function safeEqual(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function checkCredentials(username: string, password: string) {
  const cfg = authConfig();
  // 两项都比较，避免通过耗时差异判断哪一项错误
  const u = safeEqual(username, cfg.username);
  const p = safeEqual(password, cfg.password);
  return u && p;
}

export function createSession(username: string) {
  const exp = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const payload = `${Buffer.from(username).toString("base64url")}.${exp}`;
  return `${payload}.${sign(payload, authConfig().secret)}`;
}

/** 有效则返回用户名，否则 null */
export function verifySession(token: string | undefined | null): string | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [user, exp, sig] = parts;
  if (!safeEqual(sig, sign(`${user}.${exp}`, authConfig().secret))) return null;
  if (!(Number(exp) > Date.now())) return null;
  return Buffer.from(user, "base64url").toString();
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_DAYS * 24 * 60 * 60,
};
