/**
 * Audit constants safe for client + server.
 *
 * Keep this file free of any `server-only` imports — both the server-side
 * query helper and the client filter form pull from here.
 */

export const AUDIT_RESOURCES = [
  "organization",
  "member",
  "role",
  "invitation",
  "branch",
  "department",
  "team",
] as const;

export type AuditResource = (typeof AUDIT_RESOURCES)[number];
