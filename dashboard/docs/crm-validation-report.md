# CRM Validation Report — Phase 2D Prep

**Status:** Observational only. None of the changes below are implemented.
**Source:** Walk-through of `/dashboard/leads`, `/dashboard/leads/new`,
`/dashboard/leads/[id]`, `/dashboard/companies`, `/dashboard/contacts`,
`/dashboard/settings/pipelines`, and the new `/dashboard` analytics screen.
**Goal:** capture what's worth simplifying before the Client / Project / Invoice
work begins.

## 1. UX friction observed

### 1.1 Lead list

- **Five filter selects + global search** sit above the table. Reps will
  rarely use all five; the median session probably touches one or two. The
  Stage filter is the most useful and the easiest to miss because Pipeline
  must be picked first to enable it.
- **Archived/Active toggle ships as a separate `<Select>`** alongside Status
  / Priority / Owner / Pipeline / Stage. Visually it competes with the
  others, even though it's actually a different *kind* of filter (data
  scope vs. data filter).
- **`Search leads…`** only searches the lead title. Reps will type a
  company name first; nothing matches. No hint that the search is title-only.
- **Sorting on Value column** uses `Number(estimatedValue ?? 0)`. Leads
  with null value sort together with $0 leads — invisible to the user.
- **Currency column is missing**. Money is shown in the row's own currency,
  but the column header doesn't indicate that. A USD lead and a EUR lead
  sit next to each other with no way to spot the difference at a glance.

### 1.2 Lead detail

- **Owner reassign sits in the header** as a bare `<Select>`. Looks like
  a label, not a control. First-time users miss it.
- **Notes tab silently falls back to the linked Company's notes**. If a
  rep reads a note they added "on this lead", it's actually on the
  company — they may not realise that until the company changes.
- **Activity tab and Notes tab feel redundant for short engagements.**
  Activity has the audit-log shape; Notes have the human-context shape;
  early users will use one and ignore the other.
- **Five tabs on a mobile viewport wrap** to two rows once the Notes
  count grows into 3 digits. The header becomes taller than the
  PageHeader itself.

### 1.3 New-lead page (`/dashboard/leads/new`)

- **The form is correct but long.** Six sections, ~25 inputs. Lots of
  scrolling on laptops. The "Additional contacts" section is collapsible
  but the others aren't, even though most submissions skip Opportunity
  details too.
- **Currency defaults to USD** even for workspaces that operate in EUR /
  BDT. There's no workspace-level default.
- **Existing-company combobox** is good but ships every active company
  to the client. At >1k companies the inline typeahead starts to feel
  laggy and the bundle bloats.
- **Today counter on the right** is the only thing that signals you can
  stay on the page after submit. Easy to miss.
- **Form is `flex-col` + `max-w-3xl`** so the counter floats far to the
  right on wide monitors and looks orphaned.

### 1.4 Pipelines settings

- **Drag-drop is desktop-only** (HTML5 DnD). Already flagged in the audit.
- **"Default" badge** is the only signal of which pipeline gets used for
  new leads. Renaming the badge to "Used for new leads" would be clearer.
- **Stage delete is a trash icon** with no explanation that you can't
  delete a stage with leads — error only surfaces after click.

### 1.5 Companies & Contacts

- **Tags are still surfaced** on Company and Contact list views, but
  there is no read-side use of tags anywhere in the lead workflow yet.
  Reps who add tags see no payoff.
- **Contact list shows `phone` column on md+** but `email` on every
  size. Phone is more dialable on mobile; the reverse would be more
  useful.
- **Company detail's "Activity" tab is a coming-soon placeholder**
  while Leads has a working activity timeline. Inconsistent surface.

### 1.6 Dashboard (new this phase)

- **KPI cards stack to 2-up on small viewports**. Nine cards = 5 rows
  on mobile. A "show more" expand could trim the default view to the
  top 4.
- **Mixed-currency totals** all display in USD without flagging it.
  Document inside the report; consider a workspace-default currency
  field later (out of scope here).
- **No date-range selector** on Conversion / Average value KPIs.
  "Conversion" is all-time; "Avg lead value" is across active leads.
  Future phase candidate.

## 2. Fields that look unused (or near-unused)

### Lead

- `Lead.description` — collected in the create form and edit modal but
  never surfaced in the list, the activity feed, or any KPI. Likely
  fine to keep, but it's currently write-only.
- `Lead.priority` — visible in the row but never feeds a workflow
  (e.g. no "Urgent" filter banner, no escalation). Useful for filter
  scoping; if you don't use the filter, it's dead weight.

### Company

- `Company.address` — optional, separate from `city`. No address-shaped
  feature uses both. Could collapse into a single `location` text.
- `Company.phone` and `Company.email` at the company level — most
  agencies route through the primary contact's contact info. Sometimes
  set, rarely read.
- `Company.slug` — used in URLs (good), but the UI lets you edit it
  manually with no warning that changing it could break inbound links.
- `Company.status` (`ACTIVE` / `PROSPECT` / `ARCHIVED`) — the
  status enum is half-used: ARCHIVED is driven by `archivedAt`, but
  the PROSPECT vs ACTIVE distinction has no UI consequence today.

### Contact

