"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "left" | "right";
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  width?: string;
}

export function Sheet({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  children,
  className,
  width = "w-[360px]",
}: SheetProps) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onOpenChange(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  const x = side === "right" ? "100%" : "-100%";

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[var(--color-dark)]/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            initial={{ x }}
            animate={{ x: 0 }}
            exit={{ x }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "absolute top-0 bottom-0 bg-[var(--color-surface)] border-[var(--color-border)] shadow-[var(--shadow-xl)] flex flex-col",
              side === "right" ? "right-0 border-l" : "left-0 border-r",
              width,
              className
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-[var(--color-border)] px-5 py-4">
              <div>
                {title ? <h2 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">{title}</h2> : null}
                {description ? <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">{description}</p> : null}
              </div>
              <button
                onClick={() => onOpenChange(false)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)]/50"
                aria-label="Close"
              >
                <IconX size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-auto px-5 py-4 scrollbar-thin">{children}</div>
          </motion.aside>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
