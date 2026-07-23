import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { ArrowRight, Timer, Coffee, Brain, Moon } from "lucide-react";
import { ParticlesBackground } from "@/components/ParticlesBackground";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Focusly — Turn minutes into momentum" },
      { name: "description", content: "A beautiful Pomodoro timer with tasks, analytics, achievements and ambient focus modes. Build a daily habit of deep work." },
      { property: "og:title", content: "Focusly — Turn minutes into momentum" },
      { property: "og:description", content: "A beautiful Pomodoro timer with tasks, analytics, achievements and ambient focus modes." },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: Brain, title: "Pomodoro Technique", desc: "The proven method for deep, sustained focus." },
  { icon: Timer, title: "25 Minute Focus", desc: "Immersive sessions that respect your attention." },
  { icon: Coffee, title: "5 Minute Break", desc: "Quick resets between deep work sprints." },
  { icon: Moon, title: "15 Minute Long Break", desc: "Recharge fully after four focus cycles." },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <ParticlesBackground density={60} />
      <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <LogoMark />
          <span className="font-display text-lg font-semibold tracking-tight">Focusly</span>
        </div>
        <Link to="/app" className="glass rounded-full px-4 py-2 text-sm hover:bg-white/10 transition">
          Open app
        </Link>
      </nav>

      <section className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pt-16 pb-24 text-center md:pt-24">
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-full px-3 py-1 text-xs text-white/70">
          Focus, elegantly.
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="mt-6 font-display text-6xl md:text-8xl font-semibold tracking-tight text-gradient">
          Focusly
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
          className="mt-5 max-w-2xl text-lg md:text-xl text-white/70">
          Turn minutes into momentum.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}
          className="mt-10">
          <Link to="/app"
            className="glow-purple group inline-flex items-center gap-2 rounded-full px-7 py-4 text-base font-medium text-white transition"
            style={{ background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))" }}>
            Start Focusing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </motion.div>

        <div className="mt-16 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title}
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + i * 0.06 }}
              whileHover={{ y: -4 }}
              className="glass rounded-2xl p-5 text-left">
              <div className="mb-3 inline-flex rounded-xl p-2"
                style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.35), rgba(59,130,246,0.35))" }}>
                <f.icon className="h-4 w-4 text-white" />
              </div>
              <div className="text-sm font-medium">{f.title}</div>
              <div className="mt-1 text-xs text-white/55">{f.desc}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-3 w-full">
          {[
            { t: "Focus Galaxy", d: "Every session becomes a glowing star in your personal night sky." },
            { t: "Focus Score", d: "Earn ranks from Explorer to Legend as your habits compound." },
            { t: "Ambient Modes", d: "Space, rain, forest, café — pick an atmosphere to match your mood." },
          ].map((c, i) => (
            <motion.div key={c.t}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-3xl p-6 text-left">
              <div className="font-display text-lg font-semibold text-gradient">{c.t}</div>
              <p className="mt-2 text-sm text-white/60">{c.d}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/5 py-8 text-center text-xs text-white/40">
        Made with ❤️ for focused minds.
      </footer>
    </main>
  );
}

function LogoMark() {
  return (
    <div className="relative h-7 w-7 rounded-lg overflow-hidden"
      style={{ background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))" }}>
      <span className="absolute inset-1 rounded-md bg-[#0B0B0F]" />
      <span className="absolute inset-0 m-auto h-2 w-2 rounded-full bg-white" />
    </div>
  );
}
