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
  // Phase 2A — CRM foundation
  "company",
  "contact",
  "tag",
  "note",
  // Phase 2A.5 — reference data
  "industry",
  "company_size",
  "lead_source",
  // Phase 2B/2C — Lead management
  "lead",
  "pipeline",
  "pipeline_stage",
  // Phase 2E — Client management
  "client",
] as const;

export type AuditResource = (typeof AUDIT_RESOURCES)[number];
