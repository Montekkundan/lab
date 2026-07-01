import { notFound } from 'next/navigation'
import { ExperimentDock } from '@/components/experiment-dock'
import {
  experimentsConfig,
  getExperimentBySlug,
  getPublishedExperimentNavItems,
  isExperimentPublished,
} from '@/lib/experiments.config'
import ExperimentClient from './experiment-client'

export async function generateStaticParams() {
  return experimentsConfig
    .filter(isExperimentPublished)
    .map((experiment) => ({ slug: experiment.slug }))
}

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params
  const experiment = getExperimentBySlug(slug)

  if (!experiment || !isExperimentPublished(experiment)) {
    notFound()
  }

  return (
    <>
      <ExperimentClient slug={slug} />
      <ExperimentDock currentSlug={slug} items={getPublishedExperimentNavItems()} />
    </>
  )
}
