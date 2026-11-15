[English](CREDITS.md) | **Italiano**

# Texture dei pianeti — crediti

Mappe equirettangolari utilizzate nel Flight Dynamics Centre per la vista orbitale e la sfera 3D. I file sono distribuiti localmente in `public/tex/` e copiati nella build: non dipendono da richieste alle fonti durante il gioco.

Le attribuzioni conservano le fonti dichiarate nel documento originale. Il materiale NASA non è protetto da copyright salvo indicazioni specifiche, secondo le linee guida NASA sui media; controllare le condizioni della singola risorsa prima di riutilizzarla fuori dal progetto.

| File | Corpo | Fonte dichiarata | Crediti | Dimensioni |
| --- | --- | --- | --- | --- |
| `earth.jpg` | Terra | NASA Visible Earth, “Blue Marble: Land Surface, Shallow Water, and Shaded Topography” (record 57752); copia Wikimedia Commons `Land_shallow_topo_2048.jpg`, pubblico dominio | Reto Stöckli / NASA GSFC; Robert Simmon; MODIS Land, Atmosphere and Ocean Groups; USGS EROS (topografia) | 1920×960 |
| `moon.jpg` | Luna | NASA Scientific Visualization Studio, CGI Moon Kit (`lroc_color_poles_1k.jpg`, svs.gsfc.nasa.gov/4720) | NASA GSFC SVS; team LRO LROC | 1024×512 |
| `mars.jpg` | Marte | JPL Solar System Simulator, mappe texture (`mar0kuu2.jpg`, maps.jpl.nasa.gov) | Caltech/JPL/USGS, immagini Viking Orbiter | 1440×720 |
| `venus.jpg` | Venere | JPL Solar System Simulator, mappe texture (`ven0mss2.jpg`, maps.jpl.nasa.gov) | JPL/Caltech (D. Seal), immagine in luce visibile Mariner 10 | 1440×720 |
| `mercury.jpg` | Mercurio | Solar System Scope, `Solarsystemscope_texture_2k_mercury.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licenza [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | 1024×512 |
| `jupiter.jpg` | Giove | Solar System Scope, `Solarsystemscope_texture_2k_jupiter.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licenza CC BY 4.0 | 1024×512 |
| `saturn.jpg` | Saturno | Solar System Scope, `Solarsystemscope_texture_2k_saturn.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licenza CC BY 4.0 | 1024×512 |
| `uranus.jpg` | Urano | Solar System Scope, `Solarsystemscope_texture_2k_uranus.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licenza CC BY 4.0 | 1024×512 |
| `neptune.jpg` | Nettuno | Solar System Scope, `Solarsystemscope_texture_2k_neptune.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licenza CC BY 4.0 | 1024×512 |
| `sun.jpg` | Sole | Solar System Scope, `Solarsystemscope_texture_2k_sun.jpg` (Wikimedia Commons) | Solar System Scope (solarsystemscope.com/textures), licenza CC BY 4.0 | 1024×512 |
| `comet67p.json` | Cometa 67P/Churyumov–Gerasimenko | NASA Planetary Data System ed ESA Planetary Science Archive, data set RO-C-MULTI-5-67P-SHAPE-V2.0, prodotto `CG_SPC_SHAP5_012K_CART` ([pdssbn.astro.umd.edu](https://pdssbn.astro.umd.edu/holdings/ro-c-multi-5-67p-shape-v2.0/dataset.html)) | R. Gaskell, L. Jorda, C. Capanna, S. Hviid e P. Gutierrez, *SPC SHAP5 Cartesian plate model for comet 67P/C-G*, 2017; immagini OSIRIS di Rosetta, PSI e LAM | 5.861 vertici, 11.716 facce |

**Cometa 67P.** Una cometa non è una sfera, quindi non c’è una mappa: il file è il modello di forma ufficiale, preparato da `scripts/comet-67p.mjs` (assi del gioco, normali ammorbidite per la luce cartoon, posizioni e normali quantizzate). I tre toni di grigio sono calcolati dalla forma (terreno liscio e concavo più chiaro, pareti ruvide e convesse più scure): non sono una mappa di albedo misurata. Scaricato il 15 novembre 2026.

Data di download riportata dal documento originale: 14 novembre 2026. Le mappe Solar System Scope sono state scaricate il 15 novembre 2026 e ridotte da 2048×1024 a 1024×512 prima del filtro; la licenza CC BY 4.0 richiede di mantenere questa attribuzione.

**Stile cartone.** I file di questa cartella sono versioni in stile cartone delle mappe qui sopra, ottenute con `scripts/toon-planets.mjs` (filtro di Kuwahara, pochi colori presi da ogni mappa, contorno sottile dove il colore cambia molto). Niente è inventato: coste, crateri, calotte e bande di nubi vengono dalle mappe originali. Gli originali di Terra, Luna, Marte e Venere restano nella cronologia di git; i sei originali Solar System Scope non sono nel repository e si riscaricano da Wikimedia Commons con i nomi di file indicati sopra.
