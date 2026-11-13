---
title: "Qiangwang 2026 — Pending Review (BenchLink Gateway)"
date: "2026-10-31"
tags: ["qiangwang-2026", "pwn", "heap", "rop"]
excerpt: "The target was a stripped x86-64 PIE HTTP gateway with Full RELRO, stack canary, NX, and glibc 2.36. A direct stack overflow was not available, so the solution chained several primitives: unauthenticated credential disclosure…"
---

> **Qiangwang Mimic Defense 2026 Quals · Pwn · medium · 523 pts**

## Summary

The target was a stripped x86-64 PIE HTTP gateway with Full RELRO, stack canary, NX, and glibc 2.36. A direct stack overflow was not available, so the solution chained several primitives: unauthenticated credential disclosure, CBC authorization tampering, a use-after-free with pointer leaks, a snapshot overlap for arbitrary reads, tcache poisoning, then a ROP chain to read `/flag`.

## Solution

### Step 1: Pre-auth credentials and authorization bit flip

`GET /cgi-bin/config-backup.bin` returned `/app/device.cfg` without a session. It exposed the `operator` credentials: `operator` / `PlantOps-4hM7sQ29`. After login, `/api/service/dispatch` returned a 96-byte AES-CBC envelope. The authorization role byte was at plaintext offset `0x1b`; flipping ciphertext byte `envelope[27] ^= 1` changed the relevant plaintext bit to set `control_authorized:true`. The modification corrupted unchecked bytes in the preceding plaintext block but preserved a valid request.

### Step 2: Use-after-free and address leaks

The work-order `cancel` operation freed a note but left the slot marked present. `receipt` then read the first eight bytes through the dangling pointer, while the three-byte `revision` operation wrote into freed memory.

- A large freed note entered the unsorted bin. Its receipt leaked `main_arena + 0x60`, giving `libc_base = leak - 0x1d3cc0`.
- Small `0xa0` chunks entered tcache. The freed forward pointer exposed safe-linking data (`chunk >> 12`), allowing recovery of the heap base.

These leaks supplied the addresses needed to defeat PIE/ASLR-dependent targets without brute-forcing them.

### Step 3: Snapshot overlap to arbitrary read

Snapshot GET computed a trace tag by dereferencing a pointer stored through the snapshot object (`*(*(obj+0x10))`). A safe-linking-aware three-byte tcache poison overlapped a live job note with the snapshot object. The note body set `obj+0x10` to a chosen address, so fetching the snapshot returned the 8-byte value at that address.

Reading `environ` yielded a stack pointer. The saved return-address slot was found at `*environ - 0x3908`; a second arbitrary read verified that it held a pointer into the PIE binary at offset `0x2e2e`.

### Step 4: Stack write and ORW chain

The three-byte `revision` write was enough for heap links but not for a full stack ROP chain. The exploit aliased a `0xa0` chunk over a `0x130` tcache head entry, then poisoned that entry so a `0x130` allocation landed at the saved-RIP address. Its note body supplied a ROP chain.

The chain called `open("/flag")`, `read(fd, buf, 0x100)`, then `write(1, buf, 0x100)`. The server duplicated the client socket onto stdout (fd 1), so the file contents were returned in the HTTP response. A fresh live instance returned the flag on the first exploit run.

Lessons learned:

- Build the exploit as a chain of primitives: disclosure → auth → UAF leak → arbitrary read → arbitrary write → code reuse.
- Safe-linking protects tcache pointers only when the attacker lacks the heap address; a related leak can restore the ability to poison.
- Verify each derived address with an independent read before committing to a stack overwrite.
- With NX enabled, an ORW ROP chain is a practical way to exfiltrate a local flag file.
