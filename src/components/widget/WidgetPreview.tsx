'use client'

import { useState } from 'react'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackCodeEditor,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { Box, Button } from '@mui/material'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'

interface WidgetPreviewProps {
  code: string
  mockData?: any // Not used anymore, kept for backward compatibility
  prompt?: string
}

function SandpackContent({ prompt }: { prompt?: string }) {
  const { sandpack } = useSandpack()
  const [copied, setCopied] = useState(false)

  // Get the active file from sandpack
  const activeFile = sandpack.activeFile

  // Determine if we should show preview (only for App.tsx)
  const showPreview = activeFile === '/App.tsx'

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
      <SandpackLayout>
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', lg: 'row' },
            width: '100%',
            maxWidth: '100%',
          }}
        >
          {/* Code Editor Side */}
          <Box
            sx={{
              flex: { xs: '1 1 100%', lg: showPreview ? '1 1 50%' : '1 1 100%' },
              minWidth: 0,
              maxWidth: '100%',
              height: { xs: 350, lg: 400 },
              maxHeight: 400,
              borderRight: { xs: 'none', lg: showPreview ? '1px solid #4d4d4d' : 'none' },
              borderBottom: { xs: showPreview ? '1px solid #4d4d4d' : 'none', lg: 'none' },
            }}
          >
            <SandpackCodeEditor
              showLineNumbers
              showTabs={false}
              closableTabs={false}
              style={{ height: '100%', maxWidth: '100%', fontSize: 12 }}
            />
          </Box>

          {/* Preview Side - Only show when App.tsx is active */}
          {showPreview && (
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
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  p: 2,
                  '& .sp-loading': {
                    background: '#f9fafb !important',
                  },
                  '& .sp-loading svg': {
                    display: 'none',
                  },
                  '& .sp-loading::after': {
                    content: '""',
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '40px',
                    height: '40px',
                    border: '3px solid rgba(16, 163, 127, 0.2)',
                    borderTop: '3px solid #10a37f',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  },
                  '@keyframes spin': {
                    '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
                    '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' },
                  },
                  '& iframe': {
                    border: 'none !important',
                  },
                }}
              >
                <SandpackPreview
                  showNavigator={false}
                  showRefreshButton={true}
                  style={{
                    height: '100%',
                    width: '100%',
                    border: 'none',
                  }}
                  showOpenInCodeSandbox={false}
                />
              </Box>
            </Box>
          )}
        </Box>
      </SandpackLayout>
    </Box>
  )
}

export function WidgetPreview({ code, mockData, prompt }: WidgetPreviewProps) {
  const files = {
    '/App.tsx': {
      code,
      active: true,
    },
    '/response.json': {
      code: JSON.stringify(mockData || { widget: null, data: null, meta: null }, null, 2),
      hidden: true,
    },
  }

  return (
    <SandpackProvider
      template="react-ts"
      files={files}
      options={{
        activeFile: '/App.tsx',
        recompileMode: 'delayed',
        recompileDelay: 300,
      }}
      customSetup={{
        dependencies: {
          '@mui/material': '^5.15.0',
          '@mui/x-charts': '^6.19.0',
          '@mui/icons-material': '^5.15.0',
          '@emotion/react': '^11.11.0',
          '@emotion/styled': '^11.11.0',
        },
      }}
      theme={{
        colors: {
          surface1: '#1e1e1e',
          surface2: '#2d2d2d',
          surface3: '#3d3d3d',
          clickable: '#999',
          base: '#e0e0e0',
          disabled: '#4d4d4d',
          hover: '#4d4d4d',
          accent: '#10a37f',
        },
        syntax: {
          plain: '#d4d4d4',
          comment: { color: '#6a9955' },
          keyword: { color: '#569cd6' },
          tag: { color: '#4ec9b0' },
          punctuation: { color: '#d4d4d4' },
          definition: { color: '#dcdcaa' },
          property: { color: '#9cdcfe' },
          static: { color: '#4fc1ff' },
          string: { color: '#ce9178' },
        },
        font: {
          body: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          mono: '"Fira Code", "Fira Mono", Consolas, Monaco, monospace',
          size: '12px',
          lineHeight: '1.5',
        },
      }}
    >
      <SandpackContent prompt={prompt} />
    </SandpackProvider>
  )
}
