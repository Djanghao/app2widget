#!/bin/bash
# Serve fine-tuned Qwen2.5-Coder-32B-Instruct (LoRA merged) via vLLM
# Uses tensor-parallel=2 across GPUs 4+5 (32B bf16 ≈ 64GB)
# The model will be available at http://localhost:8001/v1

VENV="/shared/advey/vllm-env"
MODEL="/shared/advey/models/widget-coder-32b-merged"

# Use /shared for temp files (root disk is full)
export TMPDIR="/shared/advey/tmp"
export TRITON_CACHE_DIR="/shared/advey/triton_cache"
export XDG_CACHE_HOME="/shared/advey/.cache"
mkdir -p "$TMPDIR" "$TRITON_CACHE_DIR" "$XDG_CACHE_HOME"

# Workaround: python3-dev not installed, provide Python.h for JIT compilation
export C_INCLUDE_PATH="/shared/jeslyn/conda/envs/trellis2/include/python3.10:${C_INCLUDE_PATH:-}"

CUDA_VISIBLE_DEVICES=4,5 "$VENV/bin/python" -m vllm.entrypoints.openai.api_server \
  --model "$MODEL" \
  --served-model-name widget-coder \
  --port 8001 \
  --dtype bfloat16 \
  --max-model-len 16384 \
  --gpu-memory-utilization 0.55 \
  --tensor-parallel-size 2 \
  --enforce-eager
