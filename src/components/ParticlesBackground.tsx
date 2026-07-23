import { useParticles } from "./ui-bits";

export function ParticlesBackground({ density = 40 }: { density?: number }) {
  const particles = useParticles(density);
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* soft gradients */}
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl opacity-40 animate-drift"
        style={{ background: "radial-gradient(circle, rgba(139,92,246,0.55), transparent 60%)" }} />
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full blur-3xl opacity-40 animate-drift"
        style={{ background: "radial-gradient(circle, rgba(59,130,246,0.5), transparent 60%)", animationDelay: "3s" }} />
      <div className="absolute top-1/3 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full blur-3xl opacity-25 animate-pulse-glow"
        style={{ background: "radial-gradient(circle, rgba(110,231,255,0.4), transparent 60%)" }} />

      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: `hsl(${p.hue} 100% 80% / 0.85)`,
            boxShadow: `0 0 ${6 + p.size * 3}px hsl(${p.hue} 100% 70% / 0.7)`,
            animation: `floaty ${p.duration}s ease-in-out ${p.delay}s infinite, twinkle ${p.duration * 0.7}s ease-in-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
