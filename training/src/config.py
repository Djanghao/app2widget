"""Configuration management using Pydantic Settings and YAML."""

from pathlib import Path
from typing import Optional

import yaml
from pydantic import Field
from pydantic_settings import BaseSettings

TRAINING_DIR = Path(__file__).parent.parent
CONFIGS_DIR = TRAINING_DIR / "configs"


class LoRAConfig(BaseSettings):
    r: int = 16
    alpha: int = 32
    dropout: float = 0.05
    target_modules: list[str] = [
        "q_proj", "k_proj", "v_proj", "o_proj",
        "gate_proj", "up_proj", "down_proj",
    ]


class ModelConfig(BaseSettings):
    name: str = "Qwen/Qwen2.5-Coder-7B-Instruct"
    torch_dtype: str = "bfloat16"
    device_map: str = "auto"
    load_in_4bit: bool = False


class GRPOConfig(BaseSettings):
    num_generations: int = 8
    beta: float = 0.1
    learning_rate: float = 1e-5
    num_train_epochs: int = 3
    per_device_train_batch_size: int = 1
    gradient_accumulation_steps: int = 4
    max_prompt_length: int = 4096
    max_completion_length: int = 4096
    bf16: bool = True
    logging_steps: int = 10
    save_steps: int = 100
    warmup_ratio: float = 0.05
    optim: str = "adamw_torch"


class RewardConfig(BaseSettings):
    compile_weight: float = 0.2
    ssim_weight: float = 0.4
    judge_weight: float = 0.4
    ssim_image_size: tuple[int, int] = (300, 400)
    vlm_judge_model: str = "gpt-4o-mini"
    vlm_judge_enabled: bool = True


class RendererConfig(BaseSettings):
    vite_port: int = 5555
    screenshot_timeout: int = 10000
    render_complete_timeout: int = 5000


class OutputConfig(BaseSettings):
    dir: str = "output"
    final_dir: str = "output/final"
    checkpoint_dir: str = "output/checkpoints"


class WandbConfig(BaseSettings):
    project: str = "app2widget-grpo"
    enabled: bool = False


class TeacherConfig(BaseSettings):
    model: str = "gpt-4o"
    temperature: float = 0.7
    max_tokens: int = 4096
    num_samples: int = 500


class DataConfig(BaseSettings):
    output_dir: str = "data"
    dataset_file: str = "data/dataset.jsonl"
    teacher_screenshots_dir: str = "data/teacher_screenshots"
    teacher_metadata_dir: str = "data/teacher_metadata"
    candidates_dir: str = "data/candidates"


class TrainingConfig(BaseSettings):
    model: ModelConfig = Field(default_factory=ModelConfig)
    lora: LoRAConfig = Field(default_factory=LoRAConfig)
    grpo: GRPOConfig = Field(default_factory=GRPOConfig)
    reward: RewardConfig = Field(default_factory=RewardConfig)
    renderer: RendererConfig = Field(default_factory=RendererConfig)
    output: OutputConfig = Field(default_factory=OutputConfig)
    wandb: WandbConfig = Field(default_factory=WandbConfig)


class GenerationConfig(BaseSettings):
    teacher: TeacherConfig = Field(default_factory=TeacherConfig)
    data: DataConfig = Field(default_factory=DataConfig)
    ui_styles: list[str] = Field(default_factory=list)
    widget_descriptions: list[str] = Field(default_factory=list)


def load_training_config(path: Optional[Path] = None) -> TrainingConfig:
    """Load training config from YAML, with env var overrides."""
    config_path = path or CONFIGS_DIR / "grpo_config.yaml"
    with open(config_path) as f:
        data = yaml.safe_load(f)
    return TrainingConfig(**data)


def load_generation_config(path: Optional[Path] = None) -> GenerationConfig:
    """Load generation config from YAML, with env var overrides."""
    config_path = path or CONFIGS_DIR / "generation_config.yaml"
    with open(config_path) as f:
        data = yaml.safe_load(f)
    return GenerationConfig(**data)
