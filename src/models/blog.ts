import { Schema, model, models, type InferSchemaType } from 'mongoose';
import { blogStatuses } from '@/lib/blog-schema';

const blogSchema = new Schema(
    {
        title: { type: String, required: true, trim: true, maxlength: 160 },
        slug: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true,
        },
        excerpt: { type: String, trim: true, maxlength: 300, default: '' },
        coverImage: { type: String, trim: true, default: '' },
        content: { type: String, required: true },
        status: {
            type: String,
            enum: blogStatuses,
            default: 'draft',
            index: true,
        },
        /** Set the first time the post is published; kept if it is later unpublished. */
        publishedAt: { type: Date, default: null },
        /** Author byline shown on the post. */
        publishedBy: { type: String, trim: true, maxlength: 80, default: '' },
        seoTitle: { type: String, trim: true, maxlength: 70, default: '' },
        seoDescription: { type: String, trim: true, maxlength: 200, default: '' },
    },
    { timestamps: true },
);

export type Blog = InferSchemaType<typeof blogSchema>;

export const BlogModel = models.Blog ?? model('Blog', blogSchema);
