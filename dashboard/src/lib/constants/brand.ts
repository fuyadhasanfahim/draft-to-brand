/**
 * Centralized brand configuration.
 *
 * Every email template, transactional message, or branded surface must source
 * its identity from here — never hardcode names, taglines, or asset URLs in
 * components. Swap the brand in one place, ship everywhere.
 */

const FALLBACK_LOGO =
  "https://res.cloudinary.com/dqfvrpai8/image/upload/q_auto/f_auto/v1781429056/logo_opnmsj.png";

const FALLBACK_APP_URL = "http://localhost:3000";

export const BRAND = {
  name: "Draft To Brand",
  shortName: "DTB",
  tagline: "From Draft To Brand",
  description: "Digital Marketing & Brand Management Agency",
  mission:
    "We consult a brand from draft to brand — transforming ideas into memorable brands.",
  logo: process.env.NEXT_PUBLIC_BRAND_LOGO_URL ?? FALLBACK_LOGO,
  url: process.env.NEXT_PUBLIC_APP_URL ?? FALLBACK_APP_URL,
  email: {
    from: process.env.RESEND_FROM_EMAIL ?? "Draft To Brand <noreply@drafttobrand.com>",
    replyTo: process.env.RESEND_REPLY_TO ?? "hello@drafttobrand.com",
    support: process.env.RESEND_REPLY_TO ?? "hello@drafttobrand.com",
  },
  colors: {
    primary:         "#ff3131",
    primaryHover:    "#e52b2b",
    dark:            "#282a2a",
    background:      "#fafaf9",
    surface:         "#ffffff",
    border:          "#e7e5e4",
    text:            "#282a2a",
    mutedText:       "#57534e",
  },
} as const;

export type Brand = typeof BRAND;
