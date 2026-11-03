# t1 — Go-No-Go Gameplay Inventory and Acceptance Criteria

## Status and scope baseline

This artifact defines **what** the in-place rearchitecture must deliver. It is a product inventory and acceptance specification, not an implementation design.

- **Discovery method:** inspected both language READMEs and the authoritative `Go-No-Go.html` (3,664,658 characters), including its mission-state model, rendered views, interaction actions, tutorial, save/load, language handling, and reporting paths. Confirmed the repository profile identifies the legacy HTML as the behavior reference.
- **Total behavior groups identified:** 12 legacy groups plus 2 approved target extensions (accounts/online persistence and immersive first-person interaction).
- **Items in scope:** all 14 groups. No legacy Go-No-Go activity or flow is excluded from the requested conversion.
- **Current baseline:** gameplay and saves are concentrated in the standalone legacy page; it saves version-32 data under `gng32.save` in browser local storage. The existing game uses Italian/English text. No test files or declared test command were found during discovery; end-to-end tests are an approved target requirement.
- **Out of scope unless separately approved:** README “potential” ideas that are not established legacy flows or explicit user decisions (for example cooperative play for four people, competitive team play, additional scenarios, or new leaderboard capabilities). Existing game behavior that is present must still be inventoried and accounted for.

## Legacy gameplay inventory

| ID | Behavior group | Observed behavior to preserve/rebuild | Acceptance coverage |
|---|---|---|---|
| INV-01 | Onboarding and tutorial | A guided first mission introduces campus navigation, stakeholder decisions, review gates, satellite design, tests, launch, in-flight decisions, and mission closeout. The tutorial can be skipped or completed before normal play begins. | REQ-001, REQ-002 |
| INV-02 | Mission and agency lifecycle | Players create and name missions, select mission context, and manage active/completed missions. Agency resources, funding, staff costs, experience/progression, unlocks, and mission capacity affect play. | REQ-003, REQ-004 |
| INV-03 | Campus navigation and facilities | The campus hub provides access to administrative/partner activities, spacecraft design, flight dynamics, assembly/clean-room, testing, launch, mission control, and facility/infrastructure activities. The legacy hub is not itself the requested first-person 3D implementation. | REQ-001, REQ-005 |
| INV-04 | Stakeholder selection and requirements | NASA participates alongside selected stakeholders/team members. Mission and technical participants present requirements; the player accepts, declines, accepts with qualification, or waives them. Satisfaction, departures, funding, and accepted requirements influence subsequent work. | REQ-006 |
| INV-05 | Mission-phase gates and rework | Mission progression includes definition, feasibility, preliminary design, detailed design, assembly/testing, flight readiness, flight/operations, and closeout (shown in the legacy tutorial as phases 0/A/B/C/D/E/F). Formal review gates advance work; returning to an earlier phase has stated financial, schedule, trust, and rework consequences. | REQ-007, REQ-008 |
| INV-06 | Spacecraft and payload design | Players select a spacecraft class/size (the implemented baseline prominently supports CubeSats), choose parts and accessories, place/rotate components in a constrained layout, and see design checks and budget/resource consequences. Mass, power, energy storage, pointing, fit, requirements, and cost are relevant constraints. | REQ-009, REQ-010 |
| INV-07 | Flight dynamics and launch selection | Players evaluate destination/orbit constraints, launch-provider/vehicle compatibility, capacity and cost, orbital transfer/mission design, maneuver strategy, delta-v feasibility, and orbit parameters. The legacy includes interactive orbit views and transfer/burn editing. | REQ-011, REQ-012 |
| INV-08 | Build, facilities, and assembly | Players obtain/assemble the approved design in the build flow, use assembly and clean-room facilities/stations, and observe progress before the spacecraft can enter testing. Facility/infrastructure upgrades can affect mission support. | REQ-013 |
| INV-09 | Verification and qualification tests | The legacy identifies six test classes: functional, vibration, thermal-vacuum, shock, electromagnetic compatibility (EMC), and mass. Players install/use test equipment, pay per test, expose defects, repair or change the design, and rerun required tests before readiness review. | REQ-014 |
| INV-10 | Launch and mission operations | The player reaches a launch decision/countdown and follows the mission after launch. Flight/mission operations surface events and failures and ask for operational decisions; communications, data return, destination/orbit conditions, and mission duration affect outcomes. | REQ-015 |
| INV-11 | Mission closeout and analysis | Closeout presents mission outcome and supporting mission facts, including collected science, resources/financial result, phase payments, and the causes of success/failure. The legacy also exposes report/compare, what-if, roadmap, and ranking-related actions where enabled. | REQ-016 |
| INV-12 | Player settings and local continuity | The legacy supports Italian/English, browser-local save/load, language preference, audio/sound effects, restart/reset, and compatibility handling for an unreadable or unsupported save. The new product must not silently discard or overwrite an existing legacy save. | REQ-017, REQ-018 |
| INV-13 | Approved account and online continuity extension | Players use email/password accounts and a profile to find their own missions across sessions/devices. A legacy `gng32.save` import is optional, one-time, and must happen only after explicit player consent. | REQ-019, REQ-020 |
| INV-14 | Approved immersive and inclusive interaction extension | The complete gameplay flows are rebuilt without an iframe: the player controls an astronaut in a first-person 3D world, with dedicated menu/profile/mission routes, desktop and touch interaction, Italian/English UI, and WCAG 2.2 AA access. The initial menu visibly presents lunar terrain/ground, not a black void. | REQ-001, REQ-002, REQ-021, REQ-022 |

