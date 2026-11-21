---
title: "CSAW Finals 2026 — Aircrypt: a TOCTOU in µTESLA Key Disclosure"
date: "2026-11-13"
tags: ["csaw-finals-2026", "crypto", "tesla", "toctou"]
excerpt: "A µTESLA broadcast-authentication scheme had one sign flipped in its accept-window check, so a frame stayed valid even after its epoch key became public. A disclosed key from the provided capture was enough to produce a valid MAC."
---

> **CSAW CTF 2026 Finals · Crypto · 500 pts**
> **Flag:** `csaw{t0ct0u_on_m1cr0tesla_1s_wh4t_fl1es_the_gh0st-49eb93237a6e281a}`

## The scheme

The challenge is a µTESLA-style broadcast authenticator exposed over TCP (port 4001), with
a sample capture log provided. µTESLA is the standard delayed-disclosure MAC for constrained
broadcast: time is split into epochs (500 ms here), each epoch `e` has a key `K_e` drawn
from a one-way hash chain, a message sent in epoch `e` is MACed with `K_e`, and `K_e` is
only **disclosed after** the epoch ends. A receiver buffers a message until the matching key
is released, then checks the MAC. Security depends entirely on one rule: a message must
arrive **before** its key is disclosed. Otherwise anyone who has seen the disclosed key can
forge it.

## The bug

The receiver's accept-window check had the delayed-disclosure comparison inverted — the
threshold was computed as `disclosure_time + SIGMA` where the spec requires
`disclosure_time − SIGMA`. The effect: a frame was accepted **even after** its epoch key had
already been disclosed. That is a time-of-check / time-of-use error on the one invariant the
whole scheme rests on.

With the receiver clock fixed at `g_now_us = 151_250_000` (epoch 302.5), the accept window
worked out to epochs 298–302. Keys disclosed with timestamp ≤ now meant the newest usable
key was `K_298`, disclosed at `151_000_000` — and that key is present in the provided
capture trace.

## Forging the frame

The MAC construction (recovered from the shipped firmware):

```
mac_key = SHA3-256(K_epoch || ICAO)[:8]
PI      = HMAC-SHA3-256(mac_key, frame[:11])[:3]
```

The 14-byte frame is `DF(0x8D) | ICAO(3) | EPOCH(2 BE) | TC_FLAGS(1) | PAYLOAD(4) | PI(3)`.
Taking `K_298` straight out of the capture, computing `mac_key` for the target ICAO
`0xDEAD01`, and appending the 3-byte `PI` produced a frame the receiver accepted, firing the
canary.

```python
TARGET_ICAO = bytes.fromhex("DEAD01")

def forge(k_epoch, epoch, payload=b"\x00\x00\x00\x00", tc_flags=0x00):
    mac_key = hashlib.sha3_256(k_epoch + TARGET_ICAO).digest()[:8]
    frame = bytes([0x8D]) + TARGET_ICAO + epoch.to_bytes(2, "big") + bytes([tc_flags]) + payload
    pi = hmac.new(mac_key, frame, hashlib.sha3_256).digest()[:3]
    return (frame + pi).hex()

# K_298 read from the provided capture trace (disclosure ts <= receiver clock)
print(forge(K_298, 298))
```

Connecting, sending the forged frame, and reading the response returned the flag.

## Lesson

Delayed-disclosure authentication is only as good as the "received before disclosed" check.
A single flipped sign turns the entire scheme into plaintext replay: once the key is public,
anyone can MAC anything. The fix is to reject any frame whose claimed epoch key could already
have been released by the receiver's own clock.
