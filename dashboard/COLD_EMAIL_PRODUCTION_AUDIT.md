# Cold Email — Production Audit

**Type:** Read-only technical audit. No code was modified.
**Method:** Traced each workflow against actual source (not the phase docs). Every
finding cites `file:line`.
**Verdict (headline):** The system is a **well-built MVP**, not yet a
"production-ready cold email platform." One **hard product blocker** (reply
detection does not exist) plus several compliance/scale gaps. The tracking and
followup *code paths* are largely correct; the gaps are missing capabilities and
operational/config dependencies, not broken logic.

---

## 1. Architecture Review

The Cold Email system layers cleanly on the existing CRM/action architecture:

- **Models** (`prisma/schema.prisma`): `EmailCampaign`, `EmailRecipient`,
  `EmailEvent` (Phase 1/2A) + `EmailSequence`, `EmailSequenceStep`,
  `EmailSequenceEnrollment` (Phase 3). Status/timestamp lifecycle on
  `EmailRecipient`; append-only `EmailEvent` timeline.
- **Sending** is a server action (`sendCampaignAction`, `src/actions/campaigns.ts`)
  that reuses the shared `sendEmail()` → Resend wrapper (`src/lib/email/send-email.ts`).
- **Tracking** is three route handlers (`/api/email/open`, `/api/email/click`,
  `/api/webhooks/resend`) writing through one helper
  (`src/lib/email/tracking-events.ts`).
- **Followups** are a poll-based scheduler (`src/lib/email/sequence-runner.ts`)
  behind a cron route (`src/app/api/cron/sequences/route.ts`, `vercel.json`).
- **Analytics** are pure DB reads (`src/features/campaigns/analytics.ts`).

The layering is sound and idiomatic. The weaknesses are at the **edges**:
inbound signals (replies), compliance (unsubscribe/suppression), and throughput
(synchronous sends, no queue, single-row scheduler races).

---

## 2. Recipient Snapshot Review

**Current behavior (verified):** `addRecipientsAction`
(`src/actions/campaigns.ts:210-318`) resolves `email`, `firstName`, `lastName`,
and `companyId` from the source Contact/Lead **at add time** and writes them
denormalized onto `EmailRecipient` (`:260-285`), alongside `contactId`/`leadId`/
`companyId` FKs (`onDelete: SetNull`, `schema.prisma:969-992`). `sendCampaignAction`
sends to the **stored** `recipient.email` (`campaigns.ts:403-406, 427`) — it does
**not** re-read the Contact/Lead at send time.

1. **Intentional snapshot?** Yes. Phase 1 explicitly denormalizes "so history is
   immutable." The FKs are `SetNull`, so deleting the source preserves the row.
2. **History preserved correctly?** Yes for **sent** recipients — you keep the
   exact address/name you mailed, even after the Contact changes or is deleted.
3. **If the Contact changes after recipient creation?** Nothing updates the
   recipient. There is **no re-sync path** anywhere in the codebase (only
   `addRecipientsAction` / `removeRecipientAction`).
4. **Should a DRAFT campaign refresh?** Arguably yes — and it does **not**. A
   recipient added to a draft keeps the old snapshot. If a Contact's email is
   corrected after being added to a draft, the campaign **sends to the stale
   address** (send reads `recipient.email`, not the live Contact).
5. **Correct?** Correct for post-send history; **incorrect/risky for DRAFT**.
6. **Stale-data risk:** Real but bounded — only affects DRAFT campaigns edited
   after a Contact change. Workaround exists (remove + re-add the recipient).

**Recommendation (not implemented):** For DRAFT campaigns, either re-resolve the
snapshot at send time, refresh on recipient view/edit, or surface a "refresh
recipients" affordance. Leave SENT/in-flight recipients immutable.

---

## 3. Open Tracking Audit

**Pixel injection — verified correct.** `CampaignEmail`
(`src/emails/templates/campaign-email.tsx:42-50`) renders
`<Img src={openPixelUrl(recipientId)} …>` **only when `recipientId` is set**.
`sendCampaignAction` passes `recipientId: r.id` (`campaigns.ts:430`), so real
sends carry the pixel; previews don't.

**URL — verified correct.** `openPixelUrl` (`src/lib/email/tracking.ts:17-19`) →
`${BRAND.url}/api/email/open/{id}`, and `BRAND.url = process.env.NEXT_PUBLIC_APP_URL`
(`src/lib/constants/brand.ts:8`). ✅ uses `NEXT_PUBLIC_APP_URL`.

