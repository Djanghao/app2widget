import { NextRequest, NextResponse } from 'next/server'
import { buildWidgetPrompt } from '@/lib/llm/prompt-builder'
import { callLLM } from '@/lib/llm/client'
import { LLMConfig } from '@/types/chat'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mockData, uiStylePrompt, apiKey, llmConfig } = body

    if (!mockData || !uiStylePrompt || !apiKey || !llmConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: mockData, uiStylePrompt, apiKey, llmConfig' },
        { status: 400 }
      )
    }

    // Build prompt
    const prompt = buildWidgetPrompt(mockData, uiStylePrompt)

    // Call LLM
    const config: LLMConfig = {
      baseUrl: llmConfig.baseUrl,
      modelName: llmConfig.modelName,
    }

    const response = await callLLM(config, apiKey, {
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 4000,
    })

    // Extract code from markdown code blocks
    let widgetCode = response
    const codeMatch = response.match(/```(?:typescript|tsx|ts)?\n([\s\S]*?)\n```/)
    if (codeMatch) {
      widgetCode = codeMatch[1]
    }

    // Validate widget code contains required imports and export
    if (!widgetCode.includes('export default')) {
      return NextResponse.json(
        { error: 'Invalid widget code. Missing "export default" statement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ code: widgetCode })
  } catch (error) {
    console.error('Error in /api/generate/widget:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
