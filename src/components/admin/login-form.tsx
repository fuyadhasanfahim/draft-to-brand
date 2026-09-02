'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/lib/utils';
import { loginSchema, type LoginInput } from '@/lib/auth/schema';
import { login } from '@/lib/auth/actions';

const fieldClass =
    'w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground/30';

export function LoginForm() {
    const [pending, startTransition] = useTransition();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<LoginInput>({
        resolver: zodResolver(loginSchema),
        defaultValues: { email: '', password: '' },
    });

    const onSubmit = handleSubmit((values) => {
        startTransition(async () => {
            // On success the action redirects and this never resolves normally.
            const result = await login(values);
            if (result?.error) {
                setError('root', { message: result.error });
            }
        });
    });

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    aria-invalid={Boolean(errors.email)}
                    {...register('email')}
                    className={cn(fieldClass, errors.email && 'border-primary/50')}
                />
                {errors.email && (
                    <p className="text-xs text-[color:var(--color-primary-text)]">
                        {errors.email.message}
                    </p>
                )}
            </div>

            <div className="space-y-1.5">
                <label htmlFor="password" className="block text-sm font-medium">
                    Password
                </label>
                <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    aria-invalid={Boolean(errors.password)}
                    {...register('password')}
                    className={cn(fieldClass, errors.password && 'border-primary/50')}
                />
                {errors.password && (
                    <p className="text-xs text-[color:var(--color-primary-text)]">
                        {errors.password.message}
                    </p>
                )}
            </div>

            {errors.root && (
                <p className="rounded-xl border border-primary/20 bg-primary/8 px-3 py-2 text-sm text-[color:var(--color-primary-text)]">
                    {errors.root.message}
                </p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="btn-primary w-full disabled:opacity-60"
            >
                {pending ? 'Signing in…' : 'Sign in'}
            </button>
        </form>
    );
}
