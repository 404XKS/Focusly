import { AnimatePresence, motion } from "motion/react";
import { Quote, X } from "lucide-react";
import { useFocusly } from "@/contexts/FocuslyContext";
import { useEffect } from "react";

export function QuoteToast() {
  const { lastQuote, clearQuote } = useFocusly();
  useEffect(() => {
    if (!lastQuote) return;
    const t = setTimeout(clearQuote, 9000);
    return () => clearTimeout(t);
  }, [lastQuote, clearQuote]);

  return (
    <AnimatePresence>
      {lastQuote && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.98 }}
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 max-w-md w-[92%]"
        >
          <div className="glass glow-purple rounded-2xl p-4 flex items-start gap-3">
            <div className="rounded-xl p-2"
              style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.5), rgba(59,130,246,0.5))" }}>
              <Quote className="h-4 w-4 text-white" />
            </div>
            <p className="text-sm text-white/90 flex-1">{lastQuote}</p>
            <button onClick={clearQuote} className="text-white/40 hover:text-white" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
