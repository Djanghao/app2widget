'use client'

import React, { Component, ReactNode, useEffect, useMemo } from 'react'
import { Box, Typography } from '@mui/material'
import {
  A2UIProvider,
  A2UIRenderer as SDKRenderer,
  useA2UIMessageHandler,
  useDataModelContext,
} from '@a2ui-sdk/react/0.8'
import type { A2UIMessage } from '@a2ui-sdk/types/0.8'
import { muiCatalog } from './catalog'
import type { A2UIWidgetSchema } from './types'

// --- Error Boundary ---

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: string | null
}

class A2UIErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error: error.message }
  }

  render() {
    if (this.state.error) {
      return (
        <Box
          sx={{
            p: 2,
            bgcolor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 1,
          }}
          
        >
          <Typography variant="body2" sx={{ color: '#DC2626' }}>
            Render error: {this.state.error}
          </Typography>
        </Box>
      )
    }
    return this.props.children
  }
}

// --- Inner component that processes messages and injects data ---

const SURFACE_ID = 'widget'

function WidgetInner({
  schema,
  mockData,
}: {
  schema: A2UIWidgetSchema
  mockData: Record<string, any>
}) {
  const { processMessage, clear } = useA2UIMessageHandler()
  const { updateDataModel } = useDataModelContext()

  useEffect(() => {
    // Clear previous state
    clear()

    // 1. Register all components
    processMessage({
      surfaceUpdate: {
        surfaceId: SURFACE_ID,
        components: schema.components,
      },
    } as A2UIMessage)

    // 2. Initialize the surface (and data model)
    processMessage({
      beginRendering: {
        surfaceId: SURFACE_ID,
        root: schema.root,
        styles: schema.styles,
      },
    } as A2UIMessage)

    // 3. Inject mock data directly into the data model
    // This bypasses DataEntry format limitations (no array support)
    // and sets the full mock data object for path-based data binding
    if (mockData) {
      updateDataModel(SURFACE_ID, '/', mockData)
    }
  }, [schema, mockData, processMessage, clear, updateDataModel])

  return <SDKRenderer />
}

// --- Public renderer component ---

interface A2UIRendererProps {
  schema: A2UIWidgetSchema
  data: Record<string, any>
}

export function A2UIRenderer({ schema, data }: A2UIRendererProps) {
  return (
    <A2UIErrorBoundary>
      <A2UIProvider catalog={muiCatalog}>
        <WidgetInner schema={schema} mockData={data} />
      </A2UIProvider>
    </A2UIErrorBoundary>
  )
}
