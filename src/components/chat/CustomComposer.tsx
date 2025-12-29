'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  SelectChangeEvent,
  CircularProgress,
  IconButton,
} from '@mui/material'
import SendIcon from '@mui/icons-material/Send'
import { useChatContext } from './ChatProvider'
import { ChatRequest } from '@/types/chat'

interface UIStylePreset {
  name: string
  displayName: string
  description: string
}

export function CustomComposer() {
  const {
    mode,
    setMode,
    uiStyle,
    setUIStyle,
    apiKey,
    llmConfig,
    messages,
    setMessages,
    isLoading,
    setIsLoading,
    setCurrentSessionId,
  } = useChatContext()

  const [input, setInput] = useState('')
  const [stylePresets, setStylePresets] = useState<UIStylePreset[]>([])
  const [isLoadingStyles, setIsLoadingStyles] = useState(true)

  // Fetch UI style presets on mount
  useEffect(() => {
    const fetchStylePresets = async () => {
      try {
        const response = await fetch('/api/ui-styles')
        if (response.ok) {
          const presets = await response.json()
          setStylePresets(presets)
        }
      } catch (error) {
        console.error('Failed to fetch style presets:', error)
      } finally {
        setIsLoadingStyles(false)
      }
    }

    fetchStylePresets()
  }, [])

  const handleModeChange = (event: SelectChangeEvent) => {
    setMode(event.target.value as 'appId' | 'description')
  }

  const handleStyleChange = (event: SelectChangeEvent) => {
    setUIStyle(event.target.value as any)
  }

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return

    const userInput = input.trim()
    setIsLoading(true)
    setInput('') // Clear input immediately

    // Display user message immediately
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      messageType: 'input',
      content: mode === 'appId' ? `App ID: ${userInput}` : userInput,
      createdAt: new Date().toISOString(),
      sessionId: '',
    }
    setMessages([tempUserMessage])

    const request: ChatRequest = {
      mode,
      input: userInput,
      uiStyle,
      apiKey,
      llmConfig,
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate widget')
      }

      // Read the SSE stream
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let sessionIdSet = false
      let firstMessage = true

      if (!reader) {
        throw new Error('No response body')
      }

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        // Keep the last incomplete line in the buffer
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const message = JSON.parse(line.slice(6))

              // Skip the first user message since we already displayed it
              if (firstMessage && message.role === 'user') {
                firstMessage = false
                // Update temp message with real message from server
                setMessages(prev => prev.map(msg =>
                  msg.id.startsWith('temp-') ? message : msg
                ))
              } else {
                setMessages(prev => [...prev, message])
              }

              // Set session ID from the first message
              if (!sessionIdSet && message.sessionId) {
                setCurrentSessionId(message.sessionId)
                sessionIdSet = true
              }
            } catch (e) {
              console.error('Failed to parse message:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat submission error:', error)
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          role: 'assistant',
          messageType: 'error',
          content: error instanceof Error ? error.message : 'An error occurred',
          createdAt: new Date(),
          sessionId: '',
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', px: 2, py: 1.5 }}>
      {/* Single row: Mode selector + Style selector + Input box */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        {/* Mode Selector */}
        <FormControl
          size="small"
          sx={{
            minWidth: 110,
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#40414f',
              color: '#ececec',
              fontSize: 13,
              '& fieldset': { borderColor: '#565869' },
              '&:hover fieldset': { borderColor: '#8e8ea0' },
              '&.Mui-focused fieldset': { borderColor: '#10a37f' }
            },
            '& .MuiInputLabel-root': { color: '#8e8ea0', fontSize: 13 },
            '& .MuiInputLabel-root.Mui-focused': { color: '#10a37f' }
          }}
          disabled={isLoading}
        >
          <InputLabel>Mode</InputLabel>
          <Select value={mode} label="Mode" onChange={handleModeChange}>
            <MenuItem value="description">Description</MenuItem>
            <MenuItem value="appId">App ID</MenuItem>
          </Select>
        </FormControl>

        {/* Style Selector */}
        <FormControl
          size="small"
          sx={{
            minWidth: 150,
            flexShrink: 0,
            '& .MuiOutlinedInput-root': {
              bgcolor: '#40414f',
              color: '#ececec',
              fontSize: 13,
              '& fieldset': { borderColor: '#565869' },
              '&:hover fieldset': { borderColor: '#8e8ea0' },
              '&.Mui-focused fieldset': { borderColor: '#10a37f' }
            },
            '& .MuiInputLabel-root': { color: '#8e8ea0', fontSize: 13 },
            '& .MuiInputLabel-root.Mui-focused': { color: '#10a37f' }
          }}
          disabled={isLoading || isLoadingStyles}
        >
          <InputLabel>Style</InputLabel>
          <Select
            value={uiStyle}
            label="Style"
            onChange={handleStyleChange}
            renderValue={(selected) => {
              const preset = stylePresets.find(p => p.name === selected)
              return preset?.displayName || selected
            }}
          >
            {stylePresets.map((preset) => (
              <MenuItem
                key={preset.name}
                value={preset.name}
                sx={{
                  fontSize: 13,
                  py: 1,
                  '&:hover': {
                    bgcolor: 'rgba(16, 163, 127, 0.1)',
                  }
                }}
              >
                <Box>
                  <Box sx={{ fontWeight: 500 }}>{preset.displayName}</Box>
                  <Box
                    sx={{
                      fontSize: 11,
                      color: '#8e8ea0',
                      mt: 0.3,
                      maxWidth: 280,
                      whiteSpace: 'normal',
                      lineHeight: 1.3,
                    }}
                  >
                    {preset.description}
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Input box with send button */}
        <Box sx={{ position: 'relative', flex: 1, minWidth: 0 }}>
          <TextField
            fullWidth
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder={
              mode === 'appId'
                ? 'Enter App ID from app store (e.g., com.example.app or 123456789)'
                : 'Describe your app (e.g., "A fitness tracking app with daily step goals")'
            }
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: '#2f2f2f',
                color: '#ececec',
                fontSize: 13,
                borderRadius: 2,
                boxShadow: '0 0 0 1px rgba(255,255,255,.1)',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                pr: '44px',
                height: 40,
                '& fieldset': {
                  borderColor: 'rgba(255,255,255,.1)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255,255,255,.2)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#10a37f',
                },
                '&.Mui-focused': {
                  boxShadow: '0 0 0 2px #10a37f',
                }
              },
              '& .MuiInputBase-input': {
                fontSize: 13,
                padding: '10px 14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#8e8ea0',
                opacity: 1,
                fontSize: 13,
              }
            }}
          />

          {/* Send Icon Button */}
          <IconButton
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            sx={{
              position: 'absolute',
              right: 6,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 28,
              height: 28,
              bgcolor: isLoading || !input.trim() ? '#40414f' : '#10a37f',
              color: 'white',
              '&:hover': {
                bgcolor: isLoading || !input.trim() ? '#40414f' : '#0d8c6d',
              },
              '&:disabled': {
                bgcolor: '#40414f',
                color: '#8e8ea0',
              }
            }}
          >
            {isLoading ? (
              <CircularProgress size={14} sx={{ color: '#8e8ea0' }} />
            ) : (
              <SendIcon sx={{ fontSize: 14 }} />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  )
}
