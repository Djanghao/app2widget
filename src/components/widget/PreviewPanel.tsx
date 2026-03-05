'use client'

import React, { useEffect, useRef } from 'react'
import { Box, IconButton, Typography } from '@mui/material'
import CloseIcon from '@mui/icons-material/Close'
import {
  SandpackProvider,
  SandpackLayout,
  SandpackPreview,
  useSandpack,
} from '@codesandbox/sandpack-react'
import { useChatContext } from '../chat/ChatProvider'

/**
 * Imperatively update Sandpack files so the provider never remounts.
 */
function FileUpdater({ code, mockData }: { code: string; mockData: any }) {
  const { sandpack } = useSandpack()
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    sandpack.updateFile('/Widget.tsx', code)
    sandpack.updateFile(
      '/response.json',
      JSON.stringify(mockData || { widget: null, data: null, meta: null }, null, 2),
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, mockData])

  return null
}

function PreviewOnlyWidget({ code, mockData }: { code: string; mockData?: any }) {
  // Wrap the widget in a centering layout inside the iframe.
  // The user's code is in /Widget.tsx; /App.tsx imports it and centers it.
  const files = {
    '/Widget.tsx': { code },
    '/App.tsx': {
      code: `import Widget from "./Widget";
import "./styles.css";
export default function App() {
  return (
    <div className="preview-center">
      <div className="preview-scale">
        <Widget />
      </div>
    </div>
  );
}`,
      active: true,
    },
    '/styles.css': {
      code: `html, body, #root {
  height: 100%;
  margin: 0;
  background: #f5f5f5;
}
.preview-center {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100%;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
}
.preview-scale {
  transform: scale(2);
  transform-origin: center center;
}`,
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
      style={{ height: '100%' }}
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
          surface1: '#f5f5f5',
          surface2: '#f5f5f5',
          surface3: '#f5f5f5',
        },
      }}
    >
      <FileUpdater code={code} mockData={mockData} />
      <SandpackLayout style={{ height: '100%', border: 'none', background: '#f5f5f5' }}>
        <SandpackPreview
          showNavigator={false}
          showRefreshButton={false}
          showOpenInCodeSandbox={false}
          style={{ height: '100%', width: '100%', border: 'none' }}
        />
      </SandpackLayout>
    </SandpackProvider>
  )
}

class SandpackErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('Sandpack error:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <Box sx={{ p: 3, color: '#ef4444', fontSize: 13 }}>
          <Typography variant="body2" fontWeight={600} sx={{ mb: 1, color: '#ef4444' }}>
            Preview failed to load
          </Typography>
          <Typography variant="caption" sx={{ color: '#999', whiteSpace: 'pre-wrap' }}>
            {this.state.error.message}
          </Typography>
        </Box>
      )
    }
    return this.props.children
  }
}

export function PreviewPanel() {
  const { activePreview, setActivePreview } = useChatContext()

  if (!activePreview) return null

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#1e1e1e',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1,
          bgcolor: '#2a2a2a',
          borderBottom: '1px solid #3e3e3e',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <Typography sx={{ color: '#ececec', fontSize: 13, fontWeight: 600 }}>
          Preview
        </Typography>
        <IconButton
          size="small"
          onClick={() => setActivePreview(null)}
          sx={{ color: '#8e8ea0', '&:hover': { color: '#ececec' } }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Sandpack preview — absolute positioning gives iframe real pixel dimensions */}
      <Box sx={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0 }}>
          <SandpackErrorBoundary>
            <PreviewOnlyWidget
              code={activePreview.code}
              mockData={activePreview.mockData}
            />
          </SandpackErrorBoundary>
        </Box>
      </Box>
    </Box>
  )
}
