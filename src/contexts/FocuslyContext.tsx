import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Mode, Settings, Stats, Task, SessionRecord } from "@/utils/types";
import { todayKey, daysBetween } from "@/utils/helpers";
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
  activeTask: Task | null;
  focusMode: boolean;
  setFocusMode: (b: boolean) => void;
  lastQuote: string | null;
  clearQuote: () => void;
  cycle: number;
};

const FocuslyCtx = createContext<Ctx | null>(null);

function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) } as T;
  } catch {
    return fallback;
  }
}
function saveLS<T>(key: string, v: T) {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch {}
}

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
  const tickAudioRef = useRef<HTMLAudioElement | null>(null);

  const duration = useMemo(() => {
    return (mode === "focus" ? settings.focus : mode === "short" ? settings.short : settings.long) * 60;
  }, [mode, settings]);

  // Hydrate
  useEffect(() => {
    const s = loadLS<Settings>("focusly:settings", DEFAULT_SETTINGS);
    const st = loadLS<Stats>("focusly:stats", DEFAULT_STATS);
    const t = (() => {
      try { return JSON.parse(localStorage.getItem("focusly:tasks") || "[]") as Task[]; } catch { return []; }
    })();
    const active = localStorage.getItem("focusly:active");
    setSettings(s);
    setStats(st);
    setTasks(t);
    setActiveTaskId(active);
    setRemaining(s.focus * 60);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) saveLS("focusly:settings", settings); }, [settings, hydrated]);
  useEffect(() => { if (hydrated) saveLS("focusly:stats", stats); }, [stats, hydrated]);
  useEffect(() => { if (hydrated) saveLS("focusly:tasks", tasks); }, [tasks, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    if (activeTaskId) localStorage.setItem("focusly:active", activeTaskId);
    else localStorage.removeItem("focusly:active");
  }, [activeTaskId, hydrated]);

  // Reset remaining when mode or duration changes and not running
  useEffect(() => {
    if (!running) setRemaining(duration);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, settings.focus, settings.short, settings.long]);

  const playBeep = () => {
    if (!settings.sound) return;
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
      setTimeout(() => ctx.close(), 1500);
    } catch {}
  };

  const notify = (title: string, body: string) => {
    if (!settings.desktopNotifications) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  };

  const recordSession = (mins: number) => {
    const now = new Date();
    const rec: SessionRecord = {
      date: todayKey(now),
      timestamp: now.getTime(),
      minutes: mins,
      hour: now.getHours(),
      weekday: now.getDay(),
    };
    setStats((prev) => {
      const sessions = [...prev.sessions, rec];
      const totalSessions = prev.totalSessions + 1;
      const totalFocusMinutes = prev.totalFocusMinutes + mins;
      // streak
      const dates = Array.from(new Set(sessions.map((s) => s.date))).sort();
      let currentStreak = 1;
      for (let i = dates.length - 2; i >= 0; i--) {
        if (daysBetween(dates[i], dates[i + 1]) === 1) currentStreak++;
        else break;
      }
      const lastDate = dates[dates.length - 1];
      if (daysBetween(lastDate, todayKey()) > 0) currentStreak = 0;
      const longestStreak = Math.max(prev.longestStreak, currentStreak);
      const earlyBird = prev.earlyBird || rec.hour < 8;
      const nightOwl = prev.nightOwl || rec.hour >= 22;
      return {
        ...prev,
        sessions,
        totalSessions,
        totalFocusMinutes,
        currentStreak,
        longestStreak,
        earlyBird,
        nightOwl,
      };
    });
  };

  const completeCurrent = () => {
    setRunning(false);
    endAtRef.current = null;
    if (mode === "focus") {
      recordSession(settings.focus);
      // increment task pomodoro
      if (activeTaskId) {
        setTasks((prev) => prev.map((t) => t.id === activeTaskId ? { ...t, completed: t.completed + 1 } : t));
      }
      setLastQuote(randomQuote());
      playBeep();
      notify("Focus session complete", "Take a well-deserved break.");
      const nextCycle = cycle + 1;
      setCycle(nextCycle);
      const nextMode: Mode = nextCycle % 4 === 0 ? "long" : "short";
      setModeState(nextMode);
      const nextDur = (nextMode === "long" ? settings.long : settings.short) * 60;
      setRemaining(nextDur);
      if (settings.autoStartBreaks) {
        setTimeout(() => startInternal(nextDur), 200);
      }
    } else {
      playBeep();
      notify("Break over", "Ready for another focus session?");
      setModeState("focus");
      const nextDur = settings.focus * 60;
      setRemaining(nextDur);
      if (settings.autoStart) setTimeout(() => startInternal(nextDur), 200);
    }
  };

  const clearTimer = () => {
    if (tickRef.current) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  };

  const startInternal = (dur: number) => {
    endAtRef.current = Date.now() + dur * 1000;
    setRunning(true);
  };

  const start = () => {
    if (running) return;
    if (settings.desktopNotifications && typeof Notification !== "undefined" && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
    startInternal(remaining);
  };

  const pause = () => {
    setRunning(false);
    endAtRef.current = null;
  };

  const reset = () => {
    setRunning(false);
    endAtRef.current = null;
    setRemaining(duration);
  };

  const skip = () => {
    completeCurrent();
  };

  const setMode = (m: Mode) => {
    setRunning(false);
    endAtRef.current = null;
    setModeState(m);
  };

  // ticker
  useEffect(() => {
    if (!running) { clearTimer(); return; }
    tickRef.current = window.setInterval(() => {
      if (!endAtRef.current) return;
      const rem = Math.max(0, Math.round((endAtRef.current - Date.now()) / 1000));
      setRemaining(rem);
      if (rem <= 0) {
        clearTimer();
        completeCurrent();
      }
    }, 250);
    return () => clearTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  // ticking sound
  useEffect(() => {
    if (!settings.ticking || !running || mode !== "focus") {
      tickAudioRef.current?.pause();
      return;
    }
    // synth ticking using an interval oscillator; avoid external audio files
    let ctx: AudioContext | null = null;
    const int = window.setInterval(() => {
      try {
        if (!ctx) {
          const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
          ctx = new AC();
        }
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
      } catch {}
    }, 1000);
    return () => {
      window.clearInterval(int);
      ctx?.close();
    };
  }, [settings.ticking, running, mode]);

  // achievement detection (unlock IDs stored so we can toast in UI if desired)
  useEffect(() => {
    if (!hydrated) return;
    import("@/utils/achievements").then(({ ACHIEVEMENTS }) => {
      const unlocked = ACHIEVEMENTS.filter((a) => a.unlocked(stats)).map((a) => a.id);
      if (unlocked.length !== stats.unlocked.length) {
        setStats((p) => ({ ...p, unlocked }));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.totalSessions, stats.longestStreak, stats.earlyBird, stats.nightOwl, hydrated]);

  const addTask: Ctx["addTask"] = (t) => {
    const id = crypto.randomUUID();
    setTasks((prev) => [{ id, completed: 0, done: false, ...t }, ...prev]);
  };
  const toggleTask = (id: string) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  const removeTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (activeTaskId === id) setActiveTaskId(null);
  };

  const activeTask = tasks.find((t) => t.id === activeTaskId) || null;

  const value: Ctx = {
    mode, setMode, running, remaining, duration,
    start, pause, reset, skip,
    settings, updateSettings: (s) => setSettings((p) => ({ ...p, ...s })),
    stats,
    tasks, addTask, toggleTask, removeTask,
    activeTaskId, setActiveTaskId, activeTask,
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
