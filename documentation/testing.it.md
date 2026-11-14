[English](testing.md) | **Italiano**

# Test e verifiche

[Indice](README.it.md) · [Ingresso al gioco](entry-flow.it.md) · [Distribuzione](deployment.it.md)

## Controlli della CI

Usa Node.js 24 o successivo, come richiesto da `package.json` e dalla CI:

```powershell
npm ci
npm run check
```

`check` esegue Vitest, build di produzione e `scripts/verify-build.mjs` in sequenza; un errore interrompe il comando. La CI esegue anche `npm run package:azure` su Linux: servono Bash, npm, zip e una build già presente.

| File di test | Copertura |
| --- | --- |
| `tests/content.test.mjs` | HTML, ordine script, salvataggi, risorse, renderer e contratti di missione |
| `tests/server.test.mjs` | File, sonda, cache, compressione, HEAD, fallback e percorsi non validi |
| `tests/auth.test.mjs` | Password, univocità, cookie, sessioni, CSRF, limiti, registrazione senza email e aggiornamento ripetibile di DB esistenti |
| `tests/gmat.test.mjs` | Generazione script GMAT, validazione e parser |
| `tests/gmat-bridge.test.mjs` | Bridge con eseguibile simulato, code e risultati |

PGlite usa PostgreSQL incorporato temporaneo, separato da Docker e dagli utenti reali. GMAT simulato non dimostra il funzionamento del vero container. `npm test` esegue solo la suite; `npm run build` solo la compilazione.

## Smoke browser completo degli account

```powershell
npm run build
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/smoke-account.mjs
```

Adatta il percorso al browser installato. Lo script avvia server e DB PGlite temporanei. Controlla illustrazione, permanenza dello splash oltre tre secondi, avanzamento al clic, due soli campi, visibilità password, registrazione senza email, ingresso diretto, ripristino sessione, logout, password errata, servizio indisponibile, mobile e attributi cookie. Esegue anche lo smoke del gioco contro lo stesso server temporaneo e controlla lingua inglese, tastiera e movimento ridotto. Non crea account Docker o Azure. Le immagini vengono scritte in `dist/entry-splash.png`, `dist/entry-register.png` e `dist/entry-mobile.png`; lo smoke del gioco produce `dist/game-smoke.png`.

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

1. Splash fermo fino al clic o all'attivazione da tastiera, senza conto alla rovescia.
2. Registrazione con solo username e password; rifiuto di password corte e username duplicati anche con maiuscole diverse.
3. Accesso degli utenti precedenti; compatibilità API del login email.
4. Password errata o servizio indisponibile: modulo utilizzabile e gioco non avviato.
5. Sessione valida: campus dopo il clic; logout: ritorno all'ingresso.
6. Conservazione dei salvataggi locali durante accesso, uscita, reload e cambio account.
7. Tastiera, mobile verticale/orizzontale, movimento ridotto e fallback WebGL.
8. Migrazioni applicate due volte su uno schema di prova esistente, senza perdita account.

PostgreSQL locale usa di default la porta host 5432. Se occupata, cambia sia `POSTGRES_PORT` sia la porta in `DATABASE_URL` e ricrea soltanto il container del progetto con Compose. Non eliminare il volume per risolvere errori di connessione.

## Limiti e GMAT

Per calcoli reali su Terra, Luna, Marte e Venere e fallback usa la [guida GMAT](gmat-integration-report.it.md). L'account serve per entrare nel gioco; GMAT resta opzionale.

I test locali non verificano firewall Azure, TLS, domini personalizzati, ripristino backup o credenziali distribuite. Lo smoke remoto della CI controlla risorse e `/api/auth/me`, non l'intero login o GMAT. Applica la migrazione 002 prima del deploy e verifica registrazione, persistenza dopo riavvio e isolamento ambienti in staging.
