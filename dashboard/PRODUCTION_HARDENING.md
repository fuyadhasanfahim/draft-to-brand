# Cold Email — Production Hardening

Resolves the production blockers from `COLD_EMAIL_PRODUCTION_AUDIT.md`:
unsubscribe/suppression, reply detection, scheduler race-safety, draft recipient
refresh, and pre-send safety checks (List-Unsubscribe + suppression + reply +
bounce). Built on the existing architecture (Prisma, server actions, the existing
`sendEmail`/tracking stack, route handlers). **No inbox, no conversation UI, no
mailbox management, no AI, no Gmail/Outlook sync, no CRM redesign.**

Verified clean: `npx tsc --noEmit`, `npx eslint`, full `npx next build`. Migration
`20260619041105_production_hardening_suppression_lock` applied; permissions
unchanged (no new keys needed).

---

## 1. Changes made

### Schema (migration — additive only)
- **`SuppressionList`** model + **`SuppressionReason`** enum
  (`UNSUBSCRIBE | BOUNCE | COMPLAINT | MANUAL`). Org-scoped, `@@unique([organizationId, email])`,
  `@@index([organizationId, email])`. `Organization.suppressions` back-relation.
- **`EmailSequenceEnrollment.lockedAt DateTime?`** — scheduler claim lock.

### New modules / routes
| File | Purpose |
|---|---|
| `src/lib/email/suppression.ts` | `addSuppression` (idempotent upsert), `isSuppressed`, `suppressedEmailSet` (batch, no N+1) |
| `src/lib/email/unsubscribe.ts` | HMAC-signed unsubscribe token (`BETTER_AUTH_SECRET`) + `unsubscribeUrl` builder |
| `src/app/api/email/unsubscribe/[recipientId]/route.ts` | Public GET (confirm page) + POST (one-click opt-out → suppress) |
| `src/app/api/webhooks/inbound/route.ts` | Reply ingestion → `recordReply` (bearer-secret auth, provider-agnostic) |

### Changed modules
| File | Change |
|---|---|
| `src/lib/email/send-email.ts` | `headers` passthrough (for `List-Unsubscribe`) |
| `src/lib/email/tracking-events.ts` | New `recordReply` + `recordComplaint`; `recordBounce` now suppresses + stops enrollments; shared `stopEnrollments` |
| `src/app/api/webhooks/resend/route.ts` | Now also handles `email.complained` → `recordComplaint` |
| `src/emails/templates/campaign-email.tsx` | Renders an **Unsubscribe** footer link when `unsubscribeUrl` is provided |
| `src/actions/campaigns.ts` | `sendCampaignAction`: suppression filter + `List-Unsubscribe` headers + unsubscribe link; new **`refreshRecipientsAction`** (DRAFT-only snapshot refresh) |
| `src/lib/email/sequence-runner.ts` | Atomic enrollment **claim-lock**; suppression stop; unsubscribe header on followups |
| `src/features/campaigns/campaign-recipients-table.tsx` | "Refresh recipients" button (DRAFT only) |
| `src/features/campaigns/campaign-detail-actions.tsx` | Send toast surfaces suppressed count |

---

## 2. Production blockers resolved

### Priority 1 + 5 — Unsubscribe & suppression (Do Not Contact)
- **`SuppressionList`** is the single Do-Not-Contact ledger, org-scoped and
  email-keyed. Populated by **unsubscribe** (one-click / footer), **hard bounce**,
  and **spam complaint**.
