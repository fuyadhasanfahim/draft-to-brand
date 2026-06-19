# Cold Email — Phase 3 (Followup Sequences Engine)

Adds automated followup sequences on top of the campaign/recipient/event/tracking
stack from Phases 1–2B. A reusable **sequence** is an ordered list of timed
**steps** (each with a condition); attach one to a campaign and its recipients are
**enrolled** at send time; a poll-based **scheduler** walks due enrollments,
evaluates each step's condition against the recipient's tracking state, and sends
the followup through the **existing email + tracking stack**. Built on the
current models — **no second email system, no generic workflow builder, no
drag-and-drop**. Instantly/Smartlead-style MVP: simple, reliable, maintainable.

> **Scope guard.** Only Campaign → Enroll → Wait → Condition → Send Followup.
> **Not built:** inbox, reply management, AI writing, Gmail/Outlook sync,
> scheduling UI, automation/workflow builder, visual nodes, queues.

---

## 1. Schema changes

Migration `20260618165511_phase3_followup_sequences` — **applied**. Additive only.

**New enums**
- `SequenceStepCondition` = `ALWAYS | NOT_OPENED | OPENED_NOT_CLICKED | CLICKED_NOT_REPLIED`
- `SequenceEnrollmentStatus` = `ACTIVE | PAUSED | COMPLETED | STOPPED`
- `EmailEventType` gains **`FOLLOWUP_SENT`**

**New models**
| Model | Purpose | Key fields |
|---|---|---|
| `EmailSequence` (`email_sequence`) | Reusable followup sequence | `organizationId`, `name`, `description?`, `isActive`, `archivedAt?`, `createdById?` |
| `EmailSequenceStep` (`email_sequence_step`) | One followup step | `sequenceId`, `stepNumber`, `delayDays`, `subject`, `body`, `condition`; `@@unique([sequenceId, stepNumber])` |
| `EmailSequenceEnrollment` (`email_sequence_enrollment`) | A recipient walking a sequence | `sequenceId`, `recipientId`, `currentStep`, `status`, `nextRunAt?`, `enrolledAt`, `completedAt?`; `@@unique([sequenceId, recipientId])`, **`@@index([status, nextRunAt])`** |

**Wiring** — `EmailCampaign.sequenceId` (`SetNull`) attaches a sequence;
back-relations on `Organization`, `User`, `EmailRecipient`. `delayDays` is the
offset **from enrollment** (campaign send), e.g. `0, 3, 7, 14`.

The scheduler index `[status, nextRunAt]` is the one that makes "find due, active
enrollments" cheap at scale.

---

## 2. Sequence architecture

```
EmailSequence (reusable)
  └─ EmailSequenceStep[]            ordered by stepNumber; each: delayDays, subject, body, condition
EmailCampaign.sequenceId ──────────► attach one sequence
  └─ on send → EmailSequenceEnrollment per sent recipient
       └─ scheduler advances currentStep, sets nextRunAt, sends followups
```

- **Sequence ≠ campaign.** Sequences are reusable and campaign-agnostic; a
  campaign points at one. This is the deliberate `Sequence → Steps → Enrollment`
  model (not a workflow graph).
- **Permissions:** new `sequences.{view,create,edit,delete,manage}` keys, granted
  down the same role ladder as campaigns. Attaching a sequence to a campaign is a
  campaign mutation, gated on `campaigns.edit`.
- **CRUD:** `/dashboard/sequences` (list), `/new` (create), `/[id]` (detail —
  steps add/edit/delete, activate/pause, archive). Sidebar: **Sales Outreach →
  Sequences**.

---

## 3. Enrollment lifecycle

```
campaign sent (Phase 2A)
  └─ sendCampaignAction → enrollSentRecipients(sequenceId, sentRecipientIds, sentAt)
       ├─ no-op if sequence inactive/archived or has no steps
       ├─ createMany enrollments (skipDuplicates via unique constraint)
       └─ currentStep=0, status=ACTIVE, nextRunAt = sentAt + step1.delayDays
audit: recipient.enrolled  { sequenceId, count }
```

