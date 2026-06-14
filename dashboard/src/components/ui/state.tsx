import * as React from "react";
import { IconAlertTriangle, IconInbox, IconLoader2 } from "@tabler/icons-react";
import { cn } from "@/lib/utils";

interface BaseProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

function Wrap({ title, description, action, icon, className }: BaseProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center px-6 py-12 surface-card", className)}>
      {icon ? (
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-background)] text-[var(--color-muted-foreground)] border border-[var(--color-border)]">
          {icon}
        </div>
      ) : null}
      {title ? <h3 className="text-base font-semibold tracking-tight text-[var(--color-foreground)]">{title}</h3> : null}
      {description ? <p className="mt-1 max-w-md text-sm text-[var(--color-muted-foreground)]">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function EmptyState({ icon, ...rest }: BaseProps) {
  return <Wrap icon={icon ?? <IconInbox size={22} />} {...rest} />;
}

export function ErrorState({ icon, ...rest }: BaseProps) {
  return <Wrap icon={icon ?? <IconAlertTriangle size={22} className="text-[var(--color-danger)]" />} {...rest} />;
}

export function LoadingState({ icon, title = "Loading…", ...rest }: BaseProps) {
  return (
    <Wrap
      icon={icon ?? <IconLoader2 size={22} className="animate-spin" />}
      title={title}
      {...rest}
    />
  );
}
