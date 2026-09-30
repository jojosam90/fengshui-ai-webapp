import { Fragment } from "react";

/** 渲染 **加粗** 与 "- " 列表的极简 Markdown（不使用 innerHTML） */
function inline(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} className="font-semibold text-cinnabar">{part.slice(2, -2)}</strong>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

export default function RichText({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        const lines = block.split("\n").filter((l) => l.trim() !== "");
        if (lines.length && lines.every((l) => /^\s*([-*•]|\d+[.、])\s/.test(l))) {
          return (
            <ul key={bi} className="space-y-1">
              {lines.map((l, li) => (
                <li key={li} className="flex gap-1.5">
                  <span className="text-gold">·</span>
                  <span>{inline(l.replace(/^\s*([-*•]|\d+[.、])\s/, ""))}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={bi}>
            {lines.map((l, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {inline(l.replace(/^#+\s*/, ""))}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
