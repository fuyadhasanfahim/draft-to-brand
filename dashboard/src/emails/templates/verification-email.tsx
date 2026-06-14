import { Heading, Link, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";
import { EmailButton, EmailLayout } from "../components";

export interface VerificationEmailProps {
  /** Recipient's display name. Falls back to "there". */
  name?: string;
  /** Magic link the recipient clicks to verify. */
  verifyUrl: string;
  /** Optional hours-until-expiry to mention in the body. */
  expiresInHours?: number;
}

export default function VerificationEmail({
  name,
  verifyUrl,
  expiresInHours = 24,
}: VerificationEmailProps) {
  return (
    <EmailLayout preview="Verify your email to activate your workspace">
      <Heading
        as="h1"
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: BRAND.colors.dark,
          lineHeight: 1.2,
        }}
      >
        Verify your email
      </Heading>

      <Text style={paragraph}>Hi {name ?? "there"},</Text>

      <Text style={paragraph}>
        Welcome — confirm this email address to activate your workspace.
      </Text>

      <div style={{ margin: "28px 0 8px" }}>
        <EmailButton href={verifyUrl}>Verify email</EmailButton>
      </div>

      <Text style={small}>
        This link expires in {expiresInHours} hour{expiresInHours === 1 ? "" : "s"}.
        If you didn&rsquo;t create an account, you can safely ignore this email.
      </Text>

      <Text style={small}>
        Trouble with the button? Paste this URL into your browser:
        <br />
        <Link href={verifyUrl} style={fallback}>
          {verifyUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

VerificationEmail.PreviewProps = {
  name: "Alex",
  verifyUrl: "https://drafttobrand.com/verify?token=preview",
  expiresInHours: 24,
} satisfies VerificationEmailProps;

const paragraph = {
  margin: "16px 0 0",
  fontSize: 14,
  lineHeight: 1.6,
  color: BRAND.colors.text,
};

const small = {
  margin: "20px 0 0",
  fontSize: 12,
  lineHeight: 1.6,
  color: BRAND.colors.mutedText,
};

const fallback = {
  color: BRAND.colors.dark,
  wordBreak: "break-all" as const,
  textDecoration: "underline",
};
