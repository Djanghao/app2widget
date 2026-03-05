"""Teacher data pipeline: generate widget screenshots using GPT-4o.

Supports parallel API calls for fast generation.
"""

import json
import logging
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from threading import Lock

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


def _generate_api_data(
    client: OpenAI,
    description: str,
    ui_style: str,
    sample_id: str,
    config: GenerationConfig,
) -> dict | None:
    """Generate mock data + widget code via API (no rendering). Thread-safe."""
    teacher_cfg = config.teacher

    mock_data = generate_mock_data(
        client, description,
        model=teacher_cfg.model,
        temperature=teacher_cfg.temperature,
        max_tokens=teacher_cfg.max_tokens,
    )
    if not mock_data:
        return None

    code = generate_widget_code(
        client, mock_data, ui_style,
        model=teacher_cfg.model,
        temperature=teacher_cfg.temperature,
        max_tokens=teacher_cfg.max_tokens,
    )
    if not code:
        return None

    return {
        "sample_id": sample_id,
        "description": description,
        "ui_style": ui_style,
        "mock_data": mock_data,
        "code": code,
    }


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
    parallel_api_workers: int = 2,
) -> list[dict]:
    """Generate the full teacher dataset with rate-limit-aware sequential API calls.

    Phase 1: Sequential API calls with delays to respect TPM limits.
    Phase 2: Sequential rendering of screenshots (Playwright is single-threaded).
    Skips samples that already have metadata from previous runs.
    """
    import time as _time

    config = config or load_generation_config()
    num_samples = num_samples or config.teacher.num_samples
    client = _get_client()

    descriptions = config.widget_descriptions
    ui_styles = config.ui_styles

    if not descriptions:
        raise ValueError("No widget descriptions in config")
    if not ui_styles:
        raise ValueError("No UI styles in config")

    data_cfg = config.data
    metadata_dir = TRAINING_DIR / data_cfg.teacher_metadata_dir
    metadata_dir.mkdir(parents=True, exist_ok=True)

    # Check which samples already exist
    existing = set()
    for f in metadata_dir.glob("sample_*.json"):
        existing.add(f.stem)
    if existing:
        logger.info("Found %d existing samples, will skip them", len(existing))

    # Phase 1: Sequential API calls with rate limiting
    logger.info("Phase 1: Generating mock data + code for %d samples (sequential with rate limiting)...",
                num_samples)

    api_results = []
    succeeded = 0
    skipped = 0
    failed = 0
    max_retries = 5

    for i in range(num_samples):
        sample_id = f"sample_{i:04d}"

        # Skip if already generated
        if sample_id in existing:
            skipped += 1
            continue

        description = descriptions[i % len(descriptions)]
        ui_style = random.choice(ui_styles)

        # Retry loop with exponential backoff
        result = None
        for attempt in range(max_retries):
            result = _generate_api_data(client, description, ui_style, sample_id, config)
            if result is not None:
                break
            # Exponential backoff: 20s, 40s, 80s, 120s, 120s
            wait = min(20 * (2 ** attempt), 120)
            logger.info("Sample %s attempt %d failed, retrying in %ds...", sample_id, attempt + 1, wait)
            _time.sleep(wait)

        if result:
            api_results.append(result)
            succeeded += 1
        else:
            failed += 1

        # Rate limit: ~10s between samples to stay under 30K TPM
        # Each sample uses ~10K tokens (2 calls × ~5K each), 30K TPM = 3 samples/min
        # The retry backoff handles bursts; 10s keeps us near the limit
        if i < num_samples - 1:
            _time.sleep(10)

        total_processed = succeeded + failed + skipped
        if total_processed % 10 == 0 or total_processed == num_samples:
            logger.info("API progress: %d/%d (succeeded=%d, skipped=%d, failed=%d)",
                        total_processed, num_samples, succeeded, skipped, failed)

    logger.info("Phase 1 complete: %d new + %d existing = %d total, %d failed",
                succeeded, skipped, succeeded + skipped, failed)

    # Sort by sample_id to maintain order
    api_results.sort(key=lambda x: x["sample_id"])

    # Phase 2: Sequential screenshot rendering (only new samples)
    logger.info("Phase 2: Rendering %d new screenshots...", len(api_results))
    renderer = WidgetRenderer(renderer_config)
    renderer.start()

    new_dataset_entries = []
    try:
        for i, item in enumerate(api_results):
            sample_id = item["sample_id"]

            screenshot_path = TRAINING_DIR / data_cfg.teacher_screenshots_dir / f"{sample_id}.png"
            success = renderer.render(item["code"], item["mock_data"], screenshot_path)
            if not success:
                logger.warning("Skipping %s: rendering failed", sample_id)
                continue

            # Save teacher metadata
            metadata_path = metadata_dir / f"{sample_id}.json"
            metadata_path.write_text(json.dumps({
                "description": item["description"],
                "ui_style": item["ui_style"],
                "mock_data": item["mock_data"],
                "teacher_code": item["code"],
            }, indent=2))

            training_prompt = build_widget_prompt(item["mock_data"], item["ui_style"])

            new_dataset_entries.append({
                "prompt": training_prompt,
                "mock_data": item["mock_data"],
                "target_screenshot": str(screenshot_path),
                "description": item["description"],
                "ui_style": item["ui_style"],
                "sample_id": sample_id,
            })

            if (i + 1) % 25 == 0 or (i + 1) == len(api_results):
                logger.info("Render progress: %d/%d screenshots", i + 1, len(api_results))

    finally:
        renderer.stop()

    # Rebuild full dataset from all metadata files + screenshots
    logger.info("Rebuilding full dataset from all metadata files...")
    dataset = []
    screenshots_dir = TRAINING_DIR / data_cfg.teacher_screenshots_dir
    for meta_file in sorted(metadata_dir.glob("sample_*.json")):
        sample_id = meta_file.stem
        screenshot_path = screenshots_dir / f"{sample_id}.png"
        if not screenshot_path.exists():
            continue
        meta = json.loads(meta_file.read_text())
        training_prompt = build_widget_prompt(meta["mock_data"], meta.get("ui_style", ""))
        dataset.append({
            "prompt": training_prompt,
            "mock_data": meta["mock_data"],
            "target_screenshot": str(screenshot_path),
            "description": meta["description"],
            "ui_style": meta.get("ui_style", ""),
            "sample_id": sample_id,
        })

    # Write dataset to JSONL
    dataset_path = TRAINING_DIR / config.data.dataset_file
    dataset_path.parent.mkdir(parents=True, exist_ok=True)
    with open(dataset_path, "w") as f:
        for entry in dataset:
            f.write(json.dumps(entry) + "\n")

    logger.info("Total dataset: %d samples (%d new) -> %s", len(dataset), len(new_dataset_entries), dataset_path)
    return dataset