### Trace notes

- Legacy source anchors include `startTutorial`, `coachStep`, `endTutorial`, `newMission`, `newG`, `vHub`, `vAdmin`, `vPartners`, `vMeeting`, `vSatType`, `vBuild`, `vFD`, `vDRM`, `vTest`, `vPad`, `vLaunch`, `vMcc`, `finish`, `reportHTML`, `missionFacts`, `whatif`, `rankModal`, `save`, `load`, `reset`, and `I18N`.
- The legacy source records the six test categories in `L.TESTS`: `func`, `vib`, `tvac`, `shock`, `emc`, `mass`.
- This inventory distinguishes implemented legacy behavior from README “potential considerations”; aspirational README ideas are not silently treated as completed product requirements.

## User scenarios and acceptance scenarios

### User Story 1 — Enter the lunar mission environment (Priority: P1)

As a player, I want to reach a clear, navigable lunar mission environment and learn how to play, so I can begin without needing prior game knowledge.

**Why this priority:** The initial experience is the product’s entry point and the tutorial is the existing onboarding flow.

**Independent test:** Open the web page as a new player, verify the first menu/world is visible, start the tutorial, move through its required interactions, and verify either tutorial completion or an explicit skip path.

**Acceptance scenarios:**
1. **Given** a fresh browser session on a supported desktop browser, **when** the menu first renders, **then** visible lunar ground occupies the scene beneath the menu and the player is not shown a black void.
2. **Given** the menu, **when** the player starts a new session, **then** the astronaut can move and look around using the desktop controls and can enter an available campus activity.
3. **Given** the menu on a supported mobile browser, **when** the player uses touch controls, **then** the player can move, look, and activate the same essential interactions without a desktop keyboard or mouse.
4. **Given** the tutorial is active, **when** the player follows its guidance through all mission stages or chooses Skip, **then** the game reaches the corresponding completion or normal-play state without trapping the player.
5. **Given** a player chooses Italian or English, **when** they navigate the menu, tutorial, gameplay panels, and error/confirmation states, **then** all player-facing text for those flows uses the chosen language.

### User Story 2 — Create an agency and define a mission (Priority: P1)

As a player, I want to define a mission, its objective/context, and its participants, so I can make the design decisions that shape the mission.

**Independent test:** Create a mission, complete its stakeholder meeting, and verify that accepted requirements and any resulting funding/satisfaction effects are reflected in the mission and agency.

**Acceptance scenarios:**
1. **Given** the player has an available mission slot, **when** they create and name a mission and choose its offered mission context, **then** it appears as an active mission with its selected context visible.
2. **Given** the mission’s stakeholder selection step, **when** the player selects participants, **then** the mandatory NASA participant and selected stakeholders/team members are represented at the decision point.
3. **Given** an offered requirement, **when** the player accepts, declines, qualifies, or waives it, **then** the choice and its consequences are visible and later mission checks use the accepted/waived requirement state.
4. **Given** a participant’s satisfaction reaches the game’s departure condition, **when** the decision is applied, **then** the player sees who left and any associated funding, requirements, or design consequence.
5. **Given** the player is at the active-mission limit, **when** they attempt to create another mission, **then** the game explains the limit and a concrete way to proceed.

