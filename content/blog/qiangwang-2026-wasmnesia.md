---
title: "Qiangwang 2026 — Wasmnesia"
date: "2026-10-31"
tags: ["qiangwang-2026", "reverse", "ssrf", "wasm"]
excerpt: "This challenge chained a web-accessible artifact fetcher (SSRF) with an obfuscated WebAssembly transform and a redrive workflow. The solve recovered an internal export via SSRF, reversed the WASM transform to find a…"
---

> **Qiangwang Mimic Defense 2026 Quals · Reverse · medium · 415 pts**

## Summary

This challenge chained a web-accessible artifact fetcher (SSRF) with an obfuscated WebAssembly transform and a redrive workflow. The solve recovered an internal export via SSRF, reversed the WASM transform to find a known-plaintext seed, decoded an audit log pointing at a redrive endpoint, injected a shell command through it, and escalated to root via a writable Python import path hijacking a SUID helper.

## Solution

### Step 1: Fetch the internal artifact via SSRF

After logging in as `reviewer@edgeledger.test`, `/api/v1/connectors/fetch` was used as an SSRF primitive. The URL form `http://preview.reports.local@127.0.0.1:9090/...` exploited a mismatch in how the host was interpreted: the remote side of the userinfo `@` resolved to the internal cache service. The fetch returned the mirrored `formal.wexp`, using the challenge's job and tenant parameters (including `job_id=2692446822` and `tenant_tag=3995540072`).

### Step 2: Reverse the WebAssembly transform

The module `ledger_shift.wasm` implemented `mix32`, `derive_seed`, and `transform_batch`. Reversing these routines showed that the ARM64 host and browser disagreed about a context word. That difference provided a known-plaintext foothold: the `EIPC` header in the export was known, so the 32-bit transform seed could be searched until the transformed output matched it. The seed was `0x93b7218f`.

Applying the inverse transform recovered the EIPC audit log. It disclosed the redrive endpoint `/api/v1/operations/redrives`, execution ID `job-f1234001`, generation `3`, expected input hash beginning `a69927…`, and profile `archive-jsonl`.

### Step 3: Redrive injection and privilege escalation

The redrive endpoint accepted a `profile` value that was passed into a shell command without safe argument handling. Appending a shell command to `archive-jsonl` yielded command execution as `uid=1001(ctf)` with stdout included in the JSON response.

The container had a SUID-root helper at `/usr/local/bin/edge-health`. It ran Python with `PYTHONPATH=/app/workspace:/opt/edge`, and `/app/workspace` was writable by the `ctf` user and came first in the import path. Planting a replacement `edge_health` module there caused the privileged helper to import attacker-controlled code. The resulting process ran as root and read `/root/flag`.

## Notes

- SSRF defenses must validate the parsed destination, not substring-match the URL.
- Cross-runtime serialization or integer-context differences can expose known-plaintext checks for custom transforms.
- Shell command construction and writable Python import paths are separate escalation points; fixing one does not repair the other.
