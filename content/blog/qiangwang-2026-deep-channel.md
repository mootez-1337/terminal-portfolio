---
title: "Qiangwang 2026 — Deep Channel"
date: "2026-10-31"
tags: ["qiangwang-2026", "misc", "forensics", "pcap", "vm"]
excerpt: "The capture hides custom KV-VM bytecode exfiltrated over ICMP in two stages. Solving it requires carving records from a damaged PCAP, separating the real channels from decoys, recovering the VM behavior, and running each stage…"
---

> **Qiangwang Mimic Defense 2026 Quals · Misc · hard · 598 pts**

## Summary

> "We captured a segment of network traffic—`capture.pcap`—from a compromised host. The host lost power while the capture was in progress."

The capture hides custom KV-VM bytecode exfiltrated over ICMP in two stages. Solving it requires carving records from a damaged PCAP, separating the real channels from decoys, recovering the VM behavior, and running each stage under the correct VM revision.

## Solution

### Step 1: Recover frames from the damaged PCAP

The PCAP global header has been altered: the magic number's final byte was flipped (`a1` to `a9`), and the link type was changed to `0x1337` even though the frames are Ethernet. The capture also ends in a truncated record followed by garbage.

Instead of trusting the header, scan the file byte by byte for plausible record headers. Accept records with timestamps in a sane range, matching included and original lengths, reasonable frame sizes, and complete data within the file. Re-synchronizing after invalid data recovers roughly 4,560 Ethernet/IPv4 frames.

### Step 2: Triage traffic and identify decoys

The capture contains DNS traffic with specification fragments, two HTTP servers with planted flags, VM sandbox traffic, several ICMP streams, and large volumes of unrelated chaff. (All addresses below are internal to the provided PCAP scenario, not live infrastructure.)

| Traffic | Role |
|---|---|
| DNS to `10.0.0.53` (A and TXT `doc1`–`doc12`) | Specification fragments and hints; includes traps |
| HTTP to two decoy hostnames on ports 80/81 | Decoy flags |
| `10.0.0.99:31337` and `:31338` | KV-VM revision B and revision C sandboxes |
| ICMP to `10.0.0.99` | Real exfiltration plus chaff channels |
| UDP/TLS-like/SSDP/mDNS chaff destinations | Chaff |

Ignore the fake flags in the HTML and JPEG comment. The DNS fragments also contain a planted `K_0 = 0xA6` key-chain value; the correct seed is `0xA5`.

One DNS fragment is XOR-`0x42` encoded. Decode it before assembling the VM specification. The field note points to ICMP echo as the exfiltration method and says only one channel is genuine.

### Step 3: Reassemble the first-stage ICMP payload

The genuine stream uses ICMP identifier `0xbeef`. Its echo-request data begins with the `KV` magic. Other identifiers (`0xc001`–`0xc004`) and spoofed sources carry chaff or invalid duplicates.

Each `KV` payload is framed as:

```text
KV | u8 sequence | u8 length | u8 checksum | data
```

Sort fragments by sequence number, decrypt the data with the key chain, and discard invalid checksums. Use the first valid fragment for each sequence number. The checksum is the byte sum of the decrypted data modulo 256.

The stream cipher is:

```text
K_0 = 0xA5
K_(n+1) = (K_n * 31 + 7) & 0xFF
data[i] = plain[i] ^ ((K_seq + i) & 0xFF)
```

This produces approximately 250 bytes of VM bytecode.

### Step 4: Recover the KV-VM semantics

The challenge provides no opcode list, so use the sandbox services at `10.0.0.99:31337` (rev.B) and `10.0.0.99:31338` (rev.C). Send `RUN <hex>` and compare `OUT <hex>` with the known input/output test programs present in the capture. These probes reveal the instruction set and differences between the VM revisions.

The bytecode is packed MSB-first without byte alignment. Instructions contain a 5-bit opcode, a 4-bit register, an 8-bit immediate, and, where needed, a 16-bit address. The program counter is a bit address; data memory is byte-addressed. `JMPR` uses a revision-specific multiplier.

Recovered opcode table:

| Opcode | Instruction |
|---:|---|
| 7 | `LOADI r, imm` |
| 3 | `ADDI r, imm` |
| 21 | `SUBI r, imm` |
| 11 | `XORI r, imm` |
| 14 | `ANDI r, imm` |
| 24 | `ROT r, imm` |
| 9 | `MOVR rd, rs` |
| 6 | `ADDR rd, rs` |
| 20 | `LOADC r, [r]` |
| 1 | `STOREC [r], r` |
| 13 | `PUSH r` |
| 22 | `POP r` |
| 18 | `EMIT r` |
| 10 | `JMP address` |
| 28 | `JNZ r, address` |
| 8 | `JMPR r` |
| 17 | `OP17 rd, rs` (XOR) |
| 31 | `HALT` |

The VM revisions differ in stack and instruction behavior:

- Rev.B faults when `POP` runs on an empty stack; rev.C returns zero.
- `ROT` direction and the `JMPR` multiplier differ between revisions. Rev.B uses `R * 8`; rev.C uses `R * 16`.

The first-stage blob decrypts itself: it loads bytes from its own image, updates a rolling key, XORs the bytes, and stores the result back before execution.

### Step 5: Run each stage with the correct revision

Run the first blob under rev.B's empty-stack-fault semantics. It emits the first half of the flag and points to the second-stage `PX` channel along with an 8-byte XOR key.

The second stream uses ICMP id `0xc001` and a `PX` magic header. Reassemble its payloads and XOR-decrypt the body using that repeating key. Run the resulting bytecode under rev.C semantics, where empty-stack `POP` yields zero and the rev.C `ROT`/`JMPR` behavior applies. It emits the second half of the flag.

Concatenating the two halves gives the complete flag.

## Traps to avoid

- The damaged PCAP header and truncated tail require record carving.
- HTML, HTML comments, and JPEG comments contain fake flags.
- `K_0 = 0xA6` is a planted error; use `0xA5`.
- Most ICMP streams are chaff, including identifiers `0xc002`, `0xc003`, `0xc004`, and spoofed hosts.
- The second stage uses rev.C semantics; the first stage uses rev.B.
- High-volume UDP, TLS-like, SSDP, and mDNS traffic is unrelated noise.
