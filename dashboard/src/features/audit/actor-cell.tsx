import { Avatar } from "@/components/ui";

export function ActorCell({
  actor,
}: {
  actor: { id: string; name: string; email: string; image: string | null } | null;
}) {
  if (!actor) {
    return (
      <span className="text-[var(--color-muted)] text-xs italic">System</span>
    );
  }
  return (
    <div className="flex items-center gap-2 min-w-[200px]">
      <Avatar name={actor.name} src={actor.image ?? undefined} size="sm" />
      <div className="flex flex-col leading-tight min-w-0">
        <span className="text-[13px] text-[var(--color-foreground)] truncate">
          {actor.name}
        </span>
        <span className="text-[11px] text-[var(--color-muted)] truncate">
          {actor.email}
        </span>
      </div>
    </div>
  );
}
