"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { faqs } from "@/lib/data";
import { IconPlus, IconMinus } from "@tabler/icons-react";

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="divide-y divide-[color:var(--color-border)] border-y border-[color:var(--color-border)]">
      {faqs.map((f, i) => {
        const active = open === i;
        const panelId = `faq-panel-${i}`;
        const buttonId = `faq-button-${i}`;
        return (
          <div key={f.q}>
            <button
              id={buttonId}
              aria-expanded={active}
              aria-controls={panelId}
              onClick={() => setOpen(active ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-7 text-left transition-colors hover:text-foreground"
            >
              <span className="text-display text-xl font-medium leading-tight md:text-2xl">
                {f.q}
              </span>
              <span
                aria-hidden
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-colors ${active ? "bg-[#ff3131] text-white" : "bg-surface text-foreground"}`}
              >
                {active ? <IconMinus size={16} /> : <IconPlus size={16} />}
              </span>
            </button>
            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="overflow-hidden"
                >
                  <p className="max-w-3xl pb-8 text-lg leading-relaxed text-muted">
                    {f.a}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
