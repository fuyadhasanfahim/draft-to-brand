# Draft To Brand — Agency OS · Dashboard

Phase 0 foundation for the internal Agency Operating System.

This app is **only** the foundation: authentication, identity, the org graph
(Organization → Branch → Department → Team → Member), database-driven roles
& permissions, the dashboard shell, and the shared design system.

It deliberately does **not** include CRM, Email, Follow-up, WhatsApp, AI,
Client Portal, Projects, HR, Invoicing, or Analytics — those land in later
phases on top of this foundation.

---

## 1. Stack

| Layer        | Choice                                                    |
| ------------ | --------------------------------------------------------- |
| Framework    | Next.js 16 (App Router, `proxy.ts` — not middleware.ts)   |
| Language     | TypeScript                                                |
| Styling      | Tailwind CSS v4 (CSS-first `@theme inline` tokens)        |
| UI Variants  | CVA + `clsx` + `tailwind-merge`                           |
| Motion       | Framer Motion                                             |
| Icons        | `@tabler/icons-react`                                     |
| Auth         | Better Auth (Email/Password + Google + Sessions)          |
| ORM          | Prisma 7 (`prisma.config.ts` datasource)                  |
| Database     | Neon PostgreSQL                                           |
| Forms        | React Hook Form + Zod                                     |
| Dates        | date-fns                                                  |

No shadcn. The UI library in `src/components/ui` is internal and shares its
design tokens with the public marketing site so the Dashboard, Marketing
site, and future Client Portal all speak one design language.

---

## 2. Project structure

```
dashboard/
├── prisma/
│   ├── schema.prisma          # Better Auth + Agency models
│   └── seed.ts                # Seed permissions, system roles, owner
├── prisma.config.ts           # Prisma 7 datasource & seed wiring
├── src/
│   ├── proxy.ts               # Next 16 proxy — optimistic auth gate only
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── sign-in/
│   │   │   └── sign-up/
│   │   ├── (dashboard)/
│   │   │   └── dashboard/     # Overview + future feature pages
│   │   ├── api/auth/[...all]/ # Better Auth handler
│   │   ├── globals.css        # Shared design tokens
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/                # Internal design system
│   │   ├── layouts/           # Sidebar, Topbar, Breadcrumbs, Shell, nav-config
│   │   └── shared/
│   ├── features/              # Feature-first slices (auth, members, roles, …)
│   ├── lib/
│   │   ├── auth/              # Better Auth server, client, session helpers
│   │   ├── db/                # Prisma client singleton
│   │   ├── permissions/       # Registry, resolver, can()
│   │   ├── validators/        # Zod schemas
│   │   └── constants/
│   ├── actions/               # Server Actions
│   ├── hooks/
│   └── types/
```

---

## 3. Setup

```bash
# from /dashboard
cp .env.example .env            # fill DATABASE_URL, BETTER_AUTH_SECRET, GOOGLE_*

npm install                     # already done if you cloned post-bootstrap
npm run db:generate             # generate Prisma client
npm run db:migrate -- --name init   # create the initial migration
npm run db:seed                 # seed permissions, roles, owner user
npm run dev                     # http://localhost:3000
```

Sign in with the credentials printed at the end of `db:seed`
(defaults: `owner@drafttobrand.local` / `ChangeMe!2026`). Change the
password from Profile & settings on first sign-in.

---

## 4. Architecture notes

### Identity is two layers, not one

```
User    ← Better Auth identity (email, password, providers, sessions)
  ↓
Member  ← Agency profile in a specific Organization
  ↓
Role    ← Per-org, database-driven (Owner/Admin/… seeded; admins create more)
  ↓
Permission  ← Dotted keys, e.g. "members.invite", "roles.manage"
```

Better Auth tables (`user`, `session`, `account`, `verification`) are
**never customized** — no extra columns, no rename. All agency business
logic hangs off `Member` and downstream.

### Permissions are resolved, not hardcoded

The effective set for `(user, organization)` is:

```
(role.permissions ∪ user.permissions where ALLOW) ∖ (user.permissions where DENY)
```

`DENY` overrides always win. Resolution lives in
[`src/lib/permissions/resolve.ts`](src/lib/permissions/resolve.ts) and is
exposed to feature code as `can()` / `canAny()` / `canAll()` /
`requirePermission()` from [`src/lib/permissions/can.ts`](src/lib/permissions/can.ts).

### Auth checks happen in 3 places — never just one

1. **`proxy.ts`** — optimistic cookie presence check. Cheap redirect for
   unauthenticated users. Per Next 16 docs, this is **not** a security
   boundary.
2. **`(dashboard)/layout.tsx`** — real session validation via
   `getServerSession()`. Anything past the shell has a verified session.
3. **Server Actions / Route Handlers** — `requireSession()` +
   `requirePermission("…")` on every mutation.

### One design language across surfaces

`src/app/globals.css` declares the same brand tokens used by the public
marketing site (`../client/src/app/globals.css`): the `#ff3131` primary,
`#fafaf9` background, `#282a2a` foreground, etc. The Dashboard adjusts
**density, spacing, and radii** but never color or type. The Client Portal
(future phase) will consume the same tokens.

### Why feature-first folders

Modules added in later phases (CRM, Projects, HR, Invoicing) each get their
own `src/features/<module>/` slice — colocating their components, hooks,
validators, and actions. This keeps phase boundaries crisp and lets us
move/delete a phase without grep-and-replace through the codebase.

---

## 5. Future scalability

The schema and code were designed so future phases drop in without redesign:

- **Multi-organization** — `Member` is already `(userId, organizationId)`-unique,
  not `userId`-unique. A workspace switcher only needs to add an
  `activeOrganizationId` to `Session` and update
  [`session.ts`](src/lib/auth/session.ts) selection rule.
- **Multi-branch / multi-team** — `Member` carries optional `branchId`,
  `departmentId`, `teamId`; cascade rules are `SetNull` so structural
  reorgs never orphan members.
- **Custom roles & permission expansion** — adding a new permission is
  a single line in `src/lib/permissions/registry.ts` + re-running
  `npm run db:seed`. Admins can mint unlimited custom (non-system) roles
  through future role management UI without touching code.
- **Audit trail** — `AuditLog` is in place from day one so every Phase 1+
  mutation can append without a follow-up migration.
- **Per-resource scoping** — when phases need branch-scoped permissions
  (e.g. "manage members of branch X"), `UserPermission` already carries
  an `organizationId` and can be extended with a `scopeType`/`scopeId`
  pair in a single migration.

---

## 6. Common commands

```bash
npm run dev              # next dev
npm run build            # next build
npm run lint             # eslint

npm run db:generate      # prisma generate
npm run db:migrate       # prisma migrate dev (interactive, dev only)
npm run db:deploy        # prisma migrate deploy (CI / prod)
npm run db:studio        # prisma studio (visual data browser)
npm run db:seed          # tsx prisma/seed.ts  (idempotent)
npm run db:reset         # WARNING: drops the DB and re-runs migrations + seed
```
