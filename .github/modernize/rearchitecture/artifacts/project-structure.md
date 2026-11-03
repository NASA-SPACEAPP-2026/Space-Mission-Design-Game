# Current Project Structure

## Project classification

Full-stack web application organized as an npm workspace monorepo with a browser client and one backend package. The legacy game remains at the repository root as the source for gameplay behavior and local state.

## Modules and layers

| Area | Files observed | Current responsibility |
|---|---:|---|
| Workspace/root | 1 package manifest + lockfile | npm workspace and build/dev/start scripts |
| Frontend shell | 2 files under `app/frontend/src` | `main.ts` owns PlayCanvas world, DOM interaction, input, storage gate, health fetch; `style.css` styles menu/HUD/dialogs |
| Frontend HTML | `app/frontend/index.html` | Canvas, menu, options, pause, HUD, console iframe, loading screen |
| Frontend bundler/config | `app/frontend/vite.config.ts`, `tsconfig.json` | Vite server, `/api` proxy, legacy page plugin, TypeScript settings |
| Frontend static assets | 2 local GLB models | Astronaut and Crab Nebula |
| Backend | 1 source file under `app/backend/src` | Express app, health route, port validation, listener |
| Legacy application | `Go-No-Go.html` (7,044 lines) | Inline styles, gameplay/domain logic, SVG/Three.js renderers, translations, interaction/UI, saves/reports |
| Documentation | 3 files | Existing app overview, project README, NASA asset notes |

Source file counts were measured with recursive file listing on 2026-11-03. No project test files or test configuration were found in the repository search.

## Entry points and routing

- Browser shell: `app/frontend/index.html` loads `/src/main.ts`; Vite serves the SPA at `/` (port 5173).
- Legacy page: Vite middleware serves root `Go-No-Go.html` at `/legacy-game.html` in development; `writeBundle` copies it to frontend output. The shell loads it in `#legacyGame`.
- Backend: `app/backend/src/index.ts` starts Express on `PORT` or `8080`; only route is `GET /api/health`.
- Development API traffic: `app/frontend/vite.config.ts` proxies `/api` to `http://localhost:8080`.
- There is no application router, dedicated profile/mission URL, auth route, mission API, database adapter, or readiness route in the inspected source.

## Functional areas visible in the current structure

- First-person lunar menu/world shell and settings.
- Legacy mission-management application embedded in a console: its code declares view keys `launch`, `hub`, `admin`, `build`, `test`, `mcc`, `pad`, `fac`, `fd`.
- Shared current package configuration and basic backend health endpoint.
- Static NASA model resources.

The detailed legacy behavior inventory belongs to the PM task; this file records only the architectural ownership and entrypoint boundaries relevant to migration.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/artifacts/project-profile.yaml` — current package layout and project type.
- `.github/modernize/rearchitecture/clarification.md` — target boundary and requirement to replace iframe gameplay.

## Evidence Mapping

- `project-profile.yaml#project.structure` → module table and package boundaries.
- `clarification.md#Generic` → target runtime-cut implications and note that legacy source is not itself the target entrypoint.
