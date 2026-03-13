# PRD.md

## Product name

**OpenClaw Project Initializer**

---

## Version

`0.1`

---

## Status

`discovery-and-v0-definition`

---

## Product summary

**OpenClaw Project Initializer** is a local-first CLI tool for **PRD-driven project initialization**.

The user describes the project they want in natural language.

The system then:

1. identifies the project archetype,
2. asks guided follow-up questions,
3. consolidates missing architectural decisions,
4. generates the initial project bootstrap,
5. stops for human review,
6. and only after approval hands off the repository to **Codex + Ralph loop** for story-based implementation.

The goal of the V0 is **not** to implement features automatically.

The goal of the V0 is to transform an ambiguous idea into a **reviewable, operable, PRD-driven project skeleton**.

---

## Problem

Starting a new software project often has high friction.

Common pain points include:

- uncertainty about where to begin;
- repeated setup work across similar projects;
- inconsistent project documentation;
- missing early architectural decisions;
- lack of a standard handoff package for coding agents;
- repeated manual effort to prepare PRD, decisions, progress tracking, and agent instructions.

The result is that project initialization becomes slow, repetitive, and error-prone.

The product exists to reduce this friction by standardizing the beginning of PRD-driven projects.

---

## Target user

### Initial target user

The initial target user is the **author of the tool**, for personal reuse.

### Profile

The user:

- starts projects frequently;
- uses PRD-driven development;
- wants consistent initialization across repeated stacks;
- wants human approval before implementation;
- uses **Codex + Ralph loop** as the execution layer after bootstrap.

---

## Primary use case

A user wants to start a new software project.

Instead of manually creating the entire initial structure, the user runs a CLI command, describes the project, answers guided questions, and receives a fully generated bootstrap package containing project documentation, folder structure, and initial stories.

After reviewing the generated material, the user can move into the story execution phase with Codex and Ralph loop.

---

## V0 objective

The V0 must prove that the initializer can reliably generate a high-quality starting point for one project archetype.

The V0 should:

- accept a project idea in natural language;
- select a compatible archetype;
- ask missing questions;
- generate the initial project bootstrap;
- stop before implementation.

The V0 should **not** attempt to be a universal initializer.

---

## Supported archetype in V0

The first supported archetype is:

- **Next.js + Payload + PostgreSQL**

The V0 should support this archetype **very well**, instead of supporting many archetypes poorly.

---

## Product goals

### Goal 1 — Reduce initialization friction
Reduce repeated setup work when starting projects.

### Goal 2 — Standardize project beginnings
Ensure projects start with a consistent operational structure.

### Goal 3 — Improve architectural clarity
Force missing decisions to be made early through guided questioning.

### Goal 4 — Prepare high-quality handoff to execution
Generate the exact context needed for Codex + Ralph loop to work predictably.

### Goal 5 — Preserve human control
Keep critical architecture and implementation decisions under user approval.

---

## Non-goals

The V0 will **not**:

- deploy projects automatically;
- touch production environments;
- implement features automatically;
- execute multiple stories in parallel;
- make critical architecture decisions silently;
- become a full product generator for all stacks;
- replace human review.

---

## Core product flow

**Step 1 — User starts a new project**
The user runs:

```bash
initializer new
```

**Step 2 — User provides a free-text description**
Exemplo:
> "quero um admin com next, payload e postgres para gerenciar conteúdo, usuários internos e mídia"

**Step 3 — System detects the archetype**
The system identifies the best matching playbook.

**Step 4 — System asks guided questions**
The system fills gaps related to:
- product type;
- stack confirmation;
- database;
- deploy target;
- content model;
- auth and roles;
- system design constraints;
- scalability expectations;
- common architectural decisions for that archetype.

**Step 5 — System consolidates project context**
The system creates an internal resolved state for the project.

**Step 6 — System generates bootstrap artifacts**
The system generates the required project files and folder structure.

**Step 7 — System stops for human review**
The system presents the generated output and waits.

**Step 8 — Future handoff to Codex + Ralph loop**
Only after human approval does the project move to implementation.

---

## Functional Requirements

### FR-001 — CLI entrypoint
The product must expose a CLI entrypoint for project initialization.
Initial command:

```bash
initializer new
```

### FR-002 — Natural language project input
The CLI must accept a free-text description of the desired project.

### FR-003 — Archetype selection
The system must identify the intended project archetype based on the input.

