#!/usr/bin/env python3
"""CLI script to generate teacher data (mock data -> widget code -> screenshots)."""

import argparse
import logging
import sys
from pathlib import Path

# Add training root to path
TRAINING_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(TRAINING_DIR))

# Load .env from project root
from dotenv import load_dotenv
load_dotenv(TRAINING_DIR.parent / ".env")

from src.config import load_generation_config, load_training_config
from src.data_generation import generate_teacher_dataset


def main():
    parser = argparse.ArgumentParser(description="Generate teacher training data")
    parser.add_argument(
        "--num-samples",
        type=int,
        default=None,
        help="Number of samples to generate (overrides config)",
    )
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to generation config YAML",
    )
    parser.add_argument(
        "--verbose", "-v",
        action="store_true",
        help="Enable verbose logging",
    )
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.DEBUG if args.verbose else logging.INFO,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )

    config = load_generation_config(Path(args.config) if args.config else None)
    renderer_config = load_training_config().renderer

    dataset = generate_teacher_dataset(
        num_samples=args.num_samples,
        config=config,
        renderer_config=renderer_config,
    )

    print(f"\nDone! Generated {len(dataset)} teacher samples.")
    print(f"Dataset saved to: {config.data.dataset_file}")


if __name__ == "__main__":
    main()
