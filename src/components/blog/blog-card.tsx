import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { IconArrowUpRight } from "@tabler/icons-react";
import type { BlogDTO } from "@/lib/blog-schema";

export function BlogCard({ blog }: { blog: BlogDTO }) {
  return (
    <Link
      href={`/blog/${blog.slug}`}
      className="group glass-card flex flex-col overflow-hidden rounded-3xl transition-transform duration-300 hover:-translate-y-1"
    >
      {blog.coverImage ? (
        <div className="relative aspect-[16/9] overflow-hidden">
          <Image
            src={blog.coverImage}
            alt={blog.title}
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-[#282a2a] to-[#1a1c1c]" />
      )}

      <div className="flex flex-1 flex-col gap-3 p-6">
        {blog.publishedAt && (
          <span className="text-xs tracking-wide text-muted">
            {format(new Date(blog.publishedAt), "d MMMM yyyy")}
          </span>
        )}
        <h3 className="text-display text-xl font-medium tracking-tight">
          {blog.title}
        </h3>
        {blog.excerpt && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted">
            {blog.excerpt}
          </p>
        )}
        <span className="btn-ghost mt-auto pt-2 text-sm">
          Read article <IconArrowUpRight size={15} />
        </span>
      </div>
    </Link>
  );
}
