# Existing Technology Stack

## Runtime and build environment

- Current inspected environment: Node.js `v22.14.0`, npm `10.9.2`.
- Root package uses npm workspaces: `app/frontend` and `app/backend`.
- No `engines` field is declared in the root or workspace package manifests.
- TypeScript compilation target is ES2022 in both packages; frontend uses `moduleResolution: bundler`, backend uses `NodeNext`.
- Root `npm run build` chains frontend build (`tsc` then `vite build`) and backend TypeScript build.
- Root scripts presently include `dev:frontend`, `dev:backend`, `start:backend`; no root `dev` or `test` script is declared.

## Packages

| Package | Manifest declaration | Installed in workspace at inspection | Use |
|---|---|---|---|
| PlayCanvas | `^2.12.2` | `2.23.3` | Browser 3D shell, canvas, scene, input |
| TypeScript | `^5.9.3` | `5.9.3` | Both packages |
| Vite | `^7.2.2` | `7.3.7` | Frontend dev server and production bundler |
| Express | `^5.1.0` | `5.3.0` | Backend HTTP health endpoint |
| `tsx` | `^4.20.6` | `4.23.15` | Backend TypeScript watch-mode dev |
| `@types/express` | `^5.0.5` | `5.0.6` | Backend types |
| `@types/node` | `^24.10.0` | `24.19.2` | Both packages |

Installed versions are from `npm ls --depth=0 --workspaces`; manifests and lockfile use semver ranges. In particular, the declared PlayCanvas range is open above 2.12 and the installed package is 2.23.3, which is outside an interpretation requiring exactly the 2.12.x line.

## Rendering and browser dependencies

- The current shell constructs a PlayCanvas `Application`, including mouse and touch-device objects, and loads local `Astronaut.glb` and `Crab-Nebula.glb` assets.
- The embedded legacy page loads Three.js `r128` from cdnjs; it also configures a Draco decoder from `gstatic.com`.
- The legacy page defines its own inline JavaScript, styles, translation table, storage, and SVG/Three.js rendering. These libraries are not declared in the npm workspace manifests.
- Tailwind CSS, an application router, i18n package, API client, and frontend test framework are absent from the manifests.

## Backend and persistence

- Express 5 currently has no database driver, ORM/query builder, request validation, auth/session, password hashing, or migration dependency.
- No SQL schema, environment sample, database config, or backend model/repository layers were found in the inspected app tree.
- Current persistence is browser `localStorage`; no server-side mission persistence exists.
- The only backend route is a health/liveness response; the Vite dev server forwards `/api` to `localhost:8080`.

## Verification/configuration gaps

- No test script/framework/configuration was found; there are no test files in `app/frontend/src` or `app/backend/src`.
- No package-level Node engine constraint is declared; build/runtime compatibility is therefore inferred from the current environment and dependency manifests.
- The requested root `npm run dev` and terminal startup experience are not present in the current root scripts.
- No readiness behavior can currently report database availability because no database connection exists.

## Migration risk notes grounded in these facts

- **High:** a second graphics engine and external CDN scripts are coupled to iframe runtime; removing the iframe must also remove the production copy/dev middleware path and account for Three.js-rendered satellite/campus behavior.
- **High:** the installed PlayCanvas version has advanced beyond 2.12.x under the declared semver range; target line must be pinned/validated intentionally.
- **High:** current dependency graph has no test or persistence/security libraries despite the new acceptance requirements.
- **Medium:** external Draco/Three.js CDN usage creates offline/CSP/availability dependency for the current legacy flow.

## Upstream Artifacts Consumed

- `.github/modernize/rearchitecture/clarification.md` — approved stack targets and local-development constraints.
- `.github/modernize/rearchitecture/artifacts/project-profile.yaml` — project classification and manifest count.

## Evidence Mapping

- `clarification.md#Frontend` → PlayCanvas version-range caveat, current input/runtime and missing Tailwind/i18n/router libraries.
- `clarification.md#Backend` → current Express-only backend and missing DB/auth/migration dependencies.
- `project-profile.yaml#project.structure` → workspace package inventory and source paths.
