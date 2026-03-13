# ST-006 — Minimal CLI Entrypoint for `initializer new`

## Status

`done`

---

## Story

As the repository owner,  
I want a minimal Python CLI entrypoint for `initializer new`,  
so that the repository begins turning documentation and contracts into executable flow.

---

## Why this story exists

The repository should not remain documentation-only forever.

After the source-of-truth docs, playbook, and schemas exist, the next step is to introduce a minimal CLI surface that can later orchestrate the bootstrap flow.

---

## Scope

Create the minimal Python CLI structure needed to support:

- a command entrypoint
- the `initializer new` command shape
- module layout for future orchestration

Suggested modules may include:

- `initializer/cli.py`
- `initializer/flow/new_project.py`
- `initializer/loaders/`
- `initializer/validators/`

In this story, the CLI may still be shallow, but it must establish the executable entrypoint and repository structure.

---

## Out of scope

This story does **not** include full interactive discovery unless explicitly small enough for the story scope.

It also does not include:

- full template rendering
- full project generation
- Codex handoff
- commit automation

---

## Dependencies

- `PRD.md`
- `docs/V0.md`
- first playbook
- schemas

---

## Deliverables

- minimal Python package structure for the CLI
- executable `initializer new` entrypoint
- any required packaging/bootstrap files within story scope

---

## Acceptance criteria

1. A Python CLI entrypoint exists.
2. `initializer new` is represented in the codebase.
3. The code structure reflects separation of concerns.
4. The implementation stays small and V0-consistent.
5. The story does not overreach into full generation unless clearly scoped.

---

## Validation

- Run the minimal CLI entrypoint locally if possible
- Record commands and results in `progress.txt`

---

## Done means

This story is done when the repository has crossed from pure design into minimal executable CLI structure.
