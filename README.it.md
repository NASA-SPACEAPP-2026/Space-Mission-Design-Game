🇬🇧 [English](README.md) | 🇮🇹 Italiano

# Space Mission Design Game

Un gioco web **statico** per la challenge Space Mission Design Game: progetta una missione
CubeSat, negozia i requisiti, costruisci e collauda il satellite, lancialo e fallo volare. È una
single-page app costruita con Vite; non ci sono backend o database.

Il brief della challenge è in [documentation/challenge.it.md](documentation/challenge.it.md).

## Avvio rapido

Requisiti: [Node.js](https://nodejs.org/) 24 (vedi `.nvmrc`) e Git.

```bash
git clone https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game.git
cd Space-Mission-Design-Game
npm install
npm run dev
```

Apri l'URL indicato da Vite (http://localhost:5173). Lo stato della partita è salvato nel browser
(`localStorage`, chiave `gng32.save`); nulla viene inviato a un server.

## Script

| Comando | Cosa fa |
|---------|---------|
| `npm run dev` | Server di sviluppo Vite con hot reload |
| `npm run build` | Crea, minifica, hasha e precomprime il sito statico in `dist/` |
| `npm run preview` | Serve localmente la build di produzione |
| `npm run start` | Avvia `server.mjs` su `dist/` (il server usato da App Service) |
| `npm test` | Esegue la suite Vitest |
| `npm run smoke` | Smoke test browser opzionale su una build in esecuzione |
| `npm run check` | Test + build di produzione |
| `npm run package:azure` | Crea `release.zip` per Azure App Service |

## Struttura del progetto

```text
index.html              guscio: markup e CSS
public/game/            script del gioco, divisi per dominio (dati, orbite, logica, campus, stanze, main)
public/fonts/           font WOFF2 latin self-hosted e licenze OFL
public/audio/theme.mp3  colonna sonora, caricata on demand (non incorporata nell'HTML)
server.mjs              server statico minimale per Azure App Service
tests/                  test Vitest sul contratto statico e sul server
scripts/                packaging Azure e smoke test browser opzionale
infra/                  setup e teardown Azure una tantum
documentation/          architettura, deployment, formato salvataggi, brief della challenge
.github/workflows/      CI/CD
```

Gli script sono classic script caricati in ordine, così i binding globali restano compatibili
mentre il codice viene diviso. Il prossimo passo del refactor li converte in moduli ES/TypeScript
dentro `src/` (vedi [architettura](documentation/architecture.md)).

## Branch e deploy

Il lavoro passa da `dev` tramite pull request; ogni push su `dev` deploya in **staging**. Il merge
di `dev` in `main` deploya in **production**. Dettagli in
[documentation/deployment.md](documentation/deployment.md).

## Documentazione

- [Architettura](documentation/architecture.md)
- [Deployment](documentation/deployment.md)
- [Formato salvataggi](documentation/legacy-save-format.md)
- [Brief della challenge](documentation/challenge.it.md)
