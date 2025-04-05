import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import Image from 'next/image'

import { isDev, siteOrigin } from '@/lib/constants'
import { getAllExperimentSlugs, getExamplePath } from '@/lib/utils'
import { getFileContributors } from '@/lib/github'

import styles from './page.module.css'

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

  // Rest of the function remains the same
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
    fs.writeFileSync(
      process.cwd() + '/public/experiments.json',
      JSON.stringify(experiments, null, 2)
    )
  } catch (error) {
    console.error('Error writing experiments.json:', error)
  }
  
  return experiments
}

export default async function Home() {
  const experiments = await getExperiments()

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.logo}>
          <svg
            width="48"
            height="48"
            viewBox="0 0 250 250"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#F7D046" d="M209.45454 0h46.54545v46.54545h-46.54545z"/><path d="M0 0h46.54545v46.54545H0zM0 46.54545h46.54545V93.0909H0zM0 93.09091h46.54545v46.54545H0zM0 139.63636h46.54545v46.54545H0zM0 186.18182h46.54545v46.54545H0z"/><path fill="#F7D046" d="M23.27273 0h46.54545v46.54545H23.27273z"/><path fill="#F2A73B" d="M209.45454 46.54545h46.54545V93.0909h-46.54545zM23.27273 46.54545h46.54545V93.0909H23.27273z"/><path d="M139.63636 46.54545h46.54545V93.0909h-46.54545z"/><path fill="#F2A73B" d="M162.90909 46.54545h46.54545V93.0909h-46.54545zM69.81818 46.54545h46.54545V93.0909H69.81818z"/><path fill="#EE792F" d="M116.36364 93.09091h46.54545v46.54545h-46.54545zM162.90909 93.09091h46.54545v46.54545h-46.54545zM69.81818 93.09091h46.54545v46.54545H69.81818z"/><path d="M93.09091 139.63636h46.54545v46.54545H93.09091z"/><path fill="#EB5829" d="M116.36364 139.63636h46.54545v46.54545h-46.54545z"/><path fill="#EE792F" d="M209.45454 93.09091h46.54545v46.54545h-46.54545zM23.27273 93.09091h46.54545v46.54545H23.27273z"/><path d="M186.18182 139.63636h46.54545v46.54545h-46.54545z"/><path fill="#EB5829" d="M209.45454 139.63636h46.54545v46.54545h-46.54545z"/><path d="M186.18182 186.18182h46.54545v46.54545h-46.54545z"/><path fill="#EB5829" d="M23.27273 139.63636h46.54545v46.54545H23.27273z"/><path fill="#EA3326" d="M209.45454 186.18182h46.54545v46.54545h-46.54545zM23.27273 186.18182h46.54545v46.54545H23.27273z"/>
          </svg>
        </div>
        <h1 className={styles.title}>Montek&apos;s Lab</h1>
      </header>

      <div className={styles.intro}>
        <p>
          👋 Hi there. You are on Montek&apos;s experimental corner. Here you&apos;ll
          find all kinds of creative development related stuff.
        </p>
        <p>
          Take a look at the examples below and do not forget to leave a ⭐️ on
          my{' '}
          <a href="https://github.com/montekkundan/montek-lab">
            github repo
          </a>
          .
        </p>
      </div>

      <h2 className={styles.sectionTitle}>Useful Links</h2>
      <ul className={styles.links}>
        <li>
          <a href="https://animations.dev/" className={styles.link}>
            <span className={styles.linkIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.86 6.19L6.19 8.86C6.13 8.92 6.08 9 6.05 9.08C6.01 9.16 6 9.25 6 9.33C6 9.42 6.01 9.51 6.05 9.59C6.08 9.67 6.13 9.74 6.19 9.81C6.26 9.87 6.33 9.92 6.41 9.95C6.49 9.99 6.58 10 6.67 10C6.75 10 6.84 9.99 6.92 9.95C7 9.92 7.08 9.87 7.14 9.81L9.81 7.14C9.93 7.01 10 6.84 10 6.67C10 6.49 9.93 6.32 9.81 6.19C9.68 6.07 9.51 6 9.33 6C9.16 6 8.98 6.07 8.86 6.19V6.19Z" fill="white"/>
                <path d="M8.19 11.6L7.33 12.45C6.85 12.94 6.21 13.24 5.52 13.29C4.84 13.34 4.16 13.13 3.61 12.71C3.32 12.48 3.09 12.18 2.92 11.85C2.76 11.51 2.66 11.15 2.64 10.78C2.63 10.4 2.69 10.03 2.82 9.68C2.96 9.34 3.17 9.02 3.43 8.76L4.38 7.81C4.44 7.74 4.49 7.67 4.52 7.59C4.56 7.51 4.58 7.42 4.58 7.33C4.58 7.25 4.56 7.16 4.52 7.08C4.49 7 4.44 6.92 4.38 6.86C4.32 6.8 4.24 6.75 4.16 6.71C4.08 6.68 3.99 6.66 3.91 6.66C3.82 6.66 3.73 6.68 3.65 6.71C3.57 6.75 3.49 6.8 3.43 6.86L2.59 7.71C1.87 8.4 1.43 9.33 1.35 10.32C1.27 11.31 1.55 12.29 2.14 13.09C2.49 13.55 2.93 13.92 3.44 14.19C3.94 14.46 4.5 14.62 5.07 14.66C5.64 14.7 6.22 14.61 6.75 14.41C7.29 14.21 7.78 13.9 8.19 13.49L9.13 12.55C9.26 12.42 9.33 12.25 9.33 12.07C9.33 11.9 9.26 11.73 9.13 11.6C9.01 11.47 8.84 11.4 8.66 11.4C8.48 11.4 8.31 11.47 8.19 11.6V11.6Z" fill="white"/>
                <path d="M13.11 2.15C12.3 1.55 11.31 1.27 10.31 1.35C9.31 1.44 8.38 1.88 7.69 2.6L6.97 3.33C6.89 3.39 6.82 3.47 6.77 3.56C6.71 3.65 6.68 3.74 6.67 3.84C6.66 3.95 6.67 4.05 6.7 4.15C6.73 4.24 6.79 4.33 6.85 4.41C6.92 4.47 6.99 4.52 7.07 4.55C7.15 4.59 7.24 4.6 7.33 4.6C7.42 4.6 7.5 4.59 7.58 4.55C7.66 4.52 7.74 4.47 7.8 4.41L8.67 3.53C9.14 3.04 9.79 2.74 10.47 2.69C11.16 2.64 11.84 2.84 12.38 3.27C12.67 3.5 12.91 3.8 13.08 4.13C13.24 4.47 13.34 4.84 13.36 5.21C13.37 5.58 13.31 5.96 13.17 6.31C13.04 6.66 12.83 6.97 12.56 7.23L11.61 8.19C11.55 8.25 11.5 8.32 11.47 8.4C11.43 8.48 11.42 8.57 11.42 8.66C11.42 8.75 11.43 8.84 11.47 8.92C11.5 9 11.55 9.07 11.61 9.13C11.68 9.2 11.75 9.25 11.83 9.28C11.91 9.31 12 9.33 12.09 9.33C12.18 9.33 12.26 9.31 12.34 9.28C12.42 9.25 12.5 9.2 12.56 9.13L13.51 8.19C13.91 7.78 14.22 7.29 14.42 6.76C14.62 6.22 14.71 5.65 14.67 5.08C14.63 4.51 14.47 3.95 14.2 3.44C13.93 2.94 13.56 2.5 13.11 2.15V2.15Z" fill="white"/>
              </svg>
            </span>
            Learn web animations 🤯
          </a>
        </li>
        <li>
          <a href="https://threejs-journey.com/" className={styles.link}>
            <span className={styles.linkIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8.86 6.19L6.19 8.86C6.13 8.92 6.08 9 6.05 9.08C6.01 9.16 6 9.25 6 9.33C6 9.42 6.01 9.51 6.05 9.59C6.08 9.67 6.13 9.74 6.19 9.81C6.26 9.87 6.33 9.92 6.41 9.95C6.49 9.99 6.58 10 6.67 10C6.75 10 6.84 9.99 6.92 9.95C7 9.92 7.08 9.87 7.14 9.81L9.81 7.14C9.93 7.01 10 6.84 10 6.67C10 6.49 9.93 6.32 9.81 6.19C9.68 6.07 9.51 6 9.33 6C9.16 6 8.98 6.07 8.86 6.19V6.19Z" fill="white"/>
                <path d="M8.19 11.6L7.33 12.45C6.85 12.94 6.21 13.24 5.52 13.29C4.84 13.34 4.16 13.13 3.61 12.71C3.32 12.48 3.09 12.18 2.92 11.85C2.76 11.51 2.66 11.15 2.64 10.78C2.63 10.4 2.69 10.03 2.82 9.68C2.96 9.34 3.17 9.02 3.43 8.76L4.38 7.81C4.44 7.74 4.49 7.67 4.52 7.59C4.56 7.51 4.58 7.42 4.58 7.33C4.58 7.25 4.56 7.16 4.52 7.08C4.49 7 4.44 6.92 4.38 6.86C4.32 6.8 4.24 6.75 4.16 6.71C4.08 6.68 3.99 6.66 3.91 6.66C3.82 6.66 3.73 6.68 3.65 6.71C3.57 6.75 3.49 6.8 3.43 6.86L2.59 7.71C1.87 8.4 1.43 9.33 1.35 10.32C1.27 11.31 1.55 12.29 2.14 13.09C2.49 13.55 2.93 13.92 3.44 14.19C3.94 14.46 4.5 14.62 5.07 14.66C5.64 14.7 6.22 14.61 6.75 14.41C7.29 14.21 7.78 13.9 8.19 13.49L9.13 12.55C9.26 12.42 9.33 12.25 9.33 12.07C9.33 11.9 9.26 11.73 9.13 11.6C9.01 11.47 8.84 11.4 8.66 11.4C8.48 11.4 8.31 11.47 8.19 11.6V11.6Z" fill="white"/>
                <path d="M13.11 2.15C12.3 1.55 11.31 1.27 10.31 1.35C9.31 1.44 8.38 1.88 7.69 2.6L6.97 3.33C6.89 3.39 6.82 3.47 6.77 3.56C6.71 3.65 6.68 3.74 6.67 3.84C6.66 3.95 6.67 4.05 6.7 4.15C6.73 4.24 6.79 4.33 6.85 4.41C6.92 4.47 6.99 4.52 7.07 4.55C7.15 4.59 7.24 4.6 7.33 4.6C7.42 4.6 7.5 4.59 7.58 4.55C7.66 4.52 7.74 4.47 7.8 4.41L8.67 3.53C9.14 3.04 9.79 2.74 10.47 2.69C11.16 2.64 11.84 2.84 12.38 3.27C12.67 3.5 12.91 3.8 13.08 4.13C13.24 4.47 13.34 4.84 13.36 5.21C13.37 5.58 13.31 5.96 13.17 6.31C13.04 6.66 12.83 6.97 12.56 7.23L11.61 8.19C11.55 8.25 11.5 8.32 11.47 8.4C11.43 8.48 11.42 8.57 11.42 8.66C11.42 8.75 11.43 8.84 11.47 8.92C11.5 9 11.55 9.07 11.61 9.13C11.68 9.2 11.75 9.25 11.83 9.28C11.91 9.31 12 9.33 12.09 9.33C12.18 9.33 12.26 9.31 12.34 9.28C12.42 9.25 12.5 9.2 12.56 9.13L13.51 8.19C13.91 7.78 14.22 7.29 14.42 6.76C14.62 6.22 14.71 5.65 14.67 5.08C14.63 4.51 14.47 3.95 14.2 3.44C13.93 2.94 13.56 2.5 13.11 2.15V2.15Z" fill="white"/>
              </svg>
            </span>
            Three js Journey 🔥
          </a>
        </li>
      </ul>
      
      <h2 className={styles.sectionTitle}>Experiments</h2>
      <div className={styles.grid}>
        {experiments.map((exp) => (
          <Link href={exp.href} key={exp.filename} className={styles.card}>
            <div className={styles.cardContent}>
              <div className={styles.cardHeader}>
                <h3 className={styles.cardTitle}>{exp.title}</h3>
                <div className={styles.cardNumber}>#{exp.number}</div>
              </div>
              
              {exp.tags && exp.tags.length > 0 && (
                <div className={styles.tags}>
                  {exp.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
