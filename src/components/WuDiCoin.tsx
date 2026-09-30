import { useId } from "react";

/** 五帝钱：顺治、康熙、雍正、乾隆、嘉庆 */
export const EMPERORS = ["顺治", "康熙", "雍正", "乾隆", "嘉庆"] as const;
export type Emperor = (typeof EMPERORS)[number];

/**
 * 清代方孔铜钱。
 * 字面：钱文按「上下右左」读作「X X 通宝」；背面：左右为满文宝泉局名（示意笔画）。
 */
export default function WuDiCoin({ emperor, side, className = "" }: { emperor: Emperor; side: "front" | "back"; className?: string }) {
  const id = useId().replace(/:/g, "");
  const ink = "#2f220d"; // 钱文凹处的旧铜暗色

  return (
    <svg viewBox="-50 -50 100 100" className={className} aria-label={side === "front" ? `${emperor}通宝（字）` : `${emperor}通宝（背）`}>
      <defs>
        <radialGradient id={`brass-${id}`} cx="38%" cy="32%" r="75%">
          {/* 旧黄铜：哑光、偏橄榄色（取自实物照片） */}
          <stop offset="0%" stopColor="#d9c483" />
          <stop offset="45%" stopColor="#b59a52" />
          <stop offset="85%" stopColor="#8a7236" />
          <stop offset="100%" stopColor="#5f4c1e" />
        </radialGradient>
        <mask id={`hole-${id}`}>
          <circle r={50} fill="white" />
          <rect x={-8.5} y={-8.5} width={17} height={17} fill="black" />
        </mask>
      </defs>

      <g mask={`url(#hole-${id})`}>
        <circle r={48} fill={`url(#brass-${id})`} stroke="#4d3d15" strokeWidth={2} />
        {/* 外郭、内郭 */}
        <circle r={43.5} fill="none" stroke={ink} strokeWidth={1.4} opacity={0.55} />
        <rect x={-13} y={-13} width={26} height={26} fill="none" stroke={ink} strokeWidth={2.2} opacity={0.6} />
        {/* 铜锈与光泽 */}
        <circle cx={18} cy={24} r={11} fill="#3f3a22" opacity={0.18} />
        <circle cx={-26} cy={-10} r={8} fill="#3f3a22" opacity={0.15} />
        <path d="M-34,-22 A40,40 0 0 1 -6,-40" fill="none" stroke="#f4ead0" strokeWidth={2.5} strokeLinecap="round" opacity={0.28} />

        {side === "front" ? (
          <g fill={ink} fontSize={17} fontWeight={700} textAnchor="middle" dominantBaseline="central" style={{ fontFamily: "var(--font-serif), serif" }}>
            <text y={-28}>{emperor[0]}</text>
            <text y={28}>{emperor[1]}</text>
            <text x={28}>通</text>
            <text x={-28}>宝</text>
          </g>
        ) : (
          // 满文「宝泉」示意：左右两列竖写笔画
          <g fill="none" stroke={ink} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" opacity={0.85}>
            <path d="M-28,-19 V17 M-28,-12 q7,1 1,6 M-28,-2 q-7,2 -1,6 M-28,8 q6,1 2,6" />
            <path d="M28,-19 V17 M28,-13 q-7,2 -1,5 M28,-4 q7,1 1,6 M28,6 q-7,2 -2,6 M28,14 q5,0 4,4" />
          </g>
        )}
      </g>
    </svg>
  );
}
