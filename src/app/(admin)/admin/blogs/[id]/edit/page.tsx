import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth/dal";
import { getBlogById } from "@/lib/blog-service";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = {
  title: "Edit post",
  robots: { index: false, follow: false },
};

export default async function EditBlogPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const blog = await getBlogById(id);
  if (!blog) notFound();

  return <BlogForm mode="edit" defaultAuthor={admin.name} blog={blog} />;
}
