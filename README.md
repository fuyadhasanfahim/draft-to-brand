# Draft To Brand

Marketing site for **Draft To Brand** — a full-service digital marketing and brand management agency.

- **Live site:** [https://drafttobrand.com](https://drafttobrand.com)
- **Framework:** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript
- **Styling:** Tailwind CSS v4
- **Hosting:** Vercel

> ⚠️ This project runs on a very recent/canary Next.js release. Behavior and file conventions may differ from older Next.js docs you're used to — check `node_modules/next/dist/docs/` before assuming an API works the way it used to.

---

## Table of contents

- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Available scripts](#available-scripts)
- [Features](#features)
- [SEO, performance & accessibility](#seo-performance--accessibility)
- [Security](#security)
- [Deployment](#deployment)

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router, Turbopack, React Server Components) |
| UI library | [React 19](https://react.dev) with the React Compiler enabled (`reactCompiler: true` in `next.config.ts`) |
| Language | TypeScript |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) (CSS-first `@theme` config in `src/app/globals.css`) |
| Animation | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Tabler Icons](https://tabler.io/icons) (`@tabler/icons-react`) |
| Forms / validation | [Zod](https://zod.dev) |
| Email | [Nodemailer](https://nodemailer.com) over SMTP |
| Fonts | `next/font/google` — Inter (Latin), Instrument Serif (display accents), Hind Siliguri (Bangla script fallback) |
| Images | `next/image`, with Cloudinary as an allowed remote image source |
| Analytics | Google Analytics 4 (gtag.js) + Meta/Facebook Pixel, loaded via `next/script` (`afterInteractive`, non-blocking) |
| Linting | ESLint 9 (`eslint-config-next`) |

## Project structure

```
src/
  app/
    (home)/                 # Marketing site route group (shares navbar/footer layout)
      page.tsx              # Home
      about/                # /about
      services/             # /services
      work/                 # /work
      pricing/              # /pricing
      contact/              # /contact
      tools/                 # /tools (listing) and /tools/[slug] (individual free tools)
    api/
      contact/route.ts      # POST handler — validates + emails contact form submissions
    layout.tsx               # Root layout: fonts, metadata, JSON-LD, analytics
    globals.css              # Tailwind v4 theme tokens (colors, fonts)
    robots.ts / sitemap.ts   # Generated robots.txt / sitemap.xml
    favicon.ico
  components/
    layout/                  # Navbar, Footer, MobileMenu
    home/                    # Homepage sections (hero, testimonials, services preview, CTA…)
    shared/                  # Reusable primitives: Badge, Container, Reveal animation, WhatsApp float…
    tools/                   # Free tools, e.g. pricing-calculator.tsx
    contact/                 # Contact form
    pricing/                 # Pricing cards, FAQ
  lib/
    site.ts                  # siteConfig (name, url, socials, contact info) + nav links
    data.ts                  # Services, work/portfolio, testimonials content
    tools.ts                 # Registry of /tools/[slug] pages
    metadata.ts               # Shared `pageMetadata()` helper for per-page SEO metadata
    contact-schema.ts         # Zod schema for the contact form
    email/                    # mailer.ts (Nodemailer transport) + template.ts (HTML email layout)
    utils.ts                  # `cn()` class-merging helper
public/
  logo.png                    # Self-hosted, size-optimized brand logo (used by Navbar/Footer)
next.config.ts                # Image config, Content-Security-Policy & security headers
```

## Getting started

**Requirements:** Node.js 20.9+ (LTS recommended), npm.

```bash
# 1. Install dependencies
npm install

# 2. Copy the env template and fill in real values (see below)
cp .env.example .env

# 3. Run the dev server (Turbopack)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

Copy `.env.example` to `.env` and fill in real values. **Never commit `.env`** — it's git-ignored on purpose (only `.env.example` is tracked).

| Variable | Required | Used for |
|---|---|---|
| `SMTP_HOST` | Yes | SMTP server hostname for the contact form (e.g. `smtp.gmail.com`) |
| `SMTP_PORT` | Yes | SMTP port (`587` for STARTTLS, `465` for implicit TLS) |
| `SMTP_SECURE` | Yes | `"true"` for port 465 (implicit TLS), `"false"` for port 587 (STARTTLS) |
| `SMTP_USER` | Yes | SMTP account username (mailbox that sends contact-form emails) |
| `SMTP_PASS` | Yes | SMTP account password / app password. For Gmail, this must be a 16-character [App Password](https://myaccount.google.com/apppasswords), not your normal login password |
| `SMTP_FROM` | No | Optional `"Name <email@domain>"` sender header for outgoing mail. Falls back to `SMTP_USER` if unset |
| `NEXT_PUBLIC_GA_ID` | No | Google Analytics 4 Measurement ID (`G-XXXXXXXXXX`). Omit to disable GA entirely |
| `NEXT_PUBLIC_META_PIXEL_ID` | No | Meta (Facebook) Pixel ID. Omit to disable the pixel entirely |

Notes:
- Any variable prefixed `NEXT_PUBLIC_` is exposed to the browser bundle — never put secrets behind that prefix.
- `VERCEL_OIDC_TOKEN` may also appear in `.env` if you've run `vercel env pull` or `vercel link` — that's auto-managed by the Vercel CLI, short-lived, and not something the app itself reads; you don't need to set it manually.
- The contact form ([`src/app/api/contact/route.ts`](src/app/api/contact/route.ts)) sends two emails per submission via `sendMail()` ([`src/lib/email/mailer.ts`](src/lib/email/mailer.ts)): a notification to the studio inbox (`siteConfig.email` in [`src/lib/site.ts`](src/lib/site.ts)) and an auto-reply confirmation to the submitter. Both require working SMTP credentials to succeed.

## Available scripts

```bash
npm run dev     # Start the dev server (Turbopack, hot reload)
npm run build   # Production build (type-checks, prerenders static/SSG pages)
npm run start   # Serve the production build locally (run `build` first)
npm run lint    # Run ESLint
```

## Features

- **Marketing pages** — Home, About, Services, Work, Pricing, Contact, plus a `/tools` hub for free interactive tools (currently: a bilingual EN/বাংলা product pricing calculator at `/tools/pricing-calculator`, driven by the URL's `?lang=` query param via `next/navigation`).
- **Contact form** — client-side Zod validation ([`src/lib/contact-schema.ts`](src/lib/contact-schema.ts)) mirrored server-side in the API route, with HTML email notifications sent via Nodemailer.
- **SEO** — per-page metadata via a shared `pageMetadata()` helper, Open Graph + Twitter Card tags, JSON-LD `Organization` structured data, generated `sitemap.xml` / `robots.txt`.
- **Analytics** — GA4 + Meta Pixel, loaded non-blocking (`afterInteractive`) so they never delay first paint.
- **Content Security Policy** and standard security headers (HSTS-adjacent headers, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`) configured in [`next.config.ts`](next.config.ts).

## SEO, performance & accessibility

This site is actively tuned against Lighthouse audits (mobile). Notable decisions baked into the codebase:

- The shared `<Reveal>` entrance animation ([`src/components/shared/animations/reveal.tsx`](src/components/shared/animations/reveal.tsx)) intentionally **never sets `opacity: 0`** on first paint — only a `transform: translateY`. Animating opacity from 0 on above-the-fold content delays Largest Contentful Paint until JS hydrates; don't reintroduce that pattern on hero/LCP-candidate elements.
- The brand red (`--color-primary: #ff3131`) fails WCAG AA contrast at small text sizes on light backgrounds (~3.66:1). Use `--color-primary-text` (`#c92a2a`, ~5.46:1) for small red text instead; keep `--color-primary` for buttons/large elements/backgrounds where contrast isn't the concern.
- The logo is self-hosted at `public/logo.png` (resized to 1040px wide via `sharp`) rather than fetched from Cloudinary on every page load — the original Cloudinary asset was an unoptimized ~900 KB, 12,300×3,997px master file, wildly oversized for a ~40px-tall navbar logo.
- `images.minimumCacheTTL` in `next.config.ts` is set to 1 year, since the remaining remote (Cloudinary) images use version-hashed, effectively immutable URLs.
- Footer navigation column labels are `<p>`, not `<h4>` — no page on the site has an `<h3>`, so a footer `<h4>` created a heading-hierarchy skip flagged by Lighthouse's accessibility audit.

## Security

- Strict `Content-Security-Policy` and related headers are set for every route in `next.config.ts`. If you add a new third-party script or image host, update the CSP there (`script-src`, `img-src`, `connect-src`) or it will be blocked in production.
- Contact form input is validated with Zod on both client and server; never trust `request.json()` without `contactSchema.safeParse()`.

## Deployment

Deployed on [Vercel](https://vercel.com). Pushing to the production branch triggers a build; `next build` prerenders static and SSG pages (see the route summary printed at build time — `○` static, `●` SSG, `ƒ` dynamic/server-rendered).

Make sure all required environment variables (see above) are set in the Vercel project's Environment Variables settings before deploying — the contact form will fail at runtime (not at build time) if SMTP variables are missing.
