# Implementation Plan: In-place Go-No-Go 3D Rearchitecture

**Date**: 2026-11-03 | **Spec**: `.github/modernize/rearchitecture/artifacts/t1-pm.md`; approved scope: `.github/modernize/rearchitecture/clarification.md`

## Summary

Replace the active legacy iframe with a browser-native PlayCanvas 2.12.4 TypeScript game and semantic bilingual Tailwind UI; implement the full Go-No-Go play loop through a single modular Express 5 API, typed DTO contracts, authoritative mission rules and a new MySQL 8.4 schema. The execution plan preserves every behavior group in the PM inventory, adds explicit acceptance gates for consented v32 import, desktop/mobile controls, accessibility, safe persistence, and honest partial-flow reporting, and requires full-stack tests before parity can be claimed.

This is an in-place migration under `app/`. Preserve the existing branch, uncommitted changes, and save data. `Go-No-Go.html` is a read-only behavior/import-format reference; it is not a gameplay fallback. Do not publicly deploy or add real credentials. Do not make additional commits or pushes.

## Technical Context

**Language/Version**: TypeScript, ES2022; current development shell records Node.js 22.14.0/npm 10.9.2. Confirm versions in execution environment.
**Primary Dependencies**: Vite SPA, PlayCanvas **exactly 2.12.4** (pin manifest and lockfile), Tailwind CSS/custom semantic components, Express 5, runtime DTO validation, Vitest, Supertest, Playwright.
**Storage**: MySQL 8.4 LTS / InnoDB. Versioned migrations and parameterized DAO access; new schema as specified by t4. No SQLite result substitutes for MySQL release evidence.
**Testing**: Root `npm run build` and `npm test`; Vitest unit tests, Supertest API tests, real-MySQL migration/integration tests, Playwright desktop/browser E2E and mobile touch emulation, automated accessibility checks, plus manual keyboard/visual/physical-device review when available.
**Target Platform**: Current evergreen desktop and mobile browsers/GPU capability; responsive browser SPA; local repeatable MySQL environment and provider-neutral deployment-ready configuration.
**Performance Goals**: Maintain the measured current production baseline once supplied; no numeric latency/availability target is provided. Maintain responsive UI and actionable recovery on constrained mobile GPU/WebGL.
**Constraints**: All 14 behavior groups and all 24 functional requirements remain in scope. Bilingual Italian/English; WCAG 2.2 AA; minimal client mission state; API-authoritative state; exact PlayCanvas 2.12.x line; secure email/password sessions; explicit-only legacy import; no active iframe; no public deployment/secrets; preserve user changes and branch.

## Upstream Design Contracts

- **Architecture** (`t3-architect.md`): `app/frontend`, `app/contracts`, `app/backend`; one deployable modular Express API; versioned DTOs and runtime validation; application/domain rules separated from DAO persistence; server-authoritative state; optimistic revision checks and idempotent commands; no exposed DB records or sensitive auth values.
- **Database** (`t4-dba.md`): new MySQL schema with user/profile/session, agency/mission, event/test/report and import records; JSON aggregates are versioned and validated; migrations are checksum-verified and restart-safe; each accepted write is transactional and owner-scoped.
- **Experience** (`t5-ux.md`): `/`, `/profile`, `/missions`, `/missions/:missionId`; native first-person scene plus equivalent semantic DOM activity map; visible lunar ground; no pointer-lock dependency; equivalent keyboard/mouse/touch actions; safe return path and focus restoration.
- **Test contract** (`t6-teamlead.md`): real MySQL and Playwright are independent mandatory capabilities; all critical journeys must be tested; test counts/commands/exit codes reported; gaps and fallback evidence remain explicit.

## Constitution Check

No separate `constitution.md` exists in the supplied rearchitecture tree. This plan checks against the approved user decisions and the upstream architecture, data, and UX contracts (this is not a claim that a missing constitution was read).

| Principle / constraint | Check | Plan enforcement |
|---|---|---|
| In-place changes only under `app/`; preserve user work, branch, and saved data | PASS | Tasks never request destructive resets; import/reset are explicit and preserve original source save. |
| Native PlayCanvas 2.12.x; pin exact compatible version, no iframe gameplay | PASS | P1.1 pins 2.12.4 and lockfile; P2.1 removes active iframe serving/copy/loading paths. |
| One modular API deployment; avoid unnecessary microservices | PASS | P1.2 and feature slices use a single Express 5 modular monolith. |
| Server-authoritative mission rules; typed DTO and DAO boundaries | PASS | P1.2 defines shared contracts, validation, application/domain services and DAOs; every subsequent mission task uses them. |
| New MySQL schema, migrations, safe ownership/revision/idempotency | PASS | P1.2 and P3.1–8.1 use t4 schema and t3 transaction/concurrency rules. |
| Email/password, secure session, no exposed credential/token values | PASS | P3.1 and P9.2 acceptance/tests enforce Argon2id, hashed opaque session tokens, secure cookies, rate limits, origin/CSRF checks, sanitized logs. |
| Legacy import only after affirmative consent; original save unchanged | PASS | P8.1 requires no pre-consent `getItem`, strict v32 validation, atomic/idempotent import, and source-key preservation. |
| WCAG 2.2 AA, touch and desktop, Italian and English | PASS | P2.1 includes semantic DOM alternatives and equivalent controls; P9.1 verifies accessibility/localization/mobile. |
| Every existing game flow accounted for; no false completeness | PASS | P2.1–8.1 cover INV-01…INV-14; P9.1 blocks unsupported GO/pass/parity claims and reports incomplete flows. |
| No public deployment or real credentials | PASS | P9.2 provides local/deployment configuration using placeholders only; deployment remains unexecuted. |
| No extra commit/push or amended initial snapshot | PASS | No plan task authorizes version-control mutations. |

