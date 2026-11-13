---
title: "Qiangwang 2026 — Premaster"
date: "2026-10-31"
tags: ["qiangwang-2026", "crypto", "rsa", "bleichenbacher"]
excerpt: "A \"legacy RSA PKCS#1 v1.5 handshake\" TCP service encrypted a fixed flag with fresh random padding on every connection and exposed a strict-validity oracle over the resulting ciphertext. The oracle, combined with a free step-2a…"
---

> **Qiangwang Mimic Defense 2026 Quals · Crypto · easy · 378 pts**

## Summary

A "legacy RSA PKCS#1 v1.5 handshake" TCP service encrypted a fixed flag with fresh random padding on every connection and exposed a strict-validity oracle over the resulting ciphertext. The oracle, combined with a free step-2a multiplier handed to us in the banner, made this a cheap textbook Bleichenbacher (1998) padding-oracle attack against RSA-2048.

## Solution

### Step 1: The target

We get `pubkey.json` (RSA-2048, `e = 65537`) and `server.py`, a "legacy RSA
PKCS#1 v1.5 handshake" TCP service reached over TLS (`ncat --ssl HOST <port>`).

On each connection the server builds one padded block from the (fixed) flag and
a **fresh** random padding string:

```
m  = 00 02 || PS || 00 || FLAG          (PS = random, no 0x00 bytes, >= 8 long)
c  = m^e mod n
```

and sends a banner:

```
session <c_hex> <s_dec>
```

Then it loops forever as an oracle: one hex ciphertext per line, replying

```
ok    if  RSA^-1(c) is a valid PKCS#1 v1.5 type-02 block
bad   otherwise
```

The validity test (`is_pkcs1_v15`) is the strong form — it requires the leading
`00 02`, at least 8 non-zero padding bytes, **and** a `00` delimiter somewhere
after them:

```python
if em[0] != 0x00 or em[1] != 0x02: return False
i = 2
while i < k and em[i] != 0: i += 1
return 10 <= i < k
```

That single accept/reject bit is the whole vulnerability: it is a textbook
**Bleichenbacher (1998)** padding oracle.

### Step 2: Two gifts from the server

Reading `server.py` closely, the service hands us two things that make the
attack much cheaper than a blind Bleichenbacher:

1. **A free step-2a multiplier.** `first_conforming_multiplier()` computes the
   smallest `s >= ceil(n / 3B)` such that `m*s mod n` is still conforming, and
   prints it in the banner as `s`. In Bleichenbacher's paper that search (step
   2a) is one of the expensive phases; here it is done for us. We start directly
   at step 3 with `s1 = s`.

2. **A stateless oracle.** `decrypt()` + `is_pkcs1_v15()` depend only on the
   private key — not on the connection's own `c`/`s`. So any ciphertext
   `c0 * s^e mod n` can be tested on *any* connection. If the socket drops we
   just reconnect, ignore the new banner, and keep attacking the original `c0`.

With `B = 2^(8·(k-2))` and `k = 256`, a conforming block satisfies
`2B ≤ m < 3B`, so the initial interval is `M = {[2B, 3B-1]}`.

### Step 3: The attack

Standard Bleichenbacher, driven by multipliers:

- **reduce(M, s)** (step 3): for a conforming `s`, every surviving value obeys
  `m·s ≡ t (mod n)` with `2B ≤ t < 3B`, i.e. `m ∈ [⌈(2B+rn)/s⌉, ⌊(3B-1+rn)/s⌋]`
  for each admissible `r`. Intersect with the old intervals and merge.
- **> 1 interval** → step 2b: linear scan upward from the last `s` for the next
  conforming multiplier.
- **1 interval** → narrow it down to a single point.

The naive single-interval phase removes ~1 bit per conforming `s` (≈ 2000 round
trips for RSA-2048). The practical speed-up — "accelerated interval narrowing"
— is a **tiling / fan** step: for the current interval `[a,b]` of width `w`,
pick a base multiplier `s ≈ ⌈2^t·B / w⌉` so that each conforming window is about
`w/2^t` wide, then test, in a single pipelined round trip, a batch of
multipliers whose windows pave `[a,b]`. Whatever comes back `ok` is fed through
`reduce()`, collapsing the interval by ≈ `t` bits at once (`t = 6` here). This
does **not** risk correctness: an `ok` still only asserts `m·s ∈ [2B,3B)`, and
`reduce()` unions over every admissible `r`, so the true `m` is never dropped.

