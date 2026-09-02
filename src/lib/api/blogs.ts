import type {
    BlogDTO,
    BlogStatus,
    CreateBlogInput,
    UpdateBlogInput,
} from '@/lib/blog-schema';

export type { BlogDTO };

/** react-query cache keys for blog data. */
export const blogKeys = {
    all: ['blogs'] as const,
    list: (status?: BlogStatus | 'all') =>
        ['blogs', 'list', status ?? 'all'] as const,
    detail: (id: string) => ['blogs', 'detail', id] as const,
};

async function parse<T>(res: Response): Promise<T> {
    const data = (await res.json().catch(() => null)) as
        | (T & { error?: string })
        | null;

    if (!res.ok || !data) {
        throw new Error(data?.error || `Request failed (${res.status}).`);
    }
    return data;
}

export async function fetchBlogs(
    status?: BlogStatus | 'all',
): Promise<BlogDTO[]> {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    const data = await parse<{ blogs: BlogDTO[] }>(
        await fetch(`/api/blogs${query}`, { cache: 'no-store' }),
    );
    return data.blogs;
}

export async function fetchBlog(id: string): Promise<BlogDTO> {
    const data = await parse<{ blog: BlogDTO }>(
        await fetch(`/api/blogs/${id}`, { cache: 'no-store' }),
    );
    return data.blog;
}

export async function createBlog(input: CreateBlogInput): Promise<BlogDTO> {
    const data = await parse<{ blog: BlogDTO }>(
        await fetch('/api/blogs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        }),
    );
    return data.blog;
}

export async function updateBlog(
    id: string,
    input: UpdateBlogInput,
): Promise<BlogDTO> {
    const data = await parse<{ blog: BlogDTO }>(
        await fetch(`/api/blogs/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
        }),
    );
    return data.blog;
}

export async function deleteBlog(id: string): Promise<void> {
    await parse<{ ok: true }>(
        await fetch(`/api/blogs/${id}`, { method: 'DELETE' }),
    );
}
