import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment, useEffect, useState } from "react";
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
      <div className="fixed inset-0 pointer-events-none">
        <AmbientBackground mode={settings.ambient} />
        <AnimatePresence>
          {focusMode && (
            <motion.div key="dim" className="absolute inset-0 bg-black"
              initial={{ opacity: 0 }} animate={{ opacity: 0.55 }} exit={{ opacity: 0 }} />
          )}
        </AnimatePresence>
      </div>

      <QuoteToast />
      <SessionRecovery />

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

function TodayFocus() {
  const { stats, activeTask } = useFocusly();
  const today = todayKey();
  const todaySessions = stats.sessions.filter((s) => s.date === today);
  const todayMinutes = todaySessions.reduce((a, b) => a + b.minutes, 0);

  const progress = activeTask && activeTask.estimated > 0
    ? Math.min(1, activeTask.completed / activeTask.estimated)
    : 0;

  const rows = [
    { icon: Clock, label: "Focus minutes", value: `${todayMinutes}m` },
    { icon: CheckCircle2, label: "Sessions completed", value: String(todaySessions.length) },
    { icon: Target, label: "Active task", value: activeTask ? `${activeTask.title} · ${activeTask.completed}/${activeTask.estimated}` : "None selected", taskId: activeTask?.id },
  ];

  return (
    <div className="glass rounded-2xl p-4">
      <div className="text-xs text-white/50 font-display">Today's Focus</div>
      <div className="mt-3 space-y-2.5">
        {rows.map((r) => {
          const task = activeTask && r.taskId === activeTask.id ? activeTask : undefined;
          return (
            <Fragment key={r.label}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-white/50 min-w-0">
                  <r.icon className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.label}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <div className="text-sm text-white/90 truncate text-right">{r.value}</div>
                </div>
              </div>
              {task && (
                <div className="h-1 w-full rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${Math.round(progress * 100)}%` }} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ShortcutsModalWrap() {
  const { cloudUser, signOut } = useFocusly();
  return (
    <div className="flex items-center gap-2">
      {cloudUser ? (
        <button onClick={signOut} title={cloudUser.email ?? ""} className="glass rounded-full px-3 py-2 text-xs text-white/70 hover:text-white">
          Synced · Sign out
        </button>
      ) : (
        <Link to="/auth" className="glass rounded-full px-3 py-2 text-xs text-white/70 hover:text-white">Sign in to save</Link>
      )}
      <ShortcutsModal />
    </div>
  );
}

/** Restore notice + save/discard choice for a focus session that was interrupted. */
function SessionRecovery() {
  const { restoredMessage, clearRestored, pendingRun, savePendingRun, discardPendingRun } = useFocusly();

  useEffect(() => {
    if (!restoredMessage) return;
    const id = window.setTimeout(clearRestored, 6000);
    return () => window.clearTimeout(id);
  }, [restoredMessage, clearRestored]);

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {restoredMessage && (
          <motion.div key="restored"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass pointer-events-auto rounded-full px-4 py-2 text-xs text-white/80">
            {restoredMessage}
          </motion.div>
        )}
        {pendingRun && (
          <motion.div key="pending"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="glass pointer-events-auto flex flex-wrap items-center justify-center gap-3 rounded-2xl px-4 py-3 text-xs text-white/80">
            <span>Unfinished focus session — {pendingRun.minutes} min worked. Save it?</span>
            <div className="flex items-center gap-2">
              <button onClick={savePendingRun}
                className="rounded-full px-3 py-1.5 font-medium text-white"
                style={{ background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))" }}>
                Save
              </button>
              <button onClick={discardPendingRun} className="rounded-full px-3 py-1.5 text-white/60 hover:text-white">
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
