"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import type { Direction, Gua, MansionKey } from "@/lib/fengshui";

type Mansion = { key: MansionKey; direction: Direction; luck: "吉" | "凶" };
type RoomType = "door" | "master" | "bed" | "study" | "kitchen" | "bath" | "storage" | "living";

const DIR_DEG: Record<Exclude<Direction, "中">, number> = {
  北: 0, 东北: 45, 东: 90, 东南: 135, 南: 180, 西南: 225, 西: 270, 西北: 315,
};
const DEG_DIR = Object.fromEntries(Object.entries(DIR_DEG).map(([k, v]) => [v, k])) as Record<number, Direction>;

/** 八宅：各吉凶方适合安排的房间 */
const ROOM: Record<MansionKey, { name: string; type: RoomType }> = {
  生气: { name: "大门·玄关", type: "door" },
  延年: { name: "主卧", type: "master" },
  天医: { name: "次卧", type: "bed" },
  伏位: { name: "书房", type: "study" },
  祸害: { name: "厨房", type: "kitchen" },
  五鬼: { name: "卫生间", type: "bath" },
  六煞: { name: "储物·洗衣", type: "storage" },
  绝命: { name: "卫生间", type: "bath" },
};

/** 由坐向推算平面每一格的真实方位：后 = 坐，前 = 向，右（+x）= 宅之左（青龙） */
function cellDirection(r: number, c: number, sitDeg: number): Direction {
  if (r === 1 && c === 1) return "中";
  const back = (sitDeg * Math.PI) / 180;
  const right = (((sitDeg + 90) % 360) * Math.PI) / 180;
  const dy = 1 - r;
  const dx = c - 1;
  const x = dy * Math.sin(back) + dx * Math.sin(right);
  const y = dy * Math.cos(back) + dx * Math.cos(right);
  const deg = (Math.round((((Math.atan2(x, y) * 180) / Math.PI + 360) % 360) / 45) * 45) % 360;
  return DEG_DIR[deg];
}

const BEASTS = [
  { name: "玄武", img: "xuanwu", flip: false, deg: 0, fang: "北方", wx: "水", color: "#5a4632" },
  { name: "朱雀", img: "zhuque", flip: false, deg: 180, fang: "南方", wx: "火", color: "#c2410c" },
  { name: "青龙", img: "qinglong", flip: false, deg: 90, fang: "东方", wx: "木", color: "#0f766e" },
  { name: "白虎", img: "baihu", flip: true, deg: 270, fang: "西方", wx: "金", color: "#57534e" },
] as const;

