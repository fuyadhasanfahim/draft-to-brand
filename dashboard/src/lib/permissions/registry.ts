/**
 * Permission registry — the source of truth for every permission key the app knows.
 * Seeded into the `permission` table; admins can grant any subset to any role.
 *
 * Convention: `<resource>.<action>` (lower-case, dot-separated).
 * `*.manage` is a convenience super-permission for that resource — code must
 * explicitly check for it (we do NOT implicitly expand it to view/create/edit/delete).
 */

export type PermissionKey =
  // Users / auth identity
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  // Members (agency profiles)
  | "members.view"
  | "members.invite"
  | "members.edit"
  | "members.remove"
  // Roles & permissions
  | "roles.view"
  | "roles.manage"
  | "permissions.manage"
  // Org graph
  | "organizations.view"
  | "organizations.manage"
  | "branches.view"
  | "branches.manage"
  | "departments.view"
  | "departments.manage"
  | "teams.view"
  | "teams.manage"
  // Audit
  | "audit.view"
  // Phase 2A — CRM foundation
  | "companies.view"
  | "companies.manage"
  | "contacts.view"
  | "contacts.manage"
  | "tags.manage"
  | "notes.view"
  | "notes.create"
  | "notes.edit.own"
  | "notes.edit.any"
  | "notes.delete.own"
  | "notes.delete.any"
  // Phase 2A.5 — reference data / settings
  | "settings.view"
  | "industries.manage"
  | "company-sizes.manage"
  | "lead-sources.manage"
  // Phase 2B — Lead management
  | "leads.view"
  | "leads.create"
  | "leads.edit"
  | "leads.delete"
  | "leads.manage"
  | "pipelines.manage"
  // Phase 2E — Client management
  | "clients.view"
  | "clients.create"
  | "clients.edit"
  | "clients.delete"
  | "clients.manage"
  // Phase 3A — Cold Email campaigns (Sales Outreach)
  | "campaigns.view"
  | "campaigns.create"
  | "campaigns.edit"
  | "campaigns.delete"
  | "campaigns.manage";

export type PermissionDef = {
  key: PermissionKey;
  resource: string;
  action: string;
  description: string;
};

export const PERMISSIONS: PermissionDef[] = [
  { key: "users.view",   resource: "users", action: "view",   description: "View user accounts" },
  { key: "users.create", resource: "users", action: "create", description: "Create user accounts" },
  { key: "users.edit",   resource: "users", action: "edit",   description: "Edit user accounts" },
  { key: "users.delete", resource: "users", action: "delete", description: "Delete user accounts" },

  { key: "members.view",   resource: "members", action: "view",   description: "View agency members" },
  { key: "members.invite", resource: "members", action: "invite", description: "Invite new members" },
  { key: "members.edit",   resource: "members", action: "edit",   description: "Edit member profiles, roles, assignments" },
  { key: "members.remove", resource: "members", action: "remove", description: "Remove members from the organization" },

  { key: "roles.view",         resource: "roles",       action: "view",   description: "View roles" },
  { key: "roles.manage",       resource: "roles",       action: "manage", description: "Create, edit, delete roles and assign permissions" },
  { key: "permissions.manage", resource: "permissions", action: "manage", description: "Grant or deny direct user permissions and overrides" },

  { key: "organizations.view",   resource: "organizations", action: "view",   description: "View organization settings" },
  { key: "organizations.manage", resource: "organizations", action: "manage", description: "Manage organization settings" },
  { key: "branches.view",        resource: "branches",      action: "view",   description: "View branches" },
  { key: "branches.manage",      resource: "branches",      action: "manage", description: "Create, edit, delete branches" },
  { key: "departments.view",     resource: "departments",   action: "view",   description: "View departments" },
  { key: "departments.manage",   resource: "departments",   action: "manage", description: "Create, edit, delete departments" },
  { key: "teams.view",           resource: "teams",         action: "view",   description: "View teams" },
  { key: "teams.manage",         resource: "teams",         action: "manage", description: "Create, edit, delete teams" },

  { key: "audit.view", resource: "audit", action: "view", description: "View audit log" },

  { key: "companies.view",   resource: "companies", action: "view",   description: "View companies in the CRM" },
  { key: "companies.manage", resource: "companies", action: "manage", description: "Create, edit, archive companies" },
  { key: "contacts.view",    resource: "contacts",  action: "view",   description: "View contacts in the CRM" },
  { key: "contacts.manage",  resource: "contacts",  action: "manage", description: "Create, edit, archive contacts" },
  { key: "tags.manage",      resource: "tags",      action: "manage", description: "Create, edit, delete tags for CRM records" },
  { key: "notes.view",        resource: "notes", action: "view",        description: "View notes on companies and contacts" },
  { key: "notes.create",      resource: "notes", action: "create",      description: "Add notes on companies and contacts" },
  { key: "notes.edit.own",    resource: "notes", action: "edit.own",    description: "Edit notes you created" },
  { key: "notes.edit.any",    resource: "notes", action: "edit.any",    description: "Edit any note in the workspace, regardless of author" },
  { key: "notes.delete.own",  resource: "notes", action: "delete.own",  description: "Delete notes you created" },
  { key: "notes.delete.any",  resource: "notes", action: "delete.any",  description: "Delete any note in the workspace, regardless of author" },

  { key: "settings.view",         resource: "settings",       action: "view",   description: "Open the Settings area (reference data, taxonomies, country browser)" },
  { key: "industries.manage",     resource: "industries",     action: "manage", description: "Create, edit, archive industry options" },
  { key: "company-sizes.manage",  resource: "company-sizes",  action: "manage", description: "Create, edit, archive company-size buckets" },
  { key: "lead-sources.manage",   resource: "lead-sources",   action: "manage", description: "Create, edit, archive lead-source taxonomy" },

  { key: "leads.view",       resource: "leads",     action: "view",   description: "View leads in the CRM" },
  { key: "leads.create",     resource: "leads",     action: "create", description: "Create new leads" },
  { key: "leads.edit",       resource: "leads",     action: "edit",   description: "Edit existing leads" },
  { key: "leads.delete",     resource: "leads",     action: "delete", description: "Archive or restore leads" },
  { key: "leads.manage",     resource: "leads",     action: "manage", description: "Full lead administration — create, edit, archive, reassign" },
  { key: "pipelines.manage", resource: "pipelines", action: "manage", description: "Create, edit, archive pipelines and stages" },

  { key: "clients.view",     resource: "clients",   action: "view",   description: "View clients (post-sale customers)" },
  { key: "clients.create",   resource: "clients",   action: "create", description: "Create clients directly or by converting a won lead" },
  { key: "clients.edit",     resource: "clients",   action: "edit",   description: "Edit existing client records" },
  { key: "clients.delete",   resource: "clients",   action: "delete", description: "Archive or restore clients" },
  { key: "clients.manage",   resource: "clients",   action: "manage", description: "Full client administration — convert, edit, archive, reassign" },

  { key: "campaigns.view",   resource: "campaigns", action: "view",   description: "View cold email campaigns and their analytics" },
  { key: "campaigns.create", resource: "campaigns", action: "create", description: "Create cold email campaigns" },
  { key: "campaigns.edit",   resource: "campaigns", action: "edit",   description: "Edit campaigns and manage their recipients" },
  { key: "campaigns.delete", resource: "campaigns", action: "delete", description: "Archive or restore campaigns" },
  { key: "campaigns.manage", resource: "campaigns", action: "manage", description: "Full campaign administration — create, edit, recipients, archive" },
];

