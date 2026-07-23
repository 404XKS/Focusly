export type Mode = "focus" | "short" | "long";

export type Task = {
  id: string;
  title: string;
  priority: "low" | "medium" | "high";
  estimated: number;
  completed: number;
  done: boolean;
};

export type Settings = {
  focus: number;   // minutes
  short: number;
  long: number;
  autoStart: boolean;
  autoStartBreaks: boolean;
  sound: boolean;
  ticking: boolean;
  desktopNotifications: boolean;
  ambient: "space" | "rain" | "library" | "forest" | "cafe";
};

export type SessionRecord = {
  date: string;       // YYYY-MM-DD
  timestamp: number;  // unix ms
  minutes: number;
  hour: number;       // 0-23
  weekday: number;    // 0-6 (0=Sun)
};

export type Stats = {
  totalSessions: number;
  totalFocusMinutes: number;
  currentStreak: number;
  longestStreak: number;
  earlyBird: boolean;
  nightOwl: boolean;
  sessions: SessionRecord[];
  unlocked: string[];
};
