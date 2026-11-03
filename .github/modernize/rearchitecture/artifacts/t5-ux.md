# t5 — Accessible Desktop/Mobile 3D Interaction and Navigation Specification

## Purpose and design authority

This is the implementation-facing interaction and information-architecture contract for the PlayCanvas first-person Go-No-Go experience. It defines what players can do, how they navigate, and how the experience remains usable without relying on 3D vision, pointer lock, color, or touch gestures. It does not prescribe component code or a specific UI library implementation.

The approved experience is a first-person astronaut on a visible lunar campus, with Tailwind-based accessible DOM controls layered over the PlayCanvas scene. The 3D scene is the immersive context, not the only place where mission state, navigation, decisions, or feedback are available. Gameplay remains native to the new client; the legacy page is a behavior reference, not an embedded game.

## Product and interaction principles

1. **Every activity has two entrances:** an in-world doorway/interaction point and an equivalent labeled HTML activity list or map. Neither precise aiming nor walking a long distance is required to start or complete an activity.
2. **Every location has a visible exit:** provide an always-available “Campus / Mission” home action and browser Back behavior. Returning from a station never discards unconfirmed work.
3. **GO is explicit and earned:** show current phase, review state, blockers, and next permitted action in text. Never imply that an unimplemented activity, failed review, or unsaved decision is complete.
4. **Use the right surface:** spatial movement and environmental presence belong in the 3D scene; forms, requirements, engineering checks, event choices, reports, account actions, and confirmations belong in semantic HTML panels.
5. **Equivalent input, equivalent outcome:** keyboard, mouse, touch, and assistive-technology paths must reach the same actions and mission outcomes.
6. **Protect continuity:** show whether changes are local/in-progress, saving, saved, or conflicted. Never clear or replace the legacy `gng32.save` during startup or after a declined import.
7. **Italian and English are complete interface modes:** the active locale applies to navigation, controls, prompts, validation, confirmations, errors, tutorial, and mission state descriptions.

## Information architecture and routes

| Route | Purpose | Primary content and actions | Return path |
|---|---|---|---|
| `/` | Menu / campus entry | NASA-like title and agency summary; visible lunar ground in the initial scene; Continue, New Agency, Tutorial, Profile/Sign In, Language, Settings and Help. A fresh player can start Tutorial or New Agency without first understanding the 3D controls. | Route is the safe home. |
| `/profile` | Account and player profile | Register/sign in/sign out; player identity; agency/progression summary; active and completed mission list; resume mission; language/accessibility settings; legacy-save import/recovery; explicit reset/restart controls. Never show another account’s mission data. | “Return to Menu”; each mission row opens its mission route. |
| `/missions` | Mission collection / selection | Active, completed, and available mission cards; create/name mission; objective/context; capacity/limit feedback; resume or inspect a mission. Empty, loading, offline, and error states each have a next action. | “Profile” and “Menu”. |
| `/missions/:missionId` | Active mission and closeout | Full-screen first-person lunar/campus context with the mission HUD; activity map/list; current lifecycle phase, requirements, resource status, activity panel, reviews, launch/operations, and closeout report. Deep links must resolve to this player’s mission only. | Persistent “Missions” and “Menu/Profile” controls; if unauthenticated/unauthorized, route to sign-in with a safe return path or show a useful not-found state. |

Use browser history for navigation between these routes. Browser Back must not silently erase a form or pending decision: if leaving would lose an uncommitted change, show a localized confirmation with Stay / Discard and identify the affected change. Do not trap players in a mission route. Do not encode secrets or session credentials in URLs. Refreshing a mission route restores the last confirmed server state; it must not present an unconfirmed local edit as saved.

Within `/missions/:missionId`, stations are mission activity views/panels rather than new top-level route families. Each has a stable heading, activity name, phase and explicit close/return action. The route remains the same while opening an activity, so refreshing/back-navigation returns to the mission context. A selected mission is always named in the page title and accessible heading.

### Campus activity map

The activity map and the in-world campus must expose equivalent, phase-aware entries. Each entry has a plain-language name, one-line purpose, current state, and action.

