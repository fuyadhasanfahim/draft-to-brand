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
  | "notes.create"
  | "notes.edit"
  | "notes.delete";

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
  { key: "notes.create",     resource: "notes",     action: "create", description: "Add notes on companies and contacts" },
  { key: "notes.edit",       resource: "notes",     action: "edit",   description: "Edit notes (your own; admins can edit any)" },
  { key: "notes.delete",     resource: "notes",     action: "delete", description: "Delete notes" },
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
      "notes.create", "notes.edit", "notes.delete",
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
      "notes.create", "notes.edit",
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
      "notes.create",
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
      "notes.create",
    ],
  },
];
