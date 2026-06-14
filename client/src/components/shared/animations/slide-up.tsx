"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function SlideUp({
  children,
  delay = 0,
  className,
  distance = 40,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  distance?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
