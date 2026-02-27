'use client'

import { useState } from 'react'
import { Box, Button } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { A2UIRenderer } from '@/lib/a2ui/renderer'
import type { A2UIWidgetSchema } from '@/lib/a2ui/types'

interface WidgetPreviewProps {
  schema: A2UIWidgetSchema
  mockData?: any
  prompt?: string
}

export function WidgetPreview({ schema, mockData, prompt }: WidgetPreviewProps) {
  const [copied, setCopied] = useState(false)

  // Pass full mock data so path bindings like "data/location" work directly
  const data = mockData ?? {}

  const handleCopyPrompt = async () => {
    if (!prompt) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = prompt
        textarea.setAttribute('readonly', 'true')
        textarea.style.position = 'fixed'
        textarea.style.top = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const jsonString = JSON.stringify(schema, null, 2)

  return (
    <Box
      sx={{
        border: '1px solid #4d4d4d',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: '#1e1e1e',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          width: '100%',
          maxWidth: '100%',
        }}
      >
        {/* JSON Panel */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 50%' },
            minWidth: 0,
            maxWidth: '100%',
            height: { xs: 350, lg: 400 },
            maxHeight: 400,
            overflow: 'auto',
            borderRight: { xs: 'none', lg: '1px solid #4d4d4d' },
            borderBottom: { xs: '1px solid #4d4d4d', lg: 'none' },
          }}
        >
          <pre
            style={{
              margin: 0,
              padding: 16,
              fontSize: 12,
              lineHeight: 1.5,
              fontFamily: '"Fira Code", "Fira Mono", Consolas, Monaco, monospace',
              color: '#d4d4d4',
              whiteSpace: 'pre',
              overflowX: 'auto',
            }}
          >
            {jsonString}
          </pre>
        </Box>

        {/* Preview Panel */}
        <Box
          sx={{
            flex: { xs: '0 0 auto', lg: '1 1 50%' },
            minWidth: 0,
            maxWidth: '100%',
            height: { xs: 'auto', lg: 400 },
            maxHeight: 400,
            bgcolor: '#f9fafb',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: '#f3f4f6',
              borderBottom: '1px solid #e5e7eb',
              fontSize: 12,
              fontWeight: 600,
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box component="span">Preview</Box>
            <Button
              size="small"
              variant="text"
              onClick={handleCopyPrompt}
              disabled={!prompt}
              startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
              sx={{
                textTransform: 'none',
                fontSize: 11,
                minHeight: 0,
                padding: '2px 6px',
                color: copied ? '#059669' : '#6b7280',
                '&.Mui-disabled': {
                  color: '#9ca3af',
                },
              }}
            >
              {copied ? 'Copied' : 'Copy prompt'}
            </Button>
          </Box>
          <Box
            sx={{
              flex: { xs: '0 0 auto', lg: 1 },
              overflow: 'auto',
              minHeight: { xs: 350, lg: 0 },
              maxHeight: { xs: 400, lg: 'none' },
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              p: 2,
            }}
          >
            <A2UIRenderer schema={schema} data={data} />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
