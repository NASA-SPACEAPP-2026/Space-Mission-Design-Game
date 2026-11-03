# Vertical-slice traceability for brownfield plans

For broad brownfield rewrites, keep tasks feature-oriented while mapping every requirement, legacy behavior, and prerequisite into separate checkpoints.

## What Happened
During Space-Mission-Design-Game task t7, 24 requirements covered 14 legacy behavior groups and cross-cutting approvals. The architecture, DB, UX, and validation designs were ready, but no project-topology/fanout artifact existed. Planning therefore used user-story/feature slices, explicitly recorded setup dependencies and source anchors, and avoided inventing group labels or SLA targets.

## Takeaway
Use one plan item per bounded capability; each task owns the relevant UI/API/domain/persistence/tests instead of delegating by technical layer. Keep a requirement→plan checkpoint and a plan→task checkpoint, and model prerequisites independently from phase ordering. If a topology artifact is absent, do not fabricate module groups; disclose the missing topology and keep traceability based on approved story/feature boundaries.

## History
- 2026-11-03 (Space-Mission-Design-Game/t7): initial
