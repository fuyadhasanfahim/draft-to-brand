import { cn } from "@/lib/utils";

/**
 * Tag chip — colored pill that respects the user-chosen hex color while
 * staying readable against both light and dark surfaces. Uses inline style
 * for color since Tailwind can't tree-shake arbitrary hex from props.
 */
export function TagChip({
  name,
  color,
  className,
  onRemove,
}: {
  name: string;
  color: string;
  className?: string;
  onRemove?: () => void;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none",
        className
      )}
      style={{
        color,
        backgroundColor: hexWithAlpha(color, 0.1),
        borderColor: hexWithAlpha(color, 0.25),
      }}
    >
      {name}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Remove ${name}`}
          onClick={onRemove}
          className="opacity-60 hover:opacity-100"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

function hexWithAlpha(hex: string, alpha: number): string {
  // Accepts #RRGGBB. Returns rgba() string.
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const intVal = parseInt(m[1], 16);
  const r = (intVal >> 16) & 255;
  const g = (intVal >> 8) & 255;
  const b = intVal & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
