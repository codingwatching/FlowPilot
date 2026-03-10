# Resume Reconcile Design

## Problem

Current `resume` behavior resets interrupted `active` tasks back to `pending` and allows `next` to dispatch them again immediately. When interrupted tasks already left dirty business files in the worktree, the new session does not "adopt" that partial state. It simply re-runs the task from the top.

That creates two failure modes:

- repeated terminal commands against half-finished state
- inability to finish later because the residue was never checkpoint-owned

## Desired Behavior

When `resume` detects interrupted residue:

1. Stop normal scheduling.
2. Tell the operator which interrupted tasks require reconciliation.
3. Force an explicit choice before any next task can run:
   - `adopt`: claim the interrupted residue as the task result and checkpoint it
   - `restart`: only after residue is cleared, allow the task to be re-run from scratch

Only after all interrupted tasks are reconciled can the workflow return to normal `running` state.

## Approaches Considered

### 1. Prompt-only reminder

Keep the state machine unchanged and only change `resume` wording.

- Pros: tiny patch
- Cons: does not solve the root cause; AI can still re-run old commands

Rejected.

### 2. Soft gate through task context

Keep workflow `running`, but inject residue warnings into the next task context and ask the agent to inspect them first.

- Pros: smaller state change
- Cons: still relies on agent compliance; `next` can still re-dispatch too early

Rejected.

### 3. Hard gate with explicit reconcile state

Introduce a dedicated workflow status for interrupted residue reconciliation and persist the interrupted task IDs separately from normal task progression.

- Pros: blocks accidental re-dispatch, matches user expectation, preserves safety boundary
- Cons: requires new commands and state plumbing

Chosen.

## Chosen Design

### State Model

- Add workflow status: `reconciling`
- Persist reconcile metadata in runtime state:
  - interrupted task IDs
  - first interrupted task ID for user-facing messages

### Resume Behavior

- If interrupted tasks exist and no new residue exists:
  - keep current clean-restart behavior
- If interrupted tasks exist and new residue exists:
  - reset interrupted tasks to `pending`
  - switch workflow status to `reconciling`
  - persist reconcile task IDs
  - return a message that scheduling is paused until reconciliation completes

### Scheduling Guard

- `next` and `next --batch` must refuse while workflow status is `reconciling`
- error message must direct the operator to `adopt`, `restart`, or `skip`

### Recovery Commands

`adopt <id>`
- allowed only in `reconciling`
- task ID must be one of the pending reconcile IDs
- records task context, owned files, summary, memory, and git commit similarly to a successful checkpoint
- marks the task `done`
- removes the task from reconcile state

`restart <id>`
- allowed only in `reconciling`
- task ID must be one of the pending reconcile IDs
- only allowed when interrupted residue has already been cleared from the worktree
- leaves task `pending`
- removes the task from reconcile state

If no reconcile tasks remain:
- clear reconcile runtime state
- move workflow back to `running`

### Skip Compatibility

- `skip <id>` during `reconciling` should also remove the task from reconcile state
- otherwise the workflow would remain blocked forever

## Testing

- unit/integration: `resume` enters `reconciling` when interrupted residue exists
- unit/integration: `next` is blocked during `reconciling`
- unit/integration: `adopt` unblocks and records ownership
- unit/integration: `restart` refuses while residue still exists, succeeds after cleanup
- e2e: interrupted workflow cannot continue until `adopt` or `restart`
