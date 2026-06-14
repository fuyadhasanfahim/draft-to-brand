"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconCircleCheck, IconAlertTriangle, IconInfoCircle, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

type ToastVariant = "default" | "success" | "error" | "info";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: ToastVariant;
  duration?: number;
}

type Ctx = {
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
};

const ToastCtx = React.createContext<Ctx | null>(null);

export function useToast() {
  const ctx = React.useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastVariant, React.ReactNode> = {
  default: <IconInfoCircle size={18} className="text-[var(--color-muted-foreground)]" />,
  success: <IconCircleCheck size={18} className="text-[var(--color-success)]" />,
  error:   <IconAlertTriangle size={18} className="text-[var(--color-danger)]" />,
  info:    <IconInfoCircle size={18} className="text-[var(--color-info)]" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    (t: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).slice(2, 9);
      const next: Toast = { variant: "default", duration: 4000, ...t, id };
      setToasts((prev) => [...prev, next]);
      if (next.duration && next.duration > 0) {
        setTimeout(() => dismiss(id), next.duration);
      }
      return id;
    },
    [dismiss]
  );

  return (
    <ToastCtx.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 24, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 24, scale: 0.96 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 shadow-[var(--shadow-lg)]"
              )}
              role="status"
            >
              <span className="mt-0.5">{ICONS[t.variant ?? "default"]}</span>
              <div className="flex-1 min-w-0">
                {t.title ? (
                  <p className="text-sm font-medium text-[var(--color-foreground)]">{t.title}</p>
                ) : null}
                {t.description ? (
                  <p className="text-[13px] text-[var(--color-muted-foreground)]">{t.description}</p>
                ) : null}
              </div>
              <button
                aria-label="Dismiss"
                onClick={() => dismiss(t.id)}
                className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]"
              >
                <IconX size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}
