---
title: "CSAW 2026 — Low Tide: A Time-Sensitive SCADA Proxy Chain"
date: "2026-09-20"
tags: ["csaw-2026", "web", "scada", "recon"]
excerpt: "A six-stage chain behind a load balancer where only one of four workers serves the relay, the clock must be re-synced before every request, and a catch-all route manufactures false positives."
---

**Flag:** `csaw{time_sensitive_scada_proxy_chain}`
(server emits `CSAW{...}` uppercase; submit lowercase)

## Architecture

| component | host | role |
|---|---|---|
| frontend | `low-tide.ctf.csaw.io` | static nginx — decoy login page (`action="#"`) |
| backend  | `low-tide-lb.ctf.csaw.io` | gunicorn/Flask, all real behaviour |
| ALB      | `web-alb-prod-680046691…` | both names resolve here |

Four station workers sit behind the ALB with different simulated clocks
(st-01 2018, st-02 2015, st-03 2016, **st-04 2019-03**). **Only st-04 serves the relay.**

## Chain

1. **`/assets/app.js`** — ROT47 → hex → base64 → `GATEWAY = …/station/checkin`.
   Two hex tokens lost a digit to corruption (`6`→`61`, `3`→`31`); base64 alignment repairs them.
2. **`robots.txt`** — comments leak five agents; only `StationSync-Agent/2.1` is accepted.
   (Its `Disallow` paths are decoys — they 404 under every agent.)
3. **Gateway auth** — `token=probe` leaks the worker's clock;
   `token = md5(sid + str(int(station_epoch)))`.
4. **Virtual FS** — `POST /station/checkin/api/v1/<st>/<path>` (POST only).
   `station.log` → unlisted `.logs/err_3005.log` → `config/relay_chat.js` → `config/sync.conf`,
   which documents the chat auth.
5. **Chat bridge** — `GET /station/checkin/api/v2/chat?id=N`,
   `Authorization: Bot md5(station_id + %b%d%y%H%M lowercase)`. 60 messages; 45–60 are the briefing:
   relay key `4f9a-77c2-e01d`, admin box `10.10.14.31`, raise/lower only,
   and "swings too far either direction throw a hard alarm".
6. **Relay** — `POST /station/checkin/relay` on st-04:

```
User-Agent:      StationSync-Agent/2.1
Authorization:   Bot md5(station_id + stamp)
X-Relay-Key:     4f9a-77c2-e01d          <- HEADER, not a form field
X-Relay-Target:  http://10.10.14.31/     <- scheme + trailing slash
body: action=checkin & token=md5(sid+epoch) & cmd=CMD:WATER:LOWER:50
```

Draining trips `LOW LEVEL` and releases the flag.

## Error ladder (tells you exactly which gate you're at)

| response | meaning |
|---|---|
| long `code_mismatch` + frozen 2019-01-02 clock | wrong User-Agent |
| short `code_mismatch` | stale/missing gateway token |
| `relay_auth_failed` | missing/wrong `X-Relay-Key` |
| `invalid_relay_target` | missing/wrong `X-Relay-Target` |
| `invalid_command` | no usable `cmd` |
| `unsupported_action` | **wrong worker** — re-pin, NOT a real result |
| `accepted` + `relay{}` | success |

## Why it resisted (the four traps)

1. **The parameter is `cmd`** — not `command`/`action`/`op`, and not a header.
   ~45 names and ~60 values were burned before the author's hint.
2. **`action` stays `checkin`.** `action=raise` diverts into a branch that never reaches
   the token check, so a *correct* token looks wrong (`code_mismatch`) — this sent a long
   brute-force effort down a dead end chasing action-bound token formulas.
3. **Key and target are headers.** Form `key`/`relay_key` return `relay_auth_failed` forever.
4. **Station drift.** Only st-04 serves `/relay`; connections re-balance mid-session, so the
   other workers answer identical requests with `unsupported_action` — manufacturing false
   negatives. Treat it as "wrong worker, retry" and verify `station_id` on the same connection.

## Two false positives worth recording

- **`/relay/raise` returning `accepted` is NOT success.** `/station/checkin/<anything>` is a
  catch-all that returns the same `accepted` body for any path — even `/relay/zzznonsense`,
  even with no relay headers. Always run a nonsense control.
- **Random 502s** appeared on `/field/checkin` and once on `cmd=water_level`. Neither
  reproduced. Infra blips, not signal.

## Also: the clock must be re-synced before every attempt

The station clock advances 1s/s and a stale token returns `code_mismatch`, which is
indistinguishable from a wrong credential. This masked `X-Relay-Key` on the first pass and
made it look dead. Probe → re-read `sync_time` → recompute, immediately before each request.
