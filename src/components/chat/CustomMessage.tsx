'use client'

import { Box, Typography } from '@mui/material'
import { MockDataResponse } from '@/types/widget'
import { WidgetPreview } from '../widget/WidgetPreview'
import { MockDataPreview } from '../widget/MockDataPreview'
import { AppMetadataPreview } from '../widget/AppMetadataPreview'
import { ChatMessage, Provider } from '@/types/chat'
import { useChatContext } from './ChatProvider'
import Image from 'next/image'

// AI Icon component based on provider
function AIIcon({ provider }: { provider: Provider }) {
  const iconMap: Record<Provider, string> = {
    openai: '/icons/openai.svg',
    doubao: '/icons/doubao.svg',
    qwen: '/icons/qwen.svg',
    custom: '/icons/openai.svg', // Fallback to openai icon for custom provider
  }

  return (
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
  )
}

interface CustomMessageProps {
  message: ChatMessage
  mockData?: MockDataResponse
}

export function CustomMessage({ message, mockData }: CustomMessageProps) {
  const { provider } = useChatContext()

  if (message.role === 'user') {
    return <UserMessage content={message.content} />
  }

  if (message.messageType === 'text') {
    return <TextMessage content={message.content} provider={provider} />
  }

  if (message.messageType === 'app-metadata' && message.data) {
    return <AppMetadataMessage appMetadata={message.data} provider={provider} />
  }

  if (message.messageType === 'mock-data' && message.data) {
    return <MockDataMessage mockData={message.data as MockDataResponse} provider={provider} />
  }

  if (message.messageType === 'widget-code' && message.data) {
    return (
      <WidgetCodeMessage
        code={message.data.code}
        prompt={message.data.prompt}
        mockData={mockData}
        provider={provider}
      />
    )
  }

  if (message.messageType === 'error') {
    return <ErrorMessage content={message.content} provider={provider} />
  }

  return <TextMessage content={message.content} provider={provider} />
}

function UserMessage({ content }: { content: string }) {
  return (
    <Box sx={{ bgcolor: '#212121', py: { xs: 2, md: 2.5 }, px: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
        <Box
          sx={{
            width: 26,
            height: 26,
            borderRadius: '3px',
            bgcolor: '#5436DA',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            flexShrink: 0
          }}
        >
          U
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: '#ececec', fontSize: 13, lineHeight: 1.7 }}>
            {content}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function TextMessage({ content, provider }: { content: string; provider: Provider }) {
  return (
    <Box sx={{ bgcolor: '#2f2f2f', py: { xs: 2, md: 2.5 }, px: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
        <AIIcon provider={provider} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: '#ececec', fontSize: 13, lineHeight: 1.7 }}>
            {content}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function ErrorMessage({ content, provider }: { content: string; provider: Provider }) {
  return (
    <Box sx={{ bgcolor: '#2f2f2f', py: { xs: 2, md: 2.5 }, px: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
        <AIIcon provider={provider} />
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ color: '#ef4444', fontSize: 13, lineHeight: 1.7 }}>
            {content}
          </Typography>
        </Box>
      </Box>
    </Box>
  )
}

function AppMetadataMessage({ appMetadata, provider }: { appMetadata: any; provider: Provider }) {
  return (
    <Box sx={{ bgcolor: '#2f2f2f', py: { xs: 2, md: 2.5 }, px: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
        <AIIcon provider={provider} />
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
          <Typography sx={{ color: '#ececec', fontSize: 14, mb: 1.5, fontWeight: 500 }}>
            Here's the app information I found:
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ color: '#c5c5d2', fontSize: 12, mb: 0.5 }}>
              <strong>App:</strong> {appMetadata.title}
            </Typography>
            <Typography sx={{ color: '#c5c5d2', fontSize: 12, mb: 0.5 }}>
              <strong>ID:</strong> {appMetadata.id}
            </Typography>
            <Typography sx={{ color: '#c5c5d2', fontSize: 12, mb: 0.5 }}>
              <strong>Category:</strong> {appMetadata.category?.join(', ') || 'N/A'}
            </Typography>
            <Typography sx={{ color: '#c5c5d2', fontSize: 12 }}>
              <strong>Platform:</strong> {appMetadata.osSystem?.join(', ') || 'N/A'}
            </Typography>
          </Box>
          <AppMetadataPreview appMetadata={appMetadata} />
        </Box>
      </Box>
    </Box>
  )
}

function MockDataMessage({ mockData, provider }: { mockData: MockDataResponse; provider: Provider }) {
  return (
    <Box sx={{ bgcolor: '#2f2f2f', py: { xs: 2, md: 2.5 }, px: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
        <AIIcon provider={provider} />
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
          <Typography sx={{ color: '#ececec', fontSize: 14, mb: 1.5, fontWeight: 500 }}>
            I've generated this mock data for your widget:
          </Typography>
          <Box sx={{ mb: 1.5 }}>
            <Typography sx={{ color: '#c5c5d2', fontSize: 12, mb: 0.5 }}>
              <strong>App:</strong> {mockData.widget.app}
            </Typography>
            <Typography sx={{ color: '#c5c5d2', fontSize: 12, mb: 0.5 }}>
              <strong>Layout:</strong> {mockData.meta.layout}
            </Typography>
            {mockData.meta.chartTypes && mockData.meta.chartTypes.length > 0 && (
              <Typography sx={{ color: '#c5c5d2', fontSize: 12 }}>
                <strong>Chart Types:</strong> {mockData.meta.chartTypes.join(', ')}
              </Typography>
            )}
          </Box>
          <MockDataPreview mockData={mockData} />
        </Box>
      </Box>
    </Box>
  )
}

function WidgetCodeMessage({
  code,
  prompt,
  mockData,
  provider,
}: {
  code: string
  prompt?: string
  mockData?: MockDataResponse
  provider: Provider
}) {
  return (
    <Box sx={{ bgcolor: '#2f2f2f', py: { xs: 2, md: 2.5 }, px: { xs: 3, md: 4 } }}>
      <Box sx={{ maxWidth: '90%', width: '90%', mx: 'auto', display: 'flex', gap: 2 }}>
        <AIIcon provider={provider} />
        <Box sx={{ flex: 1, minWidth: 0, maxWidth: '100%' }}>
          <Typography sx={{ color: '#ececec', fontSize: 14, mb: 1.5, fontWeight: 500 }}>
            Here's your widget:
          </Typography>
          <WidgetPreview code={code} mockData={mockData} prompt={prompt} />
        </Box>
      </Box>
    </Box>
  )
}
