# Aggressive Parallelism Design

## Problem

FlowPilot promises batch dispatch, but in practice the main agent can still serialize work in two common ways:

1. It calls `node flow.js next` instead of `node flow.js next --batch`, which silently returns only one task even when several are ready in parallel.
2. It produces or follows overly conservative task graphs with unnecessary dependencies, reducing the available parallel frontier.

The user wants throughput prioritized over conservatism: maximize sub-agent count, then rely on retries, reconciliation, and conflict recovery when needed.

## Goals

- Prefer larger parallel batches by default.
- Prevent accidental serialization when multiple parallel tasks are available.
- Push the protocol toward fewer unnecessary dependencies and full fan-out dispatch.
- Keep existing retry/reconcile safety rails.

## Non-Goals

- No deep static write-conflict detection across tasks.
- No attempt to perfectly infer file ownership before execution.
- No new scheduler that predicts future edits.

## Approaches Considered

### 1. Protocol-only tightening

Strengthen wording around `next --batch` and "dispatch all tasks".

- Pros: tiny patch
- Cons: does not stop the main agent from still calling `next`

Rejected as insufficient.

### 2. Scheduler guard + protocol tightening

If multiple tasks are parallelizable, `next()` refuses and instructs the caller to use `next --batch`. Also strengthen decomposition guidance so task graphs are flatter when safe.

- Pros: directly prevents accidental one-by-one dispatch, minimal code, aligns with throughput goal
- Cons: still depends on task decomposition quality

Chosen.

### 3. Predictive write-conflict scheduler

Estimate future touched files and avoid overlapping tasks automatically.

- Pros: potentially safer high parallelism
- Cons: complex, speculative, and often wrong before execution starts

Rejected for now.

## Chosen Design

### Scheduling Guard

- `next()` should inspect the current parallel frontier after cascade skip.
- If more than one task is ready, it should refuse with an explicit message:
  - say how many tasks are parallelizable
  - tell the operator to run `node flow.js next --batch`
  - state that returning only one task here would reduce throughput

This turns accidental serialization into a hard failure instead of a silent slowdown.

### Batch Output Hardening

- Batch formatting should explicitly say the returned tasks must all be dispatched in parallel.
- Wording should frame serial dispatch as protocol failure when the batch already contains multiple tasks.

### Protocol / Planning Guidance

- Requirement decomposition guidance should explicitly say:
  - minimize dependencies
  - add deps only for true data/blocking dependencies
  - prefer wider frontiers over chains when safe
- Execution guidance should explicitly say:
  - if batch size > 1, dispatch all tasks in one message
  - do not downshift to one sub-agent "for safety"; rely on retries/restart/reconcile instead

### Parallel Limit Semantics

- Keep current scheduler behavior where missing `parallelLimit` means "do not artificially cap".
- Document that users who want more throughput should avoid setting `parallelLimit: 1`.
- Keep recovery/evolution mechanisms intact.

## Testing

- service test: `next()` rejects when two or more tasks are ready in parallel
- service test: `next()` still works normally when only one task is ready
- formatter/protocol test coverage through existing integration points
- smoke suite to ensure no regressions in resume/finish/batch execution
