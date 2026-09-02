import Link from "next/link";
import { Container } from "@/components/shared/container";

export default function BlogPostNotFound() {
  return (
    <section className="relative grid min-h-[70vh] place-items-center pt-32 pb-20">
      <Container className="text-center">
        <span className="section-eyebrow mx-auto">Blog</span>
        <h1 className="text-display mt-4 text-3xl font-medium tracking-tight sm:text-4xl">
          This post doesn&apos;t exist
        </h1>
        <p className="mx-auto mt-3 max-w-md text-muted">
          It may have been unpublished or the link is wrong.
        </p>
        <Link href="/blog" className="btn-primary mt-8">
          Back to the blog
        </Link>
      </Container>
    </section>
  );
}
