"use client";

/**
 * Placeholder ad slot. Phase 7 replaces the body with a real AdSense unit
 * (<ins class="adsbygoogle">) and wires the loader script + CSP.
 */
export function AdSlot() {
  return (
    <div
      aria-hidden
      className="my-10 flex min-h-[120px] items-center justify-center rounded-2xl border border-dashed border-border text-[0.7rem] font-medium tracking-[0.18em] text-muted/60 uppercase"
    >
      Advertisement
    </div>
  );
}
