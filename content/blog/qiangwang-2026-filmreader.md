---
title: "Qiangwang 2026 — FilmReader"
date: "2026-10-31"
tags: ["qiangwang-2026", "misc", "forensics", "kernel"]
excerpt: "A disk image's visible flag.txt was a decoy; a hidden kernel module intercepted reads on that path and served plaintext derived from an encrypted cache file whose key material had to be recovered from deleted ext4 artifacts…"
---

> **Qiangwang Mimic Defense 2026 Quals · Misc · medium · 476 pts**

## Summary

A disk image's visible `flag.txt` was a decoy; a hidden kernel module intercepted reads on that path and served plaintext derived from an encrypted cache file whose key material had to be recovered from deleted ext4 artifacts and whose decryption required emulating a small custom VM.

## Solution

### Step 1: Identify the read-path interception

The disk image appeared to contain a straightforward `flag.txt`, but the accompanying note warned that the file on disk was a decoy. That made the filesystem and the read path more valuable than the visible contents: determine what the kernel module intercepts, then recover the hidden file and the exact key material from the image.

The image was ext4. Inspection identified `kcompat.ko`, which hooks `read()` for `/home/ctf/flag.txt`. Rather than returning the ordinary file, it serves plaintext derived from `/var/.cache/.kmod/.real_cache`. Thus, inspecting only the pathname or running `cat` against the mounted image risks seeing the decoy.

### Step 2: Recover deleted key material from ext4

The key and cache artifacts had been deleted. They were recovered from ext4 journal/old inode data, including the relevant blocks 33297–33310. The four-byte key components came from `.s1`, `.s2`, `.s3`, and `.k[k2[0]&3]` (the selected `k2` component). Concatenating these inputs and iterating SHA-256 2^25 times produced `a65dc30a337a3faee5a58c868fc3e715`, matching the check value embedded in the module.

### Step 3: Emulate the VM and decrypt the real cache

The module contains a small VM routine rather than a standard file-decryption call. The 448-byte VM program was decrypted with its PCG-style keystream and emulated. Running the routine against `.real_cache` yielded the live flag.

The backup `.real_cache.bak` produced a *draft/decoy* flag, `flag{[REDACTED]}` — this was a deliberate draft and was **not submitted**. The accepted value, recovered from `.real_cache` itself, was `flag{[REDACTED]}`.

### Lessons

- A kernel module can change the semantics of reads even when the file exists normally on disk.
- Deleted ext4 files can remain recoverable through journal and stale inode/block data.
- Treat explicit decoy warnings as evidence about which artifact is authoritative; verify against the challenge submission result.
