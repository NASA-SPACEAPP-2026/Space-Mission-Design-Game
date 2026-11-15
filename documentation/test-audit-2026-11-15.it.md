# Audit dei test — 15 novembre 2026

Branch: `test/full-code-audit-2026-11-15`, creato da `dev` al commit `00c7c93`.

## Risultati

- Suite iniziale: **85/85** test superati.
- Suite ampliata: **586/586** test superati in **13 file**, quindi **501 nuovi casi**.
- `npm run check`: superato con Node **24.22.3**, inclusi build e verifica dei bundle compressi.
- Browser reali: Chrome e Microsoft Edge headless, database PGlite e account temporanei.
- Stress: 200 richieste statiche simultanee, 120 letture di sessione parallele, 25 invii concorrenti dello stesso premio e 7 candidati per un solo posto nel consorzio.
- Upload: 30 richieste troppo grandi alternate tra autenticazione e consorzi, con verifica della sessione dopo ogni rifiuto.
- Fisica: 200 orbite su tutte le 10 destinazioni, con 6 anomalie per orbita; conservazione di energia e momento angolare, ricostruzione degli elementi, confronto con Hohmann.
- Sintassi: 40 file JavaScript/MJS e 6 script Bash verificati.
- Dipendenze: nessuna vulnerabilità nota segnalata da npm audit; anche l'installazione del provider di copertura ha concluso l'audit senza vulnerabilità.
- Pacchetto Azure locale: generato separatamente in `test-results/release-audit.zip`; verificati 248 elementi, moduli runtime, migrazioni, asset e riferimento al bundle finale. Include gli screenshot prodotti dallo smoke in `dist/`. Nessun `.env` o Vitest nell'archivio. Nessun deploy eseguito. L'installazione delle dipendenze dentro lo script Bash ha usato il Node 22 di sistema e ha emesso l'avviso sul requisito Node 24; suite e build sono state eseguite con Node 24.

## Difetti corretti

| Difetto | Riproduzione / effetto precedente | Correzione e verifica |
| --- | --- | --- |
| Negoziazione della compressione | `Accept-Encoding: br;q=0, gzip` riceveva Brotli; venivano ignorate anche le preferenze numeriche | Rispetto delle esclusioni e ordinamento per qualità; verifica dei contenuti decompressi, con file precompressi e compressione dinamica |
| IPv6 nel proxy GMAT | `2001:db8::1234` diventava `2001:db8:` e `::1` diventava `:` | Distinzione tra indirizzo IP, IPv4 con porta e IPv6 tra parentesi con porta |
| Parser GMAT permissivo | `dv1 dv2` diventava `[1,2]`, `NaN 2` diventava `[2]`, `.5` diventava `5`; accettate durate negative | Token numerici completi, controllo dei valori finiti e rifiuto di durate negative; recupero da risultati mancanti e cache verificati |
| Voti di un username valido | `__proto__` poteva registrarsi ma il suo voto non veniva memorizzato: missione congiunta ferma alla revisione | Scrittura come proprietà propria tramite chiave calcolata, anche nella demo; completamento verificato per `Alice`, `constructor` e `__proto__` |
| Soglia delle sfide economiche | Una missione di esattamente 400/1800 crediti riceveva punti pur essendo richiesta una spesa inferiore | Confronto stretto e testo coerente in API, pannello e demo |
| Risposte agli upload troppo grandi | Alcune richieste oltre il limite andavano in timeout invece di consegnare il JSON `413` | Uscita dall'iteratore senza distruggere il socket; drenaggio dopo la pulizia dell'iteratore, su auth, consorzi e proxy |
| Eccezioni del gestore HTTP | Un target come `//[` faceva fallire il parsing URL; un upload interrotto poteva produrre una promise rifiutata senza gestione | URL errati rispondono `400`; gestione delle eccezioni asincrone; verifica che il server rimanga raggiungibile dopo una disconnessione |
| Preferenza lingua ignorata | In Chrome, `localStorage.gngLang='it'` lasciava `window.gngLang='en'` | Lettura della preferenza salvata, inglese come default; verifiche browser di modulo italiano e persistenza dopo reload |

La prima esecuzione dei nuovi test mirati ha prodotto **21 fallimenti su 401 casi**, prima delle correzioni. Il relativo JSON è conservato in `test-results/regressions-before.json`.

