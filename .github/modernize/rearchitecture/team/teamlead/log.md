## [t6] Defined runtime and end-to-end test strategy
- Codebase/domain discoveries: t1 enumerates 14 required behavior groups; t2 confirms no test framework/root test script and currently no MySQL or auth runtime; t2.1 treats all five HIGH gaps as required exit gates.
- Wrong assumptions and corrections: Docker CLI presence did not mean the daemon was usable; `docker info` failed because the Docker Desktop Linux-engine named pipe was absent. Playwright is not currently installed, but this is not evidence that its required browser tier can be dropped.
- Debugging dead-ends and what actually worked: `Get-Date -AsUTC` is unavailable in this PowerShell version; `[DateTime]::UtcNow.ToString('o')` captured UTC. The expected `context.md` and prior teamlead log were absent, while the required upstream artifacts were present.
- Techniques/patterns worth reusing for future tasks: keep MySQL integration and Playwright as independent capabilities; make the browser suite use live API/DB; map each INV group to runtime evidence and block parity claims for unfinished flows.
- Learnings consumed: []

## [t7] Created traceable in-place implementation plan
- Codebase/domain discoveries: t1 provides 24 functional requirements across 14 behavior groups and behavior source anchors; t3/t4/t5/t6 provide sufficient runtime, persistence, UX, and test contracts. The supplied topology/fanout and standalone constitution/context files were absent.
- Wrong assumptions and corrections: do not infer G-group labels or a numeric SLA target when topology/baseline is missing; the user's approved decisions and upstream artifacts suffice for this plan without inventing those facts.
- Debugging dead-ends and what actually worked: the markdown viewer truncated long upstream documents; read smaller ranges and validate the resulting checkpoint YAML with the installed `js-yaml` parser plus deterministic coverage counts.
- Techniques/patterns worth reusing for future tasks: organize code work by independently executable feature slice, keep shared setup separate, preserve source anchors, map every `REQ-XXX` to plan items and tasks, and carry MySQL/browser/mobile capability gaps as separate evidence gates.
- Learnings consumed: [teamlead/independent-mysql-playwright-gates]

## [t8] Quality-gated the implementation plan
- Codebase/domain discoveries: the t7 plan has 13 plan items and 13 sequential task mappings; all 24 requirement rows connect to tasks through the two traceability checkpoints. The user-approved NASA-like visual direction is detailed in t5 but not stated as a T003 acceptance criterion.
- Wrong assumptions and corrections: the formal plan-to-tasks gate passes; the design-system omission is a MEDIUM handoff clarification, not a blocking traceability failure.
- Debugging dead-ends and what actually worked: `Get-Date -AsUTC` is unsupported in this shell; `[DateTime]::UtcNow` works. Parsing both checkpoints and cross-checking plan/task references with `js-yaml` gave deterministic coverage evidence.
- Techniques/patterns worth reusing for future tasks: preserve producer checkpoints and write task-specific gate evidence; evaluate task-level explicitness separately from cross-artifact traceability.
- Learnings consumed: [teamlead/independent-mysql-playwright-gates, teamlead/vertical-slice-traceability]

## [t8.1] Added design-system and visual acceptance to T003
- Codebase/domain discoveries: t5 defines the approved visual direction and design checklist; t6 already requires desktop/mobile screenshots of the first visit for human review, so T003 can use that evidence without changing the validation stack.
- Wrong assumptions and corrections: the initial index patch did not match the existing evidence-map wording; querying the exact line and applying a narrower patch preserved surrounding content. The expected `context.md` is absent, but the approved decision and design artifacts were available.
- Debugging dead-ends and what actually worked: `js-yaml` successfully parsed both existing traceability checkpoints after the task edit; focused assertions verified the new acceptance text and unchanged traceability.
- Techniques/patterns worth reusing for future tasks: carry approved visual language into the exact implementation task with measurable viewport, contrast, locale, and visible-ground checks; keep the traceability index aligned with the detailed plan.
- Learnings consumed: [teamlead/independent-mysql-playwright-gates, teamlead/vertical-slice-traceability, ux/accessible-first-person-navigation]
