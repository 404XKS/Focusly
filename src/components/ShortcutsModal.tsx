import { AnimatePresence, motion } from "motion/react";
import { Keyboard, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useFocusly } from "@/contexts/FocuslyContext";

const KEYS: [string, string][] = [
  ["Space", "Start / Pause"],
  ["R", "Reset timer"],
  ["S", "Skip to next"],
  ["?", "Show shortcuts"],
  ["F", "Toggle focus mode"],
];

export function ShortcutsModal() {
  const [open, setOpen] = useState(false);
  const { start, pause, reset, skip, running, focusMode, setFocusMode } = useFocusly();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || el?.isContentEditable) return;
      // Never hijack browser/OS shortcuts (Cmd+R, Ctrl+S, …)
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") { e.preventDefault(); if (running) pause(); else start(); }
      else if (e.key.toLowerCase() === "r") reset();
      else if (e.key.toLowerCase() === "s") skip();
      else if (e.key.toLowerCase() === "f") setFocusMode(!focusMode);
      else if (e.key === "?" || (e.shiftKey && e.key === "/")) setOpen((o) => !o);
      else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, start, pause, reset, skip, focusMode, setFocusMode]);

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="glass rounded-full px-3 py-2 text-xs text-white/70 hover:text-white inline-flex items-center gap-1.5"
        aria-label="Open keyboard shortcuts">
        <Keyboard className="h-3.5 w-3.5" /> Shortcuts
      </button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <motion.div initial={{ y: 10, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 10, scale: 0.97 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-strong relative rounded-3xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-lg font-semibold">Keyboard Shortcuts</h3>
                <button onClick={() => setOpen(false)} aria-label="Close" className="text-white/50 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ul className="space-y-2">
                {KEYS.map(([k, d]) => (
                  <li key={k} className="flex items-center justify-between rounded-xl bg-white/5 px-3 py-2">
                    <span className="text-sm text-white/80">{d}</span>
                    <kbd className="rounded-md border border-white/15 bg-white/10 px-2 py-0.5 text-xs">{k}</kbd>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
