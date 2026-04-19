import type { MetadataRoute } from "next";
import { templates } from "@/lib/templates";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://datastories.gallery";
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/templates`, lastModified: new Date() },
    ...templates.map((t) => ({
      url: `${base}/templates/${t.slug}`,
      lastModified: new Date(),
    })),
  ];
}
