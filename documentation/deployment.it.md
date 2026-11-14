[English](deployment.md) | **Italiano**

# Distribuzione su Azure e pipeline CI/CD

[Indice](README.it.md) · [Configurazione DB](authentication.it.md) · [Verifiche](testing.it.md)

## Componenti da distribuire

L'applicazione principale comprende asset compilati e server Node. PostgreSQL è un servizio separato; GMAT è un ulteriore servizio opzionale. Il pacchetto Azure **non include il container GMAT** e `server.mjs` non inoltra `/api/gmat*`.

| Componente | Esecuzione |
| --- | --- |
| Frontend | File in `dist/`, serviti dal backend |
| HTTP e API account | Node.js 24+, comando `node server.mjs` |
| Account e sessioni | PostgreSQL configurato da `DATABASE_URL` |
| Calcoli GMAT | Container separato, da pubblicare e instradare esplicitamente |

Questa guida descrive script e workflow del repository. I nomi delle risorse generati, lo stato del deploy e i costi effettivi vanno verificati nell'account Azure.

## Branch e ambienti

| Evento | Comportamento della CI |
| --- | --- |
| PR verso `dev` o `main` | Installazione, test, build, verifica e packaging |
| Push su `dev` | Controlli e deploy nell'ambiente `staging` |
| Push su `main` | Controlli e deploy nell'ambiente `production` |
| Push su un branch di lavoro | Nessun deploy previsto da questo workflow |

Flusso consigliato: branch di lavoro → PR verso `dev` → collaudo staging → PR `dev` verso `main`. La creazione di `update-documentation` non pubblica automaticamente alcun sito.

## Contenuto della release

Dopo `npm run build`, `npm run package:azure` usa Bash e `zip` per creare `release.zip`:

```text
release.zip
  dist/                  HTML, bundle con hash, audio, font e file compressi
  server.mjs             Server HTTP e routing account
  backend/               Autenticazione e connessione PostgreSQL
  db/                    Schema SQL
  scripts/migrate.mjs    Comando per applicare lo schema
  package.json
  package-lock.json
  node_modules/          Dipendenze runtime installate con npm ci --omit=dev
```

Il packaging richiede una build già presente e valida la presenza degli asset essenziali. La CI lo esegue su Linux, così le dipendenze runtime sono installate nell'ambiente di packaging. Non è previsto un build remoto su App Service.

In Windows usa una shell con Bash, npm e `zip`, per esempio un ambiente WSL opportunamente configurato. Non è un comando PowerShell nativo.

## Provisioning iniziale

### 1. Applicazioni web e identità della pipeline

Leggi e poi esegui `infra/azure-setup.sh` in Bash con Azure CLI autenticata e permessi adeguati. Lo script definisce un gruppo risorse, due piani Linux e due Web App:

| Ambiente | Impostazione nello script |
| --- | --- |
| Staging | Piano F1, senza Always On |
| Produzione | Piano B1, Always On attivo |
| Regione predefinita | `westeurope` |
| Runtime predefinito | `NODE:24-lts` |
| Avvio | `node server.mjs` |

Le SKU sono scelte dello script, non una garanzia di disponibilità o prezzo. Il piano F1 ha limiti operativi e può sospendere l'app. Il provisioning crea risorse che possono generare costi.

Lo script configura HTTPS, `SCM_DO_BUILD_DURING_DEPLOYMENT=false`, `NODE_ENV=production`, un'applicazione Entra e credenziali federate GitHub OIDC per gli ambienti `staging` e `production`. Assegna il ruolo `Website Contributor` sul gruppo risorse e stampa i comandi per impostare le variabili GitHub.

### 2. Variabili GitHub

| Variabile | Ambito |
| --- | --- |
| `AZURE_CLIENT_ID` | Repository |
| `AZURE_TENANT_ID` | Repository |
| `AZURE_SUBSCRIPTION_ID` | Repository |
| `AZURE_RESOURCE_GROUP` | Facoltativa; predefinita `rg-space-mission-game` nel workflow |
| `AZURE_WEBAPP_NAME` | Specifica per ciascun GitHub Environment |

La pipeline usa OIDC per accedere ad Azure. Le credenziali DB non devono finire in queste variabili pubbliche di configurazione del workflow.

### 3. Database per ambiente

Dopo la creazione della Web App, esegui separatamente per ogni ambiente `infra/azure-database.sh`, impostando `RG`, `PG_SERVER`, `WEBAPP` e `PG_ADMIN_PASSWORD`. Non attivare il tracciamento dei comandi con segreti.

