import { Container } from "@/components/shared/container";
import { Badge } from "@/components/shared/badge";
import { Reveal } from "@/components/shared/animations";
import { BlogCard } from "@/components/blog/blog-card";
import { listBlogs } from "@/lib/blog-service";
import { pageMetadata } from "@/lib/metadata";

export const revalidate = 60;

export const metadata = pageMetadata({
  title: "Blog: Brand & Growth Notes",
  description:
    "Field notes on branding, marketing, and growth from the Draft To Brand studio.",
  path: "/blog",
});

export default async function BlogIndexPage() {
  let posts: Awaited<ReturnType<typeof listBlogs>> = [];
  try {
    posts = await listBlogs({ status: "published" });
  } catch {
    posts = [];
  }

  return (
    <>
      <section className="relative pt-36 pb-16 md:pt-44 md:pb-20">
        <Container>
          <Reveal>
            <Badge>The studio journal</Badge>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-display mt-6 max-w-4xl text-4xl font-medium leading-[0.95] sm:text-5xl md:text-7xl">
              Ideas worth
              <br />
              <span className="text-serif italic font-normal text-muted">
                building on.
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted md:text-xl">
              Practical thinking on branding, marketing, and growth — written by
              the team doing the work.
            </p>
          </Reveal>
        </Container>
      </section>

      <section className="pb-28 md:pb-36">
        <Container>
          {posts.length === 0 ? (
            <p className="text-muted">
              No posts published yet — check back soon.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post, i) => (
                <Reveal key={post.id} delay={Math.min(i, 5) * 0.05}>
                  <BlogCard blog={post} />
                </Reveal>
              ))}
            </div>
          )}
        </Container>
      </section>
    </>
  );
}
