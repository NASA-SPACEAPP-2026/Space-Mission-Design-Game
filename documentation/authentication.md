# Account e database

> **Nuovo ingresso:** introduzione, registrazione con solo username e password, poi accesso diretto al campus. Email ora facoltativa: applicare anche `002-username-accounts.sql` con `npm run db:migrate`. [Guida IT](entry-flow.it.md) · [English](entry-flow.md).

## Mappa concettuale

```mermaid
flowchart TD
  A[Giocatore] --> B[Gioco nel browser]
  B --> C[Account: registrazione, accesso, uscita]
  C -->|HTTPS, JSON, stessa origine| D[API Node su Azure App Service]
  D --> E[Validazione e limiti ai tentativi]
  E --> F[PostgreSQL Flexible Server]
  F --> U[users: profilo e hash password]
  F --> S[sessions: hash token e scadenza]
  F --> L[auth_limits: contatori condivisi]
  D -->|Cookie HttpOnly, Secure, SameSite| B
  B --> P[Partite in localStorage: gng32.save]
```

Le credenziali sono gestite dal backend del progetto. Entra External ID non è
utilizzato: questa implementazione consente accesso con username oppure email.
Il database è PostgreSQL anche in sviluppo; SQLite non è necessario.

## Modello dati

```mermaid
erDiagram
  users ||--o{ sessions : possiede
  users {
    uuid id PK
    text username "univoco senza distinzione maiuscole"
    text email "univoca senza distinzione maiuscole"
    text password_hash "scrypt, sale casuale"
    timestamptz created_at
  }
  sessions {
    text token_hash PK
    uuid user_id FK
    timestamptz expires_at
  }
  auth_limits {
    text key PK "SHA256 della chiave del limite"
    integer attempts
    timestamptz expires_at
  }
```

Schema iniziale: [001-auth.sql](../db/001-auth.sql); [002-username-accounts.sql](../db/002-username-accounts.sql) rende email facoltativa. Il migratore applica entrambi i file in ordine. Il comando di migrazione è
idempotente e transazionale. Per modifiche future aggiungere migrazioni versionate:
non cambiare semplicemente questo schema per trasformare tabelle già esistenti.

Username: 3–24 caratteri ASCII, lettere, numeri e underscore. Password: 15–128
caratteri, senza troncamenti. Hash scrypt con N=32768, r=8, p=3, sale di 16 byte e
chiave di 64 byte. Nel DB non sono memorizzate password leggibili.

La sessione dura sette giorni; il browser riceve 32 byte casuali in formato hex e
il DB conserva solo SHA256 del token. Login e registrazione sostituiscono la sessione
corrente, logout la revoca. La scadenza è verificata a ogni richiesta autenticata.
La cancellazione di un utente cancella le sue sessioni tramite foreign key.

## Avvio locale

Prerequisiti: Node 24 e Docker Desktop avviato. In PowerShell usare `npm.cmd` se
l'esecuzione degli script PowerShell è disabilitata.

```powershell
npm.cmd ci
docker compose up -d --wait
Copy-Item .env.example .env
npm.cmd run db:migrate
npm.cmd run dev:api
```

In un secondo terminale eseguire `npm.cmd run dev` e aprire
`http://localhost:5173`. Vite inoltra `/api` alla porta 8080 del backend.
La schermata iniziale richiede registrazione o login prima di avviare il gioco.
Il backend serve il gioco compilato quando si usa `npm run build`.
Per provarlo direttamente sulla porta 8080 impostare `APP_ORIGIN=http://localhost:8080`
nel `.env`, riavviare il backend e aprire quell'indirizzo.

Le credenziali in compose e `.env.example` sono esclusivamente locali.
Non eseguire `docker compose down -v` se si vogliono conservare gli account locali.

## Contratto API

| Endpoint | Metodo | Input / risultato |
| --- | --- | --- |
| `/api/auth/register` | POST | `{username,password}` → 201, utente e cookie; email facoltativa per compatibilità |
| `/api/auth/login` | POST | `{login,password}` → 200, utente e cookie |
| `/api/auth/me` | GET | 200, `{user}` oppure `{user:null}` |
| `/api/auth/logout` | POST | revoca sessione e cancella cookie |

I POST richiedono `Origin` uguale a `APP_ORIGIN`; registrazione e login richiedono
`Content-Type: application/json`. Non viene abilitato CORS. Le risposte non sono
memorizzabili in cache. Hash, token e password non sono restituiti nel JSON.
Errori: 400 input non valido, 401 credenziali errate, 403 origine errata,
409 duplicato, 413 oltre 4 KiB, 415 formato errato, 429 limite, 503 DB indisponibile.

Limiti condivisi nel DB: 10 tentativi per identificativo login, 100 richieste
registrazione/login per indirizzo di rete del peer, 30 registrazioni globali in
15 minuti. Il backend non si fida di `X-Forwarded-For` arbitrario: su App Service
il limite del peer potrebbe essere condiviso fra visitatori dietro il proxy.
Per traffico pubblico elevato configurare anche un limite al bordo e adeguare
le soglie alle esigenze; non fidarsi degli header inoltrati senza definire proxy fidati.

