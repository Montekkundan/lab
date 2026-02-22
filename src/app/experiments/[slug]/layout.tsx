import type { Metadata } from "next";
import { defaultMeta, siteOrigin } from "@/lib/constants";
import { getExperimentBySlug, getExperimentDisplayTitle } from "@/lib/experiments.config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const experiment = getExperimentBySlug(slug);
  const title = getExperimentDisplayTitle(slug);
  const description = experiment?.description || defaultMeta.description;
  const url = `${siteOrigin}/experiments/${slug}`;
  const ogImageUrl = experiment?.og ? `${siteOrigin}${experiment.og}` : `${url}/opengraph-image`;
  const twitterImageUrl = `${url}/twitter-image`;

  return {
    title,
    description,
    alternates: {
      canonical: `/experiments/${slug}`,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${title} - Montek's Lab`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [twitterImageUrl],
      creator: defaultMeta.twitter.handle,
      site: defaultMeta.twitter.site,
    },
  };
}

export default function ExperimentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
