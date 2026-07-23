import { motion } from "motion/react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { ACHIEVEMENTS, focusScore } from "@/utils/achievements";
import { Sparkles, Rocket, Target, Trophy, Flame, Sunrise, Moon, Lock, Award } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ICONS: Record<string, LucideIcon> = { Sparkles, Rocket, Target, Trophy, Flame, Sunrise, Moon };

export function Achievements() {
  const { stats } = useFocusly();
  const { score, rank, next } = focusScore(stats);

  return (
    <div className="space-y-4">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-white/40">Focus Score</div>
            <div className="mt-1 flex items-baseline gap-3">
              <div className="font-display text-5xl font-semibold text-gradient">{score}</div>
              <div className="rounded-full glass px-3 py-1 text-xs">{rank}</div>
            </div>
            {next && <div className="mt-2 text-xs text-white/50">Next rank: {next}</div>}
          </div>
          <Award className="h-10 w-10 text-brand" />
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <motion.div className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #c4a3ff, #7ea8ff, #6ee7ff)" }}
            initial={{ width: 0 }} animate={{ width: `${Math.min(100, (score / 1000) * 100)}%` }}
            transition={{ duration: 1 }} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((a, i) => {
          const unlocked = stats.unlocked.includes(a.id);
          const Icon = ICONS[a.icon] || Sparkles;
          return (
            <motion.div key={a.id}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`glass rounded-2xl p-4 relative overflow-hidden ${unlocked ? "" : "opacity-60"}`}>
              {unlocked && (
                <div className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(139,92,246,0.4), transparent 60%)" }} />
              )}
              <div className="flex items-start gap-3">
                <div className={`rounded-xl p-2.5 ${unlocked ? "text-white" : "text-white/40"}`}
                  style={{ background: unlocked ? "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5))" : "rgba(255,255,255,0.05)" }}>
                  {unlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-sm font-medium">{a.title}</div>
                  <div className="mt-0.5 text-xs text-white/50">{a.description}</div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
