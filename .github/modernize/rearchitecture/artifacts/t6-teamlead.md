# t6 — Runtime and End-to-End Test Strategy

## Purpose and binding gates

This strategy defines the validation contract for the in-place Go-No-Go rearchitecture. It is grounded in the approved feature inventory and UX contract; it does not claim that any gameplay flow is already implemented. `Go-No-Go.html` is a read-only behavior reference. A test passing only against that legacy page, an iframe, mocked mission state, or an in-memory substitute is not evidence that the new experience works.

The five HIGH gaps in `t2.1-architect.md` remain mandatory release gates: native gameplay parity, consent-only legacy import, removal of active iframe wiring, automated validation, and functional touch interaction. In addition, keep PlayCanvas pinned to the approved 2.12.x line; a different resolved version is a test/setup failure, not an accepted substitute.

## Application type and validation stack

- **appType:** Mixed web application — PlayCanvas/TypeScript browser SPA with HTML routes and controls, backed by Node.js/TypeScript + Express 5 APIs and MySQL.
- **Canonical validation commands to establish:** `npm run build` and `npm test` from the repository root. The current root `package.json` has no `test` script, and neither workspace currently declares a test framework. These are implementation deliverables; new tests must be reachable through the root `npm test`.
- **Recommended test tools:** Playwright (`@playwright/test`) for real-browser E2E; Vitest for TypeScript unit tests; Supertest for Express HTTP/API integration; the target MySQL engine for DB integration/migration tests. Pin compatible versions in the lockfile when adding them. Do not treat jsdom/component tests as browser E2E.
- **Primary validation stack:** root build; Vitest unit tests; Supertest API/integration tests against the actual Express app and a real disposable MySQL instance; Playwright against the running frontend + backend + same MySQL instance; automated accessibility checks plus manual keyboard/visual/device checks. All API paths and request/response DTOs must follow the approved t3 architecture contract, and schema assertions must follow t4's MySQL design—do not invent routes or DTOs before those artifacts exist.
- **Browser targets:** Playwright Chromium, Firefox, and WebKit desktop smoke coverage, plus mobile emulation for representative iOS Safari/WebKit and Android Chrome/Chromium viewports. Browser emulation is not proof of physical mobile GPU compatibility; use a real iOS/Android device when available and record OS/browser/GPU/WebGL details. Never claim broader physical-device coverage than was actually tested.
- **Run order:** verify tool availability → start isolated MySQL and apply migrations → run backend/frontend unit tests → run API + DB integration tests → start API/UI and verify readiness → run Playwright journeys → run build and deployment-output checks. Keep mutation-heavy DB/E2E suites serial unless each worker receives an isolated schema.

### Current environment evidence (strategy-authoring shell)

