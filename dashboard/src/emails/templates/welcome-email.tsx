import { Heading, Section, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";
import { EmailButton, EmailLayout } from "../components";

export interface WelcomeEmailProps {
  name?: string;
  /** Where the CTA points. Defaults to BRAND.url + "/dashboard". */
  dashboardUrl?: string;
  /** Name of the workspace they joined. Optional. */
  workspaceName?: string;
}

export default function WelcomeEmail({
  name,
  dashboardUrl,
  workspaceName,
}: WelcomeEmailProps) {
  const href = dashboardUrl ?? `${BRAND.url}/dashboard`;
  const greeting = `Hi ${name ?? "there"},`;
  const intro = workspaceName
    ? `You're in — your workspace ${workspaceName} is ready.`
    : "You're in — your workspace is ready.";
  // Preview snippet shown in inbox lists. The header logo carries identity
  // inside the email itself, so the title heading omits the brand name.
  const preview = workspaceName
    ? `Your workspace ${workspaceName} is ready`
    : "Your workspace is ready";

  return (
    <EmailLayout preview={preview}>
      <Heading as="h1" style={heading}>
        Welcome aboard.
      </Heading>

      <Text style={paragraph}>{greeting}</Text>

      <Text style={paragraph}>{intro}</Text>

      <Text style={paragraph}>
        This is the operating system we use to take a brand{" "}
        <em style={{ color: BRAND.colors.dark }}>{BRAND.tagline.toLowerCase()}</em> —
        organizations, branches, teams, and roles in one place.
      </Text>

      <Section
        style={{
          margin: "20px 0 4px",
          padding: "16px 18px",
          borderRadius: 10,
          backgroundColor: BRAND.colors.background,
          border: `1px solid ${BRAND.colors.border}`,
        }}
      >
        <Text style={{ ...small, margin: 0, color: BRAND.colors.dark, fontWeight: 600 }}>
          Get started
        </Text>
        <Text style={{ ...small, margin: "6px 0 0" }}>
          • Invite your first members<br />
          • Set up branches, departments, and teams<br />
          • Assign roles or create your own
        </Text>
      </Section>

      <div style={{ margin: "24px 0 8px" }}>
        <EmailButton href={href}>Go to dashboard</EmailButton>
      </div>

      <Text style={small}>
        We&rsquo;re glad you&rsquo;re here. Reply anytime — a human reads every email.
      </Text>
    </EmailLayout>
  );
}

WelcomeEmail.PreviewProps = {
  name: "Alex",
  workspaceName: "Acme Studio",
  dashboardUrl: "https://example.com/dashboard",
} satisfies WelcomeEmailProps;

const heading = {
  margin: 0,
  fontSize: 26,
  fontWeight: 600,
  letterSpacing: "-0.02em",
  color: BRAND.colors.dark,
  lineHeight: 1.2,
};
const paragraph = { margin: "16px 0 0", fontSize: 14, lineHeight: 1.65, color: BRAND.colors.text };
const small = { margin: "12px 0 0", fontSize: 12, lineHeight: 1.6, color: BRAND.colors.mutedText };
