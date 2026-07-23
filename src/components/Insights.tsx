import { useMemo } from "react";
import { motion } from "motion/react";
import { Lightbulb } from "lucide-react";
import { useFocusly } from "@/contexts/FocuslyContext";

export function Insights() {
  const { stats } = useFocusly();

  const insights = useMemo(() => {
    const out: string[] = [];
    if (stats.sessions.length === 0) {
      return ["Complete a few focus sessions to unlock personalized insights."];
    }
    // best hour bucket
    const hours = new Array(24).fill(0) as number[];
    stats.sessions.forEach((s) => { hours[s.hour]++; });
    const bestHour = hours.indexOf(Math.max(...hours));
    const fmtHour = (h: number) => {
      const d = new Date(); d.setHours(h, 0, 0, 0);
      return d.toLocaleTimeString(undefined, { hour: "numeric" });
    };
    out.push(`You focus best around ${fmtHour(bestHour)}–${fmtHour((bestHour + 2) % 24)}.`);

    // best weekday
    const wd = new Array(7).fill(0) as number[];
    stats.sessions.forEach((s) => { wd[s.weekday]++; });
    const bestWd = wd.indexOf(Math.max(...wd));
    const wdNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    out.push(`${wdNames[bestWd]} is your most productive day.`);

    // month total
    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const monthSessions = stats.sessions.filter((s) => s.date.startsWith(monthKey)).length;
    out.push(`You completed ${monthSessions} session${monthSessions === 1 ? "" : "s"} this month.`);

    // avg uninterrupted (approx = avg session length)
    const avg = Math.round(stats.totalFocusMinutes / Math.max(1, stats.totalSessions));
    out.push(`Your average focus session is ${avg} minute${avg === 1 ? "" : "s"}.`);
    return out;
  }, [stats]);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {insights.map((s, i) => (
        <motion.div key={i} className="glass rounded-2xl p-4 flex gap-3"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="rounded-xl p-2 h-fit"
            style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.4), rgba(59,130,246,0.4))" }}>
            <Lightbulb className="h-4 w-4 text-white" />
          </div>
          <p className="text-sm text-white/85">{s}</p>
        </motion.div>
      ))}
    </div>
  );
}
