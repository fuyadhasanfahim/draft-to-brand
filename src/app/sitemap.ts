import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";
import { tools } from "@/lib/tools";

const routes = [
  "",
  "/about",
  "/services",
  "/work",
  "/pricing",
  "/tools",
  ...tools.map((tool) => `/tools/${tool.slug}`),
  "/contact",
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
