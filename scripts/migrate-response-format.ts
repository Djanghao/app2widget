import * as fs from 'fs'
import * as path from 'path'

/**
 * Migrates all response.json files in render-exp directory to the new flattened structure
 * Old structure: { sessionId, ..., mockData: { widget, data, meta }, ... }
 * New structure: { sessionId, ..., widget, data, meta, ... }
 */
async function migrateResponseFiles() {
  try {
    const renderExpDir = path.join(process.cwd(), 'docs', 'render-exp')

    if (!fs.existsSync(renderExpDir)) {
      console.log('render-exp directory does not exist')
      return
    }

    const sessionDirs = fs.readdirSync(renderExpDir).filter((file) => {
      const fullPath = path.join(renderExpDir, file)
      return fs.statSync(fullPath).isDirectory()
    })

    console.log(`Found ${sessionDirs.length} session directories`)

    let migrated = 0
    let skipped = 0
    let errors = 0

    for (const sessionDir of sessionDirs) {
      const responseJsonPath = path.join(renderExpDir, sessionDir, 'response.json')
      const widgetTsxPath = path.join(renderExpDir, sessionDir, 'widget.tsx')

      if (!fs.existsSync(responseJsonPath)) {
        console.log(`Skipping ${sessionDir}: no response.json`)
        skipped++
        continue
      }

      try {
        // Read response.json
        const responseContent = fs.readFileSync(responseJsonPath, 'utf-8')
        const response = JSON.parse(responseContent)

        // Check if already migrated (has 'data' at top level)
        if (response.data && !response.mockData) {
          console.log(`Skipping ${sessionDir}: already migrated`)
          skipped++
          continue
        }

        // Migrate to flattened structure
        const mockData = response.mockData || {}
        const migratedResponse = {
          ...response,
          widget: mockData.widget || null,
          data: mockData.data || null,
          meta: mockData.meta || null,
        }
        delete migratedResponse.mockData

        // Write updated response.json
        fs.writeFileSync(
          responseJsonPath,
          JSON.stringify(migratedResponse, null, 2),
          'utf-8'
        )

        // Update widget.tsx if it exists
        if (fs.existsSync(widgetTsxPath)) {
          let widgetCode = fs.readFileSync(widgetTsxPath, 'utf-8')

          // Replace import statement: data -> response
          if (widgetCode.includes("import data from './response.json'")) {
            widgetCode = widgetCode.replace(
              "import data from './response.json'",
              "import response from './response.json'"
            )
          }

          // Replace data.data -> response.data
          widgetCode = widgetCode.replace(/\bdata\.data\b/g, 'response.data')

          // Replace data.meta -> response.meta
          widgetCode = widgetCode.replace(/\bdata\.meta\b/g, 'response.meta')

          // Replace data.widget -> response.widget
          widgetCode = widgetCode.replace(/\bdata\.widget\b/g, 'response.widget')

          // Replace data.mockData.data -> response.data
          widgetCode = widgetCode.replace(/\bdata\.mockData\.data\b/g, 'response.data')

          // Replace data.mockData.meta -> response.meta
          widgetCode = widgetCode.replace(/\bdata\.mockData\.meta\b/g, 'response.meta')

          fs.writeFileSync(widgetTsxPath, widgetCode, 'utf-8')
        }

        console.log(`✅ Migrated ${sessionDir}`)
        migrated++
      } catch (error) {
        console.error(`❌ Error migrating ${sessionDir}:`, error)
        errors++
      }
    }

    console.log('\n=== Migration Summary ===')
    console.log(`Migrated: ${migrated}`)
    console.log(`Skipped: ${skipped}`)
    console.log(`Errors: ${errors}`)
    console.log(`Total: ${sessionDirs.length}`)
  } catch (error) {
    console.error('Error during migration:', error)
    throw error
  }
}

migrateResponseFiles()