### User Story 3 — Design a feasible spacecraft and mission plan (Priority: P1)

As a player, I want to select a spacecraft and payload, see engineering/resource trade-offs, and choose a feasible orbit and launch, so I can understand why the design succeeds or fails.

**Independent test:** Build one mission design from accepted requirements through its orbit/launch review and verify both successful checks and an intentionally infeasible choice produce understandable outcomes.

**Acceptance scenarios:**
1. **Given** the spacecraft-selection step, **when** the player chooses an available compatible class/size, **then** its capacity, constraints, and launch compatibility are visible before confirmation.
2. **Given** the design work area, **when** the player adds, moves, rotates, or removes a component, **then** the spacecraft layout updates and the relevant mass, power, budget, fit, and requirement checks recalculate.
3. **Given** a component or vehicle choice violates a constraint, **when** the player reviews the design, **then** the specific failed constraint and the affected requirement are identified; the game does not report the design as ready.
4. **Given** an unlocked destination/orbit and compatible launch options, **when** the player compares options, **then** the meaningful cost, capacity, orbit, and mission-performance trade-offs are explained.
5. **Given** a flight plan under design, **when** the player changes orbit parameters or maneuvers, **then** the updated orbit and feasibility/delta-v outcome are visible before the design gate is passed.

### User Story 4 — Pass build, testing, and readiness gates (Priority: P1)

As a player, I want to assemble the approved spacecraft, run qualification tests, and resolve failures, so launch readiness is earned rather than assumed.

**Independent test:** Advance a spacecraft through assembly, run each required test category, cause or encounter a test failure, repair the design, and verify the readiness decision is based on the latest test results.

**Acceptance scenarios:**
1. **Given** a design passes its required review, **when** the player purchases/starts assembly, **then** the player sees the assembly/clean-room activity and an observable completion state.
2. **Given** a spacecraft is available in the test lab, **when** the player runs functional, vibration, thermal-vacuum, shock, EMC, or mass testing, **then** the test is identified, its outcome is recorded, and its cost/required status is visible.
3. **Given** a test reveals a fault, **when** the player returns to modify or repair the spacecraft, **then** the player receives a meaningful fault explanation and affected tests can be rerun.
4. **Given** one or more required tests remain failed, missing, or invalidated by a later design change, **when** the player requests flight readiness, **then** the game blocks GO and identifies the outstanding test/requirement.
5. **Given** all applicable readiness checks pass, **when** the player confirms the readiness review, **then** the mission advances to the launch decision and displays the review outcome.

### User Story 5 — Launch, operate, and resolve mission events (Priority: P1)

As a player, I want to launch and operate the mission, responding to events and constraints, so my design decisions have visible consequences in flight.

**Independent test:** Launch a ready mission, advance through its flight/operations sequence, respond to a surfaced event, and verify the resulting mission state and data/outcome.

**Acceptance scenarios:**
1. **Given** a mission has passed readiness, **when** the player selects Launch, **then** a launch/countdown experience begins and the mission transitions to its in-flight state only after the launch action completes.
2. **Given** an in-flight event or anomaly, **when** the player selects an offered response, **then** the decision and its consequences appear in the mission state/log and affect the subsequent outcome.
3. **Given** a mission has limited communications, power, data return, duration, or orbital constraints, **when** an operation consumes or changes those resources, **then** the updated condition is visible and contributes to the result.
4. **Given** the mission has reached its end condition, **when** the player completes operations, **then** the mission closes with either a success or a failure outcome and a reason; the game does not claim success when mission criteria failed.

### User Story 6 — Review results, compare, and continue play (Priority: P2)

As a player, I want a useful mission report and access to my past work, so I can learn from outcomes and continue the agency campaign.

**Independent test:** Complete one successful and one unsuccessful mission (or the corresponding supported scenario), inspect both reports, and reopen saved missions from the profile.