## Applied Guidelines

- No matching migration-specific guide is available. The only installed guide is Struts-to-Spring and is not applicable to this TypeScript/PlayCanvas/Express rewrite.
- Applied the project-specific t3/t4/t5/t6 contracts listed above; these are the primary implementation rules.

## Implementation Steps

Tasks are feature-oriented vertical slices; each task owns its stated UI/API/domain/persistence/test behavior where applicable and must be independently executable by one implementation session. Shared setup is limited to cross-feature prerequisites. Do not split tasks into entity/service/controller layers. Tasks reference source anchors from the PM inventory for behavior conversion; non-source infrastructure work needs no `[Source:]`.

### Phase 1 — Setup

#### Step 1.1: [Cross-cutting] Establish pinned workspace and test/developer command baseline
- **Group**: Cross-cutting (no project topology/fanout artifact was supplied).
- **Requirements**: REQ-024.
- **Design inputs**: `t3-architect.md#Operational and migration decisions`; `tech-stack.md#Packages`; `project-structure.md#Entry points and routing`.
- **Description**: Preserve npm workspaces, pin `playcanvas` to exact `2.12.4` and refresh `package-lock.json`, establish root `build`, `test`, and `dev` command contracts and test toolchain, and verify exact resolved version. Do not carry the existing semver drift into the rewrite.

#### Step 1.2: [Cross-cutting] Establish typed boundaries and restart-safe MySQL foundation
- **Group**: Cross-cutting.
- **Requirements**: REQ-003, REQ-004, REQ-006, REQ-007, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-019, REQ-020.
- **Design inputs**: `t3-architect.md#Runtime and module boundaries`, `#API conventions`, `#DTO and validation boundaries`; `t4-dba.md#Data Model`, `#Migration and Operational Notes`.
- **Description**: Create the shared versioned transport contract and server-side validation boundaries, initial MySQL schema/migration runner, repository/DAO conventions, isolated test configuration, and testable app factories. Implement no feature-specific success behavior here. Migration execution is explicit; startup/readiness must detect schema mismatch without silently mutating schema.

### Phase 2 — User Story 1 (P1): Enter the lunar mission environment

#### Step 2.1: [Cross-cutting] Build the accessible lunar entry, campus, tutorial and navigation shell
- **Group**: Cross-cutting.
- **Requirements**: REQ-001, REQ-002, REQ-005, REQ-017, REQ-021, REQ-022, REQ-023.
- **Design inputs**: `t3-architect.md#Runtime and module boundaries`; `t5-ux.md#Information architecture and routes`, `#Campus activity map`, `#First-person movement and interaction contract`, `#Accessibility and inclusive interaction requirements`, `#Visual and content direction`, `#Design acceptance checklist`.
- **Description**: Build the routed PlayCanvas world and semantic UI under `app/frontend/src` using a new, coherent NASA-like (not NASA-branded or implying NASA endorsement) design system implemented as centralized Tailwind tokens and reusable accessible custom components. Use the approved restrained deep-space navy/charcoal and lunar-neutral surfaces, crisp high-contrast typography, limited cyan/blue action accents, and semantic non-color-only status treatments; apply consistent typography, spacing, surface, focus, and reduced-motion patterns across the menu, tutorial, campus, and route shells. The fresh `/` first paint must show conspicuous lunar ground beneath/behind the menu, not a black-void-only scene. Build first-person astronaut controls, bilingual tutorial and campus, labeled activity-map alternative, mobile touch interactions, focus-safe route/history behavior, and fallback for unavailable WebGL. Remove iframe use plus its Vite middleware/copy path; preserve the legacy HTML only as read-only source.

### Phase 3 — User Story 7 (P1): Identity and safe online continuity; User Story 2 (P1): Define an agency and mission

#### Step 3.1: [Cross-cutting] Deliver secure account, profile, agency continuity and settings
- **Group**: Cross-cutting.
- **Requirements**: REQ-003, REQ-004, REQ-017, REQ-018, REQ-019, REQ-020.
- **Design inputs**: `t3-architect.md#Authentication and session handling`, `#HTTP API contract`; `t4-dba.md#Data Model`; `t5-ux.md#Information architecture and routes`.
- **Description**: Implement registration/login/logout/session, profile and owner-scoped progression/agency view, secure confirmed state and settings/reset/restart/recovery in `app/backend/src` and `app/frontend/src`; use Argon2id, opaque hashed session tokens in secure cookies, CSRF/origin protection, and the approved API contracts. Keep `gng32.save` unchanged until a separate consent flow.

