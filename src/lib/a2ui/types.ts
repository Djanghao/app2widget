import type { ComponentDefinition } from '@a2ui-sdk/types/0.8'

/**
 * What the LLM outputs and the route validates.
 * A simplified A2UI schema: flat component list + root ID.
 */
export interface A2UIWidgetSchema {
  components: ComponentDefinition[]
  root: string
  styles?: {
    primaryColor?: string
    font?: string
  }
}

// Re-export SDK types used elsewhere
export type { ComponentDefinition }
export type { A2UIMessage } from '@a2ui-sdk/types/0.8'

/**
 * Validate an LLM-output schema object.
 */
export function validateA2UISchema(
  value: unknown
): { valid: true; schema: A2UIWidgetSchema } | { valid: false; error: string } {
  if (typeof value !== 'object' || value === null) {
    return { valid: false, error: 'Schema must be an object' }
  }

  const obj = value as Record<string, unknown>

  if (!Array.isArray(obj.components)) {
    return { valid: false, error: 'Missing or invalid "components" array' }
  }

  if (typeof obj.root !== 'string' || !obj.root) {
    return { valid: false, error: 'Missing or invalid "root" string' }
  }

  // Validate each component
  const ids = new Set<string>()
  for (let i = 0; i < obj.components.length; i++) {
    const comp = obj.components[i] as Record<string, unknown>
    if (typeof comp !== 'object' || comp === null) {
      return { valid: false, error: `components[${i}] is not an object` }
    }
    if (typeof comp.id !== 'string' || !comp.id) {
      return { valid: false, error: `components[${i}] missing "id"` }
    }
    if (typeof comp.component !== 'object' || comp.component === null) {
      return { valid: false, error: `components[${i}] missing "component"` }
    }
    if (Object.keys(comp.component as object).length === 0) {
      return { valid: false, error: `components[${i}].component is empty` }
    }
    ids.add(comp.id)
  }

  // Check root ID exists
  if (!ids.has(obj.root)) {
    return { valid: false, error: `Root component "${obj.root}" not found in components` }
  }

  return { valid: true, schema: value as A2UIWidgetSchema }
}