| Activity / station | Destination flow |
|---|---|
| Agency / administration | Funding, staff, capacity, progression and agency decisions |
| Stakeholders / mission meeting | Participant selection and accept, decline, qualify or waive each requirement |
| Spacecraft selection and design lab | Class/size selection; add, place, rotate or remove components; inspect fit, mass, power, energy, pointing, budget and requirement checks |
| Flight dynamics / mission planning | Destination, orbit, launcher, trajectory, maneuvers and delta-v feasibility |
| Assembly / clean room | Approved design assembly and observable progress |
| Test lab | Functional, vibration, thermal-vacuum, shock, EMC and mass tests; failure, repair and rerun loop |
| Launch pad | Launch option and readiness review; countdown and explicit Launch confirmation |
| Mission control | In-flight status, events/anomalies, response choices, communications, power, data and duration |
| Mission closeout / report | Outcome, evidence, science/resources/financial summary, causes; available compare/what-if and roadmap/ranking actions |
| Facilities / infrastructure | Available facility improvements and the cost/effect before purchase |

An unavailable activity remains discoverable in the map with its locked/blocked state and specific prerequisite. Do not hide a required activity, silently teleport the astronaut, or mark it complete to simplify navigation.

## Screen and component hierarchy

### Shared application shell

- **Persistent top application bar:** route-level breadcrumb/title, mission/account context, language control, Help/Controls, and profile/menu navigation. Show a text save state (“Saved”, “Saving…”, “Offline — changes not confirmed”, or “Conflict—review required”) with an icon/label; never use color alone.
- **Scene region:** responsive PlayCanvas world, with stable lunar horizon/ground in the menu and campus routes. The scene must never be the only carrier of actionable content.
- **Mission HUD (mission route only):** mission name and phase; GO/NO-GO/review state in text; a compact resource summary for values currently relevant to decisions; control hints; and an “Activities / Campus map” action. Each value has a readable label and unit.
- **DOM activity panel:** contextual forms, selectable cards, requirement/engineering results and event choices. Give it a heading and predictable focus order. Do not render text as an inaccessible texture in the scene.
- **Feedback area:** inline field errors next to fields, a persistent textual status/summary for asynchronous operations, and a polite live region for non-blocking updates. Use an assertive announcement only for a blocking error that needs immediate attention.

### Desktop layout

- At wide desktop widths, keep the 3D scene as the main background and place the mission activity/map navigation in a left rail or drawer with readable labels; the active workflow opens in a right-side DOM panel. Keep mission phase and save status visible without covering the central view.
- At intermediate widths, collapse the rail into a labeled “Activities” button and use a side panel. Never shrink controls below legible text size to preserve more scenery.
- A modal/dialog is reserved for confirmation, destructive actions, account gates, and decisions that need a clear choice; routine station navigation is a panel, not a nested modal.

### Mobile layout

- Support portrait and landscape layouts using viewport-safe sizing (including safe-area insets). The scene may crop/reframe, but the mission name, current phase, primary action, save state, and a way to open the activity map remain available.
- Place movement controls in the lower-left and look control in a separate right-side region; provide a distinct, labeled Interact action. Do not place an essential button underneath a joystick or browser gesture area.
- Use a labeled bottom sheet for mission/activity content. The collapsed state shows its title and current state; expansion reveals the full workflow. It must scroll independently, expose its close/return action, and not force the player to drag when an explicit “Open details” button is available.
- Use a compact bottom navigation for high-frequency destinations (Activities, Mission status, Menu/Profile as appropriate); avoid more than five unlabelled icons. Keep destructive and account actions in their explicit panels, not beside the movement joystick.
- Controls and touch targets SHOULD be at least 44 × 44 CSS pixels (and never below WCAG 2.2 AA’s applicable minimum target-size/spacing requirement). Provide generous spacing for controls operated while moving.
- Resizing, rotation, interrupted touch, backgrounding, or browser chrome changes must not reset mission progress or close an active form without warning.

## First-person movement and interaction contract

### Desktop and keyboard/mouse