#### Step 3.2: [US2] Implement mission creation, stakeholder decisions, phase gates and rework
- **Requirements**: REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-023.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#HTTP API contract`, `#Backend layers and invariants`; `t4-dba.md#Aggregate and Relationship Boundaries`; `t5-ux.md#Campus activity map`.
- **Description**: Implement create/name/select mission, capacity/limit and agency consequence feedback, mandatory NASA and stakeholder participation, explicit accept/qualify/decline/waive decisions, lifecycle/review transitions and consequence previews for phase rollback. Persist all accepted decisions atomically and expose the same activity availability in the 3D campus and HTML map.
- **Source anchors**: `Go-No-Go.html#newMission`; `Go-No-Go.html#vPartners,vMeeting`.

### Phase 4 — User Story 3 (P1): Design a feasible spacecraft and mission plan

#### Step 4.1: [US3] Implement spacecraft-class and payload design workflows
- **Requirements**: REQ-009, REQ-010.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#DTO and validation boundaries`, `#HTTP API contract`; `t4-dba.md#Aggregate and Relationship Boundaries`; `t5-ux.md#Campus activity map`.
- **Description**: Implement class/size selection and component add/place/rotate/remove with labeled non-drag alternatives, API-authoritative validation, and visible fit, mass, power, energy, pointing, budget, and requirement checks. Invalid designs return specific errors and never become a passing saved state.
- **Source anchors**: `Go-No-Go.html#vSatType`; `Go-No-Go.html#vBuild`.

#### Step 4.2: [US3] Implement destination, orbit, launch selection and flight planning
- **Requirements**: REQ-011, REQ-012.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#HTTP API contract`, `#Request and state ownership`; `t4-dba.md#Aggregate and Relationship Boundaries`.
- **Description**: Implement supported destination/orbit, launch-provider/vehicle, transfer/maneuver and delta-v choices with actionable feasibility/cost/capacity trade-offs. Persist a server-validated plan and explain incompatible/impossible options without claiming readiness.
- **Source anchors**: `Go-No-Go.html#vFD`; `Go-No-Go.html#vDRM`.

### Phase 5 — User Story 4 (P1): Pass build, testing and readiness gates

#### Step 5.1: [US4] Implement assembly, six qualification tests, repair and readiness
- **Requirements**: REQ-007, REQ-008, REQ-013, REQ-014.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#Backend layers and invariants`, `#HTTP API contract`; `t4-dba.md#Data Model`, `#Migration and Operational Notes`; `t5-ux.md#Campus activity map`.
- **Description**: Implement observable assembly/clean-room completion; functional, vibration, thermal-vacuum, shock, EMC and mass tests; costs, failures, next actions, repair/rerun and design-revision invalidation. Readiness is computed from current server-side results and blocks GO with exact outstanding checks. Show rework cost/approval/test effects before confirmation.
- **Source anchors**: `Go-No-Go.html#vBuild`; `Go-No-Go.html#vTest`.

### Phase 6 — User Story 5 (P1): Launch, operate and resolve mission events

#### Step 6.1: [US5] Implement explicit launch, flight operations and mission outcomes
- **Requirements**: REQ-015.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#HTTP API contract`, `#Backend layers and invariants`; `t4-dba.md#Data Model`.
- **Description**: Implement a readiness-gated launch review and explicit launch/countdown; in-flight state begins only after completion. Record operational events and choices, derive communications/data/power/duration/orbit consequences on the server, and close honestly with success or failure.
- **Source anchors**: `Go-No-Go.html#vPad`; `Go-No-Go.html#vLaunch,vMcc,finish`.

### Phase 7 — User Story 6 (P2): Review results and continue play

#### Step 7.1: [US6] Implement reports, analysis and remaining campaign activities
- **Requirements**: REQ-004, REQ-016.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#HTTP API contract`; `t4-dba.md#Data Model`; `t5-ux.md#Campus activity map`.
- **Description**: Build persisted closeout reports with outcome, science, resource/financial summaries and contributing facts; implement source-present compare/what-if with simulated results visibly distinct from recorded outcomes; support available roadmap/ranking/facility-infrastructure interactions and progression effects. Any unsupported legacy action must be reported incomplete and never presented as completed.
- **Source anchors**: `Go-No-Go.html#finish,reportHTML,missionFacts`; `Go-No-Go.html#whatif,rankModal`; `Go-No-Go.html#vAdmin`.

### Phase 8 — User Story 7 (P1): Preserve progress safely across sessions and devices

#### Step 8.1: [US7] Implement explicit, atomic, one-time legacy v32 save import
- **Requirements**: REQ-018, REQ-020.
- **Design inputs**: `t1-pm.md#Legacy gameplay inventory`; `t3-architect.md#Legacy v32 import protocol`, `#HTTP API contract`; `t4-dba.md#Legacy v32 Field Mapping`, `#Consent-Gated Import Contract`, `#Test/Acceptance Matrix`; `t5-ux.md#Core player journeys`.
- **Description**: Add a deliberate consent/review path that does not read `gng32.save` before consent; parse and fully validate supported v32 data; map all mission/root fields; use owner-scoped atomic import, digest/idempotency protections and one-time ledger. Decline, invalid data, failures and success all leave the source key unchanged; no overwrite of existing online state.
- **Source anchors**: `Go-No-Go.html#save,load,reset`.

