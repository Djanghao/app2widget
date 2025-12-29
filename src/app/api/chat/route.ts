import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ChatRequest, ChatMessage } from '@/types/chat'
import { ASSISTANT_MESSAGES } from '@/constants/messages'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { mode, input, uiStyle, apiKey, llmConfig } = body

    if (!mode || !input || !uiStyle || !apiKey || !llmConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create a TransformStream for SSE
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    const sendMessage = async (message: any) => {
      await writer.write(
        encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
      )
    }

    // Create new chat session
    const session = await prisma.chatSession.create({
      data: {
        mode,
        inputContent: input,
        uiStyle,
        status: 'pending',
      },
    })

    // Start async processing
    ;(async () => {
      try {
        // 1. Create user input message
        const userMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'user',
            messageType: 'input',
            content: mode === 'appId' ? `App ID: ${input}` : input,
          },
        })
        await sendMessage(userMessage)

      // 2. Get UI style preset
      const uiStylePreset = await prisma.uIStylePreset.findUnique({
        where: { name: uiStyle },
      })
      if (!uiStylePreset) {
        throw new Error(`UI style preset not found: ${uiStyle}`)
      }

      // 3. Handle different flows based on mode
      let mockData: any
      let appMetadata: any = null

      if (mode === 'appId') {
        // appId mode: fetch metadata, display it, then generate mock data

        // 3a. Announce metadata fetch
        const fetchMetadataMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'text',
            content: ASSISTANT_MESSAGES.FETCH_APP_METADATA(input),
          },
        })
        await sendMessage(fetchMetadataMessage)

        // 3b. Fetch app metadata directly from database
        const app = await prisma.appMetadata.findUnique({
          where: { id: input },
          select: {
            id: true,
            title: true,
            description: true,
            osSystem: true,
            category: true,
            geometricDomain: true,
            price: true,
            currency: true,
            lang: true,
            wordCount: true,
          },
        })

        if (!app) {
          throw new Error(`App not found: ${input}`)
        }

        appMetadata = app

        // 3c. Display app metadata immediately
        const appMetadataMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'app-metadata',
            content: JSON.stringify(appMetadata, null, 2),
            data: appMetadata,
          },
        })
        await sendMessage(appMetadataMessage)

        // 3d. Announce mock data generation
        const mockDataStartMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'text',
            content: ASSISTANT_MESSAGES.START_MOCK_DATA_APPID,
          },
        })
        await sendMessage(mockDataStartMessage)

        // 3e. Generate mock data using the already-fetched metadata
        const mockDataResponse = await fetch(
          `${request.nextUrl.origin}/api/generate/mock-data`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode,
              input,
              apiKey,
              llmConfig,
            }),
          }
        )

        if (!mockDataResponse.ok) {
          const error = await mockDataResponse.json()
          throw new Error(error.error || 'Mock data generation failed')
        }

        const mockDataResult = await mockDataResponse.json()
        // Extract only mock data (appMetadata already shown)
        const { appMetadata: _, ...restMockData } = mockDataResult
        mockData = restMockData

        // 3f. Save mock data message
        const mockDataMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'mock-data',
            content: JSON.stringify(mockData, null, 2),
            data: mockData,
          },
        })
        await sendMessage(mockDataMessage)

        // 3g. Update session with mock data and app metadata
        await prisma.chatSession.update({
          where: { id: session.id },
          data: {
            mockData,
            appMetadata,
            appId: input,
          },
        })

      } else {
        // description mode: just generate mock data

        // 3a. Announce mock data generation
        const mockDataStartMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'text',
            content: ASSISTANT_MESSAGES.START_MOCK_DATA_DESCRIPTION,
          },
        })
        await sendMessage(mockDataStartMessage)

        // 3b. Generate mock data
        const mockDataResponse = await fetch(
          `${request.nextUrl.origin}/api/generate/mock-data`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode,
              input,
              apiKey,
              llmConfig,
            }),
          }
        )

        if (!mockDataResponse.ok) {
          const error = await mockDataResponse.json()
          throw new Error(error.error || 'Mock data generation failed')
        }

        mockData = await mockDataResponse.json()

        // 3c. Save mock data message
        const mockDataMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'mock-data',
            content: JSON.stringify(mockData, null, 2),
            data: mockData,
          },
        })
        await sendMessage(mockDataMessage)

        // 3d. Update session with mock data
        await prisma.chatSession.update({
          where: { id: session.id },
          data: { mockData },
        })
      }

        // 7. Assistant starts widget generation
        const widgetStartMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'text',
            content: ASSISTANT_MESSAGES.START_WIDGET,
          },
        })
        await sendMessage(widgetStartMessage)

      // 8. Generate widget code
      const widgetResponse = await fetch(
        `${request.nextUrl.origin}/api/generate/widget`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mockData,
            uiStylePrompt: uiStylePreset.promptAddition,
            apiKey,
            llmConfig,
          }),
        }
      )

      if (!widgetResponse.ok) {
        const error = await widgetResponse.json()
        throw new Error(error.error || 'Widget generation failed')
      }

      const { code: widgetCode } = await widgetResponse.json()

        // 9. Save widget code message
        const widgetMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'widget-code',
            content: widgetCode,
            data: { code: widgetCode },
          },
        })
        await sendMessage(widgetMessage)

        // 10. Update session with widget code and complete status
        await prisma.chatSession.update({
          where: { id: session.id },
          data: {
            widgetCode,
            status: 'completed',
          },
        })

        await writer.close()
      }
      catch (error) {
        // Save error to database
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        await prisma.chatSession.update({
          where: { id: session.id },
          data: {
            status: 'failed',
            error: errorMessage,
          },
        })

        let errorContent = ASSISTANT_MESSAGES.ERROR_GENERIC
        if (errorMessage.includes('App not found')) {
          errorContent = ASSISTANT_MESSAGES.ERROR_INVALID_APP_ID
        } else if (errorMessage.includes('LLM') || errorMessage.includes('API')) {
          errorContent = ASSISTANT_MESSAGES.ERROR_LLM_FAILED
        } else if (errorMessage.includes('Mock data generation failed')) {
          errorContent = ASSISTANT_MESSAGES.ERROR_APP_METADATA_FETCH
        }

        const errorChatMessage = await prisma.chatMessage.create({
          data: {
            sessionId: session.id,
            role: 'assistant',
            messageType: 'error',
            content: errorContent,
          },
        })

        await sendMessage(errorChatMessage)
        await writer.close()
      }
    })()

    // Return SSE stream
    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Error in /api/chat:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
