"use client";

/** 退出登录：清除会话 Cookie 后回到登录页 */
export async function logout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.replace("/login");
  }
}
