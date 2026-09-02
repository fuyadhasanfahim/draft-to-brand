import type { Metadata } from "next";
import Link from "next/link";
import { IconPencilPlus } from "@tabler/icons-react";
import { requireAdmin } from "@/lib/auth/dal";
import { PageHeader } from "@/components/admin/page-header";
import { BlogTable } from "@/components/admin/blog-table";

export const metadata: Metadata = {
  title: "Blogs",
  robots: { index: false, follow: false },
};

export default async function AdminBlogsPage() {
  await requireAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        eyebrow="Content"
        title="Blog posts"
        description="Write, publish, and manage the articles that carry your ads."
        actions={
          <Link
            href="/admin/blogs/new"
            aria-label="Write a new blog post"
            title="Write a new blog post"
            className="btn-primary"
          >
            <IconPencilPlus size={16} stroke={2} />
            New post
          </Link>
        }
      />
      <BlogTable />
    </div>
  );
}
