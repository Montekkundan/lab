import { cacheLife, cacheTag } from 'next/cache'
import { isDev } from './constants'
import { getFileContributors, GitHubUser } from './github'
import { getExamplePath } from './utils'
import { experimentsConfig, getExperimentImportPath, isExperimentPublished } from './experiments.config'
import { CACHE_TAGS } from './cache-tags'

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
  createdAt: string;
  contributors?: Contributor[];
  importPath: string;
}

/**
 * Gets all experiment slugs
 * This function returns a cached list of experiment slugs
 */
export async function getAllExperimentSlugs() {
  'use cache'
  cacheTag(CACHE_TAGS.experimentsList)
  cacheLife('hours')
  return experimentsConfig.filter(isExperimentPublished).map((exp) => exp.slug)
}

/**
 * Gets all experiments with metadata
 * This function is cached
 */
export async function getAllExperiments() {
  'use cache'
  cacheTag(CACHE_TAGS.experimentsList)
  cacheTag(CACHE_TAGS.contributors)
  cacheLife('hours')

  // Start with experiments from config
  let experiments: ExperimentData[] = experimentsConfig
    .filter(isExperimentPublished)
    .map((exp) => ({
    filename: exp.file,
    slug: exp.slug,
    title: exp.title || formatExperimentTitle(exp.slug),
    description: exp.description || '',
    tags: exp.tags || [],
    href: `/experiments/${exp.slug}`,
    background: exp.background || 'dots',
    og: exp.og || '',
    createdAt: exp.createdAt,
    importPath: getExperimentImportPath(exp)
  }))

  if (!isDev) {
    experiments = experiments.filter((e) => !e.tags?.includes('private'))
  }

  // Order experiments by newest created date first.
  experiments = experiments.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

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
}

/**
 * Formats a slug to a display title
 */
function formatExperimentTitle(slug: string): string {
  let title = slug
    .replace(/-/g, ' ')

  title = title.charAt(0).toUpperCase() + title.slice(1)

  return title
}