### FR-004 — Guided questioning
The system must ask follow-up questions for all missing information needed to generate a coherent bootstrap.

### FR-005 — Architecture confirmation
The system must explicitly ask for confirmation on critical architecture decisions.

### FR-006 — Defaults
The system must support strong defaults to accelerate initialization.

Initial defaults:

- database: PostgreSQL
- deploy target: Docker
- validation: lint, typecheck, build

### FR-007 — Artifact generation
The system must generate the initial set of required project artifacts.

### FR-008 — Structure generation
The system must generate the initial folder structure for the project.

### FR-009 — Story seed generation
The system must generate initial project stories for later execution.

### FR-010 — Stop before implementation
The system must stop after bootstrap generation and before any feature implementation.

### FR-011 — New output directory
The generated project must be written into a new directory.

### FR-012 — Review-first workflow
The system must wait for explicit human review before any handoff to the execution layer.

## Required outputs in V0
The V0 must generate:
- `PRD.md`
- `prd.json`
- `decisions.md`
- `progress.txt`
- `AGENTS.md`
- `README.md`
- `.env.example`
- `docker-compose.yml`
- project folder structure
- initial stories

## Output philosophy
In the V0, the system generates:
- documentation,
- structure,
- operational context,
- initial backlog.

The V0 does not generate production-ready feature implementation.

## Guided question categories
The system should ask questions in at least these categories:
- project identity
- product type
- stack confirmation
- deploy target
- system design
- scalability expectations
- content model
- auth and authorization
- storage
- common architecture choices for the archetype
- non-functional constraints

## Critical decisions that must not be silently assumed
The system must never silently assume:
- multi-tenant architecture;
- auth for end users;
- public signup;
- storage backend beyond the chosen default;
- audit logging requirements;
- preview workflow requirements;
- draft/publish workflow;
- background jobs;
- i18n requirements;
- future architecture constraints with strong design impact.

## Default behavior in V0

### Runtime model
The V0 runs as a local CLI.

### Discovery and PRD generation model

The V0 discovery and PRD generation phase is handled by **OpenClaw + a local model**.

In the intended operating model, the local model is responsible for:

- asking guided follow-up questions;
- identifying missing product and architecture information;
- proposing the initial stack;
- writing and refining `PRD.md`;
- generating initial planning artifacts such as decisions and stories.

This phase is documentation-first and planning-first.

The local discovery model is **not** the implementation engine for the generated project.

### Implementation model separation

The V0 explicitly separates **discovery/planning** from **implementation**.

Responsibilities are divided as follows:

- **OpenClaw + local model**: discovery, questions, stack definition, PRD writing, planning artifacts, and story proposal
- **human reviewer**: approval of PRD, decisions, and generated bootstrap before implementation
- **Codex with GPT-5.4**: story-based implementation after explicit approval

This separation exists to keep the bootstrap phase controlled, reduce ambiguity, and ensure that implementation happens only after the project context has been reviewed.

### Execution environment
The CLI should run in a Python container for safety.

### Output model
The generated project should always be written to a new directory.

### Initial use model
The V0 is built for personal reuse first.

## Handoff model

The initializer ends at the point where the project bootstrap is fully generated and ready for review.

The V0 uses a split execution model:

### Phase 1 — Discovery and planning

Discovery and planning are handled by **OpenClaw + a local model**.

This phase is responsible for:

- interpreting the user's project idea;
- asking guided questions;
- identifying missing decisions;
- proposing the initial stack;
- writing or refining the project PRD;
- generating bootstrap planning artifacts.

This phase must stop before implementation.

### Phase 2 — Human review

After bootstrap generation, the user reviews:

- `PRD.md`
- `decisions.md`
- `progress.txt`
- `AGENTS.md`
- initial stories
- any other generated bootstrap artifacts

No implementation handoff should occur before this review.

### Phase 3 — Implementation

Only after explicit human approval does the project move to implementation.

Implementation is handled by **Codex using the user's account with GPT-5.4**.

The expected implementation flow is:

1. Codex reads project context;
2. Codex proposes a plan;
3. user approves the plan;
4. Codex implements;
5. Codex validates;
6. Codex shows diff;
7. Codex proposes commit;
8. user approves commit.

The local discovery model does **not** implement the generated project's code.
Its responsibility is limited to discovery, planning, and bootstrap preparation.

