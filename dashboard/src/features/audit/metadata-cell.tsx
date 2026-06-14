"use client";

import * as React from "react";
import { IconBraces } from "@tabler/icons-react";
import { Button, Modal } from "@/components/ui";

/**
 * Compact cell for the `metadata` JSON column. Renders an inline pill
 * when metadata is present; clicking opens a Modal with the pretty-printed
 * JSON. Empty / null metadata renders as "—".
 */
export function MetadataCell({ value }: { value: unknown }) {
  const [open, setOpen] = React.useState(false);
  if (value === null || value === undefined) {
    return <span className="text-[var(--color-muted)] text-xs">—</span>;
  }
  if (typeof value !== "object") {
    return (
      <code className="text-[11px] font-mono text-[var(--color-foreground)]">
        {String(value)}
      </code>
    );
  }

  const formatted = (() => {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  })();

  const preview = (() => {
    const keys = Object.keys(value as Record<string, unknown>);
    if (keys.length === 0) return "{}";
    return keys.slice(0, 3).join(", ") + (keys.length > 3 ? "…" : "");
  })();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--color-border)] bg-[var(--color-background)] px-2 py-0.5 text-[11px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-border-strong)] transition-colors max-w-[180px]"
      >
        <IconBraces size={11} className="shrink-0" />
        <span className="truncate">{preview}</span>
      </button>

      <Modal
        open={open}
        onOpenChange={setOpen}
        title="Metadata"
        description="Raw JSON payload attached to this event."
        size="md"
        footer={<Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>}
      >
        <pre className="surface-panel p-3 text-[12px] leading-relaxed font-mono text-[var(--color-foreground)] overflow-auto scrollbar-thin max-h-[60vh]">
          {formatted}
        </pre>
      </Modal>
    </>
  );
}
