import { Img, Link, Section } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";

/**
 * The logo image IS the brand identity. Do not render BRAND.name beside
 * it — that would duplicate what the artwork already says. The `alt`
 * attribute keeps the brand name available for screen readers and for
 * clients that block remote images.
 */
export function EmailHeader() {
  return (
    <Section
      style={{
        padding: "32px 32px 24px",
        borderBottom: `1px solid ${BRAND.colors.border}`,
      }}
    >
      <Link
        href={BRAND.url}
        style={{ display: "inline-block", textDecoration: "none" }}
      >
        <Img
          src={BRAND.logo}
          alt={BRAND.name}
          height={36}
          style={{
            display: "block",
            width: "auto",
            maxHeight: 36,
          }}
        />
      </Link>
    </Section>
  );
}
