# CRM UX Improvements

A usability pass across the CRM, implemented strictly within the existing
architecture (Server Actions, Prisma, RBAC, Audit Logs, existing UI/form/table
patterns). No new libraries were introduced.

---

## 1. Files changed

| File | Task | Change |
|---|---|---|
| `src/features/crm/companies-page-client.tsx` | 1, 3 | Added **View** row action; surfaced tags in the list |
| `src/features/crm/contacts-page-client.tsx` | 1, 3 | Surfaced tags in the list; TODO for missing View detail page |
| `src/features/leads/leads-page-client.tsx` | 1 | Added **View** row action |
| `src/features/clients/clients-page-client.tsx` | 1 | Added **View** row action |
| `src/features/members/member-row-actions.tsx` | 1 | TODO for missing View detail page |
| `src/features/branches/branches-page-client.tsx` | 1 | TODO for missing View detail page |
| `src/features/departments/departments-page-client.tsx` | 1 | TODO for missing View detail page |
| `src/features/teams/teams-page-client.tsx` | 1 | TODO for missing View detail page |
| `src/features/settings/reference-list.tsx` | 1 | TODO for missing View detail page (Industries / Company Sizes / Lead Sources) |
| `src/features/leads/pipelines-page-client.tsx` | 1 | TODO for missing View detail page |
| `src/actions/companies.ts` | 2 | Owner auto-assigned to current member on create (server-enforced) |
| `src/features/crm/company-form-dialog.tsx` | 2 | Owner selector hidden during creation |
| `src/features/clients/client-form-dialog.tsx` | 4 | Edit dialog title now shows the company name (consistency) |

---

## 2. Task 1 — Standard actions on data tables

Every entity table already shipped **Edit** + **Delete/Archive** following the
codebase's archive-vs-delete conventions. This pass focused on the missing
**View** action and standardizing the menu.

### What "View" required
"View" navigates to an entity's detail page. Only three entities have a detail
route today, so View was added only where a real destination exists. Everywhere
else a `TODO` comment was left in the action menu (per the spec) instead of a
dead link.

### Summary table

| Entity | View | Edit | Delete / Archive | Notes |
|---|---|---|---|---|
| **Companies** | ✅ Added → `/dashboard/companies/[id]` | ✅ existing | ✅ Archive (existing) | View shown to all viewers; Edit/Archive gated by `companies.manage` |
| **Contacts** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | Gated by `contacts.manage` |
| **Leads** | ✅ Added → `/dashboard/leads/[id]` | ✅ existing | ✅ Archive (existing) | Edit/Archive gated by `leads.edit` / `leads.delete` |
| **Clients** | ✅ Added → `/dashboard/clients/[id]` | ✅ existing | ✅ Archive (existing) | Edit/Archive gated by `clients.edit` / `clients.delete` |
| **Members** | ⛔ TODO (no detail page) | ✅ existing | ✅ Remove/Suspend/Activate (existing) | Privilege guards preserved |
| **Branches** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | `branches.manage` |
| **Departments** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | `departments.manage` |
| **Teams** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | `teams.manage` |
| **Industries** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | via shared `ReferenceList` |
| **Company Sizes** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | via shared `ReferenceList` |
| **Lead Sources** | ⛔ TODO (no detail page) | ✅ existing | ✅ Archive (existing) | via shared `ReferenceList` |
| **Tags** | — | inline | inline | No standalone Tags table exists — tags are managed inline (see §6) |
| **Pipelines** | ⛔ TODO (page *is* the detail) | ✅ existing | ✅ Archive (existing) | Card layout; stages edited/deleted inline |

**Permission handling:** Companies/Leads/Clients list pages are already gated by
their respective `*.view` permission, so "View" is safe to expose to every
viewer. The Companies menu now renders for view-only users (View only), while
Edit/Archive remain behind `companies.manage`. No permission boundaries were
weakened.

---

## 3. Task 2 — Auto-assign company owner

**Behavior change:** when a company is created, the current logged-in member is
assigned as the owner automatically; the owner selector is no longer shown on
the create form.

- **Server-enforced, never trusts the frontend** — `upsertCompanyAction`
  computes the owner itself:
  ```ts
  const ownerId = parsed.data.id
    ? parsed.data.ownerId ?? null   // EDIT: honor submitted owner
    : session.member.id;            // CREATE: force current member
  ```
  This mirrors the existing Leads pattern (`leads.ts` sets
  `ownerId: session.member.id` on create).