- **One-click unsubscribe** (RFC 8058): every campaign + followup send now sets
  `List-Unsubscribe: <url>` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click`,
  and the email footer carries a visible **Unsubscribe** link. The URL is
  `/api/email/unsubscribe/{recipientId}?token=<hmac>` — the token is an HMAC of
  the recipient id, so a recipient can only unsubscribe themselves.
- **Global unsubscribe page:** GET renders a confirmation page (does *not* mutate,
  so email-scanner prefetch can't auto-unsubscribe); POST performs the opt-out and
  is also the RFC 8058 one-click target.
- **Enforced before every send:** `sendCampaignAction` filters PENDING recipients
  through `suppressedEmailSet` (one query); the scheduler batch-checks the due set
  and **stops** any enrollment whose recipient is suppressed. Suppressed recipients
  are skipped (left PENDING), never mailed.

### Priority 2 — Reply detection
- **Provider analysis:** Resend's standard webhook does **not** emit reply events
  (replies land in the campaign reply-to mailbox). So reply detection requires an
  **inbound-email feed**, not the existing webhook.
- **Implemented** `POST /api/webhooks/inbound` (bearer-auth, provider-agnostic):
  point Resend Inbound / SendGrid Inbound Parse / Mailgun Routes / a mailbox
  forward at it. It correlates a reply to recipient(s) by (1) `In-Reply-To`
  message id against SENT/FOLLOWUP_SENT events, then (2) the reply's sender email
  → non-terminal recipients, and calls **`recordReply`**.
- **`recordReply`** sets `repliedAt`, advances status → **`REPLIED`** (forward-only),
  writes a **`REPLIED` `EmailEvent`**, and **stops the recipient's active
  enrollments**. This revives the dead safety net and makes `CLICKED_NOT_REPLIED`
  actually exclude repliers.
- **This is not an inbox:** no message body stored, no conversation rendered — only
  the REPLIED signal + sequence stop.

### Priority 3 — Scheduler hardening (no duplicate sends/events)
- Added **`lockedAt`** and an **atomic claim**: each tick claims an enrollment with
  `updateMany WHERE id = X AND status = ACTIVE AND currentStep = <expected> AND
  (lockedAt IS NULL OR lockedAt < staleThreshold)` → `lockedAt = now`. If
  `count === 0`, another run already owns it (or advanced it) and we skip.
- The `currentStep` assertion is the key: even with a stale in-memory snapshot, a
  run can't process a step a concurrent run already advanced past. Combined with
  the existing per-step `idempotencyKey`, this prevents **both** duplicate emails
  **and** duplicate `FOLLOWUP_SENT` events.
- **Crash-safe:** a lock older than 15 min is reclaimable, so a killed run can't
  strand an enrollment. The lock is cleared on every advance/complete/stop.

### Priority 4 — Draft recipient refresh
- **`refreshRecipientsAction(campaignId)`** re-resolves `email/firstName/lastName/
  companyId` from each recipient's live source Contact/Lead — **DRAFT only**
  (rejects RUNNING/PAUSED/COMPLETED so sent history stays immutable). Manual
  recipients and deleted-source recipients are skipped; only changed rows are
  written (batched in one transaction). Exposed as a **Refresh recipients** button
  on the Recipients tab for draft campaigns.

### Priority 5 — Production safety before all sends
Both `sendCampaignAction` and the followup scheduler now, before sending:
- **List-Unsubscribe** header + footer link on every message.
- **Suppression check** (unsubscribed / bounced / complained → skip or stop).
- **Reply suppression** — REPLIED recipients are stopped (and never re-sent).
- **Bounce suppression** — BOUNCED recipients are stopped; the address is added to
  the suppression list so *future* campaigns can't re-mail it.

---

## 3. Remaining risks

1. **Reply detection requires inbound-feed configuration.** The endpoint exists,
   but no replies are detected until inbound parsing/forwarding is pointed at
   `/api/webhooks/inbound` with `INBOUND_WEBHOOK_SECRET` set. Until then,
   reply-based stop and `CLICKED_NOT_REPLIED` remain inert.
2. **Reply correlation by sender email is shared-mailbox-scoped.** With a single
   brand reply-to mailbox, a reply is matched by sender address across the system;
   in the rare case the same person is a non-terminal recipient in two orgs, both
   could be marked REPLIED. Per-recipient VERP reply addresses would make this
   exact + tenant-safe, but that pushes toward owning the reply mailbox (out of
   scope here).
3. **Bounce/complaint still require the Resend dashboard webhook** (+ `RESEND_WEBHOOK_SECRET`)
   to be configured — unchanged from Phase 2B. Suppression on bounce/complaint
   only fires once those events arrive.
4. **Throughput unchanged.** Sends are still sequential (campaign action +
   `maxDuration`-bounded scheduler). The scheduler is now race-safe but not faster;
   "thousands/hour" still needs batching/queue + per-domain rate limiting.
5. **Suppression is opt-out, not global pre-validation.** No MX/role-address/
   disposable-domain checks before send; suppression catches addresses only after
   a bounce/complaint/unsubscribe.
6. **`refreshRecipientsAction` is unbounded per draft** (one update per changed
   recipient in a single transaction) — fine for normal drafts, would want
   chunking for very large lists.
7. **No `COMPLAINED` event/status** — complaints suppress + stop but don't write a
   dedicated event row (avoided another enum migration); the suppression row is the
   record.

---

## 4. Recommended next phase

In priority order, building on what's now in place:

1. **Wire the inbound feed in prod** (Resend Inbound or mailbox forward →
   `/api/webhooks/inbound`) + set `INBOUND_WEBHOOK_SECRET`, and configure the
   Resend bounce/complaint webhook. This turns the newly-built reply/complaint
   handling from "ready" into "live."
2. **Sending throughput & rate limiting** — move campaign + followup sends to a
   batched/queued worker with per-domain throttling (the scheduler is already
   idempotent + claim-locked, so it's queue-ready). Optional domain warmup ramp.
3. **Tenant-safe reply correlation** — per-recipient reply addressing (VERP) if/when
   reply capture moves in-house, removing the shared-mailbox caveat.
4. **Suppression UX + pre-send hygiene** — a Settings → Suppression list view
   (manual add/import/export), plus optional role-address/disposable-domain
   filtering at add-recipients time.
5. **Per-message tracking attribution** — open/click per email rather than
   per-recipient (noted in the audit) so followup engagement is measurable.

---

## Configuration (new/relevant env)

| Var | Required | Purpose |
|---|---|---|
| `BETTER_AUTH_SECRET` | ✓ (existing) | Also signs unsubscribe tokens. |
| `INBOUND_WEBHOOK_SECRET` | prod (for replies) | Bearer auth for `/api/webhooks/inbound`. Unset → rejected in prod, dev-open. |
| `RESEND_WEBHOOK_SECRET` | prod (existing) | Bounce **and** complaint webhook signature. |
| `NEXT_PUBLIC_APP_URL` | ✓ (existing) | Absolute base for unsubscribe + tracking URLs. |
