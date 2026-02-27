export interface WidgetMetadata {
  id: string
  app: string
  version: string
}

export interface WidgetMeta {
  theme: 'light' | 'dark'
  dataMode: 'rich' | 'compact'
  layout: 'compact' | 'detailed' | 'minimal'
  primaryColor: string
  accentColor: string
  chartTypes?: string[]
}

export interface MockDataResponse {
  widget: WidgetMetadata
  data: Record<string, any>
  meta: WidgetMeta
}

export type { A2UIWidgetSchema } from '@/lib/a2ui/types'

export interface WidgetCodeResponse {
  schema: import('@/lib/a2ui/types').A2UIWidgetSchema
}
