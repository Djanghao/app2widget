'use client'

import React from 'react'
import { Box, Stack, Typography, Chip, Divider } from '@mui/material'
import { LineChart, BarChart, PieChart } from '@mui/x-charts'
import { A2UIComponentEntry, A2UIMessage, DynamicNumber, DynamicString } from '@/types/a2ui'

type A2UIRendererProps = {
  messages: A2UIMessage[]
  dataModel?: any
}

// Small helpers to keep parsing predictable and resilient to partial payloads.
const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const resolvePath = (path: string, dataModel: any) => {
  // JSON Pointer path resolution with basic escape handling.
  if (!path || !path.startsWith('/')) return undefined
  const parts = path
    .split('/')
    .slice(1)
    .map((part) => part.replace(/~1/g, '/').replace(/~0/g, '~'))
  return parts.reduce((acc: any, key) => (acc != null ? acc[key] : undefined), dataModel)
}

// Resolve A2UI DynamicString to a displayable string.
const resolveDynamicString = (value: DynamicString | string | undefined, dataModel: any) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (value.literalString != null) return String(value.literalString)
  if (value.path) return String(resolvePath(value.path, dataModel) ?? '')
  return ''
}

// Resolve A2UI DynamicNumber to a numeric value.
const resolveDynamicNumber = (value: DynamicNumber | number | undefined, dataModel: any) => {
  if (value == null) return undefined
  if (typeof value === 'number') return value
  if (value.literalNumber != null) return value.literalNumber
  if (value.path) {
    const resolved = resolvePath(value.path, dataModel)
    return typeof resolved === 'number' ? resolved : Number(resolved)
  }
  return undefined
}

// A2UI adjacency list stores component type as a single-key object.
const getComponentPayload = (entry: A2UIComponentEntry) => {
  const type = Object.keys(entry.component || {})[0]
  const payload = type ? entry.component[type] : undefined
  return { type, payload }
}

// Extract child component ids from the supported A2UI container shapes.
const getChildIds = (payload: any) => {
  if (!payload) return [] as string[]
  if (payload.child?.componentId) return [payload.child.componentId]
  const explicitList = payload.children?.explicitList
  if (Array.isArray(explicitList)) {
    return explicitList
      .map((child: any) => child?.componentId)
      .filter((id: any) => typeof id === 'string')
  }
  return []
}

// Normalize A2UI style objects into MUI sx props.
const toBoxStyles = (style: any, payload: any) => {
  if (!style || !isObject(style)) return undefined
  const sx: Record<string, any> = { ...style }
  // Normalize simple alignment keys used in prompts.
  if (payload?.align) {
    sx.alignItems = payload.align
  }
  if (payload?.justify) {
    sx.justifyContent = payload.justify
  }
  return sx
}

