"use client";
import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
};
const DropdownCtx = React.createContext<Ctx | null>(null);
function useCtx() {
  const ctx = React.useContext(DropdownCtx);
  if (!ctx) throw new Error("Dropdown.* must be used inside <Dropdown>");
  return ctx;
}

export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  return (
    <DropdownCtx.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left">{children}</div>
    </DropdownCtx.Provider>
  );
}

export function DropdownTrigger({ children, asChild }: { children: React.ReactElement; asChild?: boolean }) {
  const { open, setOpen, triggerRef } = useCtx();
  const props = {
    ref: (el: HTMLElement | null) => (triggerRef.current = el),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen(!open);
    },
    "aria-expanded": open,
    "aria-haspopup": true,
  };
  // Always clone — `asChild` is supported by passing a single ReactElement (e.g. <Button>).
  void asChild;
  return React.cloneElement(children, props as Record<string, unknown>);
}

export function DropdownContent({
  children,
  align = "end",
  className,
  width = "w-56",
}: {
  children: React.ReactNode;
  align?: "start" | "end";
  className?: string;
  width?: string;
}) {
  const { open, setOpen } = useCtx();
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          className={cn(
            "absolute z-40 mt-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] p-1",
            align === "end" ? "right-0" : "left-0",
            width,
            className
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function DropdownItem({
  children,
  onSelect,
  className,
  destructive,
  disabled,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { setOpen } = useCtx();
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-sm text-[var(--color-foreground)] text-left transition-colors",
        "hover:bg-[var(--color-border)]/40",
        destructive && "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/8",
        disabled && "opacity-50 pointer-events-none",
        className
      )}
    >
      {children}
    </button>
  );
}

export function DropdownLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">{children}</div>
  );
}
export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[var(--color-border)]" />;
}
