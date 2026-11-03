# t2 — Current Architecture, Dependencies, and Migration Evidence

## Summary

The repository is a small npm-workspace web application with two active packages. The current user-facing runtime is split between a PlayCanvas/Vite/TypeScript first-person shell and the standalone 7,044-line `Go-No-Go.html` mission application, which the shell serves inside an iframe. The backend is a single Express 5 process exposing only `GET /api/health`. Mission state remains browser-local; no database, authentication, API save/load, or test suite is present in the repository.

The implementation boundary and source evidence are captured in the linked architecture artifacts. The original HTML file is retained as a behavioral/data reference, not a required target runtime module. These findings do not make a final service-count or API design decision; those belong to the design task.

## Deliverables

- [architecture_index.md](./architecture_index.md) — implementation navigation guide and current integration risks.
- [unit_graph.yaml](./unit_graph.yaml) — three present external entrypoints and their dependency edges.
- [migration_boundary.yaml](./migration_boundary.yaml) — runtime cut and explicitly scoped rewrite/reference files.
- [wire_contracts.yaml](./wire_contracts.yaml) — current health endpoint contract.
- [shared_modules.yaml](./shared_modules.yaml) — shared Vite configuration surface.
- [cross_unit_state.yaml](./cross_unit_state.yaml) — `gng32.save` browser-storage flow across iframe boundary.
- [seams.yaml](./seams.yaml) — declared iframe/localStorage-to-API import cut.
- [project-structure.md](./project-structure.md) — current repository and layer breakdown.
- [tech-stack.md](./tech-stack.md) — declared/installed dependencies and runtime requirements.
- [data-model.md](./data-model.md) — current localStorage state shape; no server database model exists.
- [units/frontend-menu-world/](./units/frontend-menu-world/behavior.yaml) — shell behavior, bindings, and split candidates.
- [units/legacy-mission-app/](./units/legacy-mission-app/behavior.yaml) — legacy game behavior, bindings, and split candidates.
- [units/backend-health/](./units/backend-health/behavior.yaml) — current API behavior and wiring.

## Key Risk Evidence

- **High — gameplay fidelity/coupling:** the legacy application embeds its UI, simulation rules, renderer, translations, and global state in one HTML file. The runtime has nine named views and phase state `0`, `A`–`F`, `done`; the iframe is currently the only source of those full gameplay flows. See `units/legacy-mission-app/behavior.yaml` and `shared_modules.yaml`.
- **High — persistence cutover:** the old application reads/writes version-32 JSON at `localStorage['gng32.save']`; the shell only checks whether the key exists. There is no validation/import API or database. The approved consent flow must preserve the original key on failed or rejected import. See `cross_unit_state.yaml` and `seams.yaml`.
- **High — current runtime integration:** `vite.config.ts` directly serves and copies the legacy page and proxies `/api` to localhost:8080. Removing the iframe requires removing both development and production legacy-page wiring, not just hiding the frame. See `migration_boundary.yaml` and `units/frontend-menu-world/bindings.yaml`.
- **High — verification gap:** package scripts define no test command or test framework; runtime/E2E coverage is not discoverable. Full flow parity and desktop/mobile controls therefore need new test evidence.
- **High — mobile input gap:** the shell constructs PlayCanvas mouse and touch devices, but its movement/look loop is keyboard and pointer-lock/mouse based; no touch movement controller is wired in the inspected source.
- **Medium — renderer split/dependency drift:** the wrapper uses PlayCanvas while the embedded game loads Three.js r128 from a CDN. The package range `^2.12.2` does not constrain PlayCanvas to the approved 2.12.x line; the observed installed version is 2.23.3. See `tech-stack.md`.
- **Medium — operational contract:** the backend health route checks process responsiveness only; there is no database connection/readiness signal. Root scripts also lack the requested `npm run dev` entrypoint.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/clarification.md` — approved rewrite boundary, target stacks, gameplay acceptance, persistence policy, and explicit removal of iframe gameplay.
- `.github/modernize/rearchitecture/clarification-answers.md` — submitted decision detail, including PlayCanvas, accessibility, mobile, language, authentication, and API-change policy.
- `.github/modernize/rearchitecture/artifacts/project-profile.yaml` — repository scope, three package manifests, sizing, and in-place rewrite classification.
- `.github/modernize/rearchitecture/artifacts/t2.1-architect.md` — explicit mitigation contracts, exit evidence, and residual risks for the HIGH baseline gaps; this revalidation does not treat the gates as already satisfied.
- `decisions.md` — approved decision to retain `Go-No-Go.html` only as behavior/data reference and to honor PlayCanvas 2.12.x.

## Evidence Mapping

- `clarification.md#Frontend` and `#Generic` → `migration_boundary.yaml` and `seams.yaml` record the frontend runtime cut, mobile parity need, and no-iframe target.
- `clarification.md#Backend` → `wire_contracts.yaml`, `tech-stack.md`, and `units/backend-health/bindings.yaml` record the existing health-only Express surface and absent persistence/auth wiring.
- `clarification-answers.md#B3` → `cross_unit_state.yaml` and `seams.yaml` record the consent-only version-32 import boundary without claiming an existing importer.
- `project-profile.yaml#project.structure` → `project-structure.md` and `unit_graph.yaml` map the current frontend, backend, and legacy source.
- `t2.1-architect.md#Mitigation contract` and `#Exit gate` → the five HIGH risks remain implementation/validation gates, not evidence of completed parity, import, iframe removal, testing, or touch support.
- `t2.1-architect.md#Cross-Cutting Target-Version Guardrail` and `decisions.md#architect t2` → retain the PlayCanvas 2.12.x requirement; package-range/install evidence below shows why exact pinning is required.

