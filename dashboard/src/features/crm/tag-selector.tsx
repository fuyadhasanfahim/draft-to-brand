"use client";

import * as React from "react";
import { IconPlus, IconTags } from "@tabler/icons-react";
import {
  Button,
  Dropdown,
  DropdownContent,
  DropdownTrigger,
  Input,
  useToast,
} from "@/components/ui";
import { upsertTagAction } from "@/actions/tags";
import { cn } from "@/lib/utils";
import { TagChip } from "./tag-chip";

export type TagOption = { id: string; name: string; color: string };

/**
 * Inline tag picker used inside company/contact forms.
 * Lets the user toggle existing tags and create new ones on the fly
 * (via `tags.manage` action). Stateless w.r.t the parent form — emits
 * the selected ids list via `onChange`.
 */
export function TagSelector({
  tags,
  value,
  onChange,
  canCreate,
}: {
  tags: TagOption[];
  value: string[];
  onChange: (next: string[]) => void;
  canCreate: boolean;
}) {
  const { toast } = useToast();
  const [filter, setFilter] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [available, setAvailable] = React.useState<TagOption[]>(tags);

  React.useEffect(() => setAvailable(tags), [tags]);

  const selectedSet = React.useMemo(() => new Set(value), [value]);
  const selectedTags = available.filter((t) => selectedSet.has(t.id));
  const filtered = available.filter((t) =>
    t.name.toLowerCase().includes(filter.toLowerCase())
  );

  const toggle = (id: string) => {
    onChange(selectedSet.has(id) ? value.filter((v) => v !== id) : [...value, id]);
  };

  const create = async () => {
    const name = filter.trim();
    if (!name) return;
    setCreating(true);
    const res = await upsertTagAction({ name, color: "#6b6e6e" });
    setCreating(false);
    if (!res.ok || !res.data) {
      toast({ variant: "error", title: "Couldn't create tag", description: res.ok ? "" : res.error });
      return;
    }
    setAvailable((prev) => [...prev, res.data!]);
    onChange([...value, res.data.id]);
    setFilter("");
  };

  const exactMatch = filter.trim().length > 0 &&
    available.some((t) => t.name.toLowerCase() === filter.trim().toLowerCase());

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selectedTags.map((t) => (
        <TagChip
          key={t.id}
          name={t.name}
          color={t.color}
          onRemove={() => toggle(t.id)}
        />
      ))}

      <Dropdown>
        <DropdownTrigger>
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-[var(--color-border-strong)] px-2 py-0.5 text-[11px] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:border-[var(--color-dark)] transition-colors"
            aria-label="Add tag"
          >
            <IconTags size={11} />
            {selectedTags.length === 0 ? "Add tag" : "Add"}
          </button>
        </DropdownTrigger>
        <DropdownContent align="start" width="w-64" className="p-2">
          <Input
            autoFocus
            placeholder="Search or create…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="h-8 text-[12px] mb-1.5"
          />
          <div className="max-h-56 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 && filter.trim() === "" ? (
              <p className="px-2 py-2 text-[11px] text-[var(--color-muted)]">
                No tags yet. Type a name to create one.
              </p>
            ) : null}
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggle(t.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-[6px] px-2 py-1.5 text-sm transition-colors hover:bg-[var(--color-border)]/40",
                  selectedSet.has(t.id) && "bg-[var(--color-border)]/30"
                )}
              >
                <TagChip name={t.name} color={t.color} />
                {selectedSet.has(t.id) ? (
                  <span className="text-[10px] text-[var(--color-muted)]">selected</span>
                ) : null}
              </button>
            ))}
          </div>
          {canCreate && filter.trim() && !exactMatch ? (
            <div className="mt-1.5 border-t border-[var(--color-border)] pt-1.5">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="w-full justify-start"
                loading={creating}
                onClick={create}
              >
                <IconPlus size={12} /> Create &ldquo;{filter.trim()}&rdquo;
              </Button>
            </div>
          ) : null}
        </DropdownContent>
      </Dropdown>
    </div>
  );
}
