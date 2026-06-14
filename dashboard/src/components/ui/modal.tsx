"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "max-w-sm",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

/**
 * Production dialog layout.
 *
 * Structure:
 *   [Header   — shrink-0]
 *   [Body     — flex-1 min-h-0 overflow-y-auto]
 *   [Footer   — shrink-0, always visible]
 *
 *   - The dialog is a flex column capped at `max-h-[90vh]` so it can never
 *     exceed the viewport. `min-h-0` on the body lets it actually shrink
 *     inside the flex parent (without it the body's intrinsic content
 *     height would push the footer off-screen).
 *   - Only the body scrolls. The page never scrolls and the footer is
 *     pinned. Works on 1366×768 laptops where most CRM dialogs would
 *     otherwise be unreachable.
 *   - Scroll uses the existing `.scrollbar-thin` utility so visual style
 *     matches every other scrollable region in the app.
 *   - Public API unchanged — every existing caller benefits automatically.
 */
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  className,
}: ModalProps) {
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

  const hasHeader = Boolean(title || description);

  return (
    <AnimatePresence>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-[var(--color-dark)]/40 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "relative w-full flex flex-col max-h-[90vh] bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] shadow-[var(--shadow-xl)]",
              sizes[size],
              className
            )}
          >
            {/* Close button is absolute → no layout impact on the flex column */}
            <button
              onClick={() => onOpenChange(false)}
              className="absolute right-3 top-3 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted)] hover:bg-[var(--color-border)]/50"
              aria-label="Close"
            >
              <IconX size={16} />
            </button>

            {hasHeader ? (
              <header className="shrink-0 px-6 pt-6 pb-4 pr-12">
                {title ? (
                  <h2 className="text-lg font-semibold tracking-tight text-[var(--color-foreground)]">
                    {title}
                  </h2>
                ) : null}
                {description ? (
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    {description}
                  </p>
                ) : null}
              </header>
            ) : null}

            {children ? (
              <div
                className={cn(
                  "flex-1 min-h-0 overflow-y-auto scrollbar-thin px-6",
                  // Preserve previous vertical spacing across the four
                  // permutations of header/footer presence.
                  hasHeader ? "pb-6" : "py-6",
                  !footer && !hasHeader ? "" : "",
                  footer ? "" : hasHeader ? "" : ""
                )}
              >
                {children}
              </div>
            ) : null}

            {footer ? (
              <footer className="shrink-0 flex items-center justify-end gap-2 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 rounded-b-[var(--radius-lg)]">
                {footer}
              </footer>
            ) : null}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
