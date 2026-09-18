export function fmt(seconds: number) {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Coerce anything into a safe integer inside [min, max]. */
export function clampInt(v: unknown, min: number, max: number, fallback: number) {
  const n = typeof v === "number" ? v : parseInt(String(v ?? ""), 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
export function isDateKey(v: unknown): v is string {
  return typeof v === "string" && DATE_RE.test(v);
}

/**
 * Derive current + longest streak from session dates.
 * Current streak is 0 once a full day has passed with no session.
 */
export function computeStreaks(dates: string[]) {
  const uniq = Array.from(new Set(dates.filter(isDateKey))).sort();
  if (uniq.length === 0) return { current: 0, longest: 0 };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < uniq.length; i++) {
    run = daysBetween(uniq[i - 1], uniq[i]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const gap = daysBetween(uniq[uniq.length - 1], todayKey());
  let current = 0;
  if (gap === 0 || gap === 1) {
    current = 1;
    for (let i = uniq.length - 2; i >= 0; i--) {
      if (daysBetween(uniq[i], uniq[i + 1]) === 1) current++;
      else break;
    }
  }
  return { current, longest };
}
