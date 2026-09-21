import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Mode, Settings, Stats, Task, SessionRecord } from "@/utils/types";
import { todayKey, clampInt, isDateKey, computeStreaks } from "@/utils/helpers";
import { randomQuote } from "@/utils/quotes";

const DEFAULT_SETTINGS: Settings = {
  focus: 25,
  short: 5,
  long: 15,
  autoStart: false,
  autoStartBreaks: true,
  sound: true,
  ticking: false,
  desktopNotifications: false,
  ambient: "space",
};

const DEFAULT_STATS: Stats = {
  totalSessions: 0,
  totalFocusMinutes: 0,
  currentStreak: 0,
  longestStreak: 0,
  earlyBird: false,
  nightOwl: false,
  sessions: [],
  unlocked: [],
};

const AMBIENTS: Settings["ambient"][] = ["space", "rain", "library", "forest", "cafe"];

type Ctx = {
  mode: Mode;
  setMode: (m: Mode) => void;
  running: boolean;
  remaining: number;   // seconds
  duration: number;    // seconds
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  stats: Stats;
  tasks: Task[];
  addTask: (t: Omit<Task, "id" | "completed" | "done">) => void;
  toggleTask: (id: string) => void;
  removeTask: (id: string) => void;
  activeTaskId: string | null;
  setActiveTaskId: (id: string | null) => void;
  startTaskFocus: (id: string) => void;
  activeTask: Task | null;
  focusMode: boolean;
  setFocusMode: (b: boolean) => void;
  lastQuote: string | null;
  clearQuote: () => void;
  cycle: number;
  restoredMessage: string | null;
  clearRestored: () => void;
  pendingRun: PendingRun | null;
  savePendingRun: () => void;
  discardPendingRun: () => void;
};

/** A focus/break run persisted across reloads, driven by wall-clock timestamps. */
export type ActiveRun = {
  id: string;
  mode: Mode;
  taskId: string | null;
  startedAt: number;
  endAt: number;
  durationSec: number;
  remainingSec: number;
  status: "running" | "paused";
};

/** An interrupted focus run kept around so the user can decide what to do with it. */
export type PendingRun = {
  id: string;
  minutes: number;
  startedAt: number;
};

const FocuslyCtx = createContext<Ctx | null>(null);

/* ------------------------------ safe loading ------------------------------ */

function readJSON(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function sanitizeSettings(raw: unknown): Settings {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    focus: clampInt(o.focus, 1, 180, DEFAULT_SETTINGS.focus),
    short: clampInt(o.short, 1, 90, DEFAULT_SETTINGS.short),
    long: clampInt(o.long, 1, 120, DEFAULT_SETTINGS.long),
    autoStart: bool(o.autoStart, DEFAULT_SETTINGS.autoStart),
    autoStartBreaks: bool(o.autoStartBreaks, DEFAULT_SETTINGS.autoStartBreaks),
    sound: bool(o.sound, DEFAULT_SETTINGS.sound),
    ticking: bool(o.ticking, DEFAULT_SETTINGS.ticking),
    desktopNotifications: bool(o.desktopNotifications, DEFAULT_SETTINGS.desktopNotifications),
    ambient: AMBIENTS.includes(o.ambient as Settings["ambient"]) ? (o.ambient as Settings["ambient"]) : DEFAULT_SETTINGS.ambient,
  };
}

function sanitizeSessions(raw: unknown): SessionRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: SessionRecord[] = [];
  for (const r of raw) {
    if (!r || typeof r !== "object") continue;
    const o = r as Record<string, unknown>;
    if (!isDateKey(o.date)) continue;
    const minutes = clampInt(o.minutes, 0, 600, 0);
    if (minutes <= 0) continue;
    const ts = typeof o.timestamp === "number" && Number.isFinite(o.timestamp) ? o.timestamp : new Date(o.date + "T12:00:00").getTime();
    const d = new Date(ts);
    out.push({
      date: o.date,
      timestamp: ts,
      minutes,
      hour: clampInt(o.hour, 0, 23, d.getHours()),
      weekday: clampInt(o.weekday, 0, 6, d.getDay()),
    });
  }
  return out.sort((a, b) => a.timestamp - b.timestamp);
}

/** Recompute every derived stat from the session log — the single source of truth. */
function deriveStats(sessions: SessionRecord[], unlocked: string[], prev?: Partial<Stats>): Stats {
  const { current, longest } = computeStreaks(sessions.map((s) => s.date));
  return {
    sessions,
    unlocked,
    totalSessions: sessions.length,
    totalFocusMinutes: sessions.reduce((a, b) => a + b.minutes, 0),
    currentStreak: current,
    longestStreak: Math.max(longest, clampInt(prev?.longestStreak, 0, 100000, 0)),
    earlyBird: sessions.some((s) => s.hour < 8),
    nightOwl: sessions.some((s) => s.hour >= 22),
  };
}

