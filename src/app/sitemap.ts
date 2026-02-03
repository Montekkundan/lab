import type { MetadataRoute } from "next";
import { siteOrigin } from "@/lib/constants";
import { getAllExperimentSlugs } from "@/lib/experiments.server";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const experimentEntries = getAllExperimentSlugs().map((slug) => {
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
