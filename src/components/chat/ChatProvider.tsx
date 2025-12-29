'use client'

import { createContext, useContext, useState } from 'react'
import { ChatMode, UIStyle, LLMConfig, Provider } from '@/types/chat'
import { getProviderFromModel } from '@/utils/llmConfig'

interface ChatProviderProps {
  children: React.ReactNode
  apiKey: string
  llmConfig: LLMConfig
  setLLMConfig: (config: LLMConfig) => void
}

interface ChatContextType {
  mode: ChatMode
  setMode: (mode: ChatMode) => void
  uiStyle: UIStyle
  setUIStyle: (style: UIStyle) => void
  apiKey: string
  llmConfig: LLMConfig
  setLLMConfig: (config: LLMConfig) => void
  provider: Provider
  setProvider: (provider: Provider) => void
  messages: any[]
  setMessages: React.Dispatch<React.SetStateAction<any[]>>
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  currentSessionId: string | null
  setCurrentSessionId: (id: string | null) => void
  loadSession: (sessionId: string) => Promise<void>
  createNewSession: () => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function ChatProvider({ children, apiKey, llmConfig, setLLMConfig }: ChatProviderProps) {
  const [currentMode, setCurrentMode] = useState<ChatMode>('description')
  const [currentUIStyle, setCurrentUIStyle] = useState<UIStyle>('ios-stock-widget')
  const [messages, setMessages] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [currentProvider, setCurrentProvider] = useState<Provider>(
    getProviderFromModel(llmConfig.modelName)
  )

  const loadSession = async (sessionId: string) => {
    try {
      // Clear messages first and show loading state
      setMessages([])
      setIsLoading(true)

      const response = await fetch(`/api/sessions/${sessionId}`)
      const data = await response.json()

      if (data.session) {
        setCurrentSessionId(sessionId)
        setCurrentMode(data.session.mode as ChatMode)
        setCurrentUIStyle(data.session.uiStyle as UIStyle)

        // Convert database messages to chat UI format
        const formattedMessages = data.session.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          messageType: msg.messageType,
          data: msg.data,
          createdAt: msg.createdAt
        }))

        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error('Failed to load session:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const createNewSession = () => {
    setCurrentSessionId(null)
    setMessages([])
    setCurrentMode('description')
    setCurrentUIStyle('modern-minimal')
  }

  return (
    <ChatContext.Provider
      value={{
        mode: currentMode,
        setMode: setCurrentMode,
        uiStyle: currentUIStyle,
        setUIStyle: setCurrentUIStyle,
        apiKey,
        llmConfig,
        setLLMConfig,
        provider: currentProvider,
        setProvider: setCurrentProvider,
        messages,
        setMessages,
        isLoading,
        setIsLoading,
        currentSessionId,
        setCurrentSessionId,
        loadSession,
        createNewSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  )
}

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within ChatProvider')
  }
  return context
}
