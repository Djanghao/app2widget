'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { Box } from '@mui/material'
import { ChatProvider, useChatContext } from './chat/ChatProvider'
import { Thread } from './chat/Thread'
import { Settings } from './settings/Settings'
import Sidebar from './sidebar/Sidebar'
import { PreviewPanel } from './widget/PreviewPanel'
import { LLMConfig } from '@/types/chat'
import { loadLLMConfigFromStorage } from '@/utils/llmConfig'

function DragHandle({ onDrag }: { onDrag: (deltaX: number) => void }) {
  const dragging = useRef(false)
  const lastX = useRef(0)

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragging.current) return
      e.preventDefault()
      onDrag(e.clientX - lastX.current)
      lastX.current = e.clientX
    }
    const onMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      document.body.style.pointerEvents = ''
      // Re-enable pointer events on all iframes
      document.querySelectorAll('iframe').forEach((f) => {
        ;(f as HTMLElement).style.pointerEvents = ''
      })
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [onDrag])

  return (
    <Box
      onMouseDown={(e) => {
        e.preventDefault()
        dragging.current = true
        lastX.current = e.clientX
        document.body.style.cursor = 'col-resize'
        document.body.style.userSelect = 'none'
        // Disable pointer events on iframes so they don't swallow mouseup
        document.querySelectorAll('iframe').forEach((f) => {
          ;(f as HTMLElement).style.pointerEvents = 'none'
        })
      }}
      sx={{
        width: 4,
        cursor: 'col-resize',
        bgcolor: '#3e3e3e',
        flexShrink: 0,
        '&:hover': { bgcolor: '#10a37f' },
        transition: 'background-color 0.15s',
      }}
    />
  )
}

function ChatInterface({ onSettingsClick }: { onSettingsClick: () => void }) {
  const { currentSessionId, loadSession, createNewSession, activePreview } = useChatContext()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [splitRatio, setSplitRatio] = useState(0.5)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleDrag = useCallback((deltaX: number) => {
    if (!containerRef.current) return
    const containerWidth = containerRef.current.offsetWidth
    setSplitRatio((prev) => Math.min(0.7, Math.max(0.3, prev + deltaX / containerWidth)))
  }, [])

  return (
    <Box ref={containerRef} sx={{ display: 'flex', height: '100vh', bgcolor: '#212121' }}>
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
          flex: activePreview ? `0 0 ${splitRatio * 100}%` : 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        <Thread
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSettingsClick={onSettingsClick}
        />
      </Box>
      {activePreview && (
        <>
          <DragHandle onDrag={handleDrag} />
          <Box
            sx={{
              flex: `0 0 ${(1 - splitRatio) * 100}%`,
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <PreviewPanel />
          </Box>
        </>
      )}
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
