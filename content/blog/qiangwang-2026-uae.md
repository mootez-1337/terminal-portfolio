---
title: "Qiangwang 2026 — UAE"
date: "2026-10-31"
tags: ["qiangwang-2026", "misc", "ai-security", "diffusion"]
excerpt: "An adversarial image was generated with a diffusion-model-based UAE toolchain. The contact code was embedded in the initial noise, so the goal was to recover that noise by inverting the guided DDIM sampling trajectory, strip…"
---

> **Qiangwang Mimic Defense 2026 Quals · Misc · medium · 417 pts**

## Summary

An adversarial image was generated with a diffusion-model-based UAE toolchain. The contact code was embedded in the initial noise, so the goal was to recover that noise by inverting the guided DDIM sampling trajectory, strip the Gaussian carrier and sign mask, and decode the resulting QR payload.

## Solution

### Step 1: Inspect files and clues

The archive contains `x_adv.npy`, `sampler.py`, `config.json`, the classifier, and a small preview image. The NumPy tensor is the original float32 image in `[-1, 1]`; the preview is only for visual inspection.

The config identifies `google/ddpm-cifar10-32` and guided DDIM with `eta=0`. It describes the initial latent as a seeded Gaussian carrier plus a QR v2-H payload. Payload modules are expanded to 2×2 blocks, distributed row-major across channels, amplitude 0.65 (with structural modules scaled by 1.25), then modulated by a seeded per-pixel ±1 mask.

### Step 2: Recover the initial noise

1. Load the provided classifier weights and evaluate `x_adv.npy` to identify the guided target class. The strongest prediction is class 3 (`cat`).
2. Load the matching public DDPM CIFAR-10 model and use the supplied guided sampler implementation.
3. Invert the deterministic generation trajectory with `invert_fixedpoint`. Use the 100 sampling steps specified by the sampler implementation, whose timestep indices are `round(arange(steps) * num_train / steps)` for 1,000 training timesteps.
4. The result is the recovered initial latent `x_T`.

The checkpoint uses older Diffusers attention parameter names, so map `query/key/value/proj_attn` to `to_q/to_k/to_v/to_out.0` when loading it in a newer Diffusers version.

### Step 3: Remove the noise carrier and decode

Regenerate the Gaussian carrier with seed `555`, subtract it from `x_T`, and undo the per-pixel sign mask generated with seed `20261012`. Average each 2×2 block according to the configured row-major channel allocation, threshold the resulting 25×25 grid, and decode it as a QR code.

The successful reconstruction uses NumPy's `default_rng` for both seeded arrays. QR decoding returns the contact code.
