# decisions.md

## Purpose

Stable project decisions that agents MUST respect during implementation.
Consult this file before making architectural changes.

---

## Project Constraints

### DEC-001: Source of truth
- **Status:** accepted
- **Decision:** `spec.json` is the primary source of truth. `docs/stories/` defines implementation units.
- **Reason:** Story-by-story execution reduces drift and enables per-story validation.
- **Rule:** Consult `spec.json` before changing architecture or scope. Implement one story at a time.

### DEC-002: Architecture stability
- **Status:** accepted
- **Decision:** Generated architecture is stable. Do not redesign during implementation.
- **Reason:** Architecture was derived from the spec by Specwright's pipeline.
- **Rule:** Only change architecture if a story explicitly requires it.

### DEC-003: Stack
- **Status:** accepted
- **Decision:** frontend=`nextjs`, backend=`payload`, database=`postgres`, deploy=`docker`.
- **Rule:** All implementation choices must align with this stack.

### DEC-004: Capabilities
- **Status:** accepted
- **Decision:** Active capabilities: `cms, public-site`.
- **Rule:** Do NOT add behaviors outside this capability set.

## Architecture Decisions

### Security & Auth

**DEC-005**: Authentication handled via secure session or JWT.
- Reason: Defines the authentication and session management strategy

**DEC-006**: Authorization must enforce role and permission boundaries.
- Reason: Defines the authentication and session management strategy

### Data & Content

**DEC-007**: CMS content is modeled in explicit collections/globals with stable slugs and typed relationships.
- Reason: Enables structured content management with editorial workflows

**DEC-008**: Introduce caching for frequently accessed public content.
- Reason: Enables structured content management with editorial workflows

### Architecture

**DEC-009**: Media storage starts on local filesystem with a clear adapter boundary for a later object-storage swap.
- Reason: Shapes implementation to match the project's requirements

**DEC-010**: Store media in S3-compatible object storage.
- Reason: Shapes implementation to match the project's requirements

**DEC-011**: Media assets stored in object storage.
- Reason: Shapes implementation to match the project's requirements

**DEC-012**: Public-facing pages should use caching and delivery strategies appropriate for anonymous traffic.
- Reason: Shapes implementation to match the project's requirements

### Performance & Delivery

**DEC-013**: Public assets should be delivered through a CDN.
- Reason: Reduces latency and server load for static/public content

**DEC-014**: Use SSR or ISR for SEO-sensitive public pages when applicable.
- Reason: Improves SEO and initial page load for public-facing pages

**DEC-015**: Serve static assets through CDN.
- Reason: Reduces latency and server load for static/public content

**DEC-016**: Use connection pooling.
- Reason: Prevents connection exhaustion under concurrent load

### Operations & Observability

**DEC-017**: Implement structured logging.
- Reason: Enables observability and early detection of production issues

**DEC-018**: Add health check endpoints.
- Reason: Enables observability and early detection of production issues

**DEC-019**: Add automated database backups.
- Reason: Protects against data loss and enables disaster recovery

**DEC-020**: Add monitoring and logging stack.
- Reason: Enables observability and early detection of production issues
