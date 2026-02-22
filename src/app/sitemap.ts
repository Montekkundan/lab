import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/constants";
import { getAllExperimentSlugs } from "@/lib/experiments.server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const slugs = await getAllExperimentSlugs();

  const experimentEntries = slugs.map((slug) => {
    return {
      url: `${siteOrigin}/experiments/${slug}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    } as const;
  });

  return [
    {
      url: siteOrigin,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    ...experimentEntries,
  ];
}
