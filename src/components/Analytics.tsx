import { lazy, Suspense, useMemo, useState } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { todayKey } from "@/utils/helpers";
import { cn } from "@/lib/utils";

const Charts = lazy(() => import("./AnalyticsCharts"));

const RANGES = [
  { id: "7", label: "7 Days" },
  { id: "30", label: "30 Days" },
  { id: "all", label: "All Time" },
] as const;

type RangeId = (typeof RANGES)[number]["id"];
type Gran = "day" | "week" | "month";
type Bucket = { label: string; minutes: number; sessions: number };

const DAY_MS = 86400000;

export function Analytics() {
  const { stats } = useFocusly();
  const [range, setRange] = useState<RangeId>("7");

  const data = useMemo(() => {
    // this week (last 7 days) — summary card, unchanged
    const weekKeys = new Set<string>();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      weekKeys.add(todayKey(d));
    }
    const weekSessions = stats.sessions.filter((s) => weekKeys.has(s.date));
    const weekMinutes = weekSessions.reduce((a, b) => a + b.minutes, 0);

    // window for the selected range
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const first = stats.sessions.reduce((min, s) => (s.date < min ? s.date : min), todayKey(today));
    const from =
      range === "7"
        ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6)
        : range === "30"
          ? new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29)
          : new Date(first + "T00:00:00");

    const spanDays = Math.max(1, Math.round((today.getTime() - from.getTime()) / DAY_MS) + 1);
    const gran: Gran =
      range !== "all" ? "day" : spanDays > 365 ? "month" : spanDays > 90 ? "week" : "day";

    const weekStart = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const keyOf = (d: Date) =>
      gran === "day"
        ? todayKey(d)
        : gran === "week"
          ? todayKey(weekStart(d))
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const labelOf = (k: string) =>
      gran === "month"
        ? new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, 1).toLocaleDateString(
            undefined,
            spanDays > 730 ? { month: "short", year: "2-digit" } : { month: "short" },
          )
        : new Date(k + "T00:00:00").toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

    // one bucket per day / week / month inside the window
    const buckets: Bucket[] = [];
    const index = new Map<string, Bucket>();
    const cursor = gran === "week" ? weekStart(from) : new Date(from);
    while (cursor <= today) {
      const k = keyOf(cursor);
      if (!index.has(k)) {
        const b = { label: labelOf(k), minutes: 0, sessions: 0 };
        index.set(k, b);
        buckets.push(b);
      }
      if (gran === "day") cursor.setDate(cursor.getDate() + 1);
      else if (gran === "week") cursor.setDate(cursor.getDate() + 7);
      else {
        cursor.setDate(1);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }
    for (const s of stats.sessions) {
      const b = index.get(keyOf(new Date(s.date + "T00:00:00")));
      if (b) {
        b.minutes += s.minutes;
        b.sessions += 1;
      }
    }

    let acc = 0;
    const daily = buckets.map((b) => ({ label: b.label, minutes: b.minutes }));
    const weekly = buckets.map((b) => ({ label: b.label, sessions: b.sessions }));
    const monthly = buckets.map((b) => ({ label: b.label, minutes: (acc += b.minutes) }));

    const rangeLabel = range === "7" ? "Last 7 days" : range === "30" ? "Last 30 days" : "All time";
    const per = gran === "day" ? "per day" : gran === "week" ? "per week" : "per month";
    const meta = {
      daily: { title: "Focus Time", subtitle: `${rangeLabel} · minutes ${per}` },
      weekly: { title: "Sessions", subtitle: `${rangeLabel} · ${per}` },
      monthly: { title: "Cumulative Focus", subtitle: `${rangeLabel} · running minutes` },
    };

    return { daily, weekly, monthly, weekSessions: weekSessions.length, weekMinutes, meta };
  }, [stats.sessions, range]);

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

      <div className="flex justify-end">
        <div
          role="group"
          aria-label="Analytics time range"
          className="glass flex items-center gap-1 rounded-full p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.id}
              type="button"
              aria-pressed={range === r.id}
              onClick={() => setRange(r.id)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                range === r.id
                  ? "bg-white/10 text-white"
                  : "text-white/45 hover:text-white/75",
              )}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <Suspense fallback={<div className="glass rounded-3xl p-12 text-center text-white/40">Loading charts…</div>}>
        <Charts
          daily={data.daily}
          weekly={data.weekly}
          monthly={data.monthly}
          meta={data.meta}
        />
      </Suspense>
    </div>
  );
}
