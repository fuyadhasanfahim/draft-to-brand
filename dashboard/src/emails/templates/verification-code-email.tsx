import { Heading, Section, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";
import { EmailLayout } from "../components";

export interface VerificationCodeEmailProps {
  name?: string;
  /** The OTP — typically 6 digits. Rendered as widely-spaced glyphs. */
  code: string;
  /** Minutes until the code expires. */
  expiresInMinutes?: number;
}

export default function VerificationCodeEmail({
  name,
  code,
  expiresInMinutes = 10,
}: VerificationCodeEmailProps) {
  return (
    <EmailLayout preview={`Your verification code is ${code}`}>
      <Heading as="h1" style={heading}>
        Your verification code
      </Heading>

      <Text style={paragraph}>Hi {name ?? "there"},</Text>

      <Text style={paragraph}>
        Use the code below to verify your email address and unlock your workspace.
      </Text>

      <Section
        style={{
          margin: "24px 0 8px",
          padding: "20px 24px",
          borderRadius: 12,
          backgroundColor: BRAND.colors.background,
          border: `1px solid ${BRAND.colors.border}`,
          textAlign: "center",
        }}
      >
        <Text
          style={{
            margin: 0,
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "0.36em",
            color: BRAND.colors.dark,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {code}
        </Text>
      </Section>

      <Text style={small}>
        This code expires in {expiresInMinutes} minute{expiresInMinutes === 1 ? "" : "s"}.
        For your security, never share it with anyone — we&rsquo;ll never ask
        you for this code.
      </Text>

      <Text style={small}>
        Didn&rsquo;t request this? You can safely ignore this email.
      </Text>
    </EmailLayout>
  );
}

VerificationCodeEmail.PreviewProps = {
  name: "Alex",
  code: "812467",
  expiresInMinutes: 10,
} satisfies VerificationCodeEmailProps;

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
