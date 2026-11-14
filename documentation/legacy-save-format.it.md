[English](legacy-save-format.md) | **Italiano**

# Salvataggi locali e formato `gng32.save`

[Indice](README.it.md) · [Database account](authentication.it.md)

## Dove si trova la partita

La partita è un oggetto JavaScript serializzato in JSON nella chiave `localStorage['gng32.save']`. Il codice di riferimento è [`public/game/07-main.js`](../public/game/07-main.js), in particolare `newG()`, `save()` e `load()`.

Il nome del documento conserva il percorso storico, ma il salvataggio descritto è ancora quello usato dal gioco attuale. Il progetto dispone anche di PostgreSQL per gli account: **il DB non contiene una copia della partita**.

Il `localStorage` è legato all'origine e al profilo browser. `http://localhost:5173`, `http://localhost:8080` e un dominio HTTPS hanno archivi distinti. Anche browser diversi o profili diversi separano le partite. La persistenza aperta da `file://` dipende dal browser e non va considerata un sistema di sincronizzazione.

## Chiavi utilizzate

| Chiave | Contenuto |
| --- | --- |
| `gng32.save` | Stato principale di gioco |
| `gngLang` | Lingua selezionata, `it` oppure `en` |
| `gngQ` | Ultimo livello di qualità grafica |
| `gngPrev` | Copia temporanea della partita quando si entra nel tutorial da una partita esistente |

Le chiavi di gioco non sono credenziali. Il token account è gestito dal cookie `gng_session`, non da queste chiavi.

## Versione e struttura

`newG()` inizializza `v: 32`. `load()` restituisce il valore soltanto se riesce a interpretarlo come JSON e trova `v === 32`; altrimenti restituisce `null`. Il controllo della versione non valida ogni proprietà annidata.

| Campi iniziali | Significato |
| --- | --- |
| `v` | Versione del salvataggio, 32 |
| `co`, `flag`, `cedit`, `myBoard` | Nome agenzia, personalizzazione e stato interfaccia |
| `money`, `xp`, `sciTotal`, `staff` | Economia, esperienza, scienza e personale |
| `missions`, `cur` | Collezione missioni e indice selezionato |
| `world`, `plots`, `pad` | Campus, collocazioni e stato infrastrutture |
| `lab`, `labPos`, `rooms` | Laboratori, posizioni e stanze |
| `recruited`, `fresh` | Organizzazioni reclutate e stato degli sblocchi |
| `tut`, `tutDone` | Tutorial attivo e completamento |
| `speed`, `vt`, `lastReal` | Velocità, tempo simulato e riferimento temporale reale |

Altri campi, come modalità sandbox, difficoltà, avatar, equipaggio e musica, vengono aggiunti dai percorsi di interfaccia durante la partita. Non tutti sono presenti nell'oggetto iniziale.

Le missioni sono oggetti mutabili con campi facoltativi: requisiti, stakeholder, collocazione componenti, orbita, lanciatore, prove, fase operativa e rapporti. Anche risultati GMAT possono essere conservati nella missione. Questa guida non definisce uno schema esaustivo dei campi annidati: per una modifica occorre verificare anche chi legge e scrive il campo nel codice.

## Scrittura, caricamento e recupero

`save()` chiama `payPhase()` e poi serializza tutto `G`. Non è quindi una funzione puramente dedicata alla copia: prima della scrittura applica anche logica della fase economica.

Ogni scrittura sostituisce il valore precedente della chiave. Non sono presenti cronologia, salvataggi multipli o una transazione comune con PostgreSQL. Gli errori di serializzazione o di accesso allo storage vengono intercettati senza messaggio: quota esaurita o storage bloccato possono impedire la persistenza.

JSON illeggibile e versioni diverse vengono ignorati da `load()`. Se l'avvio fallisce successivamente, il codice mostra una schermata di recupero con l'opzione di ricominciare: quel percorso elimina le chiavi che iniziano con `gng` e svuota `sessionStorage`. La cancellazione dal menu principale ha un comportamento distinto e conserva `gngLang`.

Non c'è un migratore generale tra versioni. Non assumere che qualunque salvataggio storico sia compatibile solo perché il numero di versione è uguale.

## Backup manuale prima di intervenire

Dalla console sviluppatore del browser, **sulla stessa origine dove giochi**, puoi leggere:

```javascript
localStorage.getItem('gng32.save')
```

Copia il JSON restituito in un file di testo. Per ripristinare un backup v32, dopo averne verificato provenienza e contenuto:

```javascript
const backup = /* incolla qui l'oggetto JSON del tuo backup */;
if (backup?.v !== 32) throw new Error('Versione del salvataggio non supportata');
localStorage.setItem('gng32.save', JSON.stringify(backup));
location.reload();
```

Il ripristino sovrascrive la partita corrente di quell'origine; conserva prima anche una copia del valore esistente. Non incollare script ricevuti da fonti sconosciute nella console.

## Rapporto con gli account

Login, logout e cambio account non trasferiscono né cancellano il salvataggio. Due account nello stesso profilo e sulla stessa origine accedono alla stessa partita locale. Eliminare cookie non equivale a eliminare il salvataggio; eliminare i dati del sito può invece cancellare entrambi.

Un backup PostgreSQL conserva gli account, non le missioni. Un eventuale salvataggio cloud richiederà una nuova implementazione: associazione all'utente, API protette, gestione conflitti e migrazione dei dati locali.