- **Owner selector hidden on create** in `company-form-dialog.tsx`
  (`{isEdit ? <owner field/> : null}`). Even if a client tampered with the
  payload, the server ignores any submitted `ownerId` on create.
- **Editing unchanged** — existing companies keep their owner, and the owner can
  still be reassigned from the edit dialog.
- **RBAC preserved** — still requires `companies.manage`; the forced owner is the
  active session member, which already passes the in-org/active validation.

_Example:_ member **Fuyad** creates company **Acme Inc** → `Company.ownerId` =
Fuyad's member id, with no manual selection.

---

## 4. Task 3 — Tags review

| Question | Status | Detail |
|---|---|---|
| Tag creation working? | ✅ Yes | `TagSelector` creates on the fly via `upsertTagAction` (`tags.manage`). |
| Tag assignment working? | ✅ Yes | Toggled inside Company/Contact forms; persisted by `upsertCompany/Contact` in a transaction with cross-org validation. |
| Tag editing working? | ⚠️ Partial | `upsertTagAction` supports rename/recolor and `deleteTagAction` exists, but **no UI surfaces editing/deleting an existing tag's name or color** (see §7). |
| Tag removal working? | ✅ Yes | Chip "×" in the selector removes a tag from the entity; entity-level join rows cascade. |
| Visible in lists? | ❌ → ✅ **Fixed** | Companies & Contacts lists fetched tags but never rendered them. Now shown as chips under the name (first 3 + "+N"). |
| Visible on detail pages? | ✅ Yes (companies) | Company detail header already renders tag chips. Contacts have no detail page. |
| Actually useful in workflows? | ✅ Improved | Previously tags were effectively invisible outside the edit form; they're now scannable directly in the lists. |

**Fix applied:** tag chips now render in the **Companies** and **Contacts**
tables (data was already loaded — purely a display gap). Reused the existing
`TagChip` component; no schema or action changes.

---

## 5. Task 4 — UX consistency review

Reviewed Company / Contact / Lead / Client dialogs. They were already largely
consistent (all fields labeled; "Create X" vs "Save changes" buttons aligned;
slugs auto-derived). Only small, safe changes were applied:

- **Company dialog:** removed the owner selector on create — eliminates an
  unnecessary manual input that's now auto-populated server-side (Task 2). This
  was the single biggest "field that can be auto-populated" finding.
- **Client dialog:** the edit title was a generic "Edit client"; it now shows
  the company name (`Edit Acme Inc`), matching Company ("Edit {name}"), Contact
  ("Edit {first last}"), and Lead ("Edit {title}").

No redesigns, no field removals beyond the intentional owner-on-create change.

---

## 6. Issues discovered

1. **Tags were invisible in lists** — data was fetched but not rendered in the
   Companies/Contacts tables. *(Fixed.)*
2. **No tag management surface** — tags can be created and assigned, but there's
   no UI to rename, recolor, or delete an existing tag, even though the
   `upsertTagAction`/`deleteTagAction` server actions support it. *(Reported,
   not fixed — would be a new surface, out of "don't redesign" scope.)*
3. **Several entities lack detail pages** — Contacts, Members, Branches,
   Departments, Teams, Industries, Company Sizes, Lead Sources, and Pipelines
   have no `[id]` detail route, so "View" could not be wired. Marked with `TODO`
   comments in their action menus.
4. **No standalone Tags table/page** — "Tags" is a managed-inline concept, not a
   top-level table, so the standard View/Edit/Delete menu doesn't apply there.

---

## 7. Recommendations for the future

1. **Tag management page** (`/dashboard/settings/tags`) reusing the existing
   `ReferenceList`/dialog pattern, wired to the already-built
   `upsertTagAction` / `deleteTagAction`. This closes the "tag editing" gap
   cleanly without new libraries.
2. **Contact detail page** (`/dashboard/contacts/[id]`) mirroring the Company
   detail layout (overview + notes + tags). Then enable the Contacts "View"
   action (TODO already in place).
3. **Detail pages for org-graph & reference entities** as needed; the View TODOs
   are positioned to drop in immediately once routes exist.
4. **Default the Client owner to the current member on create**, consistent with
   the new Company behavior and existing Lead behavior, if product wants the same
   "no manual self-selection" UX there.
5. **Tag count / overflow affordance** — the lists currently show 3 chips + "+N";
   a future hover/popover could reveal the full set.