Enrollment status machine:
- **ACTIVE** → walking steps.
- **COMPLETED** → ran out of steps.
- **STOPPED** → recipient replied or bounced (safety, see §9).
- **PAUSED** → reserved (sequence-level pause is handled by the scheduler filter,
  so enrollments don't churn — see §4).

Idempotent: the `@@unique([sequenceId, recipientId])` constraint + `skipDuplicates`
means re-running enrollment can't double-enroll.

---

## 4. Scheduler design

No queue/cron existed, so this introduces a **poll-based scheduler** (MVP,
queue-ready):

- **Runner:** `runSequenceScheduler({ limit, now })` in
  `src/lib/email/sequence-runner.ts`.
- **Trigger:** `GET /api/cron/sequences`, authorized by `Authorization: Bearer
  $CRON_SECRET`. Wired via `vercel.json` cron (`0 * * * *` — hourly; tune per
  plan). Unset secret → rejected in prod, allowed in dev with a warning.
- **Find:** one indexed query —
  `status=ACTIVE AND nextRunAt <= now AND sequence.isActive AND sequence.archivedAt IS NULL`,
  ordered by `nextRunAt`, `take: limit` (default 200). **No N+1** — steps +
  recipient state are `include`d in the same query.
- **Sequence-level pause/archive** is expressed in that `where` (not by mutating
  every enrollment): paused/archived sequences simply stop being picked, and
  resume cleanly when reactivated.
- **Bounded:** each tick processes at most `limit`; the next tick handles the
  rest. The loop body is independent + idempotent per enrollment, so it can later
  be fanned out to workers/queues with zero data-model change.

---

## 5. Condition engine

Pure, dependency-free (`src/lib/email/sequence-conditions.ts`), evaluated against
the recipient's Phase 2B tracking timestamps:

| Condition | Sends only if |
|---|---|
| `ALWAYS` | always |
| `NOT_OPENED` | `openedAt IS NULL` |
| `OPENED_NOT_CLICKED` | `openedAt != NULL && clickedAt IS NULL` |
| `CLICKED_NOT_REPLIED` | `clickedAt != NULL && repliedAt IS NULL` |

If the condition fails, the step is **skipped** (no email, no event) but the
enrollment **still advances** to the next step.

---

## 6. Followup sending flow

```
for each due enrollment (bounded batch):
  ├─ SAFETY: recipient REPLIED/BOUNCED → status=STOPPED, stop. (no send)
  ├─ step = steps[currentStep];  none left → status=COMPLETED
  ├─ conditionPasses(step.condition, recipient)?
  │     ├─ yes + has email → sendEmail(step.subject, step.body, recipientId=…)
  │     │      ├─ ok  → EmailEvent FOLLOWUP_SENT { messageId, sequenceId, stepId } ; audit followup.sent
  │     │      └─ fail→ log, advance anyway (no infinite retry)
  │     └─ no  → skip (no email/event)
  └─ advance: currentStep++ ;
        more steps → nextRunAt = enrolledAt + nextStep.delayDays
        else       → status=COMPLETED, completedAt=now, nextRunAt=null
```

**Reuse, not reinvention** (per spec):
- `sendEmail()` → Resend (same wrapper as campaigns).
- The **same `CampaignEmail` template**, rendered with `recipientId` — so every
  followup gets the **Phase 2B open pixel + click tracking** automatically.
- From/Reply-To come from the recipient's campaign (`buildFrom`, now shared in
  `src/lib/email/from.ts`).
- Per-step **`idempotencyKey = seq_<enrollmentId>_step_<stepId>`** dedupes at the
  provider.

---

## 7. Analytics additions

- **Sequence detail** (`/dashboard/sequences/[id]`): Steps, Enrollments, Active,
  Completed, Stopped, **Followups sent**, **Completion rate**
  (`completed / total enrollments`). All pure DB reads (groupBy on status +
  `FOLLOWUP_SENT` event count).
