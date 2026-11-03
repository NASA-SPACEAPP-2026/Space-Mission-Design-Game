## [t6] Defined runtime and end-to-end test strategy
- Codebase/domain discoveries: t1 enumerates 14 required behavior groups; t2 confirms no test framework/root test script and currently no MySQL or auth runtime; t2.1 treats all five HIGH gaps as required exit gates.
- Wrong assumptions and corrections: Docker CLI presence did not mean the daemon was usable; `docker info` failed because the Docker Desktop Linux-engine named pipe was absent. Playwright is not currently installed, but this is not evidence that its required browser tier can be dropped.
- Debugging dead-ends and what actually worked: `Get-Date -AsUTC` is unavailable in this PowerShell version; `[DateTime]::UtcNow.ToString('o')` captured UTC. The expected `context.md` and prior teamlead log were absent, while the required upstream artifacts were present.
- Techniques/patterns worth reusing for future tasks: keep MySQL integration and Playwright as independent capabilities; make the browser suite use live API/DB; map each INV group to runtime evidence and block parity claims for unfinished flows.
- Learnings consumed: []
