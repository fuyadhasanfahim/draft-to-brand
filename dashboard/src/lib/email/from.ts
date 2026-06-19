import { EMAIL_CONFIG } from "./email-config";

/**
 * Build the From header for a campaign/followup send.
 *
 * Resend accepts `"Display Name <address>"`. We keep the *verified* sending
 * address from EMAIL_CONFIG and only override the display name, so a send can
 * never originate from an unverified domain. Blank name → undefined (sendEmail
 * falls back to EMAIL_CONFIG.from).
 */
export function buildFrom(fromName: string | null | undefined): string | undefined {
  if (!fromName) return undefined;
  const match = /<([^>]+)>/.exec(EMAIL_CONFIG.from);
  const address = (match ? match[1] : EMAIL_CONFIG.from).trim();
  return `${fromName} <${address}>`;
}