- **Campaign detail**: a **Followups sent** stat is added to the Overview, plus
  an **Attach sequence** panel (editable while DRAFT, read-only after send).
- **Activity timeline**: `FOLLOWUP_SENT` is now labeled ("Followup sent") and
  dotted — followups appear inline with sends/opens/clicks/bounces.

---

## 8. Audit events

Via the existing `logAudit` (append-only `AuditLog`):

| Event | When | Resource |
|---|---|---|
| `sequence.created` | create sequence | `sequence` |
| `sequence.updated` | edit identity, activate/pause, **and step add/edit/delete** | `sequence` |
| `sequence.deleted` / `sequence.restored` | archive / restore (soft-delete convention) | `sequence` |
| `recipient.enrolled` | recipients enrolled at campaign send | `campaign` |
| `followup.sent` | a followup email is dispatched by the scheduler | `sequence` |

`followup.sent` is written with `actorUserId: null` (system/scheduler-driven) —
the audit helper already supports a null actor. Step mutations roll up under
`sequence.updated` with a `change` discriminator in metadata (kept the event
vocabulary tight rather than minting `step.*` keys).

---

## 9. Safety rules

- A recipient that is **`REPLIED` or `BOUNCED`** is never sent a followup — the
  enrollment is moved to **`STOPPED`** automatically on the next tick.
- `CLICKED_NOT_REPLIED` also guards on `repliedAt` directly, so reply suppression
  works even before a status flip.
- Inactive/archived sequences don't advance enrollments (scheduler `where`).
- A failed send doesn't retry forever — it logs and advances (documented
  trade-off; a retry/backoff column is a clean future add).

---

## 10. Performance & future queue integration points

- **No N+1:** the scheduler's find pulls steps + recipient state in one query;
  enrollment writes are per-row but bounded by `limit`.
- **Indexed hot path:** `EmailSequenceEnrollment[status, nextRunAt]`.
- **Designed for thousands:** bounded batches + idempotent, independent
  per-enrollment processing.
- **Queue-ready:** to scale, the cron handler stays the same but enqueues
  enrollment ids (or the runner pushes each due enrollment onto a queue) and the
  loop body becomes the worker. Idempotency keys + the unique enrollment
  constraint make at-least-once delivery safe. Nothing in the data model changes.
- **Reply tracking** (the missing signal) plugs straight in: once `repliedAt` /
  `REPLIED` is populated (inbound webhook / inbox phase), `STOPPED` and
  `CLICKED_NOT_REPLIED` light up with zero changes here.

---

## Configuration

| Env var | Required | Purpose |
|---|---|---|
| `CRON_SECRET` | prod | Bearer token for `/api/cron/sequences` (Vercel Cron sends it automatically). Unset → rejected in prod, dev-only without auth. |
| `NEXT_PUBLIC_APP_URL`, `RESEND_*` | (existing) | Same send + tracking config as Phases 2A/2B. |

`vercel.json` registers the hourly cron. Adjust the schedule to your plan/SLA
(e.g. `*/15 * * * *` on Pro for tighter timing).

---

## How to verify

Migration applied (`npx prisma migrate deploy`) + client regenerated; permission
registry re-synced (`npm run db:resync-perms`). Verified with `npx tsc --noEmit`,
`npx eslint`, and a full `npx next build`.

Local manual check (no Resend key needed — `sendEmail` dev-no-ops but still
records events/state):
1. Create a sequence, add a step (delay 0, condition `ALWAYS`).
2. Create a campaign with ≥1 recipient, attach the sequence, **Send**.
   → `recipient.enrolled` audit; an enrollment with `nextRunAt = now`.
3. `GET /api/cron/sequences` (dev, no secret) → followup "sent", `FOLLOWUP_SENT`
   event, enrollment advances/completes.
4. Mark a recipient `REPLIED`/`BOUNCED` and run the tick → its enrollment goes
   `STOPPED`.
