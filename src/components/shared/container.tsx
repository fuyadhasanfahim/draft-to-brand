import { cn } from "@/lib/utils";
import type { ElementType, ReactNode } from "react";

export function Container({
  as: Tag = "div",
  className,
  children,
}: {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Tag className={cn("mx-auto w-full max-w-[1280px] px-6 md:px-10", className)}>
      {children}
    </Tag>
  );
}
