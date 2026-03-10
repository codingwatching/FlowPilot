# Resume Reconcile Gate Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Block workflow continuation after interrupted residue is detected until the interrupted task is explicitly adopted or restarted.

**Architecture:** Add a `reconciling` workflow status plus runtime reconcile metadata. `resume` enters that status when interrupted residue exists. New `adopt` and `restart` commands clear the gate, and `next` refuses to schedule while reconciliation is pending.

**Tech Stack:** TypeScript, Vitest, FlowPilot CLI/runtime-state/application service

---

### Task 1: Add failing tests for reconcile gating

**Files:**
- Modify: `src/application/workflow-service.test.ts`
- Modify: `src/e2e/operational-readiness.test.ts`

**Step 1: Write the failing tests**

- Add a test asserting `resume()` enters blocked reconciliation mode when interrupted residue exists.
- Add a test asserting `next()` refuses during reconciliation.
- Add a test asserting CLI/e2e flow requires `adopt` or `restart` before progress continues.

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/application/workflow-service.test.ts src/e2e/operational-readiness.test.ts`

**Step 3: Commit**

Do not commit yet.

### Task 2: Add reconcile runtime state and workflow status

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/infrastructure/runtime-state.ts`
- Modify: `src/infrastructure/fs-repository.ts` if helper wiring is needed

**Step 1: Write the failing test**

Covered by Task 1.

**Step 2: Write minimal implementation**

- Add `reconciling` to `WorkflowStatus`
- Add runtime-state helpers to save/load/clear reconcile task IDs

**Step 3: Run targeted tests**

Run: `npx vitest run src/application/workflow-service.test.ts`

### Task 3: Gate resume/next and add adopt/restart service methods

**Files:**
- Modify: `src/application/workflow-service.ts`
- Modify: `src/domain/repository.ts` only if new repository methods become necessary

**Step 1: Write the failing tests**

Covered by Task 1.

**Step 2: Write minimal implementation**

- `resume()` enters `reconciling` when interrupted residue exists
- `next()` and `nextBatch()` reject in `reconciling`
- add `adopt()` and `restart()` service methods
- make `skip()` clear reconcile entries when relevant

**Step 3: Run targeted tests**

Run: `npx vitest run src/application/workflow-service.test.ts`

### Task 4: Wire CLI and protocol messaging

**Files:**
- Modify: `src/interfaces/cli.ts`
- Modify: `src/infrastructure/protocol-template.ts`
- Modify: `README.md`
- Modify: `README.en.md`

**Step 1: Write minimal implementation**

- add `adopt` and `restart` CLI commands
- update usage text and mandatory protocol
- document the reconcile gate in both READMEs

**Step 2: Run targeted tests**

Run: `npx vitest run src/e2e/operational-readiness.test.ts`

### Task 5: Run full verification

**Files:**
- No code changes

**Step 1: Run build**

Run: `npm run build`

**Step 2: Run smoke suite**

Run: `npm run test:smoke`

**Step 3: Review outputs**

Expect: all targeted tests and smoke suite pass.
