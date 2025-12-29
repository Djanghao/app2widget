'use client'

import { useState, useCallback, useEffect } from 'react'
import { Box } from '@mui/material'
import { ChatProvider, useChatContext } from './chat/ChatProvider'
import { Thread } from './chat/Thread'
import { Settings } from './settings/Settings'
import Sidebar from './sidebar/Sidebar'
import { LLMConfig } from '@/types/chat'
import { loadLLMConfigFromStorage } from '@/utils/llmConfig'

function ChatInterface({ onSettingsClick }: { onSettingsClick: () => void }) {
  const { currentSessionId, loadSession, createNewSession } = useChatContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#212121' }}>
      <Sidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        currentSessionId={currentSessionId}
        onSessionSelect={loadSession}
        onNewChat={createNewSession}
        onSettingsClick={onSettingsClick}
      />
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <Thread
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSettingsClick={onSettingsClick}
        />
      </Box>
    </Box>
  )
}

export function App() {
  const [apiKey, setApiKey] = useState('')
  const [llmConfig, setLLMConfig] = useState<LLMConfig>({
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    modelName: 'qwen3-max',
  })
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Load saved config from localStorage on mount
  useEffect(() => {
    const saved = loadLLMConfigFromStorage()
    if (saved) {
      setApiKey(saved.apiKey)
      setLLMConfig(saved.llmConfig)
    }
  }, [])

  const handleConfigChange = useCallback((newApiKey: string, newConfig: LLMConfig) => {
    setApiKey(newApiKey)
    setLLMConfig(newConfig)
  }, [])

  return (
    <>
      <ChatProvider apiKey={apiKey} llmConfig={llmConfig} setLLMConfig={setLLMConfig}>
        <ChatInterface onSettingsClick={() => setSettingsOpen(true)} />
      </ChatProvider>
      <Settings
        onConfigChange={handleConfigChange}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </>
  )
}