Gli smoke esistenti erano inoltre obsoleti: cercavano l'illustrazione `#entry-art`, il pulsante di cambio login/registrazione e i vecchi controlli account. Sono stati aggiornati al menu attuale e al modulo unico, con attesa esplicita del reload di logout. Lo smoke include ora consorzi configurati sul server temporaneo, salvataggio della partita e ripresa dopo reload.

## Copertura misurata

Provider ufficiale `@vitest/coverage-v8`, aggiunto tra le dipendenze di sviluppo. Il perimetro è **solo** `backend/`, `server.mjs` e `scripts/gmat-bridge.mjs`.

| File / totale | Righe | Branch |
| --- | ---: | ---: |
| Totale | **94,59%** | **82,48%** |
| `backend/auth.mjs` | 96,15% | 86,31% |
| `backend/consortia.mjs` | 96,30% | 83,72% |
| `backend/database.mjs` | 100% | 100% |
| `server.mjs` | 84,73% | 76,60% |
| `scripts/gmat-bridge.mjs` | 100% | 80,28% |

Questa misura non equivale a coprire il 94,59% di tutto il gioco. Le funzioni classiche del frontend eseguite in VM, il rendering, i minigiochi e tutte le possibili sequenze di missione non hanno una percentuale complessiva misurata. I controlli browser coprono ingresso, gioco iniziale e persistenza, non una campagna completa.

## Problema ancora aperto

**L'export single-file non è autonomo e non permette l'ingresso al gioco da `file://`.**

Riprodotto generando `test-results/Go-No-Go.html` con `scripts/build-single-file.mjs` e aprendolo in Chrome:

- rimangono riferimenti assoluti a `/assets/index-*.js`, `/account.css` e `/account.js`;
- il browser fallisce il caricamento di questi asset;
- `typeof window.gngRequireAccount` è `undefined`;
- cliccando New game, il selettore delle modalità non compare.

L'evidenza è in `test-results/known-issues.json`. La copia diagnostica è stata generata con `--out`, senza copiare l'audio: il suo errore audio non è il difetto principale. La precedente evidenza della lingua in quel JSON è antecedente alla correzione.

Servono l'inclusione degli asset account nel generatore e una scelta esplicita sul funzionamento degli account offline: integrare i file da solo non rende disponibile l'API di autenticazione su `file://`. L'audit lascia questo problema segnalato e non aggira il controllo account.

## Limiti di verifica

- Docker non era in esecuzione: GMAT reale, integrazione con PostgreSQL esterno e ciclo di vita dei container non sono stati provati. Eseguibile GMAT simulato e PostgreSQL incorporato verificano percorsi applicativi diversi dall'infrastruttura reale.
- Il database PGlite serializza le transazioni. I test concorrenti verificano idempotenza e vincoli applicativi, ma non dimostrano l'assenza di deadlock tra connessioni di un PostgreSQL remoto.
- Azure, TLS di produzione, firewall, backup e restore richiedono prove su un ambiente di staging; nessuna risorsa remota è stata modificata.
- L'API scienza accetta punti e dati di missione dal client, entro i limiti previsti. L'audit verifica duplicati e validazione degli input, ma non dimostra l'integrità competitiva della classifica contro un client modificato.
- `documentation/entry-flow*.md` descrive ancora in parte il vecchio ingresso tramite splash; le guide dei test sono state aggiornate al comportamento corrente.

## Ripetere le verifiche

Con Node 24 o successivo, dalla radice del repository:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run test:coverage
$env:CHROME_PATH='C:\Program Files\Google\Chrome\Application\chrome.exe'
npm.cmd run smoke:account
$env:CHROME_PATH='C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
npm.cmd run smoke:account
```

`npm.cmd` evita il blocco di `npm.ps1` presente su questa installazione PowerShell. La versione Node 24 usata nell'audit è stata ottenuta temporaneamente con `npm.cmd exec --yes --package=node@24 -- node ...`, senza cambiare il Node installato nel sistema.

Il report HTML è `test-results/coverage/index.html`; risultati JSON, archivio e prove diagnostiche sono in `test-results/`, esclusa da Git. Gli screenshot sono in `dist/entry-*.png` e `dist/game-smoke.png`; una nuova build pulisce `dist/`.
