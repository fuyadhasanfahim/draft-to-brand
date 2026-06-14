import { Img, Link, Section } from "@react-email/components";
import { BRAND } from "@/lib/constants/brand";

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
        style={{
          display: "inline-flex",
          alignItems: "center",
          textDecoration: "none",
          color: BRAND.colors.dark,
        }}
      >
        <Img
          src={BRAND.logo}
          alt={BRAND.name}
          width={36}
          height={36}
          style={{
            display: "block",
            borderRadius: 8,
            marginRight: 12,
          }}
        />
        <span
          style={{
            fontSize: 16,
            fontWeight: 600,
            letterSpacing: "-0.01em",
            color: BRAND.colors.dark,
            verticalAlign: "middle",
          }}
        >
          {BRAND.name}
        </span>
      </Link>
    </Section>
  );
}