export const ALL_PERMISSION_KEYS = PERMISSIONS.map((p) => p.key);

/**
 * System roles seeded on first run. Admins can create unlimited custom roles
 * later through the UI; these just give every fresh org a sane starting point.
 * Owner always receives ALL permissions; resolved at seed time, not stored here.
 */
export const SYSTEM_ROLES: Array<{
  slug: string;
  name: string;
  description: string;
  priority: number;
  permissions: PermissionKey[] | "*";
}> = [
  {
    slug: "owner",
    name: "Owner",
    description: "Full unrestricted access to the organization.",
    priority: 100,
    permissions: "*",
  },
  {
    slug: "admin",
    name: "Admin",
    description: "Administer the workspace, members, roles, and structure.",
    priority: 80,
    permissions: [
      "users.view", "users.edit",
      "members.view", "members.invite", "members.edit", "members.remove",
      "roles.view", "roles.manage", "permissions.manage",
      "organizations.view", "organizations.manage",
      "branches.view", "branches.manage",
      "departments.view", "departments.manage",
      "teams.view", "teams.manage",
      "audit.view",
      "companies.view", "companies.manage",
      "contacts.view", "contacts.manage",
      "tags.manage",
      "notes.view", "notes.create",
      "notes.edit.own", "notes.edit.any",
      "notes.delete.own", "notes.delete.any",
      "settings.view",
      "industries.manage", "company-sizes.manage", "lead-sources.manage",
      "leads.view", "leads.create", "leads.edit", "leads.delete", "leads.manage",
      "pipelines.manage",
      "clients.view", "clients.create", "clients.edit", "clients.delete", "clients.manage",
      "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.delete", "campaigns.manage",
    ],
  },
  {
    slug: "manager",
    name: "Manager",
    description: "Manage teams, departments, and member assignments.",
    priority: 60,
    permissions: [
      "members.view", "members.invite", "members.edit",
      "teams.view", "teams.manage",
      "departments.view",
      "branches.view",
      "roles.view",
      "companies.view", "companies.manage",
      "contacts.view", "contacts.manage",
      "tags.manage",
      "notes.view", "notes.create",
      "notes.edit.any", "notes.delete.any",
      "settings.view",
      "lead-sources.manage",
      "leads.view", "leads.create", "leads.edit", "leads.delete",
      "pipelines.manage",
      "clients.view", "clients.create", "clients.edit", "clients.delete",
      "campaigns.view", "campaigns.create", "campaigns.edit", "campaigns.delete",
    ],
  },
  {
    slug: "team-lead",
    name: "Team Lead",
    description: "Lead a team and oversee its members.",
    priority: 40,
    permissions: [
      "members.view",
      "teams.view",
      "departments.view",
      "branches.view",
      "companies.view", "contacts.view",
      "notes.view", "notes.create",
      "notes.edit.any", "notes.delete.any",
      "leads.view", "leads.create", "leads.edit",
      "clients.view", "clients.create", "clients.edit",
      "campaigns.view", "campaigns.create", "campaigns.edit",
    ],
  },
  {
    slug: "hr",
    name: "HR",
    description: "Manage member onboarding and profiles.",
    priority: 50,
    permissions: [
      "members.view", "members.invite", "members.edit", "members.remove",
      "users.view",
      "departments.view", "branches.view", "teams.view",
      "contacts.view",
    ],
  },
  {
    slug: "employee",
    name: "Employee",
    description: "Default access for staff members.",
    priority: 10,
    permissions: [
      "members.view",
      "teams.view",
      "departments.view",
      "branches.view",
      "companies.view", "contacts.view",
      "notes.view", "notes.create",
      "notes.edit.own", "notes.delete.own",
      "leads.view",
      "clients.view",
      "campaigns.view",
    ],
  },
];
