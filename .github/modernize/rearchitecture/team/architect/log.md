## [t2] Current architecture and migration boundary analysis
- Codebase/domain discoveries: three workspace manifests; two active packages; current shell delegates all complete gameplay to a same-origin legacy iframe; save format is version-32 JSON shared through localStorage; backend is health-only.
- Wrong assumptions and corrections: the frontend creates a PlayCanvas TouchDevice, but the inspected movement/look behavior remains keyboard and pointer-lock/mouse only. A present save key does not prove a valid load because the shell checks presence while the legacy loader parses and checks v===32.
- Debugging dead-ends and what actually worked: Windows PowerShell 5 `ConvertFrom-Json` could not parse the complete lockfile package map due duplicate/case-insensitive package names; `npm ls --depth=0 --workspaces` provided installed workspace dependency versions directly.
- Techniques/patterns worth reusing: isolate each externally reachable page/API route as a unit; record localStorage as an explicit cross-unit contract; keep the legacy page as source evidence while separating it from final runtime scope.
- Learnings consumed: (none)

## [t2.1] HIGH baseline gaps triaged into implementation gates
- Codebase/domain discoveries: the five HIGH findings share a hard constraint: the approved 3D rewrite, consent-only save import, and mobile parity cannot be accepted as residual risks; each needs observable exit evidence.
- Wrong assumptions and corrections: constructing a PlayCanvas TouchDevice is not functional mobile control; presence of `gng32.save` is not proof of a parseable v32 save; a passing build is not gameplay parity.
- Debugging dead-ends and what actually worked: context.md and `.github/modernize/rearchitecture/decisions.md` were absent; the board supplied approved scope, while root `decisions.md` held the authoritative architect t2 decisions. Do not read clarification-questions.json; submitted clarification answers and canonical clarification were available.
- Techniques/patterns worth reusing: phrase migration-risk dispositions as required behaviors plus testable exit gates; keep residual uncertainties separate from decisions already fixed by the user.
- Learnings consumed: [architect/legacy-iframe-runtime-boundary]
