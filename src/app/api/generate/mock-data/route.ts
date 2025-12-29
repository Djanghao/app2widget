import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { buildMockDataPrompt } from '@/lib/llm/prompt-builder'
import { callLLM } from '@/lib/llm/client'
import { LLMConfig } from '@/types/chat'
import { MockDataResponse } from '@/types/widget'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mode, input, apiKey, llmConfig } = body

    if (!mode || !input || !apiKey || !llmConfig) {
      return NextResponse.json(
        { error: 'Missing required fields: mode, input, apiKey, llmConfig' },
        { status: 400 }
      )
    }

    if (mode !== 'appId' && mode !== 'description') {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "appId" or "description"' },
        { status: 400 }
      )
    }

    // Load app metadata if mode is appId
    let appMetadata: Record<string, any> | undefined
    if (mode === 'appId') {
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
          // screenshots excluded
        },
      })

      if (!app) {
        return NextResponse.json(
          { error: `App not found: ${input}` },
          { status: 404 }
        )
      }

      appMetadata = app as any
    }

    // Build prompt
    const prompt = buildMockDataPrompt(mode, input, appMetadata)

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

    // Parse JSON from response
    let mockData: MockDataResponse
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/)
      const jsonStr = jsonMatch ? jsonMatch[1] : response
      mockData = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('Failed to parse LLM response:', response)
      return NextResponse.json(
        { error: 'Failed to parse LLM response as JSON' },
        { status: 500 }
      )
    }

    // Validate mock data structure
    if (!mockData.data || !mockData.meta) {
      return NextResponse.json(
        { error: 'Invalid mock data structure. Missing "data" or "meta" field' },
        { status: 500 }
      )
    }

    // Return mock data with app metadata if available
    return NextResponse.json({
      ...mockData,
      appMetadata: appMetadata || undefined
    })
  } catch (error) {
    console.error('Error in /api/generate/mock-data:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
