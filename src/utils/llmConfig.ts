import { LLMConfig, Provider } from '@/types/chat'

export const PROVIDER_CONFIGS = {
  doubao: {
    name: 'Doubao',
    baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    models: ['doubao-seed-1-8-251215', 'doubao-seed-1-6-251015'],
  },
  qwen: {
    name: 'Qwen',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    models: ['qwen3-max', 'qwen3-coder-plus'],
  },
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    models: ['GPT-5.2', 'GPT-5.2 pro', 'GPT-5 mini'],
  },
  custom: {
    name: 'Custom',
    baseUrl: '',
    models: [],
  },
}

export const STORAGE_KEYS = {
  API_KEY: 'llm_api_key',
  PROVIDER: 'llm_provider',
  BASE_URL: 'llm_base_url',
  MODEL_NAME: 'llm_model_name',
}

export function getProviderFromModel(modelName: string): Provider {
  const lower = modelName.toLowerCase()
  if (lower.includes('doubao')) return 'doubao'
  if (lower.includes('qwen')) return 'qwen'
  if (lower.includes('gpt')) return 'openai'
  return 'custom'
}

export function loadLLMConfigFromStorage(): {
  apiKey: string
  provider: Provider
  llmConfig: LLMConfig
} {
  if (typeof window === 'undefined') {
    return {
      apiKey: '',
      provider: 'qwen',
      llmConfig: { baseUrl: PROVIDER_CONFIGS.qwen.baseUrl, modelName: PROVIDER_CONFIGS.qwen.models[0] }
    }
  }

  const provider = (localStorage.getItem(STORAGE_KEYS.PROVIDER) as Provider) || 'qwen'
  const apiKey = localStorage.getItem(STORAGE_KEYS.API_KEY) || ''
  const baseUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL) || PROVIDER_CONFIGS[provider].baseUrl
  const modelName = localStorage.getItem(STORAGE_KEYS.MODEL_NAME) || PROVIDER_CONFIGS[provider].models[0] || ''

  return { apiKey, provider, llmConfig: { baseUrl, modelName } }
}

export function saveLLMConfigToStorage(
  apiKey: string,
  provider: Provider,
  llmConfig: LLMConfig
) {
  if (typeof window === 'undefined') return

  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey)
  localStorage.setItem(STORAGE_KEYS.PROVIDER, provider)
  localStorage.setItem(STORAGE_KEYS.BASE_URL, llmConfig.baseUrl)
  localStorage.setItem(STORAGE_KEYS.MODEL_NAME, llmConfig.modelName)
}
