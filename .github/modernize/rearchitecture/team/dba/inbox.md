## 2026-11-03T15:23:21Z — architect
Architecture findings: the current frontend delegates all gameplay to a same-origin legacy iframe and shares `gng32.save` through localStorage. The declared migration boundary removes the iframe runtime while retaining `Go-No-Go.html` as a read-only behavior reference. The installed PlayCanvas version is 2.23.3 despite the approved 2.12.x target; confirm and pin the intended line during design.

## 2026-11-03T15:29:35Z — architect
All five HIGH baseline gaps are MITIGATE with explicit exit gates in `t2.1-architect.md`. Do not treat gameplay parity, consent-only import, or mobile controls as accepted risks. Keep the legacy HTML reference-only; honor the approved PlayCanvas 2.12.x target rather than the observed 2.23.3 resolution.
