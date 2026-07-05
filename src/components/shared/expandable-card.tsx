"use client";

import { useState } from "react";
import { IconChevronDown } from "@tabler/icons-react";

export function ExpandableCard({
  label,
  body,
}: {
  label: string;
  body: string;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className={`glass-card flex flex-col gap-3 rounded-2xl p-5 ${
        expanded ? "h-auto" : "h-[260px]"
      }`}
    >
      <div className="text-[11px] uppercase tracking-[0.18em] text-[#ff3131]">
        {label}
      </div>
      <p
        className={`text-[15px] leading-relaxed text-foreground ${
          expanded ? "" : "line-clamp-6 overflow-hidden"
        }`}
      >
        {body}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mt-auto flex items-center gap-1 self-start text-sm font-medium text-[#ff3131] transition-colors hover:text-[#c62525]"
      >
        {expanded ? "See less" : "See more"}
        <IconChevronDown
          size={15}
          stroke={2.2}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}
