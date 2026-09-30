import { useId } from "react";

// 俯视龟甲（头朝左）：外缘椭圆 O、缘盾内界椭圆 I
const CX = 110;
const CY = 80;
const O = { rx: 102, ry: 74 };
const I = { rx: 86, ry: 60 };
/** 脊盾（中间一排六角） */
const VERT_X = [50, 80, 110, 140, 170];
const VH = 24; // 脊盾半高
const VW = 15; // 脊盾半宽

const innerY = (x: number, sign: 1 | -1) => CY + sign * I.ry * Math.sqrt(Math.max(0, 1 - ((x - CX) / I.rx) ** 2));

function hex(cx: number, cy: number, w: number, h: number) {
  const s = w * 0.5;
  return `M${cx - w},${cy} L${cx - s},${cy - h} L${cx + s},${cy - h} L${cx + w},${cy} L${cx + s},${cy + h} L${cx - s},${cy + h} Z`;
}

/** 黄铜龟甲俯视图（卜卦用），色调取自实物照片 */
export default function TurtleShell({ className = "" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  const outer = `M${CX - O.rx},${CY} a${O.rx},${O.ry} 0 1,0 ${O.rx * 2},0 a${O.rx},${O.ry} 0 1,0 ${-O.rx * 2},0 Z`;
  const inner = `M${CX - I.rx},${CY} a${I.rx},${I.ry} 0 1,0 ${I.rx * 2},0 a${I.rx},${I.ry} 0 1,0 ${-I.rx * 2},0 Z`;

  // 肋盾分界：脊盾之间的交点向上/下延伸至缘盾内界
  const joints = VERT_X.slice(0, -1).map((x) => x + VW);
  // 肋盾中心（生长纹位置）
  const costal = VERT_X.map((x, i) => x + (i === 0 ? -8 : i === VERT_X.length - 1 ? 8 : 0));
  // 缘盾分割线
  const marginal = Array.from({ length: 24 }, (_, i) => {
    const a = (i / 24) * Math.PI * 2;
    return [CX + Math.cos(a) * I.rx, CY + Math.sin(a) * I.ry, CX + Math.cos(a) * O.rx, CY + Math.sin(a) * O.ry];
  });

  return (
    <svg viewBox="0 0 220 160" className={className} aria-hidden>
      <defs>
        <radialGradient id={`dome-${id}`} cx="42%" cy="38%" r="70%">
          <stop offset="0%" stopColor="#f0da95" />
          <stop offset="35%" stopColor="#cfaa55" />
          <stop offset="75%" stopColor="#9a762c" />
          <stop offset="100%" stopColor="#5f4613" />
        </radialGradient>
        <clipPath id={`clip-${id}`}>
          <path d={outer} />
        </clipPath>
      </defs>

      <path d={outer} fill={`url(#dome-${id})`} stroke="#4f3a10" strokeWidth={1.6} />
      <g clipPath={`url(#clip-${id})`} fill="none" stroke="#5a4113" strokeLinejoin="round" strokeLinecap="round">
        {/* 缘盾 */}
        <path d={inner} strokeWidth={1.5} opacity={0.75} />
        {marginal.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth={1.1} opacity={0.55} />
        ))}

        {/* 脊盾 + 生长纹 */}
        {VERT_X.map((x) =>
          [1, 0.64, 0.3].map((k) => <path key={`${x}-${k}`} d={hex(x, CY, VW * k, VH * k)} strokeWidth={k === 1 ? 1.5 : 0.9} opacity={k === 1 ? 0.8 : 0.45} />),
        )}

        {/* 肋盾分界（上、下） */}
        {joints.map((x) => (
          <g key={x} strokeWidth={1.4} opacity={0.75}>
            <line x1={x} y1={CY - VH} x2={x + (x - CX) * 0.12} y2={innerY(x + (x - CX) * 0.12, -1)} />
            <line x1={x} y1={CY + VH} x2={x + (x - CX) * 0.12} y2={innerY(x + (x - CX) * 0.12, 1)} />
          </g>
        ))}
        {/* 两端肋盾与脊盾的连线 */}
        <g strokeWidth={1.4} opacity={0.75}>
          <line x1={VERT_X[0] - VW} y1={CY} x2={CX - I.rx} y2={CY} />
          <line x1={VERT_X[4] + VW} y1={CY} x2={CX + I.rx} y2={CY} />
        </g>

        {/* 肋盾生长纹 */}
        {costal.map((x) =>
          ([-1, 1] as const).map((sign) => {
            const y = (CY + sign * VH + innerY(x, sign)) / 2;
            return [1, 0.5].map((k) => (
              <ellipse key={`${x}-${sign}-${k}`} cx={x} cy={y} rx={11 * k} ry={8 * k} strokeWidth={0.9} opacity={0.4} />
            ));
          }),
        )}

        {/* 高光 */}
        <ellipse cx={86} cy={52} rx={46} ry={20} fill="#fff4cf" stroke="none" opacity={0.25} transform="rotate(-12 86 52)" />
      </g>
    </svg>
  );
}