function sanitizeStats(raw: unknown): Stats {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sessions = sanitizeSessions(o.sessions);
  const unlocked = Array.isArray(o.unlocked) ? o.unlocked.filter((x): x is string => typeof x === "string") : [];
  return deriveStats(sessions, unlocked, { longestStreak: clampInt(o.longestStreak, 0, 100000, 0) });
}

function sanitizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  const prios: Task["priority"][] = ["low", "medium", "high"];
  return raw.flatMap((r) => {
    if (!r || typeof r !== "object") return [];
    const o = r as Record<string, unknown>;
    if (typeof o.title !== "string" || !o.title.trim()) return [];
    return [{
      id: typeof o.id === "string" && o.id ? o.id : `task-${Math.random().toString(36).slice(2)}`,
      title: o.title,
      priority: prios.includes(o.priority as Task["priority"]) ? (o.priority as Task["priority"]) : "medium",
      estimated: clampInt(o.estimated, 1, 50, 1),
      completed: clampInt(o.completed, 0, 999, 0),
      done: typeof o.done === "boolean" ? o.done : false,
    }];
  });
}

function saveLS<T>(key: string, v: T) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* storage full or blocked */ }
}

function removeLS(key: string) {
  try { localStorage.removeItem(key); } catch { /* ignore */ }
}

const RUN_KEY = "focusly:run";
const PENDING_KEY = "focusly:pending-run";
const RECORDED_KEY = "focusly:recorded-runs";
const MODES: Mode[] = ["focus", "short", "long"];

