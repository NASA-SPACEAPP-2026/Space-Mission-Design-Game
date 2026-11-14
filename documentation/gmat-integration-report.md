# Report: linking the Space Mission Design Game to NASA resources and GMAT

NASA Space Apps Challenge 2026 · Space Mission Design Game · branch `alexandra`

Sources are marked as **official NASA material**, **measured** (run by us in GMAT) or **assumption** (a choice or estimate of ours). Section 5 lists what is not verified.

## 1. One-page summary

The game already modelled orbits, NASA project phases and a technology database. We connected it to the resources the challenge provides, and above all to **NASA's General Mission Analysis Tool (GMAT)**.

- **GMAT runs behind the game.** GMAT R2025a runs in a Docker container. A small service turns the player's orbit into a GMAT script, runs it and returns the results. The player does not press anything.
- **GMAT supplies three things the game used to fake:**
  1. the ΔV of every orbit transfer
  2. an analysis of the working orbit: shadow (eclipse) per orbit, ground-station contacts, orbit decay and station-keeping fuel
  3. the orbit lifetime, from a real propagation to re-entry (Earth, Mars), impact (Moon) or the atmosphere (Venus)
- **It works for four bodies:** Earth, Moon, Mars and Venus.
- **It changes gameplay.** GMAT's worst-case shadow sizes the battery. Its decay sets station-keeping ΔV. Natural re-entry is accepted only if GMAT shows re-entry within 5 years, or the drag sail brings it under 5 years. Otherwise the player needs a disposal burn.
- **The player sees it.** There is a "GMAT analysis (NASA)" card in the Orbit Budget, plus the build gauges, the PDR review, the closing review and the downloadable report. Every row says whether it came from GMAT or from the game's own model.
- **Resource-inspired features:** a CML/MDL maturity ladder, the four mission segments (launch, space, ground, user), a table of similar real NASA missions, and an animated mission replay.
- **Safe fallback:** without the GMAT container the game keeps its own numbers and says so.
- **Quality:** 41 automated tests, a production build that passes, and an end-to-end check in a browser for all four bodies.

## 2. What was added

### 2.1 Features inspired by the challenge resources

| Feature | What it does | Challenge resource |
|---|---|---|
| CML / MDL ladder | Maps game phases to JPL Concept Maturity Levels and NASA Mission Design Lab study levels. Shown on reviews, the report and the comparison table. | Concept Maturity Levels, Mission Design Lab |
| Four mission segments | Launch, Space, Ground and User, in the closing review and the report. Uses numbers the game already computes. | Design and Develop Science Missions |
| Similar NASA missions | A table of real small-satellite missions, chosen by mission type and destination. | Learning game about telescopes (it ends by naming similar real missions) |
| Mission replay | Animated flight through release, transfers, working orbit and end of life, with elapsed time and the ΔV of each burn. | NASA Mission Viz, VR mission visualisation challenge |

### 2.2 The GMAT integration

**Architecture**

```
player edits an orbit
  → game computes its own quick numbers (instant)
  → after a short pause, the game sends validated numbers to /api/gmat…
  → the service writes a GMAT script, runs GmatConsole in the container, parses the output files
  → the game stores the result with the mission and replaces its own numbers with GMAT's
```

The browser never sends script text, only numbers. The service validates every field, rejects anything else, runs one GMAT at a time per job type, and caches results.

**The three jobs**

| Job | GMAT feature used | What the game gets |
|---|---|---|
| ΔV of each transfer (about 0.6 s) | differential-corrector targeting of two engine burns, with the plane change split as in the game | ΔV per leg, used by the budget, reviews and report |
| Orbit analysis (about 10 s) | EclipseLocator, ContactLocator, gravity field and drag (or third-body forces) | shadow, contacts, orbit evolution, node drift |
| Orbit lifetime (seconds to about a minute) | long propagation with a stop condition (re-entry, impact or atmosphere) | lifetime for average, maximum and minimum solar activity, and with the drag sail |

**Physics per body**

