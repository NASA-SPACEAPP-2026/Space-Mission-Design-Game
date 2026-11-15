[English](entry-flow.md) | **Italiano**

# Ingresso al gioco e account con username

## Esperienza

All'apertura appare un'introduzione Go No-Go con l'illustrazione originale restituita da `artSVG('title')`. La schermata resta visibile fino al clic o all'attivazione da tastiera, poi viene controllata la sessione. Se valida, si entra nel campus. Altrimenti compare la creazione account, con passaggio al login per chi è già registrato.

La registrazione chiede soltanto username (3–24 lettere ASCII, cifre o underscore) e password (1–128 caratteri). Il pulsante mostra/nascondi aiuta l'inserimento. Il modulo resta disponibile in caso di errore e non permette l'ingresso se il servizio account è indisponibile. Non è previsto un accesso ospite dalla schermata iniziale.

Dopo registrazione o accesso, il gioco si avvia direttamente nel campus. Una nuova agenzia usa lo username come nome; un salvataggio locale esistente viene conservato. Il menu del gioco resta disponibile durante la partita per scegliere altre modalità, tutorial e impostazioni. Il pulsante Account permette di uscire: dopo la revoca della sessione la pagina ricarica l'ingresso.

Il flusso supporta italiano e inglese secondo `gngLang`, viewport mobili, tastiera e movimento ridotto. La schermata di ingresso non impone la rotazione del telefono; il gioco mantiene le proprie indicazioni di orientamento.

## File e avvio

- `index.html`: schermate iniziali statiche, visibili prima dell'avvio del gioco.
- `public/account.css`: stile, responsive e animazioni.
- `public/account.js`: controllo sessione, introduzione, form, richieste e logout.
- `public/game/07-main.js`: condivide l'illustrazione e avvia il gioco all'evento `gng-authenticated`, una sola volta.
- `backend/auth.mjs`: accetta registrazione senza email; mantiene la compatibilità con email già esistenti.

La schermata è un controllo dell'esperienza di ingresso, non un sistema di protezione degli asset statici. Le API verificano le sessioni sul server. Le missioni rimangono locali: non vengono associate o sincronizzate all'account.

## Migrazione obbligatoria

Prima di usare la registrazione senza email:

```powershell
docker compose -f compose.yaml up -d --wait postgres
npm run db:migrate
npm run dev:api
# In un secondo terminale:
npm run dev
```

Configurare prima `.env` da `.env.example`, conservando eventuali impostazioni esistenti. Aprire l'origine configurata in `APP_ORIGIN`, normalmente `http://localhost:5173`.

Il migratore applica nell'ordine `001-auth.sql` e `002-username-accounts.sql` dentro una transazione. La seconda migrazione rimuove soltanto `NOT NULL` da `users.email`: mantiene email, password e sessioni già esistenti. Gli indici univoci restano validi e permettono più email `NULL`. Non vengono generate email fittizie. Entrambe le migrazioni sono ripetibili e non esiste ancora un registro delle versioni applicate.

In un ambiente già attivo applicare la migrazione prima di distribuire il nuovo backend. Il programma non la esegue all'avvio. La registrazione API usa ora `{username,password}`; il campo email resta facoltativo per compatibilità e l'accesso API con email esistente continua a funzionare.

La porta host di PostgreSQL è configurabile con `POSTGRES_PORT` (default `5432`). Se scegli `15432`, aggiorna anche la porta in `DATABASE_URL` e riesegui `docker compose -f compose.yaml up -d --wait postgres`. Il `.env` locale non va committato.

## Verifiche

`npm run check` esegue test, build e verifica del bundle. I test account coprono anche registrazioni senza email, più utenti senza email, unicità senza distinzione di maiuscole e compatibilità dei login precedenti.

Per il browser:

```powershell
npm run build
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/smoke-account.mjs
```

Lo smoke usa un DB PGlite temporaneo e verifica illustrazione, permanenza della schermata e avanzamento al clic, registrazione, ingresso diretto, ripristino sessione, logout, password errata, servizio indisponibile, cookie e mobile. Le immagini di verifica sono in `dist/entry-splash.png`, `dist/entry-register.png` e `dist/entry-mobile.png`.

`npm run smoke` contro un server già attivo richiede ora `GNG_USERNAME` e `GNG_PASSWORD` di un account di test esistente; non inserire credenziali reali nei file o nei commit.
