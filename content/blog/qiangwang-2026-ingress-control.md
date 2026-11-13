---
title: "Qiangwang 2026 — Ingress Control"
date: "2026-10-31"
tags: ["qiangwang-2026", "web", "rce", "kubernetes"]
excerpt: "A Frigate-style NVR/camera management backend trusted unvalidated reverse-proxy auth headers to grant admin, which was chained with a YAML-type confusion bug in a go2rtc stream-source sanitizer to achieve command execution…"
---

> **Qiangwang Mimic Defense 2026 Quals · Web · medium · 541 pts**

## Summary

A Frigate-style NVR/camera management backend trusted unvalidated reverse-proxy auth headers to grant admin, which was chained with a YAML-type confusion bug in a go2rtc stream-source sanitizer to achieve command execution, then pivoted through Kubernetes service-account tokens across namespaces to reach the flag secret.

## Solution

### Step 1: Admin via trusted proxy headers

The target was a Frigate-style NVR/camera management backend fronted by its own reverse-proxy auth mode, which delegates authentication to an external proxy via the trusted headers `X-Forwarded-User` and `X-Forwarded-Groups`. Nothing in front of the app actually stripped or validated those headers, so sending `X-Forwarded-User: attacker` and `X-Forwarded-Groups: admin` directly on requests to the backend was enough to become admin with zero credentials. This was confirmed by `GET /api/config/raw`, `GET /api/users`, and `GET /api/logs/*` all returning `200` with those two headers alone, exposing the full live configuration, user list, and service logs (Frigate, nginx, go2rtc).

### Step 2: Dead end — go2rtc `exec:` source is blocked by default

With admin access established, the natural next step was `POST /api/config/save` / `save_option=restart` to push a modified config, pairing it with a go2rtc stream using an `exec:` source — a known real-world issue (tracked here as CVE-2026-25643) where go2rtc does not sandbox the `exec:` directive and an authenticated admin can run arbitrary commands. This path was initially a dead end: go2rtc's own startup log showed `"[ERROR] Stream 'pwn' item 1 uses a restricted source (echo/expr/exec) which is disabled by default... Set GO2RTC_ALLOW_ARBITRARY_EXEC=true to enable arbitrary exec sources."` A fair amount of time was then spent on a detour into go2rtc's `${VARNAME}` environment-variable substitution and SSRF-driven error-log leakage, which turned out to be overthinking and was not the intended path.

### Step 3: Sanitizer bypass via YAML dict stream entry

The actual bypass was in the config-sanitizer itself (`create_config.py`). Its guard function was:

```python
def is_restricted_source(stream_source: str) -> bool:
    return stream_source.strip().startswith(("echo:", "expr:", "exec:"))
```

This check is only ever invoked against `str`- and `list`-typed stream entries — it never handles the case where a stream is defined as a YAML **dict**. Writing a stream as `{url: "exec:..."}` instead of a bare string slips past `is_restricted_source()` completely and reaches the live go2rtc config unfiltered.

### Step 4: Build the malicious config and trigger execution

The exploit built a config containing `go2rtc.streams.leak: {url: "exec:/bin/sh -c 'echo $B64 | base64 -d | python3 - 1>&2'"}`, where `$B64` was the base64 of a small Python payload, and pushed it via `POST /api/config/save?save_option=restart` with the forged `X-Forwarded-User`/`X-Forwarded-Groups: admin` headers. After the restart, the stream was actually invoked by hitting the admin-only SSRF/ffprobe endpoint with `GET /api/ffprobe?paths=http://127.0.0.1:1984/api/stream.mp4?src=leak`, which made go2rtc resolve the `leak` stream and execute the embedded shell command as the `media` user. Since the process had no direct HTTP response channel, output was exfiltrated via `@@...@@`-delimited stderr markers that landed in `GET /api/logs/go2rtc`.

### Step 5: Kubernetes pivot to the flag secret

The RCE payload itself did not cat a flag file — it pivoted into Kubernetes. Running as `media` inside the pod, it read the in-cluster service-account token from `/var/run/secrets/kubernetes.io/serviceaccount/token` and used it as a Bearer token against the Kubernetes API server on `127.0.0.1:6443` to call `GET /api/v1/namespaces/edge-ns/secrets`. Decoding the base64 secret data from that response yielded a second, more privileged "relay" token, which was then used as the Bearer credential for `GET /api/v1/namespaces/camera-ns/secrets/fleet-attestation`. Base64-decoding that secret's data produced the flag directly. The flag was submitted and accepted (608 points).
