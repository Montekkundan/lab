import { revalidateTag } from 'next/cache'

export const CACHE_TAGS = {
  experimentsList: 'experiments:list',
  contributors: 'experiments:contributors',
} as const

export async function invalidateExperimentsListTag() {
  revalidateTag(CACHE_TAGS.experimentsList, 'max')
}

export async function invalidateContributorsTag() {
  revalidateTag(CACHE_TAGS.contributors, 'max')
}

export async function invalidateAllExperimentTags() {
  revalidateTag(CACHE_TAGS.experimentsList, 'max')
  revalidateTag(CACHE_TAGS.contributors, 'max')
}
