import { MOUNTAINS } from "@/lib/fengshui";

export interface LuopanMarker {
  deg: number;
  label: string;
  color: string;
}

// 后天八卦方位（北起顺时针），爻自内而外
const HOUTIAN: { deg: number; dir: string; lines: number[] }[] = [
  { deg: 0, dir: "北", lines: [0, 1, 0] },
  { deg: 45, dir: "东北", lines: [0, 0, 1] },
  { deg: 90, dir: "东", lines: [1, 0, 0] },
  { deg: 135, dir: "东南", lines: [0, 1, 1] },
  { deg: 180, dir: "南", lines: [1, 0, 1] },
  { deg: 225, dir: "西南", lines: [0, 0, 0] },
  { deg: 270, dir: "西", lines: [1, 1, 0] },
  { deg: 315, dir: "西北", lines: [1, 1, 1] },
];

/**
 * 罗盘：外圈二十四山、中圈后天八卦、内圈方位与磁针。
 * rotation 为表盘旋转角（= -设备朝向），0 时北朝上。
 */
export default function Luopan({
  rotation = 0,
  markers = [],
  detailed = true,
  className = "",
}: {
  rotation?: number;
  markers?: LuopanMarker[];
  detailed?: boolean;
  className?: string;
}) {
  return (
    <svg viewBox="-120 -120 240 240" className={className} role="img" aria-label="罗盘">
      <defs>
        <radialGradient id="lp-face" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="var(--card)" />
          <stop offset="100%" stopColor="var(--gold-soft)" />
        </radialGradient>
      </defs>

      <circle r={118} fill="url(#lp-face)" stroke="var(--gold)" strokeWidth={2.5} />

      <g style={{ transform: `rotate(${rotation}deg)`, transition: "transform 0.35s ease-out" }}>
        {/* 二十四山 */}
        <circle r={94} fill="none" stroke="var(--gold)" strokeWidth={0.8} opacity={0.7} />
        {MOUNTAINS.map((m, i) => (
          <g key={m.name}>
            <line
              y1={-94}
              y2={-116}
              stroke="var(--gold)"
              strokeWidth={0.6}
              opacity={0.6}
              transform={`rotate(${337.5 + i * 15})`}
            />
            {detailed && (
              <text
                transform={`rotate(${m.deg}) translate(0,-102)`}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={10}
                fontWeight={m.pos === 1 ? 700 : 400}
                fill={m.pos === 1 ? "var(--cinnabar)" : "var(--ink)"}
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {m.name}
              </text>
            )}
          </g>
        ))}

        {/* 后天八卦 */}
        <circle r={70} fill="none" stroke="var(--gold)" strokeWidth={0.8} opacity={0.7} />
        {HOUTIAN.map((t) => (
          <g key={t.dir} transform={`rotate(${t.deg})`}>
            {t.lines.map((yang, j) => {
              const y = -74 - j * 6;
              return yang ? (
                <rect key={j} x={-9} y={y - 2} width={18} height={3.4} rx={0.6} fill="var(--ink)" opacity={0.75} />
              ) : (
                <g key={j} opacity={0.75}>
                  <rect x={-9} y={y - 2} width={7.2} height={3.4} rx={0.6} fill="var(--ink)" />
                  <rect x={1.8} y={y - 2} width={7.2} height={3.4} rx={0.6} fill="var(--ink)" />
                </g>
              );
            })}
            <text
              y={-56}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={t.dir.length > 1 ? 9 : 11}
              fontWeight={700}
              fill={t.deg === 0 ? "var(--cinnabar)" : "var(--muted)"}
              transform={`rotate(${-t.deg} 0 -56)`}
            >
              {t.dir}
            </text>
          </g>
        ))}

        {/* 今日吉神方位 */}
        {markers.map((mk) => (
          <g key={mk.label} transform={`rotate(${mk.deg})`}>
            <circle cy={-88} r={4.5} fill={mk.color} stroke="var(--card)" strokeWidth={1.5} />
          </g>
        ))}

        {/* 天池 · 磁针（指北） */}
        <circle r={40} fill="var(--card)" stroke="var(--gold)" strokeWidth={1} />
        <line x1={-36} x2={36} stroke="var(--line)" strokeWidth={0.8} />
        <line y1={-36} y2={36} stroke="var(--line)" strokeWidth={0.8} />
        <path d="M0,-34 L6,0 L-6,0 Z" fill="var(--cinnabar)" />
        <path d="M0,34 L6,0 L-6,0 Z" fill="var(--gold)" opacity={0.85} />
        <circle r={3.5} fill="var(--ink)" />
      </g>

      {/* 固定的朝向指示（设备正前方） */}
      <path d="M0,-119 L-6,-129 L6,-129 Z" fill="var(--cinnabar)" transform="translate(0,12)" />
    </svg>
  );
}
