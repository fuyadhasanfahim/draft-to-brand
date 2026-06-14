import { Button } from "@react-email/components";
import type { ReactNode } from "react";
import { BRAND } from "@/lib/constants/brand";

export type EmailButtonVariant = "primary" | "dark";

export function EmailButton({
  href,
  children,
  variant = "primary",
}: {
  href: string;
  children: ReactNode;
  variant?: EmailButtonVariant;
}) {
  const bg = variant === "primary" ? BRAND.colors.primary : BRAND.colors.dark;
  return (
    <Button
      href={href}
      style={{
        backgroundColor: bg,
        color: "#ffffff",
        padding: "12px 22px",
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "-0.01em",
        textDecoration: "none",
        display: "inline-block",
      }}
    >
      {children}
    </Button>
  );
}
