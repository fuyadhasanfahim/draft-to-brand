import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/dal';
import { createBlogSchema, blogStatuses, type BlogStatus } from '@/lib/blog-schema';
import { createBlog, listBlogs, BlogSlugTakenError } from '@/lib/blog-service';
import { revalidateBlog } from '@/lib/blog-revalidate';

export async function GET(request: Request) {
    const admin = await getCurrentAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const statusParam = new URL(request.url).searchParams.get('status');
    const status =
        statusParam && (blogStatuses as readonly string[]).includes(statusParam)
            ? (statusParam as BlogStatus)
            : undefined;

    try {
        const blogs = await listBlogs({ status });
        return NextResponse.json({ blogs });
    } catch (error) {
        console.error('Failed to list blogs:', error);
        return NextResponse.json(
            { error: 'Could not load blogs right now.' },
            { status: 502 },
        );
    }
}

export async function POST(request: Request) {
    const admin = await getCurrentAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = createBlogSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json(
            { error: 'Invalid blog data.', issues: parsed.error.issues },
            { status: 400 },
        );
    }

    try {
        const blog = await createBlog(parsed.data, admin.name);
        revalidateBlog(blog.slug);
        return NextResponse.json({ blog }, { status: 201 });
    } catch (error) {
        if (error instanceof BlogSlugTakenError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('Failed to create blog:', error);
        return NextResponse.json(
            { error: 'Could not save the blog right now.' },
            { status: 502 },
        );
    }
}
