import { NextRequest, NextResponse } from 'next/server'
import { buildA2UIWidgetPrompt, buildA2UIRefineMessages } from '@/lib/llm/prompt-builder'
import { callLLM } from '@/lib/llm/client'
import { LLMConfig } from '@/types/chat'
import { validateA2UISchema } from '@/lib/a2ui/types'

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
          const refineMessages = buildA2UIRefineMessages(previousCode, refinePrompt)
          return [
            { role: 'system', content: refineMessages.system },
            { role: 'user', content: refineMessages.user },
          ]
        })()
      : [
          {
            role: 'user',
            content: buildA2UIWidgetPrompt(mockData, uiStylePrompt),
          },
        ]

    const response = await callLLM(config, apiKey, {
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    })

    // Extract JSON from markdown fences if present
    let jsonText = response.trim()
    const jsonMatch = jsonText.match(/```(?:json)?\n([\s\S]*?)\n```/)
    if (jsonMatch) {
      jsonText = jsonMatch[1].trim()
    }

    // Parse and validate the A2UI schema
    let schema: any
    try {
      schema = JSON.parse(jsonText)
    } catch {
      return NextResponse.json(
        { error: 'LLM output is not valid JSON' },
        { status: 500 }
      )
    }

    const validation = validateA2UISchema(schema)
    if (!validation.valid) {
      return NextResponse.json(
        { error: `Invalid A2UI schema: ${validation.error}` },
        { status: 500 }
      )
    }

    return NextResponse.json({ schema: validation.schema })
  } catch (error) {
    console.error('Error in /api/generate/widget:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
