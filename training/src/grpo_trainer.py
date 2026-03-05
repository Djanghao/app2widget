"""GRPO training loop using TRL's GRPOTrainer with visual reward."""

import json
import logging
from pathlib import Path

import torch
from datasets import Dataset
from peft import LoraConfig
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from trl import GRPOConfig as TRLGRPOConfig, GRPOTrainer

from .config import TrainingConfig, load_training_config
from .renderer import WidgetRenderer
from .reward import compute_reward
from .utils import extract_code_from_response

logger = logging.getLogger(__name__)

TRAINING_DIR = Path(__file__).parent.parent


def load_dataset(dataset_path: str | Path) -> Dataset:
    """Load the teacher dataset from JSONL."""
    dataset_path = Path(dataset_path)
    entries = []
    with open(dataset_path) as f:
        for line in f:
            entry = json.loads(line.strip())
            # Serialize mock_data to string to avoid PyArrow type conflicts
            if isinstance(entry.get("mock_data"), dict):
                entry["mock_data"] = json.dumps(entry["mock_data"])
            entries.append(entry)
    return Dataset.from_list(entries)


def build_reward_function(renderer: WidgetRenderer, config: TrainingConfig, dataset: Dataset):
    """Build the reward function for GRPO.

    TRL 0.29 calls reward_fn(prompts=..., completions=..., **kwargs) where:
    - prompts: list of chat message lists [[{"role": "user", "content": "..."}], ...]
    - completions: list of chat message lists [[{"role": "assistant", "content": "..."}], ...]
    - kwargs includes dataset columns like mock_data, target_screenshot
    """
    candidates_dir = TRAINING_DIR / config.output.dir / "candidates"
    candidates_dir.mkdir(parents=True, exist_ok=True)

    def _extract_text(item) -> str:
        """Extract text from various completion formats."""
        if isinstance(item, str):
            return item
        if isinstance(item, list):
            # List of message dicts: [{"role": "assistant", "content": "..."}]
            for msg in reversed(item):
                if isinstance(msg, dict) and "content" in msg:
                    return msg["content"]
            return str(item)
        if isinstance(item, dict) and "content" in item:
            return item["content"]
        return str(item)

    def reward_fn(prompts=None, completions=None, **kwargs) -> list[float]:
        """Compute rewards for a batch of completions."""
        if completions is None:
            return []

        rewards = []

        # Get dataset columns from kwargs
        mock_data_list = kwargs.get("mock_data", [None] * len(completions))
        target_list = kwargs.get("target_screenshot", [None] * len(completions))

        for i, completion in enumerate(completions):
            text = _extract_text(completion)
            code = extract_code_from_response(text)

            mock_data = mock_data_list[i] if i < len(mock_data_list) else None
            target = target_list[i] if i < len(target_list) else None

            candidate_path = None
            if mock_data and target:
                candidate_path = candidates_dir / f"candidate_{i}.png"
                if isinstance(mock_data, str):
                    mock_data = json.loads(mock_data)
                success = renderer.render(code, mock_data, candidate_path)
                if not success:
                    candidate_path = None

            reward = compute_reward(
                code=code,
                candidate_screenshot=candidate_path,
                target_screenshot=target,
                config=config.reward,
            )
            rewards.append(reward)

        return rewards

    return reward_fn


def run_grpo_training(
    config: TrainingConfig | None = None,
    dataset_path: str | Path | None = None,
) -> None:
    """Run the full GRPO training loop."""
    config = config or load_training_config()
    dataset_path = dataset_path or TRAINING_DIR / "data" / "dataset.jsonl"

    model_cfg = config.model
    lora_cfg = config.lora
    grpo_cfg = config.grpo
    output_cfg = config.output

    # Load tokenizer
    logger.info("Loading model: %s", model_cfg.name)
    tokenizer = AutoTokenizer.from_pretrained(model_cfg.name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    dtype_map = {"bfloat16": torch.bfloat16, "float16": torch.float16, "float32": torch.float32}
    torch_dtype = dtype_map.get(model_cfg.torch_dtype, torch.bfloat16)

    # Load model
    quantization_config = None
    if model_cfg.load_in_4bit:
        quantization_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch_dtype,
            bnb_4bit_use_double_quant=True,
        )
        logger.info("Using 4-bit QLoRA quantization")

    model = AutoModelForCausalLM.from_pretrained(
        model_cfg.name,
        torch_dtype=torch_dtype,
        device_map=model_cfg.device_map,
        quantization_config=quantization_config,
        low_cpu_mem_usage=True,
    )

    # LoRA config (passed to GRPOTrainer, not applied manually)
    peft_config = LoraConfig(
        r=lora_cfg.r,
        lora_alpha=lora_cfg.alpha,
        lora_dropout=lora_cfg.dropout,
        target_modules=lora_cfg.target_modules,
        task_type="CAUSAL_LM",
    )

    # Load dataset
    logger.info("Loading dataset from: %s", dataset_path)
    raw_dataset = load_dataset(dataset_path)
    logger.info("Dataset size: %d samples", len(raw_dataset))

    # Format prompts as chat messages for the tokenizer
    def prepare_example(example):
        example["prompt"] = [{"role": "user", "content": example["prompt"]}]
        return example

    dataset = raw_dataset.map(prepare_example)

    # Start renderer
    renderer = WidgetRenderer(config.renderer)
    renderer.start()

    try:
        # Build reward function
        reward_fn = build_reward_function(renderer, config, raw_dataset)

        # Configure GRPO training
        final_dir = TRAINING_DIR / output_cfg.final_dir
        checkpoint_dir = TRAINING_DIR / output_cfg.checkpoint_dir

        # Compute warmup steps from ratio
        total_steps = (
            len(dataset) * grpo_cfg.num_train_epochs
            // (grpo_cfg.per_device_train_batch_size * grpo_cfg.gradient_accumulation_steps)
        )
        warmup_steps = int(total_steps * grpo_cfg.warmup_ratio)

        training_args = TRLGRPOConfig(
            output_dir=str(checkpoint_dir),
            num_train_epochs=grpo_cfg.num_train_epochs,
            per_device_train_batch_size=grpo_cfg.per_device_train_batch_size,
            gradient_accumulation_steps=grpo_cfg.gradient_accumulation_steps,
            learning_rate=grpo_cfg.learning_rate,
            bf16=grpo_cfg.bf16,
            logging_steps=grpo_cfg.logging_steps,
            save_steps=grpo_cfg.save_steps,
            warmup_steps=warmup_steps,
            optim=grpo_cfg.optim,
            max_completion_length=grpo_cfg.max_completion_length,
            num_generations=grpo_cfg.num_generations,
            generation_batch_size=grpo_cfg.num_generations,
            beta=grpo_cfg.beta,
            report_to="wandb" if config.wandb.enabled else "none",
        )

        # Create trainer
        trainer = GRPOTrainer(
            model=model,
            reward_funcs=reward_fn,
            args=training_args,
            train_dataset=dataset,
            processing_class=tokenizer,
            peft_config=peft_config,
        )

        # Train
        logger.info("Starting GRPO training...")
        trainer.train()

        # Save final weights
        final_dir.mkdir(parents=True, exist_ok=True)
        trainer.save_model(str(final_dir))
        tokenizer.save_pretrained(str(final_dir))
        logger.info("Final LoRA weights saved to: %s", final_dir)

    finally:
        renderer.stop()