| Action | Default input | Equivalent accessible action |
|---|---|---|
| Move | `W`/`A`/`S`/`D` | Arrow-key movement; on-screen directional control; activity map fast travel |
| Look | Mouse movement after explicit “Enter first-person” activation | Focusable look controls (arrow keys while the scene has focus) and labeled viewpoint controls; do not make camera movement a prerequisite for a mission decision |
| Interact | `E` when a nearby interactable is focused/targeted | Focus the named prompt and press `Enter`/`Space`, or activate the same action from the activity map |
| Open activities/help | Labeled HUD button; optional documented shortcut | Standard Tab order and Enter/Space activation |
| Pause / release pointer lock | `Escape` releases pointer lock and opens the pause/control panel | Labeled Pause button; keyboard focus returns to the panel, not the canvas |

Pointer lock is never requested on page load. Ask only after the player selects “Enter first-person” or another explicit user gesture; explain how to exit first. If pointer lock is denied or exited, do not disable play: restore visible look controls and the HTML activity list. Do not capture browser focus or override standard text-entry shortcuts. Game shortcuts are disabled while focus is in an input, textarea, editable element, or dialog control.

The canvas may receive keyboard focus but is not a keyboard trap. Show a visible focus ring and a concise instruction for available movement/look actions. A keyboard-only player must be able to choose any station from a semantic list, perform all forms/reviews/tests/launch/events/report actions, and return home without needing to aim at a 3D object.

### Mobile touch

- Offer an explicit “Touch controls” help affordance and provide a first-run optional brief coachmark (Dismiss / Learn controls). Do not require completion to enter the game.
- The left virtual stick moves the astronaut; a right-side drag region changes view direction. A separate labeled Interact button activates a focused nearby object. Show movement and look controls only while they are usable; the HTML activity map remains a complete alternative.
- Support tap-to-select and explicit confirm actions for mission-critical decisions. Do not require pinch, multi-finger gestures, tilt, timed taps, or drag precision for a required action.
- If touch input is interrupted, keep the last confirmed mission data and restore the HUD/control layer. If the device does not offer a usable WebGL/GPU path, show a localized recovery/fallback screen with Retry, Activities/mission access where available, and a statement that the 3D scene could not start—never a black blank page.
- Provide quality choices when performance is constrained (e.g. low/standard/high visuals); preserve interaction and text first. Reduced visual quality must not remove essential mission state or actions.

### Shared interaction behavior

- First-person movement is for spatial immersion and optional discovery, not a timed test. No core choice depends on reaching a coordinate before a timer expires.
- Interact prompts name the target and action, e.g. “Open Test Lab”; they are not icon-only and do not rely on proximity color.
- On opening a station, identify it with a heading and show why it is available or blocked. On close/return, restore the previous scene context and focus to the control that opened it.
- If a phase change invalidates prior work (e.g. spacecraft edit invalidates affected tests), display the affected approvals/tests and consequences before confirmation.
- Confirm launch, reset/restart, phase rollback/rework, discard, and other destructive or consequential actions with a summary of effect and a safe cancel. Ordinary navigation never requires confirmation.

## Core player journeys

1. **First visit:** `/` renders the menu over visible lunar terrain → choose Italian or English → start tutorial, skip explicitly, or create a new agency → show movement/help coaching → arrive at the mission campus. Tutorial has a visible Skip and a resumable/complete outcome; it must not strand the player.
2. **Mission creation and requirements:** open Missions → create/name a mission and choose context → choose participants (including mandatory NASA) → make a visible decision for each requirement → review consequences and proceed only when permitted.
3. **Design through launch readiness:** campus/map → select spacecraft → configure/inspect constraints → choose destination/orbit/launcher and maneuvers → assembly → six-class test lab → repair/rerun as needed → readiness review. Every failed check identifies the specific constraint/affected requirement and a non-destructive next action; GO is blocked until required checks are current and passing.
4. **Launch and closeout:** launch-pad readiness summary → explicit Launch → countdown completes before in-flight state → mission-control event with response options and resource consequences → closeout/report with actual outcome and reasons → return to Missions/Profile or resume an active mission.
5. **Profile and continuity:** open `/profile` → authenticate or register → view only the player’s own progress → resume an owned mission on another session → offer legacy import only when a legacy save is detected and before any import write → decline leaves the original intact; consent has a clear result and retry route.
6. **Accessibility alternative:** keyboard-only or screen-reader user reaches the same route and activity list, opens each labeled workflow, completes it without pointer lock/spatial aiming, hears status updates, and returns to a safe route.
7. **Mobile mission:** start on supported mobile browser → use touch movement/look or activity-map selection → open bottom-sheet workflow → complete a consequential decision using labeled tap/confirm controls → rotate/resize or resume from background → verify no confirmed progress was lost.

