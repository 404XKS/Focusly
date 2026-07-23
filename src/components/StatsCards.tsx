import { motion } from "motion/react";
import { Flame, Timer as TimerIcon, Trophy, CheckCircle2, TrendingUp } from "lucide-react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { AnimatedNumber } from "./ui-bits";
import { todayKey } from "@/utils/helpers";

export function StatsCards() {
  const { stats } = useFocusly();
  const today = todayKey();
  const todaySessions = stats.sessions.filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((a, b) => a + b.minutes, 0);

  // weekly progress: last 7 days
  const weeklyMins = (() => {
    const days: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = todayKey(d);
      days.push(stats.sessions.filter((s) => s.date === k).reduce((a, b) => a + b.minutes, 0));
    }
    return days;
  })();
  const weekTotal = weeklyMins.reduce((a, b) => a + b, 0);
  const weekMax = Math.max(...weeklyMins, 1);

  const cards = [
    { label: "Sessions Today", value: todaySessions.length, icon: CheckCircle2 },
    { label: "Focus Minutes", value: todayMinutes, icon: TimerIcon, suffix: "m" },
    { label: "Current Streak", value: stats.currentStreak, icon: Flame, suffix: "d" },
    { label: "Longest Streak", value: stats.longestStreak, icon: Trophy, suffix: "d" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <motion.div key={c.label} className="glass rounded-2xl p-4"
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <c.icon className="h-3.5 w-3.5" /> {c.label}
          </div>
          <div className="mt-2 font-display text-3xl font-semibold text-gradient">
            <AnimatedNumber value={c.value} />{c.suffix || ""}
          </div>
        </motion.div>
      ))}

      <motion.div className="glass rounded-2xl p-4 col-span-2 md:col-span-4"
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <TrendingUp className="h-3.5 w-3.5" /> Weekly Progress
          </div>
          <div className="text-xs text-white/60">
            <AnimatedNumber value={weekTotal} /> min total
          </div>
        </div>
        <div className="mt-3 grid grid-cols-7 gap-2">
          {weeklyMins.map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="flex h-24 w-full items-end">
                <motion.div
                  className="w-full rounded-md"
                  style={{ background: "linear-gradient(180deg, rgb(139,92,246), rgb(59,130,246))" }}
                  initial={{ height: 0 }}
                  animate={{ height: `${(m / weekMax) * 100}%` }}
                  transition={{ duration: 0.6, delay: 0.05 * i }}
                />
              </div>
              <div className="text-[10px] text-white/40">
                {["S","M","T","W","T","F","S"][new Date(Date.now() - (6 - i) * 86400000).getDay()]}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
