---
schema: clarification-answers/v1
status: submitted
generated_at: "2026-11-03T15:06:12.474Z"
scope: [frontend, backend, generic]
questions_file: clarification-questions.json
---

# Rearchitecture Clarification Answers

## 🖥️ Frontend

- **F1** Confermi PlayCanvas con TypeScript come base del nuovo client 3D, oppure vuoi cambiare motore/framework?
  - answer: PlayCanvas 2.12.x + TypeScript (stack attuale)
  - source: user
- **F2** Quale sistema UI vuoi per menu, pannelli di missione, HUD e interazioni, oltre alla scena 3D?
  - answer: Tailwind CSS con componenti accessibili custom
  - source: user
- **F3** La pagina browser condivisa e il gioco originale sono i riferimenti da replicare? Aggiungi eventuali screenshot o registrazioni di schermate/attività che devono essere ricostruite in 3D.
  - answer: Pagina condivisa in questa sessione: http://localhost:5173/; gioco di riferimento: Go-No-Go.html. Integrare screenshot/registrazioni aggiuntivi se necessari.
  - source: user
- **F4** Quale direzione visiva deve guidare il nuovo gioco e la sua HCI?
  - answer: Definire un nuovo design system professionale per una simulazione spaziale NASA-like
  - source: user
- **F5** Quale standard di accessibilità vuoi adottare per menu, HUD, dialoghi e controlli?
  - answer: WCAG 2.2 AA
  - source: user
- **F6** Quali browser e dispositivi devono supportare il gioco 3D?
  - answer: Includere anche browser e GPU mobili
  - source: user
- **F7** Quale strategia di layout e controllo vuoi? Il movimento FPS WASD/mouse è principalmente desktop; su mobile servirebbero controlli touch dedicati.
  - answer: Esperienza completa desktop e mobile con controlli touch
  - source: user
- **F8** Quali lingue devono essere disponibili nel gioco e nell'interfaccia?
  - answer: Italiano e inglese (lingue già presenti nel gioco originale)
  - source: user
- **F9** Preferisci una libreria per lo stato del client, o mantenere uno stato TypeScript leggero con lo stato missione persistito via API?
  - answer: Stato TypeScript/PlayCanvas minimale + stato missione via API
  - source: user
- **F10** Il gioco deve restare una singola applicazione a pagina unica o vuoi rotte dedicate per sezioni/account?
  - answer: Rotte dedicate per menu, profilo e missioni
  - source: user

## ⚙️ Backend

- **B1** Confermi Node.js/TypeScript con Express 5 per i microservizi, o vuoi adottare un framework backend diverso?
  - answer: Node.js + TypeScript + Express 5 (servizio attuale)
  - source: user
- **B2** Come trattiamo l'API esistente e i nuovi endpoint dei microservizi? Al momento il backend espone solo /api/health.
  - answer: can break
  - source: user
- **B3** Come vuoi gestire i salvataggi gng32.save già presenti nel browser quando il gioco passa alla persistenza online MySQL?
  - answer: new schema: nuovo schema MySQL e importazione una tantum del salvataggio browser, solo con consenso
  - source: user
- **B4** Per salvare le missioni online e ritrovarle tra dispositivi, quale identità deve usare il giocatore?
  - answer: Email e password con gestione sicura delle credenziali
  - source: user
- **B5** Hai obiettivi per latenza, disponibilità e numero di giocatori simultanei? Se non sono definiti, si può partire da un baseline misurabile e adeguarlo dopo il deploy.
  - answer: match current production baseline; no regression
  - source: default applied

## 📋 General

- **G1** Confermi questa definizione di successo o vuoi aggiungere criteri verificabili?
  - answer: Ricostruire in 3D tutte le attività e i flussi Go-No-Go esistenti, con astronauta controllabile in prima persona, HCI professionale, menu iniziale e caricamento/salvataggio MySQL online; verificare i flussi con test end-to-end.
  - source: user
- **G2** Ci sono funzioni del gioco, moduli, sistemi o comportamenti che non devono essere toccati?
  - answer: no explicit exclusions; agent will infer from project structure
  - source: default applied
- **G3** Quale politica vuoi per i test e i comportamenti già presenti?
  - answer: must pass
  - source: user
- **G4** Confermi che il refactoring va fatto in-place nel repository attuale, mantenendo il frontend e il backend sotto app/?
  - answer: in-place: repository attuale, frontend e backend sotto app/
  - source: user
- **G5** Aggiungi eventuali vincoli non coperti sopra: suddivisione desiderata dei microservizi, hosting/cloud provider o regione, requisiti operativi e ogni dettaglio che vuoi preservare.
  - answer: None beyond the decisions listed in this specification.
  - source: user
