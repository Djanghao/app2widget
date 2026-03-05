#!/usr/bin/env python3
"""CLI script to run GRPO training."""

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

from src.config import load_training_config
from src.grpo_trainer import run_grpo_training


def main():
    parser = argparse.ArgumentParser(description="Run GRPO training for widget generation")
    parser.add_argument(
        "--config",
        type=str,
        default=None,
        help="Path to training config YAML",
    )
    parser.add_argument(
        "--dataset",
        type=str,
        default=None,
        help="Path to dataset JSONL (overrides config)",
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

    config = load_training_config(Path(args.config) if args.config else None)

    dataset_path = Path(args.dataset) if args.dataset else None

    run_grpo_training(config=config, dataset_path=dataset_path)

    print("\nTraining complete!")
    print(f"LoRA weights saved to: {config.output.final_dir}")


if __name__ == "__main__":
    main()
