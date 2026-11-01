# Space Mission Design Game

## 🚀 Come clonare il progetto

### Prerequisiti
- [Git](https://git-scm.com/) installato

### Clonazione
```bash
git clone https://github.com/NASA-SPACEAPP-2026/Space-Mission-Design-Game.git
cd Space-Mission-Design-Game
```

### (Opzionale) Aprire il progetto in VS Code
```bash
code .
```

---

## 🌌 Descrizione della challenge

Progettare una missione spaziale richiede di bilanciare esigenze in competizione tra loro: obiettivi scientifici, design del veicolo, strumenti, lanciatore, budget, potenza, massa, comunicazioni e vincoli orbitali.

Questa challenge consiste nel creare un **gioco interattivo** che permetta ai partecipanti di:
- progettare una missione spaziale completa;
- gestire risorse limitate;
- simulare l’esecuzione della missione;
- valutare come ogni scelta influenzi il successo finale.

L’obiettivo educativo è rendere concreti i trade-off ingegneristici, spesso trattati solo in modo teorico.

---

## 📚 Contesto (Background)

Le missioni spaziali sono sistemi complessi in cui obiettivi scientifici, requisiti tecnici, risorse disponibili e vincoli operativi devono convivere.

Durante la progettazione, decisioni su:
- spacecraft,
- strumenti scientifici,
- lancio e orbita,
- potenza, massa, comunicazioni,
- costo e durata della missione,

sono fortemente interdipendenti. Migliorare un aspetto può peggiorarne altri (es. strumento più potente = più valore scientifico, ma anche più massa, consumo energetico, volume dati e costo).

Oggi molti strumenti didattici coprono solo singoli aspetti (orbite, razzi, sottosistemi) senza mostrare l’integrazione dell’intera missione. Questo crea un gap tra conoscenza dei concetti e capacità di prendere decisioni sistemiche.

Un gioco interattivo può colmare questo gap, consentendo ai partecipanti di sperimentare, sbagliare, iterare e apprendere.

---

## 🎯 Obiettivi della soluzione

Realizzare uno **Space Mission Design Game** in cui un giocatore singolo o un team (fino a 4 persone) possa:

1. Definire obiettivo e requisiti della missione  
2. Progettare spacecraft e payload scientifico  
3. Selezionare lanciatore e orbita  
4. Gestire vincoli su budget, massa, potenza, comunicazioni, dati e durata  
5. Simulare la missione e valutarne il risultato

Una soluzione solida dovrebbe includere:
- interfaccia utente chiara;
- sistema di configurazione della missione;
- meccaniche di gestione risorse;
- supporto single-player e/o multiplayer (fino a 4);
- simulazione e sistema di valutazione/scoring.

Il gioco dovrebbe premiare:
- performance di missione,
- valore scientifico,
- efficienza nell’uso delle risorse,
- qualità delle decisioni,
- collaborazione del team.

---

## 🧩 Considerazioni progettuali (Potential Considerations)

### 1) Design del gioco ed esperienza utente
- Accessibilità per diversi livelli di competenza.
- Modalità singola e cooperativa (fino a 4 partecipanti).
- Ruoli distinti nel team (es. pianificazione, spacecraft, scienza, comunicazioni, risorse).
- Obiettivi chiari e feedback comprensibili sui motivi di successo/fallimento.
- Possibilità di modificare il design e rieseguire simulazioni multiple.
- Sistema di punteggio con livelli/scenari di difficoltà differenti.

### 2) Mission design
- Definizione dell’obiettivo prima delle scelte tecniche.
- Ogni decisione deve avere conseguenze esplicite.
- Assenza di “soluzione perfetta unica”: combinazioni diverse possono funzionare.
- Vincoli realistici su budget, massa, potenza, comunicazioni e lifetime.

### 3) Spacecraft e payload
- Componenti possibili: struttura, power system, batterie, comunicazioni, computer di bordo, controllo d’assetto, strumenti scientifici.
- Strumenti con attributi variabili: massa, consumo, costo, dati generati, valore scientifico.
- Scelta tra componenti semplici/avanzati in base alla difficoltà.

### 4) Orbita e lancio
- Opzioni orbitali multiple con caratteristiche spiegate in modo semplice.
- Impatto dell’orbita su copertura, finestre osservative, comunicazioni e durata missione.
- Lanciatori con capacità, costi e capacità orbitali differenti.
- Verifica di compatibilità tra massa totale, orbita scelta e lanciatore.

### 5) Resource management
Risorse principali da visualizzare in modo chiaro:
- **Massa**: massa totale spacecraft + payload
- **Potenza**: energia disponibile per sistemi e strumenti
- **Budget**: risorse economiche di sviluppo/operazione
- **Dati**: volume dati generato dagli strumenti
- **Comunicazioni**: capacità di trasmettere dati a terra
- **Tempo**: durata pianificata di sviluppo e operazioni

È utile evidenziare quali risorse sono critiche per ciascuno scenario.

### 6) Collaborazione
- Fino a 4 partecipanti sulla stessa missione.
- Responsabilità diverse ma decisioni finali condivise.
- Situazioni di negoziazione tra priorità concorrenti.
- Risultato finale dipendente dal coordinamento del team.

### 7) Valore educativo
- Spiegazioni semplici dei concetti scientifici/ingegneristici.
- Introduzione graduale di temi complessi (altitudine orbitale, payload capacity, data rate, ecc.).
- Tutorial brevi, indicatori visivi, risorse didattiche opzionali.
- Focus sul “perché” una decisione influisce sulle prestazioni.

---

## 💡 Funzionalità aggiuntive suggerite

- Scenari multipli con obiettivi differenti  
- Eventi random o vincoli inattesi  
- Modelli spacecraft realistici o semplificati  
- Visualizzazioni interattive del veicolo  
- Dashboard missione in tempo reale  
- Leaderboard / ranking missioni  
- Report finale post-simulazione  
- Salvataggio, condivisione e confronto design missione  
- Modalità cooperativa (fino a 4)  
- Modalità competitiva tra team su stesso obiettivo  
- Sandbox mode senza vincoli predefiniti  
- Analisi post-missione con motivazioni di successo/fallimento

---

## 📎 Risorse

Per dataset, materiali e aggiornamenti ufficiali della challenge, fare riferimento alla tab **Resources** della pagina dell’hackathon.

