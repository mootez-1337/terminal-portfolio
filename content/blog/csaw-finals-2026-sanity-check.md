---
title: "CSAW Finals 2026 — Sanity Check: A Flag Scattered Across Discord"
date: "2026-11-12"
tags: ["csaw-finals-2026", "misc"]
excerpt: "The flag was split into hex fragments posted across the CTF Discord's channels, with the final piece hidden as an out-of-place number in the rules message: '21 hints' is hex 0x21, an exclamation mark."
---

> **CSAW CTF 2026 Finals · Misc · 492 pts**
> **Flag:** `csaw{W3LC0ME2CSAW!}`

> The truth was never hidden. It was spoken aloud, in pieces, in every room at once… The last
> piece sits where the law of the house is written.

## Collecting the fragments

"Every room at once" is the Discord server's channels. Each channel held one hex fragment; in
server channel order:

| Channel | Hex | Text |
|---|---|---|
| general | `57 33 4c` | `W3L` |
| memes | `43 30 4d` | `C0M` |
| recruitment | `45 32 43` | `E2C` |
| networking | `53 41` | `SA` |
| fun | `57` | `W` |

That assembles to `W3LC0ME2CSAW`. The rules channel also had a `test_flag` message with those
same bytes joined together — but wrapping that in `csaw{}` was rejected. So it was only a
checksum, and the real last piece was elsewhere in the rules.

## The last piece

"The last piece sits where the law of the house is written" — the rules message. Its text
said *"Please do not ask for **21** hints."* The number is out of place. Read as hex, `0x21`
is `!`, completing the flag.

```python
FRAGMENTS = ["57 33 4c", "43 30 4d", "45 32 43", "53 41", "57"]   # channel order
RULES_HINT = "21"                                                  # "ask for 21 hints"

body = "".join(bytes.fromhex(h.replace(" ", "")).decode() for h in FRAGMENTS)
body += bytes.fromhex(RULES_HINT).decode()
print(f"csaw{{{body}}}")        # csaw{W3LC0ME2CSAW!}
```

## Lesson

A rejected "complete-looking" string is a tell: it means a decoy or checksum, and the real
token is nearby. The clue structure ("every room" → channels, "law of the house" → rules)
mapped directly onto the platform.
