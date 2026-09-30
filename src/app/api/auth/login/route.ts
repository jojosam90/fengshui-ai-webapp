import { cookies } from "next/headers";
import { SESSION_COOKIE, checkCredentials, createSession, sessionCookieOptions } from "@/lib/auth";

export async function POST(req: Request) {
  let body: { username?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "请求格式错误" }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!checkCredentials(username, password)) {
    return Response.json({ error: "用户名或密码错误" }, { status: 401 });
  }

  (await cookies()).set(SESSION_COOKIE, createSession(username), sessionCookieOptions);
  return Response.json({ ok: true, username });
}
