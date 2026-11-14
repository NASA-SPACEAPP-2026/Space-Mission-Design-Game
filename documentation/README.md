# Documentazione di Go No-Go

Le guide descrivono il funzionamento presente nei sorgenti del repository. Sono in italiano; nomi di file, variabili, endpoint e identificatori restano quelli effettivi del codice.

## Percorsi di lettura

| Se vuoi… | Leggi |
| --- | --- |
| Installare e giocare | [README principale](../README.md) |
| Capire moduli, rendering e build | [Architettura](architecture.md) |
| Capire cosa finisce nel DB | [Account e database](authentication.md) |
| Capire dove resta la partita | [Salvataggi locali](legacy-save-format.md) |
| Attivare o diagnosticare NASA GMAT | [Integrazione GMAT](gmat-integration-report.md) |
| Distribuire o gestire Azure | [Distribuzione](deployment.md) |
| Eseguire test e verifiche browser | [Verifiche](testing.md) |
| Comprendere gli obiettivi educativi | [Challenge](challenge.md) |

I vecchi percorsi [README.it.md](../README.it.md) e [challenge.it.md](challenge.it.md) rimangono disponibili come rimandi alle guide canoniche italiane.

## Tre ambiti distinti

1. **Gioco locale:** simulazione nel browser e salvataggio `gng32.save` nel `localStorage`.
2. **Account:** API Node e PostgreSQL per utenti, sessioni e limiti ai tentativi.
3. **Analisi orbitale:** servizio GMAT opzionale, raggiunto tramite proxy Vite in sviluppo.

La registrazione non carica una partita nel DB. Il deploy del server Node non distribuisce il servizio GMAT. La sonda `/api/health` verifica il processo, mentre `/api/auth/me` interroga anche lo schema account.

## Fonti di verità

| Argomento | File da consultare |
| --- | --- |
| Comandi e dipendenze | [`package.json`](../package.json), [`package-lock.json`](../package-lock.json) |
| Schema DB | [`db/001-auth.sql`](../db/001-auth.sql) |
| Connessione e migrazione | [`backend/database.mjs`](../backend/database.mjs), [`scripts/migrate.mjs`](../scripts/migrate.mjs) |
| Contratto account | [`backend/auth.mjs`](../backend/auth.mjs), [`public/account.js`](../public/account.js) |
| Routing e servizio file | [`server.mjs`](../server.mjs), [`vite.config.ts`](../vite.config.ts) |
| Salvataggio e interfacce | [`public/game/07-main.js`](../public/game/07-main.js) |
| Servizi locali | [`compose.yaml`](../compose.yaml), [`docker-compose.yml`](../docker-compose.yml) |
| Pipeline | [CI/CD](../.github/workflows/ci-cd.yml), [immagine GMAT](../.github/workflows/gmat-base-image.yml) |

## Aggiornare queste guide

Quando cambia un contratto, aggiorna la guida specialistica e il riepilogo nel README. Mantieni un solo documento completo per argomento. Distingui funzionalità implementate, proposte future e risultati di prove storiche; non presentare un ambiente remoto come verificato senza averlo controllato.

I file `Go No-Go.html` e `dist/` sono risultati di build, non guide da modificare manualmente. Le licenze dei font in `public/fonts/` conservano il testo originale.
