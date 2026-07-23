import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, SkipForward, Maximize2, Minimize2 } from "lucide-react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { fmt } from "@/utils/helpers";
import type { Mode } from "@/utils/types";

const MODES: { id: Mode; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "short", label: "Short Break" },
  { id: "long", label: "Long Break" },
];

export function Timer({ compact = false }: { compact?: boolean }) {
  const { mode, setMode, remaining, duration, running, start, pause, reset, skip, focusMode, setFocusMode, activeTask } = useFocusly();

  const size = compact ? 260 : 360;
  const stroke = compact ? 10 : 14;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const progress = 1 - remaining / Math.max(1, duration);
  const dash = c * progress;

  return (
    <div className="flex flex-col items-center gap-8">
      {!compact && (
        <div className="glass inline-flex rounded-full p-1">
          {MODES.map((m) => (
            <button key={m.id}
              onClick={() => setMode(m.id)}
              className={`relative px-5 py-2 text-sm font-medium rounded-full transition-colors ${mode === m.id ? "text-white" : "text-white/60 hover:text-white/90"}`}
              aria-pressed={mode === m.id}>
              {mode === m.id && (
                <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-full"
                  style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.7), rgba(59,130,246,0.7))" }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }} />
              )}
              <span className="relative">{m.label}</span>
            </button>
          ))}
        </div>
      )}

      {activeTask && (
        <motion.div layout className="glass rounded-full px-4 py-2 text-sm text-white/80">
          <span className="text-white/50 mr-2">Working on</span>
          <span className="font-medium">{activeTask.title}</span>
          <span className="ml-2 text-xs text-white/50">{activeTask.completed}/{activeTask.estimated}</span>
        </motion.div>
      )}

      <div className="relative ring-orbit" style={{ width: size, height: size }}>
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ scale: running ? [1, 1.02, 1] : 1, opacity: running ? [0.6, 0.9, 0.6] : 0.5 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "radial-gradient(circle, rgba(139,92,246,0.35), transparent 65%)" }}
        />
        <svg width={size} height={size} className="relative -rotate-90">
          <defs>
            <linearGradient id="ring-grad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c4a3ff" />
              <stop offset="55%" stopColor="#7ea8ff" />
              <stop offset="100%" stopColor="#6ee7ff" />
            </linearGradient>
          </defs>
          <circle cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} stroke="rgba(255,255,255,0.06)" fill="none" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={r}
            strokeWidth={stroke} stroke="url(#ring-grad)" fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            animate={{ strokeDashoffset: c - dash }}
            transition={{ duration: 0.4, ease: "linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs uppercase tracking-[0.3em] text-white/50">
            {MODES.find((m) => m.id === mode)?.label}
          </div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={remaining}
              initial={{ y: 6, opacity: 0.6 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -6, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-2 font-display text-6xl md:text-7xl font-semibold tabular-nums text-gradient"
            >
              {fmt(remaining)}
            </motion.div>
          </AnimatePresence>
          <div className="mt-3 text-xs text-white/40">{Math.round(progress * 100)}%</div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={reset} aria-label="Reset"
          className="glass rounded-full p-3 text-white/80 hover:text-white transition hover:scale-105 active:scale-95">
          <RotateCcw className="h-5 w-5" />
        </button>
        <motion.button
          onClick={running ? pause : start}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          className="glow-purple relative inline-flex items-center gap-2 rounded-full px-8 py-4 text-base font-medium text-white"
          style={{ background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))" }}
          aria-label={running ? "Pause" : "Start"}
        >
          {running ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          {running ? "Pause" : "Start"}
        </motion.button>
        <button onClick={skip} aria-label="Skip"
          className="glass rounded-full p-3 text-white/80 hover:text-white transition hover:scale-105 active:scale-95">
          <SkipForward className="h-5 w-5" />
        </button>
        <button onClick={() => setFocusMode(!focusMode)} aria-label="Toggle focus mode"
          className="glass rounded-full p-3 text-white/80 hover:text-white transition hover:scale-105 active:scale-95">
          {focusMode ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );
}
