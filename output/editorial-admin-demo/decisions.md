# decisions.md

## Decisions

### DEC-001
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The project archetype is `Next.js + Payload + PostgreSQL`.
- **Reason:** This bootstrap was generated from the selected V0 playbook.
- **Consequences:** The initial implementation should remain aligned to this stack.

### DEC-002
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The initial deploy/runtime target is `docker`.
- **Reason:** This was confirmed during discovery.
- **Consequences:** Generated local setup and docs should reflect this target.

### DEC-003
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The product surface is `admin_plus_public_site`.
- **Reason:** This was confirmed during discovery.
- **Consequences:** Story design and directory structure should reflect this surface boundary.

### DEC-004
- **Date:** 2026-03-13
- **Status:** accepted
- **Decision:** The storage backend direction is `local_first`.
- **Reason:** This was confirmed during discovery.
- **Consequences:** Media handling should follow this direction unless superseded later.
