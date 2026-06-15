/**
 * Default reference taxonomy applied to every new workspace.
 *
 * Editable from /dashboard/settings the moment the workspace is created.
 * Slugs are stable identifiers — admins can rename `name` without breaking
 * existing references.
 */

export const DEFAULT_INDUSTRIES: { name: string; slug: string }[] = [
  { name: "Marketing",  slug: "marketing" },
  { name: "SaaS",       slug: "saas" },
  { name: "E-commerce", slug: "ecommerce" },
  { name: "Retail",     slug: "retail" },
  { name: "Healthcare", slug: "healthcare" },
  { name: "Finance",    slug: "finance" },
  { name: "Education",  slug: "education" },
  { name: "Real Estate", slug: "real-estate" },
  { name: "Hospitality", slug: "hospitality" },
  { name: "Other",      slug: "other" },
];

export const DEFAULT_COMPANY_SIZES: {
  name: string;
  slug: string;
  sortOrder: number;
}[] = [
  { name: "1",        slug: "size-1",     sortOrder: 10 },
  { name: "2–10",     slug: "size-2-10",  sortOrder: 20 },
  { name: "11–50",    slug: "size-11-50", sortOrder: 30 },
  { name: "51–200",   slug: "size-51-200", sortOrder: 40 },
  { name: "201–500",  slug: "size-201-500", sortOrder: 50 },
  { name: "501–1000", slug: "size-501-1000", sortOrder: 60 },
  { name: "1000+",    slug: "size-1000-plus", sortOrder: 70 },
];

export const DEFAULT_LEAD_SOURCES: {
  name: string;
  slug: string;
  color: string;
}[] = [
  { name: "Website",       slug: "website",       color: "#2563eb" },
  { name: "Referral",      slug: "referral",      color: "#16a34a" },
  { name: "Cold Outreach", slug: "cold-outreach", color: "#6b6e6e" },
  { name: "Event",         slug: "event",         color: "#d97706" },
  { name: "Partner",       slug: "partner",       color: "#7c3aed" },
  { name: "Social",        slug: "social",        color: "#0891b2" },
  { name: "Inbound",       slug: "inbound",       color: "#ff3131" },
  { name: "Other",         slug: "other",         color: "#57534e" },
];