export default function IdealHouse({ gua, mansions, onClose }: { gua: Gua; mansions: Mansion[]; onClose: () => void }) {
  const mount = useRef<HTMLDivElement>(null);
  const [spin, setSpin] = useState(false); // 默认静止，点「播放动画」才动
  const [sit, setSit] = useState<Exclude<Direction, "中">>("北"); // 默认坐北朝南
  const spinRef = useRef(spin);
  useEffect(() => {
    spinRef.current = spin;
  }, [spin]);

  const sitDeg = DIR_DEG[sit];
  const houseGroup = ["北", "南", "东", "东南"].includes(sit) ? "东四宅" : "西四宅";
  const matched = houseGroup === gua.group.replace("命", "宅");
  const byDir = Object.fromEntries(mansions.map((m) => [m.direction, m])) as Record<Direction, Mansion>;
  const tips = mansions
    .filter((m) => m.luck === "吉")
    .map((m) => `${ROOM[m.key].name}放${m.direction}`)
    .join(" · ");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // ---------------- three.js 场景 ----------------
  useEffect(() => {
    const el = mount.current;
    if (!el) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const THREE = await import("three");
      const { OrbitControls } = await import("three/addons/controls/OrbitControls.js");
      const { CSS2DRenderer, CSS2DObject } = await import("three/addons/renderers/CSS2DRenderer.js");
      if (disposed) return;

      const S = 4; // 每格边长
      const WH = 1.5; // 墙高
      const WT = 0.14; // 墙厚
      const w = el.clientWidth;
      const h = el.clientHeight;
      const narrow = w < 640; // 手机竖屏：神兽靠近、隐藏地面方位字、房间只显示名称

      const scene = new THREE.Scene();
      scene.background = new THREE.Color("#f7efe1");
      scene.fog = new THREE.Fog("#f7efe1", 40, 90);

      const camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 200);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(w, h);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.05;
      el.appendChild(renderer.domElement);

      const labels = new CSS2DRenderer();
      labels.setSize(w, h);
      labels.domElement.style.position = "absolute";
      labels.domElement.style.inset = "0";
      labels.domElement.style.pointerEvents = "none";
      el.appendChild(labels.domElement);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;
      controls.minDistance = 16;
      controls.maxDistance = 55;
      controls.maxPolarAngle = Math.PI * 0.46;
      controls.target.set(0, 0.6, 0);
      controls.autoRotateSpeed = 0.9;

      // 灯光：柔和的天光 + 投影阳光
      scene.add(new THREE.HemisphereLight("#fff7e8", "#b89f7a", 1.4));
      const sun = new THREE.DirectionalLight("#fff1d6", 2.2);
      sun.position.set(12, 22, 10);
      sun.castShadow = true;
      sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.camera.left = -18;
      sun.shadow.camera.right = 18;
      sun.shadow.camera.top = 18;
      sun.shadow.camera.bottom = -18;
      sun.shadow.radius = 4;
      sun.shadow.bias = -0.0005;
      scene.add(sun);

      type Mat = InstanceType<typeof THREE.MeshStandardMaterial>;
      type Obj = InstanceType<typeof THREE.Object3D>;
      const mats = new Map<string, Mat>();
      const mat = (color: string, opts: { rough?: number; metal?: number; opacity?: number } = {}) => {
        const key = `${color}-${opts.rough ?? 0.8}-${opts.metal ?? 0}-${opts.opacity ?? 1}`;
        if (!mats.has(key))
          mats.set(
            key,
            new THREE.MeshStandardMaterial({
              color,
              roughness: opts.rough ?? 0.8,
              metalness: opts.metal ?? 0,
              transparent: (opts.opacity ?? 1) < 1,
              opacity: opts.opacity ?? 1,
            }),
          );
        return mats.get(key)!;
      };
      const house = new THREE.Group();
      scene.add(house);
      const box = (
        parent: Obj, sx: number, sy: number, sz: number, x: number, y: number, z: number,
        color: string, opts?: { rough?: number; metal?: number; opacity?: number },
      ) => {
        const m = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat(color, opts));
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
      };
      const cyl = (
        parent: Obj, r: number, hgt: number, x: number, y: number, z: number, color: string,
        opts?: { rough?: number; metal?: number },
      ) => {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, hgt, 28), mat(color, opts));
        m.position.set(x, y, z);
        m.castShadow = true;
        m.receiveShadow = true;
        parent.add(m);
        return m;
      };

      // 地面：暖色石板 + 金色罗盘环
      const ground = new THREE.Mesh(new THREE.CircleGeometry(17.5, 72), mat("#e9dcc4", { rough: 1 }));
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);
      for (const [r1, r2] of [[10.6, 10.9], [12.6, 12.75]]) {
        const ring = new THREE.Mesh(new THREE.RingGeometry(r1, r2, 96), mat("#c89b4a", { rough: 0.4, metal: 0.5 }));
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.01;
        scene.add(ring);
      }

      const addLabel = (html: string, x: number, y: number, z: number) => {
        const div = document.createElement("div");
        div.innerHTML = html;
        const obj = new CSS2DObject(div);
        obj.position.set(x, y, z);
        scene.add(obj);
        return obj;
      };
      // 八方文字（按真实方位摆放在罗盘环上）
      for (const [name, deg] of narrow ? [] : Object.entries(DIR_DEG).filter(([, d]) => d % 90 !== 0)) { // 正四方由神兽标注
        const rel = (((deg - sitDeg) % 360) + 360) % 360;
        const a = (rel * Math.PI) / 180;
        addLabel(
          `<span style="font:700 17px var(--font-serif),serif;color:#8a6420;text-shadow:0 1px 0 #fff8">${name}</span>`,
          Math.sin(a) * 11.7, 0.05, -Math.cos(a) * 11.7,
        );
      }

      // ---------- 家具 ----------
      const furnish = (g: Obj, type: RoomType) => {
        switch (type) {
          case "master":
          case "bed": {
            const big = type === "master";
            const bw = big ? 2.2 : 1.6;
            box(g, bw, 0.35, 2.4, 0, 0.25, 0.2, "#7b5536", { rough: 0.6 });
            box(g, bw - 0.1, 0.25, 2.3, 0, 0.55, 0.2, "#fbf8f2");
            box(g, bw - 0.08, 0.1, 1.5, 0, 0.72, 0.62, big ? "#b3261e" : "#2d6aa3", { rough: 0.9 });
            box(g, bw + 0.1, 0.9, 0.12, 0, 0.55, -1.02, "#6b4a30", { rough: 0.6 });
            box(g, 0.55, 0.18, 0.35, big ? -bw / 4 : 0, 0.75, -0.7, "#ffffff");
            if (big) box(g, 0.55, 0.18, 0.35, bw / 4, 0.75, -0.7, "#ffffff");
            box(g, 0.45, 0.45, 0.45, bw / 2 + 0.45, 0.22, -0.8, "#8a6440", { rough: 0.6 });
            cyl(g, 0.12, 0.3, bw / 2 + 0.45, 0.6, -0.8, "#e8c979", { rough: 0.4 });
            break;
          }
          case "study": {
            box(g, 1.8, 0.08, 0.8, 0, 0.78, -0.9, "#6b4a30", { rough: 0.5 });
            for (const [lx, lz] of [[-0.8, -1.2], [0.8, -1.2], [-0.8, -0.6], [0.8, -0.6]]) box(g, 0.06, 0.75, 0.06, lx, 0.38, lz, "#4a3322");
            box(g, 0.55, 0.35, 0.04, 0, 1.0, -1.15, "#1f2937", { rough: 0.3 });
            box(g, 0.5, 0.08, 0.5, 0, 0.45, -0.2, "#2f7d4f");
            box(g, 0.5, 0.5, 0.06, 0, 0.72, 0.03, "#2f7d4f");
            box(g, 0.4, 1.4, 1.6, 1.45, 0.7, 0.6, "#7b5536", { rough: 0.6 });
            ["#b3261e", "#2d6aa3", "#a87622", "#2f7d4f", "#6d28d9"].forEach((col, i) => box(g, 0.28, 0.32, 0.16, 1.4, 0.95, 0.05 + i * 0.28, col));
            break;
          }
          case "living": {
            box(g, 2.4, 0.4, 0.8, 0, 0.3, 1.0, "#2d6aa3", { rough: 0.9 });
            box(g, 2.4, 0.5, 0.2, 0, 0.6, 1.35, "#2d6aa3", { rough: 0.9 });
            box(g, 0.8, 0.4, 1.4, -1.2, 0.3, 0.3, "#2d6aa3", { rough: 0.9 });
            const rug = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.02, 48), mat("#c9a15c", { rough: 1 }));
            rug.position.set(0.2, 0.02, 0);
            rug.receiveShadow = true;
            g.add(rug);
            cyl(g, 0.5, 0.35, 0.2, 0.2, 0, "#6b4a30", { rough: 0.4 });
            box(g, 2.0, 0.45, 0.35, 0, 0.23, -1.55, "#4a3322", { rough: 0.5 });
            box(g, 1.4, 0.8, 0.06, 0, 0.9, -1.6, "#111827", { rough: 0.2 });
            cyl(g, 0.22, 0.06, 0.2, 0.41, 0, "#fbf8f2");
            break;
          }
          case "kitchen": {
            box(g, 3.2, 0.9, 0.7, 0, 0.45, -1.4, "#e9e1d3", { rough: 0.5 });
            box(g, 3.2, 0.05, 0.72, 0, 0.92, -1.4, "#3f3a35", { rough: 0.3 });
            box(g, 0.7, 0.9, 2.2, -1.4, 0.45, -0.1, "#e9e1d3", { rough: 0.5 });
            box(g, 0.72, 0.05, 2.2, -1.4, 0.92, -0.1, "#3f3a35", { rough: 0.3 });
            cyl(g, 0.16, 0.03, 0.4, 0.96, -1.45, "#b3261e", { metal: 0.3 });
            cyl(g, 0.16, 0.03, 0.9, 0.96, -1.45, "#b3261e", { metal: 0.3 });
            box(g, 0.8, 1.8, 0.7, 1.35, 0.9, 1.0, "#d1d5db", { rough: 0.3, metal: 0.4 });
            break;
          }
          case "bath": {
            box(g, 0.45, 0.4, 0.6, -1.1, 0.2, -1.1, "#ffffff", { rough: 0.2 });
            cyl(g, 0.24, 0.12, -1.1, 0.46, -0.9, "#ffffff", { rough: 0.2 });
            box(g, 0.5, 0.45, 0.15, -1.1, 0.65, -1.38, "#ffffff", { rough: 0.2 });
            box(g, 0.8, 0.8, 0.5, 0.6, 0.4, -1.35, "#e5e7eb", { rough: 0.4 });
            cyl(g, 0.22, 0.08, 0.6, 0.84, -1.3, "#ffffff", { rough: 0.2 });
            box(g, 1.3, 1.4, 1.3, 1.0, 0.7, 0.9, "#9cc9e6", { rough: 0.05, opacity: 0.35 });
            break;
          }
          case "storage": {
            box(g, 0.75, 0.9, 0.7, -1.1, 0.45, -1.3, "#f3f4f6", { rough: 0.3 });
            cyl(g, 0.24, 0.04, -1.1, 0.55, -0.94, "#94a3b8", { metal: 0.5, rough: 0.2 }).rotation.x = Math.PI / 2;
            box(g, 0.5, 1.6, 2.4, 1.4, 0.8, 0, "#a78b6d", { rough: 0.7 });
            ["#e7c9a0", "#c9a36b", "#e7c9a0"].forEach((col, i) => box(g, 0.45, 0.35, 0.6, 1.4, 0.4 + i * 0.5, -0.6 + i * 0.6, col));
            break;
          }
          case "door": {
            box(g, 1.2, 0.9, 0.4, 0.6, 0.45, -1.4, "#7b5536", { rough: 0.6 });
            box(g, 1.3, 0.02, 0.9, 0, 0.02, 0.3, "#b3261e", { rough: 1 }).castShadow = false;
            cyl(g, 0.25, 0.5, -1.2, 0.25, -1.2, "#8a6420", { rough: 0.5 });
            const plant = new THREE.Mesh(new THREE.SphereGeometry(0.42, 20, 16), mat("#3c8a55", { rough: 0.9 }));
            plant.position.set(-1.2, 0.85, -1.2);
            plant.castShadow = true;
            g.add(plant);
            break;
          }
        }
      };

      // 房间
      const cells = [0, 1, 2].flatMap((r) => [0, 1, 2].map((c) => ({ r, c, dir: cellDirection(r, c, sitDeg) })));
      const cx = (c: number) => (c - 1) * S;
      const cz = (r: number) => (r - 1) * S;
      for (const { r, c, dir } of cells) {
        const m = byDir[dir];
        const good = dir === "中" || m?.luck === "吉";
        const floorColor = dir === "中" ? "#f1e2c2" : good ? "#d6ead2" : "#efdcc2";
        box(house, S - WT, 0.12, S - WT, cx(c), 0.06, cz(r), floorColor, { rough: 0.9 }).castShadow = false;
        box(house, S - 0.9, 0.02, S - 0.9, cx(c), 0.13, cz(r), good ? "#e9f4e6" : "#f6ead6", { rough: 1 }).castShadow = false;

        const g = new THREE.Group();
        g.position.set(cx(c), 0.14, cz(r));
        house.add(g);
        furnish(g, dir === "中" ? "living" : ROOM[m.key].type);

        const full = dir === "中" ? "客厅" : ROOM[m.key].name;
        const name = narrow ? full.split("·")[0] : full; // 手机：储物·洗衣 → 储物，大门·玄关 → 大门
        const tag = dir === "中" ? "中宫 · 太极" : `${dir} · ${m.key}`;
        addLabel(
          `<div style="text-align:center">
             <div style="display:inline-block;padding:2px 8px;border-radius:9px;background:#fffaf0e6;box-shadow:0 1px 4px #0002;font:800 17px var(--font-sans);color:#2a2017">${name}</div>
             ${narrow ? "" : `<div style="margin-top:2px;font:700 14px var(--font-sans);color:${dir === "中" ? "#a87622" : good ? "#2f7d4f" : "#8a6d4a"};text-shadow:0 1px 0 #fff,0 0 3px #fff">${tag}</div>`}
           </div>`,
          cx(c), 2.6, cz(r),
        );
      }

      // 墙：外墙完整，内墙中间留门洞；大门在「生气」格的外墙
      const doorCell = cells.find((x) => byDir[x.dir]?.key === "生气")!;
      const doorEdge = doorCell.r === 2 ? "front" : doorCell.c === 0 ? "left" : doorCell.c === 2 ? "right" : "back";
      let doorHinge: InstanceType<typeof THREE.Group> | null = null;
      let doorLabelPos: [number, number, number] = [0, 2.4, 0];
      const wallSeg = (x1: number, z1: number, x2: number, z2: number, gap: number, isDoor: boolean) => {
        const horiz = z1 === z2;
        const len = horiz ? x2 - x1 : z2 - z1;
        const piece = (from: number, to: number) => {
          if (to - from < 0.05) return;
          const mid = (from + to) / 2;
          const px = horiz ? x1 + mid : x1;
          const pz = horiz ? z1 : z1 + mid;
          box(house, horiz ? to - from : WT, WH, horiz ? WT : to - from, px, WH / 2, pz, "#f7f2ea", { rough: 0.95 });
          // 深色墙顶线，更有设计图质感
          box(house, horiz ? to - from : WT + 0.02, 0.05, horiz ? WT + 0.02 : to - from, px, WH + 0.02, pz, "#3a2c21", { rough: 0.6 });
        };
        if (gap <= 0) return piece(0, len);
        const a = (len - gap) / 2;
        piece(0, a);
        piece(a + gap, len);
        if (isDoor) {
          const hx = horiz ? x1 + a : x1;
          const hz = horiz ? z1 : z1 + a;
          const hinge = new THREE.Group();
          hinge.position.set(hx, 0, hz);
          if (!horiz) hinge.rotation.y = -Math.PI / 2;
          house.add(hinge);
          box(hinge, gap - 0.04, WH - 0.12, 0.08, (gap - 0.04) / 2, (WH - 0.12) / 2 + 0.06, 0, "#8a5a2e", { rough: 0.55 });
          box(hinge, 0.06, 0.06, 0.18, gap - 0.28, 0.72, 0, "#d4a84b", { metal: 0.9, rough: 0.3 });
          const mx = horiz ? hx + gap / 2 : hx;
          const mz = horiz ? hz : hz + gap / 2;
          box(house, horiz ? gap + 0.12 : WT + 0.08, 0.14, horiz ? WT + 0.08 : gap + 0.12, mx, WH, mz, "#b3261e", { rough: 0.5 });
          doorHinge = hinge;
          doorLabelPos = [mx, WH + 0.7, mz];
        }
      };
      const E = 1.5 * S;
      for (let i = 0; i < 3; i++) {
        const a = -E + i * S;
        const b = a + S;
        wallSeg(a, -E, b, -E, doorEdge === "back" && doorCell.c === i ? 1.3 : 0, doorEdge === "back" && doorCell.c === i);
        wallSeg(a, E, b, E, doorEdge === "front" && doorCell.c === i ? 1.3 : 0, doorEdge === "front" && doorCell.c === i);
        wallSeg(-E, a, -E, b, doorEdge === "left" && doorCell.r === i ? 1.3 : 0, doorEdge === "left" && doorCell.r === i);
        wallSeg(E, a, E, b, doorEdge === "right" && doorCell.r === i ? 1.3 : 0, doorEdge === "right" && doorCell.r === i);
        for (const k of [1, 2]) {
          const p = -E + k * S;
          wallSeg(a, p, b, p, 1.2, false);
          wallSeg(p, a, p, b, 1.2, false);
        }
      }
      const baseRot = doorHinge ? (doorHinge as InstanceType<typeof THREE.Group>).rotation.y : 0;
      // 手机：房间名已写「大门」，不再重复红色门牌
      if (!narrow) addLabel(
        `<span style="padding:1px 8px;border-radius:7px;background:#b3261e;color:#fff;font:800 15px var(--font-sans);box-shadow:0 2px 6px #0003">大门</span>`,
        ...doorLabelPos,
      );

      // 四神兽：悬浮徽章 + 地面光晕
      const diag = sitDeg % 90 !== 0; // 斜向宅：房屋对角更长，神兽再推远一些
      const R = narrow ? (diag ? 12.8 : 10.5) : diag ? 16.2 : 15; // 桌面：在两道金环（10.6–12.75）之外
      // 四象按固定方位：东青龙、西白虎、南朱雀、北玄武（与地面八方文字同一换算）
      const compass = (deg: number, r: number): [number, number] => {
        const a = ((deg - sitDeg) * Math.PI) / 180;
        return [Math.sin(a) * r, -Math.cos(a) * r];
      };
      const beastObjs = BEASTS.map((b, i) => {
        const [x, z] = compass(b.deg, R);
        const dirText = `${b.fang} · ${b.wx}`;
        const o = addLabel(
          `<div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 4px 8px #0002)">
             <img src="/beasts/${b.img}.webp" alt="${b.name}" draggable="false" style="width:${narrow ? 92 : 160}px;height:auto;display:block;${b.flip ? "transform:scaleX(-1);" : ""}pointer-events:none" />
             <div style="margin-top:-8px;white-space:nowrap;text-align:center;font:800 17px var(--font-sans);color:${b.color}">${b.name}<span style="${narrow ? "display:block;text-align:center;" : "margin-left:5px;"}font:600 14px var(--font-sans);color:#6b5b4b">${dirText}</span></div>
           </div>`,
          x, 3, z,
        );
        const glow = new THREE.Mesh(new THREE.CircleGeometry(1, 40), new THREE.MeshBasicMaterial({ color: b.color, transparent: true, opacity: 0.18 }));
        glow.rotation.x = -Math.PI / 2;
        glow.position.set(x, 0.02, z);
        scene.add(glow);
        return { o, phase: i * 1.6, glow };
      });

      // 开场：镜头缓缓推近
      const start = performance.now();
      const tanHalf = Math.tan(((camera.fov / 2) * Math.PI) / 180);
      const needW = narrow ? (diag ? 15.8 : 13.6) : diag ? 20.5 : 18.5; // 左右需容纳的半宽（含神兽标签）
      const dist = Math.max(needW / (tanHalf * (w / h)), narrow ? 30 : diag ? 46 : 42);
      // 镜头在北方望向南方：画面上南下北、左东右西（传统坐北朝南：前朱雀、左青龙、右白虎）
      // 手机竖屏：更俯视，让南北（朱雀/玄武）在屏幕上下拉开
      const [sx, sz] = compass(0, 1);
      const horiz = narrow ? 0.44 : 0.78;
      const dirv = new THREE.Vector3(sx * horiz, narrow ? 0.9 : 0.62, sz * horiz).normalize();
      const baseTheta = Math.atan2(sx, sz);
      const camTo = dirv.clone().multiplyScalar(dist);
      const camFrom = dirv.clone().multiplyScalar(dist * 1.4);
      controls.target.set(narrow ? 0 : sx * 1.2, 0.6, narrow ? 0 : sz * 1.2);
      controls.maxDistance = dist * 1.6;
      camera.position.copy(camFrom);

      let raf = 0;
      let swayT = 0;
      const tick = () => {
        const t = (performance.now() - start) / 1000;
        if (t < 1.8) camera.position.lerpVectors(camFrom, camTo, 1 - Math.pow(1 - t / 1.8, 3));
        // 轻轻左右摆动（±20°），不整圈旋转，保持「左青龙右白虎」
        if (spinRef.current && t >= 1.8) {
          swayT += 1 / 60;
          const off = camera.position.clone().sub(controls.target);
          const sph = new THREE.Spherical().setFromVector3(off);
          const want = baseTheta + Math.sin(swayT * 0.35) * 0.35;
          const d = Math.atan2(Math.sin(want - sph.theta), Math.cos(want - sph.theta)); // 取最短方向
          sph.theta += d * 0.04;
          camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(sph));
        }
        controls.update();
        for (const b of beastObjs) {
          const s = Math.sin(swayT * 1.4 + b.phase) * Math.min(1, swayT); // 播放后渐入
          b.o.position.y = 3 + s * 0.35;
          (b.glow.material as InstanceType<typeof THREE.MeshBasicMaterial>).opacity = 0.14 + (s + 1) * 0.06;
          b.glow.scale.setScalar(1 + (s + 1) * 0.08);
        }
        if (doorHinge) doorHinge.rotation.y = baseRot - ((1 - Math.cos(swayT * 0.9)) / 2) * 1.1;
        renderer.render(scene, camera);
        labels.render(scene, camera);
        raf = requestAnimationFrame(tick);
      };
      tick();

      const ro = new ResizeObserver(() => {
        const W2 = el.clientWidth;
        const H2 = el.clientHeight;
        if (!W2 || !H2) return;
        camera.aspect = W2 / H2;
        camera.updateProjectionMatrix();
        renderer.setSize(W2, H2);
        labels.setSize(W2, H2);
      });
      ro.observe(el);
      controls.addEventListener("start", () => setSpin(false));

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect();
        controls.dispose();
        scene.traverse((o) => {
          const mesh = o as InstanceType<typeof THREE.Mesh>;
          if (mesh.geometry) mesh.geometry.dispose();
        });
        mats.forEach((m) => m.dispose());
        renderer.dispose();
        el.innerHTML = "";
      };
    })();

    return () => {
      disposed = true;
      cleanup();
    };
    // 场景在打开及更换坐向时重建
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sitDeg]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label="理想宅设计图">
      <button className="absolute inset-0 bg-ink/50" aria-label="关闭" onClick={onClose} />
      <div className="fade-up relative flex h-[94dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gold/40 bg-card shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2">
          <div className="min-w-0">
            <h2 className="font-serif text-xl font-bold">理想宅设计图</h2>
            <div className="flex min-w-0 items-center gap-2 text-sm text-muted">
              <select
                value={sit}
                onChange={(e) => setSit(e.target.value as Exclude<Direction, "中">)}
                className="shrink-0 rounded-lg border border-gold/50 bg-card-2 px-1.5 py-0.5 font-medium text-ink"
                aria-label="房屋坐向"
              >
                {(Object.keys(DIR_DEG) as Exclude<Direction, "中">[]).map((d) => (
                  <option key={d} value={d}>
                    坐{d}朝{DEG_DIR[(DIR_DEG[d] + 180) % 360]}
                  </option>
                ))}
              </select>
              <span className="truncate">
                <b className={matched ? "text-good" : "text-cinnabar"}>
                  {houseGroup}
                  <span className="sm:hidden">{matched ? " ✓" : " ✗"}</span>
                  <span className="hidden sm:inline">{matched ? "·与命相配" : `·与${gua.group}不配`}</span>
                </b>
                {" "}· {gua.name}卦（{gua.number}）· 上南下北、左东右西 · 可拖动旋转、滚轮缩放
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={() => setSpin((v) => !v)} aria-label={spin ? "停止动画" : "播放动画"} className={`btn-ghost text-sm ${spin ? "!border-gold text-gold" : ""}`}>
              {spin ? "⏸" : "▶"}
              <span className="hidden sm:inline"> {spin ? "停止动画" : "播放动画"}</span>
            </button>
            <button onClick={onClose} className="rounded-full p-1.5 text-muted hover:bg-card-2 hover:text-ink" aria-label="关闭">
              <Icon name="close" className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div ref={mount} className="relative min-h-0 flex-1 cursor-grab touch-none overflow-hidden active:cursor-grabbing" />

        <div className="shrink-0 border-t border-line px-4 py-2 text-sm leading-relaxed">
          <p className="truncate" title={tips}>
            <b className="text-cinnabar">布局：</b>
            {tips}；厨房、卫生间、储物放凶方以「压凶」
          </p>
          <p className="truncate text-muted">
            南<b className="text-ink">朱雀</b>火 · 东<b className="text-ink">青龙</b>木 · 西<b className="text-ink">白虎</b>金 · 北
            <b className="text-ink">玄武</b>水 · 绿地板为吉方
          </p>
        </div>
      </div>
    </div>
  );
}
