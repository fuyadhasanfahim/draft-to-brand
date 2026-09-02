"use client";

import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { format, formatDistanceToNow } from "date-fns";
import {
  IconPencil,
  IconTrash,
  IconEye,
  IconEyeOff,
  IconLoader2,
  IconRefresh,
} from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/shared/badge";
import {
  blogKeys,
  fetchBlogs,
  updateBlog,
  deleteBlog,
  type BlogDTO,
} from "@/lib/api/blogs";

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-3xl px-6 py-14 text-center">{children}</div>
  );
}

export function BlogTable() {
  const queryClient = useQueryClient();

  const { data: blogs, isPending, isError, error, refetch, isFetching } =
    useQuery({
      queryKey: blogKeys.list("all"),
      queryFn: () => fetchBlogs("all"),
    });

  const statusMutation = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "draft" | "published";
    }) => updateBlog(id, { status }),
    onSuccess: (_blog, { status }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      toast.success(status === "published" ? "Published" : "Moved to draft");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not update"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBlog(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      toast.success("Post deleted");
    },
    onError: (err) =>
      toast.error(err instanceof Error ? err.message : "Could not delete"),
  });

  if (isPending) {
    return (
      <Shell>
        <IconLoader2 className="mx-auto animate-spin text-muted" size={22} />
        <p className="mt-2 text-sm text-muted">Loading posts…</p>
      </Shell>
    );
  }

  if (isError) {
    return (
      <Shell>
        <p className="text-sm text-[color:var(--color-primary-text)]">
          {error instanceof Error ? error.message : "Could not load posts."}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          aria-label="Retry loading posts"
          title="Retry loading posts"
          className="btn-secondary mx-auto mt-4 px-4 py-2 text-sm"
        >
          <IconRefresh size={15} stroke={2} />
          Retry
        </button>
      </Shell>
    );
  }

  if (blogs.length === 0) {
    return (
      <Shell>
        <p className="text-display text-lg font-medium">No posts yet</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
          Create your first post to start placing ads inside articles.
        </p>
        <Link
          href="/admin/blogs/new"
          aria-label="Write a new blog post"
          title="Write a new blog post"
          className="btn-primary mx-auto mt-5 px-4 py-2 text-sm"
        >
          New post
        </Link>
      </Shell>
    );
  }

  return (
    <div className="glass-card overflow-hidden rounded-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs tracking-wide text-muted uppercase">
              <th className="px-5 py-3 font-medium">Title</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Published</th>
              <th className="px-5 py-3 font-medium">Updated</th>
              <th className="px-5 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className={cn(isFetching && "opacity-60")}>
            {blogs.map((blog) => (
              <Row
                key={blog.id}
                blog={blog}
                onToggle={() =>
                  statusMutation.mutate({
                    id: blog.id,
                    status: blog.status === "published" ? "draft" : "published",
                  })
                }
                toggling={
                  statusMutation.isPending &&
                  statusMutation.variables?.id === blog.id
                }
                onDelete={() => {
                  if (
                    window.confirm(
                      `Delete "${blog.title}"? This cannot be undone.`,
                    )
                  ) {
                    deleteMutation.mutate(blog.id);
                  }
                }}
                deleting={
                  deleteMutation.isPending && deleteMutation.variables === blog.id
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Row({
  blog,
  onToggle,
  toggling,
  onDelete,
  deleting,
}: {
  blog: BlogDTO;
  onToggle: () => void;
  toggling: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const published = blog.status === "published";
  const busy = toggling || deleting;

  return (
    <tr className="border-b border-border last:border-0">
      <td className="px-5 py-4">
        <Link
          href={`/admin/blogs/${blog.id}/edit`}
          className="font-medium text-foreground hover:underline"
        >
          {blog.title}
        </Link>
        <p className="mt-0.5 font-mono text-xs text-muted">/blog/{blog.slug}</p>
      </td>
      <td className="px-5 py-4">
        <Badge tone={published ? "dark" : "default"}>
          {published ? "Published" : "Draft"}
        </Badge>
      </td>
      <td className="px-5 py-4 text-muted">
        {blog.publishedAt ? (
          <>
            <span className="text-foreground">
              {format(new Date(blog.publishedAt), "d MMM yyyy")}
            </span>
            {blog.publishedBy && (
              <span className="block text-xs">by {blog.publishedBy}</span>
            )}
          </>
        ) : (
          "—"
        )}
      </td>
      <td className="px-5 py-4 text-muted">
        {formatDistanceToNow(new Date(blog.updatedAt), { addSuffix: true })}
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center justify-end gap-1">
          <Link
            href={`/admin/blogs/${blog.id}/edit`}
            aria-label={`Edit "${blog.title}"`}
            title={`Edit "${blog.title}"`}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <IconPencil size={16} stroke={2} />
          </Link>
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            aria-label={
              published
                ? `Unpublish "${blog.title}"`
                : `Publish "${blog.title}"`
            }
            title={
              published
                ? `Unpublish "${blog.title}"`
                : `Publish "${blog.title}"`
            }
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-foreground/5 hover:text-foreground disabled:opacity-50"
          >
            {toggling ? (
              <IconLoader2 size={16} className="animate-spin" />
            ) : published ? (
              <IconEyeOff size={16} stroke={2} />
            ) : (
              <IconEye size={16} stroke={2} />
            )}
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label={`Delete "${blog.title}"`}
            title={`Delete "${blog.title}"`}
            className="rounded-lg p-1.5 text-muted transition-colors hover:bg-primary/10 hover:text-[color:var(--color-primary-text)] disabled:opacity-50"
          >
            {deleting ? (
              <IconLoader2 size={16} className="animate-spin" />
            ) : (
              <IconTrash size={16} stroke={2} />
            )}
          </button>
        </div>
      </td>
    </tr>
  );
}
