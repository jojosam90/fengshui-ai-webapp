import { type WuXing, WUXING_ORDER } from "@/lib/wuxing";

const BAR: Record<WuXing, string> = {
  木: "bg-wood", 火: "bg-fire", 土: "bg-earth", 金: "bg-metal", 水: "bg-water",
};
const TEXT: Record<WuXing, string> = {
  木: "text-wood", 火: "text-fire", 土: "text-earth", 金: "text-metal", 水: "text-water",
};

export default function WuxingBars({ percents, highlight = [] }: { percents: Record<WuXing, number>; highlight?: WuXing[] }) {
  return (
    <ul className="space-y-2.5">
      {WUXING_ORDER.map((w) => (
        <li key={w} className="flex items-center gap-3">
          <span className={`w-6 font-serif text-lg font-bold ${TEXT[w]}`}>{w}</span>
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card-2">
            <div className={`h-full rounded-full ${BAR[w]}`} style={{ width: `${Math.max(percents[w], 2)}%` }} />
          </div>
          <span className="w-10 text-right text-sm tabular-nums text-muted">{percents[w]}%</span>
          {highlight.includes(w) && <span className="rounded bg-gold-soft px-1.5 text-xs text-gold">喜用</span>}
        </li>
      ))}
    </ul>
  );
}

export const wxText = (w: WuXing) => TEXT[w];