**Acceptance scenarios:**
1. **Given** a mission reaches closeout, **when** the player opens its report, **then** the report shows the outcome, scientific result, resource/financial summary, and contributing success/failure causes.
2. **Given** a report supports comparison or what-if analysis, **when** the player compares the available alternatives, **then** the changed assumptions and resulting differences are clearly distinguished from the recorded actual outcome.
3. **Given** the player opens the profile, **when** they view their saved work, **then** only their own missions and relevant progress are listed and can be reopened.
4. **Given** progression unlocks or agency changes are earned, **when** the player returns to normal play, **then** those changes are visible and affect available choices as specified by the game.

### User Story 7 — Preserve progress safely across sessions and devices (Priority: P1)

As a player, I want secure account access and explicit control over importing my legacy save, so my mission progress is recoverable without exposing or silently replacing it.

**Independent test:** Create an account, save a mission, sign in from a second browser/session, and verify the mission is recovered; separately verify legacy import requires consent and can be declined.

**Acceptance scenarios:**
1. **Given** a valid email address and password, **when** a player registers or signs in, **then** they receive a clear success or validation/error result without credentials being exposed in the interface or logs.
2. **Given** an authenticated player saves or advances a mission, **when** they sign in on another supported device/session, **then** the saved mission can be loaded and its last confirmed progress is restored.
3. **Given** a browser contains a `gng32.save` legacy save, **when** the player is offered migration, **then** no import occurs until explicit consent; declining leaves the legacy save intact.
4. **Given** the player consents to a legacy import, **when** the import completes or fails, **then** the player receives a clear result and a repeat attempt does not create duplicate imported missions or silently overwrite newer online progress.
5. **Given** a save/load or account operation fails because of connectivity or invalid data, **when** the player retries or continues, **then** the game gives a recoverable error and does not present unconfirmed data as saved.

## Functional requirements

- **REQ-001:** The game MUST present a browser-based, navigable start/menu experience whose initial scene visibly includes lunar ground beneath the menu and does not render as a black void.
- **REQ-002:** The game MUST provide a playable first-person astronaut experience through all in-scope gameplay activities; a legacy-game iframe MUST NOT be the final implementation of gameplay.
- **REQ-003:** The player MUST be able to start a new agency/game, create and name missions, view active/completed mission state, and receive a useful explanation when a mission or progression limit blocks an action.
- **REQ-004:** The game MUST communicate mission and agency resource, funding, cost, staff, progression, and unlock changes when those changes affect an available player choice or mission outcome.
- **REQ-005:** The player MUST be able to move among the campus and the legacy mission activities using a coherent in-world navigation model, and every in-scope building/activity MUST have a reachable entry and a return path.
- **REQ-006:** The player MUST be able to select available mission participants and make explicit requirement decisions; accepted, qualified, declined, or waived requirements and their downstream consequences MUST remain observable.
- **REQ-007:** The player MUST be able to progress through the legacy mission lifecycle—definition, feasibility, preliminary design, detailed design, assembly/qualification, readiness, flight/operations, and closeout—through explicit review decisions; an unimplemented activity MUST NOT be presented as complete.
- **REQ-008:** If a player returns to an earlier mission phase, the game MUST show the consequential costs, schedule/rework effects, lost tests/approvals, and stakeholder effects before confirmation.
- **REQ-009:** The player MUST be able to select an available spacecraft class/size and design its spacecraft/payload by arranging compatible components; the interface MUST make fit and relevant mass, power, energy, pointing, budget, and requirement constraints visible.
- **REQ-010:** Component selection, placement, removal, or rotation MUST update the corresponding design status and affected constraints; invalid choices MUST be explained and MUST NOT be misrepresented as passing.
- **REQ-011:** The player MUST be able to evaluate supported destinations/orbits and compatible launch options, with their relevant mission, capability, and cost trade-offs visible.
- **REQ-012:** The player MUST be able to review and modify supported orbital/flight-plan choices, see the resulting path/feasibility and maneuver consequences, and receive a specific explanation for a plan that cannot meet mission constraints.
- **REQ-013:** The player MUST be able to advance a reviewed design through an observable assembly/integration activity and receive a clear completion/readiness transition.
- **REQ-014:** The testing flow MUST account for every legacy test class—functional, vibration, thermal-vacuum, shock, EMC, and mass—and show each test’s current result; a failure MUST identify a next action and readiness MUST reflect current results.
- **REQ-015:** The player MUST explicitly initiate launch, observe mission operations, respond to supported events/anomalies, and see how choices/resources affect a successful or failed mission outcome.
- **REQ-016:** Every closed mission MUST have a report that explains outcome and contributing factors; legacy report, compare, what-if, roadmap, and ranking-related interactions that are in active game paths MUST be preserved or explicitly identified as not yet converted.
- **REQ-017:** The game MUST provide Italian and English choices for all in-scope player-facing game, navigation, validation, confirmation, and failure text.
- **REQ-018:** Existing `gng32.save` data MUST NOT be silently discarded or overwritten. A user MUST have an explicit restart/reset action and receive an understandable recovery choice for unsupported/corrupt legacy data.
- **REQ-019:** Players MUST be able to register and authenticate with email/password and access a dedicated profile route; authentication outcomes MUST be understandable and credentials MUST NOT be revealed to other players.
- **REQ-020:** A player’s saved mission progress MUST be loadable from their account across supported sessions/devices. Legacy save import MUST be optional, explicit-consent-only, and safe to decline or retry.
- **REQ-021:** The experience MUST support current evergreen desktop browsers and representative current mobile browsers/GPUs; essential movement, navigation, and game interactions MUST be usable with keyboard/mouse and touch.
- **REQ-022:** Menus, HUD, dialogs, mission panels, controls, status, and errors MUST meet WCAG 2.2 AA, including keyboard operation, perceivable focus, readable contrast/text, semantic names, and non-color-only status communication.
- **REQ-023:** The game MUST provide dedicated menu, profile, and mission routes and preserve a clear route back to a safe home/profile state from each route.
- **REQ-024:** Local backend startup through the documented `npm run dev` workflow MUST provide clear, polished space-themed startup/health feedback; missing service configuration MUST be reported as actionable configuration guidance, not a false “ready” state.

