import { z } from 'zod';

export const brandAuditCategories = ['brand', 'social', 'content', 'ads', 'trust'] as const;

const categoryBreakdownSchema = z.object({
    category: z.enum(brandAuditCategories),
    percent: z.number().int().min(0).max(100),
});

export const brandAuditSubmissionSchema = z.object({
    name: z.string().trim().max(120).optional().default(''),
    businessType: z.string().trim().max(120).optional().default(''),
    phone: z
        .string()
        .trim()
        .regex(/^01[3-9]\d{8}$/, 'Enter a valid 11-digit Bangladeshi number, starting with 01.'),
    lang: z.enum(['en', 'bn']),
    score: z.number().int().min(0).max(100),
    answers: z.array(z.number().int().min(0).max(2)).length(15),
    categoryBreakdown: z.array(categoryBreakdownSchema).length(brandAuditCategories.length),
    weakCategories: z.array(z.enum(brandAuditCategories)).max(brandAuditCategories.length),
});

export type BrandAuditSubmissionInput = z.infer<typeof brandAuditSubmissionSchema>;
