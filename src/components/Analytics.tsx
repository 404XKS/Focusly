import { lazy, Suspense, useMemo } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { todayKey } from "@/utils/helpers";

const Charts = lazy(() => import("./AnalyticsCharts"));

export function Analytics() {
  const { stats } = useFocusly();
  const data = useMemo(() => {
    // last 14 days daily
    const daily: { date: string; minutes: number; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = todayKey(d);
      daily.push({
        date: k,
        label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        minutes: stats.sessions.filter((s) => s.date === k).reduce((a, b) => a + b.minutes, 0),
      });
    }
    // weekly sessions last 8 weeks
    const weekly: { label: string; sessions: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(); start.setDate(start.getDate() - w * 7 - 6);
      const end = new Date(); end.setDate(end.getDate() - w * 7);
      const s = stats.sessions.filter((r) => {
        const d = new Date(r.date + "T00:00:00");
        return d >= new Date(todayKey(start) + "T00:00:00") && d <= new Date(todayKey(end) + "T23:59:59");
      }).length;
      weekly.push({ label: `W-${w}`, sessions: s });
    }
    // monthly (last 6 months)
    const monthly: { label: string; minutes: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(); d.setMonth(d.getMonth() - m);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const mins = stats.sessions.filter((s) => s.date.startsWith(key)).reduce((a, b) => a + b.minutes, 0);
      monthly.push({ label: d.toLocaleDateString(undefined, { month: "short" }), minutes: mins });
    }
      // this week (last 7 days)
      const weekKeys = new Set(daily.slice(7).map((d) => d.date));
      const weekSessions = stats.sessions.filter((s) => weekKeys.has(s.date));
      const weekMinutes = weekSessions.reduce((a, b) => a + b.minutes, 0);
      return { daily, weekly, monthly, weekSessions: weekSessions.length, weekMinutes };
    }, [stats.sessions]);

  return (
    <div className="space-y-4">
      <div className="glass flex flex-wrap items-center justify-between gap-4 rounded-3xl px-5 py-4">
        <h4 className="font-display text-base font-semibold">This Week</h4>
        <div className="flex items-center gap-6 text-sm">
          <div>
            <span className="text-xl font-semibold text-gradient">{data.weekMinutes}</span>
            <span className="ml-1.5 text-xs text-white/40">focus minutes</span>
          </div>
          <div>
            <span className="text-xl font-semibold text-gradient">{data.weekSessions}</span>
            <span className="ml-1.5 text-xs text-white/40">sessions completed</span>
          </div>
        </div>
      </div>
      <Suspense fallback={<div className="glass rounded-3xl p-12 text-center text-white/40">Loading charts…</div>}>
        <Charts daily={data.daily} weekly={data.weekly} monthly={data.monthly} />
      </Suspense>
    </div>
  );
}
