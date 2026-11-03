# Independent MySQL and browser validation gates

For browser applications backed by MySQL, infrastructure and browser validation are independent capabilities and must have separate evidence and fallbacks.

## What Happened
During Space-Mission-Design-Game task t6, Docker CLI existed but its daemon could not connect, while Node.js was available and Playwright had not yet been added. The strategy therefore kept Playwright as a required tier, attempted/required real MySQL separately, and treated SQLite or mobile emulation only as limited evidence rather than equivalent release proof.

## Takeaway
Run the app's API/browser E2E tests against live services and the real target DB when available. Docker failure does not justify skipping Playwright; Playwright setup failure does not justify replacing MySQL integration. Record exact per-axis failures and keep full-parity status blocked while required target capabilities remain unverified. Use deterministic user/mission fixtures and attach desktop/mobile screenshots for human review of rendered 3D content.

## History
- 2026-11-03 (Space-Mission-Design-Game/t6): initial