**Route — verified correct.** `/api/email/open/[recipientId]/route.ts` validates
the recipient exists (`:46-49`), calls `recordOpen` (`:51`), and always returns a
1×1 GIF with no-store headers (`:25-38`). `recordOpen`
(`src/lib/email/tracking-events.ts:20-36`) gates on `openedAt IS NULL`
(first-open-wins via atomic `updateMany`), bumps `SENT → OPENED` only (no
downgrade), and creates the `OPENED` event.

**UI — verified correct.** The recipients table renders `RecipientStatusBadge`
from `recipient.status` (`src/features/campaigns/campaign-recipients-table.tsx:89-94`),
and the detail page is `force-dynamic`, so a recorded open shows on next load.
Analytics count opens from `openedAt` (`analytics.ts:36`).

### "User opens the email but status stays SENT" — exact causes (code-traced)

The code path is correct; a stuck `SENT` is **not a code bug**. Exactly one of:

1. **Dev / missing key (most likely in non-prod):** `sendEmail` returns
   `{ ok: true, id: "dev-noop" }` **without sending** when `RESEND_API_KEY` is
   unset and `NODE_ENV !== "production"` (`send-email.ts:56-64`). The recipient
   is marked `SENT`, but **no email is ever delivered**, so the pixel can never
   load. (In production without a key, `sendEmail` returns an error and the
   recipient stays `PENDING` instead.)
2. **`NEXT_PUBLIC_APP_URL` unset/non-public:** the pixel `src` becomes
   `undefined/api/...` or points at a host the recipient's inbox can't reach →
   pixel never requested → `recordOpen` never runs.
3. **Image blocking (inherent to all pixel tracking):** Gmail/Outlook/Apple Mail
   block or proxy remote images by default. If images are blocked, the pixel GET
   never fires and the open is invisible. Conversely, Apple Mail Privacy
   Protection / Gmail proxy pre-fetch can record **false** opens. This is a
   limitation of the technique, not this implementation.

### Additional open-tracking findings

- **Per-recipient, not per-message (real limitation).** The gate is
  `openedAt IS NULL` on the **recipient**, and **every** email (initial + every
  followup) reuses the same `recipientId` pixel. So only the **first open in the
  recipient's lifetime** is ever recorded. Opens of followup #2/#3 are invisible
  if the recipient already opened #1. You **cannot** measure per-step open rates.
- **Status vs analytics divergence (minor, correct-by-design):** if a click is
  recorded before the open (images off but link clicked), `openedAt` is set but
  the status stays `CLICKED` (bump is `where: status = SENT`,
  `tracking-events.ts:29-32`). The open still counts in analytics; the status
  badge just shows the furthest state. Not a bug.

---

## 4. Click Tracking Audit

1. **URL rewrite — works.** `renderBody` (`campaign-email.tsx:60-89`) regex-finds
   bare `http(s)` URLs and wraps them in `<Link href={clickTrackingUrl(...)}>`
   when `recipientId` is set; trailing punctuation is preserved.
2. **Route — works.** `/api/email/click/[recipientId]/route.ts` validates the
   destination with `isSafeUrl` (`:29`, http/https only — **not an open
   redirect**), records the click if the recipient exists (`:33-41`), and
   302-redirects (`:47`).
3. **Recipient updates / 4. Event — works.** `recordClick`
   (`tracking-events.ts:39-57`) gates on `clickedAt IS NULL`, bumps
   `SENT/OPENED → CLICKED` (no downgrade), creates a `CLICKED` event with
   `{ url }`.
4. **UI — works.** Same status badge + `clickedAt`-based analytics.

### Edge cases / findings

- **Only auto-detected bare URLs are tracked.** The body is plain text; a URL
  written as markdown/anchor text, or split across lines, won't be rewritten. No
  CTA/button concept exists. (By design — minimal template.)
- **Per-recipient gate, same as opens:** a click on a followup won't register if
  the recipient already clicked the initial email. No per-step click attribution.
- **Click without open is possible:** clicking sets `clickedAt` but not
  `openedAt` (`recordClick` does not touch `openedAt`). So `clicked > opened` can
  occur in analytics. Defensible, but note the conditions treat them
  independently.
- **Unsafe/missing `url` → redirect to app home** (`route.ts:30`) — safe, though a
  silently-wrong link would dump the recipient on the dashboard origin.

