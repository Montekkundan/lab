import { notFound } from 'next/navigation'
import { getExperimentBySlug, getExperimentImportPath } from '@/lib/experiments.config'
import ExperimentClient from './experiment-client'

export default async function ExperimentPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params
  const experiment = getExperimentBySlug(slug)

  if (!experiment) {
    notFound()
  }

  const importPath = getExperimentImportPath(experiment)

  return <ExperimentClient slug={slug} importPath={importPath} />
}
