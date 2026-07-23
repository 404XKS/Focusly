import { useMemo } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { todayKey } from "@/utils/helpers";

export function Heatmap() {
  const { stats } = useFocusly();
  const days = useMemo(() => {
    const arr: { date: string; count: number }[] = [];
    for (let i = 118; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = todayKey(d);
      arr.push({ date: k, count: stats.sessions.filter((s) => s.date === k).length });
    }
    return arr;
  }, [stats.sessions]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const weeks: typeof days[] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const cell = (c: number) => {
    if (c === 0) return "rgba(255,255,255,0.04)";
    const t = Math.min(1, c / max);
    // interpolate blue → purple
    const alpha = 0.25 + t * 0.7;
    return `linear-gradient(135deg, rgba(139,92,246,${alpha}), rgba(59,130,246,${alpha}))`;
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display text-lg font-semibold">Focus Heatmap</h3>
        <span className="text-xs text-white/40">Last 17 weeks</span>
      </div>
      <div className="overflow-x-auto">
        <div className="flex gap-1">
          {weeks.map((w, wi) => (
            <div key={wi} className="flex flex-col gap-1">
              {w.map((d) => (
                <div key={d.date} title={`${d.date}: ${d.count} session${d.count === 1 ? "" : "s"}`}
                  className="h-3.5 w-3.5 rounded-[3px]"
                  style={{ background: cell(d.count) }} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-white/40">
        <span>Less</span>
        {[0, 0.3, 0.6, 1].map((t, i) => (
          <span key={i} className="h-3 w-3 rounded-[3px]"
            style={{ background: t === 0 ? "rgba(255,255,255,0.04)" : `linear-gradient(135deg, rgba(139,92,246,${0.25 + t * 0.7}), rgba(59,130,246,${0.25 + t * 0.7}))` }} />
        ))}
        <span>More</span>
      </div>
    </div>
  );
}
