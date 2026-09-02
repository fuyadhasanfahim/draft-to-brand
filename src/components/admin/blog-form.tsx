"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { IconArrowLeft } from "@tabler/icons-react";
import Link from "next/link";
import { cn, slugify } from "@/lib/utils";
import { useUIStore } from "@/lib/stores/ui-store";
import { blogFormSchema, type BlogFormValues } from "@/lib/blog-schema";
import { AD_INSERT_OPTIONS } from "@/lib/ad-config";
import {
  blogKeys,
  createBlog,
  updateBlog,
  type BlogDTO,
} from "@/lib/api/blogs";
import { ImageDropzone } from "./image-dropzone";
import { PageHeader } from "./page-header";

const inputClass =
  "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-foreground/30";

function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-[color:var(--color-primary-text)]">{error}</p>
      ) : (
        hint && <p className="text-xs text-muted">{hint}</p>
      )}
    </div>
  );
}

type SubmitTarget = "draft" | "published" | "keep";

export function BlogForm({
  mode,
  defaultAuthor,
  blog,
}: {
  mode: "create" | "edit";
  defaultAuthor: string;
  blog?: BlogDTO;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const setEditorDirty = useUIStore((s) => s.setEditorDirty);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const {
    register,
    handleSubmit,
    control,
    setValue,
    setError,
    formState: { errors, isDirty },
  } = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: {
      title: blog?.title ?? "",
      slug: blog?.slug ?? "",
      excerpt: blog?.excerpt ?? "",
      coverImage: blog?.coverImage ?? "",
      content: blog?.content ?? "",
      publishedBy: blog?.publishedBy || defaultAuthor,
      seoTitle: blog?.seoTitle ?? "",
      seoDescription: blog?.seoDescription ?? "",
    },
  });

  const [pendingTarget, setPendingTarget] = useState<SubmitTarget | null>(null);

  // Insert an ad marker at the caret in the content textarea, on its own line.
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const insertToken = (token: string) => {
    const el = contentRef.current;
    if (!el) return;
    const value = el.value;
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const before = value.slice(0, start).replace(/[ \t]+$/, "");
    const after = value.slice(end).replace(/^[ \t]+/, "");
    const lead = before === "" ? "" : before.replace(/\n+$/, "") + "\n\n";
    const trail = "\n\n" + after.replace(/^\n+/, "");
    const next = lead + token + trail;
    setValue("content", next, { shouldDirty: true, shouldValidate: true });
    requestAnimationFrame(() => {
      const caret = lead.length + token.length;
      el.focus();
      try {
        el.setSelectionRange(caret, caret);
      } catch {
        /* ignore */
      }
    });
  };

  // Keep the slug in sync with the title until the user edits it themselves.
  const titleValue = useWatch({ control, name: "title" });
  useEffect(() => {
    if (!slugTouched && titleValue) {
      setValue("slug", slugify(titleValue), { shouldValidate: true });
    }
  }, [titleValue, slugTouched, setValue]);

  // Unsaved-changes guard.
  useEffect(() => {
    setEditorDirty(isDirty);
    return () => setEditorDirty(false);
  }, [isDirty, setEditorDirty]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const mutation = useMutation({
    mutationFn: async ({
      values,
      target,
    }: {
      values: BlogFormValues;
      target: SubmitTarget;
    }) => {
      if (mode === "create") {
        return createBlog({
          ...values,
          status: target === "published" ? "published" : "draft",
        });
      }
      return updateBlog(blog!.id, {
        ...values,
        ...(target === "keep" ? {} : { status: target }),
      });
    },
    onSuccess: (_saved, { target }) => {
      queryClient.invalidateQueries({ queryKey: blogKeys.all });
      setEditorDirty(false);
      toast.success(
        target === "published"
          ? "Published"
          : target === "draft" && mode === "edit"
            ? "Moved to draft"
            : "Saved",
      );
      router.push("/admin/blogs");
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      if (/slug/i.test(message)) {
        setError("slug", { message });
      } else {
        toast.error(message);
      }
    },
    onSettled: () => setPendingTarget(null),
  });

  const submit = (target: SubmitTarget) =>
    handleSubmit((values) => {
      setPendingTarget(target);
      mutation.mutate({ values, target });
    });

  const busy = mutation.isPending;
  const isPublished = blog?.status === "published";

  return (
    <form className="flex flex-col gap-8 pb-24">
      <PageHeader
        eyebrow={mode === "create" ? "New" : "Edit"}
        title={mode === "create" ? "New post" : "Edit post"}
        actions={
          <Link
            href="/admin/blogs"
            aria-label="Back to all posts"
            title="Back to all posts"
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <IconArrowLeft size={15} stroke={2} />
            Back
          </Link>
        }
      />

      <div className="glass-card flex flex-col gap-5 rounded-3xl p-6">
        <Field label="Title" htmlFor="title" error={errors.title?.message}>
          <input
            id="title"
            autoFocus
            {...register("title")}
            className={cn(inputClass, errors.title && "border-primary/50")}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          hint="The URL path — /blog/your-slug"
          error={errors.slug?.message}
        >
          <input
            id="slug"
            {...register("slug", {
              onChange: () => setSlugTouched(true),
            })}
            className={cn(inputClass, "font-mono", errors.slug && "border-primary/50")}
          />
        </Field>

        <Field
          label="Excerpt"
          htmlFor="excerpt"
          hint="Short summary for cards and search results."
          error={errors.excerpt?.message}
        >
          <textarea
            id="excerpt"
            rows={2}
            {...register("excerpt")}
            className={cn(inputClass, "resize-y")}
          />
        </Field>

        <Field
          label="Author"
          htmlFor="publishedBy"
          hint="Byline shown on the published post."
          error={errors.publishedBy?.message}
        >
          <input
            id="publishedBy"
            {...register("publishedBy")}
            className={inputClass}
          />
        </Field>
      </div>

      <div className="glass-card flex flex-col gap-2 rounded-3xl p-6">
        <span className="text-sm font-medium">Cover image</span>
        <Controller
          control={control}
          name="coverImage"
          render={({ field }) => (
            <ImageDropzone value={field.value} onChange={field.onChange} />
          )}
        />
      </div>

      <div className="glass-card flex flex-col gap-3 rounded-3xl p-6">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Content</span>
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-muted">Insert ad at cursor:</span>
            {AD_INSERT_OPTIONS.map((opt) => (
              <button
                key={opt.token}
                type="button"
                onClick={() => insertToken(opt.token)}
                title={opt.hint}
                aria-label={`Insert ${opt.label} ad marker at the cursor`}
                className="rounded-lg border border-border px-2 py-1 text-xs text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
              >
                {opt.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted">
            Markdown. Each button drops a marker like{" "}
            <code className="font-mono">[[ad:adsterra:300x250]]</code> on its own
            line — that spot renders the ad on the live post.
          </p>
        </div>

        {(() => {
          const { ref: registerRef, ...contentField } = register("content");
          return (
            <textarea
              id="content"
              rows={18}
              {...contentField}
              ref={(el) => {
                registerRef(el);
                contentRef.current = el;
              }}
              className={cn(
                inputClass,
                "resize-y font-mono leading-relaxed",
                errors.content && "border-primary/50",
              )}
            />
          );
        })()}
        {errors.content && (
          <p className="text-xs text-[color:var(--color-primary-text)]">
            {errors.content.message}
          </p>
        )}
      </div>

      <details className="glass-card rounded-3xl p-6">
        <summary className="cursor-pointer text-sm font-medium">
          SEO overrides <span className="text-muted">(optional)</span>
        </summary>
        <div className="mt-5 flex flex-col gap-5">
          <Field
            label="SEO title"
            htmlFor="seoTitle"
            hint="Defaults to the post title."
            error={errors.seoTitle?.message}
          >
            <input id="seoTitle" {...register("seoTitle")} className={inputClass} />
          </Field>
          <Field
            label="SEO description"
            htmlFor="seoDescription"
            hint="Defaults to the excerpt."
            error={errors.seoDescription?.message}
          >
            <textarea
              id="seoDescription"
              rows={2}
              {...register("seoDescription")}
              className={cn(inputClass, "resize-y")}
            />
          </Field>
        </div>
      </details>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/85 backdrop-blur md:pl-64">
        <div className="flex w-full items-center justify-between gap-3 px-4 py-3 md:px-10">
          <p className="text-xs text-muted">
            {isDirty ? "Unsaved changes" : "All changes saved"}
          </p>
          <div className="flex items-center gap-2">
            {mode === "create" ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit("draft")}
                  aria-label="Save as a draft (not shown on the blog)"
                  title="Save as a draft (not shown on the blog)"
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {busy && pendingTarget === "draft"
                    ? "Saving…"
                    : "Save draft"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit("published")}
                  aria-label="Publish now — make this post live on the blog"
                  title="Publish now — make this post live on the blog"
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {busy && pendingTarget === "published"
                    ? "Publishing…"
                    : "Publish"}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit(isPublished ? "draft" : "published")}
                  aria-label={
                    isPublished
                      ? "Unpublish — hide this post from the blog"
                      : "Publish now — make this post live on the blog"
                  }
                  title={
                    isPublished
                      ? "Unpublish — hide this post from the blog"
                      : "Publish now — make this post live on the blog"
                  }
                  className="btn-secondary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {busy && pendingTarget !== "keep"
                    ? "Working…"
                    : isPublished
                      ? "Unpublish"
                      : "Publish"}
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={submit("keep")}
                  aria-label="Save changes (keeps the current published state)"
                  title="Save changes (keeps the current published state)"
                  className="btn-primary px-4 py-2 text-sm disabled:opacity-60"
                >
                  {busy && pendingTarget === "keep"
                    ? "Saving…"
                    : "Save changes"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
