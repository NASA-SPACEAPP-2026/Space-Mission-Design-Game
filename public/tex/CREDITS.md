**English** | [Italiano](CREDITS.it.md)

# Planet textures — credits

Equirectangular maps used for the planet in the Flight Dynamics Centre (orbit view and 3D sphere).
These textures are served locally from public/tex and copied into the build. The attributions below preserve the stated sources in the original document.

NASA material is not protected by copyright unless noted (NASA media usage guidelines).

| File | Body | Source | Credit | Size |
|---|---|---|---|---|
| `earth.jpg` | Earth | NASA Visible Earth, "Blue Marble: Land Surface, Shallow Water, and Shaded Topography" (record 57752), 1920×960 copy from Wikimedia Commons (`Land_shallow_topo_2048.jpg`), public domain | Reto Stöckli / NASA GSFC; Robert Simmon; MODIS Land, Atmosphere and Ocean Groups; USGS EROS (topography) | 1920×960 |
| `moon.jpg` | Moon | NASA Scientific Visualization Studio, CGI Moon Kit (`lroc_color_poles_1k.jpg`, svs.gsfc.nasa.gov/4720) | NASA GSFC SVS; LRO LROC team | 1024×512 |
| `mars.jpg` | Mars | JPL Solar System Simulator texture maps (`mar0kuu2.jpg`, maps.jpl.nasa.gov) | Caltech/JPL/USGS, from Viking Orbiter images | 1440×720 |
| `venus.jpg` | Venus | JPL Solar System Simulator texture maps (`ven0mss2.jpg`, maps.jpl.nasa.gov) | JPL/Caltech (D. Seal), from a Mariner 10 visible-light image | 1440×720 |
| `mercury.jpg` | Mercury | Solar System Scope, `Solarsystemscope_texture_2k_mercury.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 1024×512 |
| `jupiter.jpg` | Jupiter | Solar System Scope, `Solarsystemscope_texture_2k_jupiter.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), CC BY 4.0 | 1024×512 |
| `saturn.jpg` | Saturn | Solar System Scope, `Solarsystemscope_texture_2k_saturn.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), CC BY 4.0 | 1024×512 |
| `uranus.jpg` | Uranus | Solar System Scope, `Solarsystemscope_texture_2k_uranus.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), CC BY 4.0 | 1024×512 |
| `neptune.jpg` | Neptune | Solar System Scope, `Solarsystemscope_texture_2k_neptune.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), CC BY 4.0 | 1024×512 |
| `sun.jpg` | Sun | Solar System Scope, `Solarsystemscope_texture_2k_sun.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), CC BY 4.0 | 1024×512 |

Downloaded on 2026-11-14. The Solar System Scope maps were downloaded on 2026-11-15 and scaled from 2048×1024 to 1024×512 before filtering; CC BY 4.0 requires keeping this attribution.

**Cartoon style.** The files in this folder are cartoon-style derivatives of the maps above, made with `scripts/toon-planets.mjs` (Kuwahara filter, a small colour palette taken from each map, thin ink outlines on strong colour changes). Nothing is invented: coastlines, craters, ice caps and cloud bands come from the original maps. The originals of Earth, Moon, Mars and Venus are kept in the git history; the six Solar System Scope originals are not in the repository and can be downloaded again from Wikimedia Commons under the file names above.
