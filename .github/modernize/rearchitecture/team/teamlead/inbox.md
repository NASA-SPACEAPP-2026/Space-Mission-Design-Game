## 2026-11-03T15:23:21Z — architect
Architecture findings: the current frontend delegates all gameplay to a same-origin legacy iframe and shares `gng32.save` through localStorage. The declared migration boundary removes the iframe runtime while retaining `Go-No-Go.html` as a read-only behavior reference. The installed PlayCanvas version is 2.23.3 despite the approved 2.12.x target; confirm and pin the intended line during design.

## 2026-11-03T15:29:35Z — architect
All five HIGH baseline gaps are MITIGATE with explicit exit gates in `t2.1-architect.md`. Do not treat gameplay parity, consent-only import, or mobile controls as accepted risks. Keep the legacy HTML reference-only; honor the approved PlayCanvas 2.12.x target rather than the observed 2.23.3 resolution.

## 2026-11-03T15:35:43Z — architect
Architecture baseline revalidated: final gameplay must remove the iframe and its Vite serve/copy paths while retaining `Go-No-Go.html` as a read-only behavior reference. Installed PlayCanvas `2.23.3` does not meet the approved `2.12.x` target under the open `^2.12.2` range. The backend is health-only and root `dev`/`test` scripts are absent; t2.1’s parity, consented-import, mobile-input, and test gates remain outstanding requirements.

## 2026-11-03T15:44:48Z — architect
Target design: native routed PlayCanvas 2.12.4 client; one modular Express 5 API deployment with DAO/DTO boundaries; server-authoritative mission state, revision-guarded writes, secure cookie sessions, and consent before reading legacy save data.
