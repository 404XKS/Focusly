import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, BarChart3, Settings as SettingsIcon, Trophy, Sparkles, ListTodo, Timer as TimerIcon, Target, Clock, CheckCircle2 } from "lucide-react";
import { todayKey } from "@/utils/helpers";
import { AmbientBackground } from "@/components/AmbientBackground";
import { Timer } from "@/components/Timer";
import { TaskManager } from "@/components/TaskManager";
import { StatsCards } from "@/components/StatsCards";
import { Analytics } from "@/components/Analytics";
import { Achievements } from "@/components/Achievements";
import { SettingsPanel } from "@/components/SettingsPanel";
import { FocusGalaxy } from "@/components/FocusGalaxy";
import { Heatmap } from "@/components/Heatmap";
import { Insights } from "@/components/Insights";
import { QuoteToast } from "@/components/QuoteToast";
import { ShortcutsModal } from "@/components/ShortcutsModal";
import { useFocusly } from "@/contexts/FocuslyContext";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Focusly — Timer" },
      { name: "description", content: "Focus with the Pomodoro technique. Track sessions, tasks, streaks and productivity insights." },
      { property: "og:title", content: "Focusly — Timer" },
      { property: "og:description", content: "Focus with the Pomodoro technique. Track sessions, tasks, streaks and productivity insights." },
    ],
  }),
  component: AppPage,
});

type Tab = "dashboard" | "tasks" | "analytics" | "achievements" | "galaxy" | "settings";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "Dashboard", icon: TimerIcon },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "achievements", label: "Achievements", icon: Trophy },
  { id: "galaxy", label: "Galaxy", icon: Sparkles },
  { id: "settings", label: "Settings", icon: SettingsIcon },
];

function AppPage() {
  const { settings, focusMode } = useFocusly();
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10">
        <AmbientBackground mode={settings.ambient} />
        <AnimatePresence>
          {focusMode && (
            <motion.div key="dim" className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} />
          )}
        </AnimatePresence>
      </div>

      <QuoteToast />

      <AnimatePresence mode="wait">
        {focusMode ? (
          <motion.main key="focus"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative flex min-h-screen flex-col items-center justify-center px-6 py-16">
            <motion.div className="absolute inset-0 pointer-events-none"
              animate={{ opacity: [0.35, 0.6, 0.35] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(139,92,246,0.15), transparent 60%)" }} />
            <Timer />
            <ShortcutsModalWrap />
          </motion.main>
        ) : (
          <motion.main key="full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="relative mx-auto max-w-7xl px-4 md:px-6 py-6 md:py-10">
            <header className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <Link to="/" className="glass inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm text-white/70 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> Focusly
              </Link>
              <div className="glass rounded-full p-1 flex items-center gap-1 overflow-x-auto max-w-full">
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)}
                    className={`relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs md:text-sm whitespace-nowrap ${tab === t.id ? "text-white" : "text-white/60 hover:text-white/90"}`}>
                    {tab === t.id && (
                      <motion.span layoutId="tab-pill" className="absolute inset-0 rounded-full"
                        style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.6), rgba(59,130,246,0.6))" }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                    )}
                    <t.icon className="relative h-3.5 w-3.5" />
                    <span className="relative">{t.label}</span>
                  </button>
                ))}
              </div>
              <ShortcutsModalWrap />
            </header>

            <AnimatePresence mode="wait">
              <motion.section key={tab}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}>
                {tab === "dashboard" && (
                  <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
                    <div className="glass rounded-3xl p-6 md:p-10 flex items-center justify-center">
                      <Timer />
                    </div>
                    <div className="space-y-4">
                      <TodayFocus />
                      <StatsCards />
                      <Insights />
                    </div>
                  </div>
                )}
                {tab === "tasks" && (
                  <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                    <TaskManager />
                    <div className="glass rounded-3xl p-6 md:p-10 flex items-center justify-center">
                      <Timer compact />
                    </div>
                  </div>
                )}
                {tab === "analytics" && (
                  <div className="space-y-4">
                    <StatsCards />
                    <Analytics />
                    <Heatmap />
                  </div>
                )}
                {tab === "achievements" && <Achievements />}
                {tab === "galaxy" && (
                  <div className="grid gap-4 lg:grid-cols-2">
                    <FocusGalaxy />
                    <Heatmap />
                  </div>
                )}
                {tab === "settings" && <SettingsPanel />}
              </motion.section>
            </AnimatePresence>

            <footer className="mt-12 py-6 text-center text-xs text-white/40">
              Made with ❤️ for focused minds.
            </footer>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

function ShortcutsModalWrap() {
  return <ShortcutsModal />;
}
