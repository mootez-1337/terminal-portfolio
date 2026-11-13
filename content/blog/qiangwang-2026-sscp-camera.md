---
title: "Qiangwang 2026 — Smart Surveillance Camera — Remote PTZ Control"
date: "2026-10-31"
tags: ["qiangwang-2026", "pwn", "iot", "auth-bypass"]
excerpt: "The flag was displayed on an acceptance whiteboard outside the camera's current field of view. The solve found an empty-password factory account to get a media-service foothold, pulled firmware revealing the PTZ control…"
---

> **Qiangwang Mimic Defense 2026 Quals · Pwn · medium · 521 pts**

## Summary

The flag was displayed on an acceptance whiteboard outside the camera's current field of view. The solve found an empty-password factory account to get a media-service foothold, pulled firmware revealing the PTZ control protocol, exploited a length-controlled digest comparison in the UsernameToken verifier to authenticate with a one-character digest, and then panned the camera to read the flag off the whiteboard.

## Solution

### Step 1: Map the service surface

The exposed device services were proxied through the challenge host:

| Device port | Role | Authentication |
|---:|---|---|
| 80 | Read-only console/live view | Session cookie |
| 443 | Device API | `X-Session` |
| 2020 | SSCP PTZ control | WS-Security UsernameToken |
| 8800 | Media, diagnostics, firmware | SHA-256 HTTP Digest |

This was a protocol-logic challenge: get a foothold in the media service, inspect the firmware for the control protocol, then exploit the verifier to move the camera.

### Step 2: Empty-password media foothold

The factory account table included `hub_primary_2` with an empty password. Its Digest HA1 was `SHA256("hub_primary_2:TPC260:")`. Authenticating with the empty password unlocked media endpoints such as `/preview` and `/diagnostic`. The diagnostic bundle contained `vscp_dev.bin`, a stripped ARM ELF with the `verify_username_token` checker, while `camera_acc`'s actual password remained masked.

The firmware confirmed the WS-Security UsernameToken digest construction:

```
Base64(SHA1(Base64Decode(Nonce) || Created || Password))
```

### Step 3: Exploit the length-controlled digest comparison

The verifier compared only `strlen(provided_digest)` bytes against the calculated Base64 digest. It did not require the supplied value to be the same length as the expected digest. Therefore a one-character string matching the first Base64 character was enough to pass.

The nonce was reusable, so the solve tested the 64 Base64 alphabet characters against a harmless status operation. The character `m` passed. With username `camera_acc`, a fixed nonce, and a fixed `Created` timestamp, the one-character digest could then authorize a PTZ operation.

### Step 4: Pan and read the board

An authenticated `AbsoluteMove` set pan to `172.5` and tilt to `10.0`. Fetching `/preview` after the move returned the rendered camera image. The acceptance board in the frame displayed the flag, which was then submitted.

## Notes

- Compare authentication digests in constant time and require exact, canonical lengths.
- Do not reuse nonces for UsernameToken validation.
- Firmware and diagnostics endpoints often reveal enough protocol detail to test the live verifier precisely.
