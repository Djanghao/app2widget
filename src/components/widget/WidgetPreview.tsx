'use client'

import { useMemo, useState } from 'react'
import { Box, Button } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { A2UIRenderer } from './A2UIRenderer'

interface WidgetPreviewProps {
  code: unknown
  mockData?: any
  prompt?: string
}

export function WidgetPreview({ code, mockData, prompt }: WidgetPreviewProps) {
  const [copied, setCopied] = useState(false)

  const { messages, rawText, parseError } = useMemo(() => {
    // Normalize code into an A2UI message array for rendering and a raw JSON string for display.
    if (Array.isArray(code)) {
      return {
        messages: code,
        rawText: JSON.stringify(code, null, 2),
        parseError: null as string | null,
      }
    }

    if (typeof code === 'string') {
      try {
        const parsed = JSON.parse(code)
        return {
          messages: Array.isArray(parsed) ? parsed : [],
          rawText: code,
          parseError: Array.isArray(parsed) ? null : 'Parsed JSON is not an array.',
        }
      } catch {
        return {
          messages: [],
          rawText: code,
          parseError: 'Unable to parse A2UI JSON.',
        }
      }
    }

    return {
      messages: [],
      rawText: JSON.stringify(code ?? null, null, 2),
      parseError: 'Unsupported A2UI payload type.',
    }
  }, [code])

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
        {/* JSON Side: raw A2UI output for inspection and debugging */}
        <Box
          sx={{
            flex: { xs: '1 1 100%', lg: '1 1 50%' },
            minWidth: 0,
            maxWidth: '100%',
            height: { xs: 350, lg: 400 },
            maxHeight: 400,
            borderRight: { xs: 'none', lg: '1px solid #4d4d4d' },
            borderBottom: { xs: '1px solid #4d4d4d', lg: 'none' },
            bgcolor: '#1e1e1e',
          }}
        >
          <Box
            sx={{
              px: 2,
              py: 1,
              bgcolor: '#2d2d2d',
              borderBottom: '1px solid #4d4d4d',
              fontSize: 12,
              fontWeight: 600,
              color: '#9ca3af',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}
          >
            <Box component="span">A2UI JSON</Box>
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
                color: copied ? '#059669' : '#9ca3af',
                '&.Mui-disabled': {
                  color: '#6b7280',
                },
              }}
            >
              {copied ? 'Copied' : 'Copy prompt'}
            </Button>
          </Box>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              height: { xs: 300, lg: 350 },
              overflow: 'auto',
              fontSize: 12,
              color: '#d4d4d4',
              fontFamily: '"Fira Code", "Fira Mono", Consolas, Monaco, monospace',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {rawText}
          </Box>
        </Box>

        {/* Preview Side: A2UI rendering (uses mockData for JSON Pointer resolution) */}
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
            }}
          >
            Preview
          </Box>
          <Box
            sx={{
              flex: { xs: '0 0 auto', lg: 1 },
              overflow: 'auto',
              minHeight: { xs: 350, lg: 0 },
              maxHeight: { xs: 400, lg: 'none' },
              position: 'relative',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              p: 2,
            }}
          >
            {parseError ? (
              <Box sx={{ color: '#ef4444', fontSize: 12 }}>{parseError}</Box>
            ) : (
              <A2UIRenderer messages={messages} dataModel={mockData} />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
