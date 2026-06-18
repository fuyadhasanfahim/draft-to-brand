# Cold Email — Phase 2A (Real Email Sending Foundation)

Turns the Phase 1 campaign data model into something that actually sends. A DRAFT
campaign with recipients can now be dispatched through the **existing Resend
stack**, marking recipients `SENT`, stamping `sentAt`, writing `SENT` events, and
flipping the campaign to `RUNNING`. Built on the existing architecture (Server
Actions, Prisma, Better Auth, RBAC, Audit Logs, the existing `sendEmail` +
`EMAIL_CONFIG` + React Email infrastructure). **No new libraries. No second email
system.**

> **Scope guard.** This phase is *only* Campaign → Send → SENT events → analytics
> foundation. **Not built:** open-tracking pixel, click tracking, reply/bounce
> ingestion, followup sequences, inbox, scheduling, AI, Gmail/Outlook sync,
> automation. Those are later phases — the seams are left ready for them.

---

## 1. Schema changes

Migration `20260618155608_phase3b_campaign_sending_fields` — **applied**. Purely
additive (new nullable columns + one index + one FK), no data migration needed.

### `EmailCampaign` — sender identity
| Field | Type | Purpose |
|---|---|---|
| `fromName` | `String?` | Display name on the From header (e.g. *Fuyad Hasan*). Blank → brand default. |
| `replyTo` | `String?` | Where replies route (e.g. *fuyad@drafttobrand.com*). Blank → brand default. |

### `EmailRecipient` — company attribution
| Field | Type | Purpose |
|---|---|---|
| `companyId` | `String?` (FK → company, `SetNull`) | Enables future per-company reporting (open/reply rate by company). |

- **Populated automatically, server-side, never from the client** — resolved at
  add-time from **Contact → `companyId`** or **Lead → `companyId`** inside
  `addRecipientsAction`.
- Indexed `@@index([companyId])`; back-relation `Company.emailRecipients` added.

The `EmailRecipient` timestamp columns from Phase 1 (`sentAt`, `openedAt`, …) and
the `EmailEvent` table are reused as-is — no schema change needed for sending.

---

## 2. New / changed actions (`src/actions/campaigns.ts`)

### `sendCampaignAction({ campaignId })` — **new**
The core of this phase. Returns `{ ok, sent, failed } | { ok: false, error }`.

Pipeline (same shape as every other action):
`requireVerifiedSession()` → RBAC (`campaigns.edit ∨ campaigns.manage`) → Zod
(`sendCampaignSchema`) → org-ownership guard → send → batched persistence →
`logAudit` → `revalidatePath`.

### Changed
- `createCampaignAction` / `updateCampaignAction` — now persist `fromName` /
  `replyTo` (blank coerced to `null` → falls back to brand defaults).
- `addRecipientsAction` — now resolves and stores `companyId` from the source
  Contact/Lead (server-side).

### Validators (`src/lib/validators/campaigns.ts`)
- `campaignSchema` gains `fromName` (optional, ≤120) and `replyTo` (valid email
  or empty string).
- `sendCampaignSchema` = `{ campaignId }`.

---

## 3. Sending workflow

```
Campaign (DRAFT)
   ↓  read PENDING recipients (single query — no N+1)
For each PENDING recipient:
   ↓  sendEmail() ──► Resend
   ├─ success → collect: recipientId + SENT event (with provider messageId)
   └─ failure → count failed, log, CONTINUE (recipient stays PENDING)
   ↓
Batched transaction (one round-trip):
   • updateMany  → status=SENT, sentAt=now   (sent recipients)
   • createMany  → EmailEvent type=SENT       (one per sent)
   • update      → campaign.status=RUNNING
   ↓
Audit: campaign.sent  •  revalidate detail + list
```

**Rules enforced**
- Only **DRAFT** campaigns can be sent (the UI only shows the button then).
- Only **PENDING** recipients are sent. `SENT / OPENED / CLICKED / REPLIED /
  BOUNCED` are **never** re-sent (no resend in this phase). The `updateMany`
  re-asserts `status: PENDING` as a guard.
- A recipient with no email address is counted as failed and left PENDING.

**Performance** — recipients are loaded once; sends run per-recipient (sequential,
MVP); **all DB writes happen in a single batched `$transaction`** (`updateMany` +
`createMany` + `update`). No per-recipient queries. Queues are intentionally not
introduced yet.

---

## 4. Resend integration (reused, not rebuilt)

- Sends go through the existing **`sendEmail()`** (`src/lib/email/send-email.ts`),
  which renders the React Email template to HTML + plaintext and calls the
  shared **Resend** singleton. Transport errors are already swallowed into a
  `{ ok, error }` result — perfect for per-recipient isolation.
- **From header**: `buildFrom()` keeps the *verified* sending address from
  `EMAIL_CONFIG.from` and only overrides the **display name** with `fromName`
  (`"Fuyad Hasan <address>"`). A campaign can never send from an unverified
  domain.
