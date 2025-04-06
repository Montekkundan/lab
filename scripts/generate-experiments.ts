import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Determines the directory of the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Define paths
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
    // Read the file content
    const content = fs.readFileSync(filePath, 'utf-8')
    
    // Base experiment object with filename
    const experiment: Experiment = {
      filename
    }
    
    // Extract metadata using regex
    const titleMatch = content.match(/(\w+)\.Title\s*=\s*['"](.+?)['"]/)
    if (titleMatch && titleMatch[2]) {
      experiment.title = titleMatch[2]
    }
    
    const descriptionMatch = content.match(/(\w+)\.Description\s*=\s*['"](.+?)['"]/) || 
                            content.match(/(\w+)\.Description\s*=\s*\(?([^;]+)\)?/)
    if (descriptionMatch && descriptionMatch[2]) {
      // Clean up the description if it's not a simple string
      const description = descriptionMatch[2].trim()
      if (!description.includes('(') && !description.includes('<')) {
        experiment.description = description.replace(/['"]/g, '')
      }
    }
    
    const tagsMatch = content.match(/(\w+)\.Tags\s*=\s*\[(.*?)\]/)
    if (tagsMatch && tagsMatch[2]) {
      const tagsStr = tagsMatch[2]
      // Parse array of tags with proper handling of quoted strings
      experiment.tags = tagsStr
        .split(',')
        .map(tag => tag.trim().replace(/['"]/g, ''))
        .filter(Boolean)
    }
    
    const backgroundMatch = content.match(/(\w+)\.background\s*=\s*['"](.+?)['"]/)
    if (backgroundMatch && backgroundMatch[2]) {
      experiment.background = backgroundMatch[2]
    }
    
    // Calculate href from filename - properly handle paths with /index
    const filenameWithoutExt = filename.replace(/\.[jt]sx?$/, '')
    // Remove /index from the end of the path for cleaner URLs
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
    // Check for index.js, index.jsx, index.ts, or index.tsx
    const indexFiles = ['index.js', 'index.jsx', 'index.ts', 'index.tsx']
    for (const indexFile of indexFiles) {
      const indexPath = path.join(itemPath, indexFile)
      if (fs.existsSync(indexPath)) {
        const metadata = await extractMetadata(indexPath, `${itemName}/${indexFile}`)
        return metadata ? [metadata] : []
      }
    }
    
    // If no index file, recursively process all files in directory
    const items = fs.readdirSync(itemPath)
    const results = await Promise.all(
      items.map(item => processPath(path.join(itemPath, item), `${itemName}/${item}`))
    )
    return results.flat()
  } else if (stats.isFile() && /\.(js|jsx|ts|tsx)$/.test(itemPath)) {
    // Process individual file
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
    
    // Get all items in experiments directory
    const items = fs.readdirSync(experimentsDir)
    
    // Process each item
    const experimentsPromises = items.map(item => {
      const itemPath = path.join(experimentsDir, item)
      return processPath(itemPath, item)
    })
    
    // Wait for all processing to complete
    const experimentArrays = await Promise.all(experimentsPromises)
    const experiments = experimentArrays.flat().filter(Boolean)
    
    // Write to output file
    fs.writeFileSync(outputPath, JSON.stringify(experiments, null, 2))
    
    console.log(`Successfully generated experiments.json with ${experiments.length} experiments`)
  } catch (error) {
    console.error('Error generating experiments.json:', error)
  }
}

// Execute the main function
generateExperimentsJson()