function newId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `run-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeRun(raw: unknown): ActiveRun | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  const startedAt = num(o.startedAt);
  const endAt = num(o.endAt);
  const durationSec = num(o.durationSec);
  if (!startedAt || !endAt || !durationSec || durationSec <= 0) return null;
  if (typeof o.id !== "string" || !o.id) return null;
  if (!MODES.includes(o.mode as Mode)) return null;
  return {
    id: o.id,
    mode: o.mode as Mode,
    taskId: typeof o.taskId === "string" ? o.taskId : null,
    startedAt,
    endAt,
    durationSec: Math.round(durationSec),
    remainingSec: Math.max(0, Math.round(num(o.remainingSec) ?? 0)),
    status: o.status === "paused" ? "paused" : "running",
  };
}

function sanitizePending(raw: unknown): PendingRun | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const minutes = clampInt(o.minutes, 1, 600, 0);
  if (minutes < 1 || typeof o.id !== "string" || !o.id) return null;
  const startedAt = typeof o.startedAt === "number" && Number.isFinite(o.startedAt) ? o.startedAt : Date.now();
  return { id: o.id, minutes, startedAt };
}

function sanitizeRecorded(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(-100) : [];
}

/* -------------------------------- provider -------------------------------- */

export function FocuslyProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [stats, setStats] = useState<Stats>(DEFAULT_STATS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [mode, setModeState] = useState<Mode>("focus");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(DEFAULT_SETTINGS.focus * 60);
  const [focusMode, setFocusMode] = useState(false);
  const [lastQuote, setLastQuote] = useState<string | null>(null);
  const [cycle, setCycle] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  const tickRef = useRef<number | null>(null);
  const endAtRef = useRef<number | null>(null);
  const autoStartRef = useRef<number | null>(null);
  const completingRef = useRef(false);

  const duration = useMemo(() => {
    const mins = mode === "focus" ? settings.focus : mode === "short" ? settings.short : settings.long;
    return clampInt(mins, 1, 180, 25) * 60;
  }, [mode, settings]);

  // Hydrate from localStorage (sanitized; malformed data falls back to defaults)
  useEffect(() => {
    const s = sanitizeSettings(readJSON("focusly:settings"));
    const st = sanitizeStats(readJSON("focusly:stats"));
    const t = sanitizeTasks(readJSON("focusly:tasks"));
    let active: string | null = null;
    try { active = localStorage.getItem("focusly:active"); } catch { active = null; }
    setSettings(s);
    setStats(st);
    setTasks(t);
    setActiveTaskId(t.some((x) => x.id === active) ? active : null);
    setRemaining(s.focus * 60);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveLS("focusly:settings", settings); }, [settings, hydrated]);
  useEffect(() => { if (hydrated) saveLS("focusly:stats", stats); }, [stats, hydrated]);
  useEffect(() => { if (hydrated) saveLS("focusly:tasks", tasks); }, [tasks, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    try {
      if (activeTaskId) localStorage.setItem("focusly:active", activeTaskId);
      else localStorage.removeItem("focusly:active");
    } catch { /* ignore */ }
  }, [activeTaskId, hydrated]);

  // Keep streaks correct across midnight / days with no sessions.
  useEffect(() => {
    if (!hydrated) return;
    const sync = () => setStats((p) => {
      const { current, longest } = computeStreaks(p.sessions.map((s) => s.date));
      const longestStreak = Math.max(p.longestStreak, longest);
      if (p.currentStreak === current && p.longestStreak === longestStreak) return p;
      return { ...p, currentStreak: current, longestStreak };
    });
    sync();
    const id = window.setInterval(sync, 60_000);
    const onVis = () => { if (!document.hidden) sync(); };
    document.addEventListener("visibilitychange", onVis);
    return () => { window.clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [hydrated]);

  // Reset remaining when mode or configured durations change and the timer is idle
  useEffect(() => {
    if (!running) setRemaining(duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.focus, settings.short, settings.long]);

  const playBeep = useCallback(() => {
    if (!settings.sound) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      const ctx = new AC();
      const notes = [660, 880, 990];
      notes.forEach((f, i) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = f;
        o.type = "sine";
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.14;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.25, t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        o.start(t); o.stop(t + 0.4);
      });
      window.setTimeout(() => { try { ctx.close(); } catch { /* ignore */ } }, 1500);
    } catch { /* audio unavailable — never block the timer */ }
  }, [settings.sound]);

  const notify = useCallback((title: string, body: string) => {
    if (!settings.desktopNotifications) return;
    try {
      if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
      new Notification(title, { body });
    } catch { /* notifications unavailable */ }
  }, [settings.desktopNotifications]);

  const recordSession = useCallback((mins: number) => {
    const now = new Date();
    const rec: SessionRecord = {
      date: todayKey(now),
      timestamp: now.getTime(),
      minutes: clampInt(mins, 1, 600, 25),
      hour: now.getHours(),
      weekday: now.getDay(),
    };
    setStats((prev) => deriveStats([...prev.sessions, rec], prev.unlocked, prev));
  }, []);

  const clearTimer = useCallback(() => {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }, []);

  const startInternal = useCallback((dur: number) => {
    endAtRef.current = Date.now() + Math.max(1, dur) * 1000;
    setRemaining(Math.max(1, dur));
    setRunning(true);
  }, []);

  const scheduleAutoStart = useCallback((dur: number) => {
    if (autoStartRef.current !== null) window.clearTimeout(autoStartRef.current);
    autoStartRef.current = window.setTimeout(() => {
      autoStartRef.current = null;
      startInternal(dur);
    }, 250);
  }, [startInternal]);

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  /**
   * Advance to the next interval.
   * `completed` is true only when the timer genuinely reached 00:00 —
   * skipping, resetting or pausing must never record a session.
   */
  const advance = useCallback((completed: boolean) => {
    if (completingRef.current) return;   // guard against double-fire
    completingRef.current = true;
    try {
      clearTimer();
      endAtRef.current = null;
      setRunning(false);

      if (mode === "focus") {
        if (completed) {
          recordSession(settings.focus);
          if (activeTaskId) {
            setTasks((prev) => prev.map((t) => {
              if (t.id !== activeTaskId || t.done) return t;
              const completedCount = Math.min(t.estimated, t.completed + 1);
              return { ...t, completed: completedCount, done: completedCount >= t.estimated };
            }));
          }
          setLastQuote(randomQuote());
          playBeep();
          notify("Focus session complete", activeTask ? `Finished: ${activeTask.title}` : "Take a well-deserved break.");
        }
        const nextCycle = completed ? cycle + 1 : cycle;
        setCycle(nextCycle);
        const nextMode: Mode = completed && nextCycle % 4 === 0 ? "long" : "short";
        setModeState(nextMode);
        const nextDur = (nextMode === "long" ? settings.long : settings.short) * 60;
        setRemaining(nextDur);
        if (completed && settings.autoStartBreaks) scheduleAutoStart(nextDur);
      } else {
        if (completed) {
          playBeep();
          notify("Break over", "Ready for another focus session?");
        }
        setModeState("focus");
        const nextDur = settings.focus * 60;
        setRemaining(nextDur);
        if (completed && settings.autoStart) scheduleAutoStart(nextDur);
      }
    } finally {
      completingRef.current = false;
    }
  }, [mode, cycle, settings, activeTaskId, activeTask, clearTimer, recordSession, playBeep, notify, scheduleAutoStart]);

  // Always call the freshest advance() from the interval, without restarting it.
  const advanceRef = useRef(advance);
  useEffect(() => { advanceRef.current = advance; }, [advance]);

  const start = useCallback(() => {
    if (running) return;
    if (settings.desktopNotifications && typeof Notification !== "undefined" && Notification.permission === "default") {
      try { Notification.requestPermission().catch(() => {}); } catch { /* ignore */ }
    }
    startInternal(remaining > 0 ? remaining : duration);
  }, [running, remaining, duration, settings.desktopNotifications, startInternal]);

  const pause = useCallback(() => {
    if (endAtRef.current !== null) {
      setRemaining(Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000)));
    }
    endAtRef.current = null;
    setRunning(false);
  }, []);

  const reset = useCallback(() => {
    if (autoStartRef.current !== null) { window.clearTimeout(autoStartRef.current); autoStartRef.current = null; }
    endAtRef.current = null;
    setRunning(false);
    setRemaining(duration);
  }, [duration]);

  const skip = useCallback(() => {
    if (autoStartRef.current !== null) { window.clearTimeout(autoStartRef.current); autoStartRef.current = null; }
    advance(false);
  }, [advance]);

  const setMode = useCallback((m: Mode) => {
    if (autoStartRef.current !== null) { window.clearTimeout(autoStartRef.current); autoStartRef.current = null; }
    endAtRef.current = null;
    setRunning(false);
    setModeState(m);
  }, []);

  /** Select a task, switch to focus mode and start the timer in one action. */
  const startTaskFocus = useCallback((id: string) => {
    setTasks((prev) => {
      if (!prev.some((t) => t.id === id && !t.done)) return prev;
      setActiveTaskId(id);
      if (autoStartRef.current !== null) { window.clearTimeout(autoStartRef.current); autoStartRef.current = null; }
      setModeState("focus");
      startInternal(clampInt(settings.focus, 1, 180, 25) * 60);
      return prev;
    });
  }, [settings.focus, startInternal]);

  // Single ticker, deadline-based so background throttling cannot cause drift.
  useEffect(() => {
    if (!running) { clearTimer(); return; }
    const tick = () => {
      if (endAtRef.current === null) return;
      const rem = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) advanceRef.current(true);
    };
    clearTimer();
    tickRef.current = window.setInterval(tick, 250);
    // Catch up instantly when a throttled tab becomes visible again.
    const onVis = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      clearTimer();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [running, clearTimer]);

  // Clear any pending auto-start on unmount
  useEffect(() => () => {
    if (autoStartRef.current !== null) window.clearTimeout(autoStartRef.current);
  }, []);

  // Ticking sound (focus only); failures are swallowed.
  useEffect(() => {
    if (!settings.ticking || !running || mode !== "focus") return;
    let ctx: AudioContext | null = null;
    const int = window.setInterval(() => {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        if (!ctx) ctx = new AC();
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.frequency.value = 1200;
        o.type = "square";
        o.connect(g); g.connect(ctx.destination);
        const t = ctx.currentTime;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.05, t + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
        o.start(t); o.stop(t + 0.06);
      } catch { /* ignore */ }
    }, 1000);
    return () => {
      window.clearInterval(int);
      try { ctx?.close(); } catch { /* ignore */ }
    };
  }, [settings.ticking, running, mode]);

  // Achievement unlocking — derived from stats, written only when the set changes.
  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;
    import("@/utils/achievements").then(({ ACHIEVEMENTS }) => {
      if (cancelled) return;
      setStats((p) => {
        const next = ACHIEVEMENTS.filter((a) => a.unlocked(p)).map((a) => a.id);
        const merged = Array.from(new Set([...p.unlocked.filter((id) => ACHIEVEMENTS.some((a) => a.id === id)), ...next]));
        if (merged.length === p.unlocked.length && merged.every((id) => p.unlocked.includes(id))) return p;
        return { ...p, unlocked: merged };
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [hydrated, stats.totalSessions, stats.totalFocusMinutes, stats.longestStreak, stats.earlyBird, stats.nightOwl]);

  const addTask: Ctx["addTask"] = useCallback((t) => {
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `task-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTasks((prev) => [{ id, completed: 0, done: false, ...t }, ...prev]);
  }, []);
  const toggleTask = useCallback((id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))), []);
  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setActiveTaskId((cur) => (cur === id ? null : cur));
  }, []);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings((p) => sanitizeSettings({ ...p, ...s }));
  }, []);

  const value: Ctx = {
    mode, setMode, running, remaining, duration,
    start, pause, reset, skip,
    settings, updateSettings,
    stats,
    tasks, addTask, toggleTask, removeTask,
    activeTaskId, setActiveTaskId, startTaskFocus, activeTask,
    focusMode, setFocusMode,
    lastQuote, clearQuote: () => setLastQuote(null),
    cycle,
  };

  return <FocuslyCtx.Provider value={value}>{children}</FocuslyCtx.Provider>;
}

export function useFocusly() {
  const c = useContext(FocuslyCtx);
  if (!c) throw new Error("useFocusly must be inside FocuslyProvider");
  return c;
}
