import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { IconLoader2 } from '@tabler/icons-react';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 font-medium tracking-tight whitespace-nowrap rounded-[var(--radius-md)] transition-[transform,background,box-shadow,color] duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-background)]',
    {
        variants: {
            variant: {
                primary:
                    'bg-[var(--color-dark)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_12px_-4px_rgba(40,42,42,0.3)] hover:bg-black hover:-translate-y-[1px]',
                accent: 'bg-[var(--color-primary)] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_6px_16px_-6px_rgba(255,49,49,0.55)] hover:bg-[var(--color-primary-hover)] hover:-translate-y-[1px]',
                secondary:
                    'bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)] shadow-[var(--shadow-xs)] hover:border-[var(--color-border-strong)] hover:-translate-y-[1px]',
                ghost: 'text-[var(--color-foreground)] hover:bg-[var(--color-border)]/40',
                outline:
                    'border border-[var(--color-border-strong)] text-[var(--color-foreground)] hover:bg-[var(--color-surface)]',
                danger: 'bg-[var(--color-danger)] text-white hover:bg-[#b91c1c] hover:-translate-y-[1px]',
                link: 'text-[var(--color-primary)] underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3 text-[13px]',
                md: 'h-10 px-4 text-sm',
                lg: 'h-11 px-5 text-[15px]',
                icon: 'h-10 w-10',
                'icon-sm': 'h-8 w-8',
            },
        },
        defaultVariants: { variant: 'primary', size: 'md' },
    },
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        { className, variant, size, loading, disabled, children, ...props },
        ref,
    ) => (
        <button
            ref={ref}
            className={cn(buttonVariants({ variant, size }), className)}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <IconLoader2 className="animate-spin" size={14} />
            ) : null}
            {children}
        </button>
    ),
);
Button.displayName = 'Button';

export { buttonVariants };