- **Reply-To**: campaign `replyTo` overrides `EMAIL_CONFIG.replyTo` per send.
- **Idempotency**: each send passes `idempotencyKey = campaign_<id>_recipient_<id>`
  so an accidental double-fire is de-duped at Resend.
- **Tag**: `category=campaign` (distinct from the `transactional` auth mail).
- **Dev**: with no `RESEND_API_KEY`, `sendEmail` logs and returns a `dev-noop`
  success — so the whole flow (status → SENT, events, RUNNING) is testable
  without a key.

### Email template — `src/emails/templates/campaign-email.tsx`
Minimal, reuses the shared `EmailLayout` (brand header + footer) for visual
consistency. Renders the plain-text body (newlines preserved) and the required
footer line: **“You received this email from Draft To Brand.”** No builder, no
CTA, no personalization tokens yet (a `firstName` prop is reserved for later).

---

## 5. Status transitions

| Before | Trigger | After |
|---|---|---|
| `DRAFT` | **Send campaign** (≥1 sent) | `RUNNING` |
| `RUNNING` | Pause | `PAUSED` |
| `PAUSED` | Resume | `RUNNING` |
| `RUNNING` / `PAUSED` | Complete | `COMPLETED` |

- The DRAFT **manual "Start"** control was replaced by **"Send campaign"** —
  starting a DRAFT now *means* sending it. Pause/Resume/Complete remain manual
  (`setCampaignStatusAction`), unchanged.
- If every send fails, the campaign stays `DRAFT` so the user can retry.

### Send button (Campaign detail page)
A prominent **Send campaign** button shows **only when** the campaign is `DRAFT`,
**recipient count > 0**, not archived, and the user has edit/manage. On success it
toasts `Sent to N recipients` (and `M failed` if any) and refreshes.

---

## 6. Analytics updates

Analytics were already computed from real `EmailRecipient` timestamps in Phase 1,
so they light up automatically once sends stamp `sentAt`. This phase:
- Added a **Click rate** stat card to the Overview (alongside Recipients, Sent,
  Opened, Clicked, Replied, Bounced, Open rate, Reply rate).
- Surfaced **From name** and **Reply-to** on the Overview "Email" panel.

All values are pure DB reads — `Sent` and `Open/Reply/Click rate` now reflect real
sends. `Opened / Clicked / Replied / Bounced` stay `0` until the tracking phase
writes those events (correct, not faked).

---

## 7. Audit events

New event via the existing `logAudit` (append-only `AuditLog`, actor + IP + UA):

| Event | When | Metadata |
|---|---|---|
| `campaign.sent` | a campaign is dispatched | `{ campaignId, recipientCount, failedCount }` |

(`recipientCount` = successfully sent.) All Phase 1 events
(`campaign.created/updated/deleted/restored`, `recipient.added/removed`) are
unchanged.

---

## 8. Known limitations

1. **No incremental / resend.** Sending is a one-shot from `DRAFT`. Recipients
   added to an already-`RUNNING` campaign won't be sent in this phase (they stay
   `PENDING`). A future "send pending" / resend control will cover this.
2. **Sequential sends.** Recipients are emailed one-by-one in the request. Fine
   for MVP list sizes; large lists should move to a queue/batch worker (Phase 2B+)
   to avoid long-running requests and to respect provider rate limits.
3. **Failures aren't persisted per-recipient.** A failed send is counted +
   `console.error`'d and left `PENDING`; there's no `errorMessage` column yet.
   `EmailEvent.metadata` / a future field can capture this.
4. **No tracking yet.** Opens, clicks, replies, bounces are not recorded — those
   statuses/timestamps remain unused until Phase 2B wires a provider webhook.
5. **Empty-email recipients** (e.g. a lead whose contact has no email) are
   silently counted as failed.

---

## 9. Phase 2B preparation

The platform is now shaped to receive tracking and drive followups:
- **`EmailEvent` is the ingestion target.** A Resend **webhook route handler**
  (modeled on the existing audit-export route) can write `OPENED / CLICKED /
  REPLIED / BOUNCED` events and advance recipient status/timestamps. The Activity
  timeline + analytics already render whatever lands there.
- **Provider message id is stored** in the `SENT` event metadata
  (`{ messageId }`) — the join key to correlate inbound webhook events back to a
  recipient.
- **`EmailRecipient.companyId`** unlocks per-company analytics (`groupBy
  companyId`) the moment reporting is built.
- **`idempotencyKey`** convention is established for safe retries.
- **Status enum + timestamps** for the full lifecycle already exist — tracking is
  data-in, no schema churn.
- **Followups** can branch off recipient state (e.g. "no `repliedAt` after N
  days") once tracking populates it.

---

## How to run / verify

Migration + client already applied during the build:
```bash
npx prisma migrate deploy     # applied 20260618155608_phase3b_campaign_sending_fields
npx prisma generate
```
Verified clean with `npx tsc --noEmit`, `npx eslint`, and a full `npx next build`.
To exercise sending locally without a Resend key, leave `RESEND_API_KEY` unset —
`sendEmail` returns `dev-noop` and the full status/event/RUNNING flow still runs.
