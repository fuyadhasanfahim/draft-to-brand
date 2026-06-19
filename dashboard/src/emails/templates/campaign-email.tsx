import * as React from "react";
import { Hr, Img, Link, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";
import { openPixelUrl, clickTrackingUrl } from "@/lib/email/tracking";
import { EmailLayout } from "../components";

export interface CampaignEmailProps {
  /** The campaign body — plain text; newlines are preserved. */
  body: string;
  /** Recipient first name, used only for the inbox preview snippet. */
  firstName?: string | null;
  /**
   * EmailRecipient id. When present (a real send), the template injects the
   * open-tracking pixel and rewrites links to the click-tracking route. Absent
   * in previews → plain, untracked render.
   */
  recipientId?: string | null;
  /**
   * One-click unsubscribe URL. When present, a visible unsubscribe link is added
   * to the footer (paired with the `List-Unsubscribe` header set by the caller).
   * Required for compliant bulk/cold email.
   */
  unsubscribeUrl?: string | null;
}

/**
 * Minimal cold-email campaign template.
 *
 * Phase 2A: plain body + branded footer.
 * Phase 2B: when `recipientId` is set, bare URLs in the body become
 * click-tracked links and a 1×1 open-tracking pixel is appended. Both point at
 * `/api/email/*` routes (see src/lib/email/tracking.ts). No personalization
 * tokens or builder — still deliberately minimal.
 */
export default function CampaignEmail({
  body,
  firstName,
  recipientId,
  unsubscribeUrl,
}: CampaignEmailProps) {
  const preview = body.slice(0, 110).replace(/\s+/g, " ").trim() || "A message for you";
  void firstName; // reserved for future personalization tokens

  return (
    <EmailLayout preview={preview}>
      <Text style={paragraph}>{renderBody(body, recipientId ?? null)}</Text>

      <Hr style={{ borderColor: BRAND.colors.border, margin: "24px 0 12px" }} />
      <Text style={note}>
        You received this email from {BRAND.name}.
        {unsubscribeUrl ? (
          <>
            {" "}
            <Link href={unsubscribeUrl} style={unsubscribeLink}>
              Unsubscribe
            </Link>
            .
          </>
        ) : null}
      </Text>

      {/* Open-tracking pixel — only on real sends. The served image is a
          transparent 1×1 GIF; its request is what records the open. */}
      {recipientId ? (
        <Img
          src={openPixelUrl(recipientId)}
          width={1}
          height={1}
          alt=""
          style={{ display: "block", width: 1, height: 1, border: 0 }}
        />
      ) : null}
    </EmailLayout>
  );
}

/**
 * Split a plain-text body into segments, wrapping bare http(s) URLs in
 * click-tracking links when a recipientId is available. Trailing punctuation
 * after a URL is kept as plain text so it doesn't get swallowed into the href.
 */
function renderBody(body: string, recipientId: string | null): React.ReactNode {
  const urlRe = /(https?:\/\/[^\s<]+)/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = urlRe.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index));
    }
    let url = match[0];
    let trailing = "";
    const trail = /[)\].,!?;:'"]+$/.exec(url);
    if (trail) {
      trailing = trail[0];
      url = url.slice(0, url.length - trailing.length);
    }
    const href = recipientId ? clickTrackingUrl(recipientId, url) : url;
    nodes.push(
      <Link key={`u${key++}`} href={href} style={link}>
        {url}
      </Link>
    );
    if (trailing) nodes.push(trailing);
    lastIndex = urlRe.lastIndex;
  }
  if (lastIndex < body.length) nodes.push(body.slice(lastIndex));

  return nodes.length > 0 ? nodes : body;
}

CampaignEmail.PreviewProps = {
  body: "Hi there,\n\nI noticed your team is scaling fast — wanted to share how we help agencies go from draft to brand: https://drafttobrand.com\n\nWorth a quick chat?",
  firstName: "Alex",
} satisfies CampaignEmailProps;

const paragraph = {
  margin: 0,
  fontSize: 14,
  lineHeight: 1.65,
  color: BRAND.colors.text,
  whiteSpace: "pre-wrap" as const,
};
const note = {
  margin: 0,
  fontSize: 11,
  lineHeight: 1.6,
  color: BRAND.colors.mutedText,
};
const link = {
  color: BRAND.colors.primary,
  textDecoration: "underline",
};
const unsubscribeLink = {
  color: BRAND.colors.mutedText,
  textDecoration: "underline",
};
