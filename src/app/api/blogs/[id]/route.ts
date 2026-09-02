import { NextResponse } from 'next/server';
import { getCurrentAdmin } from '@/lib/auth/dal';
import { updateBlogSchema } from '@/lib/blog-schema';
import {
    deleteBlog,
    getBlogById,
    updateBlog,
    BlogSlugTakenError,
} from '@/lib/blog-service';
import { revalidateBlog } from '@/lib/blog-revalidate';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
    const admin = await getCurrentAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const blog = await getBlogById(id);
    if (!blog) {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
    return NextResponse.json({ blog });
}

export async function PATCH(request: Request, { params }: Params) {
    const admin = await getCurrentAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const parsed = updateBlogSchema.safeParse(body);
    if (!parsed.success || Object.keys(parsed.data).length === 0) {
        return NextResponse.json(
            { error: 'Invalid update.', issues: parsed.success ? [] : parsed.error.issues },
            { status: 400 },
        );
    }

    const { id } = await params;
    try {
        const blog = await updateBlog(id, parsed.data, admin.name);
        if (!blog) {
            return NextResponse.json({ error: 'Not found.' }, { status: 404 });
        }
        revalidateBlog(blog.slug);
        return NextResponse.json({ blog });
    } catch (error) {
        if (error instanceof BlogSlugTakenError) {
            return NextResponse.json({ error: error.message }, { status: 409 });
        }
        console.error('Failed to update blog:', error);
        return NextResponse.json(
            { error: 'Could not update the blog right now.' },
            { status: 502 },
        );
    }
}

export async function DELETE(_request: Request, { params }: Params) {
    const admin = await getCurrentAdmin();
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await params;
    const removedSlug = await deleteBlog(id);
    if (!removedSlug) {
        return NextResponse.json({ error: 'Not found.' }, { status: 404 });
    }
    revalidateBlog(removedSlug);
    return NextResponse.json({ ok: true });
}
