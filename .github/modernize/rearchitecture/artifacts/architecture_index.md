# Architecture Index — Go-No-Go Rearchitecture

## Current Runtime Snapshot

- `frontend-menu-world`: Vite serves `/`; PlayCanvas builds the lunar world and shell UI. It loads the full legacy game as `/legacy-game.html` in an iframe and calls `/api/health`.
- `legacy-mission-app`: Vite serves/copies the root `Go-No-Go.html`; the standalone page owns all mission rules and localStorage persistence.
- `backend-health`: Express serves `GET /api/health` on port 8080 by default.

The current external units describe the observed system, not a final target service decomposition. The rewrite scope is defined in `migration_boundary.yaml`; `source_anchors` are evidence and are not, by themselves, implementation instructions.

## Implementation Guide

**This index is not the full contract. Do not implement from this file alone; follow the artifact paths below.**

### Global artifacts

- `unit_graph.yaml`
  - Who reads: all design and implementation workers.
  - Use for: current entrypoints, source evidence, dependencies, and shared references.
  - How to consume: select assigned unit; use `source_anchors` for behavior discovery, not as the rewrite scope.
- `migration_boundary.yaml`
  - Who reads: all implementation workers.
  - Use for: runtime cut and accepted rewrite/reference scope.
  - How to consume: follow `must_rewrite`, `copy_as_is`, and `legacy_allowed_to_remain`; do not expand work to every source anchor.
- `wire_contracts.yaml`
  - Who reads: backend/API workers and design.
  - Use for: current outward HTTP contract and approved flexibility.
  - How to consume: filter `contracts` by `unit`; the health response is the only existing backend contract.
- `shared_modules.yaml`
  - Who reads: frontend workers touching bundling/routing.
  - Use for: shared config fields and migration warning.
  - How to consume: filter modules where `used_by_units` includes the assigned unit; each unit's `shared_refs.used_fields` is a whitelist.
- `cross_unit_state.yaml`
  - Who reads: frontend, backend, persistence, and test workers.
  - Use for: the localStorage save read/write crossing the shell/iframe boundary.
  - How to consume: filter where `writer.unit` or `reader.unit` matches the assigned unit; verify the consented import at runtime.
- `seams.yaml`
  - Who reads: frontend and persistence workers.
  - Use for: authoritative iframe removal and consent-based localStorage-to-API conversion rules.
  - How to consume: the declared cut is authoritative; keep the legacy source read-only and use the explicit bridge rules.
- `project-structure.md`, `tech-stack.md`, `data-model.md`
  - Who reads: all design and implementation workers.
  - Use for: present package/layer structure, dependency versions, and legacy persistence shape.
  - How to consume: these record existing facts; new API/schema choices remain for design and DBA.

### Unit: `frontend-menu-world`

- External trigger: browser route `/` (Vite SPA entry).
- Must read:
  - `units/frontend-menu-world/behavior.yaml` — current menu/world interaction, save gate, error behavior, and mobile-control gap.
  - `units/frontend-menu-world/bindings.yaml` — DOM/PlayCanvas wiring, Vite proxy/plugin, and localStorage settings.
  - `units/frontend-menu-world/unit_decomposition.yaml` — advisory split candidates only (`commit: false`).
- Relevant global rows:
  - `wire_contracts.yaml`: rows where `unit: frontend-menu-world` or `unit: global`.
  - `shared_modules.yaml`: modules with `used_by_units` containing `frontend-menu-world`.
  - `cross_unit_state.yaml`: flows where it is the reader/writer.
  - `seams.yaml`: cuts where it is in `cut_between`.
- Before completion report: artifact paths read, required shell/world behaviors implemented, unresolved API/persistence contracts, and build/runtime/E2E evidence.

### Unit: `legacy-mission-app`

- External trigger: browser route `/legacy-game.html` (loaded in an iframe by the shell).
- Must read:
  - `units/legacy-mission-app/behavior.yaml` — legacy game entry, view/phase state, save/load, tutorial, and major side effects.
  - `units/legacy-mission-app/bindings.yaml` — inline script/global/event wiring and external Three.js dependency.
  - `units/legacy-mission-app/unit_decomposition.yaml` — advisory source split candidates only (`commit: false`).
- Relevant global rows:
  - `wire_contracts.yaml`: rows where `unit: legacy-mission-app` or `unit: global`.
  - `shared_modules.yaml`: modules with `used_by_units` containing `legacy-mission-app`.
  - `cross_unit_state.yaml`: save-key writer/reader flow.
  - `seams.yaml`: declared cut; the legacy file is a read-only behavior reference, not the final runtime.
- Before completion report: which legacy behavior slices are converted, preserved/deferred slices, import compatibility/consent evidence, and E2E results. Do not report the full game migrated while any activity remains iframe-only or unimplemented.

### Unit: `backend-health`

- External trigger: `GET /api/health`.
- Must read:
  - `units/backend-health/behavior.yaml` — current response and startup failure behavior.
  - `units/backend-health/bindings.yaml` — Express route and `PORT` configuration.
  - `units/backend-health/unit_decomposition.yaml` — no meaningful split candidate at current size.
- Relevant global rows:
  - `wire_contracts.yaml`: filter `unit: backend-health`.
  - `shared_modules.yaml`: no shared module currently referenced.
  - `cross_unit_state.yaml`: no current flow.
  - `seams.yaml`: no direct cut participation.
- Before completion report: endpoint and readiness behavior, auth/data API contracts, validation and persistence evidence, and build/test/runtime results.

## Current Migration Risk Notes

- The old game is a tightly coupled inline application rather than a set of independently callable gameplay modules; its domain behavior is discoverable in source but has no test contract.
- The frontend's “Load Game” state is inferred from key presence only, while the actual legacy loader accepts only `G.v === 32`; this can make UI availability diverge from loadability.
- The legacy `save()` is called from `render()` and persists the entire mutable game state; moving state to APIs changes write timing and failure semantics.
- Current mobile-device construction does not amount to functional touch movement/look controls.
- Existing project scripts do not provide the requested root `npm run dev` or any `test` script.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/clarification.md` — acceptance and target constraints.
- `.github/modernize/rearchitecture/clarification-answers.md` — submitted approved decisions.
- `.github/modernize/rearchitecture/artifacts/project-profile.yaml` — current repo/package inventory.

## Evidence Mapping

- `clarification.md#Generic` → explicit no-iframe target and current runtime-cut guidance above.
- `clarification.md#Backend` → `backend-health` API guide and health-only contract.
- `clarification-answers.md#F7` → touch-control gap note and frontend behavior artifact.
- `clarification-answers.md#B3` → consented import seam and cross-unit storage artifact.
