export type DynamicString = {
  literalString?: string
  path?: string
}

export type DynamicNumber = {
  literalNumber?: number
  path?: string
}

export type A2UIComponentEntry = {
  id: string
  component: Record<string, any>
}

export type A2UISurfaceUpdate = {
  surfaceId: string
  components: A2UIComponentEntry[]
}

export type A2UIBeginRendering = {
  surfaceId: string
  rootComponentId: string
}

export type A2UIDataModelUpdate = {
  dataModel: unknown
}

export type A2UIMessage =
  | { surfaceUpdate?: A2UISurfaceUpdate }
  | { beginRendering?: A2UIBeginRendering }
  | { dataModelUpdate?: A2UIDataModelUpdate }
