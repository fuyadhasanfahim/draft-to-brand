import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { IconArrowUpRight } from "@tabler/icons-react";

type Variant = "primary" | "accent" | "secondary" | "ghost";

type BaseProps = {
  variant?: Variant;
  className?: string;
  children: ReactNode;
  withArrow?: boolean;
};

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  ghost: "btn-ghost",
};

export function Button({
  variant = "primary",
  className,
  children,
  withArrow,
  ...props
}: BaseProps & ComponentProps<"button">) {
  return (
    <button className={cn(variantClass[variant], className)} {...props}>
      {children}
      {withArrow && <IconArrowUpRight size={18} stroke={2} />}
    </button>
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
  withArrow,
  external,
}: BaseProps & { href: string; external?: boolean }) {
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(variantClass[variant], className)}
      >
        {children}
        {withArrow && <IconArrowUpRight size={18} stroke={2} />}
      </a>
    );
  }
  return (
    <Link href={href} className={cn(variantClass[variant], className)}>
      {children}
      {withArrow && <IconArrowUpRight size={18} stroke={2} />}
    </Link>
  );
}
