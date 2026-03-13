# decisions.md

## Purpose

This file records stable repository-wide decisions for the **OpenClaw Project Initializer**.

Future execution agents should treat these decisions as settled unless a newer decision explicitly supersedes them.

Use this file to reduce repeated debate, avoid scope drift, and preserve implementation continuity across cycles.

Rules:

- append new decisions
- do not rewrite history unless a decision is formally superseded
- if a decision is replaced, mark the older one as superseded
- keep entries short, clear, and actionable

---

## Status labels

Use one of these labels:

- `accepted`
- `superseded`
- `provisional`

---

## Decision format

Each entry should use this structure:

- ID
- Date
- Status
- Decision
- Reason
- Consequences

---

## Decisions

### DEC-001
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** `PRD.md` is the primary product-definition file for this repository.
- **Reason:** This project is being built using PRD-driven development, so product scope, goals, non-goals, and acceptance criteria must come from a single authoritative source.
- **Consequences:** All implementation work must trace back to `PRD.md`. Supporting documents may refine details, but they must not contradict it.

### DEC-002
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The repository will be implemented incrementally through story-based execution.
- **Reason:** The project is intended to be developed using Codex + Ralph loop, which works best with small, reviewable, bounded units of work.
- **Consequences:** Work should proceed one story at a time. Large multi-feature jumps and parallel story execution are out of scope.

### DEC-003
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The V0 supports only one project archetype: `Next.js + Payload + PostgreSQL`.
- **Reason:** The project must prove value on one archetype before expanding. Supporting many stacks too early would reduce quality and increase ambiguity.
- **Consequences:** Discovery, playbooks, templates, schemas, and bootstrap generation in V0 should be optimized for this archetype first.

### DEC-004
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The product will start as a local CLI tool.
- **Reason:** A local CLI is the simplest operational form for personal reuse and fast iteration.
- **Consequences:** The initial architecture should prioritize command-line flow, local file generation, and container-safe execution over service or UI concerns.

### DEC-005
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The initial CLI command is `initializer new`.
- **Reason:** The command expresses the core V0 action clearly: create a new project bootstrap from guided discovery.
- **Consequences:** Early CLI design, docs, and stories should revolve around the `initializer new` flow.

### DEC-006
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** Generated project output must be written to a new directory.
- **Reason:** Generating into a fresh directory reduces accidental overwrite risk and makes review safer and clearer.
- **Consequences:** The CLI must plan output paths explicitly and should avoid writing into existing directories unless a future approved decision changes this behavior.

### DEC-007
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The V0 generates documentation, structure, and operational context, but does not implement project business features.
- **Reason:** The initializer’s role is to create a strong starting point, not to act as the implementation engine.
- **Consequences:** V0 work should focus on artifact generation, folder structure, playbooks, schemas, and bootstrap orchestration. Feature implementation belongs to the later Codex/Ralph phase.

### DEC-008
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** Human review is mandatory before any handoff to Codex + Ralph loop.
- **Reason:** Critical architectural alignment and bootstrap quality must be reviewed before execution begins.
- **Consequences:** The initializer must stop after generation and present a reviewable state rather than immediately continuing into implementation.

### DEC-009
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** Critical architecture decisions must never be silently assumed.
- **Reason:** Silent assumptions at bootstrap time can contaminate the entire downstream execution flow.
- **Consequences:** The system must ask explicit follow-up questions for items such as multi-tenancy, auth scope, public signup, storage strategy, preview, audit logging, background jobs, and i18n.

### DEC-010
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The initial defaults are PostgreSQL for database, Docker for local runtime/deploy target, and lint/typecheck/build for validation.
- **Reason:** These defaults match the intended first archetype and reduce repeated setup decisions.
- **Consequences:** Discovery may override these defaults, but V0 should assume them unless explicitly changed by the user.

### DEC-011
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** Playbooks will be authored in YAML.
- **Reason:** YAML is readable, expressive for configuration, and suitable for playbook-driven discovery and bootstrap orchestration.
- **Consequences:** Playbook loading, validation, and documentation should assume YAML as the canonical format.

### DEC-012
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The V0 runtime will use Python in a containerized execution model.
- **Reason:** Python is suitable for CLI orchestration, file generation, schema validation, and templating, while containerization adds safety and reproducibility.
- **Consequences:** The repository should be structured for a Python-based CLI and later include container support as part of the local execution model.

### DEC-013
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The repository will maintain `progress.txt` as append-only operational memory.
- **Reason:** Story-based execution requires durable, low-friction tracking of work performed, blockers, and validation outcomes.
- **Consequences:** Agents must update `progress.txt` after meaningful work and should use it as the primary execution log.

### DEC-014
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** `AGENTS.md` defines repository execution behavior for Codex + Ralph loop.
- **Reason:** The execution layer needs explicit repository-local rules for read order, validation, story discipline, and safety boundaries.
- **Consequences:** Agents operating in this repository should follow `AGENTS.md` unless superseded by higher-priority repository context.

### DEC-015
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The V0 is personal-reuse-first, not team-first or productized-first.
- **Reason:** The fastest way to validate the initializer is to solve the author’s own repeated workflow before broadening the target audience.
- **Consequences:** Early UX, defaults, and structure may optimize for one operator’s workflow. Broader team concerns can be addressed in later phases.

### DEC-016
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** OpenClaw integration is not required for the first implementation milestone.
- **Reason:** The product value can be proven first as a standalone initializer before deeper coupling with external orchestration layers.
- **Consequences:** Initial implementation should prioritize local CLI flow and artifact generation. Future OpenClaw integration may be added after V0 proves itself.

### DEC-017
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The initializer’s required V0 outputs are `PRD.md`, `prd.json`, `decisions.md`, `progress.txt`, `AGENTS.md`, `README.md`, `.env.example`, `docker-compose.yml`, base folder structure, and initial stories.
- **Reason:** These artifacts together form the minimum viable handoff package for PRD-driven execution.
- **Consequences:** V0 is not complete unless it can generate the full bootstrap package, not just a subset.

### DEC-018
- **Date:** 2026-03-13
- **Status:** provisional
- **Decision:** Internal structured contracts such as playbook schemas and bootstrap input schemas should be introduced as implementation deliverables, not as preconditions for starting the repository.
- **Reason:** The project should begin from product definition and story-driven execution, allowing internal contracts to emerge as explicit deliverables.
- **Consequences:** Early development can begin with core docs and stories first. Schema files should be added in dedicated stories and may evolve as the implementation stabilizes.

### DEC-019
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** Discovery and PRD generation for the generated project are handled by OpenClaw with a local model, while implementation is handled later by Codex using the user's account with GPT-5.4.
- **Reason:** The product needs a clear separation between planning and execution. A local model is sufficient for guided questioning, stack definition, and PRD writing, while Codex with GPT-5.4 is better suited for disciplined story-based implementation after human approval.
- **Consequences:** The V0 must stop after generating a reviewable bootstrap package. The local discovery model must not implement the generated project's code. Codex only begins after explicit human approval of the bootstrap artifacts.