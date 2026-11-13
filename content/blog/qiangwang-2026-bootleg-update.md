---
title: "Qiangwang 2026 — Bootleg Update"
date: "2026-10-31"
tags: ["qiangwang-2026", "reverse", "command-injection", "firmware"]
excerpt: "A shell-injection bug in a vehicle/ECU \"OTA update\" service's scan endpoint gave arbitrary command execution, which was used to exfiltrate the firmware-update binary; reverse-engineering its custom stream cipher (validated…"
---

> **Qiangwang Mimic Defense 2026 Quals · Reverse · medium · 485 pts**

## Summary

A shell-injection bug in a vehicle/ECU "OTA update" service's scan endpoint gave arbitrary command execution, which was used to exfiltrate the firmware-update binary; reverse-engineering its custom stream cipher (validated against embedded CRC32 checksums) then recovered the key material needed to decrypt a diagnostic record containing the flag.


## Solution

### Step 1: Exploit shell injection for arbitrary file read

The foothold came from a shell-injection bug in the vehicle/ECU "OTA update" service's scan endpoint, `POST /api/v1/update/scan`, which took a JSON body `{"media_path": "<value>"}` and passed that value unsanitized into a shell command. Breaking out of the quoting with a payload of the form:

```text
'; <command>; printf x'.up
```

(closing the existing quoted argument, injecting an arbitrary command, then re-closing the trailing syntax) allowed arbitrary command execution.

This was wrapped in a small helper, `exfil.py`, whose `scan()` function sent that injection and whose `fetch()` function ran `echo BEGINX; base64 <remote-file>; echo ENDX` through it, then extracted and base64-decoded whatever landed between the `BEGINX`/`ENDX` markers in the response — effectively an arbitrary-file-read primitive used to pull the target firmware-update binary and its associated OTA data blobs off the device for offline analysis.

### Step 2: Reverse-engineer the firmware's stream cipher

The pulled binary was an AArch64 ELF responsible for validating and installing OTA packages. Disassembling it (with Capstone) recovered a custom stream cipher, `diag_crypt`, built on an xorshift32-style PRNG. Its keystream state was seeded from:

```text
nonce ^ version ^ 0x6D2B79F5 ^ crc32(serial) ^ rol32(release, 5) ^ install_binding
```

The cipher additionally ran bytes through a fixed substitution table, `DIAG_BOX = bytes.fromhex("819fb429ed630ad51c72c84ea638f157")`, combined with `rol32`/`rol8` bit-rotation steps.

The firmware image itself was organized as a set of self-describing records — `BOOTCTRL` ("BTCT") and `VERSION_JOURNAL` ("VREC") — each carrying an embedded CRC32, which served as a correctness oracle: a decrypted record whose computed CRC32 matched its stored CRC32 confirmed the derived key material was right.

### Step 3: Recover `install_binding` and decrypt the diagnostic record

The solver's `main()` logic located the newest valid `BOOTCTRL` record together with the matching `VIP VERSION_JOURNAL` record, then computed:

```text
install_binding = rol32(boot_nonce ^ journal_nonce ^ boot_seq ^ journal_seq, 11)
```

from fields pulled out of both records. That `install_binding` fed into `diag_crypt` to decrypt the actual diagnostic record (`DREC`), located at a fixed offset — `VIP_B_START (0x9000) + diagnostic_offset (640)` — inside the firmware image.

One parsing bug had to be fixed along the way: the boot record's `slot` field is 2 bytes (`b"BB"`) while the journal record's `slot` field is 1 byte (`b"B"`), so a naive equality check between the two slot values never matched; this was resolved by comparing `newest_boot["slot"][0:1]` against the journal's slot byte instead of comparing the raw fields directly.

With that fix in place, the solver located the matching boot/journal pair, derived the correct `install_binding`, and decrypted the `DREC` diagnostic record — its CRC32 validated (`CRC match: True`), confirming the decryption was correct, and the decrypted plaintext contained the flag.
