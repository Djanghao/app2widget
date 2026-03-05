"""Reward computation: SSIM visual similarity + compilability + VLM judge."""

import base64
import logging
import os
from pathlib import Path

import numpy as np
from openai import OpenAI
from PIL import Image
from skimage.metrics import structural_similarity as ssim

from .config import RewardConfig
from .utils import validate_widget_code

logger = logging.getLogger(__name__)

_vlm_client = None


def _get_vlm_client() -> OpenAI:
    """Lazy-init OpenAI client for VLM judge."""
    global _vlm_client
    if _vlm_client is None:
        _vlm_client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
    return _vlm_client


def _encode_image(path: str | Path) -> str:
    """Base64-encode an image file."""
    with open(path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def compute_ssim(
    candidate_path: str | Path,
    target_path: str | Path,
    image_size: tuple[int, int] = (300, 400),
) -> float:
    """Compute SSIM between a candidate screenshot and a target.

    Both images are converted to grayscale and resized to `image_size`
    (width, height) before comparison.

    Returns SSIM score in [0, 1]. Returns 0.0 on error.
    """
    try:
        candidate = Image.open(candidate_path).convert("L").resize(image_size)
        target = Image.open(target_path).convert("L").resize(image_size)

        candidate_arr = np.array(candidate)
        target_arr = np.array(target)

        score = ssim(candidate_arr, target_arr, data_range=255)
        return float(score)
    except Exception as e:
        logger.warning("SSIM computation failed: %s", e)
        return 0.0


def compute_compilability(code: str) -> float:
    """Score code compilability: 1.0 if valid, 0.0 if not."""
    is_valid, _ = validate_widget_code(code)
    return 1.0 if is_valid else 0.0


def compute_vlm_judge(
    candidate_path: str | Path,
    target_path: str | Path,
    model: str = "gpt-4o-mini",
) -> float:
    """Use a VLM to judge visual similarity and quality.

    Returns a score in [0, 1]. Returns 0.5 on error (neutral).
    """
    try:
        client = _get_vlm_client()
        candidate_b64 = _encode_image(candidate_path)
        target_b64 = _encode_image(target_path)

        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a UI quality judge. Compare a candidate widget screenshot "
                        "against the target. Score from 1-10 on: layout accuracy, visual "
                        "fidelity, color/styling match, data correctness, and overall polish. "
                        "Respond with ONLY a single integer from 1 to 10."
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Target widget:"},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{target_b64}", "detail": "low"},
                        },
                        {"type": "text", "text": "Candidate widget:"},
                        {
                            "type": "image_url",
                            "image_url": {"url": f"data:image/png;base64,{candidate_b64}", "detail": "low"},
                        },
                    ],
                },
            ],
            max_tokens=5,
            temperature=0.0,
        )

        score_text = response.choices[0].message.content.strip()
        score = int("".join(c for c in score_text if c.isdigit())[:2])
        score = max(1, min(10, score))
        return score / 10.0

    except Exception as e:
        logger.warning("VLM judge failed: %s", e)
        return 0.5


def compute_reward(
    code: str,
    candidate_screenshot: str | Path | None,
    target_screenshot: str | Path,
    config: RewardConfig | None = None,
) -> float:
    """Compute the combined reward for a candidate widget code.

    Reward = compile_weight * compilability
           + ssim_weight * ssim_score
           + judge_weight * vlm_judge_score
    """
    config = config or RewardConfig()

    compilability = compute_compilability(code)

    ssim_score = 0.0
    judge_score = 0.5
    if candidate_screenshot and Path(candidate_screenshot).exists():
        ssim_score = compute_ssim(
            candidate_screenshot,
            target_screenshot,
            image_size=config.ssim_image_size,
        )

        if config.vlm_judge_enabled:
            judge_score = compute_vlm_judge(
                candidate_screenshot,
                target_screenshot,
                model=config.vlm_judge_model,
            )

    reward = (
        config.compile_weight * compilability
        + config.ssim_weight * ssim_score
        + config.judge_weight * judge_score
    )

    logger.debug(
        "Reward: %.3f (compile=%.1f, ssim=%.3f, judge=%.3f)",
        reward, compilability, ssim_score, judge_score,
    )
    return reward