- `Contact.notes` (inline string) — distinct from `Note` rows. Two
  different "notes" concepts on the same record is the most common
  user-confusion vector I'd predict.
- `Contact.linkedinUrl` — collected, never displayed as a link
  outside the contact form itself.

### Pipeline / Stage

- `PipelineStage.winProbability` — captured in the stage form, written
  to the DB, never displayed outside the stage editor. Could feed a
  "Weighted pipeline value" KPI in a later phase; if not, dead weight.
- `Pipeline.description` — set in the form, never rendered in lists
  or the lead modal.

### Reference data

- `Industry.slug`, `CompanySize.slug`, `LeadSource.slug` — slugs are
  edited via the form but only used internally for uniqueness. Users
  could be confused why both Name and Slug are required.

### Audit log

- `AuditLog.userAgent` — captured, shown only at `lg:` breakpoints
  truncated. Useful when forensic, noisy in steady state.

## 3. Duplicate / overlapping concepts

- **Two flavours of "notes"** on Contact: `Contact.notes` (inline
  card field) and `Note[]` (timeline). Consider collapsing to one.
- **Status vs. Archive** on Companies: `status = ARCHIVED` and
  `archivedAt` are kept in sync by the action; one is redundant.
- **`isActive` flag on Industry / CompanySize / LeadSource** in
  addition to `archivedAt`. Two flags for the same idea ("hide from
  picker"); the archive action toggles both together. One should go.
- **Owner exists on Company and on Lead**. Lead inherits nothing from
  Company.owner. Today there's no rule about when they should match
  or diverge.
- **Lead.leadSourceId vs. Company.leadSourceId** — both exist. Lead
  inherits from Company on the create-from-scratch path, but only
  for the existing-company branch. On the new-company branch the
  Lead gets the company's lead source via inheritance through the
  same field. Two sources of truth for the same concept.

## 4. Workflow simplification candidates

- **Lead Convert → Client CTA** is the obvious next surface. Once
  built, archiving WON leads happens automatically and the Leads
  list becomes purely "in flight". Reduces the need for the WON
  status filter.
- **Inline status pill** on the Lead row that doubles as a quick
  state changer (drag to stage, click to set WON/LOST) would skip
  the edit modal entirely for the most common action.
- **Bulk reassign owner** on the Leads list — multi-select rows,
  one dropdown to swap owner. Currently every reassign is a detail
  page visit.
- **Single-keystroke "New lead" shortcut** (e.g. `n`) on the Leads
  list. The form is the highest-frequency screen.
- **Company picker on Contacts list** — currently filter is text-only
  global. Filter by Company would let you find John Smith @ Acme
  without scrolling.
- **Sticky filter row** on lists. Filter selects scroll off-screen
  before the data does.
- **Pipelines page should preview the default pipeline at the top of
  Settings overview**. Today admins have to click through to see what
  stages new leads land in.

## 5. Fields safe to remove in a later phase

Pending a usage audit on real data, these are candidates:

- `Contact.notes` (string field) — superseded by the `Note` model.
- `Pipeline.description` — never rendered.
- `Industry.slug` / `CompanySize.slug` shown to admins — keep
  internally, hide from form UI.
- One of `Industry.isActive` + `Industry.archivedAt` (and the
  same for CompanySize / LeadSource).
- `Company.status` — replaced by archivedAt being null/not-null.
- `Lead.description` — if it stays write-only, drop or surface it.

None of these should be touched until we observe real-data usage.

## 6. Performance / scaling watch-list

- **`/dashboard/leads/new` ships entire active company + contact lists
  to the client** for inline search. Breaks at ~10k records.
- **`/dashboard/leads` ships every lead** for client-side filtering on
  Status / Priority / Owner / Pipeline / Stage. Same scale ceiling.
- **Owner aggregation in this dashboard** uses two groupBys + one
  members lookup. Three round-trips total. Fine at any scale.
- **No `loading.tsx` skeletons** on any dashboard route. Navigation
  between heavy pages (especially leads/[id] which fans out 16
  parallel queries) feels frozen.

## 7. Recommended sequence for the next polish pass

These are *not implemented*; this is a forward-looking suggestion list
for the team to argue with:

1. Replace inline combobox lists with paginated server search (Lead
   list + new-lead page).
2. Add `loading.tsx` Suspense skeletons for `/dashboard`,
   `/dashboard/leads`, `/dashboard/leads/[id]`.
3. Add a workspace-default currency field (settings table is fine to
   reuse — single org-level row).
4. Surface a usage report on `Lead.description`, `Pipeline.description`,
   `Contact.notes`, `PipelineStage.winProbability` after 30 days of
   real data to decide whether to keep them.
5. Promote drag-drop stage reorder to `@dnd-kit` (mobile-friendly).
6. Build the Lead → Client convert flow (already designed in the Phase
   2D architecture doc) — that turns the dashboard's `Won` KPI into
   a Client-creation trigger and tightens the Lead list.

## 8. Out of scope for this report

- Auth, Permissions, Audit infrastructure.
- Invitations, Pipelines, reference-data architecture.
- The Client / Project / Invoice modules.
- Any schema migration.
- Any code change to the items called out above.

This file is a checkpoint for Phase 2D planning. Update before any
changes to the Lead, Company, or Contact models so the next reviewer
inherits the same picture.
