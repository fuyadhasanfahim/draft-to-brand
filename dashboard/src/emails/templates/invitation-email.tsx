import { Heading, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";
import { EmailButton, EmailLayout } from "../components";

export interface InvitationEmailProps {
  inviterName?: string;
  recipientName?: string;
  organizationName: string;
  roleName: string;
  acceptUrl: string;
  expiresInDays?: number;
}

export default function InvitationEmail({
  inviterName,
  recipientName,
  organizationName,
  roleName,
  acceptUrl,
  expiresInDays = 7,
}: InvitationEmailProps) {
  const preview = `You're invited to join ${organizationName}`;
  return (
    <EmailLayout preview={preview}>
      <Heading as="h1" style={heading}>
        You&rsquo;re invited.
      </Heading>

      <Text style={paragraph}>Hi {recipientName ?? "there"},</Text>

      <Text style={paragraph}>
        {inviterName ?? "An administrator"} invited you to join{" "}
        <strong style={{ color: BRAND.colors.dark }}>{organizationName}</strong> as{" "}
        <strong style={{ color: BRAND.colors.dark }}>{roleName}</strong>. Accept the
        invitation below to set up your account.
      </Text>

      <div style={{ margin: "28px 0 8px" }}>
        <EmailButton href={acceptUrl} variant="primary">
          Accept invitation
        </EmailButton>
      </div>

      <Text style={small}>
        This invitation expires in {expiresInDays} day{expiresInDays === 1 ? "" : "s"}.
      </Text>
    </EmailLayout>
  );
}

InvitationEmail.PreviewProps = {
  inviterName: "Alex",
  recipientName: "Sam",
  organizationName: "Acme Studio",
  roleName: "Manager",
  acceptUrl: "https://example.com/sign-up?token=preview",
  expiresInDays: 7,
} satisfies InvitationEmailProps;

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
