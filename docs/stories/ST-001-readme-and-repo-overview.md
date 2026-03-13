# ST-001 — README and Repository Overview

## Status

`done`

---

## Story

As the repository owner,  
I want a clear `README.md` for the OpenClaw Project Initializer repository,  
so that the repository has an explicit entrypoint for purpose, scope, structure, and next steps.

---

## Why this story exists

The repository already has `PRD.md`, `AGENTS.md`, `decisions.md`, and `progress.txt`, but it still lacks a developer-facing overview.

Without a `README.md`, the repository has no simple onboarding surface and no concise explanation of what exists, what is planned, and how the V0 is supposed to evolve.

---

## Scope

This story should create the first `README.md` for the repository.

The README should include:

- project purpose
- current V0 scope
- supported archetype in V0
- repository source-of-truth files
- high-level repository structure
- execution model
- explicit statement that implementation is story-driven
- next recommended steps

---

## Out of scope

This story does **not** include:

- implementing CLI code
- writing schemas
- writing playbooks
- container setup
- detailed usage docs for future commands that do not exist yet

---

## Dependencies

- `PRD.md`
- `AGENTS.md`
- `decisions.md`
- `progress.txt`

---

## Deliverables

- `README.md`

---

## Acceptance criteria

1. `README.md` exists at repository root.
2. It clearly describes the repository as the OpenClaw Project Initializer.
3. It describes the V0 as a local-first CLI bootstrap tool.
4. It states that the first supported archetype is `Next.js + Payload + PostgreSQL`.
5. It references the main source-of-truth files.
6. It does not claim features that are not implemented yet.
7. It is consistent with `PRD.md`.

---

## Validation

- Read `README.md` against `PRD.md`
- Check consistency with `decisions.md`
- Record result in `progress.txt`

---

## Done means

This story is done when `README.md` is present, accurate, and useful as the first repository overview.
