---
title: "Qiangwang 2026 — Causal Mosaic"
date: "2026-10-31"
tags: ["qiangwang-2026", "misc", "algorithms"]
excerpt: "The challenge provided three logs describing a partial causal ordering, each encoding precedence relations differently. The solution was to normalize every statement into a directed edge and run a deterministic topological…"
---

> **Qiangwang Mimic Defense 2026 Quals · Misc · easy · 301 pts**

## Summary

The challenge provided three logs describing a partial causal ordering, each encoding precedence relations differently. The solution was to normalize every statement into a directed edge and run a deterministic topological sort (Kahn's algorithm with a min-heap) to produce an ordering accepted by all three validators.

## Solution

### Step 1: Normalize the logs into a single graph

- Log A used explicit `before` and `after` fields. Each entry became an edge from the earlier event to the later event.
- Log B encoded a relation as `Y <- X`, meaning X precedes Y. The arrow direction was normalized to `X → Y`.
- Log C used a `pair` of zero-based indices. Those indices were resolved against the event list and converted into the same edge representation.

The resulting directed acyclic graph represented all constraints. Before sorting, the solver checked that the referenced events existed and that all three sources contributed their constraints.

### Step 2: Deterministic topological sort

Kahn's algorithm repeatedly selects a zero-indegree node and removes its outgoing edges. A min-heap was used for the available nodes, so when several events were currently valid, the smallest one was chosen. This made the submitted ordering deterministic and reproducible.

### Step 3: Validate and submit

The candidate ordering was validated for complete event coverage and checked against every precedence edge. The identical ordering was then sent to validators A, B, and C. All returned `valid: true`; the aggregate response reported `passed: true` and `complete: true`, followed by the flag.

## Lessons

- Translate varied constraint syntax into a single graph representation before solving.
- A topological order is not necessarily unique; a min-heap gives stable tie-breaking.
- Validate both coverage and every edge before submitting, not just whether the algorithm terminated.
