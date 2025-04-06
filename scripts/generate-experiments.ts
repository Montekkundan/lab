import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const experimentsDir = path.join(__dirname, '../src/experiments')
const outputPath = path.join(__dirname, '../public/experiments.json')

interface Experiment {
  filename: string
  title?: string
  description?: string
  tags?: string[]
  href?: string
  background?: string
  og?: string
}

/**
 * Extract component metadata from file content
 */
async function extractMetadata(filePath: string, filename: string): Promise<Experiment | null> {
  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const experiment: Experiment = {
      filename
    }
    
    const titleMatch = content.match(/(\w+)\.Title\s*=\s*['"](.+?)['"]/)
    if (titleMatch && titleMatch[2]) {
      experiment.title = titleMatch[2]
    }
    
    const descriptionMatch = content.match(/(\w+)\.Description\s*=\s*['"](.+?)['"]/) || 
                            content.match(/(\w+)\.Description\s*=\s*\(?([^;]+)\)?/)
    if (descriptionMatch && descriptionMatch[2]) {
      const description = descriptionMatch[2].trim()
      if (!description.includes('(') && !description.includes('<')) {
        experiment.description = description.replace(/['"]/g, '')
      }
    }
    
    const tagsMatch = content.match(/(\w+)\.Tags\s*=\s*\[(.*?)\]/)
    if (tagsMatch && tagsMatch[2]) {
      const tagsStr = tagsMatch[2]
      experiment.tags = tagsStr
        .split(',')
        .map(tag => tag.trim().replace(/['"]/g, ''))
        .filter(Boolean)
    }
    
    const backgroundMatch = content.match(/(\w+)\.background\s*=\s*['"](.+?)['"]/)
    if (backgroundMatch && backgroundMatch[2]) {
      experiment.background = backgroundMatch[2]
    }
    
    const ogMatch = content.match(/(\w+)\.og\s*=\s*['"](.+?)['"]/)
    if (ogMatch && ogMatch[2]) {
      experiment.og = ogMatch[2]
    }
    
    const filenameWithoutExt = filename.replace(/\.[jt]sx?$/, '')
    const cleanPath = filenameWithoutExt.replace(/\/index$/, '')
    experiment.href = `/experiments/${cleanPath}`
    
    return experiment
  } catch (error) {
    console.error(`Error extracting metadata from ${filePath}:`, error)
    return null
  }
}

/**
 * Process a directory or file to extract experiment metadata
 */
async function processPath(itemPath: string, itemName: string): Promise<Experiment[]> {
  const stats = fs.statSync(itemPath)
  
  if (stats.isDirectory()) {
    const indexFiles = ['index.js', 'index.jsx', 'index.ts', 'index.tsx']
    for (const indexFile of indexFiles) {
      const indexPath = path.join(itemPath, indexFile)
      if (fs.existsSync(indexPath)) {
        const metadata = await extractMetadata(indexPath, `${itemName}/${indexFile}`)
        return metadata ? [metadata] : []
      }
    }
    
    const items = fs.readdirSync(itemPath)
    const results = await Promise.all(
      items.map(item => processPath(path.join(itemPath, item), `${itemName}/${item}`))
    )
    return results.flat()
  } else if (stats.isFile() && /\.(js|jsx|ts|tsx)$/.test(itemPath)) {
    const metadata = await extractMetadata(itemPath, itemName)
    return metadata ? [metadata] : []
  }
  
  return []
}

/**
 * Main function to generate experiments.json
 */
async function generateExperimentsJson() {
  try {
    console.log('Generating experiments.json...')
    
    const items = fs.readdirSync(experimentsDir)
    
    // Process each item
    const experimentsPromises = items.map(item => {
      const itemPath = path.join(experimentsDir, item)
      return processPath(itemPath, item)
    })
    
    const experimentArrays = await Promise.all(experimentsPromises)
    const experiments = experimentArrays.flat().filter(Boolean)
    
    fs.writeFileSync(outputPath, JSON.stringify(experiments, null, 2))
    
    console.log(`Successfully generated experiments.json with ${experiments.length} experiments`)
  } catch (error) {
    console.error('Error generating experiments.json:', error)
  }
}

generateExperimentsJson()