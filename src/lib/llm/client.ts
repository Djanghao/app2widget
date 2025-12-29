import OpenAI from 'openai'
import { LLMConfig } from '@/types/chat'

export interface LLMRequest {
  messages: Array<{ role: string; content: string }>
  temperature?: number
  max_tokens?: number
}

export async function callLLM(
  config: LLMConfig,
  apiKey: string,
  request: LLMRequest
): Promise<string> {
  // Debug logging
  console.log('LLM Config:', {
    baseUrl: config.baseUrl,
    modelName: config.modelName,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
  })

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: config.baseUrl,
  })

  try {
    const completion = await client.chat.completions.create({
      model: config.modelName,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4000,
    })

    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('No response from LLM')
    }

    const content = completion.choices[0].message.content
    if (!content) {
      throw new Error('Empty response from LLM')
    }

    return content
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      throw new Error(`LLM API error: ${error.status} - ${error.message}`)
    }
    throw error
  }
}
