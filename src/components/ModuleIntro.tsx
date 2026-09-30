import { MODULE_INFO } from "@/lib/moduleInfo";
import Icon from "./Icon";

/** 模块说明面板：这是什么 · 常用来看什么 · 小贴士（由页首 ⓘ 按钮展开） */
export default function ModuleIntro({ id, onClose }: { id: keyof typeof MODULE_INFO; onClose: () => void }) {
  const info = MODULE_INFO[id];
  return (
    <section id={`intro-${id}`} className="fade-up relative mb-3 rounded-2xl border border-gold/25 bg-gold-soft/50 p-3.5 pr-10 text-sm lg:mb-5">
      <button onClick={onClose} className="absolute right-2 top-2 rounded-full p-1.5 text-muted hover:bg-card" aria-label="收起说明">
        <Icon name="close" className="h-4 w-4" />
      </button>
      <p className="leading-relaxed">
        <span className="mr-1.5 rounded bg-gold px-1.5 py-0.5 text-xs font-semibold text-white">这是什么</span>
        {info.what}
      </p>
      <p className="mb-1.5 mt-3 text-xs font-semibold text-gold">常用来看什么</p>
      <ul className="flex flex-wrap gap-1.5">
        {info.uses.map((u) => (
          <li key={u} className="rounded-full border border-line bg-card px-2.5 py-0.5 text-xs">
            {u}
          </li>
        ))}
      </ul>
      {info.tip && <p className="mt-2 text-xs text-muted">💡 {info.tip}</p>}
    </section>
  );
}
