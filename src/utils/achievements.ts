import type { Stats } from "./types";

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: (stats: Stats) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first", title: "First Session", description: "Complete your first focus session.", icon: "Sparkles",
    unlocked: (s) => s.totalSessions >= 1 },
  { id: "five", title: "Five Sessions", description: "Complete 5 focus sessions.", icon: "Rocket",
    unlocked: (s) => s.totalSessions >= 5 },
  { id: "twentyfive", title: "Twenty-Five Sessions", description: "Complete 25 focus sessions.", icon: "Target",
    unlocked: (s) => s.totalSessions >= 25 },
  { id: "hundred", title: "One Hundred Sessions", description: "Complete 100 focus sessions.", icon: "Trophy",
    unlocked: (s) => s.totalSessions >= 100 },
  { id: "streak7", title: "Seven-Day Streak", description: "Focus 7 days in a row.", icon: "Flame",
    unlocked: (s) => s.longestStreak >= 7 },
  { id: "earlybird", title: "Early Bird", description: "Complete a session before 8 AM.", icon: "Sunrise",
    unlocked: (s) => s.earlyBird },
  { id: "nightowl", title: "Night Owl", description: "Complete a session after 10 PM.", icon: "Moon",
    unlocked: (s) => s.nightOwl },
];

export function focusScore(s: Stats): { score: number; rank: string; next?: string } {
  const score =
    Math.min(500, s.totalSessions * 4) +
    Math.min(300, Math.floor(s.totalFocusMinutes / 5)) +
    Math.min(200, s.longestStreak * 10);
  const ranks: [number, string][] = [
    [0, "Explorer"],
    [200, "Navigator"],
    [500, "Pioneer"],
    [800, "Master Focus"],
    [1000, "Legend"],
  ];
  let rank = "Explorer";
  let next: string | undefined;
  for (let i = 0; i < ranks.length; i++) {
    if (score >= ranks[i][0]) rank = ranks[i][1];
    else { next = ranks[i][1]; break; }
  }
  return { score, rank, next };
}