## Accessibility and inclusive interaction requirements (WCAG 2.2 AA)

- **Semantic DOM first:** menus, links, forms, cards, buttons, dialogs, status, and mission decisions use native or equivalent semantic controls with accessible names and programmatic relationships. The 3D canvas has a concise accessible label, while every actionable world object has a named DOM equivalent.
- **Keyboard:** every function works without a pointer; focus order follows visual/reading order; focus is visible, not obscured by sticky HUD/panels, and never trapped in the scene. Dialogs move focus to their heading/first meaningful control, keep focus contained only while truly modal, close by Escape where safe, and restore focus to the opener.
- **Screen readers:** use headings/landmarks for routes and activities, labels/help text for form fields, and associate errors with affected fields. Announce route/activity title and phase changes once; announce async save/test/review outcomes with an appropriate polite status. Do not continuously announce movement, frame-rate changes, or animated resource ticks.
- **Contrast and status:** meet WCAG AA text and non-text contrast thresholds (4.5:1 normal text; 3:1 large text and relevant controls/graphics). GO, NO-GO, pass, fail, warning and offline states include words/icons/patterns, not color alone. Verify every localized theme state against its actual background.
- **Text and zoom:** support browser zoom/reflow and text enlargement without clipped controls, lost action labels, or horizontal scrolling for ordinary workflows. Keep body/control text comfortably readable; avoid embedding labels in images/3D textures.
- **Input/timing:** no keyboard trap or required path that depends on a timed response, precise drag, motion, or concurrent multi-key use. Provide alternatives to drag for component placement/rotation (select component, then labeled move/rotate controls). Users can pause or extend non-critical tutorial/animation timing.
- **Motion and vestibular comfort:** respect `prefers-reduced-motion`; offer reduced camera bob, shake, transitions, and motion blur; do not force camera cuts or autoplay spin. Scene movement must not communicate essential status without a text equivalent. Avoid flashing content above accessibility limits.
- **Touch and target size:** large, separated controls; do not rely on hover; provide tap equivalents for hover prompts. Support device orientation/resize and do not interpret a single tap as both movement and destructive confirmation.
- **Errors and recovery:** put a concise, localized error summary at the workflow start and explain the corrective action. Preserve valid field values and confirmed progress on validation/network failures; provide retry and safe exit. Do not report a save as successful until confirmed.
- **Language:** locale switch is keyboard/touch accessible and labeled by language name (Italiano / English). Changing locale does not discard forms or mission state. Avoid untranslated fallback strings in errors, empty/loading states, and accessibility labels.

## Visual and content direction

Use a restrained NASA-like mission-operations visual language: deep-space navy/charcoal surfaces, lunar-neutral backgrounds, crisp high-contrast text, a limited cyan/blue action accent, and semantic warning/success/error treatments. This is a new design system, not an imitation of a legacy layout or an assumption of NASA endorsement. Keep game-like atmosphere in the environment and typography, but prioritize clear status, hierarchy, and readable controls over decorative HUD clutter.

Use plain action verbs (“Open”, “Review”, “Run test”, “Launch”, “Return”) and explain domain terms at their first use. Present units with resource figures. Distinguish recorded mission facts from what-if simulations and comparisons. A confirmation names the action and its consequences; a negative answer is equally visible and safe.

## State, localization, and failure feedback

- Keep transient focus, open panel and camera mode in the client. Mission phase, confirmed decisions, save state, account/profile ownership and mission results are presented from server-confirmed state.
- On save in progress, show “Saving…”; on confirmed success, show “Saved” and a time/recency indicator where useful. On disconnect/timeout, mark the operation unconfirmed and offer retry; do not create a duplicate on retry or claim another client’s newer state is saved.
- For concurrent/stale updates, explain that a newer mission revision exists and offer reload/review or another explicit conflict path; never silently overwrite.
- For invalid route/expired session/unauthorized mission, show a localized explanation and safe action (“Sign in”, “Return to Missions”, “Return to Menu”) without exposing whether another player owns a mission.
- For unsupported/corrupt legacy data, preserve it and offer only explicit recovery choices. Import is opt-in; decline leaves the original browser save unchanged.
- Initial, loading, empty, offline, blocked, failed, and successful states all have text and a next step in Italian and English.

