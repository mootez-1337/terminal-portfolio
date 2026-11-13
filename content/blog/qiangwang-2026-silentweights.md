---
title: "Qiangwang 2026 — SilentWeights"
date: "2026-10-31"
tags: ["qiangwang-2026", "misc", "ai-security", "stego"]
excerpt: "The checkpoint contains a hidden ASCII flag in the least-significant bits of the fc2.weight tensor. In the PyTorch ZIP archive, this tensor is stored as model/data/2. Reading its float32 values as raw 32-bit words, taking each…"
---

> **Qiangwang Mimic Defense 2026 Quals · Misc · easy · 350 pts**

## Summary

The checkpoint contains a hidden ASCII flag in the least-significant bits of the `fc2.weight` tensor. In the PyTorch ZIP archive, this tensor is stored as `model/data/2`. Reading its float32 values as raw 32-bit words, taking each word's lowest bit, and packing those bits most-significant-bit first reveals a two-byte length prefix followed by the flag.

## Solution

### Step 1: Extract the hidden bits

A PyTorch `.pt` checkpoint can be inspected as a ZIP archive without loading the model. The tensor data is read directly and interpreted as little-endian unsigned 32-bit words so the float bit patterns remain intact.

```python
import zipfile
import numpy as np

with zipfile.ZipFile("model.pt") as archive:
    tensor_bytes = archive.read("model/data/2")

words = np.frombuffer(tensor_bytes, dtype="<u4")

# One hidden bit per float32 value, packed MSB-first into each output byte.
bits = "".join(str(int(word) & 1) for word in words)
packed = bytes(
    int(bits[i:i + 8], 2)
    for i in range(0, len(bits) - 7, 8)
)

# The first two bytes are a big-endian length: 0x0027 = 39.
length = int.from_bytes(packed[:2], byteorder="big")
message = packed[2:2 + length].decode("ascii")

print(f"Header: {packed[:2]!r}")
print(f"Length: {length}")
print(f"Message: {message}")
```

Output:

```text
Header: b"\x00'"
Length: 39
Message: flag{[REDACTED]}
```

### Step 2: Why the weights looked ordinary

Changing a float32 value's least-significant bit changes it by at most a small amount tied to that value's exponent—about one unit in the last place. For weights near unit scale, that is roughly `1e-7`. Such small perturbations are not obvious in a normal weight-distribution inspection.

Inspecting the archive maps `model/data/2` to `fc2.weight`; the other five tensors carry only noise in their low bits. The model was not run; extraction used the checkpoint's raw tensor bytes and NumPy rather than PyTorch.
