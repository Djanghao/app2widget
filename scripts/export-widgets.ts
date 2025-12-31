import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

async function exportWidgets() {
  try {
    // Fetch all completed chat sessions with widget code
    const sessions = await prisma.chatSession.findMany({
      where: {
        status: 'completed',
        widgetCode: {
          not: null,
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    console.log(`Found ${sessions.length} completed widget sessions`)

    // Create export directory
    const exportDir = path.join(process.cwd(), 'docs', 'render-exp')
    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true })
    }

    // Export each session
    for (const session of sessions) {
      const sessionDir = path.join(exportDir, session.id)
      if (!fs.existsSync(sessionDir)) {
        fs.mkdirSync(sessionDir, { recursive: true })
      }

      // Export widget code
      if (session.widgetCode) {
        const widgetPath = path.join(sessionDir, 'widget.tsx')
        fs.writeFileSync(widgetPath, session.widgetCode, 'utf-8')
        console.log(`Exported widget code: ${widgetPath}`)
      }

      // Build response.json with all relevant data
      const response = {
        sessionId: session.id,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
        mode: session.mode,
        inputContent: session.inputContent,
        uiStyle: session.uiStyle,
        appId: session.appId,
        appMetadata: session.appMetadata,
        mockData: session.mockData,
        status: session.status,
        messages: session.messages.map((msg) => ({
          id: msg.id,
          createdAt: msg.createdAt.toISOString(),
          role: msg.role,
          messageType: msg.messageType,
          content: msg.content,
          data: msg.data,
        })),
      }

      const responsePath = path.join(sessionDir, 'response.json')
      fs.writeFileSync(responsePath, JSON.stringify(response, null, 2), 'utf-8')
      console.log(`Exported response: ${responsePath}`)
    }

    console.log(`\nExport completed! ${sessions.length} sessions exported to ${exportDir}`)

    // Create index file with summary
    const index = sessions.map((session) => ({
      sessionId: session.id,
      createdAt: session.createdAt.toISOString(),
      mode: session.mode,
      inputContent: session.inputContent.substring(0, 100) + (session.inputContent.length > 100 ? '...' : ''),
      uiStyle: session.uiStyle,
      appId: session.appId,
      appTitle: session.appMetadata ? (session.appMetadata as any).title : null,
    }))

    const indexPath = path.join(exportDir, 'index.json')
    fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8')
    console.log(`\nCreated index file: ${indexPath}`)
  } catch (error) {
    console.error('Error exporting widgets:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

exportWidgets()