## Edge cases and failure behavior

- Corrupt, unsupported, or older local save: preserve the original bytes/state until the player chooses a recovery action; explain whether import is available.
- Player declines legacy migration: continue without importing and leave the browser save unchanged.
- Interrupted import/save or network disconnect: show whether the operation was confirmed, allow safe retry, and avoid duplicate or misleading mission state.
- Two sessions update a mission: do not silently overwrite newer progress; present a recoverable conflict outcome.
- Mission is incomplete, blocked by an unfulfilled requirement, or has failed tests: show the exact blocker and do not advance to the next review/launch.
- A selected stakeholder leaves, is unavailable, or changes satisfaction: retain a visible record of the consequence and update funding/requirements as appropriate.
- Insufficient funds, capacity, incompatible launcher/orbit, impossible component fit, or invalid orbital values: identify the specific constraint and provide a non-destructive way to revise the choice.
- Test/repair cycle repeats: a changed design invalidates affected qualification results; only current, applicable passing tests count toward readiness.
- Launch anomaly, loss of communications, low resources, shortened mission duration, or failed mission: preserve the event/decision history and give an honest closeout report.
- Mobile GPU/WebGL limitations, resize/orientation change, or touch input interruption: provide usable controls/resizing and a meaningful fallback or error instead of a blank scene or lost mission progress.
- Unsupported route, expired session, or unauthorized profile/mission request: return the player to a useful sign-in or navigation state without exposing another player’s data.

## Key entities (product view)

- **Player/account:** the person who owns a profile and saved mission history.
- **Agency:** the player’s ongoing resources, funding, staff/progression, and unlocked choices.
- **Mission:** a named goal and its current phase, decisions, design, operations, and final outcome.
- **Stakeholder/participant:** a mission contributor with a role, requirement, satisfaction, and possible contribution/consequence.
- **Requirement/review:** an accepted obligation or formal decision governing mission progression.
- **Spacecraft/payload:** the selected vehicle configuration and its components, constraints, and test state.
- **Orbit/launch plan:** mission destination, orbital choices, launch option, and maneuver plan.
- **Test result:** a qualification result associated with a spacecraft configuration and readiness decision.
- **Mission event/decision:** an in-flight situation, the player’s response, and its consequences.
- **Mission report/save:** the closeout record and recoverable player-owned mission progress.

## Success criteria

