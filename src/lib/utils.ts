import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { githubUrl, isClient } from '@/lib/constants'
import { experimentsConfig } from '@/lib/experiments.config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const isApiSupported = (api: string) => isClient && api in window

/* Builds responsive sizes string for images */
export const getSizes = (
  entries: ({ breakpoint: string; width: string } | string | number)[]
) => {
  const sizes = entries.map((entry) => {
    if (!entry) {
      return ''
    }

    if (typeof entry === 'string') {
      return entry
    }

    if (typeof entry === 'number') {
      return `${entry}px`
    }

    if (entry.breakpoint.includes('px') || entry.breakpoint.includes('rem')) {
      return `(min-width: ${entry.breakpoint}) ${entry.width}`
    }

    throw new Error(`Invalid breakpoint: ${entry.breakpoint}`)
  })

  return sizes.join(', ')
}

export const getExampleGithubUrl = (filename: string) => {
  const url = `${githubUrl}/tree/master/${getExamplePath(filename)}`;
  return url;
}

export const getExamplePath = (filename: string) => {
  if (filename.includes('/')) {
    return `src/experiments/${filename}`;
  }

  const bySlug = experimentsConfig.find((exp) => exp.slug === filename);
  if (bySlug) {
    return `src/experiments/${bySlug.file}`;
  }

  const byFile = experimentsConfig.find((exp) => {
    const baseName = exp.file.split('/')[0];
    const fileStem = baseName.split('.')[0];
    return baseName === filename || fileStem === filename;
  });

  if (byFile) {
    return `src/experiments/${byFile.file}`;
  }

  return `src/experiments/${filename}`;
}

export const isReactComponent = (
  param: unknown
): param is React.ComponentType => {
  const isFunctionComponent = (param: unknown) => {
    return (
      typeof param === 'function' &&
      String(param).includes('return React.createElement')
    )
  }

  const isClassComponent = (param: unknown) => {
    return typeof param === 'function' && !!param.prototype.isReactComponent
  }

  return isFunctionComponent(param) || isClassComponent(param)
}

export const range = (start: number, stop?: number, step?: number) => {
  if (typeof stop === 'undefined') {
    stop = start
    start = 0
  }

  if (typeof step === 'undefined') {
    step = 1
  }

  if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
    return []
  }

  const result = []
  for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
    result.push(i)
  }

  return result
}

/**
 * Creates a public URL for a static file
 */
export const getStaticFilePath = (relativePath: string): string => {
  // Remove leading slash if present
  const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
  return `/${cleanPath}`;
}
