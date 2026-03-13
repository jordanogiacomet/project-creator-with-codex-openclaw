# ST-002 — V0 Boundary Document

## Status

`done`

---

## Story

As the repository owner,  
I want a `docs/V0.md` document,  
so that the V0 operational boundary is frozen and future implementation work stays constrained.

---

## Why this story exists

The PRD defines the product, but the repository also needs a more implementation-oriented V0 boundary document.

This file should prevent scope creep and clarify exactly what V0 includes and excludes.

---

## Scope

Create `docs/V0.md` with:

- V0 purpose
- supported archetype
- expected input model
- expected output model
- limits of V0
- handoff boundary before Codex + Ralph loop
- explicit non-goals
- minimal execution flow

---

## Out of scope

This story does **not** include:

- implementing any CLI logic
- creating schemas
- creating playbooks
- creating templates

---

## Dependencies

- `PRD.md`
- `decisions.md`

---

## Deliverables

- `docs/V0.md`

---

## Acceptance criteria

1. `docs/V0.md` exists.
2. It is consistent with `PRD.md`.
3. It states that V0 stops before implementation.
4. It states that V0 generates docs, structure, and initial stories only.
5. It explicitly excludes deploy, production access, and automatic feature implementation.
6. It reflects the first archetype correctly.

---

## Validation

- Compare `docs/V0.md` to `PRD.md`
- Check no contradictions with `decisions.md`
- Record completion in `progress.txt`

---

## Done means

This story is done when the V0 boundary is documented clearly enough that future implementation stories cannot reasonably drift beyond it.
