---
title: "CSAW Finals 2026 — NodeOS 2: vm Escape via Error.prepareStackTrace"
date: "2026-11-13"
tags: ["csaw-finals-2026", "jail", "nodejs", "sandbox-escape"]
excerpt: "A Node vm.runInContext sandbox exposing six bound host functions was escaped by reading a real rejection's stack trace to grab a live host function, then chained through a patched module loader and a native-addon setuid(0) to read a root-owned flag."
---

> **CSAW CTF 2026 Finals · Jail · 500 pts**
> **Flag:** `csaw{l04d3d_th3_dr1v3r_g0t_th3_k3ys}`

"NodeOS File Manager v3.0. Now with sandboxed eval." The service runs each line of input in a
Node 18 `vm.runInContext` sandbox exposing only six locked, bound host functions
(`print`/`info`/`exec`/`read`/`eval`/`help`). The context persists across lines in one
connection. Three bugs chain into a root-file read.

## Step 1 — escape via `Error.prepareStackTrace`

The sandbox's `import()` is handled by a host callback (`_noimport`) that throws. V8 lets you
override `Error.prepareStackTrace` with a function that receives the raw `CallSite` objects.
The trick: arm `prepareStackTrace` **before** triggering an `import()` rejection, then read
the rejection's `.stack`. Its first CallSite is the real host function `_noimport`, defined in
`/chal/server.js` (non-strict CommonJS). Calling `.getFunction()` on that CallSite returns a
genuine **host** function — and `hostFn.constructor` is the host `Function`, which hands back
`process` and `global` from outside the sandbox.

```js
globalThis.FR = null
Error.prepareStackTrace = function (e, frames) { globalThis.FR = frames; return "x" }
import("zzz").then(function () {}, function (e) { void e.stack })   // populates FR
```

One gotcha: `Error.captureStackTrace` recomputes the trace and loses these frames, so you
must read the real rejection's `e.stack`.

## Step 2 — reach `fs` through the patched loader

`process.binding` was deleted and the module loader patched to an allowlist (`fs`, `buffer`
only). The host `Function` from step 1 runs outside those restrictions, so
`process.mainModule.constructor._load('fs', null, false)` returns the real `fs`.

## Step 3 — privilege escalation via a native addon

The server had done `seteuid(1000)` and then **deleted** `setuid`/`seteuid`, leaving euid
1000 but ruid 0 / suid 0. `/flag.txt` is `600 root`, so a direct read `EACCES`es at euid
1000. The escalation: `process.dlopen` loads a native `.so`, and the addon's constructor runs
**before** Node's addon-validity check fails. A tiny `.so` whose `.init_array` calls the raw
`setuid(0)` syscall flips euid back to 0, after which `fs.readFileSync('/flag.txt')` succeeds.

```c
static void pwn(void){
  __asm__ volatile("xor %%edi,%%edi; mov $105,%%eax; syscall;" ::: "rax","rdi","rcx","r11","memory"); /* setuid(0) */
}
__attribute__((section(".init_array"))) static void (*p)(void) = pwn;
```

`/tmp` was `noexec`, but `/var/tmp` was writable on the exec overlay, so the `.so` was written
there, base64'd across pty-safe chunks, then `dlopen`ed.

## Lesson

`vm` is not a security boundary. Anything that can reach a real stack frame — and
`Error.prepareStackTrace` hands you `CallSite` objects directly — bridges back to host
functions. After that, deleting `setuid` from the symbol table doesn't matter when a native
addon constructor can issue the syscall itself.
