[English](testing.md) | **Italiano**

# Test e verifiche

[Indice](README.it.md) · [Ingresso al gioco](entry-flow.it.md) · [Distribuzione](deployment.it.md)

## Controlli della CI

Usa Node.js 24 o successivo, come richiesto da `package.json` e dalla CI:

```powershell
npm ci
npm run check
```

La suite limita i worker a due per contenere la contesa di CPU e memoria durante PGlite, scrypt e compressione. I timeout e le asserzioni rimangono invariati.

`npm test` mostra anche una tabella completa, raggruppata per file, con numero, esito (`PASS`, `FAIL`, `SKIP`), durata e nome di ciascun test. I nomi lunghi vanno a capo senza essere tagliati; gli errori mantengono i dettagli e lo stack trace di Vitest. Su PowerShell, se `npm.ps1` è bloccato, usa `npm.cmd test`.

Gli esiti positivi sono verdi, gli errori rossi e i test saltati gialli. Il resoconto finale riassume ogni file, i totali, la percentuale di successo dei test eseguiti e la durata reale della suite. I log reindirizzati restano senza colori; `FORCE_COLOR=1` forza i colori e `NO_COLOR=1` li disattiva.

`check` esegue Vitest, build di produzione e `scripts/verify-build.mjs` in sequenza; un errore interrompe il comando. La CI esegue anche `npm run package:azure` su Linux: servono Bash, npm, zip e una build già presente.

| File di test | Copertura |
| --- | --- |
| `tests/content.test.mjs` | HTML, ordine script, salvataggi, risorse, renderer e contratti di missione |
| `tests/server.test.mjs` | File, sonda, cache, compressione, HEAD, fallback e percorsi non validi |
| `tests/auth.test.mjs` | Password, univocità, cookie, sessioni, CSRF, limiti, registrazione senza email e aggiornamento ripetibile di DB esistenti |
| `tests/gmat-proxy.test.mjs` | Proxy HTTP GMAT, metodi, indirizzo inoltrato, assenza servizio e upstream non raggiungibile |
| `tests/gmat.test.mjs` | Generazione script GMAT, validazione e parser |
| `tests/gmat-bridge.test.mjs` | Bridge con eseguibile simulato, code e risultati |
| `tests/consortia.test.mjs`, `tests/consortia-ui.test.mjs` | Membri, ruoli, chat, moderazione, spettatori, missioni congiunte, classifiche e sfide |
| `tests/roads.test.mjs` | Geometria delle strade del campus e posizionamento |
| `tests/audit-api.test.mjs` | JSON malformato, CSRF, sessioni false, upload grandi, letture parallele, premi duplicati e posti contesi |
| `tests/audit-database.test.mjs` | Configurazione DB, TLS e timeout senza connessioni esterne |
| `tests/audit-gmat.test.mjs` | Matrice di input numerici, report corrotti, recupero delle code e cache |
| `tests/audit-rules.test.mjs` | Conservazione orbitale, trasferimenti di Hohmann, stato indipendente e soglie delle sfide |

`npm run test:coverage` misura con V8 `backend/`, `server.mjs` e `scripts/gmat-bridge.mjs`. Il report HTML è `test-results/coverage/index.html`: la percentuale non misura tutta l'interfaccia browser. Il [report del 15 novembre 2026](test-audit-2026-11-15.it.md) descrive difetti e limiti verificati.

PGlite usa PostgreSQL incorporato temporaneo, separato da Docker e dagli utenti reali. GMAT simulato non dimostra il funzionamento del vero container. `npm test` esegue solo la suite; `npm run build` solo la compilazione.

## Smoke browser completo degli account

```powershell
npm run build
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run smoke:account
```

Adatta il percorso al browser installato. Lo script avvia server e DB PGlite temporanei. Controlla menu iniziale, richiesta account su New game, annullamento con pulsante/Escape, due campi, registrazione automatica senza email, prosecuzione alla scelta modalità, sessioni, logout, password errata, servizio indisponibile, mobile e cookie. Lo smoke del gioco verifica salvataggio e ripresa dopo il reload. Controlla anche inglese, persistenza dell'italiano, tastiera e movimento ridotto. Non crea account Docker o Azure. Le immagini sono `dist/entry-title.png`, `dist/entry-register.png`, `dist/entry-mobile.png` e `dist/game-smoke.png`.

## Smoke del gioco su server esistente

Avvia PostgreSQL e API dopo entrambe le migrazioni. Compila il frontend e servilo con `node --env-file-if-exists=.env server.mjs`; per questa prova diretta imposta `APP_ORIGIN=http://localhost:8080`. In un altro terminale:

```powershell
$env:BASE_URL = 'http://localhost:8080'
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
# Fornisci GNG_USERNAME e GNG_PASSWORD nell'ambiente per un account di test esistente.
npm run smoke
```

Lo smoke richiede `GNG_USERNAME` e `GNG_PASSWORD`, accede senza registrare utenti, verifica campus/HUD e segnala errori di pagina o console. Non salvare credenziali nei commit. Ripristina l'origine Vite prima di tornare allo sviluppo.

## Checklist manuale

1. Menu iniziale visibile fino a un'azione; New game chiede l'account agli ospiti.
2. Modulo unico con username e password; i nomi esistenti richiedono la password corretta. La registrazione API rifiuta duplicati senza distinzione di maiuscole e impone password di 1–128 caratteri.
3. Accesso degli utenti precedenti; compatibilità API del login email.
4. Password errata o servizio indisponibile: modulo utilizzabile e gioco non avviato.
5. Sessione valida: scelta modalità senza modulo account; logout: ritorno al menu come ospite.
6. Conservazione dei salvataggi locali durante accesso, uscita, reload e cambio account.
7. Tastiera, mobile verticale/orizzontale, movimento ridotto e fallback WebGL.
8. Migrazioni applicate due volte su uno schema di prova esistente, senza perdita account.

PostgreSQL locale usa di default la porta host 5432. Se occupata, cambia sia `POSTGRES_PORT` sia la porta in `DATABASE_URL` e ricrea soltanto il container del progetto con Compose. Non eliminare il volume per risolvere errori di connessione.

## Limiti e GMAT

Per calcoli reali su Terra, Luna, Marte e Venere e fallback usa la [guida GMAT](gmat-integration-report.it.md). L'account serve per entrare nel gioco; GMAT resta opzionale.

I test locali non verificano firewall Azure, TLS, domini personalizzati, ripristino backup o credenziali distribuite. Lo smoke remoto della CI controlla risorse e `/api/auth/me`, non l'intero login o GMAT. Applica la migrazione 002 prima del deploy e verifica registrazione, persistenza dopo riavvio e isolamento ambienti in staging.
