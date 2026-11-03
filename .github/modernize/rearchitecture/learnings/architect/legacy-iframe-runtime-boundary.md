# Legacy Iframe Runtime Boundary

When a modern browser shell wraps a standalone legacy game in an iframe, the shell's save-button state and the game’s actual persistence loader may be separate consumers of the same localStorage key.

## What Happened
In Space-Mission-Design-Game task t2, the PlayCanvas shell checked only whether `gng32.save` existed, while the legacy application parsed the value and required `v === 32`. The iframe route was also independently served in development and copied into the production bundle by Vite configuration.

## Takeaway
When replacing an iframe integration, trace all three boundaries: iframe route/build wiring, shared browser storage, and any shell-side affordances that imply the legacy page is loadable. Treat the old document as a behavior/data reference if the user wants it preserved, but remove its active serving/copying path from the new runtime. Test malformed, unsupported-version, consent-declined, and repeated-import cases without deleting the original key.

## History
- 2026-11-03 (Space-Mission-Design-Game/t2): initial
