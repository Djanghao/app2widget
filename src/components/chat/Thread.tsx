'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Box, Typography, CircularProgress } from '@mui/material'
import { CustomMessage } from './CustomMessage'
import { CustomComposer } from './CustomComposer'
import { ChatHeader } from './ChatHeader'
import { useChatContext } from './ChatProvider'
import { Provider } from '@/types/chat'
import Image from 'next/image'

interface ThreadProps {
  onToggleSidebar: () => void
  onSettingsClick: () => void
}

export function Thread({ onToggleSidebar, onSettingsClick }: ThreadProps) {
  const { messages, isLoading, provider } = useChatContext()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const iconMap: Record<Provider, string> = {
    openai: '/icons/openai.svg',
    doubao: '/icons/doubao.svg',
    qwen: '/icons/qwen.svg',
    custom: '/icons/openai.svg', // Fallback to openai icon for custom provider
  }

  // Find mock data for widget code messages
  const getMockDataForMessage = (index: number) => {
    // Look backwards for the most recent mock-data message
    for (let i = index - 1; i >= 0; i--) {
      if (messages[i].messageType === 'mock-data' && messages[i].data) {
        return messages[i].data
      }
    }
    return undefined
  }

  // Only mount one live Sandpack runtime at a time.
  const latestWidgetMessageId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].messageType === 'widget-code') {
        return messages[i].id as string
      }
    }
    return null
  }, [messages])
  const [activeLivePreviewMessageId, setActiveLivePreviewMessageId] = useState<string | null>(null)

  // Default active preview to the latest widget whenever messages change.
  useEffect(() => {
    setActiveLivePreviewMessageId(latestWidgetMessageId)
  }, [latestWidgetMessageId])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#212121',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <ChatHeader onToggleSidebar={onToggleSidebar} onSettingsClick={onSettingsClick} />

      {/* Messages viewport - scrollable */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          p: 0,
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'transparent',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#565869',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: '#6e6e80',
          },
        }}
      >
        {isLoading && messages.length === 0 ? (
          // Loading state - show spinner
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100%',
            }}
          >
            <CircularProgress
              size={40}
              sx={{
                color: '#10a37f',
              }}
            />
          </Box>
        ) : messages.length === 0 ? (
          // Empty state - show welcome message
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100%',
              color: '#ececec',
              px: 4,
            }}
          >
            <Box sx={{ textAlign: 'center', maxWidth: 600 }}>
              <Typography
                variant="h4"
                gutterBottom
                sx={{
                  fontWeight: 600,
                  color: '#ececec',
                  fontSize: 24,
                  mb: 1.5
                }}
              >
                Generate Mobile Widgets with LLMs
              </Typography>
              <Typography variant="body1" sx={{ color: '#c5c5d2', fontSize: 14 }}>
                Enter an App ID or describe an application below to generate a custom
                mobile widget with mock data and live preview.
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {messages.map((message, index) => (
              <CustomMessage
                key={message.id}
                message={message}
                mockData={getMockDataForMessage(index)}
                enableLivePreview={message.id === activeLivePreviewMessageId}
                onRequestLivePreview={(messageId) => setActiveLivePreviewMessageId(messageId)}
              />
            ))}
            {isLoading && messages.length > 0 && (
              <Box sx={{ bgcolor: '#2f2f2f', py: 2.5, px: 4 }}>
                <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
                  <Box
                    sx={{
                      width: 26,
                      height: 26,
                      borderRadius: '3px',
                      bgcolor: '#10a37f',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 12,
                      fontWeight: 600,
                      flexShrink: 0,
                      overflow: 'hidden',
                      padding: '4px',
                    }}
                  >
                    <Image
                      src={iconMap[provider]}
                      alt={provider}
                      width={18}
                      height={18}
                      style={{ filter: 'brightness(0) invert(1)' }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        display: 'flex',
                        gap: 0.5,
                        '& > div': {
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: '#8e8ea0',
                          animation: 'pulse 1.4s ease-in-out infinite',
                          '&:nth-of-type(1)': {
                            animationDelay: '0s',
                          },
                          '&:nth-of-type(2)': {
                            animationDelay: '0.2s',
                          },
                          '&:nth-of-type(3)': {
                            animationDelay: '0.4s',
                          },
                        },
                        '@keyframes pulse': {
                          '0%, 80%, 100%': {
                            opacity: 0.4,
                            transform: 'scale(0.8)',
                          },
                          '40%': {
                            opacity: 1,
                            transform: 'scale(1)',
                          },
                        },
                      }}
                    >
                      <div />
                      <div />
                      <div />
                    </Box>
                  </Box>
                </Box>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </Box>

      {/* Composer fixed at the bottom */}
      <Box
        sx={{
          borderTop: '1px solid #3e3e3e',
          bgcolor: '#212121',
          flexShrink: 0,
        }}
      >
        <CustomComposer />
      </Box>
    </Box>
  )
}
