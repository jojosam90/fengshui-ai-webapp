"use client";

import { useEffect } from "react";
import { useScript } from "@/lib/script";

const ATTRS = ["placeholder", "aria-label", "title"];
const SKIP = new Set(["SCRIPT", "STYLE", "TEXTAREA", "INPUT", "NOSCRIPT"]);

/**
 * 繁体模式下将页面文字即时转换为繁体（台湾用字）。
 * 通过 MutationObserver 处理后续渲染（包括 AI 流式回答）。
 * 切回简体时由 setScript 重新载入页面以恢复原文。
 */
export default function ScriptConverter() {
  const script = useScript();

  useEffect(() => {
    // 水合阶段 script 先为 cn，此时不做任何事（繁体由首屏脚本标记并等待转换）
    if (script !== "tw") return;
    const root = document.documentElement;

    root.dataset.script = "tw";
    root.lang = "zh-Hant-TW";
    let observer: MutationObserver | null = null;
    let cancelled = false;

    import("opencc-js/cn2t").then(({ Converter }) => {
      if (cancelled) return;
      const convert = Converter({ from: "cn", to: "tw" });
      // 转换并非幂等（如 斗→鬥），记录已写入的结果，避免重复转换
      const doneText = new WeakMap<Text, string>();
      const doneAttr = new WeakMap<Element, Map<string, string>>();

      const convertText = (node: Text) => {
        const v = node.nodeValue;
        if (!v || doneText.get(node) === v || !/[一-鿿]/.test(v)) return;
        const t = convert(v);
        doneText.set(node, t);
        if (t !== v) node.nodeValue = t;
      };
      const convertElementAttrs = (el: Element) => {
        for (const a of ATTRS) {
          const v = el.getAttribute(a);
          if (!v) continue;
          let done = doneAttr.get(el);
          if (done?.get(a) === v) continue;
          const t = convert(v);
          if (!done) doneAttr.set(el, (done = new Map()));
          done.set(a, t);
          if (t !== v) el.setAttribute(a, t);
        }
      };
      const walk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE) {
          if (!SKIP.has(node.parentElement?.tagName ?? "")) convertText(node as Text);
          return;
        }
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        const el = node as Element;
        convertElementAttrs(el);
        if (SKIP.has(el.tagName)) return;
        const tw = document.createTreeWalker(el, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let n: Node | null = tw.nextNode();
        while (n) {
          if (n.nodeType === Node.TEXT_NODE) {
            if (!SKIP.has(n.parentElement?.tagName ?? "")) convertText(n as Text);
          } else {
            convertElementAttrs(n as Element);
          }
          n = tw.nextNode();
        }
      };

      let lastTitle = convert(document.title);
      document.title = lastTitle;
      walk(document.body);
      root.dataset.converted = "1";

      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          if (m.type === "characterData") walk(m.target);
          else if (m.type === "attributes") convertElementAttrs(m.target as Element);
          else m.addedNodes.forEach(walk);
        }
        if (document.title !== lastTitle) {
          lastTitle = convert(document.title);
          document.title = lastTitle;
        }
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ATTRS,
      });
    });

    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [script]);

  return null;
}

/** 在首屏渲染前读取偏好，繁体模式先隐藏页面直至转换完成（最多 1.5 秒） */
export const SCRIPT_BOOTSTRAP = `try{if(localStorage.getItem("xuanji.script.v1")==="tw"){var r=document.documentElement;r.dataset.script="tw";r.lang="zh-Hant-TW";setTimeout(function(){r.dataset.converted="1"},1500)}}catch(e){}`;
