import { cache } from 'react'
import { siteOrigin, isDev } from './constants'
import { getFileContributors } from './github'
import { getExamplePath } from './utils'

// Import experiments data from JSON file
import experimentsData from '../../public/experiments.json'

/**
 * Gets all experiment slugs
 * This function returns a cached list of experiment slugs
 */
export const getAllExperimentSlugs = cache(async () => {
  // Get experiments from JSON file
  const experiments = experimentsData.map(exp => exp.filename)
  return experiments
})

/**
 * Gets all experiments with metadata
 * This function is cached
 */
export const getAllExperiments = cache(async () => {
  // Start with experiments from JSON file
  let experiments = experimentsData.map(exp => ({
    filename: exp.filename,
    title: exp.title || formatExperimentTitle(exp.filename),
    description: exp.description || '',
    tags: exp.tags || [],
    href: exp.href || `/experiments/${exp.filename.replace(/\.[^/.]+$/, '')}`,
    background: exp.background || 'dots',
    og: exp.og || ''
  }))

  // Sort experiments (newest first based on number in filename)
  experiments = experiments.sort((a, b) => 
    b.filename.localeCompare(a.filename, undefined, { numeric: true })
  )

  if (!isDev) {
    // Filter private experiments
    experiments = experiments.filter(e => !e.tags?.includes('private'))
  }

  // Numerate experiments
  experiments = experiments.map((e, i) => ({
    ...e,
    number: experiments.length - i
  }))

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
 * Formats a filename to a display title
 */
function formatExperimentTitle(filename: string): string {
  let title = filename
    .replace(/^\d+\./, '') // Remove leading numbers
    .replace(/\.[jt]sx?$/, '') // Remove file extensions
    .replace(/-/g, ' ') // Replace dashes with spaces

  title = title.charAt(0).toUpperCase() + title.slice(1)

  return title
}