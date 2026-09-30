/** 先天八卦图（乾上坤下、离左坎右），太极居中；颜色取 currentColor */

// 自上方顺时针：乾 巽 坎 艮 坤 震 离 兑；爻自下（内）而上（外），1 为阳爻
const TRIGRAMS: [string, number[]][] = [
  ["乾", [1, 1, 1]],
  ["巽", [0, 1, 1]],
  ["坎", [0, 1, 0]],
  ["艮", [0, 0, 1]],
  ["坤", [0, 0, 0]],
  ["震", [1, 0, 0]],
  ["离", [1, 0, 1]],
  ["兑", [1, 1, 0]],
];

const R = 34; // 太极半径
const LINE_R = [52, 62, 72]; // 三爻距圆心
const HALF = 20; // 爻半长
const GAP = 5; // 阴爻中断

export default function Bagua({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="-110 -110 220 220" className={className} aria-hidden>
      <circle r={104} fill="none" stroke="currentColor" strokeWidth={1} opacity={0.6} />
      <circle r={86} fill="none" stroke="currentColor" strokeWidth={0.6} opacity={0.4} />

      {TRIGRAMS.map(([name, lines], i) => (
        <g key={name} transform={`rotate(${i * 45})`}>
          {lines.map((yang, j) => {
            const y = -LINE_R[j];
            return yang ? (
              <rect key={j} x={-HALF} y={y - 3} width={HALF * 2} height={6} rx={1} fill="currentColor" />
            ) : (
              <g key={j}>
                <rect x={-HALF} y={y - 3} width={HALF - GAP} height={6} rx={1} fill="currentColor" />
                <rect x={GAP} y={y - 3} width={HALF - GAP} height={6} rx={1} fill="currentColor" />
              </g>
            );
          })}
          <text y={-92} textAnchor="middle" fontSize={11} fill="currentColor" opacity={0.8} style={{ fontFamily: "serif" }}>
            {name}
          </text>
        </g>
      ))}

      {/* 太极 */}
      <circle r={R} fill="none" stroke="currentColor" strokeWidth={1.5} />
      <path
        d={`M0,${-R} A${R},${R} 0 0 1 0,${R} A${R / 2},${R / 2} 0 0 1 0,0 A${R / 2},${R / 2} 0 0 0 0,${-R} Z`}
        fill="currentColor"
      />
      <circle cy={-R / 2} r={R / 7} fill="currentColor" />
      <circle cy={R / 2} r={R / 7} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}
