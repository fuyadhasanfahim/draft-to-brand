"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Ctx = { value: string; setValue: (v: string) => void; layoutId: string };
const TabsCtx = React.createContext<Ctx | null>(null);
function useCtx() {
  const c = React.useContext(TabsCtx);
  if (!c) throw new Error("Tabs subcomponents must live inside <Tabs>");
  return c;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  const layoutId = React.useId();
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const controlled = value !== undefined;
  const current = controlled ? value : internal;

  return (
    <TabsCtx.Provider
      value={{
        value: current,
        setValue: (v) => {
          if (!controlled) setInternal(v);
          onValueChange?.(v);
        },
        layoutId,
      }}
    >
      <div className={className}>{children}</div>
    </TabsCtx.Provider>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1",
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { value: current, setValue, layoutId } = useCtx();
  const active = current === value;
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={() => setValue(value)}
      className={cn(
        "relative inline-flex items-center justify-center rounded-[6px] px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "text-white" : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      )}
    >
      {active ? (
        <motion.span
          layoutId={layoutId}
          transition={{ type: "spring", stiffness: 500, damping: 40 }}
          className="absolute inset-0 rounded-[6px] bg-[var(--color-dark)]"
        />
      ) : null}
      <span className="relative z-10">{children}</span>
    </button>
  );
}

export function TabsContent({ value, children, className }: { value: string; children: React.ReactNode; className?: string }) {
  const { value: current } = useCtx();
  if (current !== value) return null;
  return <div className={cn("pt-4", className)}>{children}</div>;
}
