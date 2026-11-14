# Challenge: Space Mission Design Game

[Indice](README.md) · [Funzionalità e avvio](../README.md)

## Obiettivo educativo

Progettare una missione spaziale significa bilanciare obiettivi scientifici, veicolo, strumenti, lanciatore, orbita, massa, potenza, costo, dati, comunicazioni e durata. Migliorare un parametro può peggiorarne altri: uno strumento più potente può aumentare valore scientifico, consumi, massa e dati da trasmettere.

La challenge propone un gioco interattivo nel quale una persona o un gruppo possa definire una missione, gestire risorse limitate, simularne l'esecuzione e capire le ragioni del risultato. Il valore didattico è rendere concreti i compromessi fra sottosistemi e consentire di sperimentare, fallire e riprogettare.

Questa è una rielaborazione del brief già presente nel repository, non una verifica degli aggiornamenti ufficiali dell'evento. Per materiali e aggiornamenti esterni va consultata la sezione Resources della pagina ufficiale della challenge.

## Percorso atteso

1. Definire obiettivi e requisiti prima delle scelte tecniche.
2. Progettare veicolo e payload scientifico.
3. Scegliere lanciatore, destinazione e orbita.
4. Verificare massa, energia, budget, dati, comunicazioni e durata.
5. Simulare la missione e valutare risultato, efficienza e valore scientifico.
6. Modificare il progetto sulla base del rapporto finale.

Non dovrebbe esistere una sola soluzione perfetta: configurazioni diverse possono soddisfare obiettivi diversi. Il feedback deve spiegare le conseguenze delle decisioni.

## Considerazioni progettuali

| Ambito | Aspettative della challenge |
| --- | --- |
| Esperienza | Interfaccia chiara, tutorial, difficoltà e scenari progressivi |
| Requisiti | Obiettivi espliciti e vincoli realistici coerenti |
| Satellite | Struttura, energia, batterie, comunicazioni, computer, assetto e strumenti |
| Payload | Massa, costo, potenza, produzione dati e ritorno scientifico |
| Orbite | Copertura, finestre, contatti e durata dipendenti dalla scelta orbitale |
| Lancio | Compatibilità fra massa, destinazione e capacità del lanciatore |
| Risorse | Indicatori comprensibili di massa, potenza, denaro, dati e tempo |
| Valutazione | Prestazioni, efficienza e qualità delle decisioni, con spiegazioni |
| Collaborazione | Possibile cooperazione fino a quattro partecipanti con ruoli distinti |

La collaborazione può distribuire responsabilità di scienza, veicolo, comunicazioni e risorse mantenendo decisioni finali condivise. È un obiettivo del brief, non una garanzia di multiplayer disponibile.

## Idee aggiuntive del brief

Scenari multipli, eventi imprevisti, modelli semplificati o realistici, visualizzazioni interattive, pannelli di controllo, rapporti finali, confronto tra progetti, classifiche, cooperazione, competizione fra gruppi, sandbox e analisi post-missione sono possibili estensioni. La loro presenza nel brief non implica che siano tutte implementate.

## Corrispondenza con il progetto attuale

| Tema | Stato nel repository |
| --- | --- |
| Progettazione e risorse | Dati, regole, configurazione satellite e bilanci nel browser |
| Esperienza visuale | Campus, stanze, editor 3D e viste 2D/SVG |
| Progressione | Requisiti, revisioni, test, lancio e rapporti |
| Tutorial e sperimentazione | Tutorial e modalità sandbox |
| Orbite approfondite | GMAT opzionale e modello locale alternativo |
| Identità | Registrazione e login PostgreSQL |
| Persistenza missione | Salvataggio locale nel browser, senza cloud |
| Cooperazione online e classifiche | Nessun backend multiplayer o leaderboard implementato |

Account, simulazione GMAT e salvataggio locale sono componenti distinti. Per il funzionamento tecnico leggi [architettura](architecture.md), [database](authentication.md) e [GMAT](gmat-integration-report.md).
