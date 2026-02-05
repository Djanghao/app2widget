import { NextRequest, NextResponse } from 'next/server'
import { buildWidgetPrompt, buildWidgetRefineMessages } from '@/lib/llm/prompt-builder'
import { callLLM } from '@/lib/llm/client'
import { LLMConfig } from '@/types/chat'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mockData, uiStylePrompt, apiKey, llmConfig, previousCode, refinePrompt } = body

    if (!apiKey || !llmConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey, llmConfig' },
        { status: 400 }
      )
    }

    const isRefine = Boolean(previousCode && refinePrompt)
    if (!isRefine && (!mockData || !uiStylePrompt)) {
      return NextResponse.json(
        { error: 'Missing required fields: mockData, uiStylePrompt' },
        { status: 400 }
      )
    }

    // Call LLM
    const config: LLMConfig = {
      baseUrl: llmConfig.baseUrl,
      modelName: llmConfig.modelName,
    }

    const messages = isRefine
      ? (() => {
          const refineMessages = buildWidgetRefineMessages(previousCode, refinePrompt)
          return [
            { role: 'system', content: refineMessages.system },
            { role: 'user', content: refineMessages.user },
          ]
        })()
      : [
          {
            role: 'user',
            content: buildWidgetPrompt(mockData, uiStylePrompt),
          },
        ]

    const response = await callLLM(config, apiKey, {
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    })

    // Extract JSON from optional markdown fences (the model should output raw JSON)
    let widgetCode = response
    const codeMatch = response.match(/```(?:json)?\n([\s\S]*?)\n```/)
    if (codeMatch) {
      widgetCode = codeMatch[1]
    }

    // Parse and validate A2UI message array shape
    let a2uiPayload: unknown
    try {
      a2uiPayload = JSON.parse(widgetCode)
    } catch {
      return NextResponse.json(
        { error: 'Invalid A2UI JSON. Could not parse model output.' },
        { status: 500 }
      )
    }

    if (!Array.isArray(a2uiPayload) || a2uiPayload.length < 2) {
      return NextResponse.json(
        { error: 'Invalid A2UI payload. Expected an array with surfaceUpdate and beginRendering.' },
        { status: 500 }
      )
    }

    const hasSurfaceUpdate = a2uiPayload.some(
      (item) => typeof item === 'object' && item !== null && 'surfaceUpdate' in item
    )
    const hasBeginRendering = a2uiPayload.some(
      (item) => typeof item === 'object' && item !== null && 'beginRendering' in item
    )

    if (!hasSurfaceUpdate || !hasBeginRendering) {
      return NextResponse.json(
        { error: 'Invalid A2UI payload. Missing surfaceUpdate or beginRendering message.' },
        { status: 500 }
      )
    }

    // Validate surfaceUpdate components basic shape (adjacency list with id + component).
    const surfaceUpdate = a2uiPayload.find(
      (item) => typeof item === 'object' && item !== null && 'surfaceUpdate' in item
    ) as { surfaceUpdate?: { components?: Array<{ id?: string; component?: unknown }> } } | undefined

    const components = surfaceUpdate?.surfaceUpdate?.components
    if (!Array.isArray(components) || components.length === 0) {
      return NextResponse.json(
        { error: 'Invalid A2UI payload. surfaceUpdate.components must be a non-empty array.' },
        { status: 500 }
      )
    }

    const hasInvalidComponent = components.some(
      (entry) => !entry || typeof entry.id !== 'string' || !entry.component
    )
    if (hasInvalidComponent) {
      return NextResponse.json(
        { error: 'Invalid A2UI payload. Each component must include id and component.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ code: a2uiPayload })
  } catch (error) {
    console.error('Error in /api/generate/widget:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
