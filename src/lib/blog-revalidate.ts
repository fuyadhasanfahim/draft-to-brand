import { revalidatePath } from 'next/cache';

/** Refresh the public blog pages after a create / update / delete. */
export function revalidateBlog(slug?: string): void {
    revalidatePath('/blog');
    if (slug) revalidatePath(`/blog/${slug}`);
}
