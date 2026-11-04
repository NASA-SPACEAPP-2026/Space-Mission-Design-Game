[🇬🇧 English](README.md) | 🇮🇹 Italiano

# Space Mission Design Game

Un gioco web per la challenge Space Mission Design Game: si esplora in prima persona una base
lunare (PlayCanvas) e, alla console di missione, si apre **Go-No-Go**, la simulazione completa di
progettazione della missione. Il testo della challenge è in
[documentation/challenge.it.md](documentation/challenge.it.md).

## Avvio rapido

Requisiti: [Node.js](https://nodejs.org/) 24 (vedi `.nvmrc`) e Git.

```bash
git clone https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game.git
cd Space-Mission-Design-Game
npm install
npm run dev
```

`npm run dev` avvia insieme backend (http://localhost:8080) e frontend; apri l'URL indicato da
Vite (http://localhost:5173), che inoltra `/api` al backend.

Comandi: **WASD**/frecce e mouse per muoversi, **E** vicino alla console per aprire Go-No-Go,
**V** visuale in terza persona, **Esc** libera il mouse, **P** pausa. Sui touch screen un joystick
virtuale fa muovere e trascinando si guarda intorno. **Carica partita** riprende il salvataggio
del browser creato dal gioco.

## Script

| Comando | Cosa fa |
|---------|---------|
| `npm run dev` | Frontend + backend in modalità watch |
| `npm run dev:frontend` / `npm run dev:backend` | Solo uno dei due |
| `npm run build` | Compila entrambi i workspace (`app/*/dist`) |
| `npm test` | Esegue tutti i test (frontend: vitest, backend: `node:test`) |
| `npm start` | Avvia il backend compilato, che serve anche il frontend compilato |

## Struttura del progetto

```text
app/
  frontend/          PlayCanvas + Vite + Tailwind; public/legacy-game.html è il gioco Go-No-Go originale
  backend/           API Express (endpoint di health; persistenza MySQL pronta ma non ancora collegata)
  contracts/         Tipi e validazione delle future API HTTP v1 (non ancora usati dall'app)
documentation/       Architettura, deployment, asset, testo della challenge
infra/               Script una tantum di setup e teardown su Azure
scripts/             Pacchetto per Azure App Service
.github/workflows/   CI/CD
```

## Branch e deployment

Si lavora su `dev` tramite pull request; ogni push su `dev` va in **staging**. Il merge di `dev`
in `main` va in **produzione**. Dettagli in [documentation/deployment.md](documentation/deployment.md).

## Documentazione

- [Architettura](documentation/architecture.md)
- [Deployment](documentation/deployment.md)
- [Formato del salvataggio legacy](documentation/legacy-save-format.md)
- [Asset 3D NASA](documentation/nasa-assets.md)
- [Testo della challenge](documentation/challenge.it.md)
