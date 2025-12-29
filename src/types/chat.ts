export type ChatMode = 'appId' | 'description'

export type UIStyle = 'modern-minimal' | 'enterprise-dashboard' | 'vibrant-product'

export type Provider = 'doubao' | 'qwen' | 'openai' | 'custom'

export interface ChatRequest {
  mode: ChatMode
  input: string
  uiStyle: UIStyle
  apiKey: string
  llmConfig: LLMConfig
}

export interface LLMConfig {
  baseUrl: string
  modelName: string
}

export interface ChatSession {
  id: string
  createdAt: Date
  mode: ChatMode
  inputContent: string
  uiStyle: UIStyle
  appId?: string
  appMetadata?: any
  mockData?: any
  widgetCode?: string
  status: string
  error?: string
}

export interface ChatMessage {
  id: string
  createdAt: Date
  sessionId: string
  role: 'user' | 'assistant'
  messageType: 'input' | 'text' | 'mock-data' | 'app-metadata' | 'widget-code' | 'error'
  content: string
  data?: any
}

export interface AppMetadata {
  id: string
  title: string
  description: string
  osSystem: string[]
  category: string[]
  geometricDomain: string[]
  price: number
  currency: string
  lang: string
  wordCount: number
}
