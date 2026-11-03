## architect t2 — 2026-11-03
**Decision**: The legacy `Go-No-Go.html` remains a read-only behavioral reference; the final frontend must not retain an iframe gameplay runtime.
**Rationale**: The approved target is a native PlayCanvas first-person 3D experience, with domain gameplay rebuilt in the frontend and backed by service APIs.

## architect t2 — 2026-11-03
**Decision**: Preserve the approved PlayCanvas 2.12.x target verbatim; verify and pin the requested version rather than assuming the currently installed 2.23.3 satisfies it.
**Rationale**: The current package uses a different PlayCanvas version, and target stack versions are immutable user requirements.
