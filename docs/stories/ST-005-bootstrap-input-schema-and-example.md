# ST-005 — Bootstrap Input Schema and Example

## Status

`done`

---

## Story

As the repository owner,  
I want a bootstrap input schema and one example resolved input file,  
so that the repository has a defined shape for a discovered project state before generation.

---

## Why this story exists

The initializer needs a distinction between:

- the archetype contract
- the resolved project-specific answers collected during discovery

This story creates that second contract.

---

## Scope

Create:

- `schemas/bootstrap-input.schema.json`
- `examples/next-payload-postgres.input.yaml`

The example should represent a resolved discovery session for the first supported archetype.

---

## Out of scope

This story does **not** include:

- CLI parsing
- interactive prompting
- rendering engine
- persistence of sessions

---

## Dependencies

- `playbooks/next-payload-postgres.yaml`
- `schemas/playbook.schema.json`

---

## Deliverables

- `schemas/bootstrap-input.schema.json`
- `examples/next-payload-postgres.input.yaml`

---

## Acceptance criteria

1. The bootstrap input schema exists.
2. The example input exists.
3. The example is coherent with the first playbook.
4. The schema clearly represents resolved project answers.
5. The schema and example distinguish project data from archetype rules.
6. The files remain within V0 scope.

---

## Validation

- Check example coherence against playbook
- Check schema coverage for required resolved state
- Record results in `progress.txt`

---

## Done means

This story is done when the repository has a documented resolved-input contract for one concrete archetype instance.
