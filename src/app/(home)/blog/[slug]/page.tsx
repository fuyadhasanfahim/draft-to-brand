import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { IconArrowLeft } from "@tabler/icons-react";
import { Container } from "@/components/shared/container";
import { Reveal } from "@/components/shared/animations";
import { BlogContent } from "@/components/blog/blog-content";
import { getBlogBySlug, listBlogs } from "@/lib/blog-service";
import { siteConfig } from "@/lib/site";

export const revalidate = 60;

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  try {
    const posts = await listBlogs({ status: "published" });
    return posts.map((post) => ({ slug: post.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogBySlug(slug).catch(() => null);

  if (!post || post.status !== "published") {
    return { title: "Post not found" };
  }

  const title = post.seoTitle || post.title;
  const description = post.seoDescription || post.excerpt || undefined;
  const url = `${siteConfig.url}/blog/${post.slug}`;
  const image = post.coverImage || siteConfig.ogImage;

  return {
    title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      modifiedTime: post.updatedAt || undefined,
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogBySlug(slug).catch(() => null);

  if (!post || post.status !== "published") {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seoDescription || post.excerpt || undefined,
    image: post.coverImage || undefined,
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt || undefined,
    author: post.publishedBy
      ? { "@type": "Person", name: post.publishedBy }
      : { "@type": "Organization", name: siteConfig.name },
    publisher: { "@type": "Organization", name: siteConfig.name },
    mainEntityOfPage: `${siteConfig.url}/blog/${post.slug}`,
  };

  return (
    <article className="pb-28 md:pb-36">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
        }}
      />

      <section className="relative pt-32 pb-10 md:pt-40 md:pb-14">
        <Container>
          <Reveal>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <IconArrowLeft size={15} stroke={2} />
              All posts
            </Link>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-4xl text-4xl font-medium leading-[1.02] sm:text-5xl md:text-6xl">
              {post.title}
            </h1>
          </Reveal>
          {post.publishedAt && (
            <Reveal delay={0.1}>
              <p className="mt-6 text-sm text-muted">
                Published on{" "}
                {format(new Date(post.publishedAt), "d MMMM yyyy")}
                {post.publishedBy && <> · by {post.publishedBy}</>}
              </p>
            </Reveal>
          )}
        </Container>
      </section>

      {post.coverImage && (
        <Container>
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-3xl">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              priority
              sizes="(min-width: 1280px) 1216px, 100vw"
              className="object-cover"
            />
          </div>
        </Container>
      )}

      <Container className="mt-12 md:mt-16">
        <div className="mx-auto max-w-2xl">
          <BlogContent content={post.content} />
        </div>
      </Container>
    </article>
  );
}
