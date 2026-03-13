# ST-003 — First Playbook: next-payload-postgres

## Status

`done`

---

## Story

As the repository owner,  
I want the first playbook for `Next.js + Payload + PostgreSQL`,  
so that the initializer has a concrete archetype-specific contract for discovery and bootstrap generation.

---

## Why this story exists

The product only proves value if it handles one archetype very well.

The first archetype selected in the PRD is `Next.js + Payload + PostgreSQL`, so the initializer needs a concrete playbook that defines:

- defaults
- question flow
- critical decisions
- generated artifacts
- folder structure
- initial stories seed
- stop condition
- handoff context

---

## Scope

Create:

- `playbooks/next-payload-postgres.yaml`

The playbook should cover:

- archetype identity
- detection hints
- strong defaults
- guided questions
- critical architecture confirmations
- required artifacts
- initial directory structure
- initial stories
- stop condition
- handoff context

---

## Out of scope

This story does **not** include:

- implementing loader logic
- implementing schema validation
- rendering templates
- creating the final CLI flow

---

## Dependencies

- `PRD.md`
- `decisions.md`
- `docs/V0.md` if available

---

## Deliverables

- `playbooks/next-payload-postgres.yaml`

---

## Acceptance criteria

1. The playbook file exists.
2. It is clearly scoped to `Next.js + Payload + PostgreSQL`.
3. It includes defaults for Postgres and Docker.
4. It includes guided questions for architecture gaps.
5. It marks critical decisions that must not be silently assumed.
6. It includes required V0 output artifacts.
7. It stops before implementation.
8. It is readable and internally coherent.

---

## Validation

- Manual review against `PRD.md`
- Manual review against `decisions.md`
- Record outcome in `progress.txt`

---

## Done means

This story is done when the first archetype contract is explicitly documented in a playbook file.