Lo script crea PostgreSQL 17 Flexible Server, database e regole firewall per gli IP di uscita possibili della Web App. Non configura automaticamente un accesso per la macchina che esegue le migrazioni. Staging e produzione devono usare database e credenziali separati.

### 4. Impostazioni App Service

| Impostazione | Valore richiesto |
| --- | --- |
| `DATABASE_URL` | Connessione PostgreSQL dell'ambiente, credenziali correttamente codificate nella URL |
| `DATABASE_SSL` | `true` |
| `APP_ORIGIN` | Origine HTTPS effettivamente visitata, senza slash finale |
| `NODE_ENV` | `production`, anche in staging ospitato |

Usa una gestione sicura dei segreti, eventualmente riferimenti Key Vault. La verifica del certificato TLS resta attiva. Il backend rifiuta configurazioni di produzione senza DB, con TLS disabilitato o origine HTTP.

### 5. Schema prima della release

Da un ambiente autorizzato a raggiungere PostgreSQL, imposta le variabili corrette ed esegui `npm run db:migrate`. Il comando carica anche `.env` se esiste: controlla di non puntare involontariamente al DB locale.

La migrazione va applicata **prima del deploy**, prima in staging e poi in produzione. Il provisioning, l'avvio Node e il workflow CI/CD attuale non la eseguono automaticamente. Vedi [limiti del migratore](authentication.it.md#avvio-e-migrazioni).

## Sequenza del workflow

`.github/workflows/ci-cd.yml`:

1. Esegue checkout, configura Node 24 e installa con `npm ci`.
2. Esegue `npm run check` e `npm run package:azure`.
3. Per i push pubblica l'artefatto temporaneo e avvia il job di deploy dell'ambiente.
4. Accede ad Azure tramite OIDC e distribuisce lo ZIP, con pulizia e comando di avvio `node server.mjs`.
5. Riavvia esplicitamente App Service.
6. Ritenta lo smoke test per gestire l'avvio a freddo.

Lo smoke remoto verifica sonda, compressione Brotli, ETag, HTML, `/api/auth/me`, bundle gioco, font e audio. Non registra utenti, non prova il flusso completo di login e non verifica GMAT. Il risultato di `/api/auth/me` senza cookie dimostra l'accesso alla tabella utenti, non l'intero contratto account.

Proteggi `dev` e `main` richiedendo PR e controlli. L'eventuale approvazione del deploy produzione si configura nel GitHub Environment.

## Cache e invalidazione

Il server assegna un anno di cache immutabile a `/assets/*`, `/audio/*` e `/fonts/*`, `no-cache` all'HTML e agli script `/game/*`, un'ora agli altri file. API e sonda hanno `no-store`.

Il bundle di gioco usa un hash nel nome; l'audio usa una versione nella URL. Per modifiche a file con nome stabile e cache lunga occorre prevedere una nuova URL o un'invalidazione coerente.

## Collaudo, rollback e diagnostica

Dopo il deploy verifica registrazione, accesso, uscita, persistenza dell'account dopo riavvio, separazione dati staging/produzione e gioco ospite. Controlla che un salvataggio preesistente sia ancora leggibile nella stessa origine. Per il flusso completo usa la [guida alle verifiche](testing.it.md).

In caso di errore:

| Sintomo | Verifica |
| --- | --- |
| Processo non avviato | Runtime Node, comando di avvio e variabili obbligatorie |
| Sonda positiva, account `503` | DB, DNS, firewall, certificati, credenziali e schema |
| Account `403` | `APP_ORIGIN`, dominio personalizzato e protocollo effettivo |
| HTML vecchio | Deploy effettivo, riavvio processo e URL del bundle |
| GMAT `404` | Hosting e instradamento del servizio separato |

Un rollback distribuisce una release applicativa precedente; non ripristina lo schema né i dati PostgreSQL. Valuta la compatibilità della release con lo schema e verifica backup e ripristino prima delle migrazioni. Non cancellare tabelle o volumi per risolvere un errore di connessione.

## Rimozione risorse

`infra/azure-teardown.sh` avvia l'eliminazione dell'intero gruppo risorse e rimuove un'applicazione Entra trovata per nome. È un'operazione distruttiva: include anche eventuali database nel gruppo. Verifica subscription, gruppo, identità e backup prima di eseguirla. Non elimina automaticamente risorse esterne a quel gruppo.
