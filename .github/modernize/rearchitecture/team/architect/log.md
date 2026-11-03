## [t2] Current architecture and migration boundary analysis
- Codebase/domain discoveries: three workspace manifests; two active packages; current shell delegates all complete gameplay to a same-origin legacy iframe; save format is version-32 JSON shared through localStorage; backend is health-only.
- Wrong assumptions and corrections: the frontend creates a PlayCanvas TouchDevice, but the inspected movement/look behavior remains keyboard and pointer-lock/mouse only. A present save key does not prove a valid load because the shell checks presence while the legacy loader parses and checks v===32.
- Debugging dead-ends and what actually worked: Windows PowerShell 5 `ConvertFrom-Json` could not parse the complete lockfile package map due duplicate/case-insensitive package names; `npm ls --depth=0 --workspaces` provided installed workspace dependency versions directly.
- Techniques/patterns worth reusing: isolate each externally reachable page/API route as a unit; record localStorage as an explicit cross-unit contract; keep the legacy page as source evidence while separating it from final runtime scope.
- Learnings consumed: (none)

## [t2.1] HIGH baseline gaps triaged into implementation gates
- Codebase/domain discoveries: the five HIGH findings share a hard constraint: the approved 3D rewrite, consent-only save import, and mobile parity cannot be accepted as residual risks; each needs observable exit evidence.
- Wrong assumptions and corrections: constructing a PlayCanvas TouchDevice is not functional mobile control; presence of `gng32.save` is not proof of a parseable v32 save; a passing build is not gameplay parity.
- Debugging dead-ends and what actually worked: context.md and `.github/modernize/rearchitecture/decisions.md` were absent; the board supplied approved scope, while root `decisions.md` held the authoritative architect t2 decisions. An initial PowerShell heading-count check had an overly specific Unicode dash match and a string-interpolation parse error; broader regex and formatted-string checks verified all five sections and fields. Do not read clarification-questions.json; submitted clarification answers and canonical clarification were available.
- Techniques/patterns worth reusing: phrase migration-risk dispositions as required behaviors plus testable exit gates; keep residual uncertainties separate from decisions already fixed by the user.
- Learnings consumed: [architect/legacy-iframe-runtime-boundary]

## [t2] Revalidated current architecture, dependencies, and migration risks
- Codebase/domain discoveries: `npm ls --depth=0 --workspaces` confirms PlayCanvas 2.23.3 resolves from `^2.12.2`; the frontend has both Vite legacy-page serve and bundle-copy paths, and backend remains health-only. Root scripts still have no `npm run dev` or test script.
- Wrong assumptions and corrections: constructing `pc.TouchDevice` does not provide movement/look controls; the shell's `gng32.save` check is key-presence only while the legacy loader requires valid JSON with `v === 32`.
- Debugging dead-ends and what actually worked: scenario `context.md` and `.github/modernize/rearchitecture/decisions.md` are absent; root `decisions.md` carries the approved architect decisions. `Get-Date -AsUTC` is unsupported in this PowerShell version; `[DateTime]::UtcNow.ToString('o')` gives UTC. User-owned `board.md` and `project-profile.yaml` edits were left untouched.
- Techniques/patterns worth reusing: compare declared semver ranges with installed workspace resolution; check both development serving and production asset emission when auditing iframe/runtime boundaries; validate per-unit artifact counts and decomposition `commit: false`.
- Learnings consumed: [architect/legacy-iframe-runtime-boundary, architect/high-baseline-gap-dispositions]

## [t3] Designed target architecture and API contracts
- Codebase/domain discoveries: target design needs server-authoritative gameplay APIs for all 14 inventoried groups; browser local storage is reserved for unimported v32 source data and non-authoritative preferences.
- Wrong assumptions and corrections: the clarification mentions microservices, but this task's explicit direction to avoid needless distributed services plus transaction-coupled single-player mission rules supports one modular Express deployment with bounded internal domains.
- Debugging dead-ends and what actually worked: the task-scope `context.md` file is absent; the board, canonical clarification, submitted answers, decisions, and upstream artifacts supplied the controlling requirements. `npm view playcanvas@2.12 version --json` confirmed the published patch line ends at 2.12.4; official versioning docs explain why a caret range can escape the required minor.
- Techniques/patterns worth reusing: use ETag/If-Match for mission revision conflicts; pair idempotency keys with transactionally stored outcomes; detect the legacy storage key without reading its value, and only call `getItem` after affirmative consent.
- Learnings consumed: [architect/legacy-iframe-runtime-boundary, architect/high-baseline-gap-dispositions]
