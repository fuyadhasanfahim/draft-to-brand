import { Hr, Link, Section, Text } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";

/**
 * No bold brand-name title here — the header logo already establishes
 * identity. The footer carries the descriptor, tagline, support link, and
 * a year-only copyright line.
 */
export function EmailFooter() {
  return (
    <Section style={{ padding: "24px 32px 32px" }}>
      <Hr style={{ borderColor: BRAND.colors.border, margin: "0 0 20px" }} />
      <Text
        style={{ margin: 0, fontSize: 12, color: BRAND.colors.mutedText }}
      >
        {BRAND.description}
      </Text>
      <Text
        style={{
          margin: "12px 0 0",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: BRAND.colors.primary,
          fontWeight: 600,
        }}
      >
        {BRAND.tagline}
      </Text>
      <Text style={{ margin: "20px 0 0", fontSize: 11, color: BRAND.colors.mutedText }}>
        Need help? Reach us at{" "}
        <Link
          href={`mailto:${BRAND.email.support}`}
          style={{ color: BRAND.colors.dark, textDecoration: "underline" }}
        >
          {BRAND.email.support}
        </Link>
        .
      </Text>
      <Text style={{ margin: "12px 0 0", fontSize: 11, color: BRAND.colors.mutedText }}>
        © {new Date().getFullYear()}. All rights reserved.
      </Text>
    </Section>
  );
}
