---
title: "Qiangwang 2026 — Handoff"
date: "2026-10-31"
tags: ["qiangwang-2026", "pwn", "heap", "protocol"]
excerpt: "A black-box JSON-lines-over-TCP authentication platform (Identity Authority, Session Broker, Protected Resource) was broken via a session-identity confusion bug that opened a privileged migration channel, chained into a…"
---

> **Qiangwang Mimic Defense 2026 Quals · Pwn · medium · 554 pts**

## Summary

A black-box JSON-lines-over-TCP authentication platform (Identity Authority, Session Broker, Protected Resource) was broken via a session-identity confusion bug that opened a privileged migration channel, chained into a fixed-capacity record overflow in an export routine to corrupt a session's bound identity and obtain the protected flag resource.

## Solution

### Step 1: Protocol overview

The chain scored 80/100 points (Stages 1–4 of 5); a final "submit a patched, secure server" bonus stage was attempted but not completed.

The target was a black-box JSON-lines-over-TCP authentication platform modeling an Identity Authority, a Session Broker, and a Protected Resource. Every message is authenticated with `HMAC(K_id, "<LABEL>" || field || field || ...)`, where each field is 4-byte-big-endian length-prefixed, and `K_id = HMAC(MASTER, "userkey:" || id)` is handed out at `REGISTER`. The connection itself auto-negotiates plaintext vs. TLS by sending a raw `{"op":"PING"}` and falling back to a TLS `wrap_socket(..., server_hostname=host)` if the plaintext probe gets no response — omitting `server_hostname` caused early, silent connection failures due to SNI-based routing on the challenge infrastructure.

### Step 2: Bug 1 — RETRY identity confusion opens the migration channel

The first bug is in `RETRY`: its `rtag` is verified against the session's *current* bound identity's key, but the server then blindly overwrites the session's *displayed* identity with whatever `id` the request claims. Proving "I am still the identity I already am" is accepted by the server as authorization to become *any* identity, including the reserved `ops` account — which has no issued key and therefore could never authenticate through the normal `REGISTER`/`CHAL`/`AUTH` flow. Because `MIGRATE` is gated purely on that displayed identity rather than on possession of `ops`'s key, this single `RETRY` call alone opens the migration channel to an attacker who never registered as `ops`.

### Step 3: Bug 2 — MIGRATE export fixed-capacity overflow

The second bug is in `MIGRATE export`: it snapshots a session's entire renewal history into a fixed-capacity record sized for `CAP` entries, but copies every renewal regardless of count. `RENEW` writes two parallel 8-byte-element arrays — `clk[i]` at `hist + 8*i` and `note[i]` at `hist + 8*n + 8*i` (where `n` is the number of renewals so far) — so with `n` renewals the attacker-controlled 8-byte "operator notes" form one contiguous block over `[8n, 16n)`. The record itself is pinned immediately above that notes region, at offset `16 * min(n, CAP)`, laid out as `+0` chunk header, `+16` record field, `+24` `identity[16]` (the overwrite target), `+40` `assertion[64]` (ASCII hex). The critical window is `n = CAP + 3`: at that exact count, the notes span `[16*CAP+24, 16*CAP+48)`, which overlaps the full 16-byte identity field plus the first 8 bytes of the assertion field. Supplying note bytes that spell `"flagadmin"` for the identity slice, while reproducing the session's own real assertion bytes for the overlapping assertion prefix, lets `commit`'s assertion-equality check pass while the identity field is corrupted to `flagadmin`; `commit` then rebinds the session to that identity, and `ACCESS` releases the protected resource.

### Step 4: Determining CAP and offsets at runtime; the template-capture gotcha

`CAP` and every structural offset are instance-specific and were discovered at runtime rather than hardcoded, via a `probe_capacity()` routine that performs successive `export`/`hist` reads and searches the dumped memory window for the session's own assertion string to locate the record's base address. A key technique is that the "clean" template bytes needed to preserve the untouched parts of the record during the overflow must be captured from a **separate, throwaway session** that performs exactly `CAP` ordinary renewals; attempting to capture that template mid-stream inside the same session being overflowed does not work, because by the time the capacity is known the relevant renewal slots are already permanently fixed. (An independent reimplementation that tried the mid-session capture never recovered `flagadmin`.)

### Step 5: Exploit script and live run

The full exploit — `probe_capacity()` → `read_template()` (from the throwaway session) → `take_resource()` (building all `CAP+3` renewal notes in advance from the template plus the target identity and the live session's own assertion, then renewing, re-running the `RETRY`-to-`ops` trick, exporting, verifying via `hist`, and finally `commit` + `ACCESS`) — is a single Python 3 stdlib script (`socket`/`ssl`/`hmac`/`hashlib`/`json`, no external dependencies).

A real run against the live instance printed:

```text
[*] capacity 16 entries, structure pinned at +256
[*] template: field=1600000000000000 identity=b'ops'
{"ok": true, "op": "GRANTED", "id": "flagadmin", "resource": "flag{[REDACTED]}"}
```

This is the accepted flag for this challenge.