---

## 5. Bounce Tracking Audit

1. **Route exists:** `/api/webhooks/resend/route.ts` (POST).
2. **Validation works:** `verifySvixSignature` (`:90-119`) implements the Svix
   HMAC-SHA256 scheme with `node:crypto` — reads `svix-id/-timestamp/-signature`,
   constant-time compares. Missing `RESEND_WEBHOOK_SECRET` → **rejects in prod**
   (`:32-34`), warns in dev.
3. **Correlation works (code):** `email.bounced` → `data.email_id` →
   `EmailEvent WHERE type=SENT AND metadata.messageId = email_id` (`:57-61`) →
   `recordBounce` sets `bouncedAt` + terminal `BOUNCED` + event
   (`tracking-events.ts:64-82`). The `messageId` is stored at send
   (`campaigns.ts:445`, `res.id`).
4. **Recipient status updates:** Yes, to terminal `BOUNCED` (first-bounce-wins).

### Would bounce tracking actually work in production today?

**Only if three operational prerequisites are met — none enforced by code:**

1. **`RESEND_API_KEY` set** so sends produce **real** Resend message ids (in dev,
   every SENT event stores `messageId: "dev-noop"`, so correlation is meaningless
   and `findFirst` would match an arbitrary recipient).
2. **`RESEND_WEBHOOK_SECRET` set** (else the route 500s in prod by design).
3. **A Resend webhook configured in the Resend dashboard** pointing at
   `/api/webhooks/resend`, subscribed to `email.bounced`. **There is no code or
   automation that registers this** — it's a manual dashboard step (documented in
   Phase 2B but easy to forget). Without it, bounces are simply never delivered.

### Additional findings

- **Provider field-name dependency:** correlation hinges on the bounce payload
  exposing `data.email_id`. If Resend's schema differs/changes, correlation
  silently returns `unknown_message` (`:62-64`) and no bounce is recorded.
- **Unindexed correlation lookup:** the `metadata.messageId` JSON-path query
  (`:58-60`) has no index (`EmailEvent` only indexes `[recipientId, createdAt]`,
  `schema.prisma:1012`). Fine at MVP volume; a full-table JSON scan at scale.
- **Only `email.bounced` handled.** `email.complained` (spam complaints) is
  ignored — a compliance signal that should suppress future sends.

**Bottom line:** the code is correct; bounce tracking is **config-gated**, not
code-blocked.

---

## 6. Reply Detection Audit — **PRODUCTION BLOCKER**

**Codebase-wide search for any write of `repliedAt` or `status = REPLIED`:**
every hit is a **read**, a **schema/enum definition**, or **documentation**.
There is **no write** anywhere.

- `repliedAt` is **read** by analytics (`analytics.ts:40`), the scheduler
  (`sequence-runner.ts:173`), and the condition engine
  (`sequence-conditions.ts:34`). It is **never assigned**.
- `status = "REPLIED"` is **read** in the scheduler's safety check
  (`sequence-runner.ts:149`) and rendered as a badge
  (`campaign-badges.tsx:26`). It is **never set**.
- The Resend webhook handles **only** `email.bounced` and explicitly ignores all
  other event types (`webhooks/resend/route.ts:48-50`). There is **no** inbound
  email processing, **no** reply webhook, **no** IMAP/Gmail/Outlook/mailbox
  integration anywhere in the repo.

**Answers:**
1. Can `repliedAt` ever be populated? **No.**
2. Can `REPLIED` ever be set? **No.**
3. Any inbound email processing? **No.**
4. Any reply webhook? **No.**
5. Any mailbox integration? **No.**
6. Does `CLICKED_NOT_REPLIED` actually function? **Partially / misleadingly.**
   `conditionPasses` returns `clickedAt !== null && repliedAt === null`
   (`sequence-conditions.ts:33-34`). Since `repliedAt` is **always null**, the
   "and not replied" clause is a **no-op** — it reduces to "clicked." It runs, but
   it does **not** actually exclude people who replied.

**Impact on followups (severe for cold email):**
- The safety rule "never followup a recipient who **REPLIED**"
  (`sequence-runner.ts:148-156`) **can never trigger** for replies (only for
  `BOUNCED`). A prospect who replies "stop emailing me" **keeps receiving the
  full followup sequence**. This is the #1 reputational/abuse risk in cold email.
- Reply-rate analytics are permanently `0` (`analytics.ts:40`).
- `CLICKED_NOT_REPLIED` steps will email people who already replied.

