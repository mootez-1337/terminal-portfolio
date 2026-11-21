---
title: "CSAW Finals 2026 — Lost in Embedding: Inverting a Sentence Vector"
date: "2026-11-13"
tags: ["csaw-finals-2026", "misc", "ai-security", "embeddings"]
excerpt: "A deleted record left only its 384-d sentence-transformer vector. Because the encoder was pinned and reproduced stored vectors exactly, the original text was recovered by coordinate-ascent cosine matching instead of a 48^4 brute force."
---

> **CSAW CTF 2026 Finals · Misc · 500 pts**
> **Flag:** `csaw{d0_0r_d0_n0t_th3r3_1s_n0_try-edd03123cf9f06b9}`

## The setup

A "museum heist" incident export. A deleted record, `TR-7842`, left behind only its 384-d
embedding vector (`TR-7842.npy`). The sentence that produced it followed a fixed template
with four slots — painting, room, container, window — each drawn from a CSV of 48 candidate
labels:

```
"{painting} was transferred to the {room} inside a {container},
 with access scheduled during the {window}."
```

Four slots × 48 options is `48^4 ≈ 5.3M` combinations. That is brute-forceable, but there's
a far cleaner path.

## Why inversion is exact here

The export pinned the encoder: `sentence-transformers/all-MiniLM-L6-v2` at a fixed revision,
mean-pooling plus L2 normalization. Running that exact model reproduces the stored vectors
**bit-for-bit**, so this isn't approximate embedding inversion — it's an exact search over a
tiny structured space. The target sentence is the one combination whose embedding has cosine
similarity `1.0` with the stored vector.

## Coordinate ascent

Instead of embedding all 5.3M sentences, I used coordinate ascent: hold three slots fixed,
sweep the fourth for the candidate that maximizes cosine to the target, then move to the next
slot and repeat. A handful of random restarts avoids any local maximum. Each full solve
embeds only `4 × 48` sentences per sweep and converges to cosine `≈ 1.0` — the exact slot
combination.

```python
def best_for_slot(cur, slot):
    texts = [render_with(cur, slot, j) for j in range(len(FIELDS[slot]))]
    sims = embed(texts) @ target          # target is L2-normalized
    j = int(sims.argmax())
    return j, float(sims[j])

for start in restarts:
    cur = start
    for _ in range(8):
        for slot in range(4):
            j, s = best_for_slot(cur, slot)
            cur[slot] = j
        if converged(s): break
```

Once the four IDs were recovered (cosine `> 0.99999`), POSTing them to `/api/submit` returned
the flag.

## Lesson

An embedding is not anonymization. When the encoder is known and the plaintext space is
small and structured, the vector is effectively reversible — here the template and the
48-option slots collapsed a "deleted" record back into exact text with a few hundred model
calls.
