## [t5] Specified accessible 3D interaction and navigation
- Codebase/domain discoveries: PM inventory covers 14 behavior groups and asks that all existing mission activities remain discoverable; first-person space must complement, not replace, semantic activity workflows.
- Wrong assumptions and corrections: the visual 3D scene cannot be the only route to actionable content; WCAG and mobile support require semantic DOM alternatives to pointer lock, spatial aiming, and touch gestures.
- Debugging dead-ends and what actually worked: context.md and role log did not exist in this run's BASE_PATH; used the board, canonical clarification, submitted answers, PM artifact, and architect notes in the UX inbox instead.
- Techniques/patterns worth reusing for future tasks: define shared activity entry paths (world + labeled HTML map), explicit route returns, focus restoration, and confirmation/save states together so navigation and mission continuity stay testable.
- Learnings consumed: [(none)]
