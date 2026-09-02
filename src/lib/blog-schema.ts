import { z } from 'zod';

export const blogStatuses = ['draft', 'published'] as const;
export type BlogStatus = (typeof blogStatuses)[number];

export const slugSchema = z
    .string()
    .trim()
    .toLowerCase()
    .min(3, 'Slug must be at least 3 characters.')
    .max(120)
    .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Use lowercase letters, numbers, and single hyphens only.',
    );

const coverImageSchema = z
    .union([z.url('Enter a valid image URL.'), z.literal('')])
    .optional()
    .default('');

const blogFields = {
    title: z.string().trim().min(3, 'Title is too short.').max(160),
    slug: slugSchema,
    excerpt: z.string().trim().max(300).optional().default(''),
    coverImage: coverImageSchema,
    content: z.string().trim().min(1, 'Write some content first.'),
    publishedBy: z.string().trim().max(80).optional().default(''),
    seoTitle: z.string().trim().max(70).optional().default(''),
    seoDescription: z.string().trim().max(200).optional().default(''),
    status: z.enum(blogStatuses).optional().default('draft'),
};

export const createBlogSchema = z.object(blogFields);
export const updateBlogSchema = z.object(blogFields).partial();
export const statusUpdateSchema = z.object({ status: z.enum(blogStatuses) });

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;
