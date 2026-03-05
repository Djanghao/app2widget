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
  // Normalize base URL: ensure it ends with /v1
  let baseUrl = config.baseUrl.replace(/\/+$/, '')
  if (!baseUrl.endsWith('/v1')) {
    baseUrl = baseUrl + '/v1'
  }

  // Debug logging
  console.log('LLM Config:', {
    baseUrl,
    modelName: config.modelName,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
  })

  const client = new OpenAI({
    apiKey: apiKey,
    baseURL: baseUrl,
  })

  try {
    const isOpenAI = config.baseUrl.includes('api.openai.com')
    const maxTokens = request.max_tokens ?? 4000

    const completion = await client.chat.completions.create({
      model: config.modelName,
      messages: request.messages as any,
      temperature: request.temperature ?? 0.7,
      ...(isOpenAI
        ? { max_completion_tokens: maxTokens }
        : { max_tokens: maxTokens }),
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
