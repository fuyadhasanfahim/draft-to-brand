import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";
import { listBlogs } from "@/lib/blog-service";

const staticRoutes = [
  "",
  "/about",
  "/services",
  "/work",
  "/pricing",
  "/tools",
  ...tools.map((tool) => `/tools/${tool.slug}`),
  "/blog",
  "/contact",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));

  let posts: Awaited<ReturnType<typeof listBlogs>> = [];
  try {
    posts = await listBlogs({ status: "published" });
  } catch {
    // DB unavailable at build — ship the static routes only.
  }

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt || post.publishedAt || now),
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticEntries, ...postEntries];
}
