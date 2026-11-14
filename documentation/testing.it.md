[English](testing.md) | **Italiano**

# Test e verifiche del progetto

[Indice](README.it.md) · [Avvio](../README.it.md) · [Distribuzione](deployment.it.md)

## Controllo standard

Con Node.js 24+ e dipendenze installate:

```powershell
npm ci
npm run check
```

`check` esegue in sequenza Vitest, build di produzione e `scripts/verify-build.mjs`. Se una fase fallisce, le successive non vengono eseguite. Non richiede un database PostgreSQL esterno né il vero GMAT per la suite ordinaria.

## Cosa coprono i test

| File | Ambito |
| --- | --- |
| `tests/content.test.mjs` | Contratto HTML, ordine degli script, salvataggio, risorse e renderer |
| `tests/server.test.mjs` | Server file, sonda, cache, compressione, HEAD, fallback e percorsi non validi |
| `tests/auth.test.mjs` | Schema, password, univocità, sessioni, cookie, origine, limiti ed errori |
| `tests/gmat.test.mjs` | Generazione script GMAT, validazione e interpretazione risultati |
| `tests/gmat-bridge.test.mjs` | Bridge con eseguibile simulato, code e gestione risultati |

I test account utilizzano **PGlite**, PostgreSQL incorporato come dipendenza di sviluppo. È temporaneo e distinto da `compose.yaml`. I test con GMAT simulato non certificano che l'immagine Docker scarichi ed esegua il programma NASA nell'ambiente corrente.

Per eseguire solo la suite automatica usa `npm test`; per la sola compilazione usa `npm run build`.

## Smoke browser del gioco

Occorrono build, server in esecuzione e Chrome/Chromium. In un terminale:

```powershell
npm run build
node --env-file-if-exists=.env server.mjs
```

In un altro terminale:

```powershell
$env:BASE_URL = 'http://localhost:8080'
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
npm run smoke
```

Adatta `CHROME_PATH` all'eseguibile realmente installato. `BASE_URL` è facoltativa: il valore predefinito è `http://localhost:8080`. Lo script prova l'avvio dell'interfaccia e segnala errori della pagina o della console. Non equivale a completare tutte le missioni.

## Smoke browser degli account

Dopo `npm run build`:

```powershell
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/smoke-account.mjs
```

Lo script avvia autonomamente un server temporaneo su porta libera e un DB PGlite, crea un account di prova ed esegue registrazione, ricaricamento, logout e login. Controlla cookie `HttpOnly`/`SameSite` e visibilità del dialogo con viewport mobile. Non usa gli utenti del database Docker o Azure e non richiede `BASE_URL`.

## Verifica manuale PostgreSQL locale

1. Avvia il servizio con `docker compose -f compose.yaml up -d --wait postgres`.
2. Configura `.env`, applica `npm run db:migrate` e avvia API e Vite.
3. Registra un utente e prova duplicati di username/email con maiuscole diverse.
4. Prova una password errata e verifica un errore senza esposizione di dettagli interni.
5. Ricarica la pagina, apri Account e verifica la sessione.
6. Esci, poi accedi usando prima username e poi email.
7. Riavvia il backend e verifica che l'account resti disponibile.
8. Controlla che il salvataggio locale sia uguale dopo logout o cambio account.

Non cancellare il volume per ripetere questi controlli su dati da conservare.

## Verifica manuale GMAT

Avvia il servizio con i file Compose espliciti come nella [guida GMAT](gmat-integration-report.it.md). Controlla `http://localhost:8787/healthz`, poi usa il gioco tramite Vite.

Prova trasferimenti, analisi e durata per Terra, Luna, Marte e Venere. Verifica la fonte mostrata per i risultati, la risposta a modifiche dell'orbita e il recupero dopo un calcolo fallito. Ripeti una prova senza servizio per controllare il modello interno. Un risultato storico nel documento GMAT non sostituisce questa verifica sull'ambiente corrente.

## Verifica grafica e salvataggi

Controlla campus, stanze, editor, minigiochi, tutorial e ricaricamento della partita. Prova viewport mobile, WebGL disponibile e indisponibile, `?q=0`, `?q=3`, `?perf=1` e preferenza di movimento ridotto. Le prove grafiche automatiche attuali non coprono esaustivamente ogni combinazione.

Prima di testare recupero o cancellazione della partita, conserva una copia di `gng32.save`. I reset dell'interfaccia possono eliminare più chiavi del solo salvataggio.

## Cosa resta da provare in staging

La CI locale non verifica certificati PostgreSQL, firewall Azure, credenziali distribuite, domini personalizzati, persistenza dopo riavvio della Web App o ripristino backup. Lo smoke remoto della pipeline controlla risorse e una query account, ma non completa registrazione/login né prova GMAT. Questi controlli richiedono il vero ambiente destinazione.
