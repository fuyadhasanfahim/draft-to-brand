import type { Icon } from "@tabler/icons-react";
import type { PermissionKey } from "@/lib/permissions/registry";

export type NavItem = {
  label: string;
  href: string;
  icon: Icon;
  /** If set, the item is only rendered when the user has ANY of these permissions. */
  permissions?: PermissionKey[];
  children?: NavItem[];
};

export type NavSection = {
  label?: string;
  items: NavItem[];
};
