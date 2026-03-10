# AGENTS.md Default Implementation Plan

> **For Codex:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make FlowPilot default to `AGENTS.md` for new projects while preserving full compatibility with existing `CLAUDE.md` projects.

**Architecture:** Resolve the instruction-file path dynamically in the filesystem repository, persist that path in the injection manifest, and update cleanup/finish/docs/tests to follow the recorded path. Protocol content remains unchanged.

**Tech Stack:** TypeScript, Vitest, FlowPilot repository/runtime-state/application service

---

### Task 1: Add failing tests for AGENTS.md-first behavior

**Files:**
- Modify: `src/infrastructure/fs-repository.test.ts`
- Modify: `src/application/workflow-service.test.ts`
- Modify: `src/e2e/operational-readiness.test.ts`

**Step 1: Write the failing tests**

- Fresh setup creates `AGENTS.md`
- Existing `CLAUDE.md` is still used when present
- Cleanup/e2e expectations move from `CLAUDE.md` to `AGENTS.md` for fresh repos

**Step 2: Run tests to verify they fail**

Run: `npx vitest run src/infrastructure/fs-repository.test.ts src/application/workflow-service.test.ts src/e2e/operational-readiness.test.ts`

### Task 2: Persist the selected instruction file path

**Files:**
- Modify: `src/infrastructure/runtime-state.ts`

**Step 1: Write minimal implementation**

- Extend the instruction-file injection state with a `path`
- Preserve backward compatibility for older manifests with no path

**Step 2: Run targeted tests**

Run: `npx vitest run src/infrastructure/fs-repository.test.ts`

### Task 3: Implement AGENTS.md-first repository behavior

**Files:**
- Modify: `src/infrastructure/fs-repository.ts`
- Modify: `src/domain/repository.ts` comments if needed
- Modify: `src/application/workflow-service.ts`

**Step 1: Write minimal implementation**

- Resolve the instruction-file path with AGENTS-first / CLAUDE-compat behavior
- Record the selected path in setup-owned state and manifest
- Update cleanup and finish boundary logic to use the recorded path

**Step 2: Run targeted tests**

Run: `npx vitest run src/infrastructure/fs-repository.test.ts src/application/workflow-service.test.ts src/e2e/operational-readiness.test.ts`

### Task 4: Update docs and user-visible text

**Files:**
- Modify: `README.md`
- Modify: `README.en.md`
- Modify: `src/infrastructure/protocol-template.ts` only if file-name mentions exist

**Step 1: Write minimal implementation**

- Change new-project wording from `CLAUDE.md` to `AGENTS.md`
- Note that old `CLAUDE.md` projects are still supported

**Step 2: Verify**

Run: `npm run build`
Run: `npm run test:smoke`
