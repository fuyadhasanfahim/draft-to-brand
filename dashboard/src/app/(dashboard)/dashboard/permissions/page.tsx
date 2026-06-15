import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/session";
import { canAny } from "@/lib/permissions";
import { PageHeader } from "@/components/layouts/page-header";
import { Badge } from "@/components/ui";
import { PERMISSIONS, type PermissionDef } from "@/lib/permissions/registry";

export const metadata = { title: "Permissions" };

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
  // Phase 2A — CRM foundation
  companies: "Companies",
  contacts: "Contacts",
  tags: "Tags",
  notes: "Notes",
  // Phase 2A.5 — reference data / settings
  settings: "Settings",
  industries: "Industries",
  "company-sizes": "Company sizes",
  "lead-sources": "Lead sources",
  // Phase 2B/2C — Lead management
  leads: "Leads",
  pipelines: "Pipelines",
};

function groupByResource(defs: PermissionDef[]) {
  const map = new Map<string, PermissionDef[]>();
  for (const d of defs) {
    const arr = map.get(d.resource) ?? [];
    arr.push(d);
    map.set(d.resource, arr);
  }
  return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
}

export default async function PermissionsPage() {
  await requireSession();
  if (!(await canAny(["roles.view", "permissions.manage"]))) notFound();

  const groups = groupByResource(PERMISSIONS);

  return (
    <div>
      <PageHeader
        title="Permissions"
        description="The full registry of permission keys this workspace understands. Permissions are code-driven; assign them through roles."
        actions={<Badge variant="neutral">Read-only</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {groups.map(([resource, perms]) => (
          <section key={resource} className="surface-card p-5">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
                {RESOURCE_TITLES[resource] ?? resource}
              </h2>
              <Badge variant="neutral">{perms.length}</Badge>
            </div>
            <ul className="flex flex-col gap-3">
              {perms.map((p) => (
                <li key={p.key} className="flex flex-col">
                  <code className="text-[12px] font-mono text-[var(--color-foreground)]">{p.key}</code>
                  <span className="text-[12px] text-[var(--color-muted-foreground)] mt-0.5">
                    {p.description}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
