import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface AppData {
  os_system: string[]
  category: string[]
  geometric_domain?: string[]
  title: string
  icon: string
  Price: number
  currency: string
  description: string
  lang: string
  word_count: number
  screenshots?: string[]
}

async function importApps() {
  console.log('Loading app_data_v4.6.json...')
  const filePath = path.join(process.cwd(), 'public', 'app_data_v4.6.json')
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const appData: Record<string, AppData> = JSON.parse(fileContent)

  const appIds = Object.keys(appData)
  console.log(`Found ${appIds.length} apps to import`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const appId of appIds) {
    try {
      const app = appData[appId]

      // Check if already exists
      const existing = await prisma.appMetadata.findUnique({
        where: { id: appId },
      })

      if (existing) {
        skipped++
        if (skipped % 1000 === 0) {
          console.log(`Skipped ${skipped} existing apps...`)
        }
        continue
      }

      // Import app
      await prisma.appMetadata.create({
        data: {
          id: appId,
          title: app.title,
          icon: app.icon || null,
          description: app.description,
          osSystem: app.os_system,
          category: app.category,
          geometricDomain: app.geometric_domain || [],
          price: app.Price,
          currency: app.currency,
          lang: app.lang,
          wordCount: app.word_count,
          screenshots: app.screenshots || [],
        },
      })

      imported++
      if (imported % 100 === 0) {
        console.log(`Imported ${imported} apps...`)
      }
    } catch (error) {
      errors++
      console.error(`Error importing app ${appId}:`, error)
    }
  }

  console.log('\nImport completed!')
  console.log(`- Imported: ${imported}`)
  console.log(`- Skipped (existing): ${skipped}`)
  console.log(`- Errors: ${errors}`)
  console.log(`- Total: ${appIds.length}`)
}

importApps()
  .catch((error) => {
    console.error('Import failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