This handoff is outside the implementation scope of the V0, but the V0 must generate the context needed for it.

## Relationship with Ralph loop

Ralph loop is the future execution layer for story-based implementation.

The initializer is responsible for producing the inputs that make Ralph loop reliable:

- strong project documentation;
- explicit decisions;
- operational progress file;
- agent instructions;
- initial story seed.

In the intended operating model:

- **OpenClaw + local model** handles discovery and PRD generation
- **Codex with GPT-5.4** handles implementation
- **Ralph loop** governs disciplined story-by-story execution after approval

The initializer is **not** the implementation engine.

## Success criteria
The V0 is successful if it can:
- start from a natural language project description;
- correctly guide the discovery process for the supported archetype;
- generate all required bootstrap files;
- create a coherent project structure;
- create initial stories;
- reduce repeated setup work;
- produce an output that is clearly ready for human review;
- produce a repository that can later enter Codex + Ralph loop with low ambiguity.

## Failure conditions
The V0 is failing if:
- it generates inconsistent or incomplete project context;
- it skips important architectural questions;
- it silently makes critical decisions;
- it produces artifacts that are not useful for execution;
- it attempts to implement features prematurely;
- it requires excessive manual cleanup after generation.

## Constraints

### Operational constraints
- no production access;
- no deployment automation;
- no destructive actions;
- no parallel story execution;
- no autonomous architecture decisions on critical points.

### Product constraints
- one archetype only in V0;
- documentation and structure only;
- strong human review gate before execution.

## Assumptions
The V0 assumes:
- the user is comfortable reviewing generated documentation;
- the user wants PRD-driven project creation;
- the user values consistency over unlimited flexibility in V0;
- the user will manually approve handoff to Codex + Ralph loop;
- the first archetype is common enough to justify specialized handling.

## Risks

### Risk 1 — Over-design too early
The system may become overly abstract before proving value on one archetype.

### Risk 2 — Weak guided questions
If the questions are too generic, the bootstrap will be low quality.

### Risk 3 — Excessive defaults
If too much is assumed, the generated project may not match the user's intent.

### Risk 4 — Poor handoff quality
If the output is not shaped for Codex + Ralph loop, execution quality will degrade later.

### Risk 5 — Scope creep
Trying to support many project types too early may reduce quality of the first one.

## V0 scope summary

### Included in V0
- local CLI
- `initializer new`
- free-text project input
- guided discovery questions
- support for next + payload + postgres
- generation of docs and structure
- initial stories
- stop for human review

### Excluded from V0
- feature implementation
- deployment
- production access
- parallel stories
- multi-archetype robustness
- autonomous architectural decisions
- automatic commits

**Example V0 scenario**

A user wants to start a new editorial admin project.

The user runs:

```bash
initializer new
```

The user describes the project.  
The system detects that the project matches the next-payload-postgres archetype.  
The system asks about:
- admin vs public frontend;
- collections;
- globals;
- roles;
- storage;
- draft/publish;
- preview;
- multi-tenancy;
- audit log;
- scalability expectations.

The system then generates the project bootstrap in a new folder, including all required files and the initial stories, and stops for review.

## Future roadmap after V0

### Phase 1
Stabilize the next + payload + postgres archetype.

### Phase 2
Add structured playbook validation and internal schemas.

### Phase 3
Add more archetypes.

### Phase 4
Add stronger integration with Ralph loop and Codex handoff automation.

### Phase 5
Consider team-oriented reuse beyond personal use.

## Acceptance criteria for V0
The V0 is acceptable when:
- a user can run `initializer new`;
- the system can process a free-text project description;
- the system can guide the user through missing architectural questions;
- the system can generate all required bootstrap artifacts;
- the system can create the output in a new directory;
- the system stops before implementation;
- the output is usable as the starting point for Codex + Ralph loop.

## Open questions
These items may remain open during early discovery but should be resolved before implementation grows:
- exact internal structure of playbooks;
- exact schema strategy for `prd.json`;
- exact rendering system for generated templates;
- exact persistence strategy for discovery session state;
- exact coupling level with OpenClaw in later phases.

## Appendix — Minimal artifact set expected from V0
- `PRD.md`
- `prd.json`
- `decisions.md`
- `progress.txt`
- `AGENTS.md`
- `README.md`
- `.env.example`
- `docker-compose.yml`
- `docs/stories/`
- `docs/architecture/`
- base project directories