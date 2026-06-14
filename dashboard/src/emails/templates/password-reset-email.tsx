import { Heading, Link, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";
import { EmailButton, EmailLayout } from "../components";

export interface PasswordResetEmailProps {
  name?: string;
  /** One-time-use reset link. */
  resetUrl: string;
  expiresInMinutes?: number;
  /** Optional IP / device hint for the recipient to verify the request. */
  requestedFrom?: string;
}

export default function PasswordResetEmail({
  name,
  resetUrl,
  expiresInMinutes = 30,
  requestedFrom,
}: PasswordResetEmailProps) {
  return (
    <EmailLayout preview={`Reset your ${BRAND.name} password`}>
      <Heading as="h1" style={heading}>
        Reset your password
      </Heading>

      <Text style={paragraph}>Hi {name ?? "there"},</Text>

      <Text style={paragraph}>
        We received a request to reset the password for your{" "}
        <strong style={{ color: BRAND.colors.dark }}>{BRAND.name}</strong> account.
        Use the button below to choose a new one.
      </Text>

      <div style={{ margin: "28px 0 8px" }}>
        <EmailButton href={resetUrl} variant="dark">Reset password</EmailButton>
      </div>

      <Text style={small}>
        This link expires in {expiresInMinutes} minutes and can only be used once.
        {requestedFrom ? ` Request originated from ${requestedFrom}.` : ""}
      </Text>

      <Text style={small}>
        Didn&rsquo;t request this? You can ignore this email — your password
        will stay the same.
      </Text>

      <Text style={small}>
        Trouble with the button? Paste this URL into your browser:
        <br />
        <Link href={resetUrl} style={fallback}>
          {resetUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

PasswordResetEmail.PreviewProps = {
  name: "Alex",
  resetUrl: "https://drafttobrand.com/reset?token=preview",
  expiresInMinutes: 30,
  requestedFrom: "Chrome on macOS · 203.0.113.42",
} satisfies PasswordResetEmailProps;

const heading = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: BRAND.colors.dark,
  lineHeight: 1.2,
};
const paragraph = { margin: "16px 0 0", fontSize: 14, lineHeight: 1.6, color: BRAND.colors.text };
const small = { margin: "20px 0 0", fontSize: 12, lineHeight: 1.6, color: BRAND.colors.mutedText };
const fallback = {
  color: BRAND.colors.dark,
  wordBreak: "break-all" as const,
  textDecoration: "underline",
};
