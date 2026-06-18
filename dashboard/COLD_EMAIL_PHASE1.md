# Cold Email — Phase 1 (Campaign Foundation)

The first slice of a Cold Email system: create campaigns, build a recipient list
from existing Contacts/Leads, and track per-recipient delivery state + events
for analytics. Built entirely on the existing architecture (App Router RSC pages
→ client islands, Server Actions, Prisma, Better Auth, RBAC, Audit Logs, existing
UI/table/dialog/detail patterns). **No new libraries.**

> **Foundation only.** There is **no real email sending**, no Resend wiring, no
> inbox, no sequences, no scheduling, no templates, no AI, no mailbox/Gmail/
> Outlook sync. This phase ships the data model + UI + tracking infrastructure
> that a later sending/tracking phase writes into.

---

## 1. Database models added

Three org-scoped models + three enums (`prisma/schema.prisma`, migration
`20260618154350_phase3a_cold_email_campaigns` — **applied**).

### `EmailCampaign` (`email_campaign`)
| Field | Type | Notes |
|---|---|---|
| id | cuid PK | |
| organizationId | FK → organization (Cascade) | tenant scope |
| name, subject | String | |
| body | Text | |
| status | `EmailCampaignStatus` | default `DRAFT` |
| archivedAt | DateTime? | soft-delete (codebase convention) |
| createdById | FK → user (SetNull) | author |
| createdAt / updatedAt | DateTime | |

Indexes: `[organizationId]`, `[organizationId, status]`, `[organizationId, archivedAt]`.

### `EmailRecipient` (`email_recipient`)
| Field | Type | Notes |
|---|---|---|
| id | cuid PK | |
| campaignId | FK → email_campaign (Cascade) | |
| leadId | FK → lead (SetNull, optional) | provenance |
| contactId | FK → contact (SetNull, optional) | provenance |
| email, firstName, lastName | String / String? | **denormalized** at add-time so history is immutable |
| status | `EmailRecipientStatus` | default `PENDING` |
| sentAt, openedAt, clickedAt, repliedAt, bouncedAt | DateTime? | first-signal timestamps (drive analytics) |
| createdAt / updatedAt | DateTime | |

Indexes: `[campaignId]`, `[campaignId, status]`, `[leadId]`, `[contactId]`.

### `EmailEvent` (`email_event`)
| Field | Type | Notes |
|---|---|---|
| id | cuid PK | |
| recipientId | FK → email_recipient (Cascade) | |
| type | `EmailEventType` | |
| metadata | Json? | forensics (provider id, ip, ua, …) |
| createdAt | DateTime | |

Index: `[recipientId, createdAt]`. Append-only timeline powering Activity + analytics.

### Enums
- `EmailCampaignStatus` = `DRAFT | RUNNING | PAUSED | COMPLETED`
- `EmailRecipientStatus` = `PENDING | SENT | OPENED | CLICKED | REPLIED | BOUNCED`
- `EmailEventType` = `SENT | OPENED | CLICKED | REPLIED | BOUNCED`

Back-relations added to `Organization` (`emailCampaigns`), `User`
(`createdEmailCampaigns`), `Lead` (`emailRecipients`), `Contact` (`emailRecipients`).

> **Design note — `bouncedAt`:** added (not in the original field list) so the
> `BOUNCED` status has a matching first-signal timestamp, keeping the analytics
> helper uniform. Harmless and forward-compatible.

---

## 2. Permissions added

`src/lib/permissions/registry.ts` — five keys under resource `campaigns`,
following the exact `<resource>.<action>` convention:

`campaigns.view`, `campaigns.create`, `campaigns.edit`, `campaigns.delete`,
`campaigns.manage`.

