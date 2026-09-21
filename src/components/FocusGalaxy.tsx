// ============= Full file contents =============

import { useMemo, useState } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";

export function FocusGalaxy() {
  const { stats } = useFocusly();
  const [selected, setSelected] = useState<number | null>(null);

  const stars = useMemo(() => {
    // deterministic positions per session index using PRNG based on timestamp
    return stats.sessions.map((s, i) => {
      const seed = (s.timestamp % 100000) + i * 97;
      const rand = (n: number) => {
        let x = Math.sin(n) * 10000; return x - Math.floor(x);
      };
      return {
        x: rand(seed) * 100,
        y: rand(seed + 1) * 100,
        size: 1.2 + rand(seed + 2) * 2.4,
        hue: rand(seed + 3) > 0.5 ? 270 : 210,
        delay: rand(seed + 4) * 4,
        session: s,
      };
    });
  }, [stats.sessions]);

  const selectedSession = selected !== null ? stars[selected]?.session : undefined;
  const selectedDate = selectedSession
    ? new Date(selectedSession.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric" })
    : "";
  const selectedTime = selectedSession
    ? new Date(selectedSession.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "";

  // draw simple constellation lines between consecutive stars
  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-lg font-semibold">Your Focus Galaxy</h3>
        <span className="text-xs text-white/40">{stars.length} stars</span>
      </div>
      <p className="text-xs text-white/50 mb-3">
        {stars.length === 0
          ? "No focus sessions yet"
          : `${stats.totalSessions} focus session${stats.totalSessions === 1 ? "" : "s"} · ${stats.totalFocusMinutes} min of focus`}
        <span className="ml-2 text-white/35">· <span className="text-white/70">★</span> Focus Session</span>
      </p>
      <div className="relative overflow-hidden rounded-2xl h-[300px]"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.25), transparent 60%), #06060c" }}
        onClick={() => setSelected(null)}>
        <svg className="absolute inset-0 h-full w-full">
          {stars.slice(1).map((s, i) => {
            const prev = stars[i];
            return (
              <line key={i} x1={`${prev.x}%`} y1={`${prev.y}%`} x2={`${s.x}%`} y2={`${s.y}%`}
                stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
            );
          })}
        </svg>
        {stars.map((s, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Focus session, ${s.session.minutes} minutes, ${new Date(s.session.timestamp).toLocaleDateString("en-US", { month: "long", day: "numeric" })}`}
            aria-pressed={selected === i}
            className={`absolute rounded-full cursor-pointer ${selected === i ? "ring-1 ring-white/50" : ""}`}
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              background: `hsl(${s.hue} 100% 82%)`,
              boxShadow: `0 0 ${8 + s.size * 4}px hsl(${s.hue} 100% 70% / 0.9)`,
              animation: `twinkle ${3 + (i % 4)}s ease-in-out ${s.delay}s infinite`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelected((prev) => (prev === i ? null : i));
            }}
          />
        ))}
        {stars.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
            Complete a focus session to add your first star.
          </div>
        )}
      </div>
      {selectedSession && (
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs">
          <span className="text-sm text-white/80">★</span>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="text-white/85 font-medium">Completed Focus Session</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">{selectedDate}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">{selectedTime}</span>
            <span className="text-white/40">·</span>
            <span className="text-white/70">{selectedSession.minutes} min</span>
          </div>
          <button
            type="button"
            className="ml-auto text-white/40 hover:text-white/70 cursor-pointer"
            aria-label="Dismiss session details"
            onClick={() => setSelected(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