### Phase 9 — Cross-cutting completion and operations

#### Step 9.1: [Cross-cutting] Deliver full-stack journey tests and evidence
- **Group**: Cross-cutting.
- **Requirements**: REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023.
- **Design inputs**: all journey and evidence gates in `t6-teamlead.md`; behavior map in `t1-pm.md`; API and schema contracts in `t3-architect.md` and `t4-dba.md`; accessible flows in `t5-ux.md`.
- **Description**: Execute and report root build/test, real-MySQL migrations/integration and Playwright against live services, independent keyboard/visual/accessibility/mobile checks, and all inventory groups. Do not pass off emulation for physical GPU evidence, mock state for persistence, iframe use for native gameplay, or incomplete flows as complete. Any unavailable tier includes exact error, impact, and escalation.

#### Step 9.2: [Cross-cutting] Provide reproducible local operation and deployment-ready configuration
- **Group**: Cross-cutting.
- **Requirements**: REQ-024.
- **Design inputs**: `t3-architect.md#Authentication and session handling`, `#Operational and migration decisions`; `t4-dba.md#Migration and Operational Notes`; `clarification.md#Downstream Usage Notes`.
- **Description**: Provide a no-secret `.env.example`, local MySQL Compose workflow, explicit migration/run/build/test scripts, structured space-themed `npm run dev` output, separate liveness/readiness semantics, deployment health/build configuration and runbook. Readiness remains false on missing/invalid DB/schema and diagnostics never print credential values. Do not deploy publicly or invent cloud provider/secrets; state that numeric SLA comparison awaits a measured baseline.

## Task Breakdown

The `[P]` marker denotes independent work after its listed prerequisites complete. User-story labels follow t1 priorities; setup/foundational/cross-cutting tasks omit story labels. All code conversion tasks cite their legacy behavior source. Dependencies are also recorded in `checkpoints/t7-plan-to-tasks.yaml`.

### Phase 1 — Setup

- [ ] T001 [Plan:1.1] Preserve npm workspaces, pin `playcanvas` to exact `2.12.4` in `app/frontend/package.json` and root `package-lock.json`, establish reproducible root `build`/`test`/`dev` script and test-runner contracts, and verify the resolved engine version.
  - **Execution research (2026-11-03):** The actual workspace root is `package.json` with `app/frontend` and `app/backend` workspaces; frontend is Vite 7.3.7/TypeScript 5.9.3 with `playcanvas: ^2.12.2` resolving to 2.23.3, and backend is Express 5.3.0/TypeScript 5.9.3 with `tsx` watch-mode development. Existing root `build` chains both workspace builds, but root `dev` and `test` scripts and all test files/frameworks are absent. Node 22.14.0/npm 10.9.2 are installed. The approved clarification selects Tailwind CSS, so the existing Vite frontend can host Tailwind through its official Vite integration without changing frameworks. Baseline `npm run build` succeeds; frontend reports the pre-existing >500 kB bundle warning. T001 scope is limited to root/frontend workspace config, lockfile, minimal test coverage, and the selected frontend styling-tool integration; do not alter backend gameplay or begin T002.
- [ ] T002 [Plan:1.2] Implement `app/contracts/src/v1/` request/response DTO schemas and validation, `app/backend/src/persistence/dao/` boundaries and `app/backend/src/migrations/` for the t4 MySQL 8.4 schema; add app factories and isolated migration/integration-test setup.

### Phase 2 — User Story 1 (P1): Enter the lunar mission environment

