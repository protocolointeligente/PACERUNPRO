"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

const COLORS = ["#ff6a1a", "#ff2e8b", "#8b3dff", "#b84dff", "#ffffff"];

export function ParticleBurst({ count = 28 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * 2 * Math.PI + Math.random() * 0.5;
        const distance = 90 + Math.random() * 180;
        return {
          id: i,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          size: 5 + Math.random() * 9,
          color: COLORS[i % COLORS.length],
          delay: Math.random() * 0.15,
        };
      }),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center overflow-hidden">
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.5 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1.3 }}
          transition={{ duration: 1.1, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}
