---
title: "CSAW 2026 — dino2auth: Forging OIDC Tokens"
date: "2026-09-20"
tags: ["csaw-2026", "web", "oidc", "jwt"]
excerpt: "Two first-party identity providers, one of which forgot to pin its signing certificate. An error oracle in the callback exposed the gap, and the admin gate keyed off scope rather than sub."
---

**Flag:** `csaw{str4ta_sk1pped_th3_p1n}`

## Target

`https://dino2auth.ctf.csaw.io/` — "TrustDinOIDC", a relying party with two
first-party identity providers (`/idp/paleoid`, `/idp/strataid`). Goal: view the
"Flagosaurus print (admins only)" panel.

## Recon

- No `/.well-known/openid-configuration`, no JWKS — hand-rolled IdPs.
- The authorize endpoint returns a signed `id_token` whose header carries **`x5c`**
  (an embedded X.509 cert chain) — attacker-influenceable in principle.
- Both IdP certs are self-signed, CN = the issuer hostname.
- **The session cookie IS the raw id_token.** The RP re-validates it per request,
  so forging a token is equivalent to full authentication.

## Dead ends (all properly rejected)

- `x5c` with a self-signed cert of the right CN → `certificate mismatch`
- `x5c` chain confusion `[fake, real]`, `[real, fake]`, `[fake, real, real]`
- RS256→HS256 confusion, HMAC key = pubkey PEM / DER / cert PEM / cert DER / x5c b64
- `alg: none` / `None` / `NONE`
- scope injection at the IdP (`flagosaurus:redeem` is silently stripped by an allowlist)
- `state` action namespace (`freeosaurus:`, `flagosaurus:`, `admin:` …)
- `sub` control via `login_hint`, `user`, `role`, `tier`, … (nothing but `exp` changes)

## The lever: an error oracle

`POST /oauth/callback` echoes the validation exception verbatim:

```
missing x5c | certificate mismatch | unknown issuer
Signature verification failed | list index out of range | <asn1 parse error>
```

Diffing those messages across forged tokens is what exposed the bug.

## Bug 1 — cert pinning applied to one issuer but not the other

The same forged cert that yields `certificate mismatch` under
`iss=paleoid.example.com` returns **HTTP 200** under `iss=strataid.example.com`.
The strataid path never compares the `x5c` cert against its pin ⇒ any
self-signed cert is accepted ⇒ arbitrary token forgery.

## Bug 2 — authorization keys off `scope`, not `sub`

With forgery in hand, `sub=admin` still isn't admin. Fuzzing `role`, `tier`,
`groups`, `is_admin`, `acr`, `amr`, … changes nothing. The admin gate is
`scope` containing **`flagosaurus:redeem`** — a scope the IdP refuses to mint,
but which you simply include yourself once you can sign tokens.

## Exploit

```bash
openssl req -x509 -newkey rsa:2048 -keyout fake.key -out fake.crt \
        -days 365 -nodes -subj "/CN=anything"
```

```python
jwt.encode({"iss":"strataid.example.com","sub":"admin",
            "aud":"trustdinoidc-portal",
            "scope":"openid profile freeosaurus:redeem flagosaurus:redeem",
            "exp":<future>},
           fake_key, algorithm="RS256",
           headers={"typ":"JWT","x5c":[b64(fake_der)]})
```

Send as the `session` cookie → Flagosaurus panel renders the flag.

## Takeaway

Per-issuer trust config is easy to get inconsistent. When one IdP enforces
pinning and another doesn't, the weaker path defines your security. The flag
name says it: *strata skipped the pin*.
