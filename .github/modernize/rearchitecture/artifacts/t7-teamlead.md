# t7 — Traceable Implementation Plan and Task Breakdown

## Summary

This index links the implementation blueprint and its two traceability checkpoints. The plan decomposes the approved in-place rearchitecture into 13 independently executable tasks, ordered by actual prerequisites and organized around end-to-end product capabilities rather than technical layers.

## Deliverables

- [t7-teamlead-plan.md](./t7-teamlead-plan.md) — technical plan, feature-sized tasks, runtime/testing strategy, requirement mapping, operational assumptions.
- [checkpoints/t7-spec-to-plan.yaml](./checkpoints/t7-spec-to-plan.yaml) — all 24 `REQ-XXX` requirements mapped to implementation plan items.
- [checkpoints/t7-plan-to-tasks.yaml](./checkpoints/t7-plan-to-tasks.yaml) — every plan item mapped to task(s), with execution dependencies.

## Coverage

- Requirements mapped: **24/24**
- Plan items covered by tasks: **13/13**
- Tasks generated: **13**
- Missing plan or requirement mappings: **0**

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/artifacts/t1-pm.md` — authoritative 14-group legacy behavior inventory, 24 functional requirements, user stories, source anchors.
- `.github/modernize/rearchitecture/artifacts/t3-architect.md` — runtime boundaries, API/DTO/DAO contracts, transaction/security rules, exact PlayCanvas pin, architecture risks.
- `.github/modernize/rearchitecture/artifacts/t4-dba.md` — MySQL schema, migrations, ownership/revision constraints, v32 field mapping and consent/import invariants.
- `.github/modernize/rearchitecture/artifacts/t5-ux.md` — routes, activity-map parity, desktop/touch input, WCAG 2.2 AA, bilingual interaction contracts, NASA-like visual direction and design acceptance.
- `.github/modernize/rearchitecture/artifacts/t6-teamlead.md` — binding integration, browser, MySQL, accessibility, localization, and mobile validation strategy.
- `.github/modernize/rearchitecture/clarification-answers.md` — submitted user answers for target technologies, scope, platforms, accessibility, persistence, languages, and deployment limits.
- `.github/modernize/rearchitecture/clarification.md` — canonical approved scope and unresolved SLA assumption.
- `.github/modernize/rearchitecture/decisions.md` — approved architectural decisions and mandatory treatment of baseline gaps.
- `.github/modernize/rearchitecture/artifacts/project-structure.md` and `tech-stack.md` — current package layout, entry points, dependency and verification gaps.

## Evidence Mapping

- `t1-pm.md#Functional requirements` (`REQ-001`…`REQ-024`) → [Requirement Mapping](./t7-teamlead-plan.md#requirement-mapping) and `t7-spec-to-plan.yaml`.
- `t3-architect.md#Runtime and module boundaries`, `#API conventions`, `#HTTP API contract`, `#Operational and migration decisions` → plan technical context, DAO/DTO/authority rules, package pin and plan items 1.1–9.2.
- `t4-dba.md#Data Model`, `#Legacy v32 Field Mapping`, `#Consent-Gated Import Contract`, `#Migration and Operational Notes` → plan items 1.2, 3.1, 8.1, 9.1; isolated MySQL/consent tests.
- `t5-ux.md#Information architecture and routes`, `#Campus activity map`, `#First-person movement and interaction contract`, `#Accessibility and inclusive interaction requirements`, `#Visual and content direction`, `#Design acceptance checklist` → plan item 2.1 and T003's browser/mobile/WCAG and visual-system acceptance criteria.
- `t6-teamlead.md#Critical user journeys and acceptance`, `#Fallback matrix`, `#Infrastructure scaffold and module test skeletons`, `#PASS criteria and evidence contract` → plan Testing Strategy and plan item 9.1.
- `.github/modernize/rearchitecture/clarification-answers.md#Frontend`, `#Backend`, `#Generic` → immutable implementation constraints repeated in plan items and Constitution Check.
- `project-structure.md#Entry points and routing` and `tech-stack.md#Packages` → exact existing file seams referenced in the task breakdown.

## Notes

- The declared `context.md`, `constitution.md`, `project-topology.md`, and any `*-fanout.md` were not present in the rearchitecture tree/artifacts. The approved decisions, clarification answers, and upstream design artifacts are used as explicit planning constraints; no G-group labels are invented.
- No applicable migration guideline was found: the available Struts-to-Spring guide does not match this PlayCanvas/Express rewrite.
- The numeric production SLA has no measured baseline. Do not claim a numeric no-regression result until operations supplies one.
- This task changes planning artifacts only; it does not edit app source, run a build, deploy, commit, or push.
