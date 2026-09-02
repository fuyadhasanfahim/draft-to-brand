import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email({ error: 'Enter a valid email address.' }),
    password: z
        .string({ error: 'Enter your password.' })
        .min(1, { error: 'Enter your password.' })
        .max(200),
});

export type LoginInput = z.infer<typeof loginSchema>;
