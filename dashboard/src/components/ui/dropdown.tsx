"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Portal-anchored dropdown.
 *
 *   - Content is rendered into `document.body` via React's portal — it never
 *     participates in the surrounding layout, so tables don't grow, the
 *     page doesn't scroll, and clipping `overflow: hidden` ancestors don't
 *     cut it off.
 *   - Positioning is `position: fixed` against the trigger's
 *     getBoundingClientRect, re-measured on scroll (capture phase) and
 *     resize. No external Floating UI dependency — the menus we have are
 *     small enough that a simple rect projection suffices.
 *   - Auto-flips vertically when there isn't enough room below the trigger.
 *
 * This deliberately keeps the previous public API (`Dropdown` / `DropdownTrigger`
 * / `DropdownContent` / `DropdownItem` / `DropdownSeparator` / `DropdownLabel`)
 * — every call-site keeps working without changes.
 */

type Align = "start" | "end";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
};

const DropdownCtx = React.createContext<Ctx | null>(null);
function useCtx() {
  const c = React.useContext(DropdownCtx);
  if (!c) throw new Error("Dropdown.* must be used inside <Dropdown>");
  return c;
}

export function Dropdown({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  return (
    <DropdownCtx.Provider value={{ open, setOpen, triggerRef }}>
      {/* No `position: relative` wrapper any more — positioning happens
          off-tree via the portal. */}
      <span className="inline-flex">{children}</span>
    </DropdownCtx.Provider>
  );
}

export function DropdownTrigger({
  children,
  asChild,
}: {
  children: React.ReactElement;
  asChild?: boolean;
}) {
  const { open, setOpen, triggerRef } = useCtx();
  void asChild;
  return React.cloneElement(children, {
    ref: (el: HTMLElement | null) => (triggerRef.current = el),
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation();
      setOpen(!open);
    },
    "aria-expanded": open,
    "aria-haspopup": "menu",
  } as Record<string, unknown>);
}

type Coords = {
  top: number;
  left: number | "auto";
  right: number | "auto";
  /** Pixel cap applied to the menu's max-height. Set when the menu would
   *  otherwise overflow the viewport in the chosen placement. */
  maxHeight?: number;
};

function measure(
  trigger: HTMLElement,
  menuHeight: number,
  align: Align,
  preferBottom: boolean
): Coords & { placement: "top" | "bottom" } {
  const r = trigger.getBoundingClientRect();
  const gap = 6;
  const edge = 8; // breathing room from the viewport edge
  const spaceBelow = window.innerHeight - r.bottom;
  const spaceAbove = r.top;

  // Placement decision:
  //   - default (auto-flip): flip up only if below is genuinely too small
  //     AND above is meaningfully larger;
  //   - preferBottom: stay below unless there's almost zero room (e.g.
  //     trigger pinned to bottom). Even then, we cap the menu height so
  //     the inner content scrolls instead of pushing the page.
  let placement: "top" | "bottom";
  if (preferBottom) {
    // Hard preference for bottom. Only flip when bottom is literally
    // unusable (< 40px) — anything else stays below with `maxHeight`
    // shrinking the menu so the inner list scrolls instead of pushing
    // the page or overlapping the form above the trigger.
    placement = spaceBelow < 40 ? "top" : "bottom";
  } else {
    placement = spaceBelow < menuHeight + gap && spaceAbove > spaceBelow ? "top" : "bottom";
  }

  const top =
    placement === "bottom" ? r.bottom + gap : r.top - menuHeight - gap;

  // Constrain the menu so it never causes the page to scroll. Inner
  // scroll containers inside the menu (e.g. the tag list) will absorb
  // the overflow.
  const availableForBottom = Math.max(120, spaceBelow - gap - edge);
  const availableForTop = Math.max(120, spaceAbove - gap - edge);
  const maxHeight =
    placement === "bottom"
      ? menuHeight > availableForBottom ? availableForBottom : undefined
      : menuHeight > availableForTop ? availableForTop : undefined;

  const horizontal =
    align === "end"
      ? { right: Math.max(edge, window.innerWidth - r.right), left: "auto" as const }
      : { left: Math.max(edge, r.left), right: "auto" as const };

  return { top, ...horizontal, placement, maxHeight };
}

export function DropdownContent({
  children,
  align = "end",
  className,
  width = "w-56",
  preferBottom = false,
}: {
  children: React.ReactNode;
  align?: Align;
  className?: string;
  width?: string;
  /**
   * When true, the menu opens BELOW the trigger and will only flip up if
   * the trigger is essentially pinned to the bottom edge. The menu's
   * `max-height` is capped to the remaining viewport space so its inner
   * scroll container absorbs overflow rather than the page. Use this for
   * content-driven pickers (tags, filters) where flipping over the form
   * fields the user is already looking at is jarring.
   */
  preferBottom?: boolean;
}) {
  const { open, setOpen, triggerRef } = useCtx();
  const ref = React.useRef<HTMLDivElement>(null);
  const [coords, setCoords] = React.useState<(Coords & { placement: "top" | "bottom" }) | null>(
    null
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // (Re)measure whenever the menu opens, or the page reflows under it.
  React.useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const update = () => {
      const trigger = triggerRef.current;
      const node = ref.current;
      if (!trigger) return;
      // Use the rendered menu's height if it exists, otherwise a sane default.
      const h = node?.offsetHeight ?? 240;
      setCoords(measure(trigger, h, align, preferBottom));
    };
    update();
    // Capture-phase scroll catches scrolls inside any ancestor — including
    // table containers with `overflow-auto`.
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align, triggerRef, preferBottom]);

  // Outside click + ESC.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (ref.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, setOpen, triggerRef]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && coords ? (
        <motion.div
          ref={ref}
          role="menu"
          initial={{ opacity: 0, y: coords.placement === "bottom" ? -4 : 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: coords.placement === "bottom" ? -4 : 4, scale: 0.98 }}
          transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: "fixed",
            top: coords.top,
            left: coords.left === "auto" ? undefined : coords.left,
            right: coords.right === "auto" ? undefined : coords.right,
            zIndex: 80,
            ...(coords.maxHeight
              ? { maxHeight: coords.maxHeight, overflowY: "auto" as const }
              : {}),
          }}
          className={cn(
            "rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] p-1 scrollbar-thin",
            width,
            className
          )}
        >
          {children}
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
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
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        onSelect?.();
        setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-sm text-[var(--color-foreground)] text-left transition-colors",
        "hover:bg-[var(--color-border)]/40",
        destructive && "text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10",
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
    <div className="px-2.5 py-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
      {children}
    </div>
  );
}
export function DropdownSeparator() {
  return <div className="my-1 h-px bg-[var(--color-border)]" />;
}
