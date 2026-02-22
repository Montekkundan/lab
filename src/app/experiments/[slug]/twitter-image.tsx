import { ImageResponse } from 'next/og'
import { defaultMeta } from '@/lib/constants'
import { getExperimentBySlug, getExperimentDisplayTitle } from '@/lib/experiments.config'
import { OgImageTemplate } from './og-image-template'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function TwitterImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const experiment = getExperimentBySlug(slug)
  const title = getExperimentDisplayTitle(slug)
  const description = experiment?.description || defaultMeta.description

  return new ImageResponse(
    <OgImageTemplate title={title} description={description} />,
    {
      ...size,
    }
  )
}
