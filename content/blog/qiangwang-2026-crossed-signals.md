---
title: "Qiangwang 2026 — Crossed Signals"
date: "2026-10-31"
tags: ["qiangwang-2026", "web", "mcp", "authz"]
excerpt: "The service exposed an MCP-compatible tool gateway that carried security-sensitive values twice — once in HTTP headers and again in the JSON-RPC body — but authorized on one copy while dispatching on the other, allowing VIN…"
---

> **Qiangwang Mimic Defense 2026 Quals · Web · easy · 326 pts**

## Summary

The service exposed an MCP-compatible tool gateway that carried security-sensitive values twice — once in HTTP headers and again in the JSON-RPC body — but authorized on one copy while dispatching on the other, allowing VIN and tool-name desynchronization attacks, followed by a mass-assignment bug to unlock the full case bundle.

## Solution

### Step 1: VIN desynchronization

The gateway checked the VIN in `Mcp-Param-VIN` but the tool implementation consumed the `vin` in the request body. Keeping the assigned vehicle VIN (`...0001`) in the authorized header while setting the restricted validation vehicle (`...0002`) in the body allowed access to that vehicle's health and update status. Those responses disclosed `diagnostic_ref` and `evidence_ref`, which were needed for the case export.

### Step 2: Tool-name desynchronization

Tool-scope authorization similarly used the `Mcp-Name` header, while actual dispatch used `params.name` from JSON. The security-only `export_case_bundle` tool was rejected when used consistently. The bypass was to put an allowed name such as `get_vehicle_health` in the header and `export_case_bundle` in the body. That staged the security bundle for case SR-26042.

### Step 3: Obtaining the full bundle via mass assignment

The advisor preview archive omitted `private/recovery.txt`. Fetching the complete archive required the release state to be approved. The review-notes endpoint, `POST /api/bundles/<id>/notes`, accepted mass-assigned fields instead of restricting updates to note data. Supplying `release_state: approved` transitioned the bundle into the downloadable state. The full bundle then contained the recovery token, which was submitted and accepted.

## Lessons

- Every value used for authorization must be the same canonical value later used for dispatch.
- Header/body duplication is a classic source of parser and policy desynchronization.
- Mass assignment can turn a low-risk notes endpoint into a workflow-state bypass.
