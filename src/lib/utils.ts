import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { githubUrl, isClient } from '@/lib/constants'
import experimentsData from '../../public/experiments.json';

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
  console.log(`Generated GitHub URL: ${url}`);
  return url;
}

interface ExperimentData {
  filename: string;
  title: string;
  description: string;
  tags?: string[];
  background?: string;
  href: string;
}

export const getExamplePath = (filename: string) => {
  // Ensure the filename includes the extension
  const basePath = `src/experiments/${filename}`;
  console.log(`Base example path: ${basePath}`);
  
  try {
    // Get matching experiment from experiments.json
    const matchingExperiment = (experimentsData as ExperimentData[]).find((exp) => {
      // Match by href (most reliable way)
      if (exp.href === `/experiments/${filename}`) {
        return true;
      }
      
      if (exp.filename.includes('/')) {
        const experimentBaseName = exp.filename.split('/')[0];
        return experimentBaseName === filename;
      }
      
      const experimentBaseName = exp.filename.split('.')[0];
      return experimentBaseName === filename;
    });
    
    if (matchingExperiment) {
      const completePath = `src/experiments/${matchingExperiment.filename}`;
      console.log(`Found matching experiment: ${matchingExperiment.filename}`);
      return completePath;
    }
  } catch (error) {
    console.error("Error accessing experiments data:", error);
  }
  
  return basePath;
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