import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

const routes = ["", "/about", "/services", "/work", "/pricing", "/contact"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return routes.map((route) => ({
    url: `${siteConfig.url}${route}`,
    lastModified,
    changeFrequency: "weekly",
    priority: route === "" ? 1 : 0.8,
  }));
}
