# Aggressive Parallelism Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make FlowPilot default toward higher throughput by preventing accidental serial dispatch when multiple tasks are ready and by hardening protocol guidance toward wider parallel task graphs.

**Architecture:** Add a scheduler guard in `next()` that refuses when the current frontier has multiple parallelizable tasks and points callers to `next --batch`. Then strengthen formatter/protocol/documentation wording so decomposition and execution both bias toward maximum safe fan-out.

**Tech Stack:** TypeScript, Vitest, FlowPilot application service, formatter, protocol template, README/docs

---

### Task 1: Add failing tests for anti-serialization guard

**Files:**
- Modify: `src/application/workflow-service.test.ts`

**Step 1: Write the failing test**

- Add a test where two tasks are initially parallelizable and assert `next()` rejects with guidance to use `next --batch`.
- Keep the existing `nextBatch()` coverage as the positive path.

**Step 2: Run test to verify it fails**

Run: `npx vitest run src/application/workflow-service.test.ts -t "next在存在多个可并行任务时拒绝串行派发"`

**Step 3: Commit**

Do not commit yet.

### Task 2: Implement scheduler guard

**Files:**
- Modify: `src/application/workflow-service.ts`
- Modify: `src/domain/task-store.ts` only if helper extraction is needed

**Step 1: Write minimal implementation**

- In `next()`, compute the parallel frontier after cascade skip.
- If frontier size > 1, throw a throughput-oriented error directing callers to `node flow.js next --batch`.

**Step 2: Run targeted tests**

Run: `npx vitest run src/application/workflow-service.test.ts`

### Task 3: Harden batch and protocol wording

**Files:**
- Modify: `src/interfaces/formatter.ts`
- Modify: `src/infrastructure/protocol-template.ts`

**Step 1: Write minimal implementation**

- Add an explicit "dispatch all returned tasks in parallel" line to batch output.
- Strengthen protocol wording around:
  - always using `next --batch`
  - minimizing unnecessary dependencies
  - dispatching all batch tasks in one message

**Step 2: Run targeted tests**

Run: `npx vitest run src/application/workflow-service.test.ts src/e2e/operational-readiness.test.ts`

### Task 4: Update docs for throughput-first mode

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `docs/usage-guide.md`
- Modify: `docs/usage-guide.en.md`

**Step 1: Write minimal documentation**

- Clarify that missing `parallelLimit` does not cap parallelism.
- Warn that `parallelLimit: 1` effectively forces serial execution.
- Encourage flatter dependency graphs for throughput-first users.

**Step 2: Run smoke verification**

Run: `npm run test:smoke`

### Task 5: Full verification

**Files:**
- No code changes

**Step 1: Build**

Run: `npm run build`

**Step 2: Re-run smoke suite**

Run: `npm run test:smoke`

**Step 3: Review**

Expected: targeted anti-serialization behavior passes and full smoke suite stays green.
