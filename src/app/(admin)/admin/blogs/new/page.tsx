import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/dal";
import { BlogForm } from "@/components/admin/blog-form";

export const metadata: Metadata = {
  title: "New post",
  robots: { index: false, follow: false },
};

export default async function NewBlogPage() {
  const admin = await requireAdmin();
  return <BlogForm mode="create" defaultAuthor={admin.name} />;
}
