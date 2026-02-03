import { cache } from 'react'
import { isDev } from './constants'
import { getFileContributors, GitHubUser } from './github'
import { getExamplePath } from './utils'
import { experimentsConfig, getExperimentImportPath } from './experiments.config'

type Contributor = GitHubUser;

interface ExperimentData {
  filename: string;
  slug: string;
  title?: string;
  description?: string;
  tags?: string[];
  href?: string;
  background?: string;
  og?: string;
  number?: number;
  contributors?: Contributor[];
  importPath: string;
}

/**
 * Gets all experiment slugs
 * This function returns a cached list of experiment slugs
 */
export const getAllExperimentSlugs = cache(() => {
  return experimentsConfig.map((exp) => exp.slug)
})

/**
 * Gets all experiments with metadata
 * This function is cached
 */
export const getAllExperiments = cache(async () => {
  // Start with experiments from config
  let experiments: ExperimentData[] = experimentsConfig.map((exp) => ({
    filename: exp.file,
    slug: exp.slug,
    title: exp.title || formatExperimentTitle(exp.slug),
    description: exp.description || '',
    tags: exp.tags || [],
    href: `/experiments/${exp.slug}`,
    background: exp.background || 'dots',
    og: exp.og || '',
    importPath: getExperimentImportPath(exp)
  }))

  if (!isDev) {
    experiments = experiments.filter((e) => !e.tags?.includes('private'))
  }

  // Order and numerate experiments based on config order (descending)
  experiments = experiments
    .map((e) => ({
      ...e,
      number: experimentsConfig.find((exp) => exp.slug === e.slug)?.order ?? 0
    }))
    .sort((a, b) => (b.number ?? 0) - (a.number ?? 0))

  // Add contributors (keep the API call since it's not file system dependent)
  try {
    experiments = await Promise.all(
      experiments.map(async (e) => {
        try {
          const contributors = await getFileContributors(getExamplePath(e.filename))
          return { ...e, contributors }
        } catch (err) {
          console.error(`Error getting contributors for ${e.filename}:`, err)
          return { ...e, contributors: [] }
        }
      })
    )
  } catch (error) {
    console.error('Error getting contributors:', error)
  }
  
  return experiments
})

/**
 * Formats a slug to a display title
 */
function formatExperimentTitle(slug: string): string {
  let title = slug
    .replace(/-/g, ' ')

  title = title.charAt(0).toUpperCase() + title.slice(1)

  return title
}
