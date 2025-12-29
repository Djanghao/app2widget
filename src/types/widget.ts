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

export interface WidgetCodeResponse {
  code: string
}