This is the single most important gap. **Reply detection is a hard blocker** for
calling this a cold-email platform.

---

## 7. Followup Engine Audit

**Enrollment:** `enrollSentRecipients` (`sequence-runner.ts:33-69`) — enrolls
sent recipients, `nextRunAt = sentAt + step1.delayDays`, idempotent via
`@@unique([sequenceId, recipientId])` + `skipDuplicates`. Correct.

**Scheduler / conditions / advancement:** `runSequenceScheduler`
(`:84-255`) — single indexed `findMany` (no N+1), bounded `take: limit`,
condition eval, send, advance. Logic is sound. Findings:

- **Race condition → duplicate events (real).** The scheduler **selects** due
  enrollments (`:102-141`) and only **updates** each one **after** sending
  (`:231-251`). There is **no claim/lock** (no "PROCESSING" state, no guarded
  `nextRunAt` flip before sending). Two overlapping runs — e.g. a long run that
  exceeds the hourly cron, or a manual hit during the cron — can both pull the
  same enrollment and both send + both write a `FOLLOWUP_SENT` event + both
  `logAudit`. The Resend **idempotencyKey** (`:185`,
  `seq_<enrollmentId>_step_<stepId>`) prevents the **duplicate email** (within
  Resend's dedup window), but **duplicate events/audit rows** and double pointer
  advancement are not prevented at the DB level.
- **Throughput vs `maxDuration` (real).** `maxDuration = 60`
  (`cron/sequences/route.ts:7`) with **sequential** sends of up to `limit = 200`
  (`:37`). At ~0.3–0.7s per Resend call, a run sends only ~**100–150** followups
  before the function is killed. With an **hourly** cron (`vercel.json`), max
  ~150 followups/hour — far below "thousands." Backlog accumulates (not lost —
  re-picked next run), but timing slips.
- **Kill-mid-loop at-least-once window.** If the function is killed **after**
  `sendEmail` succeeds but **before** the enrollment update commits, the
  enrollment stays `ACTIVE`/due and is re-sent next run (idempotencyKey saves the
  email; the event is written on the retry). Acceptable, but it's an
  at-least-once pipeline, not exactly-once.
- **Step deletion drifts the pointer (edge case).** `currentStep` is an **index**
  into the runtime-ordered steps array (`:158`). `deleteSequenceStepAction`
  removes a step without renumbering. Deleting an earlier step shifts every
  later step's index, so an in-flight enrollment can **skip** or **repeat** a
  step, and `nextRunAt = enrolledAt + steps[nextIndex].delayDays` (`:237`) can
  compute a past time (fires immediately) if delays aren't monotonic after the
  edit.
- **No "skip" event / observability.** Condition-skipped steps (`:223-226`)
  advance silently — no `EmailEvent`, so you can't see *why* a recipient got
  fewer emails. Minor.
- **Correct parts:** first-step send, completion when pointer passes the end
  (`:158-167, 240-251`), bounce/reply stop (`:148-156`, modulo the reply gap),
  and per-step idempotency keys are all correct.

---

## 8. Production Readiness Score

| System | Score | Rationale |
|---|---:|---|
| **Campaign Sending** | **6/10** | Correct + tracked sends, idempotency, per-recipient failure isolation. But: **synchronous** sequential loop in a user-triggered action (won't scale to thousands; risks request timeout), **no rate limiting / throttle / warmup**, **no suppression check**, dev-noop marks `SENT` without sending. |
| **Tracking (open/click)** | **7/10** | Code paths correct, open-redirect-safe, first-event-wins atomic. But: **per-recipient (not per-message)** so followup opens/clicks are invisible; image-blocking limits open accuracy; depends on a public `NEXT_PUBLIC_APP_URL`. |
| **Bounce Tracking** | **6/10** | Correct + signature-verified code. But **entirely config-gated** (real key + webhook secret + dashboard webhook registration), unindexed correlation, ignores `email.complained`. Won't work until those ops steps are done. |
| **Followups** | **5/10** | Engine logic sound + idempotent emails. But **scheduler race → duplicate events**, **throughput far below "thousands"**, step-deletion index drift, and its core safety net (stop-on-reply) is dead because reply detection doesn't exist. |
| **Reply Handling** | **0/10** | **Does not exist.** No inbound processing, no webhook, no mailbox. `repliedAt`/`REPLIED` are never written. Blocker. |

**Overall: an MVP (≈5/10), not a production cold-email platform.**

---

## 9. Production Blockers

Genuinely missing capabilities (verified absent in code), highest-impact first:

1. **Reply detection (HARD BLOCKER).** No way to set `repliedAt`/`REPLIED`. People
   who reply keep getting followups; reply analytics are always 0;
   `CLICKED_NOT_REPLIED` is misleading. Requires inbound email (Resend inbound /
   IMAP / mailbox integration) — explicitly out of scope so far, but **required**
   for a cold-email platform.
2. **Unsubscribe / opt-out (LEGAL BLOCKER).** The template has **no unsubscribe
   link** and `sendEmail` sets **no `List-Unsubscribe` header**
   (`send-email.ts:69-80`). Required by CAN-SPAM / GDPR / Google & Yahoo bulk-
   sender rules. Sending cold email without it risks legal exposure and spam-
   foldering.
3. **Suppression list.** No global suppressed/unsubscribed/hard-bounced table or
   check. `sendCampaignAction` and the scheduler send to anyone PENDING/enrolled.
   A hard-bounced or opted-out address on a *different* campaign can be mailed
   again.
4. **Spam-complaint handling.** `email.complained` is ignored — complaints should
   auto-suppress.
5. **Bounce webhook not provably configured in prod.** Code is ready; the Resend
   dashboard registration + `RESEND_WEBHOOK_SECRET` are manual and unverified.
6. **Sending scale/throughput.** Synchronous campaign send + 60s/sequential
   scheduler can't do "thousands" reliably; needs batching/queue + per-domain
   rate limiting and (ideally) warmup ramp.
7. **Scheduler concurrency safety.** No enrollment claim/lock → duplicate
   `FOLLOWUP_SENT` events/audits under overlapping runs.
8. **DRAFT recipient staleness.** No refresh of snapshot data for unsent drafts.

(Not blockers but worth noting: per-message open/click attribution, indexed
`messageId` correlation, deliverability tooling like SPF/DKIM/DMARC checks and
domain warmup.)

---

## 10. Recommended Fix Order

Ordered by risk-to-reputation/legal first, then correctness, then scale. (Audit
only — no fixes applied here.)

1. **Unsubscribe + `List-Unsubscribe` header + suppression list** — legal/
   deliverability table stakes; relatively contained. Gate every send
   (campaign + followup) on the suppression check.
2. **Reply detection** — close the blocker: ingest inbound/reply events
   (Resend inbound or mailbox) → set `repliedAt`/`REPLIED` + `REPLIED` event.
   This simultaneously revives the stop-on-reply safety net and
   `CLICKED_NOT_REPLIED`.
3. **Spam-complaint handling** — add `email.complained` to the existing webhook →
   suppress.
4. **Scheduler concurrency claim** — atomically claim enrollments (guarded
   `updateMany` to flip `nextRunAt`/a lock column before sending) to kill
   duplicate events; verify the prod cron + `CRON_SECRET` + `RESEND_WEBHOOK_SECRET`.
5. **Sending scale** — move campaign + followup sends to a batched/queued worker
   with per-domain rate limiting; decouple from the synchronous request.
6. **Per-message tracking attribution** (open/click per email, not per recipient)
   and **indexed `messageId`** correlation — analytics correctness + bounce
   performance.
7. **DRAFT recipient refresh** — re-resolve snapshot for unsent drafts (or refresh
   on edit); keep sent history immutable.
8. **Step-edit safety** — make `currentStep` resilient to step deletion
   (stable step ids / renumber-and-remap), and validate monotonic delays.

---

### Appendix — key files traced
- `prisma/schema.prisma` (models/enums/indexes)
- `src/actions/campaigns.ts` (send, add recipients, enrollment hook)
- `src/lib/email/send-email.ts` (dev-noop path, Resend call)
- `src/emails/templates/campaign-email.tsx` (pixel + link rewrite)
- `src/lib/email/tracking.ts`, `tracking-events.ts` (URL builders + first-event-wins writes)
- `src/app/api/email/open|click/[recipientId]/route.ts`, `src/app/api/webhooks/resend/route.ts`
- `src/lib/email/sequence-runner.ts`, `sequence-conditions.ts`, `src/app/api/cron/sequences/route.ts`, `vercel.json`
- `src/features/campaigns/analytics.ts`, `campaign-recipients-table.tsx`, `campaign-badges.tsx`
