import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ChatRequest, ChatMode, UIStyle } from '@/types/chat'
import { ASSISTANT_MESSAGES } from '@/constants/messages'
import { buildWidgetPrompt, buildWidgetRefineMessages } from '@/lib/llm/prompt-builder'

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    const { mode, input, uiStyle, apiKey, llmConfig, sessionId } = body

    if (!mode || !input || !uiStyle || !llmConfig) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: ASSISTANT_MESSAGES.ERROR_EMPTY_API_KEY },
        { status: 400 }
      )
    }

    // Create a TransformStream for SSE
    const encoder = new TextEncoder()
    const stream = new TransformStream()
    const writer = stream.writable.getWriter()

    let session = sessionId
      ? await prisma.chatSession.findUnique({
          where: { id: sessionId },
        })
      : null

    if (!session) {
      session = await prisma.chatSession.create({
        data: {
          mode,
          inputContent: input,
          uiStyle,
          status: 'pending',
        },
      })
    }

    const effectiveMode = (session.mode || mode) as ChatMode
    const effectiveUIStyle = (session.uiStyle || uiStyle) as UIStyle
    const isRefine = Boolean(session.widgetCode)

    let writerClosed = false

    const closeWriter = async () => {
      if (writerClosed) return
      writerClosed = true
      try {
        await writer.close()
      } catch {
      }
    }

    const sendMessage = async (message: any) => {
      if (writerClosed) return
      try {
        await writer.write(
          encoder.encode(`data: ${JSON.stringify(message)}\n\n`)
        )
      } catch {
        await closeWriter()
      }
    }

    const isSessionMissingError = (error: unknown) => {
      return (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        ((error as { code: string }).code === 'P2025' ||
          (error as { code: string }).code === 'P2003')
      )
    }

    const ensureSession = async () => {
      const existing = await prisma.chatSession.findUnique({
        where: { id: session.id },
        select: { id: true },
      })
      if (!existing) {
        await closeWriter()
        return false
      }
      return true
    }

    type MessagePayload = {
      sessionId: string
      role: string
      messageType: string
      content: string
      data?: any
    }

    const safeCreateMessage = async (data: MessagePayload) => {
      try {
        return await prisma.chatMessage.create({ data })
      } catch (error) {
        if (isSessionMissingError(error)) {
          await closeWriter()
          return null
        }
        throw error
      }
    }

    const createAndSend = async (data: MessagePayload) => {
      const message = await safeCreateMessage(data)
      if (!message) return null
      await sendMessage(message)
      return message
    }

    const safeUpdateSession = async (data: Record<string, unknown>) => {
      const result = await prisma.chatSession.updateMany({
        where: { id: session.id },
        data,
      })
      if (result.count === 0) {
        await closeWriter()
        return false
      }
      return true
    }

    // Start async processing
    ;(async () => {
      try {
        // 1. Create user input message
        const userMessage = await createAndSend({
          sessionId: session.id,
          role: 'user',
          messageType: 'input',
          content: isRefine
            ? input
            : effectiveMode === 'appId'
              ? `App ID: ${input}`
              : input,
        })
        if (!userMessage) return

        if (isRefine) {
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'text',
              content: ASSISTANT_MESSAGES.START_WIDGET_REFINE,
            }))
          ) {
            return
          }

          if (!(await ensureSession())) return
          const previousCode = session.widgetCode || ''
          const widgetResponse = await fetch(
            `${request.nextUrl.origin}/api/generate/widget`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                previousCode,
                refinePrompt: input,
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
          const refineMessages = buildWidgetRefineMessages(previousCode, input)
          const refinePromptPayload = JSON.stringify(
            [
              { role: 'system', content: refineMessages.system },
              { role: 'user', content: refineMessages.user },
            ],
            null,
            2
          )

          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'widget-code',
              content: widgetCode,
              data: { code: widgetCode, prompt: refinePromptPayload },
            }))
          ) {
            return
          }

          if (
            !(await safeUpdateSession({
              widgetCode,
              status: 'completed',
            }))
          ) {
            return
          }

          await closeWriter()
          return
        }

        // 2. Get UI style preset
        const uiStylePreset = await prisma.uIStylePreset.findUnique({
          where: { name: effectiveUIStyle },
        })
        if (!uiStylePreset) {
          throw new Error(`UI style preset not found: ${effectiveUIStyle}`)
        }

        // 3. Handle different flows based on mode
        let mockData: any
        let appMetadata: any = null

        if (effectiveMode === 'appId') {
          // appId mode: fetch metadata, display it, then generate mock data

          // 3a. Announce metadata fetch
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'text',
              content: ASSISTANT_MESSAGES.FETCH_APP_METADATA(input),
            }))
          ) {
            return
          }

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
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'app-metadata',
              content: JSON.stringify(appMetadata, null, 2),
              data: appMetadata,
            }))
          ) {
            return
          }

          // 3d. Announce mock data generation
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'text',
              content: ASSISTANT_MESSAGES.START_MOCK_DATA_APPID,
            }))
          ) {
            return
          }

          // 3e. Generate mock data using the already-fetched metadata
          if (!(await ensureSession())) return
          const mockDataResponse = await fetch(
            `${request.nextUrl.origin}/api/generate/mock-data`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: effectiveMode,
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
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'mock-data',
              content: JSON.stringify(mockData, null, 2),
              data: mockData,
            }))
          ) {
            return
          }

          // 3g. Update session with mock data and app metadata
          if (
            !(await safeUpdateSession({
              mockData,
              appMetadata,
              appId: input,
            }))
          ) {
            return
          }
        } else {
          // description mode: just generate mock data

          // 3a. Announce mock data generation
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'text',
              content: ASSISTANT_MESSAGES.START_MOCK_DATA_DESCRIPTION,
            }))
          ) {
            return
          }

          // 3b. Generate mock data
          if (!(await ensureSession())) return
          const mockDataResponse = await fetch(
            `${request.nextUrl.origin}/api/generate/mock-data`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                mode: effectiveMode,
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
          if (
            !(await createAndSend({
              sessionId: session.id,
              role: 'assistant',
              messageType: 'mock-data',
              content: JSON.stringify(mockData, null, 2),
              data: mockData,
            }))
          ) {
            return
          }

          // 3d. Update session with mock data
          if (!(await safeUpdateSession({ mockData }))) {
            return
          }
        }

        const widgetPrompt = buildWidgetPrompt(
          mockData,
          uiStylePreset.promptAddition
        )
        const widgetPromptPayload = JSON.stringify(
          [{ role: 'user', content: widgetPrompt }],
          null,
          2
        )

        // 7. Assistant starts widget generation
        if (
          !(await createAndSend({
            sessionId: session.id,
            role: 'assistant',
            messageType: 'text',
            content: ASSISTANT_MESSAGES.START_WIDGET(uiStylePreset.displayName),
          }))
        ) {
          return
        }

        // 8. Generate widget code
        if (!(await ensureSession())) return
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
        if (
          !(await createAndSend({
            sessionId: session.id,
            role: 'assistant',
            messageType: 'widget-code',
            content: widgetCode,
            data: { code: widgetCode, prompt: widgetPromptPayload },
          }))
        ) {
          return
        }

        // 10. Update session with widget code and complete status
        if (
          !(await safeUpdateSession({
            widgetCode,
            status: 'completed',
          }))
        ) {
          return
        }

        await closeWriter()
      } catch (error) {
        // Save error to database
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'

        if (isSessionMissingError(error)) {
          await closeWriter()
          return
        }

        if (
          !(await safeUpdateSession({
            status: 'failed',
            error: errorMessage,
          }))
        ) {
          return
        }

        let errorContent = ASSISTANT_MESSAGES.ERROR_GENERIC
        if (errorMessage.includes('App not found')) {
          errorContent = ASSISTANT_MESSAGES.ERROR_INVALID_APP_ID
        } else if (errorMessage.includes('LLM') || errorMessage.includes('API')) {
          errorContent = ASSISTANT_MESSAGES.ERROR_LLM_FAILED
        } else if (errorMessage.includes('Mock data generation failed')) {
          errorContent = ASSISTANT_MESSAGES.ERROR_APP_METADATA_FETCH
        }

        const errorChatMessage = await safeCreateMessage({
          sessionId: session.id,
          role: 'assistant',
          messageType: 'error',
          content: errorContent,
        })
        if (errorChatMessage) {
          await sendMessage(errorChatMessage)
        }
        await closeWriter()
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