Two engineering details matter against this service:

- **Pipelining.** The oracle answers one line per query in order, so we send a
  whole batch and read the replies back. Naively blasting a megabyte and only
  then reading deadlocks (the server blocks writing replies while we block
  writing requests), so the client interleaves non-blocking `send`/`recv` with
  `select`.
- **Single-threaded backend.** The service handles one connection at a time and
  has no server-side read timeout, so cycling connections carelessly can wedge
  it until an idle timeout frees the stuck session — run one clean session and
  let the reconnect logic handle drops.

### Step 4: Solver

```python
import functools, json, os, select, secrets, socket, ssl, sys, time
print = functools.partial(print, flush=True)
HOST = os.environ.get('TARGET_HOST', '')
PORT = int(os.environ.get('TARGET_PORT', ''))
PUB = os.environ.get('PUB', 'pubkey.json')
STATE = os.environ.get('STATE', 'state4.json')
T_BITS = int(os.environ.get('T_BITS', '6'))
NR = int(os.environ.get('NR', '8'))
MAXQ = int(os.environ.get('MAXQ', '6000'))
LIN_BATCH = int(os.environ.get('LIN_BATCH', '4096'))
PUBD = json.load(open(PUB))
n, e = (int(PUBD['n']), int(PUBD['e']))
k = (n.bit_length() + 7) // 8
B = 1 << 8 * (k - 2)
twoB, threeB = (2 * B, 3 * B)
ceildiv = lambda a, b: -(-a // b)
NETERR = (ConnectionError, TimeoutError, ssl.SSLError, OSError, socket.timeout)

def is_pkcs1_v15(m):
    try:
        em = m.to_bytes(k, 'big')
    except OverflowError:
        return False
    if em[0] != 0 or em[1] != 2:
        return False
    i = 2
    while i < k and em[i] != 0:
        i += 1
    return 10 <= i < k

class SimOracle:
    """Local stand-in: same modulus, a message we choose, full PKCS check."""

    def __init__(self):
        msg = b'flag{' + secrets.token_hex(16).encode() + b'}'
        ps = bytearray(secrets.token_bytes(k - 3 - len(msg)))
        for i, c in enumerate(ps):
            if c == 0:
                ps[i] = 1 + secrets.randbelow(255)
        self.m = int.from_bytes(b'\x00\x02' + bytes(ps) + b'\x00' + msg, 'big')
        s = ceildiv(n, threeB)
        acc = self.m * s % n
        while not is_pkcs1_v15(acc):
            s += 1
            acc += self.m
            if acc >= n:
                acc -= n
        self.banner_s = s
        self.banner_c = pow(self.m, e, n)
        self.count = self.reconnects = 0
        self.t0 = time.time()

    def test(self, mults):
        self.count += len(mults)
        return [is_pkcs1_v15(self.m * s % n) for s in mults]

    @property
    def rate(self):
        return self.count / max(1e-09, time.time() - self.t0)

class NetOracle:

    def __init__(self):
        self.count = self.reconnects = 0
        self.t0 = time.time()
        self.sock = None
        self.c0 = None
        self.connect()

    def connect(self):
        for attempt in range(80):
            try:
                if self.sock is not None:
                    try:
                        self.sock.close()
                    except OSError:
                        pass
                    self.sock = None
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                raw = socket.create_connection((HOST, PORT), timeout=40)
                raw.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
                sock = ctx.wrap_socket(raw, server_hostname=HOST)
                sock.settimeout(40)
                buf = b''
                while not buf.endswith(b'\n'):
                    chunk = sock.recv(4096)
                    if not chunk:
                        raise ConnectionError('closed before banner')
                    buf += chunk
                parts = buf.split()
                if parts[0] != b'session':
                    raise RuntimeError('bad banner %r' % buf[:64])
                self.banner_c = int(parts[1], 16)
                self.banner_s = int(parts[2])
                sock.setblocking(False)
                self.sock = sock
                self.inbuf = b''
                return
            except Exception as exc:
                print('    [!] connect attempt %d: %r' % (attempt, exc))
                time.sleep(min(3 + attempt, 15))
        raise RuntimeError('could not reconnect')

    def _drive(self, cs):
        out = b''.join((b'%x\n' % c for c in cs))
        need, res, sent = (len(cs), [], 0)
        while len(res) < need:
            want_write = sent < len(out)
            rl, wl, _ = select.select([self.sock], [self.sock] if want_write else [], [], 90)
            if not rl and (not wl) and (not self.sock.pending()):
                raise TimeoutError('oracle stalled')
            if rl or self.sock.pending():
                try:
                    data = self.sock.recv(1 << 16)
                    if not data:
                        raise ConnectionError('oracle closed')
                    self.inbuf += data
                except (ssl.SSLWantReadError, BlockingIOError):
                    pass
                while b'\n' in self.inbuf:
                    line, self.inbuf = self.inbuf.split(b'\n', 1)
                    t = line.strip()
                    if t == b'ok':
                        res.append(True)
                    elif t == b'bad':
                        res.append(False)
                    elif t:
                        raise RuntimeError('unexpected reply %r' % t)
            if want_write and wl:
                try:
                    sent += self.sock.send(out[sent:sent + (1 << 16)])
                except (ssl.SSLWantWriteError, ssl.SSLWantReadError, BlockingIOError):
                    pass
        if len(res) != need:
            raise RuntimeError('oracle desync: %d replies for %d queries' % (len(res), need))
        return res

    def test(self, mults):
        """Stateless queries, so a dropped connection just means resend.

        Reconnecting starts a new session server-side; we ignore its banner and
        keep attacking the original ciphertext, since the oracle depends only
        on the private key.
        """
        cs = [self.c0 * pow(s, e, n) % n for s in mults]
        while True:
            try:
                res = self._drive(cs)
                self.count += len(cs)
                return res
            except NETERR as exc:
                self.reconnects += 1
                print('    [!] oracle died (%r) after %d queries; reconnect #%d' % (exc, self.count, self.reconnects))
                self.connect()

    @property
    def rate(self):
        return self.count / max(1e-09, time.time() - self.t0)

def narrow(M, s):
    out = []
    for a, b in M:
        for r in range(ceildiv(a * s - threeB + 1, n), (b * s - twoB) // n + 1):
            lo = max(a, ceildiv(twoB + r * n, s))
            hi = min(b, (threeB - 1 + r * n) // s)
            if lo <= hi:
                out.append((lo, hi))
    out.sort()
    merged = []
    for iv in out:
        if merged and iv[0] <= merged[-1][1] + 1:
            merged[-1] = (merged[-1][0], max(merged[-1][1], iv[1]))
        else:
            merged.append(list(iv))
    return [tuple(x) for x in merged]

def fan(a, b, t, r_off, nr, maxq):
    """Multipliers whose conforming window tiles [a,b] at resolution ~w/2^t."""
    w = b - a + 1
    s_target = ceildiv((1 << t) * B, max(1, w))
    r0 = (s_target * a - twoB) // n + r_off
    out = []
    for rr in range(max(r0, 0), max(r0, 0) + nr):
        lo = max(ceildiv(twoB + rr * n, b), 1)
        hi = ceildiv(threeB + rr * n, a)
        if hi > lo:
            out.extend(range(lo, min(hi, lo + maxq)))
        if len(out) >= maxq:
            break
    return out[:maxq]

def main():
    sim = '--sim' in sys.argv
    orc = SimOracle() if sim else NetOracle()
    if not sim:
        for _ in range(60):
            Mtry = narrow([(twoB, threeB - 1)], orc.banner_s)
            if len(Mtry) == 1:
                break
            print('[*] %d intervals (s1=%d); reconnecting for a single-interval session' % (len(Mtry), orc.banner_s), flush=True)
            orc.connect()
    c0, s = (orc.banner_c, orc.banner_s)
    if not sim:
        orc.c0 = c0
    print('[*] free step-1 multiplier s1=%d (a brute search would start at %d)' % (s, ceildiv(n, threeB)))
    M = narrow([(twoB, threeB - 1)], s)
    print('[*] after step 1: %d interval(s), width ~2^%d' % (len(M), sum((b - a + 1 for a, b in M)).bit_length()))
    rounds = 0
    step = 0
    t_start = time.time()

    def report(tag):
        w = sum((b - a + 1 for a, b in M)).bit_length()
        el = time.time() - t_start
        print('[%4d] %s ivals=%d width~2^%-5d rounds=%d q=%d (%.0f q/s) %.0fs eta~%.0fs' % (step, tag, len(M), w, rounds, orc.count, orc.rate, el, el / max(1, step) * (w / max(1, T_BITS))))
        if not sim:
            tmp = STATE + '.tmp'
            json.dump({'c0': '%x' % c0, 's': '%x' % s, 'step': step, 'M': [['%x' % a, '%x' % b] for a, b in M]}, open(tmp, 'w'))
            os.replace(tmp, STATE)
    while not (len(M) == 1 and M[0][0] == M[0][1]):
        if len(M) > 1:
            size, cand = (64, s + 1)
            hit = None
            while hit is None:
                block = list(range(cand, cand + size))
                for mult, good in zip(block, orc.test(block)):
                    if good:
                        hit = mult
                        break
                rounds += 1
                cand += size
                size = min(size * 4, LIN_BATCH)
            s = hit
            M = narrow(M, s)
            step += 1
            report('2b')
            continue
        a, b = M[0]
        oks = None
        for attempt in range(60):
            cands = fan(a, b, T_BITS, attempt * NR, NR, MAXQ)
            if not cands:
                continue
            rounds += 1
            res = orc.test(cands)
            got = [c for c, g in zip(cands, res) if g]
            if got:
                oks = got
                break
        if not oks:
            print('[-] fan found nothing at width 2^%d' % (b - a + 1).bit_length())
            sys.exit(1)
        for mult in oks:
            M2 = narrow(M, mult)
            if M2:
                M = M2
        s = max(s, max(oks))
        step += 1
        if step % 20 == 0:
            report('fan')
    m = M[0][0]
    print(' recovered m: %d queries in %d round trips, %.0fs, %d reconnect(s)' % (orc.count, rounds, time.time() - t_start, orc.reconnects))
    if sim:
        pass
    elif pow(m, e, n) != c0:
        sys.exit(1)
    else:
        print('[+] verified m^e mod n == c')
    em = m.to_bytes(k, 'big')
    if not sim:
        open('recovered.bin', 'wb').write(em)
    print(' recovered plaintext: %s' % em[em.index(b'\x00', 2) + 1:].decode('ascii', 'replace'))
if __name__ == '__main__':
    main()
```

