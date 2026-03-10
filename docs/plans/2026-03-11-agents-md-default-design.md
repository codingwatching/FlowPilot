# AGENTS.md Default Design

## Goal

For new projects, FlowPilot should generate `AGENTS.md` instead of `CLAUDE.md`, while keeping old projects that already use `CLAUDE.md` fully compatible.

## Scope

- New setup/init writes `AGENTS.md`
- Existing `CLAUDE.md` projects continue to work
- Cleanup and finish boundaries follow the actually injected file path
- Protocol content stays the same for now

## Chosen Behavior

Instruction file selection order:

1. If `AGENTS.md` already exists, use it
2. Else if `CLAUDE.md` already exists, use it for backward compatibility
3. Else create `AGENTS.md`

This means:
- new projects converge on `AGENTS.md`
- legacy projects are not forced to migrate immediately

## Implementation Notes

- Keep the existing repository API name if needed to minimize churn, but change its behavior to resolve the instruction file path dynamically
- Extend the setup injection manifest to record which instruction file path was injected
- Cleanup should remove only the injected block from the recorded path
- Finish boundary checks should treat both `AGENTS.md` and `CLAUDE.md` as setup-owned candidates, but prefer the manifest path

## Tests

- repository test: fresh setup creates `AGENTS.md`
- repository test: pre-existing `CLAUDE.md` remains the compatibility target
- cleanup test: injected block is removed from `AGENTS.md`
- e2e test: fresh repo finishes with `AGENTS.md` cleaned up, not `CLAUDE.md`
