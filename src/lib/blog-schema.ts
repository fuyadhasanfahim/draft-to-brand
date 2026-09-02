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

// Field validators without defaults — shared by create and update. Defaults are
// added only on the create schema so an update PATCH never resurrects a field
// the caller did not send (zod `.partial()` still applies `.default()`).
const fields = {
    title: z.string().trim().min(3, 'Title is too short.').max(160),
    slug: slugSchema,
    excerpt: z.string().trim().max(300),
    coverImage: z.union([z.url('Enter a valid image URL.'), z.literal('')]),
    content: z.string().trim().min(1, 'Write some content first.'),
    publishedBy: z.string().trim().max(80),
    seoTitle: z.string().trim().max(70),
    seoDescription: z.string().trim().max(200),
    status: z.enum(blogStatuses),
};

export const createBlogSchema = z.object({
    title: fields.title,
    slug: fields.slug,
    excerpt: fields.excerpt.optional().default(''),
    coverImage: fields.coverImage.optional().default(''),
    content: fields.content,
    publishedBy: fields.publishedBy.optional().default(''),
    seoTitle: fields.seoTitle.optional().default(''),
    seoDescription: fields.seoDescription.optional().default(''),
    status: fields.status.optional().default('draft'),
});

export const updateBlogSchema = z.object(fields).partial();

export const statusUpdateSchema = z.object({ status: fields.status });

export type CreateBlogInput = z.infer<typeof createBlogSchema>;
export type UpdateBlogInput = z.infer<typeof updateBlogSchema>;

/** Serializable blog shape returned by the service and the API (dates as ISO strings). */
export type BlogDTO = {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    coverImage: string;
    content: string;
    status: BlogStatus;
    publishedAt: string | null;
    publishedBy: string;
    seoTitle: string;
    seoDescription: string;
    createdAt: string;
    updatedAt: string;
};