## Design acceptance checklist

- [ ] Fresh `/` first paint includes conspicuous lunar ground beneath the menu; no black-void-only start state.
- [ ] All campus and mission activities listed above are reachable through both world interaction and the labeled activity map/list; every route/activity has a return path.
- [ ] Desktop keyboard/mouse flow works with pointer lock declined and with keyboard-only interaction; Escape exits first-person mode without losing context.
- [ ] Mobile portrait and landscape flows expose usable movement/look controls and the same activity list/forms; essential actions do not rely on gestures or hover.
- [ ] Tutorial can be started, skipped, completed and exited without a navigation dead end.
- [ ] Phase, requirements, relevant resources, review blockers, operation outcomes and save state have readable textual representations; GO/NO-GO and errors are not color-only.
- [ ] Every review/test/launch/event/report workflow is usable from semantic HTML controls and can be completed without aiming at 3D objects.
- [ ] Activity selection returns focus to its opener; route changes, dialogs, errors and async results have defined focus/announcement behavior.
- [ ] WCAG 2.2 AA contrast, reflow, focus, keyboard, labels, target size, status announcements and reduced-motion behavior are verified for English and Italian.
- [ ] Scene startup/GPU/touch interruption failures have localized recovery; refresh, route navigation, network failure and import decline do not falsely discard or confirm mission data.
- [ ] UI distinguishes incomplete/locked/failed work from completed work, and all 14 PM inventory groups remain visible in navigation or workflow outcomes.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/artifacts/t1-pm.md` — inventory groups, user stories, REQ-001 through REQ-023, mobile/accessibility edge cases and success criteria.
- `.github/modernize/rearchitecture/clarification.md` — approved first-person PlayCanvas 2.12.x + TypeScript direction, WCAG 2.2 AA, desktop/mobile touch, Italian/English and dedicated menu/profile/missions routes.
- `.github/modernize/rearchitecture/clarification-answers.md` — submitted user answers confirming the frontend and experience choices.
- `.github/modernize/rearchitecture/board.md` — task dependencies and read-only workflow status.
- `.github/modernize/rearchitecture/team/ux/inbox.md` and `decisions.md` — architecture note that `Go-No-Go.html` is a read-only behavior reference and must not remain an iframe gameplay runtime.

## Evidence Mapping

- `t1-pm.md#REQ-001` and `#REQ-002` → Initial-menu scene, first-person movement, explicit interaction model, fallback and menu acceptance checks.
- `t1-pm.md#REQ-005` and `#INV-03` → Campus activity map, two entrances per activity, locked prerequisites and safe return paths.
- `t1-pm.md#REQ-006` through `#REQ-016` and `#INV-04` through `#INV-11` → Activity map and core journeys for requirements, phases, design, orbit, assembly, qualification, launch, operations and report.
- `t1-pm.md#REQ-017` through `#REQ-020` and `#INV-12`/`#INV-13` → Locale behavior, profile route, save-state feedback, explicit import, recovery and account journey.
- `t1-pm.md#REQ-021` → Desktop keyboard/mouse and mobile touch control contracts plus resize/GPU failure handling.
- `t1-pm.md#REQ-022` → WCAG 2.2 AA interaction, contrast, status, semantic DOM, focus, screen-reader, motion and target-size rules.
- `t1-pm.md#REQ-023` → Route table, deep-link behavior and safe return navigation.
- `clarification.md#Frontend` and `clarification-answers.md#F1–F10` → Immutable platform, visual direction, accessibility, device, locale, state and route decisions.
- `decisions.md#architect-t2` and `team/ux/inbox.md#architect-t2` → Native 3D gameplay with no final legacy iframe.

## Verification

- Review method: checked each route, station, control mode, failure state and checklist item against the upstream product requirements.
- Code/build/browser tests: not run; this is a documentation-only UX specification and changes no application code.
- Implementation handoff: frontend should use the checklist and control/route tables as acceptance criteria; tester should select representative flows and desktop/mobile assistive-input coverage for the E2E strategy.
