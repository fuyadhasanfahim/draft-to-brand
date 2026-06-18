# Cold Email — Phase 2B (Email Tracking Infrastructure)

Adds **open / click / bounce** tracking on top of Phase 2A's sending. Sent emails
now carry a 1×1 open pixel and click-tracked links, and a Resend webhook ingests
bounces. Each signal advances the recipient's status (forward only), stamps the
matching timestamp, and writes an append-only `EmailEvent`, which the existing
analytics and activity timeline already render. Built on the existing
architecture (App Router route handlers, Prisma, the existing email stack,
`EmailEvent`/`EmailRecipient` models). **No new libraries, no schema changes, no
second email system.**

> **Scope guard.** This phase is *only* Send → Open → Click → Bounce tracking.
> **Not built:** followup sequences, inbox, reply management, scheduling, AI,
> Gmail/Outlook sync, automation. The seams for followups are left ready.

---

## 0. No schema changes required

Phase 1/2A already shipped everything tracking needs:
- `EmailRecipient.openedAt / clickedAt / bouncedAt` (timestamps)
- `EmailRecipientStatus` enum includes `OPENED / CLICKED / BOUNCED`
- `EmailEvent.type` enum includes `OPENED / CLICKED / BOUNCED`, plus `metadata Json?`
- The `SENT` event already stores `{ messageId }` (the bounce correlation key)

So Phase 2B is **pure application code** — routes + a tracking-write helper +
template injection + analytics. Zero migrations.

---

## 1. Tracking routes (new)

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/email/open/[recipientId]` | GET | none (inbox) | Open pixel — returns a 1×1 transparent GIF, records first open |
| `/api/email/click/[recipientId]?url=…` | GET | none (inbox) | Records first click, 302-redirects to the destination |
| `/api/webhooks/resend` | POST | Svix signature | Ingests `email.bounced`, records bounce |

All three are `runtime = "nodejs"`, `dynamic = "force-dynamic"`, and never let a
tracking write break the user-facing response (pixel/redirect always succeed).

Shared write logic lives in `src/lib/email/tracking-events.ts`
(`recordOpen` / `recordClick` / `recordBounce`); URL builders live in
`src/lib/email/tracking.ts` (`openPixelUrl` / `clickTrackingUrl`).

---

## 2. Open tracking flow

```
Campaign email (real send)
   └─ template injects <img src="/api/email/open/{recipientId}">   (src/emails/templates/campaign-email.tsx)
        ↓ recipient opens email → inbox loads the pixel
GET /api/email/open/[recipientId]
   ├─ validate recipient exists
   ├─ recordOpen(): updateMany WHERE openedAt IS NULL  → openedAt = now()   (first-open gate)
   │     └─ if first: status SENT→OPENED (no downgrade), create EmailEvent OPENED
   └─ always return 1×1 transparent GIF (no-store)
```

- The pixel is only injected when the template is rendered with a `recipientId`
  (real sends) — previews stay clean.
- **First open wins** (see §8). Re-renders / proxy prefetches don't duplicate.
- Response is a cached-defeating GIF so the route is hit on genuine opens.

---

## 3. Click tracking flow

```
Body URL  https://example.com
   └─ template rewrites → /api/email/click/{recipientId}?url=https%3A%2F%2Fexample.com
        ↓ recipient clicks
GET /api/email/click/[recipientId]?url=…
   ├─ isSafeUrl(url) → http/https only (no open-redirect to javascript:/data:)
   ├─ validate recipient exists
   ├─ recordClick(): updateMany WHERE clickedAt IS NULL → clickedAt = now()   (first-click gate)
   │     └─ if first: status SENT/OPENED→CLICKED (no downgrade), create EmailEvent CLICKED (metadata: { url })
   └─ 302 redirect → destination (or app home if url missing/unsafe)
```

- Bare `http(s)` URLs in the plain-text body are detected and rewritten to the
  tracking route at render time; trailing punctuation is preserved as text.
- **Open-redirect safe**: the destination is validated with the existing
  `isSafeUrl` guard; anything non-http(s) falls back to the app home.
- **First click wins**; status never downgrades.

---

## 4. Bounce tracking flow

```
Resend → POST /api/webhooks/resend   (Svix-signed)
   ├─ verify signature (HMAC-SHA256, node:crypto) if RESEND_WEBHOOK_SECRET set
   ├─ parse event; ignore everything except type === "email.bounced"
   ├─ messageId = data.email_id
   ├─ correlate: EmailEvent WHERE type=SENT AND metadata.messageId = messageId  → recipientId
   └─ recordBounce(): updateMany WHERE bouncedAt IS NULL → bouncedAt = now(), status = BOUNCED
         └─ if first: create EmailEvent BOUNCED (metadata = raw webhook payload)
