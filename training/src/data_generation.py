"""Teacher data pipeline: generate widget screenshots using GPT-4o."""

import json
import logging
import random
from pathlib import Path

from openai import OpenAI

from .config import GenerationConfig, RendererConfig, load_generation_config
from .prompt_builder import build_mock_data_prompt, build_widget_prompt
from .renderer import WidgetRenderer
from .utils import extract_code_from_response, extract_json_from_response, validate_widget_code

logger = logging.getLogger(__name__)

TRAINING_DIR = Path(__file__).parent.parent


def _get_client() -> OpenAI:
    return OpenAI()


def generate_mock_data(
    client: OpenAI,
    description: str,
    model: str = "gpt-4o",
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> dict | None:
    """Generate mock data JSON for a widget description using GPT-4o."""
    prompt = build_mock_data_prompt(mode="description", input_content=description)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            return None

        json_str = extract_json_from_response(content)
        return json.loads(json_str)
    except Exception as e:
        logger.warning("Mock data generation failed for '%s': %s", description, e)
        return None


def generate_widget_code(
    client: OpenAI,
    mock_data: dict,
    ui_style: str,
    model: str = "gpt-4o",
    temperature: float = 0.7,
    max_tokens: int = 4096,
) -> str | None:
    """Generate widget TSX code from mock data using GPT-4o."""
    prompt = build_widget_prompt(mock_data, ui_style)

    try:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content
        if not content:
            return None

        code = extract_code_from_response(content)
        is_valid, error = validate_widget_code(code)
        if not is_valid:
            logger.warning("Generated code failed validation: %s", error)
            return None

        return code
    except Exception as e:
        logger.warning("Widget code generation failed: %s", e)
        return None


def generate_teacher_sample(
    client: OpenAI,
    renderer: WidgetRenderer,
    description: str,
    ui_style: str,
    sample_id: str,
    config: GenerationConfig,
) -> dict | None:
    """Generate a single teacher sample: mock data -> widget code -> screenshot.

    Returns a dict with {prompt, mock_data, target_screenshot, description, ui_style}
    or None if any step fails.
    """
    teacher_cfg = config.teacher
    data_cfg = config.data

    # Step 1: Generate mock data
    mock_data = generate_mock_data(
        client, description,
        model=teacher_cfg.model,
        temperature=teacher_cfg.temperature,
        max_tokens=teacher_cfg.max_tokens,
    )
    if not mock_data:
        logger.warning("Skipping %s: mock data generation failed", sample_id)
        return None

    # Step 2: Generate widget code
    code = generate_widget_code(
        client, mock_data, ui_style,
        model=teacher_cfg.model,
        temperature=teacher_cfg.temperature,
        max_tokens=teacher_cfg.max_tokens,
    )
    if not code:
        logger.warning("Skipping %s: widget code generation failed", sample_id)
        return None

    # Step 3: Render screenshot
    screenshot_path = TRAINING_DIR / data_cfg.teacher_screenshots_dir / f"{sample_id}.png"
    success = renderer.render(code, mock_data, screenshot_path)
    if not success:
        logger.warning("Skipping %s: rendering failed", sample_id)
        return None

    # Save teacher metadata (code + mock data for debugging)
    metadata_path = TRAINING_DIR / data_cfg.teacher_metadata_dir / f"{sample_id}.json"
    metadata_path.parent.mkdir(parents=True, exist_ok=True)
    metadata_path.write_text(json.dumps({
        "description": description,
        "ui_style": ui_style,
        "mock_data": mock_data,
        "teacher_code": code,
    }, indent=2))

    # Build the training prompt (what the student model will receive)
    training_prompt = build_widget_prompt(mock_data, ui_style)

    return {
        "prompt": training_prompt,
        "mock_data": mock_data,
        "target_screenshot": str(screenshot_path),
        "description": description,
        "ui_style": ui_style,
        "sample_id": sample_id,
    }


def generate_teacher_dataset(
    num_samples: int | None = None,
    config: GenerationConfig | None = None,
    renderer_config: RendererConfig | None = None,
) -> list[dict]:
    """Generate the full teacher dataset.

    For each sample, picks a random description + UI style,
    generates mock data -> widget code -> screenshot.
    """
    config = config or load_generation_config()
    num_samples = num_samples or config.teacher.num_samples
    client = _get_client()

    descriptions = config.widget_descriptions
    ui_styles = config.ui_styles

    if not descriptions:
        raise ValueError("No widget descriptions in config")
    if not ui_styles:
        raise ValueError("No UI styles in config")

    renderer = WidgetRenderer(renderer_config)
    renderer.start()

    dataset = []
    try:
        for i in range(num_samples):
            sample_id = f"sample_{i:04d}"
            description = descriptions[i % len(descriptions)]
            ui_style = random.choice(ui_styles)

            logger.info("Generating sample %d/%d: %s", i + 1, num_samples, sample_id)

            result = generate_teacher_sample(
                client, renderer, description, ui_style, sample_id, config,
            )
            if result:
                dataset.append(result)
            else:
                logger.warning("Sample %s failed, continuing", sample_id)
    finally:
        renderer.stop()

    # Write dataset to JSONL
    dataset_path = TRAINING_DIR / config.data.dataset_file
    dataset_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dataset_path, "w") as f:
        for entry in dataset:
            f.write(json.dumps(entry) + "\n")

    logger.info("Generated %d/%d teacher samples -> %s", len(dataset), num_samples, dataset_path)
    return dataset
