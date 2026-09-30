"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import CompassButton from "@/components/CompassButton";
import Icon from "@/components/Icon";
import RichText from "@/components/RichText";
import { type ChatMessage, loadChat, storeChat } from "@/lib/chatStore";
import { useProfile } from "@/lib/profile";
import { useScript } from "@/lib/script";

const SUGGESTIONS = [
  "我今年的事业运势如何？",
  "我适合从事什么行业？",
  "最近感情运怎么样？",
  "家里财位应该怎么布置？",
  "下个月哪天适合搬家？",
  "我的五行缺什么，如何补？",
];

const noopSubscribe = () => () => {};
const pad = (n: number) => String(n).padStart(2, "0");
const localDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

function MasterChat() {
  const [profile, ready] = useProfile();
  const script = useScript();
  // 挂载后才读取本地聊天记录，避免服务端渲染与水合不一致
  const loaded = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [override, setMessages] = useState<ChatMessage[] | null>(null);
  const messages = useMemo(() => override ?? (loaded ? loadChat() : []), [override, loaded]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const autoSent = useRef(false);
  const params = useSearchParams();
  // 从奇门页面带入的起局时间，随本次对话发送给服务器
  const qimenTime = useRef<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = useCallback(
    async (text: string) => {
      const q = text.trim();
      if (!q || busy) return;
      const history: ChatMessage[] = [...nonEmpty(messages), { role: "user", content: q }];
      setMessages([...history, { role: "assistant", content: "" }]);
      setInput("");
      setBusy(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let answer = "";
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history, profile, today: localDate(), script, qimenTime: qimenTime.current }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error ?? "网络异常");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setMessages([...history, { role: "assistant", content: answer }]);
        }
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          answer += `${answer ? "\n\n" : ""}⚠️ ${(e as Error).message || "大师暂时无法连线，请稍后再试。"}`;
        }
      } finally {
        const final: ChatMessage[] = answer ? [...history, { role: "assistant", content: answer }] : history;
        setMessages(final);
        storeChat(final);
        setBusy(false);
        abortRef.current = null;
      }
    },
    [busy, messages, profile, script],
  );

  // 从其他页面带问题跳转过来时自动提问
  useEffect(() => {
    const q = params.get("q");
    if (!q || !ready || !loaded || autoSent.current) return;
    autoSent.current = true;
    const qt = params.get("qt");
    if (qt) qimenTime.current = qt;
    router.replace("/master");
    void send(q);
  }, [params, ready, loaded, router, send]);

  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col lg:min-h-dvh">
      <header className="sticky top-0 z-30 -mx-4 flex items-center gap-3 border-b border-line bg-paper/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:-mt-6 lg:px-8 lg:py-4">
        <span className="seal flex h-10 w-10 items-center justify-center rounded-full font-serif text-lg">师</span>
        <div className="flex-1">
          <h1 className="font-serif text-lg font-bold leading-tight">AI 命理大师</h1>
          <p className="text-xs text-muted">
            {ready && profile ? `已读取${profile.name ?? "您"}的命盘` : "未设置档案 · 仅作通用解答"}
          </p>
        </div>
        <CompassButton />
        {messages.length > 0 && !busy && (
          <button
            onClick={() => {
              setMessages([]);
              storeChat([]);
            }}
            className="rounded-full p-2 text-muted hover:bg-card-2"
            aria-label="新对话"
          >
            <Icon name="trash" className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="flex-1 space-y-4 py-4">
        {messages.length === 0 && (
          <div className="fade-up space-y-4 pt-4 text-center">
            <div className="spin-slow mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-card-2 font-serif text-5xl text-gold">☯</div>
            <div>
              <p className="font-serif text-xl font-bold">缘主，有何疑惑？</p>
              <p className="mt-1 text-sm text-muted">事业、财运、感情、风水、择日，皆可相询</p>
            </div>
            {ready && !profile && (
              <Link href="/profile" className="inline-block rounded-full bg-cinnabar-soft px-4 py-1.5 text-sm text-cinnabar">
                填写出生信息，获得专属解读 →
              </Link>
            )}
            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => send(s)} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm active:bg-card-2">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="seal max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md px-3.5 py-2.5 text-xs leading-relaxed">
                {m.content}
              </div>
            </div>
          ) : (
            <div key={i} className="flex gap-2">
              <span className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-card-2 font-serif text-sm text-cinnabar">师</span>
              <div className="card max-w-[88%] rounded-tl-md px-3.5 py-2.5 text-xs leading-relaxed">
                {m.content ? (
                  <RichText text={m.content} />
                ) : (
                  <span className="flex items-center gap-1.5 text-muted">
                    <span className="spin-slow inline-block text-gold">☯</span> 大师正在推演…
                  </span>
                )}
              </div>
            </div>
          ),
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        className="sticky bottom-[calc(env(safe-area-inset-bottom)+4.25rem)] -mx-4 flex items-end gap-2 bg-paper/95 px-4 py-2 backdrop-blur md:-mx-6 md:px-6 lg:bottom-0 lg:-mx-8 lg:px-8 lg:pb-4"
      >
        <textarea
          className="input max-h-32 min-h-[46px] resize-none"
          rows={1}
          value={input}
          maxLength={1000}
          placeholder="请输入您的问题…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              void send(input);
            }
          }}
        />
        {busy ? (
          <button type="button" onClick={() => abortRef.current?.abort()} className="btn-ghost h-[46px] shrink-0 px-3 text-sm">
            停止
          </button>
        ) : (
          <button type="submit" disabled={!input.trim()} className="btn-primary flex h-[46px] w-[46px] shrink-0 items-center justify-center p-0" aria-label="发送">
            <Icon name="send" className="h-5 w-5" />
          </button>
        )}
      </form>
      <p className="-mt-1 text-center text-xs text-muted">AI 解读仅供娱乐与文化参考</p>
    </div>
  );
}

/** 去掉末尾空的助手占位消息 */
function nonEmpty(msgs: ChatMessage[]) {
  return msgs.filter((m) => m.content.trim() !== "");
}

export default function MasterPage() {
  return (
    <Suspense>
      <MasterChat />
    </Suspense>
  );
}
