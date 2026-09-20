import { useMemo } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";

export function FocusGalaxy() {
  const { stats } = useFocusly();
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
      };
    });
  }, [stats.sessions]);

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
      </p>
      <div className="relative overflow-hidden rounded-2xl h-[300px]"
        style={{ background: "radial-gradient(ellipse at 50% 30%, rgba(139,92,246,0.25), transparent 60%), #06060c" }}>
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
          <span key={i} className="absolute rounded-full"
            style={{
              left: `${s.x}%`, top: `${s.y}%`,
              width: s.size, height: s.size,
              background: `hsl(${s.hue} 100% 82%)`,
              boxShadow: `0 0 ${8 + s.size * 4}px hsl(${s.hue} 100% 70% / 0.9)`,
              animation: `twinkle ${3 + (i % 4)}s ease-in-out ${s.delay}s infinite`,
            }} />
        ))}
        {stars.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/40">
            Complete a focus session to add your first star.
          </div>
        )}
      </div>
    </div>
  );
}
