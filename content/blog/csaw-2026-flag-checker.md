---
title: "CSAW 2026 — Flag Checker: A Timing Oracle You Control the Gain Of"
date: "2026-09-20"
tags: ["csaw-2026", "web", "timing-attack", "side-channel"]
excerpt: "The per-character delay multiplier came from your own User-Agent. Crank it up and the signal saturates — most of the work was stopping the measurement methodology from lying."
---

**Flag:** `csaw{tim3_w4its_f0r_n0_0ne}`

## Target

Flask + gunicorn, one interesting route:

```python
@app.route('/check', methods=['POST'])
def check():
    ua = request.headers.get('User-Agent','')
    if bot_check(ua): return jsonify({'error':'Access denied'}), 403
    flag = bleach.clean(request.form.get('flag',''))
    ...
    return jsonify({'correct': flag == FLAG})
```

`FLAG = Flag(os.getenv('FLAG'))` — `Flag.__eq__` comes from `inputval`, which is
not shipped. It leaks `len(common_prefix(guess, FLAG))` through response time.

## The twist: the victim controls the gain

`bot_check` reads as anti-automation boilerplate, but these lines are the
challenge:

```python
m = re.search(r'Chrome/(\d+)\.0\.(\d+)\.(\d+)', ua)
if m:
    build, patch = int(m.group(2)), int(m.group(3))
    if build > 9999 or patch > 9999:   # <-- the trap
        return True
    _store.build, _store.patch = build, patch
```

Your Chrome version is stashed in `reqmeta._store` and becomes the **per-character
delay multiplier**. Measured:

| build × patch | delay / matched char |
|---|---|
| 100 × 50    | ~2 ms (unusable) |
| 1500 × 50   | ~64 ms |
| 5200 × 50   | ~80 ms |
| 9999 × 50   | ~147 ms |
| 5000 × 5000 | ~300 ms (clamped) |

**Why the `> 9999` cap exists:** total delay saturates (~1400–1950 ms). At maximum
gain the signal dies after ~5 matched characters — exactly when you start making
progress. The intended move is to turn the gain **down**, not up.

## Four traps

1. **Clamp.** Keep baseline ~500–600 ms. Too high and a *correct* character is
   truncated into the noise — indistinguishable from a wrong one. This made us
   wrongly reject `t` (measured −2 ms at build=3000, +64 ms at build=1500).
   *"No candidate wins" means retune the gain, not "the prefix is wrong."*
2. **Length bias.** Response time depends on guess **length**, not only on matched
   prefix (6-char wrong guess = 890 ms vs 5-char = 760 ms). Pad every candidate to
   one fixed length. This single fix took leads from ~7 ms to ~200 ms.
3. **Drift.** Sweeping candidates back-to-back makes whichever ran first look
   slowest. Interleave round-robin + discard warm-up requests. Without this we
   "recovered" the entirely fictional `csawctf{bbbabaadbbbe`.
4. **Noise scales with baseline.** Deeper prefix ⇒ larger baseline ⇒ more noise.
   Use the median of many known-wrong candidates as the baseline (a single control
   can itself be the outlier) and escalate rounds until the winner clears a
   noise-derived bar.

## Other facts

- The server **serializes**: 10 parallel requests went 613 ms → 2500–6500 ms each.
  Never parallelise a timing attack here.
- `/check` has **no rate limit** (`@limiter.limit` is only on `/`).
- Flag format is `csaw{...}`, **not** `csawctf{...}` — verified by measurement
  (`csaw{ZZZ` = 1105 ms beat `csawctf{` = 930 ms at equal length).
- `validators.length(flag, min=1, max=200)` never fires — empty input returns
  `correct:false` instead of 400.

## Method

Oracle template, all candidates padded to equal length:

```
guess = PREFIX + candidate + "QQ"
```

Round-robin timing, take min per candidate, winner = max, require the lead to
clear ~3σ of the rest. ~7 requests/char with binary search on the gain-tuned delay.

## Takeaway

A side channel whose gain is attacker-controlled is a two-edged tool: crank it
and you destroy your own signal. Most of the debugging here was not "find the
oracle" but "stop my own measurement methodology from lying to me."
