import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-7 w-7 text-[10px]",
  md: "h-9 w-9 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-14 w-14 text-base",
} as const;

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  src?: string | null;
  name?: string;
  size?: keyof typeof sizes;
}

function initials(name?: string) {
  if (!name) return "?";
  return name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function Avatar({ src, name, size = "md", className, ...props }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex items-center justify-center rounded-full bg-[var(--color-border)] text-[var(--color-muted-foreground)] font-medium uppercase overflow-hidden",
        sizes[size],
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      ) : (
        <span>{initials(name)}</span>
      )}
    </span>
  );
}
