# FlowPilot

[中文](README.md)

**One file, one requirement, fully automated development.**

Drop `flow.js` into any project, open your preferred client (`Claude Code`, `Codex`, `Cursor`, `snow-cli`, etc.), describe what you want, then go grab a coffee.
When you come back, the code is written, tests have passed, and git commits are done.

> Update: FlowPilot now supports `Claude Code`, `Codex`, `Cursor`, `snow-cli`, and other clients. During `init`, you can directly choose the target client and generate the matching instruction file / setup extras.

> Update: The built-in `AGENTS.md` / client-specific templates now include **response-style shaping**. They rein in the overly verbose default output common in GPT-style clients and make it closer to Claude-style communication: **conclusion first, details after, concise, direct, terminal-friendly** — while still enforcing parallelism, safety confirmation, and engineering discipline.

> Multi-client full-auto parallel switches:
> - `Claude Code`: enable Agent Teams
> - `Codex`: set `multi_agent = true` in `~/.codex/config.toml`, and preferably run with `codex --yolo`
> - `Cursor`: enable `Agents` and set `Auto-Run Mode` to `Run Everything`

## Recent Updates

**OpenSpec Integration** — Task parser supports OpenSpec checkbox format, dual-path protocol auto-selects standard/OpenSpec planning flow, supports `tasks.md` auto-discovery with user confirmation

**Long-term Memory System** — Checkpoint auto-extracts knowledge into `.flowpilot/memory.json`, BM25 + Dense dual-path retrieval, MMR re-ranking + time decay, `next` auto-injects relevant memories into sub-agent context

**Self-Evolution Engine (Full Loop)** — Reflect → Experiment → Review three-phase cycle, both success and failure trigger evolution, parameters written to config are consumed by the workflow, degradation auto-rollback

| Module | Score | Key Features |
|--------|-------|-------------|
| Memory System | 100% | BM25 sparse vectors (FNV-1a 20-bit), Dense Vector retrieval, RRF tri-source fusion, Multimodal embedding, 10-language tokenization, TTL+LRU cache |
| Loop Detection | 100% | Repeated failure/ping-pong/global circuit breaker + FNV-1a hash + warning injection (original) |
| History Evolution | 100% | Three-phase cycle (Reflect→Experiment→Review), heartbeat self-check, pre-snapshot rollback, protocol self-modification, active time window |
| Knowledge Extraction | 95% | LLM + rule engine dual-path, tag extraction, decision pattern matching, 30+ tech stack detection |

---

## Why FlowPilot

Traditional CC development: you're the project manager — breaking down tasks, assigning, following up, reviewing, watching the whole time.
FlowPilot: you're the client — just say what you want, everything else is automatic.

| Traditional CC Development | FlowPilot Development |
|---|---|
| Manually break down tasks, tell CC one by one | One requirement, auto-decompose into 10+ tasks |
| Context full? Start over | New window, one sentence, resume from breakpoint, zero loss |
| Can only do one thing at a time | Multiple sub-agents develop in parallel, double the speed |
| Forget previous decisions halfway through | Four-layer memory + cross-workflow long-term memory, 100 tasks without getting lost |
| Manual git commit every time | Auto-commit per task, auto-run tests at finalization |
| Reconfigure for each project | 99KB single file, copy and use — Node/Rust/Go/Python/Java/C++/Makefile all supported |
| Make the same mistakes every time | Self-evolution engine, auto-reflects and optimizes each round, gets smarter over time |

### How It Compares

**vs Claude Code Native Sub-Agents (Task Tool)**

CC's built-in Task tool can dispatch sub-agents, but it's **stateless** — context is bound to the current conversation, close the window and it's gone. FlowPilot solves three things native can't do:

1. **Interruption-proof**: All state persisted to disk — compact, crash, close window, doesn't matter. `resume` to continue instantly
2. **Bloat-proof**: Main agent only reads progress.md (< 100 lines), stays fast even with 100 tasks
3. **Auto-parallel**: Dependency graph analysis + batch dispatch, no manual scheduling needed

