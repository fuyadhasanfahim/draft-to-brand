'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@/lib/auth/schema';
import { login } from '@/lib/auth/actions';

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
        <form onSubmit={onSubmit} noValidate className="space-y-5">
            <div className="space-y-1.5">
                <label htmlFor="email" className="block text-sm font-medium">
                    Email
                </label>
                <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    autoFocus
                    {...register('email')}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
                />
                {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
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
                    {...register('password')}
                    className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm outline-none focus:border-black/40"
                />
                {errors.password && (
                    <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
            </div>

            {errors.root && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                    {errors.root.message}
                </p>
            )}

            <button
                type="submit"
                disabled={pending}
                className="w-full rounded-lg bg-black px-4 py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
                {pending ? 'Signing in…' : 'Sign in'}
            </button>
        </form>
    );
}
