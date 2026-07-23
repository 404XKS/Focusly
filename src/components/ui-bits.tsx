import { useEffect, useMemo, useRef } from "react";
import { motion, useMotionValue, useTransform, animate } from "motion/react";

export function AnimatedNumber({ value, decimals = 0, className }: { value: number; decimals?: number; className?: string }) {
  const mv = useMotionValue(value);
  const rounded = useTransform(mv, (v) => v.toFixed(decimals));
  const prev = useRef(value);
  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.9, ease: "easeOut" });
    prev.current = value;
    return controls.stop;
  }, [value, mv]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

export function useParticles(count = 40) {
  return useMemo(() =>
    Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 1 + Math.random() * 2.5,
      delay: Math.random() * 6,
      duration: 6 + Math.random() * 10,
      hue: Math.random() > 0.5 ? 270 : 220,
    })),
  [count]);
}
