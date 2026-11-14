[English](gmat-integration-report.md) | **Italiano**

# NASA GMAT: integrazione, avvio e limiti

[Indice](README.it.md) · [Architettura](architecture.it.md) · [Verifiche](testing.it.md)

## Scopo

Il servizio esegue NASA GMAT R2025a per verificare e approfondire il modello orbitale del gioco. Supporta Terra (`leo`), Luna (`moon`), Marte (`mars`) e Venere (`venus`). Il modello interno fornisce subito una stima; i risultati GMAT vengono integrati quando disponibili e la fonte resta visibile.

Il documento sostituisce il precedente resoconto di sviluppo: le misure storiche sono riportate come tali, senza presumere che siano state ripetute sul codice o sull'ambiente attuale. Non certifica la disponibilità del servizio sul sito pubblico.

## Componenti e flusso

| File | Ruolo |
| --- | --- |
| `public/game/02-orbit.js` | Calcoli locali e generatori degli script GMAT |
| `public/game/07-main.js` | Richieste, aggiornamento interfaccia e risultati nelle missioni |
| `scripts/gmat-server.mjs` | Endpoint HTTP e limite richieste |
| `scripts/gmat-bridge.mjs` | Validazione, code, cache, esecuzione e parser |
| `scripts/gmat-up.mjs` | Tentativo automatico di avvio prima di Vite |
| `docker/gmat/Dockerfile.base` | Ubuntu, distribuzione GMAT R2025a e Node |
| `docker/gmat/Dockerfile` | Immagine applicativa del bridge |
| `docker-compose.yml` | Servizio locale su porta 8787 |

Il browser invia dati numerici, non testo di script. Il bridge seleziona e valida i campi, crea file in una directory temporanea, esegue `GmatConsole`, interpreta i rapporti e restituisce JSON. Le directory vengono rimosse dopo l'elaborazione. La cache è in memoria e non usa PostgreSQL.

## Avvio riproducibile

Docker Desktop deve essere attivo. `npm run dev` esegue il tentativo automatico: prima cerca la base locale, poi tenta il pull da GHCR, infine una build locale. Gli errori non bloccano Vite.

Il repository contiene due file Compose: `compose.yaml` per PostgreSQL e `docker-compose.yml` per GMAT. Lo script automatico non specifica `-f`, quindi non basta assumere che selezioni il servizio corretto. Per preparare la base manualmente:

```powershell
docker pull --platform linux/amd64 ghcr.io/nasa-spaceapp-2026/smdg-gmat-base:r2025a
docker tag ghcr.io/nasa-spaceapp-2026/smdg-gmat-base:r2025a smdg-gmat-base:r2025a
```

Se il pull non è disponibile, costruisci invece la base dal Dockerfile:

```powershell
docker build --platform linux/amd64 -f docker/gmat/Dockerfile.base -t smdg-gmat-base:r2025a .
```

Quindi:

```powershell
docker compose -f compose.yaml -f docker-compose.yml up -d --build gmat
```

Il primo download NASA è di circa 420 MB. La piattaforma prevista è `linux/amd64`; su altre architetture può servire emulazione. `GMAT_BASE_REMOTE` permette allo script automatico di cambiare l'immagine remota.

Controlla `http://localhost:8787/healthz`, poi usa il gioco su Vite. Dopo modifiche ai file montati:

```powershell
docker compose -f compose.yaml -f docker-compose.yml restart gmat
docker compose -f compose.yaml -f docker-compose.yml logs --tail 100 gmat
```

Una modifica al Dockerfile richiede una ricostruzione, non il solo riavvio.

## API e gestione del carico

| Metodo e percorso | Funzione |
| --- | --- |
| `GET /healthz` | Sonda del servizio HTTP, `{ "ok": true }` |
| `POST /api/gmat` | ΔV delle tratte e dell'eventuale manovra di fine vita |
| `POST /api/gmat/analysis` | Eclissi, contatti ed evoluzione dell'orbita |
| `POST /api/gmat/lifetime` | Durata per scenario `nom`, `max`, `min` o `sail` |

Il server limita il corpo a 32 KiB e applica 90 richieste al minuto per peer TCP in memoria. I limiti sono distinti da quelli account in PostgreSQL. Risponde `400` a piani non validi, `413` a corpi troppo grandi, `429` al superamento della soglia, `503` a code piene e `502` agli errori di elaborazione.

Il bridge mantiene tre code separate, una per tipo di lavoro, ciascuna con una sola esecuzione attiva e al massimo cinque in attesa. Timeout: 30 secondi per trasferimenti, 120 per analisi e 240 per durata. I diversi tipi possono essere attivi contemporaneamente. La cache dei risultati è limitata e si perde al riavvio.

`GMAT_CONSOLE` indica il percorso dell'eseguibile nel bridge; `PORT` controlla la porta del servizio, predefinita 8787. La sonda HTTP non dimostra da sola che un vero calcolo GMAT riesca.