- [ ] T003 [US1] [Plan:2.1] Rebuild the app shell in `app/frontend/src/main.ts`, `app/frontend/index.html`, `app/frontend/src/style.css`, and `app/frontend/vite.config.ts`: implement centralized Tailwind design tokens and reusable accessible custom components for a coherent, professional NASA-like visual system (deep-space navy/charcoal, lunar-neutral surfaces, crisp high-contrast type, restrained cyan/blue action accent, and semantic status treatments; no NASA logo or implied endorsement), consistently applied to the native 3D lunar menu/tutorial/campus and `/`, `/profile`, `/missions`, `/missions/:missionId` route shells. Acceptance: capture and review the fresh `/` render at desktop and mobile viewports to verify conspicuous lunar ground beneath/behind the menu with no black-void-only start; confirm representative shell components use the shared tokens, and verify contrast (4.5:1 normal text; 3:1 large text and relevant controls/graphics), visible focus, and non-color-only status in both IT/EN. Also deliver map-equivalent activities, bilingual semantic panels, keyboard/mouse/touch controls, recovery states, and no active iframe/legacy serving or copy path. [Source: Go-No-Go.html#startTutorial,coachStep,endTutorial,vHub]
  - **Execution research (2026-11-03):** Current frontend scope is `app/frontend/src/main.ts`, `index.html`, `src/style.css`, and `vite.config.ts`; no router module or frontend tests currently exist. The app already uses PlayCanvas `2.12.4`, Vite `7.3.7`, TypeScript `5.9.3`, Tailwind `4.3.4` with `@tailwindcss/vite`, and root Vitest `5.1.0`. Preserve existing PlayCanvas scene/model loading, the luminous regolith surface and `PLAYER_SPAWN` at `(0,0,9)`; existing menu camera points at the lunar habitat. Current UI still embeds `/legacy-game.html` in `#legacyGame`; `vite.config.ts` reads/serves/copies `Go-No-Go.html`, and the frontend has no native route handling. Public NASA assets are `public/assets/nasa/Astronaut.glb` and `Crab-Nebula.glb`. Planned implementation stays frontend-only: native history routes and typed route resolver, a semantic bilingual shell with explicit unavailable mission/account flows and activity status map, responsive keyboard/mouse/touch controls, and focused Vitest route coverage. No endpoint-contract scripts or DOM-test library are present. No task-specific `task.md`, assessment artifact, `scenario-instructions.md`, or scenario skill root was present/forwarded; the UX artifact and this task's acceptance criteria are the available implementation authority. Do not read clarification-questions.json or modify backend/services/root scripts.

### Phase 3 — User Stories 7 and 2 (P1)

- [ ] T004 [US7] [Plan:3.1] Implement email/password registration, login/logout, cookie sessions, profile, own-agency view, preferences, explicit reset/recovery and confirmed online state in `app/backend/src/` and `app/frontend/src/`; use only the shared API/DAO contracts and secure auth invariants. [Source: Go-No-Go.html#newG,vAdmin,save,load,reset,I18N]
- [ ] T005 [US2] [Plan:3.2] Implement agency/mission creation and limits, NASA/stakeholder selection, requirement decisions and observable effects, mission lifecycle/review gates, and rework consequence previews across `app/backend/src/` and `app/frontend/src/`; persist each accepted command atomically. [Source: Go-No-Go.html#newMission] [Source: Go-No-Go.html#vPartners,vMeeting]

### Phase 4 — User Story 3 (P1)

- [ ] T006 [US3] [Plan:4.1] Implement spacecraft class and payload selection, component placement/rotation/removal, constraints and actionable invalid-design handling through `app/backend/src/` and the mission-design panels in `app/frontend/src/`. [Source: Go-No-Go.html#vSatType] [Source: Go-No-Go.html#vBuild]
- [ ] T007 [US3] [Plan:4.2] Implement destination/orbit, compatible launcher, trajectory/maneuver and delta-v planning and persistence through `app/backend/src/` and mission-planning panels in `app/frontend/src/`. [Source: Go-No-Go.html#vFD] [Source: Go-No-Go.html#vDRM]

### Phase 5 — User Story 4 (P1)

- [ ] T008 [US4] [Plan:5.1] Implement assembly, the six qualification classes, cost/result history, repair/rerun, affected-result invalidation and server-computed readiness in `app/backend/src/` and `app/frontend/src/`. [Source: Go-No-Go.html#vBuild] [Source: Go-No-Go.html#vTest]

### Phase 6 — User Story 5 (P1)

- [ ] T009 [US5] [Plan:6.1] Implement confirmed readiness-gated launch/countdown, operation events and choices, authoritative resource/outcome updates, and mission closeout in `app/backend/src/` and `app/frontend/src/`. [Source: Go-No-Go.html#vPad] [Source: Go-No-Go.html#vLaunch,vMcc,finish]

### Phase 7 — User Story 6 (P2)

- [ ] T010 [US6] [Plan:7.1] Implement evidence-based closeout reports, compare/what-if, roadmap/ranking and remaining in-scope post-mission campaign panels in `app/backend/src/` and `app/frontend/src/`; distinguish actual mission records from simulations. [Source: Go-No-Go.html#finish,reportHTML,missionFacts] [Source: Go-No-Go.html#whatif,rankModal] [Source: Go-No-Go.html#vAdmin]

### Phase 8 — User Story 7 (P1)

- [ ] T011 [US7] [Plan:8.1] Implement the explicit-consent profile import UI and `POST /api/v1/imports/legacy-v32` path in `app/frontend/src/` and `app/backend/src/`, strict complete v32 validation/mapping, atomic idempotent import and source-key preservation; test decline, retries, corrupt data and online-state conflicts. [Source: Go-No-Go.html#save,load,reset]

### Phase 9 — Cross-cutting completion and operations

- [ ] T012 [Plan:9.1] Implement and execute `app/frontend/e2e/` Playwright journey suites and backend/MySQL integration coverage for all 14 INV groups; run full root `npm run build` and `npm test`, record counts/exit codes and desktop/mobile evidence, and report any incomplete capability or flow without downgrading required gates.
- [ ] T013 [P] [Plan:9.2] Add local MySQL/deployment-ready configuration and operator instructions in root `docker-compose.yml`, `.env.example`, app Docker/build/health configuration and `README.md`; document exact root commands, schema migration/readiness behavior and missing production SLA baseline. Never include real credentials or deploy publicly.

## Project Structure

```text
app/
  contracts/src/v1/                  # Shared versioned request/response schemas and errors
  frontend/
    index.html
    src/
      app/router/                    # Menu, profile, mission routes
      game/                          # PlayCanvas 2.12.4 scene, lunar terrain, input
      features/                      # Tutorial, campus, agency, design, tests, flight, reports
      api/                            # Typed HTTP client and confirmed state
      i18n/                           # Italian and English resources
    e2e/                              # Playwright user journeys
  backend/
    src/
      http/v1/                        # Express routers/controllers/middleware
      application/                    # Feature use cases and transaction orchestration
      domain/                         # Authoritative game rules/state transitions
      persistence/dao/                # Parameterized MySQL DAO implementations
      config/                          # Validated environment configuration
      migrations/                      # Forward-only schema migrations
    test/                              # Unit/API/real-MySQL integration
Go-No-Go.html                         # Read-only behavioral/import reference; not served as gameplay
package.json
package-lock.json
docker-compose.yml                    # Local/test MySQL only; no public deployment
.env.example                          # Placeholders only
README.md                              # Local setup, scripts and operator guidance
```

This is the target organization, not a claim that these paths already exist. Reuse existing workspace/source files where their behavior remains appropriate and integrate rather than discard user changes.

## Testing Strategy

### App type and critical journeys

- **appType**: mixed web app — PlayCanvas/TypeScript SPA with semantic HTML routes and a Node.js/TypeScript Express 5 API, backed by MySQL.
- **Primary validation stack**: Root `npm run build`; root `npm test` composed of Vitest unit, Supertest API, real MySQL 8.4 migration/integration, and Playwright against live frontend/API/DB; automated accessibility checks and manual keyboard/visual/mobile hardware checks.
- **Legacy test assets**: No legacy test files/framework or canonical test script were found in t1/project reconnaissance. `migrationDecision: N/A — no discovered legacy E2E tests`; establish new suites and wire them to root `npm test`.
- **Required browser suites**: `app/frontend/e2e/first-visit-controls.spec.ts`, `mission-planning.spec.ts`, `verification-operations.spec.ts`, `identity-import.spec.ts`, `reports-settings.spec.ts`. Minimum 3 runnable files; the full planned coverage is 5. Use deterministic mission seed/test clock and synthetic `.test` emails.

1. **First visit/tutorial/campus**: menu opens over conspicuous lunar ground; tutorial start, skip, completion and return work; no gameplay iframe/legacy navigation; localized text and keyboard/mouse, touch, accessible-map paths work; scene failure is recoverable.
2. **Identity/agency/mission/requirements**: register/login, create agency and mission, capacity and participant/requirement decisions, reload/second-context recovery, owner isolation, invalid credentials and retry behavior all produce correct visible and persistent state.
3. **Design/planning/review**: design component changes recalculate constraints; invalid design/orbit/launcher is explicitly blocked; flight plan has a visible feasibility result; review/phase rollback previews effects before confirmation.
4. **Assembly/tests/launch/operations**: assemble, exercise all six tests and a deterministic failure/repair/rerun, verify stale results block readiness; explicit launch follows countdown, event decisions/resources persist, outcomes are honest.
5. **Reports/continuity/import/settings**: successful and failed closeout facts reconcile; compare/what-if is labeled simulated; report/progression and profile mission recovery persist; reset/localization/audio settings recover safely; import decline does not read data, valid consent imports once, invalid/failing import preserves source.
6. **Access paths and devices**: keyboard/screen-reader path completes decisions without aiming/pointer lock; automated axe on menu/profile/mission/dialog/error/report; Italian/English critical flows; desktop browser smoke and mobile viewport/touch interaction. Physical GPU compatibility is reported only if tested on an actual device.

### Test tiers, infrastructure, and external dependencies

| Tier | Tool and dependency | Required evidence |
|---|---|---|
| Unit | Vitest; mock DAO only at unit boundary | Pure domain transitions/calculations, DTO/import validation, API client state, error/locale behavior. |
| API/service | Supertest with Express app factory and actual middleware/services | DTO/status/error contract, auth/CSRF/ownership, revision/idempotency, liveness/readiness, response redaction. |
| Database/migration | Disposable real MySQL 8.4/InnoDB (Docker Compose preferred) | Fresh migration, repeat/interrupted-run checks, DAO persistence, transaction rollback, real query/constraint semantics, import atomicity/deduplication and conflict behavior. |
| Browser | Playwright with live client/API and same test MySQL, no mocked mission state | Multi-step flows, actual routes/assets/DOM, desktop + mobile-emulation controls, browser Back/refresh/focus, no iframe, localized UI and saved read-back. |
| Accessibility/manual | axe + keyboard/screen-reader/zoom/contrast/reduced-motion/touch review | Axe results plus recorded manual checklist; screenshots/Playwright traces for initial menu and recovery; physical iOS/Android GPU result only when truly run. |

- **External dependencies**: No third-party provider required for local flows. MySQL is a real test dependency. Frontend/API share versioned DTO/contract fixtures; test through HTTP and shared schemas, not a test-only API mock. If future providers are introduced, deterministic local stubs are allowed only for that provider axis and must be reported separately.
- **Unit/integration infrastructure**: app factories; `.env.test` values generated from safe test defaults; run-scoped isolated schema/container; migration/bootstrap helpers; unique UUID identifiers, deterministic game seed and controllable test clock; cleanup restricted to disposable test DB.
- **Per-task execution rule**: every implementation task runs the relevant module tests and records exact command, exit code, passed/failed/skipped counts and failure names. Any relevant failure blocks task completion.
- **Full acceptance**: `npm run build` and `npm test` from repo root exit 0; real MySQL integration/migration and Playwright are green; all 14 inventory groups map to evidence; WCAG/bilingual/touch validation is complete; no iframe is included in production output; exact PlayCanvas 2.12.4 is resolved; no incomplete flow is represented as successful.

### Fallback matrix (capability axes are independent)

| Axis | Primary | Fallback only after that axis's own documented failure | Coverage loss/gate |
|---|---|---|---|
| Infrastructure / database | Docker Compose with real MySQL 8.4 | Independently check for a reachable MySQL 8.4 local service; SQLite/in-memory is limited unit support only, not a MySQL pass. | No real MySQL means exact SQL, migrations, transactions, persistence and DB gate remain UNVERIFIED/FAIL; preserve exact Docker/MySQL error and escalate. |
| Browser | Playwright with installed browser binaries | Only after a reproducible Node/browser setup failure, framework-native HTTP tests are a partial fallback. | Rendering, WebGL/assets, routes, touch and visual/browser accessibility remain unverified; report exact failure and escalate. Docker failure does not justify skipping Playwright. |
| Physical mobile hardware | Real supported mobile browsers/GPUs plus Playwright touch/viewport | If hardware unavailable, mobile browser emulation is limited evidence. | Real GPU compatibility remains UNVERIFIED; do not report emulation as physical support. |
| Provider/cloud | None for local game | Provider-specific stubs only if one is later added. | No public deployment or real cloud secrets; state this limitation. |

**Current strategy-authoring evidence** (from t6; recheck at execution): Node/npm available (`node v22.14.0`, `npm 10.9.2`); Docker CLI exists but Docker daemon was unreachable; MySQL CLI not found; Playwright was not installed or attempted. These observations do not waive the independent MySQL or Playwright attempts.

## Risks and Explicit Limitations

- **Legacy behavior breadth**: `Go-No-Go.html` contains extensive coupled behavior; coverage is complete only after each INV-01…INV-14 flow is implemented and tested. If any flow remains partial, record it by name and block a complete-parity claim.
- **Save integrity**: import is not safe without the full source-backed v32 field map and all-or-nothing transaction. Reject data that cannot be faithfully represented; never silently drop/overwrite.
- **SLA**: “match current production baseline” is an unresolved operational assumption with no numeric baseline. Do not invent a target; request measurements before quantitative no-regression acceptance.
- **PlayCanvas compatibility**: the exact pin resolves the decision but build/runtime compatibility must still be verified against 2.12.4.
- **Environment capability**: Docker daemon, MySQL, Playwright browser installation and physical mobile devices must be probed independently at execution; failures are evidenced, escalated, and never converted into green gates.
- **Deployment**: implement local and provider-neutral deployment configuration only. Provider selection, cloud credentials, and actual public deployment are outside the approved task.

## Requirement Mapping

| REQ ID | Description | Plan Items | Implementation Evidence |
|---|---|---|---|
| REQ-001 | Navigable lunar menu with visible ground | 2.1, 9.1 | `app/frontend/src/game/`, menu; first-visit screenshot/E2E |
| REQ-002 | Native first-person gameplay; no iframe | 2.1, 9.1 | PlayCanvas world, no iframe/legacy route in build; E2E assertion |
| REQ-003 | Agency/game and mission creation, state and limit feedback | 3.1, 3.2, 9.1 | Account/agency/mission APIs and panels; capacity tests |
| REQ-004 | Visible resource/funding/cost/staff/progression consequences | 3.1, 3.2, 7.1, 9.1 | Agency and mission DTOs, consequence panels, persistence tests |
| REQ-005 | Reachable campus activities with return paths | 2.1, 3.2, 9.1 | World + equivalent activity map and route-return E2E |
| REQ-006 | Participants and explicit requirement decisions | 3.2, 9.1 | Participant/decision endpoints and outcome persistence tests |
| REQ-007 | Full lifecycle and explicit review gates | 3.2, 5.1, 9.1 | Server transitions/reviews/readiness; gate tests |
| REQ-008 | Explain rework consequences before rollback | 3.2, 5.1, 9.1 | Review preview DTO/UI, invalidation tests |
| REQ-009 | Compatible spacecraft/payload design and constraints | 4.1, 9.1 | Design API/UI checks; feasible/infeasible E2E |
| REQ-010 | Design operations recalculate and explain invalid choices | 4.1, 9.1 | Revision-guarded design command/check DTO; invalid-choice tests |
| REQ-011 | Destination/orbit/launcher trade-offs | 4.2, 9.1 | Flight-plan options/check DTO and E2E |
| REQ-012 | Orbit/maneuver feasibility and actionable blockers | 4.2, 9.1 | Flight-plan validation, trajectory result, error tests |
| REQ-013 | Observable assembly and transition | 5.1, 9.1 | Assembly API/status and route/activity E2E |
| REQ-014 | All six tests, failure action and current readiness | 5.1, 9.1 | Test-run history, invalidation and readiness block tests |
| REQ-015 | Explicit launch, operations and honest mission outcome | 6.1, 9.1 | Launch/operation command history and success/failure E2E |
| REQ-016 | Reports explain outcome; active analysis actions preserved | 7.1, 9.1 | Report/analysis DTOs, evidence reconciliation, actual-vs-simulated tests |
| REQ-017 | Complete Italian and English player-facing text | 2.1, 3.1, 9.1 | Locale resources and localized journey/accessibility checks |
| REQ-018 | Preserve legacy save; explicit reset/recovery | 3.1, 8.1, 9.1 | Reset/recovery panel and import source-key-preservation tests |
| REQ-019 | Safe email/password accounts and profile | 3.1, 9.1 | Argon2id, safe sessions, owner-scoped profile; auth/security tests |
| REQ-020 | Cross-device mission state and explicit optional import | 3.1, 8.1, 9.1 | Online read-after-write and consent/idempotency tests |
| REQ-021 | Desktop/mobile browser support and equivalent controls | 2.1, 9.1 | Keyboard/mouse/touch controls; desktop and mobile browser evidence |
| REQ-022 | WCAG 2.2 AA accessible interface | 2.1, 9.1 | Semantic UI, axe results and recorded manual keyboard/contrast checks |
| REQ-023 | Dedicated menu/profile/mission routes and safe return | 2.1, 3.2, 9.1 | Router, history/focus-safe return and route E2E |
| REQ-024 | Polished `npm run dev`, truthful health and actionable config | 1.1, 9.2 | Root script, structured logs, liveness/readiness, config/health tests |

## Plan Validation Results

- Requirement coverage: 24/24; no unmapped requirement.
- Task coverage: 13/13 plan items; no orphan task.
- Project grouping: no project topology or `*-fanout.md` was supplied, so no invented G-group tags.
- Execution order: task dependencies are explicit in the plan-to-tasks checkpoint; independent setup-adjacent documentation can run after T002.
- Application build/tests: not run; this task changes planning artifacts only. Implementation tasks must run their module tests and the final full gates.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/artifacts/t1-pm.md` — requirements, behavior groups, priorities and source anchors.
- `.github/modernize/rearchitecture/artifacts/t3-architect.md` — target module boundaries, API/DTO/DAO/security/concurrency contracts.
- `.github/modernize/rearchitecture/artifacts/t4-dba.md` — MySQL model, migration invariants and explicit legacy-import contract.
- `.github/modernize/rearchitecture/artifacts/t5-ux.md` — routes, interaction equivalence, responsive and accessibility acceptance.
- `.github/modernize/rearchitecture/artifacts/t6-teamlead.md` — binding runtime/browser/DB strategy and evidence gates.
- `.github/modernize/rearchitecture/clarification-answers.md` and `.github/modernize/rearchitecture/clarification.md` — approved technical scope, constraints and assumptions.
- `.github/modernize/rearchitecture/decisions.md` — approved architectural decisions and mandatory baseline-gap treatment.
- `.github/modernize/rearchitecture/artifacts/project-structure.md` and `tech-stack.md` — current package layout, source seams and toolchain gaps.

## Evidence Mapping

- `t1-pm.md#Functional requirements` → all 24 rows in [Requirement Mapping](#requirement-mapping) and `checkpoints/t7-spec-to-plan.yaml`.
- `t1-pm.md#Legacy gameplay inventory` → source-anchored tasks T003–T011 and INV-flow acceptance in Testing Strategy.
- `t3-architect.md#Runtime and module boundaries`, `#API conventions`, `#HTTP API contract`, `#Authentication and session handling` → steps 1.1–9.2 and DAO/DTO/security implementation constraints.
- `t4-dba.md#Data Model`, `#Legacy v32 Field Mapping`, `#Consent-Gated Import Contract`, `#Migration and Operational Notes` → steps 1.2, 3.1, 8.1, 9.1; MySQL and import verification gates.
- `t5-ux.md#Information architecture and routes`, `#First-person movement and interaction contract`, `#Accessibility and inclusive interaction requirements` → step 2.1 and desktop/mobile/WCAG acceptance criteria.
- `t6-teamlead.md#Critical user journeys and acceptance`, `#Fallback matrix`, `#Infrastructure scaffold and module test skeletons` → Testing Strategy and step 9.1.
- `.github/modernize/rearchitecture/clarification-answers.md#Frontend`, `#Backend`, `#Generic` → Constitution Check and exact target constraints in Technical Context.
- `project-structure.md#Entry points and routing` and `tech-stack.md#Packages` → exact existing file seams and foundational task 1.1.
