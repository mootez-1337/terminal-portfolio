---
title: "CSAW 2026 — CSALE: SQLi, XOR Credentials and a Honeypot Flag"
date: "2026-09-20"
tags: ["csaw-2026", "web", "sqli", "crypto"]
excerpt: "Three chained bugs and a deliberate canary. The obvious path ends on a planted flag that gets you banned; the real one needs a client-side attempt counter and a 10,000-PIN sweep."
---

**Flag:** `csawctf{TH4ts_ROugH_B4dDy}`

**Decoy flag (DO NOT SUBMIT):** `csawctf{Th1s_1S_4asy_r1gh1!?}`

## Target

Flask + gunicorn marketplace on SQLite. Sign up, log in, browse 8 listings,
search via `?q=`, create listings, and "unlisted drafts" gated by a 4-digit
seller-lock PIN.

## Bug 1 — SQL injection in search

`?q='` → 500. The clause is parenthesised:

```sql
WHERE (title LIKE '%{q}%' OR description LIKE '%{q}%')
```

Two consequences that cost time if missed:

- `q` is interpolated **twice**, so payloads must leave *both* halves valid.
- A closing **paren** is required before a comment. `q=zzz'--` 500s;
  `q=zzz')--` works. (Our first UNION attempts failed purely for this reason,
  and we fell back to boolean-blind extraction unnecessarily.)

Boolean-blind template (no comment needed, both halves balanced):

```
pizza%' AND (<condition>) AND '%'='
```

1 listing = TRUE, 0 = FALSE. ~7 requests/char via binary search on
`unicode(substr(expr,i,1))`.

UNION template (7 columns, far faster):

```
zzz') UNION SELECT 1,(<subquery>),'x',1,0,'a','b'--
```

## Schema

```
users          (id, username, password_hash, is_admin)   -- nobody is_admin=1
password_vault (id, user_id, encrypted_password)
password_notes (id, phase, key_piece)
listings       (id, owner_id, title, description, price_cents,
                is_unlisted, image_filename, attachment_filename)
```

## Bug 2 — reversible "encryption"

`password_notes` holds 5 key pieces. Concatenated **in phase order** they form a
repeating-XOR key:

```
1=6554  2=5093  3=1992  4=5177  5=7795   ->  65545093199251777795
```

XOR that against `password_vault.encrypted_password`:

```
superdiscreetflaguser  password123
Walter_W               I-AM_HEISENBURGGER
Mr.Krabs               MONEYYYYYYYYYYYY
Gojo                   Can't_touch_thisfrfr
Daenerys               stormborn_targaryan_rightfulheir/queen_...
Zoro                   NEEDMOREPAINT
OSIRIS                 enjoy_the_ctf_good_luck!
Maliketh               OdeathBecOMEMyBladEONceMOre
Zuko                   i-HaVe-REgaINEd_mY_h0NOr!
```

## The honeypot

`superdiscreetflaguser` logs straight in and its unlisted draft opens with **no
PIN at all**, showing an image with a flag-shaped string — and faint handwriting
reading **"do not submit this AI flag / you will be banned."**

It is a canary planted exactly where a scripted or AI-driven solver stops.
Tells that it is fake: no row has `is_unlisted=1`, so the draft is hardcoded
server-side rather than backed by the database. **Do not submit it.**

## Bug 3 — client-side rate limiting

Zuko is the real target: zero public listings like the decoy, but its PIN is
actually enforced (403 until correct). The unlock form ships

```html
<input type="hidden" name="lock_state" value="eyJ2IjoxLCJ1Ijo5LCJuIjowfQ">
```

which decodes to `{"v":1,"u":9,"n":0}` — the attempt counter is **client-supplied**,
as is the session cookie (`{"password_verified":false,"user_id":9}`).

Replaying the *same* pre-attempt cookie + `lock_state` for every guess pins the
counter at 0, so the "10 attempts" lockout never fires. A 10,000-PIN sweep
(12 threads, ~10 min) finds:

```
*** SELLER-LOCK PIN = 9493
```

Unlocking reveals `/account/unlisted/5/image` — Zuko and Aang, flag handwritten
across the top, no warning text. "That's rough, buddy."

## Bugs chained

1. SQL injection (unsanitised concat into a parenthesised `LIKE`)
2. Reversible credential storage (XOR key readable from another table)
3. Client-side attempt counter ⇒ unlimited PIN guesses
4. A deliberate honeypot rewarding under-verified solvers

## Takeaway

Verify a flag's provenance before submitting. The decoy sits at the natural
stopping point of the obvious chain; the real flag needs one more bug. Cross-check
against the schema — "this draft is not in the `listings` table" was the tell.