## Modelli e impatto sul gioco

| Corpo | Gravità | Perturbazioni e atmosfera |
| --- | --- | --- |
| Terra | JGM2 4×4 | Atmosfera Jacchia-Roberts |
| Luna | LP165P 20×20 | Terra e Sole, senza resistenza atmosferica |
| Marte | Mars50c 20×20 | Sole e atmosfera esponenziale |
| Venere | MGNP180U 20×20 | Sole, senza modello atmosferico di resistenza |

I trasferimenti usano targeting di manovre impulsive. Le analisi usano localizzatori di eclissi e contatti e propagazione orbitale; il bridge deriva mantenimento orbitale e variazioni degli elementi dai rapporti.

Le stazioni sono Milano, Svalbard e Canberra; l'uso nel gioco dipende anche dalle infrastrutture sbloccate. L'eclissi peggiore entra nel bilancio batteria; il decadimento contribuisce al mantenimento; la durata influenza revisioni e fine vita. La soglia dei cinque anni è una regola implementata nel gioco, non una dichiarazione di conformità normativa della missione.

I risultati sono mostrati nel bilancio orbitale, nei controlli di progetto, nelle revisioni e nei rapporti. I valori incorporati nella missione possono essere conservati nel salvataggio browser.

## Assunzioni e limiti scientifici

- Epoca di riferimento fissa al 1º gennaio 2027: il gioco non dispone di un calendario orbitale completo.
- Per la Terra, attività solare costante a livelli distinti, non una previsione del ciclo reale.
- Coefficiente di resistenza, area del satellite e vela sono parametri modellistici semplificati.
- Marte usa un'atmosfera esponenziale, non Mars-GRAM.
- Venere non ha resistenza atmosferica nel modello: il fine vita deriva dall'intersezione del pericentro con la soglia atmosferica.
- Coordinate delle stazioni approssimate e geometria dipendente dall'epoca.
- Distanze e tempi luce mostrati non sostituiscono automaticamente tutti i modelli locali di comunicazione.
- L'accordo fra due modelli a due corpi con manovre impulsive verifica coerenza numerica, non accuratezza rispetto a un volo reale.

Queste simulazioni hanno scopo didattico e non costituiscono validazione operativa di una missione.

## Risultati storici conservati

Il precedente resoconto riportava prove nel container, non ripetute per il solo aggiornamento documentale:

| Caso storico | Risultato riportato |
| --- | --- |
| Trasferimento LEO–GEO | 3856,5 contro 3856,6 m/s del modello locale |
| Cambio piano di 45° | Circa 5879 m/s per entrambi |
| GEO con cambio inclinazione | 4198,6 contro 4198,7 m/s |
| Trasferimento lunare | 1196,6 contro 1196,5 m/s |
| Orbita terrestre 400 km, 51,6° | Circa 36 minuti di eclissi massima e 11 km/mese di decadimento |
| Durata 3U a 400 km | 88 giorni nominali, 50 al massimo solare, 287 al minimo |
| Orbita eliosincrona a 600 km | Deriva nodale circa +0,99°/giorno |
| Luna, 100 km e 30° | Impatto dopo circa 11,4 giorni |
| Contatti da orbite lunari e marziane | Circa 400 minuti/giorno dalle stazioni modellate |
| Tempi di esecuzione | Trasferimenti circa 0,6 s, analisi circa 10 s, durata da secondi a circa un minuto nell'ambiente storico |

Sono esempi di regressione, non valori universali: massa, area, elementi orbitali, geometria e versione del modello contano. Le precedenti affermazioni sul numero totale di test o su workflow mai eseguiti non sono usate per descrivere lo stato corrente.

## Risorse educative e tracciabilità

Il gioco include una scala CML/MDL, i quattro segmenti di missione, un replay e confronti con MinXSS, RAVAN, CIRiS, MarCO, Lunar Flashlight e CAPSTONE. Dati e collegamenti dei confronti sono nella tabella `TWIN` di `public/game/07-main.js`.

La distribuzione NASA e i file dei modelli sono identificati nel Dockerfile base e nei generatori. Le etichette educative CML/MDL sono un adattamento del gioco: prima di citarle come terminologia ufficiale va fatta una verifica delle fonti originali. Le prove correnti sono descritte in [verifiche](testing.it.md).

## Pubblicazione

`.github/workflows/gmat-base-image.yml` costruisce e pubblica la base su GHCR su attivazione manuale o modifiche ai file previsti del workflow. Il repository definisce questo processo, ma non dimostra che una specifica immagine sia già disponibile o pubblica.

In sviluppo Vite gestisce il proxy. In Azure occorrono hosting del container e instradamento `/api/gmat*` sulla stessa origine; il pacchetto web attuale non li crea. In assenza del servizio il gioco continua con il modello interno.
