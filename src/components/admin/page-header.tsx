import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** On-brand page header for admin screens — mirrors the marketing SectionHeader. */
export function PageHeader({
    eyebrow,
    title,
    description,
    actions,
    className,
}: {
    eyebrow?: string;
    title: ReactNode;
    description?: ReactNode;
    actions?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between',
                className,
            )}
        >
            <div className="flex flex-col gap-2">
                {eyebrow && <span className="section-eyebrow">{eyebrow}</span>}
                <h1 className="text-display text-2xl font-medium tracking-tight sm:text-3xl">
                    {title}
                </h1>
                {description && (
                    <p className="max-w-xl text-sm text-muted">{description}</p>
                )}
            </div>
            {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
        </div>
    );
}
