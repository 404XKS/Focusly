import type { Settings } from "@/utils/types";

export function AmbientBackground({ mode }: { mode: Settings["ambient"] }) {
  if (mode === "rain") return <RainBg />;
  if (mode === "forest") return <ForestBg />;
  if (mode === "library") return <LibraryBg />;
  if (mode === "cafe") return <CafeBg />;
  return <SpaceBg />;
}

function SpaceBg() {
  const stars = Array.from({ length: 120 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 0.5 + Math.random() * 1.6, d: Math.random() * 5,
  }));
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden">
      <div className="absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% -10%, rgba(139,92,246,0.25), transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(59,130,246,0.2), transparent 60%), #05050a",
      }} />
      {stars.map((s) => (
        <span key={s.id} className="absolute rounded-full bg-white"
          style={{
            left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s,
            opacity: 0.7, animation: `twinkle ${3 + Math.random() * 4}s ease-in-out ${s.d}s infinite`,
          }} />
      ))}
    </div>
  );
}

function RainBg() {
  const drops = Array.from({ length: 90 }, (_, i) => ({
    id: i, x: Math.random() * 100, delay: Math.random() * 2, dur: 0.8 + Math.random() * 1.5,
    len: 40 + Math.random() * 80,
  }));
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden" style={{ background: "linear-gradient(180deg,#0a0f1a,#050810)" }}>
      {drops.map((d) => (
        <span key={d.id} className="absolute w-px"
          style={{
            left: `${d.x}%`,
            top: 0,
            height: d.len,
            background: "linear-gradient(to bottom, transparent, rgba(147,197,253,0.55))",
            animation: `rain-fall ${d.dur}s linear ${d.delay}s infinite`,
          }} />
      ))}
    </div>
  );
}

function ForestBg() {
  return (
    <div aria-hidden className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, rgba(52,211,153,0.22), transparent 60%), radial-gradient(ellipse at 80% 90%, rgba(16,185,129,0.18), transparent 60%), #06110c",
      }}>
      <div className="absolute inset-0 opacity-40 animate-drift"
        style={{ background: "radial-gradient(circle at 60% 30%, rgba(110,231,180,0.15), transparent 40%)" }} />
    </div>
  );
}

function LibraryBg() {
  return (
    <div aria-hidden className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 30% 30%, rgba(217,119,6,0.18), transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(120,53,15,0.25), transparent 60%), #100a06",
      }} />
  );
}

function CafeBg() {
  return (
    <div aria-hidden className="absolute inset-0"
      style={{
        background: "radial-gradient(ellipse at 20% 20%, rgba(251,146,60,0.18), transparent 60%), radial-gradient(ellipse at 80% 100%, rgba(120,53,15,0.22), transparent 60%), #0d0906",
      }} />
  );
}
