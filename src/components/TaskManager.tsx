import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Trash2, Circle, CircleCheck, Play } from "lucide-react";
import { useFocusly } from "@/contexts/FocuslyContext";
import type { Task } from "@/utils/types";

const priorityStyle: Record<Task["priority"], string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/25",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/25",
};

export function TaskManager() {
  const { tasks, addTask, toggleTask, removeTask, activeTaskId, setActiveTaskId } = useFocusly();
  const [title, setTitle] = useState("");
  const [estimated, setEstimated] = useState(2);
  const [priority, setPriority] = useState<Task["priority"]>("medium");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask({ title: title.trim(), estimated, priority });
    setTitle(""); setEstimated(2); setPriority("medium");
  };

  return (
    <div className="glass rounded-3xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Tasks</h3>
        <span className="text-xs text-white/40">{tasks.filter((t) => !t.done).length} open</span>
      </div>
      <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-2">
        <input
          value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you focusing on?"
          className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm placeholder:text-white/40 focus:outline-none focus:border-white/30"
          aria-label="Task title"
        />
        <input
          type="number" min={1} max={20} value={estimated}
          onChange={(e) => setEstimated(parseInt(e.target.value || "1"))}
          className="w-20 rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-center"
          aria-label="Estimated pomodoros"
        />
        <select value={priority} onChange={(e) => setPriority(e.target.value as Task["priority"])}
          className="rounded-xl bg-white/5 border border-white/10 px-3 py-2.5 text-sm">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button className="glow-purple inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white"
          style={{ background: "linear-gradient(135deg, rgb(139,92,246), rgb(59,130,246))" }}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>

      <ul className="mt-5 space-y-2">
        <AnimatePresence initial={false}>
          {tasks.map((t) => {
            const active = activeTaskId === t.id;
            return (
              <motion.li key={t.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                className={`group flex items-center gap-3 rounded-2xl border p-3 transition-colors ${active ? "border-brand/60 bg-brand/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                <button onClick={() => toggleTask(t.id)} aria-label="Toggle complete"
                  className="text-white/70 hover:text-white">
                  {t.done ? <CircleCheck className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>
                <div className="flex-1">
                  <div className={`text-sm ${t.done ? "line-through text-white/40" : ""}`}>{t.title}</div>
                  <div className="mt-1 flex items-center gap-2 text-[11px] text-white/50">
                    <span className={`rounded-full border px-2 py-0.5 ${priorityStyle[t.priority]}`}>{t.priority}</span>
                    <span>{t.completed}/{t.estimated} pomodoros</span>
                  </div>
                </div>
                <button onClick={() => setActiveTaskId(active ? null : t.id)}
                  className={`rounded-lg p-2 transition ${active ? "bg-brand/30 text-white" : "text-white/60 hover:text-white hover:bg-white/10"}`}
                  aria-label="Set active task">
                  <Play className="h-4 w-4" />
                </button>
                <button onClick={() => removeTask(t.id)}
                  className="rounded-lg p-2 text-white/40 hover:text-rose-300 hover:bg-white/10"
                  aria-label="Delete task">
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.li>
            );
          })}
        </AnimatePresence>
        {tasks.length === 0 && (
          <li className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/40">
            Add a task to focus on. It'll appear above the timer during a session.
          </li>
        )}
      </ul>
    </div>
  );
}
