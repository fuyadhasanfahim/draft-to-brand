"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import {
  IconCalendar,
  IconChevronLeft,
  IconChevronRight,
  IconX,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";

/**
 * Internal DatePicker.
 *
 *   - Trigger: button styled like an Input, shows formatted date or placeholder.
 *   - Panel:   portal-anchored calendar (same positioning model as Dropdown so
 *              it never expands a parent table or causes scrollbars).
 *   - Calendar: 6-week month grid, keyboard navigable (arrows / Enter / Esc),
 *              Today highlight, selected highlight, hover, prev/next month nav.
 *   - Outside clicks + ESC close the panel.
 *
 * Designed to be reused across CRM, Projects, Followups, Reports, Analytics.
 * Keep the public API stable: `value`, `onChange`, `placeholder`, plus a
 * couple of optional bounds (`minDate`, `maxDate`) for date-range pairs.
 *
 * No third-party calendar lib — date-fns + Framer Motion only.
 */

export type DatePickerProps = {
  value: Date | null;
  onChange: (next: Date | null) => void;
  placeholder?: string;
  /** Display & accessible label. Optional but recommended for forms. */
  label?: string;
  /** Disable selecting dates before this. */
  minDate?: Date | null;
  /** Disable selecting dates after this. */
  maxDate?: Date | null;
  className?: string;
  /** Standard input sizes — sm matches h-9, md matches h-10. */
  size?: "sm" | "md";
  /** Visual alignment of the calendar relative to the trigger. */
  align?: "start" | "end";
  disabled?: boolean;
  /** When true, shows a small X to clear the value. */
  clearable?: boolean;
};

const DATE_FORMAT = "MMM d, yyyy";
const WEEKDAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const GAP_FROM_TRIGGER = 8;

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  label,
  minDate,
  maxDate,
  className,
  size = "sm",
  align = "start",
  disabled,
  clearable = true,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState<Date>(value ?? new Date());
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const panelRef = React.useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = React.useState(false);
  const [coords, setCoords] = React.useState<{
    top: number;
    left: number | "auto";
    right: number | "auto";
    placement: "top" | "bottom";
  } | null>(null);

  React.useEffect(() => setMounted(true), []);

  // Reset visible month each time the picker opens.
  React.useEffect(() => {
    if (open) setViewMonth(value ?? new Date());
  }, [open, value]);

  // Position the panel against the trigger.
  React.useLayoutEffect(() => {
    if (!open) return;
    const update = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const panel = panelRef.current;
      const panelHeight = panel?.offsetHeight ?? 320;
      const panelWidth = panel?.offsetWidth ?? 296;
      const r = trigger.getBoundingClientRect();
      const spaceBelow = window.innerHeight - r.bottom;
      const spaceAbove = r.top;
      const placement: "top" | "bottom" =
        spaceBelow < panelHeight + GAP_FROM_TRIGGER && spaceAbove > spaceBelow ? "top" : "bottom";
      const top =
        placement === "bottom" ? r.bottom + GAP_FROM_TRIGGER : r.top - panelHeight - GAP_FROM_TRIGGER;

      if (align === "end") {
        setCoords({
          top,
          right: Math.max(8, window.innerWidth - r.right),
          left: "auto",
          placement,
        });
      } else {
        // Keep the panel from running off the right edge.
        const left = Math.min(Math.max(8, r.left), window.innerWidth - panelWidth - 8);
        setCoords({ top, left, right: "auto", placement });
      }
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, align]);

  // Outside click + ESC close.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isDisabledDay = (d: Date) => {
    if (minDate && isBefore(d, startOfDay(minDate))) return true;
    if (maxDate && isAfter(d, startOfDay(maxDate))) return true;
    return false;
  };

  const select = (d: Date) => {
    if (isDisabledDay(d)) return;
    onChange(startOfDay(d));
    setOpen(false);
  };

  const clear: React.MouseEventHandler = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const heightCls = size === "md" ? "h-10" : "h-9";
  const triggerLabel = value ? format(value, DATE_FORMAT) : placeholder;
  const hasValue = Boolean(value);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label ?? placeholder}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group inline-flex w-full items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[13px] text-left shadow-[var(--shadow-xs)] transition-[border-color,box-shadow,background-color] duration-150",
          "hover:border-[var(--color-border-strong)]",
          "focus-visible:outline-none focus-visible:border-[var(--color-dark)] focus-visible:ring-2 focus-visible:ring-[var(--color-dark)]/10",
          "disabled:opacity-60 disabled:cursor-not-allowed",
          heightCls,
          className
        )}
      >
        <IconCalendar
          size={14}
          className={cn(
            "shrink-0 transition-colors",
            hasValue
              ? "text-[var(--color-foreground)]"
              : "text-[var(--color-muted)] group-hover:text-[var(--color-muted-foreground)]"
          )}
        />
        <span
          className={cn(
            "flex-1 truncate",
            hasValue ? "text-[var(--color-foreground)]" : "text-[var(--color-muted)]"
          )}
        >
          {triggerLabel}
        </span>
        {clearable && hasValue && !disabled ? (
          <span
            role="button"
            tabIndex={-1}
            aria-label="Clear date"
            onClick={clear}
            className="shrink-0 rounded-[4px] p-0.5 text-[var(--color-muted)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40 transition-colors"
          >
            <IconX size={12} />
          </span>
        ) : null}
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open && coords ? (
                <motion.div
                  ref={panelRef}
                  role="dialog"
                  aria-label="Choose date"
                  initial={{ opacity: 0, y: coords.placement === "bottom" ? -6 : 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: coords.placement === "bottom" ? -6 : 6, scale: 0.98 }}
                  transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
                  style={{
                    position: "fixed",
                    top: coords.top,
                    left: coords.left === "auto" ? undefined : coords.left,
                    right: coords.right === "auto" ? undefined : coords.right,
                    zIndex: 90,
                  }}
                  className="w-[296px] rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-xl)] p-3"
                >
                  <CalendarPanel
                    month={viewMonth}
                    setMonth={setViewMonth}
                    selected={value}
                    onSelect={select}
                    isDisabledDay={isDisabledDay}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}

