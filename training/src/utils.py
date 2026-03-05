"""Code extraction and validation utilities.

Mirrors the extraction logic from src/app/api/generate/widget/route.ts.
"""

import re

# Matches markdown-fenced code blocks with optional language tag
_CODE_BLOCK_RE = re.compile(r"```(?:typescript|tsx|ts)?\n([\s\S]*?)\n```")

# Forbidden patterns — must not appear in widget code
FORBIDDEN_PATTERNS = [
    "tailwind",
    "recharts",
    "echarts",
    "d3",
    "import.*from ['\"]d3",
    "import.*from ['\"]recharts",
    "import.*from ['\"]echarts",
    "<style",
    "className=",
]

_FORBIDDEN_RES = [re.compile(p, re.IGNORECASE) for p in FORBIDDEN_PATTERNS]


def extract_code_from_response(response: str) -> str:
    """Extract widget TSX code from an LLM response.

    If the response contains a markdown code block, extract its contents.
    Otherwise return the raw response (the prompt asks for no fences).
    """
    match = _CODE_BLOCK_RE.search(response)
    if match:
        return match.group(1).strip()
    return response.strip()


def validate_widget_code(code: str) -> tuple[bool, str]:
    """Validate that widget code meets basic structural requirements.

    Returns (is_valid, error_message).
    """
    if not code:
        return False, "Empty code"

    if "export default" not in code:
        return False, "Missing 'export default' statement"

    if "import" not in code:
        return False, "Missing import statements"

    for pattern_re in _FORBIDDEN_RES:
        if pattern_re.search(code):
            return False, f"Forbidden pattern: {pattern_re.pattern}"

    return True, ""


def extract_json_from_response(response: str) -> str:
    """Extract JSON from an LLM response, stripping markdown fences if present."""
    match = re.search(r"```json\n([\s\S]*?)\n```", response)
    if match:
        return match.group(1).strip()
    return response.strip()
