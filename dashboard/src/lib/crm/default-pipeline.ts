/**
 * Default sales pipeline seeded into every new workspace.
 *
 * Slugs are stable identifiers — admins can rename `name` and adjust colors
 * without breaking Lead references. The seven stages model a generic agency
 * sales motion: a Lead walks left → right, ending at Won or Lost.
 */

export const DEFAULT_PIPELINE = {
  name: "Sales Pipeline",
  slug: "sales",
  description: "Default sales pipeline. Rename, reorder, or replace from /dashboard/pipelines.",
};

type DefaultStage = {
  name: string;
  slug: string;
  color: string;
  sortOrder: number;
  winProbability: number;
  outcome: "OPEN" | "WON" | "LOST";
};

export const DEFAULT_PIPELINE_STAGES: DefaultStage[] = [
  { name: "New",           slug: "new",            color: "#6b6e6e", sortOrder: 10, winProbability: 5,   outcome: "OPEN" },
  { name: "Contacted",     slug: "contacted",      color: "#0891b2", sortOrder: 20, winProbability: 15,  outcome: "OPEN" },
  { name: "Qualified",     slug: "qualified",      color: "#2563eb", sortOrder: 30, winProbability: 35,  outcome: "OPEN" },
  { name: "Proposal Sent", slug: "proposal-sent",  color: "#7c3aed", sortOrder: 40, winProbability: 55,  outcome: "OPEN" },
  { name: "Negotiation",   slug: "negotiation",    color: "#d97706", sortOrder: 50, winProbability: 75,  outcome: "OPEN" },
  { name: "Won",           slug: "won",            color: "#16a34a", sortOrder: 60, winProbability: 100, outcome: "WON"  },
  { name: "Lost",          slug: "lost",           color: "#ef4444", sortOrder: 70, winProbability: 0,   outcome: "LOST" },
];
