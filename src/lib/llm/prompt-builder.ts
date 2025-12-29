import fs from 'fs'
import path from 'path'
import { ChatMode } from '@/types/chat'

const PROMPTS_DIR = path.join(process.cwd(), 'src', 'lib', 'prompts')

// Read prompt templates at module load time
const MOCK_DATA_PROMPT = fs.readFileSync(
  path.join(PROMPTS_DIR, 'mock-data.md'),
  'utf-8'
)

const WIDGET_CODE_PROMPT = fs.readFileSync(
  path.join(PROMPTS_DIR, 'widget-code.md'),
  'utf-8'
)

export function buildMockDataPrompt(
  mode: ChatMode,
  input: string,
  appMetadata?: Record<string, any>
): string {
  let prompt = MOCK_DATA_PROMPT

  // Replace MODE placeholder
  prompt = prompt.replace('{{MODE}}', mode)

  // Replace INPUT_CONTENT placeholder
  if (mode === 'appId' && appMetadata) {
    const content = `App Metadata:\n${JSON.stringify(appMetadata, null, 2)}`
    prompt = prompt.replace('{{INPUT_CONTENT}}', content)
  } else {
    const content = `App Description:\n${input}`
    prompt = prompt.replace('{{INPUT_CONTENT}}', content)
  }

  return prompt
}

export function buildWidgetPrompt(
  mockData: Record<string, any>,
  uiStylePrompt: string
): string {
  let prompt = WIDGET_CODE_PROMPT

  // Replace MOCK_DATA_SCHEMA placeholder
  prompt = prompt.replace(
    '{{MOCK_DATA_SCHEMA}}',
    JSON.stringify(mockData, null, 2)
  )

  // Replace UI_STYLE_PROMPT placeholder
  prompt = prompt.replace('{{UI_STYLE_PROMPT}}', uiStylePrompt)

  return prompt
}
