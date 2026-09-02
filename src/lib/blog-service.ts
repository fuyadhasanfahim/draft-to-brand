import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db/connect';
import { BlogModel } from '@/models/blog';
import type {
    BlogDTO,
    BlogStatus,
    CreateBlogInput,
    UpdateBlogInput,
} from '@/lib/blog-schema';

export type { BlogDTO };

/** Thrown when a slug collides with an existing post. */
export class BlogSlugTakenError extends Error {
    constructor(slug: string) {
        super(`The slug "${slug}" is already in use.`);
        this.name = 'BlogSlugTakenError';
    }
}

type LeanBlog = {
    _id: unknown;
    title?: string;
    slug?: string;
    excerpt?: string;
    coverImage?: string;
    content?: string;
    status?: BlogStatus;
    publishedAt?: Date | null;
    publishedBy?: string;
    seoTitle?: string;
    seoDescription?: string;
    createdAt?: Date;
    updatedAt?: Date;
};

function toDTO(doc: LeanBlog): BlogDTO {
    return {
        id: String(doc._id),
        title: doc.title ?? '',
        slug: doc.slug ?? '',
        excerpt: doc.excerpt ?? '',
        coverImage: doc.coverImage ?? '',
        content: doc.content ?? '',
        status: doc.status ?? 'draft',
        publishedAt: doc.publishedAt ? new Date(doc.publishedAt).toISOString() : null,
        publishedBy: doc.publishedBy ?? '',
        seoTitle: doc.seoTitle ?? '',
        seoDescription: doc.seoDescription ?? '',
        createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : '',
        updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : '',
    };
}

function isDuplicateKeyError(error: unknown): boolean {
    return (
        typeof error === 'object' &&
        error !== null &&
        (error as { code?: number }).code === 11000
    );
}

export async function listBlogs(
    opts: { status?: BlogStatus } = {},
): Promise<BlogDTO[]> {
    await connectDB();
    const filter = opts.status ? { status: opts.status } : {};
    const docs = await BlogModel.find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .lean<LeanBlog[]>()
        .exec();
    return docs.map(toDTO);
}

export async function getBlogById(id: string): Promise<BlogDTO | null> {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const doc = await BlogModel.findById(id).lean<LeanBlog>().exec();
    return doc ? toDTO(doc) : null;
}

export async function getBlogBySlug(slug: string): Promise<BlogDTO | null> {
    await connectDB();
    const doc = await BlogModel.findOne({ slug: slug.toLowerCase().trim() })
        .lean<LeanBlog>()
        .exec();
    return doc ? toDTO(doc) : null;
}

export async function createBlog(
    input: CreateBlogInput,
    actorName: string,
): Promise<BlogDTO> {
    await connectDB();

    const isPublished = input.status === 'published';
    try {
        const doc = await BlogModel.create({
            ...input,
            publishedAt: isPublished ? new Date() : null,
            publishedBy: isPublished ? input.publishedBy || actorName : input.publishedBy ?? '',
        });
        return toDTO(doc.toObject() as LeanBlog);
    } catch (error) {
        if (isDuplicateKeyError(error)) throw new BlogSlugTakenError(input.slug);
        throw error;
    }
}

export async function updateBlog(
    id: string,
    input: UpdateBlogInput,
    actorName: string,
): Promise<BlogDTO | null> {
    if (!isValidObjectId(id)) return null;
    await connectDB();

    const current = await BlogModel.findById(id).exec();
    if (!current) return null;

    const update: Record<string, unknown> = { ...input };

    if (input.status === 'published' && !current.get('publishedAt')) {
        update.publishedAt = new Date();
        if (!input.publishedBy && !current.get('publishedBy')) {
            update.publishedBy = actorName;
        }
    }
    // Unpublishing keeps publishedAt / publishedBy so a re-publish shows the
    // original date.

    try {
        const doc = await BlogModel.findByIdAndUpdate(id, update, {
            new: true,
            runValidators: true,
        })
            .lean<LeanBlog>()
            .exec();
        return doc ? toDTO(doc) : null;
    } catch (error) {
        if (isDuplicateKeyError(error)) {
            throw new BlogSlugTakenError(String(input.slug ?? ''));
        }
        throw error;
    }
}

export async function setBlogStatus(
    id: string,
    status: BlogStatus,
    actorName: string,
): Promise<BlogDTO | null> {
    return updateBlog(id, { status }, actorName);
}

export async function deleteBlog(id: string): Promise<boolean> {
    if (!isValidObjectId(id)) return false;
    await connectDB();
    const res = await BlogModel.findByIdAndDelete(id).exec();
    return res !== null;
}
