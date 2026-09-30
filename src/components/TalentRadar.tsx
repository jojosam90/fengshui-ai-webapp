import type { Talent } from "@/lib/talent";

/** 六维天赋雷达图（SVG），多边形由中心展开动画 */
export default function TalentRadar({ data }: { data: Talent[] }) {
  const R = 92;
  const n = data.length;
  const pt = (i: number, f: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [Math.cos(a) * R * f, Math.sin(a) * R * f] as const;
  };
  const ring = (f: number) => data.map((_, i) => pt(i, f).join(",")).join(" ");
  const shape = data.map((d, i) => pt(i, d.score / 100).join(",")).join(" ");

  return (
    <svg viewBox="-172 -130 344 262" className="h-full w-full" role="img" aria-label="天赋雷达图">
      <defs>
        <radialGradient id="radar-fill">
          <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="var(--cinnabar)" stopOpacity="0.35" />
        </radialGradient>
      </defs>
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill={f === 1 ? "var(--card-2)" : "none"} stroke="var(--gold)" strokeOpacity={f === 1 ? 0.6 : 0.3} strokeWidth={f === 1 ? 1.2 : 0.8} />
      ))}
      {data.map((_, i) => {
        const [x, y] = pt(i, 1);
        return <line key={i} x1={0} y1={0} x2={x} y2={y} stroke="var(--gold)" strokeOpacity={0.3} strokeWidth={0.8} />;
      })}

      <g className="radar-grow">
        <polygon points={shape} fill="url(#radar-fill)" stroke="var(--cinnabar)" strokeWidth={2} strokeLinejoin="round" />
        {data.map((d, i) => {
          const [x, y] = pt(i, d.score / 100);
          return <circle key={d.key} cx={x} cy={y} r={3.6} fill="var(--card)" stroke="var(--cinnabar)" strokeWidth={2} />;
        })}
      </g>

      {data.map((d, i) => {
        const [x, y] = pt(i, 1.14);
        const anchor = Math.abs(x) < 5 ? "middle" : x > 0 ? "start" : "end";
        return (
          <text key={d.key} x={x} y={y} textAnchor={anchor} dominantBaseline="middle" style={{ fontFamily: "var(--font-sans)" }}>
            <tspan fontSize={17} fontWeight={800} fill="var(--ink)">{d.label}</tspan>
            <tspan fontSize={17} fontWeight={800} fill="var(--cinnabar)" dx={4}>{d.score}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
