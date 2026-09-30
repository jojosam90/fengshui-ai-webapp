import { BRANCH_CELL, type ZiweiResult, type ZwStar } from "@/lib/ziwei";

const MUTAGEN_STYLE: Record<string, string> = {
  禄: "bg-good text-white",
  权: "bg-[#7a4fb3] text-white",
  科: "bg-water text-white",
  忌: "bg-bad text-white",
};

export function Mutagen({ m }: { m?: string }) {
  if (!m) return null;
  return <span className={`ml-0.5 inline-flex items-center justify-center rounded px-1 py-px text-xs leading-none ${MUTAGEN_STYLE[m] ?? ""}`}>{m}</span>;
}

function StarLine({ s, major }: { s: ZwStar; major?: boolean }) {
  return (
    <span className="inline-flex items-baseline whitespace-nowrap">
      <span className={major ? "font-bold text-cinnabar" : "text-ink/80"}>{s.name}</span>
      {s.brightness && <span className="text-xs text-muted xl:text-xs">{s.brightness}</span>}
      <Mutagen m={s.mutagen} />
    </span>
  );
}

export default function ZiweiChart({
  z,
  selected,
  onSelect,
  center,
}: {
  z: ZiweiResult;
  selected: number | null;
  onSelect: (index: number) => void;
  center: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-4 grid-rows-4 gap-px overflow-hidden rounded-2xl border border-line bg-line">
      {z.palaces.map((p) => {
        const [row, col] = BRANCH_CELL[p.branch];
        const isSoul = p.name === "命宫";
        const isDecadal = p.index === z.horoscope.decadalIndex;
        const isYearly = p.index === z.horoscope.yearlyIndex;
        return (
          <button
            key={p.index}
            onClick={() => onSelect(p.index)}
            style={{ gridRow: row + 1, gridColumn: col + 1 }}
            className={`flex min-h-[7.5rem] flex-col p-1 text-left text-xs leading-tight sm:min-h-[9rem] sm:p-1.5 sm:text-xs xl:min-h-[10rem] xl:p-2 xl:text-sm transition ${
              selected === p.index ? "bg-cinnabar-soft" : "bg-card active:bg-card-2"
            }`}
          >
            <div className="flex flex-wrap gap-x-1.5 text-xs sm:text-xs xl:text-base">
              {p.major.length ? p.major.map((s) => <StarLine key={s.name} s={s} major />) : <span className="text-muted">空宫</span>}
            </div>
            <div className="mt-0.5 flex flex-wrap gap-x-1">
              {p.minor.map((s) => <StarLine key={s.name} s={s} />)}
            </div>
            <div className="mt-auto flex items-end justify-between pt-1">
              <div>
                <p className="flex items-center gap-0.5 text-xs text-muted xl:text-xs">
                  {p.decadal[0]}-{p.decadal[1]}
                  {isDecadal && <span className="rounded-sm bg-gold px-0.5 text-xs text-white">限</span>}
                  {isYearly && <span className="rounded-sm bg-cinnabar px-0.5 text-xs text-white">年</span>}
                </p>
                <p className={`font-serif text-xs font-bold xl:text-base ${isSoul ? "text-cinnabar" : ""}`}>
                  {p.name === "仆役" ? "交友" : p.name.replace("宫", "")}
                  {p.isBody && <span className="ml-0.5 rounded-sm bg-gold px-0.5 text-xs font-normal text-white">身</span>}
                </p>
              </div>
              <span className="font-serif text-xs text-muted xl:text-sm">{p.stem}{p.branch}</span>
            </div>
          </button>
        );
      })}
      <div style={{ gridRow: "2 / span 2", gridColumn: "2 / span 2" }} className="flex flex-col items-center justify-center bg-card-2 p-2 text-center">
        {center}
      </div>
    </div>
  );
}
