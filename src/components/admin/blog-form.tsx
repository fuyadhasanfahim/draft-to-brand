"use client";

import { useEffect, useState, type ReactNode } from "react";
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

      <div className="glass-card flex flex-col gap-2 rounded-3xl p-6">
        <Field
          label="Content"
          htmlFor="content"
          hint={
            <>
              Markdown. Write <code className="font-mono">[[ad]]</code> on its own
              line to drop an ad slot there.
            </>
          }
          error={errors.content?.message}
        >
          <textarea
            id="content"
            rows={18}
            {...register("content")}
            className={cn(
              inputClass,
              "resize-y font-mono leading-relaxed",
              errors.content && "border-primary/50",
            )}
          />
        </Field>
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
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-10">
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