| Capability | Observed state | Required handling |
|---|---|---|
| Node.js/npm | Available: `node v22.14.0`, `npm 10.9.2` | Browser and Node test tiers are viable in this shell. |
| Docker CLI/daemon | CLI exists, but `docker info --format '{{.ServerVersion}}'` failed with exit 1: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine ... The system cannot find the file specified.` | Docker-based MySQL is the primary infrastructure tier. Recheck when executing tests; current daemon failure permits considering only the documented DB fallback, not dropping Playwright. |
| MySQL CLI | `mysql` not found on PATH | Does not establish whether a server exists. Prefer the reproducible MySQL container; if Docker remains unavailable, independently check for a reachable compatible local MySQL service. |
| Playwright | Not listed in installed workspace dependencies; no browser install was attempted during strategy design | Install/pin the test dependency and attempt browser setup during implementation/validation. An absent package is not evidence that Playwright is infeasible and is not grounds to skip it. |
| Existing test suite | No test script/framework/files identified by t2; `npm ls --depth=0 --workspaces` listed only the current app dependencies | Establish a baseline with the root build; document no legacy test assets and create new coverage. |

These are point-in-time environment facts. The tester must rerun the capability checks in its own execution environment and record command output there.

## Critical user journeys and acceptance

All six journeys below are release-gate coverage. Run applicable UI journeys in **both Italian and English**. Each must test user-visible outcomes, API/database persistence where relevant, and explicit error/recovery states. Deterministic fixtures/seeded randomness and a controllable test clock should be used for game outcomes; tests must not depend on unseeded mission RNG or real-time waits.

1. **First visit, tutorial, and native lunar campus** — Open `/` in a clean browser context; assert a visible, initialized PlayCanvas scene with conspicuous lunar ground beneath the menu (attach desktop/mobile screenshots for human visual review), localized menu and control hints, working locale change, and tutorial start/skip/completion paths. Verify desktop keyboard/mouse plus no-pointer-lock accessible alternatives; on mobile use touch movement/look, labeled Interact, activity-map alternative, pause/resume, rotation/resize, and touch interruption. Confirm there is no active iframe and no request/navigation to a legacy gameplay route. A scene initialization failure must show a localized recovery action instead of a black blank page.
2. **Agency, account, mission creation, and requirements** — Register/sign in, create/name a mission within capacity, select context/participants including mandatory NASA, make accept/decline/qualify/waive requirement decisions, and inspect resulting satisfaction/funding/agency effects. Verify phase/status and ownership from a reload and from a second browser context. Verify a separate account cannot retrieve or mutate the mission. Exercise invalid credentials, validation, limits, and safe retry paths.
3. **Design, mission planning, and phase gates** — Use the campus/map and station panels to select a spacecraft, add/place/rotate/remove parts, and see mass/power/energy/fit/pointing/cost/requirement checks update. Assert an infeasible design is blocked with the specific reason and a feasible one can proceed. Set destination/orbit, launch vehicle and maneuver/transfer parameters; check delta-v/compatibility decisions. Advance and intentionally roll back/rework at applicable review gates, verifying stated state/cost/schedule consequences and that invalidated approvals are no longer treated as current.
4. **Assembly, qualification, launch, and operations** — Assemble the approved design with observable progress; run all six classes (functional, vibration, thermal-vacuum, shock, EMC, mass). Use deterministic cases for pass and failure; repair/change design, verify affected tests invalidate, rerun and confirm GO remains blocked until all required current results pass. Start launch only after explicit confirmation and readiness, and verify in-flight state begins after countdown completion. Respond to an operations event; assert decision/resource/data/communications consequences are persisted and affect closeout.
5. **Reports, progression, settings, and continuity** — Complete representative successful and unsuccessful missions (or deterministic fixtures for both) and verify report facts reconcile with decisions, test results, resource/financial state, and outcome causes. Where present, exercise compare/what-if and distinguish simulated outcomes from recorded facts; verify roadmap/ranking and facility actions at their actual availability conditions. Verify profile progression and mission resume. Exercise language/audio/settings, confirmed restart/reset, refresh and recoverable network failure without silently losing confirmed progress.
6. **Authentication, cross-session persistence, and legacy import** — Save an owned mission, close the context, sign in from a fresh context and read it back; verify a different account is denied. Test logout/session revocation and secure cookie/session attributes according to t3's auth contract. Test import with no legacy key, declined consent, malformed/unsupported v32 data, accepted v32 data, repeated/retried submission, and injected failure/retry. Prove no import write/request occurs before affirmative consent; decline/failure leaves the original `gng32.save` byte-for-byte unchanged; accepted import is validated, atomic and idempotent and does not create duplicates.

### Feature-inventory coverage map

| PM inventory | Required runtime evidence | Suggested suite |
|---|---|---|
| INV-01 Onboarding/tutorial | Start, skip, complete, return, localized guidance | `first-visit-controls.spec.ts` |
| INV-02 Mission/agency lifecycle | Create/select/active/completed, capacity, resources/progression | `mission-planning.spec.ts`, `reports-settings.spec.ts` |
| INV-03 Campus/facilities | Every activity reachable in-world and via labeled map; facilities and return paths | `first-visit-controls.spec.ts`, `reports-settings.spec.ts` |
| INV-04 Stakeholders/requirements | Participant selection and all four requirement decisions with consequences | `mission-planning.spec.ts` |
| INV-05 Phase gates/rework | Review outcomes, permitted progression, rollback/rework and invalidation | `mission-planning.spec.ts`, `verification-operations.spec.ts` |
| INV-06 Spacecraft/payload design | Component operations and mass/power/energy/fit/pointing/budget/requirements checks | `mission-planning.spec.ts` |
| INV-07 Flight dynamics/launch selection | Destination, orbit, launcher, maneuvers, transfer and feasibility/delta-v | `mission-planning.spec.ts` |
| INV-08 Build/facilities/assembly | Approved-design assembly, clean-room, progress and infrastructure effects | `verification-operations.spec.ts`, `reports-settings.spec.ts` |
| INV-09 Qualification tests | All six classes, costs/results, failure, repair/rerun and readiness blocking | `verification-operations.spec.ts` |
| INV-10 Launch/operations | Explicit launch/countdown, events, response effects, resources and mission end | `verification-operations.spec.ts` |
| INV-11 Closeout/analysis | Outcome/report/facts, compare/what-if, roadmap/ranking where enabled | `reports-settings.spec.ts` |
| INV-12 Player settings/local continuity | Locale, audio, save/load, reset/restart and corrupt/unsupported save recovery | `reports-settings.spec.ts`, `identity-import.spec.ts` |
| INV-13 Accounts/online continuity | Email/password, profile, owned mission retrieval, consent-only one-time import | `identity-import.spec.ts` |
| INV-14 Immersive/inclusive interaction | Native first-person 3D, no iframe, lunar floor, routes, desktop/touch, WCAG 2.2 AA, IT/EN | `first-visit-controls.spec.ts`, all localized E2E suites |

Use the listed filenames as a concrete minimum suite shape, not a claim that the files already exist. At least three runnable browser E2E test files must be added; this strategy calls for five focused files (`first-visit-controls.spec.ts`, `mission-planning.spec.ts`, `verification-operations.spec.ts`, `identity-import.spec.ts`, `reports-settings.spec.ts`). Backend unit, integration and migration tests are additional files. Each PM inventory group must be mapped to passing evidence or named as incomplete in the report. Do not mark an unimplemented path as skipped/passing to improve counts.

## Test tiers, infrastructure, and external dependencies

### Unit

- Test pure mission rules, phase/review eligibility, requirement and resource calculations, DTO validation/mapping, import validation, session policy helpers, and frontend route/API-client state.
- Mock DAOs/repositories only at this tier. A unit pass does not establish DB, HTTP, browser, or gameplay integration.
- Keep deterministic test fixtures, fake clock and seeded RNG at explicit test seams; production defaults must remain unchanged.

### API/service integration

- Use Supertest against an Express app factory without opening a network port. Exercise the real middleware, DTO validation, route/service/DAO composition and response contract; use real MySQL for DB-backed tests.
- Resolve paths, request/response contracts, ownership semantics, status/error formats and readiness route from t3. Add a contract assertion between frontend API-client fixtures and the t3 API schema/contract (OpenAPI if selected; otherwise versioned contract fixtures). Breaking the old `/api/health` contract is permitted, but the new health/readiness behavior must be explicit and tested.
- Test DAO/DTO separation at the boundary: allowed response fields only; no password hash, session secret, persistence-only DAO fields, SQL details or another user's data.
- Cover auth failures, invalid payloads, expired/invalid sessions, authorization/ownership, duplicate/idempotent requests, conflict/retry behavior, and expected status/error shape. Do not assert specific auth routes/cookie names until t3 approves them.
- Verify liveness and readiness separately: process health can be healthy while MySQL readiness is false; readiness becomes true only after required DB connectivity/migrations are available. Startup must fail or remain unready with actionable logs when DB configuration/connectivity is invalid, without exposing credentials.

### MySQL integration and migrations

- Primary DB is an ephemeral **real MySQL** service matching the version and SQL/migration configuration selected in t4 and local development. Start it through the approved Docker Compose/test setup; run migrations from an empty schema before the suite and verify readiness after migration. Test rollback/failed migration behavior where the migration set supports it.
- Test actual repository queries, constraints, transaction/atomic import, account ownership, API write/read persistence, import idempotency, and concurrent/stale-update behavior where designed. Do not substitute SQLite for a green MySQL result.
- Test fixture design must not assume pre-existing data. Generate a run ID and UUID-suffixed users/missions; seed through explicit test helpers or supported APIs. Cleanup only the isolated test database/fixtures. Never point destructive cleanup at a developer or production database.

### Browser E2E

- Run Playwright against the built Vite client and live Express API with the real test MySQL, not mocked mission APIs. The app/test bootstrap must provide a deterministic local config with no real provider credentials. Keep third-party services (if any are discovered) behind injectable local stubs; report their coverage separately.
- Browser setup owns app startup/readiness and cleanup. Wait for the architecture-defined readiness signal and assert every API request needed by the journey succeeds or returns the expected validation/auth result. A compile/build-only check is not E2E.
- Test actual DOM semantics and user actions: keyboard, mouse, touch, browser Back/refresh, focus restoration, viewport rotation/resizing, and recoverable failure. Keep Playwright storage state isolated per test/account.
- Assert no gameplay iframe, legacy-game URL, or copied legacy runtime asset in production build output. Preserve `Go-No-Go.html` only as source/reference; do not treat its presence as a defect.
- Attach Playwright traces, screenshots for the initial desktop/mobile menu and failure/recovery paths, and HTML report to the runtime evidence. A reviewer must visually confirm conspicuous lunar terrain in both initial captures; automated canvas visibility alone is not sufficient.

### Accessibility, localization, and physical-device validation

- Run automated axe checks against representative menu, profile, mission, dialog, error, and report states for WCAG 2.2 AA; exercise all critical journeys in Italian and English.
- Automated scans supplement, not replace, manual verification: keyboard-only completion without pointer lock or aiming; visible/unobscured focus and focus restoration; screen-reader names/status/error announcements; contrast in actual themes; 200% zoom/reflow; reduced motion; no color-only GO/NO-GO/error cues; accessible drag alternatives; and touch targets/spacing.
- At minimum, execute real-browser desktop runs and mobile viewport/touch emulation. If physical iOS/Android devices or representative mobile GPUs are unavailable, record exact browser/device capability evidence and state mobile GPU compatibility as unverified. Emulation must not be reported as real-device GPU coverage.

## Test data and isolation

- Use unique UUID-derived emails and mission identifiers; use only reserved `.test` domains and synthetic credentials. Never use user or production accounts/data.
- Start every suite with a known test schema and apply migrations; seed only explicit fixtures. Use deterministic mission seeds/time for failure/success branches.
- Run DB-mutating Playwright tests serially against one disposable DB unless separate schema/container isolation is implemented per worker. Reset only the disposable test schema/container; always clean seeded actors and missions. Do not share browser storage state across test identities.
- For import coverage, save the original `gng32.save` before each case and assert it remains unchanged for decline, invalid data and failed import. Do not create a test path that silently bypasses the consent UI.

## Fallback matrix (independent capability axes)

| Axis | Primary | Fallback only after this axis's own documented failure | Gap and gate |
|---|---|---|---|
| Infrastructure / database | Docker Compose with real MySQL, migrations and app integration | First check a reachable local MySQL of the approved version. If unavailable, SQLite/in-memory may support isolated unit or limited non-MySQL tests only; it does not replace MySQL integration. | Exact SQL behavior, schema migrations, transaction/idempotency and MySQL persistence remain **UNVERIFIED**. Record command/error, notify coordinator, and do not claim the DB/release gate passed. |
| Browser | Playwright with installed browser binaries; independent of Docker | If Node/browser installation fails with reproducible evidence, run framework-native API integration tests as partial fallback. This does not verify rendering, WebGL, assets, touch, routes, or visual/accessibility interactions. | E2E/browser gate remains **UNVERIFIED/FAIL** for full parity; report exact install error and notify coordinator. |
| Mobile hardware | Real supported mobile browsers/GPUs plus Playwright touch/viewport coverage | If physical devices are unavailable, Playwright device emulation is a limited fallback for layout/touch API paths only. | Real GPU/browser compatibility remains **UNVERIFIED**; do not promote emulation to full mobile support evidence. |
| Third-party services | None required for local game/account/database flows | If a provider is later introduced, use an injectable deterministic local stub for automated tests; separately validate provider integration when credentials exist. | No real provider credentials or public deployment are required; any untested provider path is explicitly reported. |

Docker and Playwright are independent: Docker unavailability never justifies skipping the browser tier, and Node/browser setup failure never justifies skipping real-MySQL integration if that capability is available. The tester must independently attempt every primary tier and escalate per-axis failures with exact command/output before accepting any fallback.

## Infrastructure scaffold and module test skeletons

Establish the following reproducible structure/commands as implementation proceeds (exact placement may follow t3/t4 package boundaries):

- `npm run test:unit` — frontend and backend unit suites.
- `npm run test:integration` — backend API + real-MySQL integration/migration suites.
- `npm run test:e2e` — Playwright browser suites; startup/bootstrap waits for frontend, backend and DB readiness.
- `npm test` — canonical root command invoking all required suites without silently skipping unavailable primary capabilities.
- `npm run build` — complete frontend and backend production build.
- Local test environment — documented `.env.example` with placeholders, separate `.env.test` generated safely or deterministic non-secret values, isolated MySQL Compose service/profile, migration/cleanup scripts, and no committed credentials. `npm run dev` must remain a separate local-development entrypoint and must not imply tests are running.

| Module boundary | Required skeleton before module implementation is considered testable |
|---|---|
| Frontend shell/routes/world | Playwright startup/menu and route smoke; initial lunar scene screenshot; no iframe/legacy request; keyboard and touch control smoke; localized error/recovery. |
| Frontend mission flows/API client | Contract-fixture tests for loading/saving/error/conflict states plus Playwright action flows against real API; never present unconfirmed local state as saved. |
| Backend application/API | Startup/readiness test; Supertest valid/invalid/auth/ownership and DTO validation tests; safe session/logout test. |
| Backend DAO/schema/import | MySQL migration-from-empty and persistence tests; transaction/rollback/idempotent import tests; consent, invalid payload, duplicate/retry and preservation assertions. |
| Cross-system product | Playwright fresh-context persistence and full mission journeys with live services; evidence covers release-flow gates and desktop/mobile access. |

Every implementation task must run the relevant module-level tests and record command, exit code, passed/failed/skipped counts and failure names. A failed relevant test means that task is not complete. Do not defer all tests to the final tester task.

## PASS criteria and evidence contract

The complete rearchitecture receives a **PASS** only when:

1. `npm run build` and canonical `npm test` both exit 0 from the repository root; reported counts agree with the command result.
2. The real MySQL tier has applied migrations and verified API write/read persistence; all DB/import/auth/ownership cases required above pass.
3. Playwright runs the approved critical journeys against the live client/API/DB, in Italian and English, without using the legacy iframe. Required browser engines and applicable touch/mobile paths have explicit results.
4. Each of INV-01…INV-14 is linked to passing runtime evidence or clearly named as incomplete. Any incomplete inventory item blocks a full feature-parity PASS; it must not be hidden as a skip.
5. WCAG 2.2 AA automated and manual evidence is recorded, including known limits; automated axe success alone is not an AA certification.
6. The no-iframe / no-legacy-production-runtime assertion, target PlayCanvas 2.12.x pin/lockfile check, readiness and initial visible lunar-ground screenshot all pass.
7. Any fallback or deviation has exact per-axis command/error and gap evidence. If an axis required for the release claim remains unverified, overall status is not PASS.

The tester's report must include timestamp and target commit/worktree, environment versions, exact commands and return codes, per-tier counts (`passed/failed/skipped`), startup/readiness timing, browser/device matrix, MySQL/migration result, locale coverage, screenshots/traces/report paths, all deviations, per-axis known gaps, incomplete INV flows and owner. Include the runtime skill's verdict block with `docker`, `node`, `playwright`, infra/browser tier, startup, integration and E2E lines; every test tier line must state its exit code. A nonzero exit is FAIL regardless of partial pass count unless an explicitly approved named waiver covers every failure.

## Validation review expectations

The final conformance reviewer checks the execution against this strategy, not merely whether a test command was run:

- Confirm independent Docker/MySQL and Playwright capability attempts and evidence; no cross-axis fallback justification.
- Compare executed suites/flows with the six journeys and INV-01…INV-14 map; detect missing, skipped, mocked-only or legacy-iframe coverage.
- Verify real MySQL and clean migrations were exercised for DB claims; inspect locale, auth/ownership, import consent/retry, and persistence evidence.
- Confirm screenshot review establishes visible lunar ground; assess actual mobile device/GPU evidence separately from viewport emulation.
- Check WCAG 2.2 AA evidence includes keyboard/focus/manual checks and limitations; do not equate axe alone with compliance.
- Check test/build exit codes, counts, generated evidence and incomplete items; any unreported gap or failed mandatory gate makes the verdict FAIL.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/artifacts/t1-pm.md` — INV-01…INV-14, user journeys, REQ/SC acceptance scenarios, and baseline absence of tests.
- `.github/modernize/rearchitecture/artifacts/t2-architect.md` — current SPA/iframe/backend structure, missing DB/auth/test scripts, legacy save key, and current integration gaps.
- `.github/modernize/rearchitecture/artifacts/t2.1-architect.md` — mandatory dispositions/exit gates for all five HIGH baseline gaps and PlayCanvas version guardrail.
- `.github/modernize/rearchitecture/artifacts/t5-ux.md` — routes, activity-map equivalence, desktop/mobile controls, accessibility, localization, and user-facing recovery expectations.
- `.github/modernize/rearchitecture/clarification.md` — canonical approved targets, first-person/no-iframe scope, MySQL/import/auth and acceptance definition.
- `.github/modernize/rearchitecture/clarification-answers.md` — submitted approved frontend/backend/product decisions.
- `.github/modernize/rearchitecture/board.md` — task dependencies and phase status (read-only).
- `.github/modernize/rearchitecture/decisions.md` — approved behavior-reference and exact PlayCanvas 2.12.x constraints.
- `package.json` — current root scripts and workspaces used to define the canonical test/build command gap.
- `npm ls --depth=0 --workspaces` — current installed dependency baseline; no test framework listed.

