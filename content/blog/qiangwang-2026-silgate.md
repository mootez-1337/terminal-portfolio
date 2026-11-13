---
title: "Qiangwang 2026 — SilGate (产线之门)"
date: "2026-10-31"
tags: ["qiangwang-2026", "pwn", "automotive", "uds"]
excerpt: "The target was a virtual ECU reached over TLS/DoIP/ISO-TP/UDS. The solve restored a hidden legacy diagnostic channel via an empty-credential activation path, solved a xorshift16-based seed/key exchange to unlock privileged…"
---

> **Qiangwang Mimic Defense 2026 Quals · Pwn · medium · 476 pts**

## Summary

The target was a virtual ECU reached over TLS/DoIP/ISO-TP/UDS. The solve restored a hidden legacy diagnostic channel via an empty-credential activation path, solved a xorshift16-based seed/key exchange to unlock privileged diagnostic services, then used an absolute ReadMemoryByAddress (RMBA) UDS service to pull a staged master-key secret and reversed a known-plaintext transformation to recover the flag.

## Solution

### Step 1: Map the protocol stack and attack surface

The protocol stack was DoIP (ISO 13400), then ISO-TP (ISO 15765-2), then UDS (ISO 14229). A valid TCP/TLS connection is only the carrier: requests still need DoIP framing, and UDS messages may need ISO-TP segmentation. The challenge described a burned-in production master and a hidden legacy channel, suggesting that the intended route was diagnostic state progression rather than a conventional memory-corruption bug.

The practical debugging approach was to separate transport from application protocol: establish TLS, verify DoIP framing and version bytes, then test UDS session/security services. Early attempts that assumed the normal DoIP version or focused only on a generic TCP probe did not reach the intended handler.

### Step 2: Reach the legacy channel

The solve used the empty-credential activation path to enter the diagnostic flow and restore the legacy channel. The legacy path accepted DoIP protocol version `0x02` and used a xorshift16-based seed/key exchange. Reproducing the challenge's seed/key calculation unlocked the privileged diagnostic services.

### Step 3: Recover the staged secret

After the legacy unlock, the ECU staged the master-key flag at `download_buf + 0x1000`. The service exposed an absolute ReadMemoryByAddress operation (RMBA), so the solve requested that exact address rather than trying to infer the secret from a banner or brute-force the protocol.

The recovered buffer was not the final printable flag as-is. The challenge's flash routine applied a known-plaintext transformation. Using the known bytes in the routine, the transformation was reversed over the returned buffer to recover the live token, which was submitted successfully.

## Notes

- Debug protocol layers in order: TLS, DoIP, ISO-TP, then UDS.
- A documented legacy mode is a likely downgrade/compatibility boundary.
- If an absolute memory-read service becomes available after authentication, use the disclosed staging address and reverse the routine's transformation locally.
