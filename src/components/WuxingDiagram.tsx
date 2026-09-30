import { type WuXing, KE, SHENG } from "@/lib/wuxing";

/** 五行位置（参照传统图：土上、金右、水右下、木左下、火左），角度从正上方顺时针 */
const NODES: { wx: WuXing; angle: number; fill: string; text: string }[] = [
  { wx: "土", angle: 0, fill: "#f0d24a", text: "#5a4500" },
  { wx: "金", angle: 72, fill: "#e4e1dc", text: "#4a4540" },
  { wx: "水", angle: 144, fill: "#1f1f1f", text: "#ffffff" },
  { wx: "木", angle: 216, fill: "#7ed957", text: "#1d4d0c" },
  { wx: "火", angle: 288, fill: "#ef5b2f", text: "#ffffff" },
];

const R = 128; // 五行所在圆半径
const NR = 30; // 节点圆半径
const rad = (deg: number) => ((deg - 90) * Math.PI) / 180;
const pt = (deg: number, r = R) => ({ x: Math.cos(rad(deg)) * r, y: Math.sin(rad(deg)) * r });
const angleOf = (wx: WuXing) => NODES.find((n) => n.wx === wx)!.angle;

/**
 * 五行生克图：外圈箭头为相生，内部五角星为相克；中间太极。
 * 可传入本人命盘的五行占比与日主、喜用神作标注。
 */
export default function WuxingDiagram({
  percents,
  dayMaster,
  favorable = [],
}: {
  percents?: Record<WuXing, number>;
  dayMaster?: WuXing;
  favorable?: WuXing[];
}) {
  return (
    <svg viewBox="-205 -205 410 410" className="h-full w-full" role="img" aria-label="五行生克图">
      <defs>
        <marker id="wx-arrow-sheng" viewBox="0 0 10 10" refX="6" refY="5" markerUnits="userSpaceOnUse" markerWidth="16" markerHeight="16" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="var(--muted)" />
        </marker>
        <marker id="wx-arrow-ke" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0,1 L10,5 L0,9 z" fill="var(--cinnabar)" />
        </marker>
        {NODES.map((n) => (
          <radialGradient key={n.wx} id={`wx-g-${n.wx}`} cx="40%" cy="35%" r="70%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity={0.55} />
            <stop offset="45%" stopColor={n.fill} />
            <stop offset="100%" stopColor={n.fill} />
          </radialGradient>
        ))}
      </defs>

      {/* 相生：外圈弧线箭头 */}
      {NODES.map((n) => {
        const to = SHENG[n.wx];
        const a0 = n.angle + 17;
        let a1 = angleOf(to) - 17;
        if (a1 < a0) a1 += 360;
        const p0 = pt(a0);
        const p1 = pt(a1);
        const mid = pt((a0 + a1) / 2, R + 30);
        return (
          <g key={`s-${n.wx}`}>
            <path
              d={`M${p0.x},${p0.y} A${R},${R} 0 0 1 ${p1.x},${p1.y}`}
              fill="none"
              stroke="var(--muted)"
              strokeOpacity={0.55}
              strokeWidth={7}
              markerEnd="url(#wx-arrow-sheng)"
            />
            <text x={mid.x} y={mid.y} textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill="var(--good)">
              {n.wx}生{to}
            </text>
          </g>
        );
      })}

      {/* 相克：五角星连线 */}
      {NODES.map((n) => {
        const to = KE[n.wx];
        const from = pt(n.angle);
        const end = pt(angleOf(to));
        const len = Math.hypot(end.x - from.x, end.y - from.y);
        const ux = (end.x - from.x) / len;
        const uy = (end.y - from.y) / len;
        const s = { x: from.x + ux * (NR + 2), y: from.y + uy * (NR + 2) };
        const e = { x: end.x - ux * (NR + 4), y: end.y - uy * (NR + 4) };
        let rot = (Math.atan2(uy, ux) * 180) / Math.PI;
        if (rot > 90 || rot < -90) rot += 180;
        // 标签放在线段 40% 处，避免五条线在中心交叉处重叠
        const lx = from.x + (end.x - from.x) * 0.36;
        const ly = from.y + (end.y - from.y) * 0.36;
        return (
          <g key={`k-${n.wx}`}>
            <line x1={s.x} y1={s.y} x2={e.x} y2={e.y} stroke="var(--cinnabar)" strokeOpacity={0.7} strokeWidth={1.6} markerEnd="url(#wx-arrow-ke)" />
            <text
              x={lx}
              y={ly}
              transform={`rotate(${rot} ${lx} ${ly})`}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={13}
              fontWeight={700}
              fill="var(--cinnabar)"
              stroke="var(--card)"
              strokeWidth={4}
              paintOrder="stroke"
            >
              {n.wx}克{to}
            </text>
          </g>
        );
      })}

      {/* 太极 */}
      <g transform="scale(0.9)">
        <circle r={30} fill="#fff" stroke="#1f1f1f" strokeWidth={1.5} />
        <path d="M0,-30 A30,30 0 0 1 0,30 A15,15 0 0 1 0,0 A15,15 0 0 0 0,-30 Z" fill="#1f1f1f" />
        <circle cy={-15} r={4.5} fill="#fff" />
        <circle cy={15} r={4.5} fill="#1f1f1f" />
      </g>

      {/* 五行节点 */}
      {NODES.map((n) => {
        const c = pt(n.angle);
        const label = pt(n.angle, R + NR + 34);
        const isDm = dayMaster === n.wx;
        const fav = favorable.includes(n.wx);
        return (
          <g key={n.wx}>
            {isDm && <circle cx={c.x} cy={c.y} r={NR + 6} fill="none" stroke="var(--cinnabar)" strokeWidth={3} strokeDasharray="5 4" />}
            <circle cx={c.x} cy={c.y} r={NR} fill={`url(#wx-g-${n.wx})`} stroke="rgba(0,0,0,.25)" strokeWidth={1} />
            {percents && (
              <text x={c.x} y={c.y} textAnchor="middle" dominantBaseline="middle" fontSize={15} fontWeight={700} fill={n.text}>
                {percents[n.wx]}%
              </text>
            )}
            <text x={label.x} y={label.y} textAnchor="middle" dominantBaseline="middle" fontSize={30} fontWeight={900} fill="var(--ink)" style={{ fontFamily: "var(--font-serif), serif" }}>
              {n.wx}
            </text>
            {/* 标签竖排堆叠，避免在右侧被裁切 */}
            {isDm && (
              <text x={label.x} y={label.y + 26} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--cinnabar)">
                日主
              </text>
            )}
            {fav && (
              <text x={label.x} y={label.y + (isDm ? 42 : 26)} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--gold)">
                喜用
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
