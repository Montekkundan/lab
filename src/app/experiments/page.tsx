import fs from 'fs'
import path from 'path'

import { Meta } from '@/components/common/meta'
import Welcome from '@/components/common/welcome'
import { isDev, siteOrigin } from '@/lib/constants'
import { getFileContributors } from '@/lib/github'
import { getAllExperimentSlugs, getExamplePath } from '@/lib/utils'

async function getExperiments() {
  const experimentsDir = path.resolve(process.cwd(), 'src/experiments')
  const allSlugs = await getAllExperimentSlugs()

  function extractTagsFromFile(fileContents: string): string[] {
    const tagRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\.Tags\s*=\s*\[\s*([^\]]+?)\s*\]/s
    const tagMatch = fileContents.match(tagRegex)
    if (tagMatch && tagMatch[2]) {
      return tagMatch[2]
        .split(',')
        .map((tag) => tag.trim().replace(/['"]/g, '').toLowerCase())
    }
    return []
  }

  function extractTitleFromFile(fileContents: string): string {
    const titleRegex = /([A-Za-z_$][A-Za-z0-9_$]*)\.Title\s*=\s*['"]([^'"]+)['"]/s
    const titleMatch = fileContents.match(titleRegex)
    return titleMatch ? titleMatch[2].trim() : ''
  }

  const modules = await Promise.all(
    allSlugs.map(async (slug) => {
      let fullPath = path.join(experimentsDir, slug)
      
      // Check if it's a directory or a file
      const stats = fs.statSync(fullPath)
      
      // If it's a directory, find the main file
      if (stats.isDirectory()) {
        // Check for index file with different extensions
        const extensions = ['js', 'jsx', 'tsx', 'ts']
        const defaultFile = extensions
          .map((ext) => `index.${ext}`)
          .find((file) => {
            try {
              return fs.statSync(path.join(fullPath, file)).isFile()
            } catch (e) {
              return false
            }
          })
          
        if (defaultFile) {
          fullPath = path.join(fullPath, defaultFile)
        } else {
          // If no index file found, look for a file with the same name as the directory
          const dirName = path.basename(fullPath)
          const sameNameFile = extensions
            .map((ext) => `${dirName}.${ext}`)
            .find((file) => {
              try {
                return fs.statSync(path.join(experimentsDir, file)).isFile()
              } catch (e) {
                return false
              }
            })
            
          if (sameNameFile) {
            fullPath = path.join(experimentsDir, sameNameFile)
          } else {
            // No suitable file found in this directory
            return { 
              slug, 
              title: slug.replace(/[-_]/g, ' '),
              tags: [] 
            }
          }
        }
      }
      
      // Now fullPath should be a file, not a directory
      try {
        const fileContents = fs.readFileSync(fullPath, 'utf8')
        const tags = extractTagsFromFile(fileContents)
        const title = extractTitleFromFile(fileContents)
        return { slug, title, tags }
      } catch (err) {
        console.error(`Error reading file ${fullPath}:`, err)
        return { 
          slug, 
          title: slug.replace(/[-_]/g, ' '),
          tags: [] 
        }
      }
    })
  )

  let experiments = modules
    .map((exp) => {
      return {
        filename: exp.slug,
        title: exp.title || exp.slug,
        href: `/experiments/${exp.slug}`,
        tags: exp.tags && Array.isArray(exp.tags) ? exp.tags.map((tag) => tag?.toLowerCase?.()?.trim() || tag) : []
      }
    })
    .sort((a, b) => b.filename.localeCompare(a.filename, undefined, { numeric: true }))

  // Add og images
  try {
    const ogFiles = fs.readdirSync(process.cwd() + '/public/ogs')

    experiments = experiments.map((e) => {
      // Remove extension
      const filename = e.filename.split(/.(jsx|js|ts|tsx)/)[0]
      const matchingOgFile = ogFiles.find((f) => f.startsWith(filename))
      const og = matchingOgFile ? `${siteOrigin}/ogs/${matchingOgFile}` : null

      return {
        ...e,
        og
      }
    })
  } catch (error) {
    console.error('Error reading OG files:', error)
  }

  if (!isDev) {
    // Filter privates
    experiments = experiments.filter((e) => !e.tags.includes('private'))
  }

  const fileNameToTile = (filename: string) => {
    let title = filename
      .replace(/^\d+\./, '')
      .replace(/\.[jt]sx?$/, '')
      .replace(/-/g, ' ')

    title = title.charAt(0).toUpperCase() + title.slice(1) + '.'

    return title
  }

  // Numerate experiments
  experiments = experiments.map((e, i) => ({
    ...e,
    title: fileNameToTile(e.title),
    number: experiments.length - i
  }))

  // Add contributors
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

  try {
    fs.writeFileSync(process.cwd() + '/public/experiments.json', JSON.stringify(experiments, null, 2))
  } catch (error) {
    console.error('Error writing experiments.json:', error)
  }
  
  return experiments
}

export default async function ExperimentsPage() {
  const experiments = await getExperiments()
  
  return (
    <div className="min-h-screen bg-background">
      <Meta />
      <Welcome experiments={experiments} />
    </div>
  )
}