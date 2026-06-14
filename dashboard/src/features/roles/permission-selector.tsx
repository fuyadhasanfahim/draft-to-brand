"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui";
import { PERMISSIONS, type PermissionDef } from "@/lib/permissions/registry";
import { cn } from "@/lib/utils";

export function groupByResource(defs: PermissionDef[]) {
  const map = new Map<string, PermissionDef[]>();
  for (const d of defs) {
    const arr = map.get(d.resource) ?? [];
    arr.push(d);
    map.set(d.resource, arr);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

const RESOURCE_TITLES: Record<string, string> = {
  users: "Users",
  members: "Members",
  roles: "Roles",
  permissions: "Permissions",
  organizations: "Organization",
  branches: "Branches",
  departments: "Departments",
  teams: "Teams",
  audit: "Audit Log",
};

export function PermissionSelector({
  value,
  onChange,
  disabled,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}) {
  const groups = React.useMemo(() => groupByResource(PERMISSIONS), []);
  const selected = React.useMemo(() => new Set(value), [value]);

  const toggle = (key: string) => {
    if (disabled) return;
    const next = new Set(selected);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    onChange(Array.from(next));
  };

  const toggleGroup = (groupKeys: string[], allSelected: boolean) => {
    if (disabled) return;
    const next = new Set(selected);
    if (allSelected) groupKeys.forEach((k) => next.delete(k));
    else groupKeys.forEach((k) => next.add(k));
    onChange(Array.from(next));
  };

  return (
    <div className="flex flex-col gap-4">
      {groups.map(([resource, perms]) => {
        const keys = perms.map((p) => p.key);
        const checkedCount = keys.filter((k) => selected.has(k)).length;
        const allSelected = checkedCount === keys.length;
        const someSelected = checkedCount > 0 && !allSelected;
        return (
          <div
            key={resource}
            className={cn(
              "surface-panel p-4",
              disabled && "opacity-60"
            )}
          >
            <div className="flex items-center justify-between gap-3 pb-3 mb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  {RESOURCE_TITLES[resource] ?? resource}
                </p>
                <p className="text-[11px] text-[var(--color-muted)]">
                  {checkedCount}/{keys.length} permissions
                </p>
              </div>
              <Checkbox
                checked={allSelected}
                ref={(el) => {
                  if (el) el.indeterminate = someSelected;
                }}
                onChange={() => toggleGroup(keys, allSelected)}
                disabled={disabled}
                label="Select all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {perms.map((p) => (
                <label
                  key={p.key}
                  className="flex items-start gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 cursor-pointer hover:bg-[var(--color-background)] transition-colors"
                >
                  <Checkbox
                    checked={selected.has(p.key)}
                    onChange={() => toggle(p.key)}
                    disabled={disabled}
                  />
                  <span className="flex flex-col leading-tight">
                    <code className="text-[12px] font-mono text-[var(--color-foreground)]">{p.key}</code>
                    <span className="text-[11px] text-[var(--color-muted)]">{p.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