## Azure: risorse e configurazione

Eseguire il provisioning separatamente per staging e produzione, con server,
credenziali e database separati. Non usare dati reali in staging.
Lo script crea risorse a pagamento: controllare il preventivo Azure della regione.

1. Installare Azure CLI ed eseguire `az login`.
2. In Bash impostare `RG`, `PG_SERVER` (nome univoco), `WEBAPP` e
   `PG_ADMIN_PASSWORD`; opzionali `LOCATION`, `PG_ADMIN`, `PG_DATABASE`.
   Eseguire `bash infra/azure-database.sh`. Non abilitare `set -x`.
3. Lo script crea PostgreSQL 17 Flexible Server Burstable B1ms, 32 GiB e backup
   di sette giorni, aprendo il firewall solo agli IP di uscita possibili della Web App.
   Le policy della subscription possono richiedere altre SKU o rete privata.
4. Da una macchina autorizzata nel firewall applicare lo schema con
   `npm run db:migrate`. Usare una connessione TLS e poi rimuovere l'eventuale
   regola temporanea per la macchina amministrativa. Il provisioning non applica
   automaticamente lo schema SQL.
5. Configurare le impostazioni della Web App, preferibilmente con riferimenti Key Vault:

| Impostazione | Produzione / staging |
| --- | --- |
| `DATABASE_URL` | `postgresql://USER:PASSWORD_URL_ENCODED@SERVER.postgres.database.azure.com:5432/gng` |
| `DATABASE_SSL` | `true` |
| `APP_ORIGIN` | `https://NOME-APP.azurewebsites.net`, senza slash finale; usare il dominio effettivo visitato |
| `NODE_ENV` | `production` anche per staging ospitato |

La verifica del certificato TLS è attiva. `DATABASE_SSL=false` è consentito solo
in locale; il server rifiuta di avviarsi in produzione senza DB o senza origine HTTPS.
Non aggiungere segreti Git, variabili Vite o stringhe DB nel frontend.
Separare l'utente amministratore/migrazioni dall'utente applicativo: a quest'ultimo
assegnare CONNECT al DB, USAGE allo schema e SELECT/INSERT/UPDATE/DELETE sulle tre
tabelle. Il runtime non richiede privilegi CREATE né accesso ad altri database.

La release include `backend/`, `db/`, lo script di migrazione, il lockfile e le
dipendenze di produzione, installate su Linux nella CI. Le migrazioni devono essere
applicate **prima** del deploy; non si eseguono automaticamente all'avvio del processo.
`/api/health` rimane una sonda di processo; lo smoke test account controlla anche
che il DB/schema siano raggiungibili.

## Flusso Git e collaudo

`main → nuovo branch → PR verso dev → prova sul web staging → PR dev verso main`.
Non fare merge diretto del branch su main. Le stesse migrazioni vanno applicate
prima a staging, poi a produzione dopo i test, con backup verificato. Il rollback
del codice non cancella utenti né ripristina automaticamente il DB.

`npm run check` esegue test e build. I test account utilizzano PGlite (PostgreSQL
incorporato, solo dipendenza di sviluppo) e verificano SQL, unicità, password,
cookie, login, rotazione, logout, scadenza, CSRF e limiti. Non sostituiscono una
prova della connettività TLS e del firewall sul vero Azure PostgreSQL.

Il test browser opzionale si avvia con `node scripts/smoke-account.mjs` dopo la
build. Impostare `CHROME_PATH` al percorso di Chrome/Chromium; usa un database
temporaneo PGlite e non tocca account reali.

In staging: creare un account, riavviare la Web App e verificare il login;
controllare email/username duplicati, password errata, logout, browser separato,
mobile, ingresso obbligatorio e assenza di regressioni nei salvataggi locali.

## Gestione operativa e limiti attuali

Programmare giornalmente con un job amministrativo:

```sql
DELETE FROM sessions WHERE expires_at <= now();
DELETE FROM auth_limits WHERE expires_at <= now();
```

Gli utenti sono registrati nel DB e identificabili per ID; non c'è una pagina admin.
Non sono inclusi verifica email, recupero password via email, cancellazione account
self-service, MFA e salvataggio cloud. L'email raccolta non dimostra il possesso
della casella. Definire informativa, tempi di conservazione e gestione delle richieste
degli utenti prima di raccogliere account reali; non aggiungere consensi marketing impliciti.

I salvataggi restano locali e condivisi fra account nello stesso profilo browser:
logout non li cancella e il login non li sincronizza. Su computer condivisi questo
comportamento va considerato prima di introdurre partite associate agli account.

## Riferimenti

- [Azure PostgreSQL](https://learn.microsoft.com/en-us/azure/postgresql/overview)
- [Limiti dei volumi App Service per SQLite](https://learn.microsoft.com/en-us/azure/app-service/containers/how-to-serve-content-from-azure-storage)
- [Node crypto / scrypt](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback)
