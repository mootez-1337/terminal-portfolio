---
title: "Qiangwang 2026 — Off the Curve"
date: "2026-10-31"
tags: ["qiangwang-2026", "crypto", "ecc", "jwt"]
excerpt: "The service exposed diagnostics protected by JWT authentication and a tag oracle involving a registered legacy public key. The path was to obtain diagnostics access, then test whether the legacy key parser enforced curve…"
---

> **Qiangwang Mimic Defense 2026 Quals · Crypto · easy · 368 pts**

## Summary

The service exposed diagnostics protected by JWT authentication and a tag oracle involving a registered legacy public key. The path was to obtain diagnostics access, then test whether the legacy key parser enforced curve membership. It did not, allowing invalid-curve points with small subgroup orders to reveal residues of the server's private scalar.

## Solution

### Step 1: Forge access to the oracle

The gateway used an asynchronous `kid` resolver. For an unknown key ID, the resolver returned an empty key instead of rejecting the token. HS256 verification with the empty secret therefore accepted a forged admin JWT. The resulting token enabled `/api/v1/diagnostics/compat`.

### Step 2: Invalid-curve queries

The oracle formed a tag from the server's private scalar multiplied by a supplied legacy point. The legacy compressed-key validation accepted points without checking that they lay on the intended curve. The selected off-curve points landed in small subgroups, making the possible scalar multiples enumerable.

Queries against four points recovered:

| Point order | Private-scalar residue |
|---:|---:|
| 3257 | 975 |
| 4079 | 2559 |
| 3863 | 1891 |
| 2843 | 2239 |

The moduli were combined with the Chinese Remainder Theorem, yielding `serverPriv_v3 = 1383411725` in the recovered range. This was sufficient to derive the secret used to decrypt report `rpt-042`.

### Step 3: Recover the flag

The decrypted report stated that legacy compressed-key validation diverged from curve membership and included the recovery token. The token was submitted to the challenge, which marked the solve complete.

Lessons learned:

- JWT key resolution is part of the trust boundary; an unknown `kid` must fail closed.
- Compressed-point parsing must validate curve membership and subgroup assumptions.
- Small-subgroup oracle results can be combined with CRT to reconstruct a scalar modulo the product of subgroup orders.
