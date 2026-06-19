import {
  IconLayoutDashboard,
  IconUsers,
  IconUserShield,
  IconKey,
  IconBuildingSkyscraper,
  IconBuildingStore,
  IconSitemap,
  IconUsersGroup,
  IconSettings,
  IconHistory,
  IconBuilding,
  IconAddressBook,
  IconTargetArrow,
  IconBriefcase,
  IconMailForward,
  IconMailFast,
} from "@tabler/icons-react";
import type { NavSection } from "@/types/navigation";

/**
 * Single source of truth for the sidebar. Permission gating happens at render
 * time inside <Sidebar/> using the resolved effective permissions for the
 * active member. Add new sections here; never branch by role in components.
 */
export const NAV_SECTIONS: NavSection[] = [
  {
    items: [
      { label: "Overview", href: "/dashboard", icon: IconLayoutDashboard },
    ],
  },
  {
    label: "CRM",
    items: [
      { label: "Leads",     href: "/dashboard/leads",     icon: IconTargetArrow, permissions: ["leads.view"] },
      { label: "Clients",   href: "/dashboard/clients",   icon: IconBriefcase,   permissions: ["clients.view"] },
      { label: "Companies", href: "/dashboard/companies", icon: IconBuilding,    permissions: ["companies.view"] },
      { label: "Contacts",  href: "/dashboard/contacts",  icon: IconAddressBook, permissions: ["contacts.view"] },
    ],
  },
  {
    label: "Sales Outreach",
    items: [
      { label: "Campaigns", href: "/dashboard/campaigns", icon: IconMailForward, permissions: ["campaigns.view"] },
      { label: "Sequences", href: "/dashboard/sequences", icon: IconMailFast,    permissions: ["sequences.view"] },
    ],
  },
  {
    label: "People",
    items: [
      { label: "Members",     href: "/dashboard/members",     icon: IconUsers,      permissions: ["members.view"] },
      { label: "Roles",       href: "/dashboard/roles",       icon: IconUserShield, permissions: ["roles.view"] },
      { label: "Permissions", href: "/dashboard/permissions", icon: IconKey,        permissions: ["roles.view", "permissions.manage"] },
    ],
  },
  {
    label: "Organization",
    items: [
      { label: "Branches",    href: "/dashboard/branches",    icon: IconBuildingStore,     permissions: ["branches.view"] },
      { label: "Departments", href: "/dashboard/departments", icon: IconSitemap,           permissions: ["departments.view"] },
      { label: "Teams",       href: "/dashboard/teams",       icon: IconUsersGroup,        permissions: ["teams.view"] },
      { label: "Workspace",   href: "/dashboard/organization", icon: IconBuildingSkyscraper, permissions: ["organizations.view"] },
    ],
  },
  {
    label: "System",
    items: [
      { label: "Audit Log", href: "/dashboard/audit",    icon: IconHistory,  permissions: ["audit.view"] },
      { label: "Settings",  href: "/dashboard/settings", icon: IconSettings, permissions: ["settings.view"] },
    ],
  },
];