## Revalidation

- **Branch/worktree:** `git branch --show-current` returned `Rok3DProva`. At inspection, `git status --short` showed pre-existing edits to `.github/modernize/rearchitecture/artifacts/project-profile.yaml` and `board.md`; neither was modified by this task.
- **Installed dependencies:** `npm ls --depth=0 --workspaces` completed successfully. Resolved versions: PlayCanvas `2.23.3` (manifest `^2.12.2`), TypeScript `5.9.3`, Vite `7.3.7`, Express `5.3.0`, `tsx` `4.23.15`, `@types/express` `5.0.6`, and `@types/node` `24.19.2`. The installed PlayCanvas version is not in the approved 2.12.x line; `^2.12.2` permits this drift.
- **Source confirmation:** `app/frontend/index.html` contains the `#legacyGame` iframe. `app/frontend/src/main.ts` initializes PlayCanvas with mouse and `TouchDevice`, but the inspected movement/look paths use keyboard and pointer lock/mouse. `app/frontend/vite.config.ts` both serves `/legacy-game.html` in development and copies the legacy page during bundling. `app/backend/src/index.ts` registers only `GET /api/health`, validates `PORT`, and has no database/readiness/auth route. `Go-No-Go.html` writes the complete `G` object to `gng32.save` and its loader accepts parsed saves only when `v === 32`.
- **Workspace evidence:** root scripts define `build`, `dev:frontend`, `dev:backend`, and `start:backend`; there is no root `dev` or `test` script. The two workspace manifests declare no test scripts/frameworks, and the repository inventory found no test files/configuration.
- **Architecture artifact self-check:** the unit graph has 3 units; each has one `behavior.yaml`, `bindings.yaml`, and `unit_decomposition.yaml` (3/3 each). All 3 decomposition files declare `commit: false`; no duplicate source-anchor rows were found. `architecture_index.md` contains the required implementation guide and entries for all 3 units. No `TBD` entries were found in the wire-contract or seam files.
- **Build/tests:** not run for this read-only architecture-analysis task; no application code was changed. The absence of a test command/framework is recorded above as a verification gap, not a passing test result.