export function A2UIRenderer({ messages, dataModel }: A2UIRendererProps) {
  // Extract the latest surface update and root component id.
  const surfaceUpdate = messages.find(
    (msg) => isObject(msg) && 'surfaceUpdate' in msg && isObject(msg.surfaceUpdate)
  ) as { surfaceUpdate?: { surfaceId: string; components: A2UIComponentEntry[] } } | undefined

  const beginRendering = messages.find(
    (msg) => isObject(msg) && 'beginRendering' in msg && isObject(msg.beginRendering)
  ) as { beginRendering?: { surfaceId: string; rootComponentId: string } } | undefined

  const explicitDataModel = messages.find(
    (msg) => isObject(msg) && 'dataModelUpdate' in msg && isObject(msg.dataModelUpdate)
  ) as { dataModelUpdate?: { dataModel: unknown } } | undefined

  const components = surfaceUpdate?.surfaceUpdate?.components || []
  const rootId = beginRendering?.beginRendering?.rootComponentId
  const effectiveDataModel = explicitDataModel?.dataModelUpdate?.dataModel ?? dataModel

  // Build a quick lookup for adjacency list rendering.
  const componentsById = new Map(components.map((entry) => [entry.id, entry]))

const renderComponent = (componentId: string): React.ReactNode => {
    const entry = componentsById.get(componentId)
    if (!entry) return null

    const { type, payload } = getComponentPayload(entry)
    const childIds = getChildIds(payload)
    const children = childIds.map((id) => (
      <React.Fragment key={id}>{renderComponent(id)}</React.Fragment>
    ))
    const sx = toBoxStyles(payload?.style, payload)

    switch (type) {
      case 'Container':
        return <Box sx={sx}>{children}</Box>
      case 'Column':
        return (
          <Stack direction="column" gap={payload?.gap ?? 0} sx={sx}>
            {children}
          </Stack>
        )
      case 'Row':
        return (
          <Stack direction="row" gap={payload?.gap ?? 0} sx={sx}>
            {children}
          </Stack>
        )
      case 'Stack':
        return (
          <Stack direction={payload?.direction ?? 'column'} gap={payload?.gap ?? 0} sx={sx}>
            {children}
          </Stack>
        )
      case 'Grid': {
        // Use CSS grid to keep layout lightweight and renderer-agnostic.
        const columns = payload?.columns ?? payload?.columnCount ?? 2
        return (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              gap: payload?.gap ?? 8,
              ...sx,
            }}
          >
            {children}
          </Box>
        )
      }
      case 'Text': {
        const text = resolveDynamicString(payload?.text, effectiveDataModel)
        return (
          <Typography sx={sx}>
            {text}
          </Typography>
        )
      }
      case 'Badge': {
        const label = resolveDynamicString(payload?.text ?? payload?.label, effectiveDataModel)
        return <Chip label={label} sx={sx} />
      }
      case 'Divider':
        return <Divider sx={sx} />
      case 'Image': {
        const src = resolveDynamicString(payload?.src, effectiveDataModel)
        return <Box component="img" src={src} alt="" sx={sx} />
      }
      case 'Icon': {
        const name = resolveDynamicString(payload?.name, effectiveDataModel)
        return (
          <Box sx={sx}>
            {name}
          </Box>
        )
      }
      case 'Chart': {
        // Chart schema:
        // chartType: "line" | "bar" | "pie"
        // data: { path: "/data/..." }
        // xLabels: { path: "/data/..." } (optional for line)
        // labelKey/valueKey: for bar & pie when data is array of objects
        // colors: ["#..."] (optional)
        const chartType = payload?.chartType
        const dataPath = payload?.data?.path
        const labelPath = payload?.xLabels?.path
        const labelKey = payload?.labelKey
        const valueKey = payload?.valueKey
        const colors = Array.isArray(payload?.colors) ? payload.colors : undefined

        const rawData = typeof dataPath === 'string' ? resolvePath(dataPath, effectiveDataModel) : null
        const rawLabels = typeof labelPath === 'string' ? resolvePath(labelPath, effectiveDataModel) : null

        if (!rawData) {
          return (
            <Box sx={{ ...sx, color: '#ef4444', fontSize: 12 }}>
              Chart data missing
            </Box>
          )
        }

        if (chartType === 'line') {
          const data = Array.isArray(rawData) ? rawData : []
          const xLabels = Array.isArray(rawLabels) ? rawLabels : data.map((_: any, i: number) => `${i + 1}`)
          return (
            <Box sx={{ ...sx, width: '100%' }}>
              <LineChart
                height={payload?.height ?? 160}
                series={[
                  {
                    data,
                    color: colors?.[0],
                    showMark: false,
                  },
                ]}
                xAxis={[{ data: xLabels, scaleType: 'point' }]}
                margin={{ top: 10, bottom: 30, left: 30, right: 10 }}
              />
            </Box>
          )
        }

        if (chartType === 'bar') {
          const data = Array.isArray(rawData) ? rawData : []
          if (!labelKey || !valueKey) {
            return (
              <Box sx={{ ...sx, color: '#ef4444', fontSize: 12 }}>
                Bar chart requires labelKey and valueKey
              </Box>
            )
          }
          const labels = data.map((item: any) => item?.[labelKey])
          const values = data.map((item: any) => item?.[valueKey])
          return (
            <Box sx={{ ...sx, width: '100%' }}>
              <BarChart
                height={payload?.height ?? 180}
                series={[{ data: values, color: colors?.[0] }]}
                xAxis={[
                  {
                    data: labels,
                    scaleType: 'band',
                    tickLabelStyle: { fontSize: 10, fill: '#6b7280' },
                  },
                ]}
                margin={{ top: 10, bottom: 30, left: 30, right: 10 }}
              />
            </Box>
          )
        }

        if (chartType === 'pie') {
          const data = Array.isArray(rawData) ? rawData : []
          if (!labelKey || !valueKey) {
            return (
              <Box sx={{ ...sx, color: '#ef4444', fontSize: 12 }}>
                Pie chart requires labelKey and valueKey
              </Box>
            )
          }
          const seriesData = data.map((item: any, index: number) => ({
            id: index,
            value: item?.[valueKey],
            label: item?.[labelKey],
            color: colors?.[index],
          }))
          return (
            <Box sx={{ ...sx, width: '100%' }}>
              <PieChart
                height={payload?.height ?? 180}
                series={[{ data: seriesData }]}
                margin={{ top: 10, bottom: 10, left: 10, right: 10 }}
              />
            </Box>
          )
        }

        return (
          <Box sx={{ ...sx, color: '#ef4444', fontSize: 12 }}>
            Unsupported chartType
          </Box>
        )
      }
      default:
        // Fallback for unknown components so the preview never hard-crashes.
        return <Box sx={sx}>{children}</Box>
    }
  }

  if (!rootId) {
    return (
      <Box sx={{ color: '#ef4444', fontSize: 12 }}>
        Missing beginRendering.rootComponentId
      </Box>
    )
  }

  return <Box>{renderComponent(rootId)}</Box>
}