### Step 5: Two optimizations that matter

1. **`T_BITS=2` (low tiling resolution).** The tiling step removes ~`T_BITS`
   bits per round trip but the candidate batch it must test grows like
   `~fanout·2^(T_BITS-1)`. The service is **throughput-bound** (~10–20 q/s) and
   **single-threaded** (parallel connections don't help), so wall-clock ≈
   `total_queries / rate` → *fewer queries wins*. Measured in `--sim`:

   | `T_BITS` | oracle queries | round trips |
   |:--------:|:--------------:|:-----------:|
   | 2        | ~12–14k        | ~700–880    |
   | 3        | ~15k           | ~585        |
   | 4        | ~35k           | ~551        |
   | 6        | ~91k           | ~304        |

   `T_BITS=2` is ~5–8× fewer queries than 6 (the live run did it in 14,079
   queries / ~24 min vs 76,799 / ~62 min). On a fast, low-latency link the
   balance flips (round trips dominate) and a higher value is better.

2. **Single-interval retry at startup.** The banner `s1` frequently leaves >1
   candidate interval after step 3, which forces the expensive step-2b scan
   (conforming-`s` density ~1/65000 → tens of thousands of queries, often an
   hour, with no visible progress). Since the oracle is stateless and each
   connection is a fresh session with its own `c0`/`s1`, the driver simply
   **reconnects until a session yields exactly one interval**, then runs the
   fast tile-only path. Observed: skipped 4- and 2-interval sessions, locked
   onto a single-interval `s1`, and finished with 0 reconnects.

Note: `SimOracle` above is a local offline test harness — it generates its own synthetic modulus-matched message (including a `flag{...}`-shaped string via `secrets.token_hex`) purely so the solver logic can be exercised without hitting the live service. It is not the recovered flag.
