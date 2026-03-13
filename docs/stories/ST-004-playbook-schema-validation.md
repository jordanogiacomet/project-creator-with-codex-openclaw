# ST-004 — Playbook Schema Validation

## Status

`done`

---

## Story

As the repository owner,  
I want a schema for playbook validation,  
so that playbooks can be checked for structure and required fields before CLI execution grows.

---

## Why this story exists

Once the first playbook exists, the repository needs a consistent way to validate its structure.

This reduces ambiguity and makes later CLI implementation safer.

---

## Scope

Create:

- `schemas/playbook.schema.json`

The schema should validate:

- repository playbook identity
- bootstrap contract
- defaults
- rules
- discovery section
- questions
- critical decisions
- artifacts
- structure
- initial stories
- validation block
- stop condition
- handoff block

---

## Out of scope

This story does **not** include:

- runtime schema loading
- CLI validation integration
- template rendering
- bootstrap input schema

---

## Dependencies

- `playbooks/next-payload-postgres.yaml`

---

## Deliverables

- `schemas/playbook.schema.json`

---

## Acceptance criteria

1. The schema file exists.
2. It validates the intended playbook structure.
3. It is specific enough to catch missing critical sections.
4. It does not overfit to unrelated future archetypes.
5. It can validate the first playbook coherently.

---

## Validation

- Validate the existing playbook logically against the schema
- Record validation status in `progress.txt`

---

## Done means

This story is done when the repository has a credible structural contract for playbooks.
