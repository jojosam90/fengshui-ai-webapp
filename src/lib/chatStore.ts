"use client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const KEY = "xuanji.chat.v1";
const MAX_STORED = 60;

export function loadChat(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as ChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function storeChat(messages: ChatMessage[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(messages.slice(-MAX_STORED)));
  } catch {
    // 忽略存储失败
  }
}

export function clearChat() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // 忽略
  }
}