## Evidence Mapping

- `t1-pm.md#Legacy gameplay inventory` and `#Success criteria` → this artifact's Critical Journeys, INV coverage map, and PASS criteria map all 14 inventory groups to runtime evidence.
- `t1-pm.md#User scenarios and acceptance scenarios` → each Critical Journey uses source-derived user outcomes; `t1-pm.md#SC-004…SC-010` → test, persistence/import, lunar/mobile, localization, accessibility, and report reconciliation gates.
- `t2-architect.md#Key Risk Evidence` → Current environment and Validation Stack distinguish current baseline deficiencies from required target coverage.
- `t2.1-architect.md#Dispositions` and `#Cross-Cutting Target-Version Guardrail` → binding release gates and PlayCanvas 2.12.x assertions.
- `t5-ux.md#Core player journeys`, `#Accessibility and inclusive interaction requirements`, and `#Design acceptance checklist` → browser/mobile/a11y scenarios and manual evidence expectations.
- `clarification.md#Frontend`, `#Backend`, and `#Generic` → approved stack, language, accessibility, persistence, auth, and complete-flow scope reflected in the test stack and PASS criteria.
- `package.json#scripts` → missing root `test` command is recorded as an implementation requirement; root `npm test` is the canonical future gate.

## Verification

- Test strategy authored from the required dependency artifacts; no application code or test files were changed in this planning task.
- Baseline command evidence: `npm ls --depth=0 --workspaces` exited successfully; Node/npm versions recorded above; `docker info` failed because the Docker Desktop Linux engine named pipe was unavailable.
- Application tests/build were not run in this planning task; runtime execution belongs to the tester/implementation tasks.
