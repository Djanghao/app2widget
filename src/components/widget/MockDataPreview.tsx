'use client'

import {
  SandpackProvider,
  SandpackCodeEditor,
} from '@codesandbox/sandpack-react'
import { Box } from '@mui/material'

interface MockDataPreviewProps {
  mockData: any
}

export function MockDataPreview({ mockData }: MockDataPreviewProps) {
  const jsonCode = JSON.stringify(mockData, null, 2)

  const files = {
    '/response.json': {
      code: jsonCode,
      active: true,
    },
  }

  return (
    <Box
      sx={{
        border: '1px solid #4d4d4d',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: '#2d2d2d',
        width: '100%',
        maxWidth: '100%',
      }}
    >
      <SandpackProvider
        template="static"
        files={files}
        options={{
          activeFile: '/response.json',
        }}
        theme={{
          colors: {
            surface1: '#2d2d2d',
            surface2: '#1e1e1e',
            surface3: '#3d3d3d',
            clickable: '#999',
            base: '#e0e0e0',
            disabled: '#4d4d4d',
            hover: '#4d4d4d',
            accent: '#10a37f',
          },
          syntax: {
            plain: '#e0e0e0',
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
        <SandpackCodeEditor
          showLineNumbers
          showTabs={false}
          showReadOnly={false}
          style={{ height: 280, maxHeight: 280, fontSize: 12 }}
        />
      </SandpackProvider>
    </Box>
  )
}