```

- **Signature verification** implements the Svix scheme Resend uses
  (`HMAC_SHA256(secret, "{id}.{timestamp}.{body}")`, constant-time compared
  against the `svix-signature` header) with **node:crypto** — no `svix`
  dependency. Missing secret → skipped in dev (warn), rejected in production.
- Opens/clicks from Resend's own tracking are **deliberately ignored** — we own
  those via our pixel/link routes — to avoid double counting.
- `BOUNCED` is terminal and set unconditionally; the bounce event stores the raw
  payload for forensics.

---

## 5. Analytics updates

`computeCampaignStats` (`src/features/campaigns/analytics.ts`) already derived
opens/clicks/bounces from per-recipient timestamps; this phase adds the
**`bounceRate`** (`bounced / sent`) alongside the existing `openRate` /
`clickRate` / `replyRate`. All values are pure DB reads — no estimates.

- **Campaign Overview** stat cards now include **Open rate, Click rate, Bounce
  rate** (and Reply rate, still 0 — reply tracking is a later phase).
- **Campaign List** columns now show **Open rate, Click rate, Bounce rate**
  per campaign (Reply-rate column dropped — replies aren't tracked yet).

Counts come from timestamps, not the `status` enum, so a recipient who clicked
still counts toward opens, etc.

---

## 6. Event lifecycle

| Signal | Gate (first-wins) | Recipient status | Timestamp | EmailEvent | Metadata |
|---|---|---|---|---|---|
| Sent (2A) | — | `SENT` | `sentAt` | `SENT` | `{ messageId }` |
| Open | `openedAt IS NULL` | `SENT → OPENED` | `openedAt` | `OPENED` | — |
| Click | `clickedAt IS NULL` | `SENT/OPENED → CLICKED` | `clickedAt` | `CLICKED` | `{ url }` |
| Bounce | `bouncedAt IS NULL` | `→ BOUNCED` (terminal) | `bouncedAt` | `BOUNCED` | raw webhook payload |

Status is **monotonic forward** (never downgraded); `EmailEvent` is append-only.
The existing **Activity timeline** already labels `OPENED / CLICKED / BOUNCED`
(color-dotted) and renders them with no change.

---

## 7. Message correlation strategy

Unchanged from Phase 2A, as required: at send time the Resend message id is
stored in the recipient's `SENT` `EmailEvent.metadata.messageId`. The bounce
webhook looks the recipient up by that id
(`EmailEvent WHERE type=SENT AND metadata.messageId = data.email_id`). No new
correlation column or strategy was introduced.

---

## 8. Performance considerations

- **No duplicate events.** First-open / first-click / first-bounce are enforced
  by a **guarded `updateMany`** on the `…At IS NULL` column. Postgres row-locks
  the row, so under concurrent hits exactly one update returns `count === 1` and
  only that caller writes the event — atomic, no unique index or explicit lock
  needed.
- **Efficient queries / no N+1.** Each route does one existence check + one
  guarded update (+ one event insert on first hit). Analytics load recipient
  timestamps once per campaign and compute in-memory (existing pattern).
- **Fast responses.** The pixel and redirect return immediately; tracking writes
  are awaited but trivial, and any failure is caught + logged so the
  pixel/redirect still succeeds.
- **Correlation cost.** The bounce lookup filters `EmailEvent` by a JSON path
  (`metadata.messageId`) — unindexed today. Fine for MVP webhook volume; a
  generated/indexed `messageId` column (or storing it on `EmailRecipient`) is
  the obvious optimization if bounce volume grows.

---

## 9. Audit logs — intentionally not added

The spec said to add `email.opened / email.clicked / email.bounced` audit events
**"only if the existing audit architecture considers these useful — otherwise
document why not."** They were **not** added:

- `AuditLog` is an **actor-attributed governance trail** (it records
  `actorUserId`, IP, user-agent for *member* actions). Open/click/bounce are
  **anonymous, recipient/provider-driven, high-volume** signals with no member
  actor — they don't fit that model and would dilute it.
- `EmailEvent` **is already the append-only audit trail** for these signals (one
  row per first open/click/bounce, with metadata). Writing them to `AuditLog`
  too would be duplicative noise.

Member-initiated campaign actions (`campaign.sent`, etc.) remain in `AuditLog` as
before. This keeps each ledger doing its one job.

---

## 10. Configuration

| Env var | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_APP_URL` | ✓ (already used) | Absolute base for tracking URLs in emails (`BRAND.url`). |
| `RESEND_WEBHOOK_SECRET` | prod-required | Svix signing secret (`whsec_…`) for `/api/webhooks/resend`. Unset → verification skipped in dev (warn), webhook rejected in production. |

Point a Resend webhook at `https://<app>/api/webhooks/resend` and subscribe to
`email.bounced` (open/click tracking is handled by our own routes, so Resend's
open/click events aren't needed).

---

## 11. Future followup integration points

The recipient state machine is now fully populated, which is exactly what
automated followups branch on:
- **`openedAt / clickedAt / repliedAt / bouncedAt` + status** give a followup
  engine its triggers (e.g. "SENT, no `openedAt` after 3 days → nudge";
  "`clickedAt` set, no reply → different track"; "`BOUNCED` → suppress").
- **`EmailEvent`** is the immutable signal log a scheduler can scan.
- **`EmailRecipient.companyId`** (Phase 2A) enables per-company rollups for
  account-level sequencing.
- **Reply tracking** is the one missing signal — a future phase can map Resend's
  inbound/reply events (or an inbox integration) onto the existing
  `repliedAt` + `REPLIED` event, with no schema change.
- The **webhook ingestion seam** generalizes: add cases to the same route for
  `email.delivered` / `email.complained` when those become useful.

---

## How to verify

No migration this phase. Verified clean with `npx tsc --noEmit`, `npx eslint`,
and a full `npx next build` (all three routes register as dynamic handlers:
`/api/email/open/[recipientId]`, `/api/email/click/[recipientId]`,
`/api/webhooks/resend`).

Local manual check (no Resend key needed for open/click):
1. Send a campaign (dev `sendEmail` no-ops but still stamps SENT + messageId).
2. `GET /api/email/open/<recipientId>` → recipient flips to `OPENED`, one OPENED
   event; a second GET is a no-op.
3. `GET /api/email/click/<recipientId>?url=https://example.com` → `CLICKED` +
   redirect; duplicates no-op.
4. `POST /api/webhooks/resend` with `{"type":"email.bounced","data":{"email_id":"<messageId>"}}`
   (secret unset in dev) → recipient `BOUNCED` + event.