- **SC-001:** 100% of the 14 inventory groups above are either implemented with passing acceptance evidence or explicitly marked incomplete/deferred in the delivery report; none is silently omitted.
- **SC-002:** A first-time player can start the tutorial, reach its terminal state or skip path, and enter normal play without a blocking navigation dead end.
- **SC-003:** A complete supported mission can be played from mission creation through closeout, with each required review, design check, test, launch, and operational outcome observable.
- **SC-004:** All six legacy test classes are represented in the qualification flow and a mission cannot receive readiness approval while a required current test is missing or failing.
- **SC-005:** A saved mission can be recovered in a separate supported browser/session under the same player account; a different account cannot read or change it.
- **SC-006:** Legacy save import performs zero writes before affirmative consent and preserves the original save when declined.
- **SC-007:** The first rendered menu shows lunar terrain and the player can complete essential navigation/action flows on both representative desktop and mobile devices.
- **SC-008:** All core journeys in Italian and English pass their end-to-end scenarios, including validation and failure feedback.
- **SC-009:** The in-scope navigation, menus, dialogs, and essential gameplay controls pass the WCAG 2.2 AA checks planned for the project; no critical keyboard/focus or contrast blocker remains.
- **SC-010:** Mission outcome reports identify success/failure causes and agree with the recorded decisions, test results, and resource state.

## Assumptions and open validation notes

- The canonical clarification applies defaults for unquantified service levels (“match current production baseline; no regression”), but no numerical production baseline was provided; this product inventory therefore defines observable user outcomes without inventing latency or concurrency targets.
- The legacy source and both READMEs were the available behavior evidence; no separate legacy test suite was found. New end-to-end coverage must be established against the journeys above.
- “Full mobile support” is interpreted as completing essential game flows with touch on representative current iOS/Android browsers and mobile GPUs; exact device/version matrix is for the test strategy to select.
- The legacy game includes ranking-related and what-if/report actions in some paths. Their exact availability conditions should be verified while implementing; any omitted path must be reported as incomplete rather than assumed nonexistent.
- Public deployment is not part of acceptance; the user explicitly requires a reproducible local workflow and deployment-ready configuration without real provider credentials.

## Upstream artifacts consumed

- `.github/modernize/rearchitecture/clarification.md` — canonical approved scope, frontend/accessibility/device/language choices, backend identity/persistence decisions, and success definition.
- `.github/modernize/rearchitecture/clarification-answers.md` — submitted answers confirming the selected target and consent-based import.
- `.github/modernize/rearchitecture/board.md` — phase/task context; read-only.
- `.github/modernize/rearchitecture/artifacts/project-profile.yaml` — repository profile identifying the legacy HTML as authoritative and the rewrite as in-place.
- `Go-No-Go.html`, `README.md`, `README.it.md` — legacy behavior and challenge context used to ground the inventory.

## Evidence mapping

- `clarification.md#Frontend` and `clarification-answers.md#Frontend` → REQ-001, REQ-002, REQ-017, REQ-021, REQ-022, REQ-023.
- `clarification.md#Backend` and `clarification-answers.md#Backend` → REQ-018, REQ-019, REQ-020.
- `clarification.md#Generic` and `clarification-answers.md#Generic` → REQ-007, REQ-016, SC-001 through SC-010.
- `Go-No-Go.html` mission state/flow (`newMission`, `startTutorial`, `coachStep`, phase names) → INV-01, INV-02, INV-05; REQ-003, REQ-007.
- `Go-No-Go.html` campus/activity renderers (`vHub`, `vAdmin`, `vPartners`, `vMeeting`, `vBuild`, `vFD`, `vTest`, `vPad`, `vLaunch`, `vMcc`, `vFac`) → INV-03 through INV-10; REQ-005 through REQ-015.
- `Go-No-Go.html` `L.TESTS`, `reportHTML`, `missionFacts`, `whatif`, `rankModal`, `save`, `load`, `reset`, `I18N` → INV-09 through INV-12; REQ-014, REQ-016 through REQ-018.
- `project-profile.yaml#assessment` and the user-approved in-place rewrite request → REQ-002, REQ-019 through REQ-024.

## Test results

- Command: none (product-inventory task; no code was changed).
- Passed: not applicable.
- Failed: not applicable.
- Skipped: implementation/runtime tests belong to the tester/validation tasks; no existing test files or declared test command were discovered.
