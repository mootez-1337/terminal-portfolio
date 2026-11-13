---
title: "Qiangwang 2026 — Undercurrent"
date: "2026-10-31"
tags: ["qiangwang-2026", "web", "mqtt", "command-injection"]
excerpt: "A FastAPI app fronted an MQTT broker (reachable over WebSockets) with no authentication, which an unauthenticated Home Assistant automation trusted blindly. Forging a Frigate-style detection event triggered a shell command…"
---

> **Qiangwang Mimic Defense 2026 Quals · Web · medium · 460 pts**

## Summary

A FastAPI app fronted an MQTT broker (reachable over WebSockets) with no authentication, which an unauthenticated Home Assistant automation trusted blindly. Forging a Frigate-style detection event triggered a shell command with an attacker-controlled, unescaped `camera` field, giving full RCE as the `homeassistant` user and access to `/flag`.

## Solution

### Step 1: Recon the exposed surface

The challenge instance (`HOST`) exposed only a FastAPI app with no useful REST endpoints (every guessed path like `/api/cameras`, `/api/lock`, `/admin` returned 404). The `/health` endpoint was the key recon find: it returned `{"ok":true,"service":"stream-test","mqtt_websocket_path":"/mqtt","mqtt_subprotocol":"mqtt","event_topic_pattern":"frigate/+/events","telemetry_topic_pattern":"home/+/telemetry"}`, revealing an MQTT broker reachable over WebSockets at path `/mqtt` on the same host/port, plus the two relevant topic patterns.

Connecting with `paho-mqtt` (`transport="websockets"`, `ws_set_options(path="/mqtt")`) and subscribing to `#` confirmed the broker accepted anonymous connections with no auth and granted broad subscriptions.

### Step 2: Forge a Frigate detection event

Publishing a forged Frigate-style "new object detected" event to `frigate/front_door/events` (a JSON blob mimicking a real Frigate `before`/`after` detection payload, with `camera: "front_door"`, `label: "person"`, etc.) immediately produced a reply on `home/<id>/telemetry`: `{"camera": "front_door", "stdout": "unlock-ok:unlock --camera front_door", "stderr": ""}`.

This showed a Home Assistant automation was listening on `frigate/+/events` with zero validation and triggering a shell command (`smartlockctl unlock --camera <camera>`) using the attacker-controlled `camera` field straight out of the forged event — explaining the "unexplained unlock activity" in the challenge prompt. The MQTT bus itself had no publish ACL stopping anyone from impersonating Frigate.

### Step 3: Shell-inject the `camera` field

The `camera` field was then shell-injected. Testing `"front_door; id"` as the camera value caused the telemetry reply to literally echo `stdout: "unlock-ok:unlock --camera front_door; id"`, proving the value lands unescaped in a shell command.

Blind brute-forcing of separators (backticks, `$()`, `|`, `&&`, `--help`) suggested some characters/keywords were filtered, but simply breaking out of a single-quoted string worked: the payload `X<nonce>'; <command>; '` (a leading identifier, a closing single quote, a semicolon-separated command, then a stray `'` to keep the quoting balanced) produced full command execution.

This was confirmed later by reading `/config/smartlock.sh`, which did `cmd="/usr/bin/smartlockctl unlock --camera '$camera'"` followed by `sh -c "$cmd"`. Home Assistant's `configuration.yaml` defined `shell_command.smartlock_unlock: "/config/smartlock.sh \"{{ camera }}\""`, and `automations.yaml` wired `frigate/+/events` directly to that shell command via `{{ trigger.payload_json.after.camera | default('unknown') }}` with an empty `condition: []` — a two-stage bug (unauthenticated/unfiltered MQTT trigger, plus unescaped shell interpolation past a weak keyword blocklist that only blocked things like `rm `, `bash`, `sh `, `curl`, `wget`, `python`, `perl`).

### Step 4: Use the RCE to enumerate and dump configuration

Using this RCE (a small `rce.py` script that published the injection payload and then listened on `home/+/telemetry` for the command output, since the broker echoed stdout/stderr back over MQTT), I ran `id; pwd; whoami` to confirm `uid=103(homeassistant)`, then dumped `/config/configuration.yaml`, `/config/automations.yaml`, `/config/smartlock.sh`, `/config/smartlockctl`, and a full `env` listing.

The environment leaked `MQTT_USER=ha-publisher` and `MQTT_PASSWORD=IhnyjjcPTVBhEKhMFcyuywNC0ULMicVH` — a tempting string, but only a credential, not the flag.

### Step 5: Read the real flag

The actual flag was obtained by using the same RCE primitive to run `cat /flag; echo ENDFLAGREAD` through the injected shell command. The telemetry reply came back as `STDOUT: unlock-ok:unlock --camera Xaba471\nflag{[REDACTED]}\nENDFLAGREAD`, confirming the file `/flag` (owned by `homeassistant`, 47 bytes, sitting at the container root alongside the Home Assistant/Frigate/go2rtc/mosquitto stack) contained the real CTF flag.

A follow-up `ls -la /` via the same RCE channel corroborated the container layout (mosquitto, go2rtc, homeassistant, nginx all running per `ps`/`netstat` dumps), consistent with the full exploitation chain described above.
