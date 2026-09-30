"use client";

import { useState } from "react";

export default function LoginForm({
  next,
  defaultUsername,
  defaultPassword,
}: {
  next: string;
  defaultUsername: string;
  defaultPassword: string;
}) {
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState(defaultPassword);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "登录失败，请重试");
        setBusy(false);
        return;
      }
      // 整页跳转，确保服务端读取到新的登录 Cookie
      window.location.replace(next);
    } catch {
      setError("网络异常，请稍后再试");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-5">
      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium">用户名</label>
        <input
          id="username"
          className="input"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          autoFocus={!defaultUsername}
        />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium">密码</label>
        <div className="relative">
          <input
            id="password"
            className="input pr-11"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-muted hover:text-ink"
            aria-label={show ? "隐藏密码" : "显示密码"}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.7} aria-hidden>
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
              <circle cx="12" cy="12" r="3" />
              {show && <path d="M4 4l16 16" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      </div>

      {error && <p className="rounded-lg bg-bad/10 px-3 py-2 text-sm text-bad" role="alert">{error}</p>}

      <button type="submit" disabled={busy} className="btn-primary w-full py-3 text-base">
        {busy ? "登录中…" : "登 录"}
      </button>
    </form>
  );
}
