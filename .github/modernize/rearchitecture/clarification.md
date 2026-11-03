---
schema: clarification/v1
generated_at: "2026-11-03T15:08:38.384Z"
scope:
  - frontend
  - backend
  - generic
clarity_score: 0.96
rounds: 1
gaps:
  - nfr.sla
  - out_of_scope
blocking_gaps: []
---

# Scenario Clarification

## Frontend

- **Target framework**: PlayCanvas 2.12.x + TypeScript.
- **Component library**: Tailwind CSS con componenti accessibili custom.
- **Screenshots**: La pagina browser condivisa `http://localhost:5173/` e `Go-No-Go.html` sono i riferimenti; integrare eventuali schermate mancanti se necessario.
- **Design system**: Nuovo design system professionale per una simulazione spaziale NASA-like.
- **Accessibility**: WCAG 2.2 AA.
- **Browser targets**: Includere anche browser e GPU mobili.
- **Responsive strategy**: Esperienza completa desktop e mobile con controlli touch.
- **i18n locales**: Italiano e inglese.
- **State management**: Stato TypeScript/PlayCanvas minimale + stato missione via API.
- **Routing**: Rotte dedicate per menu, profilo e missioni.

## Backend

- **Target framework**: Node.js + TypeScript + Express 5.
- **API contract preservation**: Breaking change consentite.
- **Data migration strategy**: Nuovo schema MySQL e importazione una tantum del salvataggio browser, solo con consenso.
- **Auth framework**: Email e password con gestione sicura delle credenziali.
- **SLA targets**: Match current production baseline; no regression (default applicato; baseline di produzione da definire).

## Generic

- **Success definition**: Ricostruire in 3D tutte le attività e i flussi Go-No-Go esistenti, con astronauta controllabile in prima persona, HCI professionale, menu iniziale e caricamento/salvataggio MySQL online; verificare i flussi con test end-to-end.
- **Out of scope**: No explicit exclusions; saranno dedotte dalla struttura del progetto (default applicato).
- **Existing test posture**: Must pass.
- **Output location**: In-place nel repository attuale, frontend e backend sotto `app/`.
- **Additional constraints**: Nessun vincolo ulteriore oltre alle decisioni raccolte. La richiesta successiva specifica che il gioco deve funzionare in una pagina web ben fruibile e che l'avvio del backend con `npm run dev` mostri un output professionale a tema spazio.

## Gaps & Defaults Applied

gaps:
  - id: nfr.sla
    resolution: default
    default_used: "match current production baseline; no regression"
    note: "Non è stato fornito un baseline di produzione né un target numerico."
  - id: out_of_scope
    resolution: default
    default_used: "no explicit exclusions; agent will infer from project structure"

blocking_gaps: []

## Downstream Usage Notes

- Tutte le decisioni non elencate nei gap sono state fornite dall'utente.
- Il baseline SLA e le esclusioni sono assunzioni operative; non bloccano la progettazione, ma vanno esplicitate nei requisiti.
- Il deploy pubblico non può essere eseguito senza la scelta del provider, le credenziali e la configurazione dei servizi; implementare prima un'esecuzione locale riproducibile e un percorso di deploy documentato.