### System role grants (mirrors the Leads access ladder)
| Role | Campaign permissions |
|---|---|
| Owner | all (auto — owner always gets the full registry) |
| Admin | view, create, edit, delete, manage |
| Manager | view, create, edit, delete |
| Team Lead | view, create, edit |
| HR | — (none, consistent with HR's non-CRM scope) |
| Employee | view |

**Applied to the DB:** ran `npm run db:resync-perms` (upserts the 5 keys, re-syncs
system-role grants for every org). New workspaces get them automatically —
`createWorkspaceAction` seeds the owner from the registry, and `db:seed` /
`db:resync-perms` seed the other system roles.

---

## 3. Routes added

Mirroring the Leads/Clients route shape (RSC page → client island):

| Route | File | Purpose |
|---|---|---|
| `/dashboard/campaigns` | `app/(dashboard)/dashboard/campaigns/page.tsx` | List + analytics |
| `/dashboard/campaigns/new` | `app/(dashboard)/dashboard/campaigns/new/page.tsx` | Create + pick recipients |
| `/dashboard/campaigns/[id]` | `app/(dashboard)/dashboard/campaigns/[id]/page.tsx` | Detail (Overview / Recipients / Activity) |

All pages: `requireSession()` → `can("campaigns.view")` (else `notFound()`),
org-scoped queries, `dynamic = "force-dynamic"`.

### Sidebar
New **Sales Outreach** section in `nav-config.ts` with a **Campaigns** item
(`/dashboard/campaigns`, icon `IconMailForward`, gated by `campaigns.view`).

---

## 4. Components added (`src/features/campaigns/`)

| File | Role |
|---|---|
| `campaigns-page-client.tsx` | List table — Campaign, Status, Recipients, Open rate, Reply rate, Created by, Created at, Actions (**View / Edit / Archive**) |
| `new-campaign-page-client.tsx` | Create form (name/subject/body) + recipient selection → create then add recipients → redirect to detail |
| `campaign-form-dialog.tsx` | Edit-only content dialog (name/subject/body), reused from list + detail |
| `campaign-detail-actions.tsx` | Edit + lifecycle controls (Start/Pause/Resume/Complete) + Archive/Restore |
| `campaign-overview.tsx` | Overview tab — stat block + email content |
| `campaign-recipients-table.tsx` | Recipients tab — table with status badges, add + remove |
| `add-recipients-dialog.tsx` | Modal wrapping the recipient selector (excludes already-added) |
| `recipient-selector.tsx` | Controlled multi-select over Contacts + Leads (search + checkboxes) |
| `campaign-activity-timeline.tsx` | Activity tab — `EmailEvent` timeline |
| `campaign-badges.tsx` | Shared `CampaignStatusBadge` + `RecipientStatusBadge` |
| `campaign-event-types.ts` | Client-safe literal-union for event types |
| `analytics.ts` | Pure DB-derived stat computation + rate formatting |

Reuses existing design system throughout: `DataTable`, `Modal`, `Field`, `Input`,
`Textarea`, `Dropdown*`, `Tabs*`, `Badge`, `Button`, `Checkbox`, `EmptyState`,
`PageHeader`, `useToast`.

---

## 5. Actions added (`src/actions/campaigns.ts`)

Every action: `requireVerifiedSession()` → RBAC `can()` (with `*.manage`
fallback) → Zod `safeParse` (`src/lib/validators/campaigns.ts`) → cross-org
ownership validation → Prisma write → `logAudit` → `revalidatePath`.

| Action | Permission | Notes |
|---|---|---|
| `createCampaignAction` | `campaigns.create` ∨ `manage` | creates DRAFT, `createdById` = current user |
| `updateCampaignAction` | `campaigns.edit` ∨ `manage` | name/subject/body; verifies org ownership |
| `setCampaignStatusAction` | `campaigns.edit` ∨ `manage` | DRAFT↔RUNNING↔PAUSED→COMPLETED (records intent only — no send) |
| `archiveCampaignAction` | `campaigns.delete` ∨ `manage` | soft archive/restore toggle (`archivedAt`) |
| `addRecipientsAction` | `campaigns.edit` ∨ `manage` | resolves contact/lead ids **in-org**, denormalizes email/name, de-dupes |
| `removeRecipientAction` | `campaigns.edit` ∨ `manage` | recipient located via its campaign's org (tenant guard) |

**Never trusts the client for recipient email** — addresses are resolved
server-side from the selected Contact/Lead records.

---

## 6. Audit events added

Written via the existing `logAudit` helper (append-only `AuditLog`, actor + IP +
UA), resource `campaign`:

| Event | When |
|---|---|
| `campaign.created` | create |
| `campaign.updated` | content edit **and** status transition (metadata records from/to) |
| `campaign.deleted` | archive (soft-delete) |
| `campaign.restored` | un-archive |
| `recipient.added` | `addRecipientsAction` (metadata: counts) |
| `recipient.removed` | `removeRecipientAction` (metadata: recipientId) |

> The codebase soft-deletes everything (`archivedAt`), so "Delete" is implemented
> as archive — and the archive emits `campaign.deleted` (with `campaign.restored`
> on the inverse), satisfying both the spec's audit name and the project's
> archive-vs-hard-delete convention.

---

## 7. Analytics implemented

Pure, **database-only** calculation in `analytics.ts` (no estimates), computed
from per-recipient timestamps so counts stay correct as a recipient advances
(someone who clicked still counts as opened):

- **Recipients** = total recipient rows
- **Sent** = `sentAt` set
- **Opened** = `openedAt` set
- **Clicked** = `clickedAt` set
- **Replied** = `repliedAt` set
- **Bounced** = `bouncedAt` set
- **Open rate** = opened / sent · **Reply rate** = replied / sent · **Click rate** = clicked / sent (0 when nothing sent)

Surfaced on the **list** (Open/Reply rate columns + recipient count) and the
**detail Overview** (full stat block). Everything reads `0` today because nothing
has been sent yet — which is correct for a foundation.

---

## 8. Future extension points

The model and seams are deliberately shaped so later phases drop in without
rework:

1. **Sending** — a `sendCampaignAction` / worker flips recipients to `SENT`,
   stamps `sentAt`, and writes a `SENT` `EmailEvent`. Hook it off the existing
   `RUNNING` transition in `setCampaignStatusAction` (already the intent marker).
2. **Tracking ingestion** — a webhook/route handler (like the audit export route)
   receives provider events, writes `EmailEvent` rows, and advances
   recipient status/timestamps. The Activity tab + analytics already render them.
3. **Resend integration** — reuse the existing `sendEmail` wrapper + `EmailConfig`;
   add `EmailDeliveryScope` entries if campaign sends need throttling.
4. **`EmailEvent.metadata`** is `Json` — ready for provider message ids, IPs,
   user-agent, link URLs for click attribution.
5. **Personalization tokens / templates** — `subject`/`body` are plain text now;
   a renderer can interpolate `{{firstName}}` etc. from the denormalized
   recipient fields.
6. **Recipient de-dupe by email** — currently de-duped by source id (contact/lead);
   a future unique index on `(campaignId, email)` can enforce address-level
   uniqueness once sending matters.
7. **Sequences / scheduling / inbox** — explicitly out of scope; the campaign +
   recipient + event triad is the substrate they'll build on.

---

## How to run

The migration and permission resync were **already applied** during the build:

```bash
npx prisma migrate deploy     # applied 20260618154350_phase3a_cold_email_campaigns
npm run db:resync-perms       # seeded campaigns.* + system-role grants
```

For a fresh clone, the same two commands (plus `npm run db:seed` for a brand-new
DB) bring everything up. Verified with `npx tsc --noEmit` and `npx eslint`
(both clean on all new files).
