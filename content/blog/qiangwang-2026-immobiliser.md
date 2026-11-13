---
title: "Qiangwang 2026 — Immobiliser"
date: "2026-10-31"
tags: ["qiangwang-2026", "crypto", "ecdsa", "lattice"]
excerpt: "The vehicle-end anti-theft authorization chip leaked forty secp256k1 ECDSA signatures whose nonces were all biased below 2^248; recovering the private key via a Hidden Number Problem / lattice (LLL) attack and hashing it…"
---

> **Qiangwang Mimic Defense 2026 Quals · Crypto · medium · 478 pts**

## Summary

The vehicle-end anti-theft authorization chip leaked forty secp256k1 ECDSA signatures whose nonces were all biased below `2^248`; recovering the private key via a Hidden Number Problem / lattice (LLL) attack and hashing it unlocked an XOR-sealed flag.

## Solution

### Step 1: Identify the weakness

The vehicle-end anti-theft authorization chip leaked forty sets of secp256k1 ECDSA signatures. The archive also includes the public key and a sealed value.

ECDSA requires each signing nonce to be secret and uniformly random. Here, all 40 nonces are below `2^248`, so their most significant byte is zero. This small per-signature bias is enough to recover the signing key with a Hidden Number Problem lattice attack.

### Step 2: Recover the private key via HNP/LLL

For each signature `(r_i, s_i)` over message hash `h_i`, the ECDSA relation is:

```text
s_i k_i = h_i + r_i d (mod n)
```

where `d` is the private key and `k_i` is the nonce. Rearrange it as:

```text
t_i = r_i / s_i (mod n)
u_i = h_i / s_i (mod n)
k_i = t_i d + u_i (mod n)
```

The nonce bound `0 < k_i < B`, with `B = 2^248`, turns these equations into a Hidden Number Problem. Construct a lattice from all 40 equations and reduce it with LLL. The short vector reveals the private key.

The recovered key reproduces the supplied public key. Reconstructing the nonces confirms that all 40 are below `2^248`; each nonce also reproduces its signature's `r` value. All 40 signatures verify with SHA-256.

### Step 3: Decrypt the sealed value

The sealed bytes are XORed with SHA-256 of the private key encoded as 32 big-endian bytes:

```python
mask = hashlib.sha256(d.to_bytes(32, "big")).digest()
flag = bytes(a ^ b for a, b in zip(sealed, mask))
```

This decrypts to `flag{top_byte_of_the_nonce}`.

