"""Python port of src/lib/llm/prompt-builder.ts — builds prompts for widget and mock data generation."""

import json
from pathlib import Path

PROMPTS_DIR = Path(__file__).parent.parent / "prompts"

# Read templates once at module load
MOCK_DATA_PROMPT = (PROMPTS_DIR / "mock-data.md").read_text()
WIDGET_CODE_PROMPT = (PROMPTS_DIR / "widget-code.md").read_text()


def build_mock_data_prompt(
    mode: str,
    input_content: str,
    app_metadata: dict | None = None,
) -> str:
    """Build the mock data generation prompt.

    Mirrors buildMockDataPrompt() from prompt-builder.ts.
    """
    prompt = MOCK_DATA_PROMPT
    prompt = prompt.replace("{{MODE}}", mode)

    if mode == "appId" and app_metadata:
        content = f"App Metadata:\n{json.dumps(app_metadata, indent=2)}"
    else:
        content = f"App Description:\n{input_content}"

    prompt = prompt.replace("{{INPUT_CONTENT}}", content)
    return prompt


def build_widget_prompt(mock_data: dict, ui_style_prompt: str) -> str:
    """Build the widget code generation prompt.

    Mirrors buildWidgetPrompt() from prompt-builder.ts.
    """
    prompt = WIDGET_CODE_PROMPT
    prompt = prompt.replace("{{MOCK_DATA_SCHEMA}}", json.dumps(mock_data, indent=2))
    prompt = prompt.replace("{{UI_STYLE_PROMPT}}", ui_style_prompt)
    return prompt