function CalendarPanel({
  month,
  setMonth,
  selected,
  onSelect,
  isDisabledDay,
}: {
  month: Date;
  setMonth: (d: Date) => void;
  selected: Date | null;
  onSelect: (d: Date) => void;
  isDisabledDay: (d: Date) => boolean;
}) {
  // Compute the visible 6-week grid.
  const gridStart = startOfWeek(startOfMonth(month), { weekStartsOn: 0 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 0 });
  const days: Date[] = [];
  for (let d = gridStart; !isAfter(d, gridEnd); d = addDays(d, 1)) {
    days.push(d);
  }
  // Always render 6 rows (42 cells) so the panel doesn't jump height
  // when switching months.
  while (days.length < 42) days.push(addDays(days[days.length - 1]!, 1));

  // Keyboard focus tracking — `focused` is the cell the arrow keys point at.
  const initialFocus = selected && isSameMonth(selected, month) ? selected : startOfMonth(month);
  const [focused, setFocused] = React.useState<Date>(initialFocus);
  React.useEffect(() => {
    setFocused(selected && isSameMonth(selected, month) ? selected : startOfMonth(month));
  }, [month, selected]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let next: Date | null = null;
    switch (e.key) {
      case "ArrowLeft":  next = addDays(focused, -1); break;
      case "ArrowRight": next = addDays(focused, 1);  break;
      case "ArrowUp":    next = addDays(focused, -7); break;
      case "ArrowDown":  next = addDays(focused, 7);  break;
      case "Home":       next = startOfWeek(focused, { weekStartsOn: 0 }); break;
      case "End":        next = endOfWeek(focused, { weekStartsOn: 0 }); break;
      case "PageUp":     next = subMonths(focused, 1); break;
      case "PageDown":   next = addMonths(focused, 1); break;
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(focused);
        return;
      default:
        return;
    }
    e.preventDefault();
    if (next) {
      setFocused(next);
      if (!isSameMonth(next, month)) setMonth(next);
    }
  };

  return (
    <div onKeyDown={onKeyDown} tabIndex={0} className="outline-none">
      <div className="flex items-center justify-between px-1 pb-2">
        <p className="text-[13px] font-semibold tracking-tight text-[var(--color-foreground)]">
          {format(month, "MMMM yyyy")}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(subMonths(month, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)] transition-colors"
            aria-label="Previous month"
          >
            <IconChevronLeft size={14} />
          </button>
          <button
            type="button"
            onClick={() => setMonth(addMonths(month, 1))}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[var(--color-muted-foreground)] hover:bg-[var(--color-background)] hover:text-[var(--color-foreground)] transition-colors"
            aria-label="Next month"
          >
            <IconChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-1 mb-1">
        {WEEKDAY_LABELS.map((d) => (
          <span
            key={d}
            className="text-center text-[10px] uppercase tracking-wider font-medium text-[var(--color-muted)]"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {days.map((d) => {
          const inMonth = isSameMonth(d, month);
          const isSel = selected ? isSameDay(d, selected) : false;
          const isFoc = isSameDay(d, focused);
          const isTd = isToday(d);
          const disabled = isDisabledDay(d);
          return (
            <button
              key={d.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(d)}
              onMouseEnter={() => setFocused(d)}
              className={cn(
                "relative mx-auto inline-flex h-8 w-8 items-center justify-center rounded-[8px] text-[12px] font-medium transition-colors",
                "focus:outline-none",
                isSel
                  ? "bg-[var(--color-dark)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
                  : disabled
                    ? "text-[var(--color-muted)]/40 cursor-not-allowed"
                    : inMonth
                      ? "text-[var(--color-foreground)] hover:bg-[var(--color-background)]"
                      : "text-[var(--color-muted)] hover:bg-[var(--color-background)]/60",
                isFoc && !isSel && !disabled && "ring-1 ring-[var(--color-dark)]/15",
                isTd && !isSel && "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-0.5 after:w-0.5 after:rounded-full after:bg-[var(--color-primary)]"
              )}
              aria-pressed={isSel}
              aria-current={isTd ? "date" : undefined}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-[var(--color-border)] pt-2">
        <button
          type="button"
          onClick={() => onSelect(startOfDay(new Date()))}
          className="text-[11px] font-medium text-[var(--color-foreground)] hover:text-[var(--color-primary)] transition-colors"
        >
          Today
        </button>
        {selected ? (
          <button
            type="button"
            onClick={() => onSelect(selected)}
            className="text-[11px] text-[var(--color-muted-foreground)]"
          >
            {format(selected, DATE_FORMAT)}
          </button>
        ) : null}
      </div>
    </div>
  );
}