| Body | Gravity field | Perturbing bodies | Drag |
|---|---|---|---|
| Earth | JGM2 4×4 | none | Jacchia-Roberts atmosphere |
| Moon | LP165P 20×20 | Earth, Sun | none |
| Mars | Mars50c 20×20 | Sun | exponential atmosphere |
| Venus | MGNP180U 20×20 | Sun | none (GMAT has no Venus atmosphere) |

**Ground stations.** Contacts are computed against three stations: Milan (always available), Svalbard (unlocked by the game's ground building) and Canberra (unlocked by the first dish). This replaced a fixed contact time that was multiplied twice by the same building and dishes.

**Effects on gameplay**
- GMAT's worst-case shadow per orbit sizes the battery check.
- GMAT's decay becomes station-keeping ΔV per month.
- The end-of-life rule: natural re-entry is accepted only within 5 years (Earth and Mars), using the drag sail's area if a sail is fitted. Otherwise the player needs a disposal burn.
- PDR fails an orbit without propulsion that decays before the minimum mission length, using the worst-case lifetime.
- Orbits that hit the surface or atmosphere within 30 days (for example a 100 km, 30° lunar orbit) are reported as an impact or re-entry with the day number.

**Where the player sees it:** the "GMAT analysis (NASA)" card in the Orbit Budget; the shadow and data gauges in the build screen; the PDR review; the closing review; the downloaded report. Results are saved with the mission, so a reload does not need GMAT again.

**Fallback.** If the container is not reachable, every row falls back to the game's own model and the status line says so.

### 2.3 Infrastructure and tests

- `docker/gmat/Dockerfile.base`: Ubuntu, GMAT R2025a and Node. This is the heavy layer.
- `docker/gmat/Dockerfile`: a thin layer with the bridge scripts.
- `docker-compose.yml` and `scripts/gmat-up.mjs`: `npm run dev` pulls the base image (or builds it once) and starts the service.
- `.github/workflows/gmat-base-image.yml`: publishes the base image to GitHub's container registry. It has never run (see section 5).
- 41 automated tests: script generators, output parsers and the bridge with a fake GMAT.
- Commits on `alexandra`: `448fe6a` (GMAT integration and resource-inspired features) and `0190ce6` (all four bodies and the lifetime job).

## 3. Where each piece of data came from

### 3.1 Official NASA material

| Item | Source |
|---|---|
| GMAT | `gmat-ubuntu-x64-R2025a.tar.gz`, about 422 MB, from NASA's official release on SourceForge (`sourceforge.net/projects/gmat/files/GMAT/GMAT-R2025a/`) |
| GMAT script syntax | NASA's sample scripts shipped in that release (`Ex_HohmannTransfer`, `Ex_R2015a_EclipseLocation`, `Ex_R2015a_StationContactLocator`, `Ex_LEOStationKeeping`, `Ex_MarsOrbit`, `Ex_LunarTransfer` and others), and GMAT's own error messages. A first research pass read the same samples from NASA's GitHub, but could not open the R2025a user guide. The syntax was corrected by running real scripts. |
| Gravity and atmosphere data | files shipped with GMAT: `JGM2.cof`, `LP165P.cof`, `Mars50c.cof`, `MGNP180U.cof`, `MarsExponentialAtmosphereData.txt` |
| Challenge brief and resources | the text supplied by the team (GMAT, CMLs, MDL, Mission Viz, telescope game, CubeSat 101, the 2023 VR challenge) and `documentation/challenge.md` |
| Similar-missions table | pages on nasa.gov, science.nasa.gov, jpl.nasa.gov and esto.nasa.gov (URLs are in `TWIN` in `public/game/07-main.js`) |
| CML framework | NTRS paper 20150007816 (Wessen et al., JPL, 2015) confirms CML 1–4 as a concept-maturity framework |

The missions in the table are MinXSS, RAVAN, CIRiS, MarCO, Lunar Flashlight and CAPSTONE. Lunar Flashlight is listed with its real outcome: its thruster could not reach lunar orbit.

### 3.2 Measured by running GMAT in the container

| Test | Result |
|---|---|
| ΔV against the game's two-body model | LEO to GEO: 3856.5 vs 3856.6 m/s. 45° plane change: 5879 vs 5879. GEO with inclination change: 4198.6 vs 4198.7. Lunar transfer: 1196.6 vs 1196.5. All within 0.01%. |
| 400 km, 51.6° orbit | 36 min maximum shadow per orbit; about 11 km/month decay |
| Lifetime, 400 km, 3U CubeSat | 88 days (average solar activity), 50 days (solar maximum), 287 days (solar minimum) |
| 600 km Sun-synchronous orbit | node drift +0.99°/day |
| Svalbard passes | about 15 a day for a polar orbit, none for a 51.6° orbit |
| Moon, 100 km at 30° | impact after 11.4 days, in both the analysis and the lifetime run |
| Contacts, Moon and Mars | about 400 min/day from Earth stations |
| Run times | analysis about 10 s; lifetime from a few seconds to about a minute (container runs under emulation on an Apple-silicon Mac) |

### 3.3 Assumptions (our own choices or estimates)

- **Ground-station coordinates** for Milan, Svalbard and Canberra come from general knowledge of the sites, not from an official station list.
- **Satellite cross-section:** 0.015 m² per CubeSat unit, plus a small increase for deployable solar wings.
- **Drag and solar activity:**
  - drag coefficient 2.2 (the value in GMAT's own sample)
  - solar activity levels F10.7 = 70, 150 and 230 for minimum, average and maximum
  - drag sail area of 1 m², a typical CubeSat value (the game's part data lists larger Spinnaker sails)
- **Fixed epoch:** 1 January 2027, because the game has no calendar.
- **5-year deorbit rule:** taken from general knowledge of current debris guidelines (FCC and ESA). The wording was not looked up in this work.
- **Legacy lifetime estimate:** a coarse scale-height table, used only as a fallback when the lifetime run is not available.
- **Sun-synchronous rate:** the standard 0.9856°/day.
- **Sanity checks** (for example about 35 minutes of shadow for an ISS-like orbit) are our own expectations, not a comparison with an external dataset.

## 4. How to run it

```bash
cd Space-Mission-Design-Game
npm install
npm run dev        # starts the game on http://localhost:5173 and the GMAT container
npm test           # 41 tests
```

Docker Desktop must be running for GMAT. Without it the game still works, on its own numbers. The first start pulls the prebuilt GMAT base image or builds it locally (a one-time download of about 420 MB). After editing `scripts/gmat-*.mjs` or `public/game/02-orbit.js`, run `docker compose restart gmat`.

## 5. Not verified, and limits

- **CML names.** No official source confirmed them. CML 1–4 names are from memory and search snippets, and levels above 4 are labelled "Beyond concept study". Check them against NASA's CML material before citing them.
- **Dropped missions.** ASTERIA, LunaH-Map, PhoneSat and a few others could not be verified on official pages, so they are not in the table.
- **ΔV agreement.** GMAT and the game agree because both use two-body physics with impulsive burns. This validates the game's maths with NASA's tool. It is not an independent check against real-world accuracy.
- **Venus.** GMAT has no Venus atmosphere, so there is no drag. The lifetime is the Sun-driven drop of the periapsis to the atmosphere interface.
- **Mars.** Drag uses GMAT's exponential atmosphere, not the Mars-GRAM model (not installed).
- **Solar activity** is held constant at three levels, not a real cycle forecast.
- **Fixed date.** Eclipse, contacts and the Mars and Venus geometry depend on the date, and the game has no calendar.
- **Data budget.** The game's data-rate model keeps its own Earth distances. GMAT's distance and light time are shown but not fed into it.
- **Not tested.** The drag-sail case after the job queue was reordered, and the build-screen eclipse text with a battery fitted.
- **Not deployed.** The live site only uses GMAT once the container is hosted, which needs Azure access. The workflow that publishes the prebuilt image needs the `NASA-SPACEAPP-2026` GitHub organisation to allow publishing packages, and it has never run.