| | Native Task | FlowPilot |
|---|---|---|
| State persistence | In conversation, lost on compact | Disk files, never lost |
| Interruption recovery | Depends on conversation history, state easily lost after compact | Disk recovery, `resume` to continue |
| Parallel scheduling | Manual | Auto dependency analysis, batch dispatch |
| Context bloat | Main agent gets slower over time | Four-layer memory, main agent < 100 lines |
| Git commits | Manual | Auto-commit per task |
| Final verification | None | Auto build/test/lint |
| Cross-session memory | None, starts from zero each time | Long-term memory store, auto-retrieval and injection |
| Self-optimization | None | Three-phase evolution, gets smarter over time |

**vs OpenSpec (Spec-Driven Framework)**

[OpenSpec](https://github.com/Fission-AI/OpenSpec) solves "how to think through requirements before writing code", producing proposal/spec/design documents. FlowPilot solves "how to fully automate execution after requirements are clear", producing runnable code and git history.

| | OpenSpec | FlowPilot |
|---|---|---|
| Focus | Planning layer: requirements → spec documents | Execution layer: tasks → code → commits |
| Output | Markdown documents | Runnable code + git history |
| Execution | Documents done, still need manual/AI implementation one by one | Fully automated dispatch, parallel execution, auto-commit |
| Scope | Tool-agnostic, 20+ AI assistants | Claude Code exclusive, deep integration |

FlowPilot's core advantage is **end-to-end automation** — from requirements to code to commits to verification, no human needed in between. OpenSpec is stronger at the planning stage; the two have been integrated:

**OpenSpec + FlowPilot Integration**: FlowPilot's task parser automatically supports OpenSpec's checkbox format (`- [ ] 1.1 Task`), no format conversion needed. The workflow protocol has built-in dual paths:

| Path | Trigger | Flow |
|------|---------|------|
| Path A (Standard) | Default | brainstorming → generate tasks → `flow.js init` |
| Path B (OpenSpec) | Project has `openspec/` + CLI available | `/opsx:new` → `/opsx:ff` → `cat tasks.md \| flow.js init` |

Additionally, the protocol auto-detects `tasks.md` in the project root and prompts the user for confirmation. Users can also provide task lists directly in their messages.

## 30-Second Demo

```bash
cp dist/flow.js your-project/
cd your-project
node flow.js init
```

Open Claude Code and describe your requirements:

```
You: Build an e-commerce system with user registration, product management, shopping cart, and order payment

(Then just walk away)
```

CC will automatically: decompose tasks → identify dependencies → dispatch sub-agents in parallel → write code → checkpoint → git commit → run build/test/lint → done.

## Core Advantages

### Unlimited Context — 100 Tasks Without Compact Loss

Four-layer memory architecture, main agent context always < 100 lines:

| Layer | Reader | Content |
|-------|--------|---------|
| progress.md | Main agent | Minimal status table (one line per task) |
| task-xxx.md | Sub-agent | Detailed output and decisions per task |
| summary.md | Sub-agent | Rolling summary (auto-compressed after 10 tasks) |
| memory.json | Sub-agent | Cross-workflow long-term memory (auto-retrieval and injection) |

Sub-agents record their own output, main agent doesn't bloat. Even after compact, files remain — resume and continue. Long-term memory persists across workflows; experience learned in one round is auto-injected into the next.

### Parallel Development — Not One by One, All at Once

```
Sequential: DB → User API → Product API → User Page → Product Page    (5 rounds)
Parallel:   DB → [User API, Product API] → [User Page, Product Page]  (3 rounds)
```

`flow next --batch` automatically finds all parallelizable tasks, main agent dispatches multiple sub-agents simultaneously in a single message.

### Zero-Drift Recovery — Never Lose a Step

Close window, lose network, compact, CC crash — bring it on:

```
New window → Say: continue task → flow resume
  ├─ no pending task-owned changes: reset unfinished tasks → continue
  └─ pending task-owned changes detected: pause scheduling → adopt / after handling only the listed task-owned changes restart → continue
```

All state persisted in files, independent of conversation history. Even if 3 sub-agents are interrupted simultaneously during parallel execution, FlowPilot will not blindly re-dispatch them when pending task-owned changes exist; it pauses and requires reconciliation first.

### Iterative Review — Run Another Round, Keep Improving

After a workflow round completes automatically, you can start a new workflow round to review the previous output: check if implementation drifted from requirements, patch gaps, improve code quality. The whole process is extremely fast — iterating a few more rounds costs very little. Compared to manually orchestrating CC Agent Teams natively, the efficiency gain is significant and highly cost-effective — why not spend the saved time with your family?

```
Round 1: Requirements → Fully automated implementation → Code output
Round 2: Review → Find drift/defects → Auto-patch
Round 3: Polish → Code quality improvement → Final verification
```

### Self-Evolution — Each Round Makes the Next Smarter

FlowPilot has a built-in three-phase organic evolution cycle. Both success and failure trigger evolution, with results written to `.flowpilot/config.json` and consumed by maxRetries / hints / verify / hooks; `parallelLimit` remains a manual operator setting and is not rewritten by automatic evolution:

```
finish() triggers:
  Reflect → Analyze success/failure patterns (failure chains, retry hotspots, type concentration)
  Experiment → Auto-adjust config params and protocol templates, save full snapshots

review() triggers:
  Review (self-healing) → Compare metrics before/after evolution, auto-rollback if degraded

Finalization phase (optional):
  CC sub-agent + brainstorming skill deep reflection → node flow.js evolve to apply results
```

| Phase | Trigger | What It Does |
|-------|---------|-------------|
| Reflect | End of finish | LLM or rule-based analysis of workflow stats → findings + experiments |
| Experiment | End of finish | Auto-adjust config params and protocol templates, save full snapshots |
| Review | During review | Compare metrics before/after evolution, auto-rollback if degraded, check config integrity |

Evolution results directly affect workflow behavior:

| Parameter | Effect |
|-----------|--------|
| `maxRetries` | Determines retry count on checkpoint failure |
| `parallelLimit` | Limits parallel task count in `nextBatch`; when unset FlowPilot does not artificially cap the batch, and `1` effectively forces serial execution (manual-only, not evolution-managed) |
| `hints` | Injected into sub-agent context as "evolution suggestions" |

- On success: optimize retries and experience hints
- On failure: add pre-check suggestions and tune retries/verification
- With `ANTHROPIC_API_KEY`: deep LLM analysis. Without: rule engine fallback — graceful degradation under zero-dependency constraints

### 99KB Does It All — Zero Dependencies, Copy and Use

- Single file `dist/flow.js`, 99KB
- Zero runtime dependencies, only needs Node.js
- Auto-detects 8 project types, runs corresponding verification commands at finalization, and reports passed / skipped / not-found states explicitly

## Documentation

- [Quick Start](docs/quick-start.en.md) — No theory needed, 3 steps to fully automated development
- [Usage Guide](docs/usage-guide.en.md) — Complete command reference, parallel development tips, task design examples

## Prerequisites

Install plugins first for best results (sub-agent functionality degrades without them). Run `/plugin` in CC to open the plugin store and install:

- `superpowers` — Requirement decomposition brainstorming
- `frontend-design` — Frontend tasks
- `feature-dev` — Backend tasks
- `code-review` — Finalization code review
- `context7` — Real-time third-party library documentation lookup

Client-side parallel / auto-run switches:

- `Claude Code`
  - Add to `~/.claude/settings.json`:
    ```json
    "env": {
      "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
    }
    ```
- `Codex`
  - Add to `~/.codex/config.toml`:
    ```toml
    [features]
    multi_agent = true
    ```
  - For unattended execution, prefer `codex --yolo`
- `Cursor`
  - Enable `Agents` in settings
  - Set `Auto-Run Mode` to `Run Everything`
- `Other clients`
  - No single standard exists; self-test multi-agent / auto-run behavior first

In setup mode, `node flow.js init` now shows direct client options:
- `Claude Code`: generates `AGENTS.md` + `.claude/settings.json`
- `Codex`: generates `AGENTS.md` with extra Codex-specific enhancement rules
- `Cursor` / `Other`: generate the generic `AGENTS.md`
- `snow-cli`: generates `AGENTS.md` + `ROLE.md` with identical content

Missing plugins are still reported in the output.

Setup/init changes to the instruction file (new projects default to `AGENTS.md`, existing `CLAUDE.md` projects remain compatible), `.claude/settings.json`, and `.gitignore` follow ownership-based cleanup: FlowPilot only removes what it created or injected, and `flow finish` refuses the final commit if user residue still remains afterward.

By default, FlowPilot also ensures these local-only paths are ignored in the repo `.gitignore`: `.workflow/` (local transient runtime state), `.flowpilot/` (local persistent product state), `.claude/settings.json` (local integration state), and `.claude/worktrees/` (local worktree directory). It does not ignore the entire `.claude/` directory.

## Quick Start

```bash
# Build single file
cd FlowPilot && npm install && npm run build

# Automation-friendly validation scripts
npm run test:smoke
npm run test:run

# Copy to any project
cp dist/flow.js /your/project/
cd /your/project

# Initialize (shows client options; new projects default to AGENTS.md)
node flow.js init

# Launch CC in fully automated mode, describe your requirements, everything else is automatic
claude --dangerously-skip-permissions
```

> `--dangerously-skip-permissions` skips all permission prompts for truly unattended operation.

Interruption recovery:
```bash
# Claude Code
claude --dangerously-skip-permissions --continue   # Resume most recent conversation
claude --dangerously-skip-permissions --resume     # Pick from conversation history

# Codex
codex --yolo
```

- `Claude Code`: prefer `--continue` / `--resume`
- `Codex`: re-enter the project directory, launch `codex --yolo`, then say "continue task"
- `Cursor`: reopen the project and continue in the existing chat or a new one
- `snow-cli` / other clients: reopen the project, restore or start a new session, then say "continue task"

If the worktree still has unarchived changes when resuming, `resume` explicitly tells you which changes predate the workflow, which ones are pending task-owned changes left by interrupted tasks, and whether the dirty baseline is missing.

## Architecture Overview

```
Main Agent (dispatcher, < 100 lines context)
  │
  ├─ node flow.js next ──→ Returns tasks + dependency context + relevant memories
  │
  ├─ Sub-Agents (dispatched via Task tool)
  │   ├─ frontend → /frontend-design plugin + other matching Skills/MCP
  │   ├─ backend  → /feature-dev plugin + other matching Skills/MCP
  │   └─ general  → Direct execution + other matching Skills/MCP
  │
  ├─ node flow.js checkpoint ──→ Record output + knowledge extraction + git commit
  │
  ├─ .workflow/ (local transient runtime state)
  │   ├─ progress.md        # Task status table (main agent reads)
  │   ├─ tasks.md           # Complete task definitions
  │   ├─ config.json        # Runtime file (legacy-compatible, migration recommended)
  │   └─ context/
  │       ├─ summary.md     # Rolling summary
  │       └─ task-xxx.md    # Detailed output per task
  │
  └─ .flowpilot/ (local persistent product state)
      ├─ config.json        # Persistent config (maxRetries/parallelLimit/hints/verify/hooks)
      ├─ memory.json        # Long-term memory store (knowledge entries + tags + timestamps)
      └─ evolution/         # Evolution history (reflect/experiment/review records)
```

## Four-Layer Memory

| Layer | File | Reader | Content |
|-------|------|--------|---------|
| Layer 1 | progress.md | Main agent | Minimal status table (ID/title/status/summary) |
| Layer 2 | context/task-xxx.md | Sub-agent | Detailed output and decision records per task |
| Layer 3 | context/summary.md | Sub-agent | Rolling summary (tech stack/architecture decisions/completed modules) |
| Layer 4 | .flowpilot/memory.json | Sub-agent | Cross-workflow long-term memory (tagged knowledge entries) |

`flow next` auto-assembles: summary + dependency task contexts + relevant memories → injected into sub-agent prompt.
Main agent only ever reads progress.md, minimal context footprint.

## Long-term Memory System

Cross-workflow persistent knowledge store, saved in `.flowpilot/memory.json`.

### Write → Store → Retrieve → Inject

```
checkpoint (success/failure)
    ↓
Knowledge extraction (LLM smart extraction or rule engine fallback)
    ↓
Store to .flowpilot/memory.json (with tags, timestamps, source)
    ↓
Semantic retrieval of relevant memories during next/nextBatch
    ↓
Inject into sub-agent context with [source] tags
```

### Knowledge Extraction

Sub-agents mark key knowledge in checkpoint summaries using tags:

| Tag | Purpose | Example |
|-----|---------|---------|
| `[REMEMBER]` | General experience | `[REMEMBER] Vite requires resolve.alias config for @ paths` |
| `[DECISION]` | Architecture/tech decisions | `[DECISION] Chose Zustand over Redux due to small project scope` |
| `[ARCHITECTURE]` | System architecture | `[ARCHITECTURE] Using monorepo + turborepo structure` |

Extraction paths:
- With `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` → LLM smart extraction + deduplication (Claude Haiku)
- Without API key → Rule engine tag matching (zero-dependency fallback)

### Retrieval Engine

- BM25 sparse vectors + forward maximum matching Chinese tokenization + technical vocabulary
- With `EMBEDDING_API_KEY`: additional Dense embedding dual-path fusion
- MMR re-ranking for redundancy removal + time decay (half-life 30 days)
- Architecture and decision memories do not decay, permanently retained

### Usage

- Auto-injection: `next`/`next --batch` auto-retrieves and injects relevant memories
- Manual query: `node flow.js recall <keywords>`

## Command Reference

```bash
node flow.js init [--force]       # Initialize/take over project
node flow.js next [--batch]       # Get next/all parallelizable tasks
node flow.js checkpoint <id>      # Record task completion (stdin/--file/inline) [--files f1 f2 ...]
node flow.js skip <id>            # Manually skip a task
node flow.js review               # Mark code-review as done + evolution self-healing check
node flow.js finish               # Smart finalization (verify+summarize+final commit only when boundary is safe)
node flow.js status               # View global progress
node flow.js resume               # Interruption recovery
node flow.js add <desc> [--type]  # Add task (frontend/backend/general)
node flow.js recall <keywords>    # Retrieve historical memories (BM25 + Dense dual-path)
node flow.js evolve               # Accept CC sub-agent reflection results and apply evolution
```

Companion npm scripts:
- `npm run test:run`: execute the full Vitest suite once
- `npm run test:smoke`: execute workflow-boundary smoke tests for quick command/doc validation

## Execution Flow (Fully Automated)

```
node flow.js init
       ↓
  Protocol embedded in the instruction file (AGENTS.md by default for new projects, CLAUDE.md for legacy repos) + client-specific setup extras when selected
       ↓
  User describes requirements / provides dev docs
       ↓                          ← Everything below is fully automated, no human intervention
  ┌─→ flow next (--batch) ──→ Get tasks + context + relevant memories
  │        ↓
  │   Sub-agent executes (auto-selects plugins)
  │        ↓
  │   flow checkpoint ──→ Knowledge extraction → Record output + git commit
  │        ↓
  └── More tasks? ──→ Yes → Loop
                   No ↓
              flow finish ──→ build/test/lint + Reflect + Experiment
                   ↓
              code-review ──→ flow review (evolution self-healing check)
                   ↓
              flow evolve (optional, CC deep reflection)
                   ↓
              flow finish ──→ Verification passed → Final commit → idle
```

## Error Handling

- **Task failure** — Auto-retry 3 times, still failing after 3 → mark `failed` and skip
- **Cascade skip** — Downstream tasks depending on failed tasks auto-marked `skipped`
- **Interruption recovery** — clean interruptions reset `active` tasks back to `pending`; when interrupted task-owned changes exist, the workflow enters `reconciling` and requires `adopt`, or handling only the listed task-owned changes before `restart`, before any next task can be dispatched
- **Verification failure** — `flow finish` reports error, dispatch sub-agent to fix, retry finish
- **Final commit refusal** — after verify/review, `flow finish` also checks the dirty baseline, checkpoint-owned files, and cleanup results for the instruction file (`AGENTS.md`, or legacy `CLAUDE.md`) / `.claude/settings.json` / `.gitignore`; any unsafe boundary causes an explicit refusal with the file list
- **Loop detection** — Three-strategy defense (repeated failures/ping-pong/global circuit breaker), auto-injects warnings into next task
- **Health check** — Active task timeout (>30min) alerts, memory bloat (>100 entries) auto-compaction
- **Evolution rollback** — If experiments degrade metrics, `review` auto-rolls back to pre-experiment snapshot

## Environment Variables

All environment variables are optional. FlowPilot runs fully without any API keys.

| Variable | Purpose | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | LLM smart extraction + evolution reflection | Enables Claude Haiku for knowledge extraction and deduplication |
| `ANTHROPIC_AUTH_TOKEN` | Same as above (either one) | Equivalent to `ANTHROPIC_API_KEY`, takes priority |
| `ANTHROPIC_BASE_URL` | API proxy address | Custom API endpoint for proxy/mirror scenarios |
| `EMBEDDING_API_KEY` | Dense embedding dual-path fusion | Enables vector embedding, fused with BM25 for improved retrieval precision |

Fallback strategy:
- Without `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` → Knowledge extraction falls back to rule engine tag matching
- Without `EMBEDDING_API_KEY` → Retrieval uses BM25 sparse vectors only (still effective)

## Development

```bash
cd FlowPilot
npm install
npm run build        # Build → dist/flow.js
npm run dev          # Dev mode
npm test             # Run tests
```

### Source Structure

```
src/
├── main.ts                          # Entry point, dependency injection
├── domain/
│   ├── types.ts                     # TaskEntry, ProgressData and other types
│   ├── task-store.ts                # Task state management (pure functions)
│   ├── workflow.ts                  # WorkflowDefinition
│   └── repository.ts               # Repository interface
├── application/
│   └── workflow-service.ts          # Core use cases (16)
├── infrastructure/
│   ├── fs-repository.ts             # File system + protocol embedding + Hooks injection
│   ├── markdown-parser.ts           # Task Markdown parser (compatible with FlowPilot/OpenSpec dual formats)
│   ├── memory.ts                    # Smart memory engine (BM25 + vector index + RRF + MMR + LRU cache)
│   ├── extractor.ts                 # Knowledge extraction (LLM + rule engine fallback)
│   ├── truncation.ts                # CJK-aware smart truncation
│   ├── loop-detector.ts             # Three-strategy loop detection
│   ├── history.ts                   # History analysis + three-phase self-evolution (Reflect/Experiment/Review)
│   ├── git.ts                       # Auto git commits (submodule-aware)
│   ├── verify.ts                    # Multi-language project verification (8 types)
│   ├── hooks.ts                     # Lifecycle hooks
│   ├── protocol-template.ts         # Workflow protocol template (dual-path: standard/OpenSpec)
│   └── logger.ts                    # Structured logging (JSONL)
└── interfaces/
    ├── cli.ts                       # Command routing
    ├── formatter.ts                 # Output formatting
    └── stdin.ts                     # Stdin reading
```

### Dependency Direction

```
interfaces → application → domain ← infrastructure
```

Zero runtime external dependencies, only Node.js built-in modules (fs, path, child_process, crypto, https). LLM smart extraction, long-term memory dual-path retrieval, and self-evolution reflection are all optional enhancements, enabled on demand via environment variables (`ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN`/`EMBEDDING_API_KEY`). Without API keys, the system auto-degrades to the rule engine.

## License

This project is open-sourced under the [MIT License](LICENSE).

Copyright (c) 2025-2026 FlowPilot Contributors

## Uninstalling FlowPilot

If you no longer want FlowPilot in a project, remove the files it copied in or generated at runtime:

- `flow.js` (the single-file tool you copied into the project)
- the instruction file:
  - usually `AGENTS.md` for new projects
  - possibly `CLAUDE.md` for legacy-compatible setups
  - `ROLE.md` as well in `snow-cli` mode
- `.claude/settings.json` (if FlowPilot generated it in `Claude Code` mode)
- `.workflow/` (local transient runtime state)
- `.flowpilot/` (local persistent state)

Typical cleanup:

```bash
rm -rf flow.js AGENTS.md CLAUDE.md ROLE.md .claude/settings.json .workflow .flowpilot
```

Notes:
- If you manually added long-term project guidance into `AGENTS.md` / `CLAUDE.md` / `ROLE.md`, keep what you need before deleting them
- If deleting `settings.json` leaves `.claude/` empty, you can remove the directory too
- If you only want to disable the workflow but keep the instruction file, you can remove just `flow.js`, `.claude/settings.json`, `.workflow/`, and `.flowpilot/`
