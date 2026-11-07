(function(){
'use strict';
const $=(q,el)=>(el||document).querySelector(q), $$=(q,el)=>Array.from((el||document).querySelectorAll(q));
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nf=(x,d)=>Number(x).toLocaleString('it-IT',{maximumFractionDigits:d==null?1:d}), keur=x=>nf(Math.round(x),0)+' cr', pct=x=>Math.round(x*100)+'%';
const P=E.PARTS, PEO=L.PEOPLE, CELL=64, ACC=E.ACC;
const phn=m=>PHN[m&&m.phase==='D'&&m.ready?'E':m&&m.phase]||'';
const PHN={'0':'Fase 0','A':'Fase A','B':'Fase B','C':'Fase C','D':'Fase D','E':'Fase E','F':'Fase F','done':'Completata'};
let G=null, view='hub', sel=null, raf=0, teleTick=0; const evShown={};

/* ---------- salvataggio ---------- */
function payPhase(){ if(!G||G.tut||G.sandbox||!G.missions) return; G.missions.forEach(M=>{ if(M.tut) return; const ph=M.phase==='D'&&M.ready?'E':M.phase; if(['A','B','C','D','E'].indexOf(ph)<0) return; M.payd=M.payd||[]; if(M.payd.indexOf(ph)>=0) return; M.payd.push(ph); const p=Math.round(G.staff*SAL); if(p>0){ G.money-=p; setTimeout(()=>{ toast('Stipendi della '+PHN[ph]+' di '+M.name+': −'+keur(p)+' ('+G.staff+' dipendenti).'); hud(); },1400); } }); }
function save(){ payPhase(); try{ localStorage.setItem('gng32.save',JSON.stringify(G)); }catch(e){} }
function load(){ try{ const g=JSON.parse(localStorage.getItem('gng32.save')||'null'); if(g&&g.v===32) return g; }catch(e){} return null; }
function now(){ return G.vt; }
function clock(){ const r=Date.now(); G.vt+=(r-G.lastReal)*G.speed; G.lastReal=r; }
const cur=()=>G.missions[G.cur];

/* ---------- audio ---------- */
let AC=null; const mute=()=>G&&G.mute;
function tone(f,t,type,g,w){ if(mute()) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); const o=AC.createOscillator(),a=AC.createGain(),n=AC.currentTime+(w||0); o.type=type||'triangle'; o.frequency.value=f; a.gain.setValueAtTime(g||.05,n); a.gain.exponentialRampToValueAtTime(.0001,n+t); o.connect(a); a.connect(AC.destination); o.start(n); o.stop(n+t); }catch(e){} }
const sfx={tap:()=>tone(520,.05,'triangle',.04),put:()=>{tone(300,.06,'square',.04);tone(450,.08,'triangle',.04,.05);},ok:()=>{tone(660,.09);tone(880,.14,'triangle',.05,.08);},bad:()=>tone(130,.28,'sawtooth',.05),
  stamp:()=>{tone(85,.2,'square',.08);tone(523,.25,'triangle',.05,.14);tone(659,.25,'triangle',.05,.22);tone(784,.45,'triangle',.05,.3);},cash:()=>{tone(988,.08,'square',.03);tone(1319,.15,'square',.03,.08);},leave:()=>{tone(392,.15);tone(330,.15,'triangle',.05,.15);tone(262,.3,'triangle',.05,.3);}};
/* ---------- lingua: italiano / inglese ---------- */
const LANG=(()=>{ try{ const v=localStorage.getItem('gngLang'); if(v==='it'||v==='en') return v; }catch(e){} return /^it/i.test(navigator.language||'it')?'it':'en'; })();
const I18N=(()=>{ const RAW=`Prima torna al campus: tocca la casetta.	First go back to the campus: tap the house.
Apri il pannello di sinistra: tocca il tasto evidenziato.	Open the left panel: tap the highlighted button.
Apri il pannello di destra: tocca il tasto evidenziato.	Open the right panel: tap the highlighted button.
Schermo intero	Full screen
Schermo intero non disponibile qui.	Full screen is not available here.
(in fase D)	(in phase D)
(piano {n}D)	({n}D plan)
+ Installa macchinario	+ Install machine
+ Nuova orbita	+ New orbit
, di cui	, of which
, ma pagano a rate, alle revisioni.	, but they pay in instalments, at the reviews.
: Tempesta solare, Radio muta, Baricentro alto.	: Solar storm, Silent radio, High centre of mass.
: Tempesta solare, Radio muta.	: Solar storm, Silent radio.
: da lì segui il lancio con l’ente terzo.	: from there you follow the launch with the third-party provider.
; l’assemblaggio in camera bianca richiede {n} s.	; assembly in the clean room takes {n} s.
==== FINE MISSIONE	==== END OF MISSION
==== LANCIO di {s}	==== LAUNCH of {s}
A bordo	On board
A {n} km il satellite sembra fermo nel cielo. Lunga strada da un rilascio in GTO.	At {n} km the satellite seems still in the sky. A long way from a GTO release.
A {n} km l’atmosfera lo frena: rientrerà entro {n} anni.	At {n} km the atmosphere slows it down: it will re-enter within {n} years.
AGGANCIO RADIO {n}%	RADIO LOCK {n}%
ANTENNE {n}/{n}	ANTENNAS {n}/{n}
ATMOSFERA TERRESTRE	EARTH’S ATMOSPHERE
Acceleratore di calcolo per il payload	Payload computing accelerator
Accensione {n}	Burn {n}
Accessori	Accessories
Accetta	Accept
Accumula energia per l’eclisse e distribuisce la corrente	Stores energy for the eclipse and distributes power
Adesso parla lo staff tecnico: i suoi sono requisiti di sistema (SYS). Accetta.	Now the technical staff speaks: theirs are system requirements (SYS). Accept.
Aerofrenata	Aerobraking
Agenzia	Agency
Agenzia Spaziale Alpina	Alpine Space Agency
Agenzia Spaziale Mediterranea	Mediterranean Space Agency
Agenzia spaziale	Space agency
Al freddo in eclisse: mettilo accanto a computer o radio, o scaldalo.	Cold in eclipse: place it next to the computer or radio, or heat it.
Al laboratorio prove: i requisiti chiedono la prova di vibrazione. Tocca l’edificio sulla mappa.	To the test lab: the requirements ask for the vibration test. Tap the building on the map.
Al laboratorio prove: i requisiti chiedono la prova di vibrazione: prima torna al campus con la casetta in basso a destra.	To the test lab: the requirements ask for the vibration test: first go back to the campus with the house button at the bottom right.
Al tavolo siedono la NASA (finanzia), la tua scienziata e l’ente regolatore. Siediti per ascoltare le loro richieste.	At the table sit NASA (the funder), your scientist and the regulator. Sit down to hear their requests.
Al tuo livello non hai ancora propulsori: il satellite resta dove lo lascia il razzo.	At your level you have no thrusters yet: the satellite stays where the rocket leaves it.
Albero	Tree
Ali grandi per un {n}U	Large wings for a {n}U
Ali solari HaWK di BioSentinel	BioSentinel HaWK solar wings
Ali solari dispiegabili ad alta potenza	High-power deployable solar wings
Ali solari dispiegabili per CubeSat e piccoli satelliti.	Deployable solar wings for CubeSats and small satellites.
Ali solari dispiegabili {n}U	Deployable solar wings {n}U
Ali solari modulari ad alta potenza, volate su BioSentinel.	Modular high-power solar wings, flown on BioSentinel.
Ali solari sottili e flessibili	Thin flexible solar wings
Ali solari sottili e flessibili.	Thin flexible solar wings.
Altre classi	Other classes
Amplificatore in banda Ka	Ka-band amplifier
Amplificatore in banda Ka per CubeSat: più dati per ogni passaggio.	Ka-band amplifier for CubeSats: more data per pass.
Analisi orbitale	Orbit analysis
Analisi orbitale di {s}	Orbit analysis of {s}
Annulla	Cancel
Antenna a molla STACER	STACER spring antenna
Antenna a molla che si estende da sola dopo il rilascio.	Spring antenna that extends by itself after release.
Antenna di comunicazione	Communication antenna
Antenna integrata nel pannello (ISARA)	Panel-integrated antenna (ISARA)
Antenna piatta integrata nel pannello solare: più dati senza ingombro.	Flat antenna integrated in the solar panel: more data without bulk.
Antenne	Antennas
Apocentro	Apoapsis
Apri	Open
Assemblaggio finito. Tocca il satellite sulla postazione per portarlo al laboratorio prove.	Assembly finished. Tap the satellite on its station to take it to the test lab.
Assetto	Attitude
Assetto con ruote di reazione	Reaction-wheel attitude control
Assetto integrato XACT	XACT integrated attitude unit
Assetto magnetico	Magnetic attitude control
Assicurazione	Insurance
Assicurazioni Orbitali	Orbital Insurance
Associazione	Association
Assumi	Hire
Autorizzazioni e detriti	Licences and debris
Avanti	Next
Avanti: orbite in dettaglio →	Next: detailed orbits →
Avanti: progetta il satellite →	Next: design the satellite →
Avionica	Avionics
Bacheca online	Online board
Bahrein	Bahrain
Banco shock	Shock bench
Bandiera	Flag
Basta un’orbita stabile: conta provare la tecnologia	A stable orbit is enough: what matters is testing the technology
Batteria	Battery
Batteria al litio metallico	Lithium-metal battery
Batteria e distribuzione {n} Wh	Battery and distribution {n} Wh
Batteria in un’orbita	Battery over one orbit
Batteria litio-zolfo	Lithium-sulfur battery
Batterie	Batteries
Batterie litio-zolfo: più energia per chilo e lunga vita.	Lithium-sulfur batteries: more energy per kilo and a long life.
Benvenuto	Welcome
Benvenuto! Questa prima missione è guidata. Entra nell’edificio amministrativo: la NASA ti aspetta. Tocca l’edificio sulla mappa.	Welcome! This first mission is guided. Enter the administration building: NASA is waiting for you. Tap the building on the map.
Bilancia di massa	Mass balance
Bilancio della fase F	Phase F balance
Bipropellente a pompa per nanosatelliti	Pump-fed bipropellant for nanosatellites
Bobine magnetiche e sensori solari: il satellite non ruota più a caso	Magnetic coils and sun sensors: the satellite no longer spins at random
Brasile	Brazil
Bravo! Hai chiuso il tutorial.	Well done! You finished the tutorial.
Budget stretto e più difetti nascosti	Tight budget and more hidden defects
Bunker di lancio	Launch bunker
Bus dati ad alta velocità resistente alle radiazioni.	Radiation-hardened high-speed data bus.
Bus dati resistente alle radiazioni	Radiation-hardened data bus
Calibratore lunare ARCSTONE	ARCSTONE lunar calibrator
Calorimetro per raggi cosmici	Cosmic-ray calorimeter
Calorimetro per raggi cosmici costruito all’università.	Cosmic-ray calorimeter built at a university.
Cambia	Change
Cambia missione	Change mission
Camera anecoica	Anechoic chamber
Camera bianca	Clean room
Camera termovuoto	Thermal-vacuum chamber
Cancella	Delete
Cartella	Folder
Cartella missioni e bacheca	Missions folder and board
Cartella: missioni concluse e bacheca	Folder: completed missions and board
Catalogo sponsor	Sponsor catalogue
Categorie	Categories
Celle solari incollate sulle facce: economiche, poca potenza	Solar cells glued on the faces: cheap, little power
Celle solari leggere IMM	IMM lightweight solar cells
Celle solari leggere, efficienti e resistenti alle radiazioni.	Light, efficient, radiation-hardened solar cells.
Celle sulle facce di un {n}U	Body-mounted cells for a {n}U
Centro R&D	R&D centre
Centro di dinamica del volo	Flight dynamics centre
Centro visitatori	Visitor centre
Cerca per nome, settore o tecnologia	Search by name, sector or technology
Cerca un pezzo	Search for a part
Cerca un pezzo…	Search for a part…
Che missione vuoi fare?	What mission do you want to fly?
Che satellite costruisci?	What satellite will you build?
Chi lancia	Launch provider
Chi siede al tavolo?	Who sits at the table?
Chiede: 	Asks: 
Affidabilità e costi sotto controllo	Reliability and costs under control
Ali roll-out SolarRoll	SolarRoll roll-out wings
Assetto Gyrolab	Gyrolab attitude unit
Batteria allo stato solido	Solid-state battery
Camera iperspettrale	Hyperspectral camera
Computer FPGA tollerante	Fault-tolerant FPGA computer
Comunicazioni veloci	Fast communications
Margini di energia	Energy margins
Ottica dispiegabile Lumen	Lumen deployable optics
Prestazioni e leggerezza	Performance and low mass
Propulsione ionica a bordo	On-board ion propulsion
Rete di cattura Grappler	Grappler capture net
Scienza di qualità	Quality science
Terminale ottico laser	Laser optical terminal
Chiudi	Close
Chiudi la riunione	Close the meeting
Chiudi la riunione per andare in revisione.	Close the meeting to go to review.
Chiudi la riunione: segue la revisione SRR.	Close the meeting: the SRR review follows.
Classe ESPA, fino a circa {n} kg	ESPA class, up to about {n} kg
Classifica mondiale	World ranking
Codice di telemetria, scorrevole	Telemetry code, scrollable
Codice telemetria	Telemetry code
Collegamento ad alta velocità	High-speed link
Collegamento semplice con le stazioni di terra	Simple link with the ground stations
Come vai nello spazio	How you get to space
Commissioning chiuso: tutti i sottosistemi rispondono.	Commissioning closed: all subsystems respond.
Completata	Completed
Componenti	Components
Compositi leggeri che schermano dalle radiazioni i piccoli satelliti.	Lightweight composites that shield small satellites from radiation.
Compra i pezzi e assembla	Buy the parts and assemble
Compri un posto su un lander commerciale: il tuo CubeSat diventa uno strumento sul suolo lunare.	You buy a seat on a commercial lander: your CubeSat becomes an instrument on the lunar surface.
Computer SpaceVPX per immagini	SpaceVPX imaging computer
Computer che si autoripara RadPC	RadPC self-healing computer
Computer che si corregge da solo dagli errori causati dalle radiazioni.	Computer that corrects radiation-induced errors by itself.
Computer da smartphone (PhoneSat)	Smartphone computer (PhoneSat)
Computer di bordo	On-board computer
Computer di bordo doppio	Dual on-board computer
Computer per elaborare immagini in formato standard SpaceVPX, provato sulla Stazione spaziale.	Image-processing computer in the SpaceVPX standard, tested on the Space Station.
Computer tollerante alle radiazioni	Radiation-tolerant computer
Comunicazioni	Communications
Con il Go gli stakeholder versano la terza rata:	With the Go the stakeholders pay the third instalment:
Consumato dal piano	Used by the plan
Conta misurare sia vicino sia lontano: il centro della fascia è il compromesso. In basso l’atmosfera frena il satellite: più ΔV ogni mese.	Measuring both near and far matters: the middle of the band is the compromise. Low down the atmosphere slows the satellite: more ΔV every month.
Continua	Continue
Conto alla rovescia… decollo!	Countdown… lift-off!
Controllo termico attivo per nanosatelliti	Active thermal control for nanosatellites
Controllo termico attivo per nanosatelliti.	Active thermal control for nanosatellites.
Controproposta: «Costo ≤ {n} crediti»	Counter-proposal: «Cost ≤ {n} credits»
Controproposta: «Durata ≥ {n} mesi»	Counter-proposal: «Duration ≥ {n} months»
Controproposta: «Margine di massa ≥ {n}%»	Counter-proposal: «Mass margin ≥ {n}%»
Controproposta: «Prova di vibrazione superata»	Counter-proposal: «Vibration test passed»
Convertitore di potenza al carburo di silicio	Silicon-carbide power converter
Conviene accendere il motore agli apsidi, a {n}° o a {n}°: lì tutta la spinta va nella forma dell’orbita. I cambi di piano costano meno dove il satellite va più piano, cioè all’apocentro.	It pays to fire the engine at the apsides, at {n}° or {n}°: there all the thrust goes into the shape of the orbit. Plane changes cost less where the satellite moves slowest, i.e. at apoapsis.
Convoca la riunione	Call the meeting
Corea del Sud	South Korea
Costo	Cost
Costo contenuto	Low cost
Costo entro la cassa	Cost within the budget
Costo ≤ {n} crediti	Cost ≤ {n} credits
Costo ▲	Cost ▲
Crea la missione	Create the mission
Crea la tua prima missione	Create your first mission
Crea la tua prima missione con il tasto + in alto.	Create your first mission with the + button at the top.
CubeSat {n}U. Porta i pezzi dentro la struttura e rispetta i requisiti. Trascina lo sfondo per girare il satellite; doppio tocco su un pezzo per ruotarlo.	CubeSat {n}U. Drag the parts into the structure and meet the requirements. Drag the background to turn the satellite; double-tap a part to rotate it.
DATI SCIENTIFICI	SCIENCE DATA
DATI {n}%	DATA {n}%
Dal rilascio all’orbita di lavoro ★	From release to the working orbit ★
Dalla Terra all’orbita	From Earth to orbit
Danno alla missione	Damage to the mission
Dati	Data
Dati al giorno	Data per day
Decollo nominale con rideshare in orbita bassa. Rotta verso Terra.	Nominal lift-off with a low-orbit rideshare. Heading to Earth orbit.
Decorazione: rende il campus più bello.	Decoration: makes the campus nicer.
Destinazione	Destination
Destinazione Marte	Destination Mars
Destinazione Venere	Destination Venus
Destinazione orbita terrestre	Destination Earth orbit
Destinazioni su Luna	Destinations at the Moon
Destinazioni su Marte	Destinations at Mars
Destinazioni su Terra	Destinations at Earth
Destinazioni su Venere	Destinations at Venus
Detriti	Debris
Dettagli	Details
Detumbling completato con le bobine magnetiche.	Detumbling completed with the magnetic coils.
Difficile	Hard
Dimostrazione tecnologica	Technology demonstration
Dipendenti	Staff
Dipendenti / posti auto	Staff / parking spaces
Disegna cosa fa il satellite, dove e in che ordine, fino alla fine della missione. Puoi tornare qui quando vuoi durante la fase B, senza costi.	Draw what the satellite does, where and in which order, up to the end of the mission. You can come back here whenever you like during phase B, at no cost.
Dissipatore carbonio-alluminio	Carbon-aluminium heat sink
Doccia d’aria	Air shower
Dopo il piano: mantenimento e fine vita	After the plan: station-keeping and end of life
Dosimetro di radiazione	Radiation dosimeter
Dove vuoi andare?	Where do you want to go?
Downlink laser TBIRD	TBIRD laser downlink
Downlink laser ad altissima velocità su un CubeSat.	Very-high-speed laser downlink on a CubeSat.
Due accensioni agli apsidi. È la via più economica.	Two burns at the apsides. It is the cheapest way.
Due ali che si aprono in orbita: tripla potenza	Two wings that open in orbit: triple power
Due computer: se uno si blocca, lavora l’altro	Two computers: if one hangs, the other works
Due radio: una di riserva	Two radios: one spare
Durata totale	Total duration
Durata ≥ {n} mesi	Duration ≥ {n} months
E se…?	What if…?
Ecco la revisione di fine missione (MCR): scienza raccolta, rate e cosa è successo. Chiudila.	Here is the mission close-out review (MCR): science collected, instalments and what happened. Close it.
Eclisse	Eclipse
Eclisse di {n} minuti: Eclisse passata senza danni.	{n}-minute eclipse: Eclipse passed without damage.
Edifici	Buildings
Edificio amministrativo	Administration building
Edificio di costruzione	Assembly building
Edificio di testing	Test building
Educazione	Education
Elaborazione autonoma delle immagini (IPEX)	Autonomous image processing (IPEX)
Elaborazione autonoma delle immagini a bordo.	Autonomous on-board image processing.
Electrospray a impulso specifico variabile: più spinta o più efficienza, a scelta.	Variable specific-impulse electrospray: more thrust or more efficiency, as you choose.
Electrospray a impulso variabile	Variable-impulse electrospray
Electrospray a tessere TILE	TILE tiled electrospray
Electrospray di precisione PETA	PETA precision electrospray
Electrospray microfluidico	Microfluidic electrospray
Electrospray per lo spazio profondo	Deep-space electrospray
Elettrodo al litio metallico per batterie ad alta densità di energia.	Lithium-metal electrode for high-energy-density batteries.
Emirati Arabi Uniti	United Arab Emirates
Energia	Energy
Ente regolatore	Regulator
Ente terzo	Third party
Era una prova: non dà punti, non va in bacheca e la tua agenzia riparte da {n} cr, come se l’avessi saltato. Da adesso le missioni sono vere: le richieste cambiano ogni volta e decidi tu.	It was a trial: it gives no points, does not go on the board and your agency restarts from {n} cr, as if you had skipped it. From now on missions are real: the requests change every time and you decide.
Esci dal laboratorio e vai all’	Leave the lab and go to the 
Esito	Outcome
Esperimento tecnologico	Technology experiment
Europa	Europe
FASCIA OBIETTIVO	TARGET BAND
Fabbrica	Factory
Facile	Easy
Fai decidere all’autopilota	Let the autopilot decide
Fase A	Phase A
Fase B	Phase B
Fase B, passo {n}: nel Centro di dinamica del volo disegna la missione (DRM).	Phase B, step {n}: in the flight dynamics centre draw the mission (DRM).
Fase B: esci e vai al Centro di dinamica del volo per disegnare la missione (DRM).	Phase B: go out to the flight dynamics centre to draw the mission (DRM).
Fase B: vai al Centro di dinamica del volo per disegnare la missione (DRM). Tocca l’edificio sulla mappa.	Phase B: go to the flight dynamics centre to draw the mission (DRM). Tap the building on the map.
Fase B: vai al Centro di dinamica del volo per disegnare la missione (DRM): prima torna al campus con la casetta in basso a destra.	Phase B: go to the flight dynamics centre to draw the mission (DRM): first go back to the campus with the house button at the bottom right.
Fase C	Phase C
Fase C: il progetto si congela. Entra nell’edificio di costruzione. Tocca l’edificio sulla mappa.	Phase C: the design is frozen. Enter the assembly building. Tap the building on the map.
Fase C: il progetto si congela. Entra nell’edificio di costruzione: prima torna al campus con la casetta in basso a destra.	Phase C: the design is frozen. Enter the assembly building: first go back to the campus with the house button at the bottom right.
Fase C: progetto congelato. Con la revisione CDR compri i pezzi.	Phase C: design frozen. With the CDR review you buy the parts.
Fase C: puoi ancora ritoccare la quota e la strategia; il lancio è già prenotato.	Phase C: you can still tweak the altitude and the strategy; the launch is already booked.
Fase D	Phase D
Fase E	Phase E
Fase F: la missione ha raggiunto la durata promessa. Il controllo missione chiude le operazioni e prepara il rientro.	Phase F: the mission has reached the promised duration. Mission control closes operations and prepares the re-entry.
Fase {n}	Phase {n}
Fasi E e F	Phases E and F
Felicità della squadra	Team happiness
Finanza	Finance
Fine	End
Fine fase A	End of phase A
Fine fase B	End of phase B
Fine fase C	End of phase C
Fine fase D	End of phase D
Fine fase F	End of phase F
Fine fase {n}	End of phase {n}
Fine modifica	Done editing
Fine vita (fase F)	End of life (phase F)
Flight Readiness Review: le prove sono superate. Dai il GO.	Flight Readiness Review: the tests are passed. Give the GO.
Fonda la tua agenzia spaziale	Found your space agency
Fondazione	Foundation
Fondazione Torino Spazio	Turin Space Foundation
Fondo	Fund
Freddo e vuoto dell’eclisse. Se il difetto vola: un pezzo resta al freddo in eclisse.	Cold and vacuum of the eclipse. If the defect flies: a part stays cold in eclipse.
Generazione ≥ {n} W	Generation ≥ {n} W
Gestione dei guasti	Fault management
Getti di gas compresso: piccole correzioni	Cold-gas jets: small corrections
Giappone	Japan
Gioca	Play
Giornale di missione	Mission log
Giroscopi a controllo di momento	Control moment gyroscopes
Giroscopi a controllo di momento: tanta coppia e poche vibrazioni per puntare in fretta.	Control moment gyroscopes: lots of torque and little vibration to point quickly.
Gli stakeholder versano la seconda rata,	The stakeholders pay the second instalment,
Gli stakeholder. Quello che accetti diventa un requisito di missione. Tocca lo schermo dei requisiti per rileggerli.	The stakeholders. What you accept becomes a mission requirement. Tap the requirements screen to read them again.
Griglia	Grid
Guarda avanti, evita le nuvole e punta lo strumento dove serve.	Looks ahead, avoids clouds and points the instrument where needed.
Guarda le stelle per sapere dove punta	Looks at the stars to know where it points
Hai fatto tutte le fasi di una missione vera: requisiti con gli stakeholder (fase {n}), satellite e requisiti di sistema (A), orbita e lancio (B), costruzione (C), assemblaggio e prove (D), volo (E) e chiusura (F).	You went through every phase of a real mission: requirements with the stakeholders (phase {n}), satellite and system requirements (A), mission, satellite and orbit (B), design freeze and parts (C), assembly and tests (D), flight (E) and close-out (F).
Hai i requisiti di missione. Chiudi la riunione: segue la revisione MDR.	You have the mission requirements. Close the meeting: the MDR review follows.
Hai scelto «Misura» ({n} scienza	You chose «Measure» ({n} science
Hai scelto «Reset a freddo» ({n}% torna	You chose «Cold reset» ({n}% comes back
Hai un campus, {n} cr e nessun satellite. La NASA finanzia il tuo primo CubeSat e ti apre il suo catalogo di tecnologie: si parte con poche carte, le altre si sbloccano salendo di livello.	You have a campus, {n} cr and no satellite. NASA funds your first CubeSat and opens its technology catalogue to you: you start with a few cards, the others unlock as you level up.
Hardware autonomo che studia come un lievito si adatta al volo spaziale.	Autonomous hardware that studies how yeast adapts to spaceflight.
I NOSTRI PARTNER	OUR PARTNERS
I carichi del lancio. Se il difetto vola: un meccanismo si allenta: scienza {n}%, a volte il satellite si perde.	Launch loads. If the defect flies: a mechanism comes loose: science {n}%, sometimes the satellite is lost.
I punti esperienza arrivano dalle revisioni superate, dai lanci e dalle missioni chiuse. Ogni livello sblocca qualcosa di nuovo.	Experience points come from passed reviews, launches and closed missions. Every level unlocks something new.
I tecnici stanno assemblando il satellite in camera bianca, pezzo dopo pezzo. Aspetta qualche secondo.	The technicians are assembling the satellite in the clean room, part by part. Wait a few seconds.
Il budget è quello: il satellite, razzo compreso, non deve superare {n} crediti.	The budget is fixed: the satellite, rocket included, must not exceed {n} credits.
Il campus della tua agenzia	Your agency’s campus
Il cervello del satellite: componenti commerciali	The satellite’s brain: commercial components
Il compromesso di {s}: vicino e lontano dalla superficie.	The {s} compromise: near and far from the surface.
Il computer di bordo comanda tutto il satellite. Toccalo.	The on-board computer controls the whole satellite. Tap it.
Il computer di bordo non risponde più dopo la tempesta solare.	The on-board computer no longer responds after the solar storm.
Il computer di bordo non risponde più dopo la tempesta solare. Scienza {n}	The on-board computer no longer responds after the solar storm. Science {n}
Il doppio dell’energia	Twice the energy
Il lanciatore decide l’orbita di rilascio: il primo passaggio della tua missione.	The launcher decides the release orbit: the first leg of your mission.
Il lanciatore ti lascia già nell’orbita giusta: nessuna manovra.	The launcher already leaves you in the right orbit: no manoeuvre.
Il lancio è affidato a un ente terzo.	The launch is entrusted to a third party.
Il payload è il motivo per cui si vola: un dosimetro che misura la radiazione. Toccalo per montarlo in cima, verso lo spazio.	The payload is the reason we fly: a dosimeter that measures radiation. Tap it to mount it on top, facing space.
Il piano chiede {n} m/s di manovre, ma al tuo livello non hai ancora un propulsore (il primo si sblocca al livello {n}): scegli un’orbita di lavoro dove il razzo ti lascia già, senza manovre	The plan needs {n} m/s of manoeuvres, but at your level you have no thruster yet (the first unlocks at level {n}): choose a working orbit where the rocket already leaves you, without manoeuvres
Il piano chiede {n} m/s di manovre, ma al tuo livello non hai ancora un propulsore (il primo si sblocca al livello {n}): scegli un’orbita di lavoro dove il razzo ti lascia già, senza manovre.	The plan needs {n} m/s of manoeuvres, but at your level you have no thruster yet (the first unlocks at level {n}): choose a working orbit where the rocket already leaves you, without manoeuvres.
Il progetto rispetta tutti i requisiti. I pezzi costano	The design meets all requirements. The parts cost
Il razzo non perdona: vibrazione superate.	The rocket is unforgiving: vibration passed.
Il razzo ti lascia a {n} km, già nella fascia obiettivo: nessuna manovra, e il rientro avviene da solo per l’attrito dell’aria. Chiedi la revisione PDR.	The rocket leaves you at {n} km, already in the target band: no manoeuvre, and re-entry happens by itself through air drag. Ask for the PDR review.
Il razzo è pronto sulla rampa e il servizio è già pagato. Premi LAUNCH!	The rocket is ready on the pad and the service is already paid. Press LAUNCH!
Il rideshare ti rilascia in orbita bassa circolare.	The rideshare releases you in a circular low orbit.
Il satellite più economico la rispetta già.	The cheapest satellite already meets it.
Il satellite {s}	The satellite {s}
Il satellite è completo: massa, potenza ed eclisse sono in verde. Passa al passo {n} le orbite in dettaglio.	The satellite is complete: mass, power and eclipse are green. Move on to step {n}, the detailed orbits.
Il satellite è in orbita! Seguilo dalla sala controllo. Tocca l’edificio sulla mappa.	The satellite is in orbit! Follow it from the control room. Tap the building on the map.
Il satellite è in orbita! Seguilo dalla sala controllo: prima torna al campus con la casetta in basso a destra.	The satellite is in orbit! Follow it from the control room: first go back to the campus with the house button at the bottom right.
Il satellite è in orbita! Tocca gli schermi della sala controllo per seguire la telemetria.	The satellite is in orbit! Tap the control-room screens to follow the telemetry.
Il trasmettitore tace, ed è l’unico.	The transmitter is silent, and it is the only one.
Il tuo razzo, dal tuo campus: il {n}% in meno del rideshare	Your rocket, from your campus: {n}% cheaper than the rideshare
Il tuo staff	Your staff
Il tuo staff tecnico. Quello che accetti diventa un requisito di sistema.	Your technical staff. What you accept becomes a system requirement.
Imaging biologico in diretta	Live biological imaging
Immagini di campioni biologici trasmesse in diretta durante il volo.	Images of biological samples transmitted live during flight.
Impatto	Impact
Impegni presi	Commitments made
In integrazione	In integration
In mostra	On display
In volo	In flight
In volo. Segui la telemetria dal Mission Control Center: gli eventi li decidi tu.	In flight. Follow the telemetry from the Mission Control Center: you decide the events.
Incassa la prima rata e vai avanti	Collect the first instalment and go on
Inclinazione	Inclination
Infrastrutture	Infrastructure
Ingegnere di sistema	Systems engineer
Installa la tavola vibrante: simula le vibrazioni del razzo.	Install the shaker table: it simulates the rocket’s vibrations.
Installa un macchinario	Install a machine
Integrazione in fase C due volte più veloce.	Integration twice as fast.
Interfacce magnetiche MagTag	MagTag magnetic interfaces
Interfacce magnetiche per montare i sottosistemi come moduli.	Magnetic interfaces to mount subsystems as modules.
Interferenze elettromagnetiche tra i sottosistemi. Se il difetto vola: la radio di riserva va persa, o scienza {n}%.	Electromagnetic interference between subsystems. If the defect flies: the spare radio is lost, or science {n}%.
Interno dell’edificio	Building interior
Investitore	Investor
Investitori	Investors
Istituto Borealis	Borealis Institute
Istituzioni	Institutions
Italia	Italy
LOSS OF SIGNAL — Il computer di bordo non risponde più dopo la tempesta solare.	LOSS OF SIGNAL — The on-board computer no longer responds after the solar storm.
LOSS OF SIGNAL — Radio persa: nessun comando arriva più a bordo.	LOSS OF SIGNAL — Radio lost: no command reaches the spacecraft any more.
La batteria tiene acceso il satellite quando passa nell’ombra della Terra (eclisse). Toccala.	The battery keeps the satellite on when it passes through Earth’s shadow (eclipse). Tap it.
La classifica mondiale si vede nella pagina pubblicata.	The world ranking is visible on the published page.
La decisione è tua.	The decision is yours.
La fascia della navigazione satellitare. Ci si arriva da un rilascio in orbita di trasferimento.	The satellite-navigation band. You get there from a release in a transfer orbit.
La prova guidata porta una missione intera, dall’idea al volo, in circa {n} minuti: requisiti, missione, satellite, prove, lancio e operazioni. Ti diciamo noi cosa toccare. Non dà punti e non cambia la partita.	The guided trial takes a whole mission, from idea to flight, in about {n} minutes: requirements, mission, satellite, tests, launch and operations. We tell you what to tap. It gives no points and does not change your game.
La radio UHF manda i dati a terra. Toccala.	The UHF radio sends the data to the ground. Tap it.
La rampa si sblocca al livello {n}	The launch pad unlocks at level {n}
La telemetria parte con il lancio. Tocca gli schermi per aprirli.	Telemetry starts with the launch. Tap the screens to open them.
La tua DRM	Your DRM
La tua agenzia	Your agency
La tua agenzia ha raggiunto	Your agency has reached
La tua squadra	Your team
Laboratorio	Lab
Laboratorio autonomo per lieviti	Autonomous yeast lab
Laboratorio batterico EcAMSat	EcAMSat bacterial lab
Laboratorio prove	Test lab
Laghetto	Pond
Lanci in casa i tuoi CubeSat: {n}% a ogni lancio.	Launch your CubeSats at home: {n}% on every launch.
Lancia	Launch
Lancio dalla tua piattaforma	Launch from your own pad
Lancio:	Launch:
Le bobine magnetiche orientano il satellite usando il campo magnetico terrestre. Toccale.	The magnetic coils orient the satellite using Earth’s magnetic field. Tap them.
Le carte grigie si sbloccano salendo di livello. Origine dei numeri: ● dato pubblicato	Grey cards unlock as you level up. Source of the numbers: ● published data
Le frequenze vanno coordinate: niente radio sperimentali sotto TRL {n}	Frequencies must be coordinated: no experimental radios below TRL {n}
Le manovre esatte e i Δv si calcolano al passo {n} con il satellite vero.	The exact manoeuvres and Δv are computed in step {n}, with the real satellite.
Le mie missioni	My missions
Le missioni riuscite finiscono qui, in mostra per il pubblico.	Successful missions end up here, on display for the public.
Le nostre missioni	Our missions
Le orbite	The orbits
Le piante rendono più felici i dipendenti	Plants make the staff happier
Le rate future dipendono dalla soddisfazione di quel momento. Sotto il {n}% di soddisfazione si paga l’{n}%, sotto il {n}% solo la metà. L’ultima rata arriva solo se la missione riesce.	Future instalments depend on satisfaction at that moment. Below {n}% satisfaction {n}% is paid, below {n}% only half. The last instalment arrives only if the mission succeeds.
Lega Fascia di Kuiper	Kuiper Belt League
Lega Giove	Jupiter League
Lega Interstellare	Interstellar League
Lega Luna	Moon League
Lega Marte	Mars League
Lega Nettuno	Neptune League
Lega Saturno	Saturn League
Lega Terra	Earth League
Leghe	Leagues
Liberi per nuovi edifici	Free for new buildings
Licenzia	Dismiss
Linea di integrazione	Integration line
Liv {n}	Lv {n}
Liv. {n}	Lv. {n}
Livello attuale: {n} I macchinari più avanzati si sbloccano salendo di livello.	Current level: {n}. The more advanced machines unlock as you level up.
Livello {n}	Level {n}
Livello {n}!	Level {n}!
Lo scopo:	The goal:
Lo strappo della separazione dal razzo. Se il difetto vola: esce dal razzo ruotando: {n}% gas e {n} m/s.	The jolt of separation from the rocket. If the defect flies: it leaves the rocket spinning: {n}% gas and {n} m/s.
Logo a bordo	Logo on board
Logo del museo a bordo	Museum logo on board
Lontano dalla Luna: ottima per ponti radio e telescopi.	Far from the Moon: great for radio relays and telescopes.
Luna	Moon
L’analisi orbitale comincia in fase B, dopo che hai scelto il satellite e fissato i requisiti di sistema nell’edificio amministrativo.	Orbit analysis starts in phase B, after you have chosen the satellite and set the system requirements in the administration building.
L’esperienza pensata per il gioco	The experience the game was designed for
Macchinario	Machine
Magazzino	Stores
Magazzino pezzi	Parts store
Magnetometro atomico QuSpin	QuSpin atomic magnetometer
Magnetometro atomico microfabbricato.	Microfabricated atomic magnetometer.
Manca la batteria per l’eclisse	Missing the battery for the eclipse
Manca: 	Missing: 
Mancano {n} m/s: serbatoio più grande al passo {n} oppure togli una tappa al passo {n}	{n} m/s missing: a bigger tank in step {n}, or remove a leg in step {n}
Mantenimento d’orbita	Station-keeping
Margine di massa ≥ {n}%	Mass margin ≥ {n}%
Margine di potenza ≥ {n}%	Power margin ≥ {n}%
Marte	Mars
Massa	Mass
Massa al lancio ≤ {n} kg	Launch mass ≤ {n} kg
Massa e baricentro reali, al millimetro. Se il difetto vola: spinta fuori asse: {n}% di ΔV.	Real mass and centre of mass, to the millimetre. If the defect flies: off-axis thrust: {n}% of ΔV.
Massa massima	Maximum mass
Materiale carbonio-alluminio che porta via il calore dall’elettronica.	Carbon-aluminium material that carries heat away from the electronics.
Materiali strutturali leggeri che schermano anche le radiazioni.	Lightweight structural materials that also shield radiation.
Matrice dei rischi	Risk matrix
Matrice dei rischi di {s}	Risk matrix of {s}
Mercato CubeSat (componente generico)	CubeSat market (generic component)
Mese {n}	Month {n}
Mese {n}: {n} scienza	Month {n}: {n} science
Metodi per gestire i guasti già dal progetto.	Methods to handle faults from the design stage.
Micrometeorite	Micrometeoroid
Micrometeorite: Ha attraversato una cella vuota. Nessun danno.	Micrometeoroid: It went through an empty cell. No damage.
Micropropulsore a gas caldo	Warm-gas micro-thruster
Micropropulsore a gas caldo: semplice e sicuro.	Warm-gas micro-thruster: simple and safe.
Microscopio a fluorescenza robusto	Rugged fluorescence microscope
Microscopio robusto a fluorescenza per la biologia nello spazio.	Rugged fluorescence microscope for biology in space.
Microscopio senza lenti	Lensless microscope
Microscopio senza lenti per osservare campioni biologici in volo.	Lensless microscope to observe biological samples in flight.
Mission Definition Review: i requisiti di missione sono approvati. Premi per chiudere la fase {n} e incassare la prima rata.	Mission Definition Review: the mission requirements are approved. Press to close phase {n} and collect the first instalment.
Missione	Mission
Missione disegnata. Ora progetta il satellite che deve farla.	Mission drawn. Now design the satellite that has to fly it.
Missione riuscita: {n} mesi. Scienza {n}	Mission successful: {n} months. Science {n}
Missione:	Mission:
Misura	Measure
Misura la luce riflessa dalla Luna per calibrare gli strumenti in orbita.	Measures moonlight to calibrate instruments in orbit.
Misura la radiazione che attraversa il satellite	Measures the radiation crossing the satellite
Misura su CubeSat dell’energia totale che arriva dal Sole.	CubeSat measurement of the total energy arriving from the Sun.
Misuratore di irradianza solare CTIM	CTIM solar irradiance meter
Misure	Gauges
Misure in orbita ellittica: bassa al pericentro, alta all’apocentro	Measurements in an elliptical orbit: low at periapsis, high at apoapsis
Misure in orbita ellittica: bassa al pericentro, alta all’apocentro I tipi con il lucchetto non hanno ancora un payload o un propulsore adatto al tuo livello: si sbloccano salendo.	Measurements in an elliptical orbit: low at periapsis, high at apoapsis. Locked types do not yet have a payload or thruster suited to your level: they unlock as you level up.
Mitigazione: Ridondanze e celle libere assorbono il colpo	Mitigation: Redundancy and free cells absorb the hit
Mitigazione: Tieni ΔV di riserva per le correzioni	Mitigation: Keep spare ΔV for corrections
Modalità esperto: disegna tu le manovre →	Expert mode: draw the manoeuvres yourself →
Modalità libera	Free mode
Modalità libera: tutto sbloccato, soldi senza limiti. Non conta per la classifica.	Free mode: everything unlocked, unlimited money. It does not count for the ranking.
Modalità modifica: tocca un edificio, un albero o un oggetto per spostarlo o rimuoverlo.	Edit mode: tap a building, a tree or an object to move or remove it.
Modello dell’antenna	Antenna model
Modifica campus	Edit campus
Modulo di conversione di potenza compatto e affidabile.	Compact, reliable power conversion module.
Monitor della dose ARMAS	ARMAS dose monitor
Monitor della dose di radiazione, tarato in laboratorio.	Radiation dose monitor, calibrated in the lab.
Monopropellente non tossico	Non-toxic monopropellant
Museo	Museum
Museo dello Spazio	Space Museum
NASA deluso	NASA disappointed
NASA soddisfatto ({n} cr)	NASA satisfied ({n} cr)
NASA, scienziata ed ente regolatore	NASA, scientist and regulator
NESSUN SATELLITE PRONTO	NO SATELLITE READY
Natura	Nature
Navigatore GPS e inerziale economico	Low-cost GPS and inertial navigator
Navigatore GPS preciso ed economico per conoscere posizione e orbita.	Precise, low-cost GPS navigator to know position and orbit.
Navigazione	Navigation
Nell’ordine in cui la crei. ★ = dove il satellite lavora.	In the order you create it. ★ = where the satellite works.
Nessun satellite assemblato. Costruiscilo in fase C e assemblalo in camera bianca.	No satellite assembled. Build it in phase C and assemble it in the clean room.
Nessun satellite da progettare: le missioni arrivano qui in fase B, dopo la DRM.	No satellite to design: missions arrive here in phase B, after the DRM.
Nessun satellite in assemblaggio.	No satellite in assembly.
Nessun satellite in fase C. Quando ne avvii uno, la fabbrica dimezza il tempo di integrazione.	No satellite in integration. When you start one, the factory halves the integration time.
Nessun satellite in volo. Quelli che lanci da ora in poi scaricano il {n}% di dati in più.	No satellite in flight. The ones you launch from now on download {n}% more data.
Nessuna manovra: orbita di lavoro {n} × {n} km	No manoeuvre: working orbit {n} × {n} km
Nessuna missione in volo.	No mission in flight.
Nessuna riunione in corso.	No meeting in progress.
Nome	Name
Nome dell’agenzia	Agency name
Non ancora	Not yet
Non riuscita	Failed
Normale	Normal
Nuova lega	New league
Nuova missione	New mission
ORBITA BASSA {n}–{n} km	LOW ORBIT {n}–{n} km
ORBITA CIMITERO	GRAVEYARD ORBIT
ORBITA {n} km	ORBIT {n} km
Officina	Workshop
Ogni mese il satellite raccoglie dati scientifici. Aspetta la fine della missione: nel tutorial il tempo scorre più veloce.	Every month the satellite collects science data. Wait for the end of the mission: in the tutorial time runs faster.
Ogni missione chiusa aggiunge i suoi punti scienza al totale della tua agenzia. Con i punti sali di lega, come le coppe di Clash Royale. Le missioni del tutorial non contano.	Every closed mission adds its science points to your agency’s total. With points you climb leagues, like the trophies in Clash Royale. Tutorial missions do not count.
Ogni prova vuole il suo macchinario. Tocca «Macchinario» a destra per installarne uno.	Every test needs its own machine. Tap «Machine» on the right to install one.
Ogni richiesta accettata diventa un requisito di missione (MIS). In questa prova accettale tutte: sono già state scelte per te.	Every accepted request becomes a mission requirement (MIS). In this trial accept them all: they have already been chosen for you.
Operatore	Operator
Operazioni autonome Polaris	Polaris autonomous operations
Operazioni autonome in orbita su un processore avanzato.	Autonomous in-orbit operations on an advanced processor.
Operazioni: {n} mesi × {n} cr	Operations: {n} months × {n} cr
Oppure gioca subito	Or play right away
Orbita alta	High orbit
Orbita alta (geostazionaria)	High orbit (geostationary)
Orbita alta e quasi circolare: il corpo copre poco cielo	High, nearly circular orbit: the body covers little sky
Orbita bassa	Low orbit
Orbita bassa, circolare e polare: vede tutta la superficie	Low, circular, polar orbit: it sees the whole surface
Orbita bassa. La classe e la taglia decidono quanto spazio, quanta massa e quanta energia avrai, e quanto costerà il lancio. Poi lo staff tecnico ti dirà i suoi requisiti di sistema.	Low orbit. Class and size decide how much room, mass and energy you will have, and how much the launch will cost. Then the technical staff will tell you their system requirements.
Orbita bassa. Scegli gli stakeholder: la NASA c’è sempre. Tocca ⓘ per i dettagli.	Low orbit. Choose the stakeholders: NASA is always there. Tap ⓘ for details.
Orbita di lavoro	Working orbit
Orbita media	Medium orbit
Orbita media inclinata, da cui vedere a lungo le stazioni	Inclined medium orbit, to see the stations for a long time
Orbita obiettivo	Target orbit
Orbita {n}	Orbit {n}
Orbite	Orbits
Orbite in dettaglio	Detailed orbits
Origine	Origin
Osservazione	Observation
Osservazione e mappatura	Observation and mapping
Ottica	Optics
PROSSIMO CONTATTO {n}:{n}:{n}	NEXT CONTACT {n}:{n}:{n}
Pannelli a corpo {n}U	Body-mounted panels {n}U
Pannelli solari	Solar panels
Pannelli sottilissimi che si srotolano: tanta potenza in poco volume.	Ultra-thin panels that unroll: lots of power in little volume.
Pannelli srotolabili LISA-T	LISA-T roll-out panels
Parcheggio	Car park
Parete video della sala controllo	Control-room video wall
Particelle solari in arrivo: i dati più rari della missione.	Solar particles incoming: the rarest data of the mission.
Passaggi della DRM	DRM legs
Passaggi ripetuti nell’alta atmosfera abbassano l’orbita quasi gratis. Due mesi senza scienza e qualche rischio.	Repeated passes through the upper atmosphere lower the orbit almost for free. Two months without science and some risk.
Passo {n}: le orbite in dettaglio, con il satellite vero. Qui compaiono i Δv di ogni passaggio della DRM.	Step {n}: the detailed orbits, with the real satellite. Here the Δv of every DRM leg appears.
Pellicola a emissività variabile	Variable-emissivity film
Pellicola che cambia emissività a comando.	Film that changes emissivity on command.
Penale: {n} mesi promessi e non volati	Penalty: {n} months promised and not flown
Per eclissi lunghe e carichi forti	For long eclipses and heavy loads
Per guardare la superficie da vicino.	To look at the surface up close.
Per orbite lontane e tempeste solari	For distant orbits and solar storms
Per risultati seri servono {n} mesi di dati.	Serious results need {n} months of data.
Per studiare la circolazione dell’atmosfera.	To study atmospheric circulation.
Per una dimostrazione la quota conta poco. In basso l’atmosfera frena il satellite: più ΔV ogni mese.	For a demonstration altitude matters little. Low down the atmosphere slows the satellite: more ΔV every month.
Perché è andata così	Why it went this way
Pericentro	Periapsis
Personale	Staff
Perturbazioni orbitali	Orbital perturbations
Perturbazioni orbitali: Orbita a {n} × {n} km.	Orbital perturbations: Orbit at {n} × {n} km.
Pezzi comprati. Ora porta il satellite su una postazione della camera bianca.	Parts bought. Now take the satellite to a clean-room station.
Pezzi comprati: {n} cr. Fase D: assemblaggio in camera bianca.	Parts bought: {n} cr. Phase D: assembly in the clean room.
Piano di volo	Flight plan
Pianta	Plant
Pianta aggiunta: la squadra è felice al {n}%.	Plant added: the team is {n}% happy.
Piattaforma inerziale compatta e precisa per misurare rotazioni e accelerazioni.	Compact, precise inertial platform to measure rotations and accelerations.
Piattaforma inerziale di precisione	Precision inertial platform
Pino	Pine
Pioppo	Poplar
Più contatti con il satellite: {n}% di dati in volo, {n}% per ogni antenna nel campus.	More contacts with the satellite: {n}% data in flight, {n}% for every antenna on campus.
Più dati per ogni passaggio	More data per pass
Più punti scienza possibile	As many science points as possible
Più soldi, rate più alte, meno guasti	More money, bigger instalments, fewer failures
Politecnico Subalpino	Subalpine Polytechnic
Ponte radio per le missioni in superficie.	Radio relay for surface missions.
Porta fino a	Carries up to
Porta: 	Brings: 
carte di assetto e navigazione un livello prima	attitude and navigation cards one level early
carte di batteria un livello prima	battery cards one level early
carte di computer un livello prima	computer cards one level early
carte di pannelli e generatori un livello prima	panel and generator cards one level early
carte di payload un livello prima	payload cards one level early
carte di propulsione un livello prima	propulsion cards one level early
carte di radio e comunicazioni un livello prima	radio and communication cards one level early
carte di robotica un livello prima	robotics cards one level early
Posizione e ora esatte	Exact position and time
Posti auto ({n} per parcheggio)	Parking spaces ({n} per car park)
Potenza	Power
Potenza extra	Extra power
Potenza ridotta	Reduced power
Preliminary Design Review: orbita e lancio vanno bene. Prenota il lancio: arriva anche la seconda rata.	Preliminary Design Review: orbit and launch are fine. Book the launch: the second instalment arrives too.
Premi degli stakeholder soddisfatti	Rewards from satisfied stakeholders
Prenota il lancio e vai avanti	Book the launch and go on
Prezzo per il {n}U	Price for the {n}U
Prima del lancio vogliamo superate le prove di vibrazione.	Before launch we want the vibration tests passed.
Prima rata: {n} cr. Fase A: rientra nell’edificio amministrativo per scegliere il satellite e sentire lo staff tecnico.	First instalment: {n} cr. Phase A: go back into the administration building to choose the satellite and hear the technical staff.
Primo volo riuscito!	First flight successful!
Probabilità	Probability
Probabilità di difetto per prova	Defect probability per test
Problema in volo	In-flight problem
Processi migliori: metà dei difetti di fabbricazione.	Better processes: half the manufacturing defects.
Processore neuromorfico	Neuromorphic processor
Processore neuromorfico per decisioni autonome con pochi watt.	Neuromorphic processor for autonomous decisions with few watts.
Progetta {s}	Design {s}
Propellente	Propellant
Propellente meno tossico dell’idrazina: manovre vere	Propellant less toxic than hydrazine: real manoeuvres
Propellente verde AF-M{n}E	AF-M{n}E green propellant
Propellente verde, meno tossico e più efficiente dell’idrazina.	Green propellant, less toxic and more efficient than hydrazine.
Proponi: «Costo ≤ {n} crediti». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n} Un no secco ne costa {n} una deroga più avanti {n}	Propose: «Cost ≤ {n} credits». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}
Proponi: «Durata ≥ {n} mesi». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n} Un no secco ne costa {n} una deroga più avanti {n}	Propose: «Duration ≥ {n} months». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}
Proponi: «Margine di massa ≥ {n}%». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n} Un no secco ne costa {n} una deroga più avanti {n}	Propose: «Mass margin ≥ {n}%». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}
Proponi: «Prova di vibrazione superata». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n} Un no secco ne costa {n} una deroga più avanti {n}	Propose: «Vibration test passed». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}
Propulsione	Propulsion
Propulsione a electrospray ad alto impulso specifico per lo spazio profondo.	High specific-impulse electrospray propulsion for deep space.
Propulsione a gas freddo	Cold-gas propulsion
Propulsione elettrica	Electric propulsion
Propulsione monopropellente verde	Green monopropellant propulsion
Propulsore a electrospray a tessere di liquido ionico.	Tiled ionic-liquid electrospray thruster.
Propulsore a electrospray di precisione per correzioni finissime.	Precision electrospray thruster for very fine corrections.
Propulsore a electrospray microfluidico.	Microfluidic electrospray thruster.
Propulsore ad acqua HYDROS	HYDROS water thruster
Propulsore ad acqua: la divide in idrogeno e ossigeno e li brucia.	Water thruster: it splits water into hydrogen and oxygen and burns them.
Propulsore al plasma che usa un metallo solido come propellente.	Plasma thruster that uses a solid metal as propellant.
Propulsore al plasma metallico	Metal plasma thruster
Propulsore bimodale chimico-ionico	Dual-mode chemical-ion thruster
Propulsore non ancora scelto: stima con il migliore del tuo livello (Electrospray microfluidico) su un CubeSat da {n} kg. Lo monterai in fase C.	Thruster not chosen yet: estimate with the best of your level (microfluidic electrospray) on a {n} kg CubeSat. You will fit it in step 2.
Prototipo in prova	Prototype under test
Prova di massa superata	Mass test passed
Prova di vibrazione in corso…	Vibration test in progress…
Prova di vibrazione per il lancio condiviso	Vibration test for the shared launch
Prova di vibrazione superata	Vibration test passed
Prova guidata	Guided trial
Prova in volo una tecnologia nuova	Flight-tests a new technology
Prova superata. Al livello {n} hai solo la tavola vibrante: gli altri macchinari si sbloccano salendo di livello. Chiedi la revisione FRR: decide se il satellite può volare.	Test passed. At level {n} you only have the shaker table: the other machines unlock as you level up. Ask for the FRR review: it decides whether the satellite can fly.
Provare in volo, attorno alla Terra, una tecnologia mai volata.	Test in flight, around Earth, a technology that has never flown.
Prove di vibrazione e shock	Vibration and shock tests
Prove di vibrazione e termovuoto	Vibration and thermal-vacuum tests
Pubblico e sponsor: premio di fine missione {n}%.	Public and sponsors: end-of-mission bonus {n}%.
Puntamento dinamico che evita le nuvole	Dynamic pointing that avoids clouds
Punti scienza totali: lo scopo del gioco	Total science points: the goal of the game
Puoi reclutarne {n}	You can recruit {n}
Questa è la Design Reference Mission: il razzo ti lascia a {n} km, dove il satellite lavora (★). Scegli come finisce la missione: rientro in atmosfera.	This is the Design Reference Mission: the rocket leaves you at {n} km, where the satellite works (★). Choose how the mission ends: atmospheric re-entry.
Qui arrivano i satelliti che hanno superato la revisione di volo.	Satellites that passed the flight review arrive here.
Qui no: fuori dalla stanza.	Not here: outside the room.
Qui no: fuori dalla stanza. Esc per annullare.	Not here: outside the room. Esc to cancel.
Qui va bene. Esc per annullare.	This is fine. Esc to cancel.
Quota di lavoro dentro la fascia	Working altitude within the band
Quota di lavoro nella fascia	Working altitude in the band
RIDESHARE IN ORBITA BASSA	LOW-ORBIT RIDESHARE
Radiatore che regola quanto calore disperde.	Radiator that adjusts how much heat it rejects.
Radiatore variabile	Variable radiator
Radio UHF con antenna	UHF radio with antenna
Radio UHF doppia	Dual UHF radio
Radio con TRL ≥ {n} (frequenze coordinate)	Radio with TRL ≥ {n} (coordinated frequencies)
Radio in banda S	S-band radio
Radio in banda X	X-band radio
Radio muta	Silent radio
Radio muta: La radio riparte.	Silent radio: The radio restarts.
Radio muta: Radio persa: nessun comando arriva più a bordo.	Silent radio: Radio lost: no command reaches the spacecraft any more.
Radio muta: serve una tua decisione in sala controllo.	Silent radio: your decision is needed in the control room.
Radio muta: «Potenza ridotta» invece di «Reset a freddo»	Silent radio: «Reduced power» instead of «Cold reset»
Radio persa: nessun comando arriva più a bordo.	Radio lost: no command reaches the spacecraft any more.
Radio persa: nessun comando arriva più a bordo. Scienza {n}	Radio lost: no command reaches the spacecraft any more. Science {n}
Radio programmabile ultraleggera	Ultralight software-defined radio
Radio programmabile ultraleggera.	Ultralight software-defined radio.
Radio software Vulcan per lo spazio profondo	Vulcan deep-space software radio
Radio software compatibile con la rete NASA dello spazio profondo.	Software radio compatible with NASA’s Deep Space Network.
Raggiungere l’orbita del detrito e agganciarlo	Reach the debris orbit and capture it
Rampa di lancio	Launch pad
Rata PDR {n} cr	PDR instalment {n} cr
Razzo in scala {n}:{n}	Rocket at {n}:{n} scale
Recluta	Recruit
Recluti sponsor: portano fondi e sbloccano prima le loro tecnologie.	Recruit sponsors: they bring funds and unlock their technologies earlier.
Registro dei rischi	Risk register
Regno Unito	United Kingdom
Regola dei {n} anni: a fine missione il satellite deve rientrare. Sotto i {n} km basta l’atmosfera, sopra servono propulsione o una vela di rientro.	{n}-year rule: at end of mission the satellite must re-enter. Below {n} km the atmosphere is enough, above it you need propulsion or a drag sail.
Requisiti	Requirements
Requisiti accettati	Accepted requirements
Requisiti {n}	Requirements {n}
Resa scientifica	Science yield
Reset a freddo	Cold reset
Responsabile del programma	Programme manager
Rete che tollera i ritardi: i dati aspettano il prossimo contatto invece di perdersi.	Delay-tolerant network: data wait for the next contact instead of being lost.
Rete tollerante ai ritardi (DTN)	Delay-tolerant network (DTN)
Revisione CDR	CDR review
Revisione PDR	PDR review
Revisione di volo	Flight review
Revisione di volo superata.	Flight review passed.
Revisione di volo superata: comincia la fase E.	Flight review passed: phase E begins.
Revisione di volo superata: comincia la fase E. Vai all’edificio amministrativo per il lancio. Tocca l’edificio sulla mappa.	Flight review passed: phase E begins. Go to the administration building for the launch. Tap the building on the map.
Revisione di volo superata: comincia la fase E. Vai all’edificio amministrativo per il lancio: prima torna al campus con la casetta in basso a destra.	Flight review passed: phase E begins. Go to the administration building for the launch: first go back to the campus with the house button at the bottom right.
Ricerca	Research
Ricevitore GPS	GPS receiver
Richiesta di un partner: Richiesta declinata.	Partner request: Request declined.
Ricomincia da capo	Start over
Riconosce in tempo reale le anomalie a bordo.	Detects on-board anomalies in real time.
Rideshare in orbita bassa	Low-orbit rideshare
Ridondanza su computer, radio e assetto	Redundancy on computer, radio and attitude
Rientro	Re-entry
Rientro entro {n} anni dalla fine	Re-entry within {n} years of the end
Rientro naturale: l’atmosfera frena il satellite	Natural re-entry: the atmosphere slows the satellite
Rifiuta	Refuse
Rigioca il volo cambiando una sola cosa.	Replay the flight changing just one thing.
Rilascio	Release
Rilevamento scientifico	Science survey
Rilevatore di anomalie ARADISS	ARADISS anomaly detector
Rimozione di un detrito	Debris removal
Rinforza	Reinforce
Riscaldatori e sensori di temperatura	Heaters and temperature sensors
Rischi	Risks
Rischi aperti: {n}	Open risks: {n}
Rischio	Risk
Risorse	Resources
Risorse di bordo	On-board resources
Robotica	Robotics
Ruota	Rotate
Ruote che girano per orientare il satellite con precisione	Spinning wheels to point the satellite precisely
Ruote di reazione da dischi rigidi	Hard-disk reaction wheels
Ruote di reazione ricavate da dischi rigidi: assetto a tre assi a bassissimo costo.	Reaction wheels made from hard disks: three-axis attitude at very low cost.
SITO DI LANCIO ESTERNO	EXTERNAL LAUNCH SITE
STATO DI BORDO	ON-BOARD STATUS
Sala controllo	Control room
Sala ospiti	Guest room
Sala riunioni	Meeting room
Sala riunioni vista da capotavola	Meeting room seen from the head of the table
Salta tutorial	Skip tutorial
Satellite costruito attorno a uno smartphone: computer economico ma delicato.	Satellite built around a smartphone: cheap but fragile computer.
Satellite: 	Satellite: 
Manca la batteria per l’eclisse.	Missing the battery for the eclipse.
Satelliti	Satellites
Satelliti in contatto	Satellites in contact
Sbloccati: FlatSat, CubeSat {n}U, {n} nuove tecnologie	Unlocked: FlatSat, CubeSat {n}U, {n} new technologies
Scalda	Heat
Scegli il corpo	Choose the body
Scegli la durata con − e +, poi premi LAUNCH. Ogni mese promesso e non volato costa {n} cr; ogni mese di operazioni {n} cr.	Choose the duration with − and +, then press LAUNCH. Every month promised and not flown costs {n} cr; every month of operations {n} cr.
Scegli quali prove fare su {s}. Ogni prova saltata resta un rischio nel registro dei rischi.	Choose which tests to run on {s}. Every skipped test stays a risk in the risk register.
Scegli un CubeSat {n}U: tre cubi da {n} cm, al massimo {n} kg.	Choose a {n}U CubeSat: three {n} cm cubes, at most {n} kg.
Scegli un satellite con il tasto «Satelliti». Ogni prova scopre un tipo di difetto prima che lo scopra lo spazio.	Choose a satellite with the «Satellites» button. Every test uncovers a type of defect before space does.
Scheda di calcolo per elaborare a bordo i dati del payload.	Computing board to process payload data on board.
Schema della missione	Mission diagram
Schermatura in composito leggero	Lightweight composite shielding
Scienza consegnata ({n} × {n})	Science delivered ({n} × {n})
Scienziata di missione	Mission scientist
Scopo del gioco	Goal of the game
Scuole in Orbita	Schools in Orbit
Se accetti	If you accept
Se accetti diventa un requisito di missione: «Costo ≤ {n} crediti»	If you accept it becomes a mission requirement: «Cost ≤ {n} credits»
Se accetti diventa un requisito di missione: «Durata ≥ {n} mesi»	If you accept it becomes a mission requirement: «Duration ≥ {n} months»
Se accetti diventa un requisito di missione: «Prova di vibrazione superata»	If you accept it becomes a mission requirement: «Vibration test passed»
Se accetti diventa un requisito di missione: «Radio con TRL ≥ {n} (frequenze coordinate)»	If you accept it becomes a mission requirement: «Radio with TRL ≥ {n} (coordinated frequencies)»
Se accetti diventa un requisito di missione: «Rientro entro {n} anni dalla fine»	If you accept it becomes a mission requirement: «Re-entry within {n} years of the end»
Se accetti diventa un requisito di sistema: «Margine di massa ≥ {n}%»	If you accept it becomes a system requirement: «Mass margin ≥ {n}%»
Se rifiuti,	If you refuse,
Senza propulsione la durata dipende solo da quanto regge il satellite.	Without propulsion the duration depends only on how long the satellite lasts.
Senza prova superata: FlatSat, Camera termovuoto, Banco shock, Camera anecoica, Bilancia di massa. Eventuali difetti voleranno con il satellite.	Without a passed test: FlatSat, thermal-vacuum chamber, shock bench, anechoic chamber, mass balance. Any defects will fly with the satellite.
Sequenza	Sequence
Serve un’orbita di lavoro ★ nella fascia obiettivo e un fine vita.	You need a working orbit ★ in the target band and an end of life.
Servono per far funzionare gli edifici	Needed to run the buildings
Sfiorando la superficie: mappe e misure di dettaglio.	Skimming the surface: detailed maps and measurements.
Si	Yes
Si sblocca al livello {n}: ti mancano {n} XP. Si guadagnano chiudendo missioni.	Unlocks at level {n}: you need {n} more XP. You earn them by closing missions.
Sistema di assetto completo per CubeSat, provato in orbita lunare.	Complete attitude system for CubeSats, proven in lunar orbit.
Sistema monopropellente non tossico.	Non-toxic monopropellant system.
Sistema propulsivo per nanosatelliti qualificato a terra.	Ground-qualified propulsion system for nanosatellites.
Soddisfazione	Satisfaction
Software di volo NASA (cFS), riusabile e già provato in molte missioni.	NASA flight software (cFS), reusable and already proven on many missions.
Software di volo NASA cFS	NASA cFS flight software
Software e modi operativi sul banco. Se il difetto vola: il software va in loop dopo il lancio: {n} m/s.	Software and operating modes on the bench. If the defect flies: the software loops after launch: {n} m/s.
Sosta nell’orbita di rilascio	Stay in the release orbit
Sotto le nubi non si vede: servono radar e infrarossi.	You cannot see under the clouds: radar and infrared are needed.
Spaccato del satellite	Satellite cutaway
Spagna	Spain
Spegni la musica	Turn the music off
Accendi la musica	Turn the music on
Spinta minuscola per mesi: pochissimo propellente, due mesi senza scienza.	Tiny thrust for months: very little propellant, two months without science.
Spinta minuscola, consumi di propellente bassissimi	Tiny thrust, very low propellant use
Spirale ionica	Ion spiral
Squadra	Team
Stampante {n}D	{n}D printer
Star tracker miniaturizzato	Miniature star tracker
Star tracker miniaturizzato per piccoli satelliti.	Miniature star tracker for small satellites.
Stato satellite	Satellite status
Stazione di terra	Ground station
Stipendi a ogni nuova fase di una missione ({n} cr a testa). Se le missioni sono ferme non paghi nulla.	Salaries at every new phase of a mission ({n} cr each). If missions are idle you pay nothing.
Stipendi della Fase A di {s}: {n} cr ({n} dipendenti).	Phase A salaries for {s}: {n} cr ({n} staff).
Stipendi della Fase B di {s}: {n} cr ({n} dipendenti).	Phase B salaries for {s}: {n} cr ({n} staff).
Stipendi della Fase C di {s}: {n} cr ({n} dipendenti).	Phase C salaries for {s}: {n} cr ({n} staff).
Stipendi della Fase D di {s}: {n} cr ({n} dipendenti).	Phase D salaries for {s}: {n} cr ({n} staff).
Stipendi della Fase E di {s}: {n} cr ({n} dipendenti).	Phase E salaries for {s}: {n} cr ({n} staff).
Strategia scelta	Chosen strategy
Struttura	Structure
Struttura che scherma le radiazioni	Radiation-shielding structure
Studia come i batteri resistono agli antibiotici in microgravità.	Studies how bacteria resist antibiotics in microgravity.
Suggerimento	Hint
Superato	Passed
Supercondensatori ai nanotubi	Nanotube supercapacitors
Supercondensatori ai nanotubi: energia in fretta per i picchi di potenza.	Nanotube supercapacitors: fast energy for power peaks.
Superficie	Surface
System Requirements Review: i requisiti di sistema sono fissati. Passa alla fase B.	System Requirements Review: the system requirements are set. Move on to phase B.
TRL ≥ {n} (frequenze…	TRL ≥ {n} (frequencies…
Tanti dati, anche da lontano	Lots of data, even from far away
Tavola vibrante	Shaker table
Tavola vibrante installato.	Shaker table installed.
Tavola vibrante:	Shaker table:
Telecomunicazioni: inserimento in orbita	Telecommunications: orbit insertion
Telemetria in diretta da {s}.	Live telemetry from {s}.
Telemetria orbitale	Orbital telemetry
Telescopio	Telescope
Telescopio per elettroni e protoni CREPT	CREPT electron and proton telescope
Telescopio per elettroni e protoni energetici nelle fasce di radiazione.	Telescope for energetic electrons and protons in the radiation belts.
Tempesta solare	Solar storm
Tempesta solare: Il computer di bordo non risponde più dopo la tempesta solare.	Solar storm: The on-board computer no longer responds after the solar storm.
Tempesta solare: Tempesta misurata dal vivo. {n} scienza.	Solar storm: Storm measured live. {n} science.
Tempesta solare: serve una tua decisione in sala controllo.	Solar storm: your decision is needed in the control room.
Tempesta solare: «Safe mode» invece di «Misura»	Solar storm: «Safe mode» instead of «Measure»
Tempo	Time
Tengono al caldo batteria e strumenti in eclisse	Keep battery and instruments warm in eclipse
Teniamoci il {n}% di margine sotto il limite di massa della struttura.	Let’s keep a {n}% margin below the structure’s mass limit.
Terra	Earth
Terra ====	Earth ====
Ti dice dove sta il conflitto, non come risolverlo	It tells you where the conflict is, not how to solve it
Tipo di missione	Mission type
Titolo	Title
Tocca il banco di un satellite per progettarlo: puoi lavorare a più satelliti insieme.	Tap a satellite’s bench to design it: you can work on several satellites at once.
Tocca il banco di {s}.	Tap the bench of {s}.
Tocca un pezzo del magazzino per montarlo, poi trascinalo. Il mirino è il baricentro: tienilo sulla linea dell’ugello.	Tap a part in the store to mount it, then drag it. The crosshair is the centre of mass: keep it on the nozzle line.
Tocca un punto libero del laboratorio per posizionare il macchinario: lo metti dove vuoi, ma senza toccare gli altri.	Tap a free spot in the lab to place the machine: put it wherever you like, but without touching the others.
Tocca un punto libero del laboratorio per posizionare tavola vibrante.	Tap a free spot in the lab to place the shaker table.
Tocca un punto libero per mettere la pianta. Esc per annullare.	Tap a free spot to place the plant. Esc to cancel.
Tocca un punto libero per posizionare: tavola vibrante. Esc per annullare.	Tap a free spot to place: shaker table. Esc to cancel.
Togli	Remove
Torna al campus	Back to campus
Torna alla fase B	Back to phase B
Totale	Total
Totale ({n}% di margine sul piano)	Total ({n}% margin on the plan)
Tra {n} e {n} km: osservazione, costellazioni, prove.	Between {n} and {n} km: observation, constellations, tests.
Trascina il satellite	Drag the satellite
Trascina il satellite sulla tavola vibrante per lanciare la prova di vibrazione.	Drag the satellite onto the shaker table to start the vibration test.
Trascina il tuo satellite su una postazione libera: lì i tecnici lo assemblano.	Drag your satellite onto a free station: the technicians assemble it there.
Trascina lo sfondo per girare la vista, rotella o due dita per lo zoom. Trascina il punto arancione per scegliere dove accendere il motore, quello blu per alzare o abbassare il lato opposto.	Drag the background to turn the view, wheel or two fingers to zoom. Drag the orange dot to choose where to fire the engine, the blue one to raise or lower the opposite side.
Trascina {s} su un macchinario per provarlo ({n} cr a prova). Ogni prova scopre un tipo di difetto prima che lo scopra lo spazio.	Drag {s} onto a machine to test it ({n} cr per test). Every test uncovers a type of defect before space does.
Trascinalo su un macchinario	Drag it onto a machine
Trascinalo su una postazione	Drag it onto a station
Tratto {n}	Leg {n}
Tubo di calore stampato in {n}D	{n}D-printed heat pipe
Tubo di calore stampato in {n}D per CubeSat.	{n}D-printed heat pipe for CubeSats.
Turchia	Turkey
Tutorial completato	Tutorial completed
Tutte le richieste sono sul tavolo.	All the requests are on the table.
Tutti	All
Tutti gli sponsor del gioco. Chi recluti entra nell’elenco degli stakeholder dell’edificio amministrativo, con i suoi fondi, le sue tecnologie e le sue richieste. Uno nuovo a ogni livello.	All the sponsors in the game. Whoever you recruit joins the stakeholder list in the administration building, with their funds, technologies and requests. A new one at every level.
Tutti i dati arrivano a terra.	All the data reach the ground.
Tutti i pezzi	All parts
Tutto sbloccato, nessun vincolo di budget	Everything unlocked, no budget constraints
Ufficio partnership	Partnership office
Ultima rata (MCR)	Last instalment (MCR)
Un broker di lancio ti mette in un dispenser insieme ad altri satelliti	A launch broker puts you in a dispenser with other satellites
Un lander commerciale ti porta giù: ingresso, paracadute, retrorazzi.	A commercial lander takes you down: entry, parachute, retro-rockets.
Un solo propulsore che lavora sia chimico (spinta forte) sia ionico (efficiente).	A single thruster that works both chemically (strong thrust) and as an ion engine (efficient).
Una frase: perché questa missione esiste. Se riesce e la pubblichi, compare in bacheca.	One sentence: why this mission exists. If it succeeds and you publish it, it appears on the board.
Università	University
Vale per i satelliti che superano la CDR da ora in poi.	Applies to satellites that pass the CDR from now on.
Vedi la classifica	See the ranking
Vela di resistenza aerodinamica che fa rientrare il satellite a fine missione.	Drag sail that brings the satellite down at end of mission.
Vela di rientro	De-orbit sail
Venere	Venus
Verifica {s}	Check {s}
Verso l’orbita cimitero	To the graveyard orbit
Verso l’orbita di lavoro	To the working orbit
Vestizione	Gowning
Vista ampia del pianeta e della sua atmosfera.	Wide view of the planet and its atmosphere.
Vista d’insieme del pianeta e del vento solare.	Overall view of the planet and the solar wind.
Vogliamo seguire la missione per un anno scolastico: {n} mesi.	We want to follow the mission for a school year: {n} months.
banco libero	free bench
baricentro troppo alto, la struttura oscilla.	centre of mass too high, the structure wobbles.
basso	low
calcolo…	calculating…
camera bianca	clean room
cimitero	graveyard
compra i pezzi	buy the parts
costruito	built
crediti	credits
da scegliere qui sotto	to be chosen below
da {n} punti scienza	from {n} science points
difetto	defect
difficile	hard
ed entra nella	and enter the
edificio amministrativo	administration building
edificio costruito	building built
entro {n} anni dalla…	within {n} years of…
evento	event
facile	easy
fatale	fatal
fine vita senza detriti	end of life without debris
fine vita sulla superficie	end of life on the surface
fino a {n} kg	up to {n} kg
in atmosfera	in the atmosphere
in eclisse	in eclipse
in prova	under test
in prova…	under test…
lancio con un ente terzo	launch with a third party
lancio e rilascio	launch and release
lancio e viaggio verso la Luna	launch and trip to the Moon
lancio e viaggio verso Marte	launch and trip to Mars
lancio e viaggio verso Venere	launch and trip to Venus
lancio, viaggio e discesa con il lander	launch, trip and descent with the lander
manovra di discesa	descent manoeuvre
manovra di salita	climb manoeuvre
lancio prenotato {n} cr. Fase C: costruisci il satellite nell’edificio di costruzione.	launch booked {n} cr. Phase C: freeze the design in the assembly building.
lato opposto, trascinabile	opposite side, draggable
livello {n}	level {n}
lo metti dove vuoi	put it where you like
manca la batteria	battery missing
mancano {n} punti per la Lega Luna	{n} points to the Moon League
massa ≥ {n}%	mass ≥ {n}%
mese {n} / {n}	month {n} / {n}
mese {n} di {n}	month {n} of {n}
mesi	months
metà	half
nessun dato questo mese	no data this month
nessun macchinario	no machine
nessun payload	no payload
nessun propulsore	no thruster
nessuna manovra	no manoeuvre
nessuna manovra: non serve propulsione	no manoeuvre: no propulsion needed
nessuna propulsione: l’orbita decade da sola	no propulsion: the orbit decays by itself
nessuna scorta	no spare
nessuno	none
nessuno ancora	none yet
non pagata: missione non riuscita	not paid: mission failed
non superata	not passed
normale	normal
ora {n}	now {n}
ora {n}°	now {n}°
orbita alta	high orbit
orbita alta (geostazionaria)	high orbit (geostationary)
orbita bassa	low orbit
orbita di rilascio	release orbit
orbita finale e punti di burn	final orbit and burn points
orbita media	medium orbit
orbita obiettivo	target orbit
orbite intermedie	intermediate orbits
parcheggiato a {n} km	parked at {n} km
passo {n} di {n}	step {n} of {n}
più	more
pochissimo	very little
possibile	possible
postazione libera	free station
prenotato	booked
probabile	likely
progetto congelato	design frozen
pronta	ready
pronto ✓	ready ✓
prova	test
qualsiasi	any
qui lavora il satellite	the satellite works here
solo di passaggio	just passing through
nella fascia obiettivo	in the target band
fuori dalla fascia obiettivo	outside the target band
il lander ti porta fino al suolo	the lander takes you to the ground
il satellite lavora a terra	the satellite works on the ground
Sulla superficie	On the surface
raccogliere più punti scienza possibile e salire di lega nella classifica mondiale delle agenzie.	collect as many science points as possible and climb the leagues in the world agency ranking.
rara	rare
resa {n}%	yield {n}%
rientro	re-entry
rientro in atmosfera	atmospheric re-entry
impatto controllato	controlled impact
verso l’orbita cimitero	to the graveyard orbit
rilascio	release
rilascio in orbita a {n} km	release into orbit at {n} km
rischio tempesta {n}%	storm risk {n}%
sana	healthy
scarica al {n}%	discharged to {n}%
scende al {n}% in eclisse	drops to {n}% in eclipse
nessuna eclisse	no eclipse
scienza {n}%, sicuro	science {n}%, safe
sei qui	you are here
serio	serious
servono {n}	{n} needed
si prepara la chiusura	preparing the close-out
sopra la geostazionaria	above geostationary
orbita molto alta	very high orbit
squadra	team
su un lander	on a lander
sul suolo	on the ground
sulla rampa	on the pad
sulla superficie	on the surface
superata	passed
superata.	passed.
superficie	surface
teca vuota	empty showcase
tempi dimezzati	times halved
tocca per la lista	tap for the list
tocca per la roadmap	tap for the roadmap
trasmissione chiusa ====	transmission closed ====
unico trasmettitore	single transmitter
vibrazione superata	vibration passed
{n} MB / {n} MB al giorno	{n} MB / {n} MB per day
{n} MB prodotti	{n} MB produced
{n} MB scaricati	{n} MB downloaded
{n} al mese circa	about {n} per month
{n} alti	{n} high
{n} antenne collegate su {n} La stazione da sola vale {n}% di dati; ogni antenna nel campus aggiunge {n}% di dati e {n}% di probabilità di riprendere il contatto radio quando il satellite tace. Le metti da «Modifica campus» → Infrastrutture.	{n} antennas connected out of {n}. The station alone is worth {n}% data; every antenna on campus adds {n}% data and {n}% chance of regaining radio contact when the satellite falls silent. You place them from «Edit campus» → Infrastructure.
{n} aperti	{n} open
{n} bloccati	{n} locked
{n} cr / {n} cr (lancio già pagato)	{n} cr / {n} cr (launch already paid)
{n} destinazioni	{n} destinations
{n} di {n} macchinari	{n} of {n} machines
{n} disponibili	{n} available
{n} m/s al mese	{n} m/s per month
{n} mesi	{n} months
{n} mesi ancora.	{n} more months.
{n} mesi senza scienza	{n} months without science
{n} minuti	{n} minutes
{n} mitigati	{n} mitigated
{n} ore	{n} hours
{n} piante da interno. Più piante, più felicità: con la squadra al {n}% assemblaggio e prove durano ×{n} Serve circa una pianta per dipendente per arrivare al {n}%. Le piante si mettono dentro gli edifici.	{n} indoor plants. More plants, more happiness: with the team at {n}% assembly and tests take ×{n}. You need about one plant per employee to reach {n}%. Plants go inside the buildings.
{n} prova	{n} test
{n} punti scienza	{n} science points
{n} requisiti	{n} requirements
{n} requisiti di missione. Gli stakeholder promettono	{n} mission requirements. The stakeholders promise
{n} requisiti di sistema. In fase B si fa l’analisi orbitale nel Centro di dinamica del volo.	{n} system requirements. In phase B you draw the mission in the flight dynamics centre.
{n} satellite in assemblaggio. Tocca una postazione per vedere a che punto è; quando è pronto, toccalo per portarlo al laboratorio.	{n} satellite in assembly. Tap a station to see its progress; when it is ready, tap it to take it to the lab.
{n} satellite in volo. Tocca gli schermi per la telemetria.	{n} satellite in flight. Tap the screens for the telemetry.
{n} scienza	{n} science
{n} × {n} caselle	{n} × {n} cells
{n}% di bruciare un computer	{n}% chance of frying a computer
{n}% di bruciare un computer).	{n}% chance of frying a computer).
{n}% di perdere il satellite	{n}% chance of losing the satellite
{n}% persa per sempre	{n}% lost for good
{n}% persa per sempre).	{n}% lost for good).
{n}% torna	{n}% comes back
{s} creata. Entra nell’edificio amministrativo: la NASA ti aspetta al tavolo.	{s} created. Enter the administration building: NASA is waiting for you at the table.
{s} pronto al lancio	{s} ready for launch
{s} è assemblato: esci e portalo all’edificio di testing per le prove.	{s} is assembled: go out and take it to the test building for the tests.
{s} è in orbita: esci e vai al Mission Control Center per seguirlo.	{s} is in orbit: go out to the Mission Control Center to follow it.
{s} è pronto: comincia la fase E. Vai all’edificio amministrativo per il lancio.	{s} is ready: phase E begins. Go to the administration building for the launch.
{s} è sulla postazione: i tecnici iniziano l’assemblaggio.	{s} is on the station: the technicians start assembly.
{s}: assemblaggio completato. Portalo al laboratorio prove.	{s}: assembly completed. Take it to the test lab.
{s}: prova di vibrazione con problemi.	{s}: vibration test with problems.
{s}: prova di vibrazione superata.	{s}: vibration test passed.
atmosfera e gravità irregolare spostano l’orbita	atmosphere and uneven gravity shift the orbit
colpisce una casella a caso: {n} sono vuote	hits a random cell: {n} are empty
facoltativo	optional
È la sua richiesta principale: un no pesa di più.	It is their main request: a no weighs more.
è la sua richiesta principale	it is their main request
ΔV con {n}% di margine	ΔV with {n}% margin
ΔV del piano	Plan ΔV
ΔV del piano ({n}% di margine)	Plan ΔV ({n}% margin)
ΔV del satellite	Satellite ΔV
ΔV disponibile	Available ΔV
— mesi	— months
‹ Sala controllo	‹ Control room
← Indietro	← Back
← Officina	← Workshop
← Torna alle strategie	← Back to the strategies
↻ Gira il telefono in orizzontale per costruire meglio	↻ Turn your phone sideways to build more comfortably
⇄ Confronta	⇄ Compare
⏸ tempo fermo	⏸ time paused
▶ PREMI START	▶ PRESS START
○ stima. Le carte NASA vengono da TechPort.	○ estimate. NASA cards come from TechPort.
◐ derivato	◐ derived
⚠ Una decisione ti aspetta: tocca gli schermi.	⚠ A decision awaits you: tap the screens.
✍️ {n} sponsor reclutabile	✍️ {n} recruitable sponsor
✎ Modifica	✎ Edit
✎ Modifica DRM	✎ Edit DRM
⬇ Resoconto	⬇ Report
Campus più grande ({n}% dell’area iniziale)	Larger campus ({n}% of the initial area)
{n} missioni insieme	{n} missions at once
Agenzie partner della NASA Space Apps Challenge	NASA Space Apps Challenge partner agencies
Sponsor da reclutare nell’Ufficio partnership	Sponsors to recruit in the partnership office
in arrivo	coming soon
non ancora possibile	not possible yet
serve la propulsione ionica a bordo	needs on-board ion propulsion
serve solo per abbassare l’orbita	only needed to lower the orbit
È una regola: non si può rifiutare.	It is a rule: it cannot be refused.
Rientro in atmosfera	Atmospheric re-entry
Impatto controllato	Controlled impact
Orbita cimitero	Graveyard orbit
Cimitero	Graveyard
Lancio dalla tua piattaforma	Launch from your own pad
Passaggio verso Marte o Venere	Ride to Mars or Venus
Passaggio verso la Luna	Ride to the Moon
Posto su un lander commerciale	Seat on a commercial lander
{n} nuove tecnologie	{n} new technologies
＋ Aggiungi orbita	＋ Add orbit
✕ Annulla	✕ Cancel
Aggiungi orbita	Add orbit
Fine vita (fase F)	End of life (phase F)
in atmosfera	in the atmosphere
niente atmosfera	no atmosphere
sulla superficie	on the surface
orbita più alta	higher orbit
Muovi il puntatore (o il dito) sullo schema e rilascia alla quota che vuoi.	Move the pointer (or your finger) over the diagram and release at the altitude you want.
Centro di dinamica del volo · Fase B · passo {n} di {n}	Flight dynamics centre · Phase B · step {n} of {n}
Disegna cosa fa il satellite, dove e in che ordine, fino alla fine della missione.	Draw what the satellite does, where and in which order, up to the end of the mission.
Rilascia: nuova orbita a {n} km	Release: new orbit at {n} km
Troppo bassa: l’atmosfera frena il satellite	Too low: the atmosphere slows the satellite
Fuori dallo schema	Outside the diagram
🔒 Quota che si sblocca al livello {n}	🔒 Altitude that unlocks at level {n}
RILASCIO	RELEASE
ORBITA	ORBIT
spazio tra la Terra e la Luna (non in scala)	space between Earth and the Moon (not to scale)
LUNA	MOON
MARTE	MARS
VENERE	VENUS
TERRA	EARTH
Prova guidata · {n} minuti	Guided trial · {n} minutes
Gioca · facile	Play · easy
Gioca · normale	Play · normal
Gioca · difficile	Play · hard
Più soldi, rate più alte, meno guasti	More money, bigger instalments, fewer failures
Tutti i dati arrivano a terra.	All the data reach the ground.
Arriva a terra solo il {n}% dei dati: il resto si perde.	Only {n}% of the data reaches the ground: the rest is lost.
Dati al giorno	Data per day
Propellente	Propellant
{n} kg rimasti	{n} kg left
Le risorse si vedono dal lancio in poi.	Resources are shown from launch onwards.
Il lanciatore porta al massimo {n} kg in quest’orbita.	The launcher carries at most {n} kg to this orbit.
la radio scarica solo il {n}% dei dati	the radio downloads only {n}% of the data
Due progetti a confronto	Two designs side by side
Confronto	Comparison
Missioni diverse possono raggiungere lo stesso obiettivo con scelte diverse.	Different missions can reach the same goal with different choices.
Servono almeno due missioni da confrontare.	You need at least two missions to compare.
Tipo	Type
Lanciatore	Launcher
Orbita di lavoro	Working orbit
Durata	Duration
Scienza	Science
Riuscita	Successful
Il download non è disponibile in questa vista.	Download is not available in this view.
Il download non è disponibile qui.	Download is not available here.
Fase B · passo {n} di {n}	Phase B · step {n} of {n}
Fase C · progetto congelato	Phase C · design frozen
Revisione CDR · compra i pezzi	CDR review · buy the parts
Progetta {s}	Design {s}
Verifica {s}	Check {s}
1 · Missione (DRM)	1 · Mission (DRM)
2 · Satellite	2 · Satellite
3 · Orbite in dettaglio	3 · Detailed orbits
Prima completa la DRM: orbita di lavoro ★ e fine vita.	First complete the DRM: working orbit ★ and end of life.
Completa la Design Reference Mission (passo {n}): orbita di lavoro ★ e fine vita.	Complete the Design Reference Mission (step {n}): working orbit ★ and end of life.
Progetta il satellite (passo {n}).	Design the satellite (step {n}).
Dal rilascio all’orbita di lavoro ★	From release to the working orbit ★
piano 3D	3D plan
Rientro naturale: l’atmosfera frena il satellite	Natural re-entry: the atmosphere slows the satellite
Verso l’orbita cimitero	To the graveyard orbit
Totale (+{n}% di margine sul piano)	Total (+{n}% margin on the plan)
Mancano {n} m/s: serbatoio più grande al passo {n}, oppure togli una tappa al passo {n}.	{n} m/s missing: a bigger tank in step {n}, or remove a leg in step {n}.
La tua DRM	Your DRM
Fase B: passi liberi avanti e indietro, senza costi. La revisione PDR chiude la fase.	Phase B: move freely back and forth, at no cost. The PDR review closes the phase.
Sposta	Move
✥ Sposta	✥ Move
Puoi cambiare la disposizione del laboratorio quando vuoi.	You can rearrange the lab whenever you like.
Prova già fatta per {s}.	Test already done for {s}.
Revisione di volo superata: comincia la fase E.	Flight review passed: phase E begins.
Esci dal laboratorio e vai	Leave the lab and go
alla rampa di lancio	to the launch pad
del campus	on campus
Musica accesa.	Music on.
Musica spenta.	Music off.
Modalità libera	Free mode
orbita media 🔒 liv. {n}	medium orbit 🔒 lv. {n}
orbita alta (geostazionaria) 🔒 liv. {n}	high orbit (geostationary) 🔒 lv. {n}
orbita alta 🔒 liv. {n}	high orbit 🔒 lv. {n}
orbita bassa 🔒 liv. {n}	low orbit 🔒 lv. {n}
Assetto in avaria	Attitude failure
Il satellite ruota lento: si misura a tratti.	The satellite spins slowly: it measures only at times.
Assetto in avaria: Il satellite ruota lento: si misura a tratti.	Attitude failure: the satellite spins slowly and measures only at times.
Assetto senza ruota di scorta.	Attitude system with no spare wheel.
Chi vola insieme ad altri satelliti deve dimostrare di non rompersi: prova di vibrazione superata.	Whoever flies with other satellites must prove it will not break: vibration test passed.
Fase F	Phase F
Il computer di bordo non risponde più dopo la tempesta solare. Scienza {n}.	The on-board computer stopped responding after the solar storm. Science {n}.
La rampa si sblocca al livello {n}.	The launch pad unlocks at level {n}.
Le manovre esatte e i Δv si calcolano al passo {n}, con il satellite vero.	Exact manoeuvres and Δv are computed in step {n}, with the real satellite.
Livello attuale: {n}. I macchinari più avanzati si sbloccano salendo di livello.	Current level: {n}. More advanced machines unlock as you level up.
MISSIONE	MISSION
Missione riuscita: {n} mesi.	Mission successful: {n} months.
Missione riuscita: {n} mesi. Scienza {n}.	Mission successful: {n} months. Science {n}.
Misure durante le tempeste solari	Measurements during solar storms
NON RIUSCITA	FAILED
Nessun pezzo al freddo	No part left in the cold
Orbita Relay	Relay orbit
Per noi conta esserci: mettete il nostro logo sulla struttura.	What matters to us is being there: put our logo on the structure.
Proponi	Propose
Proponi: «Durata ≥ {n} mesi». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n}. Un no secco ne costa {n}, una deroga più avanti {n}.	Propose: «Duration ≥ {n} months». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}.
Proponi: «Margine di massa ≥ {n}%». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n}. Un no secco ne costa {n}, una deroga più avanti {n}.	Propose: «Mass margin ≥ {n}%». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}.
Proponi: «Prova di vibrazione superata». Accetta, ma perde {n} punti di soddisfazione invece di guadagnarne {n}. Un no secco ne costa {n}, una deroga più avanti {n}.	Propose: «Vibration test passed». They accept, but lose {n} satisfaction points instead of gaining {n}. A flat no costs {n}, a waiver later {n}.
Prove di vibrazione e funzionale superate	Vibration and functional tests passed
SCIENZA	SCIENCE
Prova di	Test:
Margine di	Margin:
Scarica in eclisse ≤ {n}%	Eclipse discharge ≤ {n}%
Se accetti diventa un requisito di missione: «Logo a bordo»	If you accept it becomes a mission requirement: «Logo on board»
Se accetti diventa un requisito di missione: «Prova di vibrazione per il lancio condiviso»	If you accept it becomes a mission requirement: «Vibration test for the rideshare launch»
Logo a bordo	Logo on board
Prova di vibrazione per il lancio condiviso	Vibration test for the rideshare launch
Su questa richiesta non si tratta	This request is not negotiable
vibrazione per il …	vibration for the …
{n} antenne collegate su {n}. La stazione da sola vale {n}% di dati; ogni antenna nel campus aggiunge {n}% di dati e {n}% di probabilità di riprendere il contatto radio quando il satellite tace. Le metti da «Modifica campus» → Infrastrutture.	{n} of {n} antennas connected. The station alone gives {n}% data; every antenna on campus adds {n}% data and {n}% chance of regaining radio contact when the satellite goes silent. Place them from «Edit campus» → Infrastructure.
{n} di {n}	{n} of {n}
{n} piante da interno. Più piante, più felicità: con la squadra al {n}% assemblaggio e prove durano ×{n}. Serve circa una pianta per dipendente per arrivare al {n}%. Le piante si mettono dentro gli edifici.	{n} indoor plants. More plants, more happiness: with the team at {n}% assembly and tests take ×{n}. You need about one plant per employee to reach {n}%. Plants go inside the buildings.
prenotazione {n} cr. Orbita di lavoro: {n} × {n} km · i {n}°; ΔV del piano {n} m/s. Fase C: il progetto si congela e alla CDR compri i pezzi.	booking {n} cr. Working orbit: {n} × {n} km · i {n}°; plan ΔV {n} m/s. Phase C: the design is frozen and at the CDR you buy the parts.
prenotazione {n} cr	booking {n} cr
Fase C: il progetto si congela e alla CDR compri i pezzi.	Phase C: the design is frozen and at the CDR you buy the parts.
AEB al tavolo	AEB at the table
AEE al tavolo	AEE at the table
AEP al tavolo	AEP at the table
ASES al tavolo	ASES at the table
ASI al tavolo	ASI at the table
BSA al tavolo	BSA at the table
CONAE al tavolo	CONAE at the table
CSA al tavolo	CSA at the table
ESA al tavolo	ESA at the table
GGPEN al tavolo	GGPEN at the table
ISRO al tavolo	ISRO at the table
JAXA al tavolo	JAXA at the table
KASA al tavolo	KASA at the table
MBRSC al tavolo	MBRSC at the table
NASRDA al tavolo	NASRDA at the table
TUA al tavolo	TUA at the table
UKSA al tavolo	UKSA at the table
Il satellite è completo: massa, potenza ed eclisse sono in verde. Passa al passo 3, le orbite in dettaglio.	The satellite is complete: mass, power and eclipse are green. Go to step 3, the detailed orbits.
il progetto rispetta tutti i requisiti. Compra i pezzi e passa all’assemblaggio.	the design meets all the requirements. Buy the parts and move on to assembly.
Critical Design Review: il progetto rispetta tutti i requisiti. Compra i pezzi e passa all’assemblaggio.	Critical Design Review: the design meets all the requirements. Buy the parts and move on to assembly.
ΔV del piano (+5%)	Plan ΔV (+5%)
oltre il satellite di {n} m/s	{n} m/s beyond the satellite
il satellite ne ha {n} m/s	the satellite has {n} m/s
{n}% di rientro anticipato	{n}% early re-entry
Orbita di lavoro ★	Working orbit ★
Dopo il piano: mantenimento d’orbita	After the plan: orbit maintenance
non basta	not enough
~{n} mesi	~{n} months
Orbite dentro l’atmosfera	Orbits inside the atmosphere
pericentro {n} km	periapsis {n} km
{n}% di rientro	{n}% re-entry
tocca la superficie	hits the surface
Sotto i {n} km l’aria frena il satellite a ogni passaggio al pericentro: rischia di rientrare e bruciare prima della fine della missione.	Below {n} km the air slows the satellite at every periapsis pass: it may re-enter and burn up before the end of the mission.
trasferimento verso Orbita {n}	transfer to Orbit {n}
trasferimento verso il cimitero	transfer to the graveyard
Elementi in formato TLE	Elements in TLE format
Riga 2: inclinazione, Ω (nodo ascendente), eccentricità (senza «0.»), ω (argomento del pericentro), anomalia media, moto medio in giri al giorno ({n}).	Line 2: inclination, Ω (ascending node), eccentricity (without «0.»), ω (argument of periapsis), mean anomaly, mean motion in revolutions per day ({n}).
Eccentricità	Eccentricity
forma	shape
gradi	degrees
Nodo	Node
Anomalia	Anomaly
Dalla DRM:	From the DRM:
(semiasse maggiore = raggio {n} + quota {n}). Qui scegli il resto dell’orbita.	(semi-major axis = radius {n} + altitude {n}). Here you choose the rest of the orbit.
a = {n} km	a = {n} km
Circolare	Circular
Polare	Polar
Eliosincrona	Sun-synchronous
Equatoriale	Equatorial
Piano precedente	Previous plane
apocentro	apoapsis
nell’atmosfera: {n}% di rientro	in the atmosphere: {n}% re-entry
Le orbite della missione	The mission orbits
Orbita {n} ★	Orbit {n} ★
Scegli il lanciatore qui sopra.	Choose the launcher above.
via {n} × {n} km	via {n} × {n} km
via {n} km	via {n} km
Fine vita	End of life
Rientro con la vela: nessuna manovra	Re-entry with the sail: no manoeuvre
Impatto: l’orbita tocca già la superficie	Impact: the orbit already touches the surface
Rientro: l’orbita entra già nell’atmosfera	Re-entry: the orbit already dips into the atmosphere
Come eseguire le manovre	How to perform the manoeuvres
Cattura all’arrivo	Capture on arrival
Trasferimenti fino all’orbita ★	Transfers up to the ★ orbit
I trasferimenti si calcolano da soli: due accensioni agli apsidi, con il cambio di piano dove conviene. Cambiare inclinazione o nodo costa moltissimo in orbita bassa: conviene scegliere un lanciatore che ti rilascia già sul piano giusto.	Transfers are computed automatically: two burns at the apsides, with the plane change where it is cheapest. Changing inclination or node costs a great deal in low orbit: better to pick a launcher that releases you on the right plane.
Il satellite è costruito: queste sono le orbite che volerà.	The satellite is built: these are the orbits it will fly.
Passo 3: la DRM ha fissato il semiasse maggiore di ogni orbita. Ora scegli eccentricità, inclinazione, nodo, pericentro e anomalia: il ΔV si calcola da solo.	Step 3: the DRM has fixed the semi-major axis of every orbit. Now choose eccentricity, inclination, node, periapsis and anomaly: the ΔV is computed automatically.
Fase C: puoi ancora ritoccare le orbite; il lancio è già prenotato.	Phase C: you can still adjust the orbits; the launch is already booked.
orbite della DRM	DRM orbits
trasferimenti	transfers
fine vita	end of life
dentro l’atmosfera	inside the atmosphere
Trascina per ruotare · doppio clic per riportare la vista	Drag to rotate · double-click to reset the view
Trascina per ruotare	Drag to rotate
doppio clic per riportare la vista	double-click to reset the view
Orbite	Orbits
Vista orbitale: trascina per ruotarla	Orbital view: drag to rotate it
La DRM fissa il semiasse maggiore di ogni orbita. Al passo 3 scegli inclinazione, eccentricità e gli altri elementi, e vedi i Δv.	The DRM fixes the semi-major axis of every orbit. In step 3 you choose inclination, eccentricity and the other elements, and see the Δv.
Frenata di cattura	Capture burn
Verso Orbita {n}	To Orbit {n}
Verso Orbita {n} ★	To Orbit {n} ★
L’orbita «Orbita {n}» tocca la superficie: alza il pericentro (meno eccentricità)	Orbit «Orbit {n}» hits the surface: raise the periapsis (less eccentricity)
L’orbita «trasferimento verso Orbita {n}» tocca la superficie: alza il pericentro (meno eccentricità)	The «transfer to Orbit {n}» hits the surface: raise the periapsis (less eccentricity)
Pericentro nell’atmosfera	Periapsis in the atmosphere
{n}% che l’attrito faccia rientrare il satellite prima del tempo (pericentro a {n} km)	{n}% chance that drag brings the satellite down early (periapsis at {n} km)
Nel Centro di dinamica del volo riduci l’eccentricità: il pericentro deve stare sopra l’atmosfera	In the flight dynamics centre reduce the eccentricity: the periapsis must stay above the atmosphere
Il pericentro di «Orbita {n}» scende a {n} km, dentro l’atmosfera: l’attrito ha frenato il satellite, che è rientrato e bruciato.	The periapsis of «Orbit {n}» drops to {n} km, inside the atmosphere: drag slowed the satellite, which re-entered and burned up.
Attenzione: {n}% di probabilità che l’attrito dell’atmosfera faccia rientrare il satellite prima del tempo (pericentro a {n} km).	Warning: {n}% chance that atmospheric drag brings the satellite down early (periapsis at {n} km).
Orbita {n} · periodo {n} min	Orbit {n} · period {n} min
Orbita {n} · periodo {n} h	Orbit {n} · period {n} h
Rilascio · periodo {n} min	Release · period {n} min
Rilascio · periodo {n} h	Release · period {n} h
periodo {n} min	period {n} min
⚠ {n}% di rientro anticipato	⚠ {n}% early re-entry
Orbita {n}: pericentro {n} km	Orbit {n}: periapsis {n} km
trasferimento verso Orbita {n}: pericentro {n} km	transfer to Orbit {n}: periapsis {n} km
trasferimento verso il cimitero: pericentro {n} km	transfer to the graveyard: periapsis {n} km
Rilascio: pericentro {n} km	Release: periapsis {n} km
Fondo di avvio aumentato: +{n} cr per la prima missione.	Start-up fund increased: +{n} cr for the first mission.
Ogni edificio si apre in una stanza disegnata; l	Every building opens into a drawn room; the
↑ VISTA SUL CIELO	↑ SKY VIEW
ADATTATORE DEL LANCIATORE	LAUNCHER ADAPTER
serve la stazione di terra	needs the ground station
Gli edifici principali si spostano ma non si demoliscono.	Main buildings can be moved but not demolished.
Rimuovendolo recuperi metà del costo.	Removing it gets you back half the cost.
Scegli il nuovo posto per	Choose the new spot for
Esc per annullare.	Esc to cancel.
Tocca un punto libero del campus per costruire	Tap a free spot on the campus to build
Scegli il nuovo posto.	Choose the new spot.
Tocca un punto libero del campus.	Tap a free spot on the campus.
Non hai abbastanza crediti.	You do not have enough credits.
Rampa costruita: ora puoi lanciare da casa.	Pad built: now you can launch from home.
Disegna la tua bandiera	Draw your flag
Comparirà sulla facciata dell’edificio di costruzione, come la grande bandiera sul Vehicle Assembly Building del	It will appear on the façade of the assembly building, like the big flag on the Vehicle Assembly Building at
Salva bandiera	Save flag
Torna alle strisce	Back to the stripes
Crea la tua prima missione con il tasto + in alto a sinistra.	Create your first mission with the + button at the top left.
Il tuo staff tecnico ha delle richieste: sala riunioni.	Your technical staff has requests: meeting room.
Entra nell’edificio amministrativo e scegli gli stakeholder.	Enter the administration building and choose the stakeholders.
Al tavolo ti aspettano gli stakeholder.	The stakeholders are waiting at the table.
Fase B, passo 2: progetta il satellite nell’edificio di costruzione.	Phase B, step 2: design the satellite in the assembly building.
Fase B, passo 3: orbite in dettaglio, poi la revisione PDR.	Phase B, step 3: detailed orbits, then the PDR review.
Assemblaggio in camera bianca. Intanto puoi lavorare a un’altra missione.	Assembly in the clean room. Meanwhile you can work on another mission.
Pronto al lancio: vai alla rampa.	Ready for launch: go to the pad.
Porta il satellite al laboratorio prove.	Take the satellite to the test lab.
Il tempo è fermo: in sala controllo ti aspetta una decisione.	Time is stopped: a decision awaits you in the control room.
Missione completata. Guarda il bilancio nella cartella.	Mission complete. See the results in the folder.
Lotto libero	Free plot
Cosa costruisci qui?	What will you build here?
Ogni edificio si costruisce una volta e vale per tutte le missioni. Livello attuale:	Each building is built once and serves every mission. Current level:
già costruito	already built
Matrice dei rischi di	Risk matrix of
XP · tocca per la roadmap	XP · tap for the roadmap
Nessuna missione. Creane una dal pulsante in alto a sinistra.	No missions. Create one with the button at the top left.
nessun lancio per	no launch for
accetta questa taglia	accept this size
con i requisiti accettati non basta	not enough with the accepted requirements
La classe e la taglia decidono quanto spazio, quanta massa e quanta energia avrai, e quanto costerà il lancio. Poi lo staff tecnico ti dirà i suoi requisiti di sistema.	The class and size decide how much space, mass and energy you will have, and how much the launch will cost. Then the technical staff will tell you their system requirements.
Microsatellite	Microsatellite
Classe ESPA, fino a circa 180 kg	ESPA class, up to about 180 kg
Scegli gli stakeholder: la NASA c’è sempre. Tocca ⓘ per i dettagli.	Choose the stakeholders: NASA is always there. Tap ⓘ for details.
Al tuo livello non puoi farla: al collaudo servirà una deroga.	At your level you cannot do it: at acceptance you will need a waiver.
già ora nessun satellite rispetta tutto	already no satellite meets everything
Se accetti, una delle due finirà in deroga.	If you accept, one of the two will end up waived.
Lascia il tavolo	Leaves the table
e porta via	and takes away
è troppo scontento per trattare	is too unhappy to negotiate
Controproposta	Counter-proposal
punti di soddisfazione invece di guadagnarne	satisfaction points instead of gaining
una deroga più avanti	a waiver later
Qui si costruisce il satellite in fase C e lo si assembla in fase D.	Here the satellite is built in phase C and assembled in phase D.
Banchi di lavoro	Workbenches
Nessun satellite da costruire. Una missione arriva qui in fase C, dopo la revisione PDR.	No satellite to build. A mission arrives here in phase C, after the PDR review.
Nessun satellite in assemblaggio. Ci arrivano dopo la CDR, in fase D. Più satelliti possono essere assemblati insieme.	No satellite in assembly. They arrive after the CDR, in phase D. Several satellites can be assembled together.
costruisci la tua rampa di lancio	build your launch pad
cr per kg	cr per kg
Passa al banco di	Switch to the bench of
lancio da scegliere	launch to be chosen
Porta i pezzi dentro la struttura e rispetta i requisiti. Trascina lo sfondo per girare il satellite; doppio tocco su un pezzo per ruotarlo.	Bring the parts into the structure and meet the requirements. Drag the background to turn the satellite; double-tap a part to rotate it.
Dalla seconda missione il satellite lo progetti tu.	From the second mission on you design the satellite yourself.
Prima scegli i pezzi dal magazzino, poi li dispongo io.	First choose the parts from the store, then I will arrange them.
Non ci stanno: prova una struttura più grande.	They do not fit: try a bigger structure.
Fatto il possibile: restano	Did what I could: there are still
problemi. Guarda i requisiti in rosso.	problems. Look at the requirements in red.
Proposta pronta: tutti i requisiti di progetto rispettati. Ora pensa al piano di volo.	Proposal ready: all design requirements met. Now think about the flight plan.
Disposizione trovata: tutti i requisiti di progetto rispettati.	Layout found: all design requirements met.
lo spazio nella struttura	the space in the structure
Nessun conflitto aperto: il progetto rispetta tutto.	No open conflicts: the design meets everything.
al limite: un cambio piccolo può rompere qualcosa.	at the limit: a small change can break something.
Il nodo è qui:	The crux is here:
Sistemarne uno rischia di rompere l’altro: decidi tu quale far cedere.	Fixing one risks breaking the other: you decide which one gives way.
Il problema più grosso è	The biggest problem is
è già al limite: guarda cosa la sta consumando.	is already at the limit: see what is using it up.
In tutto i requisiti in rosso sono	In total the requirements in red are
spazio tra la Terra e	space between Earth and
(non in scala)	(not to scale)
lancio e viaggio verso	launch and journey to
Rilascia: nuova orbita a	Release: new orbit at
meno	less
rilascio in orbita a	release into orbit at
rilascio in orbita	release into orbit
fino a	up to
Quota che si sblocca al livello	Altitude that unlocks at level
Dalla DRM	From the DRM
Missione con lander: il lancio porta il satellite fino al suolo.	Lander mission: the launch takes the satellite all the way to the ground.
m/s ΔV del satellite	m/s Satellite ΔV
m/s: serbatoio più grande al passo 2 (Grande o Extra), oppure togli una tappa al passo 1.	m/s: bigger tank in step 2 (Large or Extra), or remove a leg in step 1.
di rientro anticipato	early re-entry
Orbita di lavoro ★ ·	Working orbit ★ ·
km l’aria frena il satellite a ogni passaggio al pericentro: rischia di rientrare e bruciare prima della fine della missione.	km the air slows the satellite at every periapsis pass: it may re-enter and burn up before the end of the mission.
Riga 2: inclinazione, Ω (nodo ascendente), eccentricità (senza «0.»), ω (argomento del pericentro), anomalia media, moto medio in giri al giorno (	Line 2: inclination, Ω (ascending node), eccentricity (without «0.»), ω (argument of periapsis), mean anomaly, mean motion in revolutions per day (
Dalla DRM: a =	From the DRM: a =
Qui scegli il resto dell’orbita.	Here you choose the rest of the orbit.
di perdere il satellite	chance of losing the satellite
Nessuna missione. Creane una con il tasto +.	No missions. Create one with the + button.
Analisi orbitale di	Orbit analysis of
Il satellite è costruito: il piano è quello che volerà.	The satellite is built: this is the plan it will fly.
La vista 3D non è disponibile su questo dispositivo: usa i comandi a destra.	The 3D view is not available on this device: use the controls on the right.
Prezzo per il	Price for the
Il detrito vola a	The debris flies at
Propulsore non ancora scelto: stima con il migliore del tuo livello (	Thruster not chosen yet: estimate with the best of your level (
su un CubeSat da	on a CubeSat of
kg. Lo monterai in fase C.	kg. You will fit it in phase C.
lanciatore da scegliere	launcher to be chosen
Scegli il lanciatore nell’edificio di costruzione: per ora uso il rideshare.	Choose the launcher in the assembly building: for now I use the rideshare.
Punto del burn	Burn point
Cambio di piano	Plane change
mesi senza scienza	months without science
m/s col motore del satellite ·	m/s with the satellite’s engine ·
Stadio di discesa dedicato ·	Dedicated descent stage ·
di rischio · scienza ×	risk · science ×
m/s al mese	m/s per month
più ΔV ogni mese.	more ΔV every month.
Nessun satellite in volo. Quelli che lanci da ora in poi scaricano il	No satellite in flight. The ones you launch from now on download
di dati in più.	more data.
un livello prima	one level earlier
Trascina i pezzi dentro la struttura e rispetta i requisiti che hai accettato al tavolo.	Drag the parts into the structure and meet the requirements you accepted at the table.
Go No-Go · resoconto di missione ·	Go No-Go · mission report ·
Profilo della missione	Mission profile
Risultato	Result
Missione non ancora conclusa (	Mission not finished yet (
Creato con Go No-Go · NASA Space Apps Challenge 2026 Torino	Made with Go No-Go · NASA Space Apps Challenge 2026 Turin
Arriva a terra solo il	Only
dei dati: il resto si perde.	of the data reaches the ground: the rest is lost.
(lancio già pagato)	(launch already paid)
(pezzi già comprati: −	(parts already bought: −
Tutto in regola.	All in order.
Il lanciatore porta al massimo	The launcher carries at most
kg in quest’orbita.	kg to this orbit.
troppa massa: è il pezzo più pesante	too much mass: it is the heaviest part
potenza: è il pezzo che consuma di più	power: it is the part that uses the most
eclisse: la batteria non basta	eclipse: the battery is not enough
la radio scarica solo il	the radio downloads only
Non c’è spazio: sposta o togli qualcosa.	There is no room: move or remove something.
Non c’è spazio per ruotarlo qui.	There is no room to rotate it here.
satelliti in assemblaggio, in parallelo.	satellites in assembly, in parallel.
satellite in assemblaggio.	satellite in assembly.
Tocca una postazione per vedere a che punto è; quando è pronto, toccalo per portarlo al laboratorio.	Tap a station to see its progress; when it is ready, tap it to take it to the lab.
Satellite in integrazione	Satellite in integration
deroga, il difetto vola:	waiver, the defect flies:
Revisione di volo superata: comincia la fase E. Esci dal laboratorio e vai	Flight review passed: phase E begins. Leave the lab and go
alla rampa di lancio del campus	to the campus launch pad
all’ edificio amministrativo : da lì segui il lancio con l’ente terzo	to the administration building: from there follow the third-party launch
all’	to the
da lì segui il lancio con l’ente terzo	from there follow the third-party launch
Edificio di testing ·	Test building ·
su un macchinario per provarlo (	onto a machine to test it (
cr a prova).	cr per test).
Scegli un satellite con il tasto «Satelliti».	Choose a satellite with the «Satellites» button.
Ogni prova scopre un tipo di difetto prima che lo scopra lo spazio.	Every test uncovers a type of defect before space does.
Ogni prova saltata resta un rischio nel registro dei rischi.	Every skipped test stays a risk in the risk register.
Revisione di volo superata. Il satellite è sulla tua rampa di lancio.	Flight review passed. The satellite is on your launch pad.
Revisione di volo superata. Il lancio è affidato a un ente terzo. Lancia	Flight review passed. The launch is entrusted to a third party. Launch
I macchinari più avanzati si sbloccano salendo di livello.	More advanced machines unlock as you level up.
Se il difetto vola:	If the defect flies:
già installato	already installed
è scontento	is unhappy
i rischi del suo sottosistema non compaiono più nel registro. Non vuol dire che non ci siano.	the risks of their subsystem no longer appear in the register. That does not mean they are not there.
Il ΔV basta per circa	The ΔV lasts about
Scegli quanti mesi di missione e avvia il conto alla rovescia.	Choose how many months of mission and start the countdown.
mesi. La durata che dichiari è un impegno: ogni mese promesso e non volato costa	months. The duration you declare is a commitment: every month promised and not flown costs
cr di penale. Ogni mese di operazioni costa	cr in penalties. Every month of operations costs
s, e il tempo si ferma quando devi decidere.	s, and time stops when you have to decide.
La stazione di terra dà +20% di scienza.	The ground station gives +20% science.
è in preparazione. Il satellite arriva sulla rampa dopo la revisione di volo (FRR).	is being prepared. The satellite reaches the pad after the flight review (FRR).
Razzi in preparazione:	Rockets being prepared:
La rampa è vuota: il razzo arriva quando scegli il lanciatore nell’edificio di costruzione.	The pad is empty: the rocket arrives when you choose the launcher in the assembly building.
Rampa di lancio della tua agenzia	Your agency’s launch pad
sito di lancio esterno	external launch site
Scegli la durata con − e +, poi premi LAUNCH. Ogni mese promesso e non volato costa	Choose the duration with − and +, then press LAUNCH. Every month promised and not flown costs
cr; ogni mese di operazioni	cr; every month of operations
satelliti in volo	satellites in flight
satellite in volo	satellite in flight
Tocca gli schermi per la telemetria.	Tap the screens for the telemetry.
Missione chiusa: la telemetria di	Mission closed: the telemetry of
è archiviata qui sotto.	is archived below.
Telemetria in diretta da	Live telemetry from
La telemetria parte con il lancio.	Telemetry starts with the launch.
è sulla rampa: vai alla rampa per il lancio.	is on the pad: go to the pad for the launch.
// ==== LANCIO di	// ==== LAUNCH of
// in attesa del lancio	// waiting for launch
// la telemetria comincia quando il satellite lascia la rampa	// telemetry starts when the satellite leaves the pad
mesi ancora. Fai decidere all’autopilota	months to go. Let the autopilot decide
Missioni in corso	Missions in progress
problema in volo ·	in-flight problem ·
torna alla fase	back to phase
Nessuna missione in corso.	No mission in progress.
da portare in camera bianca	to take to the clean room
assemblaggio in corso	assembly in progress
progetto del satellite	satellite design
orbite in dettaglio	detailed orbits
decisione in attesa · mese	decision pending · month
Misurare la radiazione attorno alla Luna per proteggere i futuri equipaggi.	Measure the radiation around the Moon to protect future crews.
Osservare la Terra dall’orbita bassa e provare nuove tecnologie a basso costo.	Observe Earth from low orbit and test new low-cost technologies.
Mappare la radiazione nell’orbita di Marte prima dell’arrivo dei primi esploratori.	Map the radiation in Mars orbit before the first explorers arrive.
Studiare l’atmosfera di Venere dall’orbita e capire perché è diventata un inferno.	Study Venus’s atmosphere from orbit and understand why it became an inferno.
km da Marte	km from Mars
Portare un rover sulla superficie	Take a rover to the surface
e studiarne il suolo da vicino.	and study its soil up close.
e studiare il suolo di una luna di Marte.	and study the soil of a moon of Mars.
stadio di discesa	descent stage
non sul suolo	not on the ground
I tipi con il lucchetto non hanno ancora un payload o un propulsore adatto al tuo livello: si sbloccano salendo.	Locked types do not yet have a payload or thruster suited to your level: they unlock as you level up.
Sul suolo il payload è un	On the ground the payload is a
lander con trivella	lander with a drill
servono missioni scientifiche, di osservazione o dimostrative.	you need science, observation or demonstration missions.
missioni aperte. Chiudine una o sali di livello.	open missions. Close one or level up.
Mission statement	Mission statement
Pubblica in bacheca	Publish on the board
Nessuna missione pubblicata. Completa una missione e pubblicala: sarà la prima.	No published missions. Complete a mission and publish it: it will be the first.
La bacheca online si vede dalla pagina pubblicata.	The online board is visible from the published page.
serve una tua decisione in sala controllo.	your decision is needed in the control room.
problema in volo. Controlla il Mission Control Center.	in-flight problem. Check the Mission Control Center.
l’aveva trovato: hai firmato una deroga.	had found it: you signed a waiver.
Non avevi il macchinario per la prova	You did not have the machine for the test
Hai saltato la prova	You skipped the test
L’autopilota, su tua delega, ha scelto «	The autopilot, on your behalf, chose «
Hai scelto «	You chose «
Una tua scelta.	One of your choices.
Ha deciso l’autopilota.	The autopilot decided.
Il computer di bordo: senza scorta, o non resistente alle radiazioni.	The on-board computer: no spare, or not radiation-hardened.
La radio scelta in progetto.	The radio chosen in the design.
Batteria piccola per un’eclisse di	Small battery for an eclipse of
Il ΔV rimasto non bastava per i	The remaining ΔV was not enough for the
mesi che hai dichiarato.	months you declared.
scelta nel Centro di dinamica del volo.	chosen in the flight dynamics centre.
Il rischio dell’atterraggio: lo accetti scegliendo il suolo.	The landing risk: you accept it by choosing the surface.
Il piano di volo non arrivava all’orbita obiettivo.	The flight plan did not reach the target orbit.
La quota di lavoro scelta nella fascia.	The working altitude chosen in the band.
Il caso: nessuna scelta l’avrebbe evitato del tutto.	Chance: no choice would have avoided it entirely.
invece di «	instead of «
Con la prova	With the test
fatta e il difetto riparato	done and the defect repaired
mesi invece di	months instead of
Con il trasferimento Hohmann invece di «	With the Hohmann transfer instead of «
Il satellite è rimasto in orbita come detrito.	The satellite stayed in orbit as debris.
Premi degli stakeholder soddisfatti +	Bonuses from satisfied stakeholders +
mesi promessi e non volati −	months promised and not flown −
E se…? Rigioca il volo cambiando una sola cosa.	What if…? Replay the flight changing just one thing.
Prima finisci il tutorial, oppure saltalo.	First finish the tutorial, or skip it.
Questo tipo di missione non è ancora possibile al tuo livello.	This type of mission is not yet possible at your level.
Design Reference Mission	Design Reference Mission
Un nuovo sponsor si sblocca al prossimo livello.	A new sponsor unlocks at the next level.
è nel tuo roster: lo trovi nell’edificio amministrativo.	is on your roster: you will find them in the administration building.
Ricominciare da capo?	Start over?
Cancelli agenzia, missioni, edifici, macchinari, sponsor e livello. Non si torna indietro.	You erase agency, missions, buildings, machines, sponsors and level. There is no going back.
Sì, ricomincia	Yes, start over
requisiti di missione. Gli stakeholder promettono	mission requirements. The stakeholders promise
requisiti di sistema. In fase B si fa l’analisi orbitale nel Centro di dinamica del volo.	system requirements. In phase B you do the orbit analysis in the flight dynamics centre.
Si sblocca al livello	Unlocks at level
XP. Si guadagnano chiudendo missioni.	XP. You earn them by closing missions.
Non entra in questa struttura: serve un CubeSat più grande.	It does not fit in this structure: you need a bigger CubeSat.
Il progetto è congelato: il serbatoio si sceglie in fase B.	The design is frozen: the tank is chosen in phase B.
l’assemblaggio in camera bianca richiede	assembly in the clean room takes
In cassa ci sono solo	There are only
Serve un progetto più economico.	You need a cheaper design.
Una deroga chiude il requisito, ma è una promessa rotta: chi lo ha chiesto perde	A waiver closes the requirement, but it is a broken promise: whoever asked for it loses
punti di soddisfazione, e con loro una parte delle rate.	satisfaction points, and with them part of the instalments.
I requisiti di base non si derogano.	Basic requirements cannot be waived.
Il piano di volo si progetta nel Centro di dinamica del volo.	The flight plan is designed in the flight dynamics centre.
Le regole non si derogano.	Rules cannot be waived.
è assemblato: esci e portalo all’edificio di testing per le prove.	is assembled: go out and take it to the test building for the tests.
Non hai abbastanza soldi.	You do not have enough money.
Tocca un punto libero del laboratorio per posizionare	Tap a free spot in the lab to place
Le antenne si collegano alla stazione di terra: costruiscila prima (Edifici).	Antennas connect to the ground station: build it first (Buildings).
Già costruito.	Already built.
dipendenti liberi, ne hai	free staff, you have
Senza questo parcheggio	Without this car park
dipendenti resterebbero senza posto auto.	staff would be left without a parking space.
Bandiera dipinta sull’edificio di costruzione.	Flag painted on the assembly building.
Effetto attivo su tutte le missioni.	Effect active on all missions.
L’ente regolatore non autorizza il lancio senza queste prove: niente deroghe.	The regulator does not authorise the launch without these tests: no waivers.
non firma senza queste prove.	will not sign without these tests.
Torna alle prove	Back to the tests
Senza prova superata:	Without a passed test:
Eventuali difetti voleranno con il satellite.	Any defects will fly with the satellite.
Tutte le prove superate.	All tests passed.
è pronto: comincia la fase E. Vai all’edificio amministrativo per il lancio.	is ready: phase E begins. Go to the administration building for the launch.
è sulla rampa di lancio: comincia la fase E.	is on the launch pad: phase E begins.
è in orbita: esci e vai al Mission Control Center per seguirlo.	is in orbit: go out to the Mission Control Center to follow it.
Rampa di lancio costruita: da ora puoi lanciare in casa, con il 40% in meno.	Launch pad built: from now on you can launch at home, 40% cheaper.
in volo: segui la telemetria dal Mission Control Center.	in flight: follow the telemetry from the Mission Control Center.
rispetto a com’è andata)	compared with how it went)
Un solo cambiamento, poi il caso e l’autopilota fanno il resto: rigioca più volte la stessa idea e i numeri cambiano.	Just one change, then chance and the autopilot do the rest: replay the same idea several times and the numbers change.
La bacheca online è disponibile nella pagina pubblicata.	The online board is available on the published page.
Non è stato possibile rimuoverla.	It could not be removed.
La missione tutorial non si pubblica.	The tutorial mission cannot be published.
Pubblicata in bacheca.	Published on the board.
Non è stato possibile pubblicare: la bacheca accetta solo chi ha accesso in scrittura.	Could not publish: the board only accepts those with write access.
Postazione libera: qui arriva un satellite dopo la CDR.	Free station: a satellite arrives here after the CDR.
Il catalogo NASA:	The NASA catalogue:
tecnologie, sbloccate con i livelli	technologies, unlocked with levels
Fondi per la missione	Funds for the mission
Ci tiene a:	Cares about:
Tutti i posti auto sono occupati: costruisci un parcheggio.	All parking spaces are taken: build a car park.
Il laboratorio ha posto per	The lab has room for
Prova in corso: lo sposti quando ha finito.	Test in progress: move it when it has finished.
Trascina il satellite sul macchinario per avviare la prova.	Drag the satellite onto the machine to start the test.
prova già fatta per	test already done for
scegli un satellite dal magazzino a sinistra.	choose a satellite from the store on the left.
Banco libero: crea una nuova missione con il tasto + e portala in fase C.	Free bench: create a new mission with the + button and take it to phase C.
Lancio con un ente terzo	Third-party launch
da un sito di lancio esterno. Il servizio è già pagato.	from an external launch site. The service is already paid.
Ogni mese promesso e non volato costa	Every month promised and not flown costs
cr di penale; ogni mese di operazioni	cr in penalties; every month of operations
Più tardi	Later
m/s, il satellite ne ha	m/s, the satellite has
Il satellite pesa	The satellite weighs
in quest’orbita.	to this orbit.
L’orbita finale non è dentro la fascia obiettivo.	The final orbit is not inside the target band.
Scegli una strategia per ogni tratto del viaggio.	Choose a strategy for each leg of the journey.
Il piano chiede	The plan asks for
m/s (con il margine), ma il miglior propulsore del tuo livello ne dà circa	m/s (with margin), but the best thruster at your level gives about
scegli un’orbita più vicina a quella di rilascio.	choose an orbit closer to the release orbit.
Orbita di lavoro:	Working orbit:
con il propulsore che hai scelto	with the thruster you chose
Attenzione: la radio scarica solo il	Warning: the radio downloads only
dei dati prodotti. La scienza in volo calerà nella stessa misura.	of the data produced. Science in flight will drop by the same amount.
di probabilità che l’attrito dell’atmosfera faccia rientrare il satellite prima del tempo (pericentro a	chance that atmospheric drag brings the satellite down early (periapsis at
Anche con la rata non basta per prenotare il lancio.	Even with the instalment there is not enough to book the launch.
Non hai abbastanza crediti, nemmeno con la rata.	You do not have enough credits, not even with the instalment.
se ne va: d’ora in poi nessuno ti segnala i rischi del suo sottosistema.	leaves: from now on nobody flags the risks of their subsystem.
lascia la missione: niente più rate da lui. Le sue tecnologie non sono più disponibili.	leaves the mission: no more instalments from them. Their technologies are no longer available.
paga il	pays
Una missione riuscita in collaborazione	A successful mission in partnership
Campus più grande (	Bigger campus (
Fascia di Kuiper	Kuiper belt
Le due postazioni sono occupate: aspetta che un satellite finisca.	Both stations are busy: wait for a satellite to finish.
Nessun macchinario libero per questo satellite.	No free machine for this satellite.
Lascialo sopra una postazione libera.	Drop it on a free station.
è sulla postazione: i tecnici iniziano l’assemblaggio.	is on the station: the technicians start the assembly.
in prova ·	testing ·
Pianta ·	Plant ·
Pianta da interno	Indoor plant
Rimuovi	Remove
piante in tutto · squadra felice al	plants in total · team happy at
Tocca un punto libero per mettere la pianta.	Tap a free spot to place the plant.
Tocca il nuovo posto per:	Tap the new spot for:
Tocca un punto libero per posizionare:	Tap a free spot to place:
Pianta aggiunta: la squadra è felice al	Plant added: the team is happy at
Stipendi a ogni nuova fase di una missione (	Salaries at every new phase of a mission (
cr a testa). Se le missioni sono ferme non paghi nulla. −	cr each). If missions are idle you pay nothing. −
piante da interno. Più piante, più felicità: con la squadra al	indoor plants. More plants, more happiness: with the team at
assemblaggio e prove durano ×	assembly and tests take ×
Serve circa una pianta per dipendente per arrivare al 100%. Le piante si mettono dentro gli edifici.	You need about one plant per employee to reach 100%. Plants go inside the buildings.
Tutti i posti auto sono occupati: per assumere costruisci un parcheggio nel campus (Costruisci → Infrastrutture).	All parking spaces are taken: to hire, build a car park on campus (Build → Infrastructure).
Nessuna agenzia in classifica: chiudi una missione e sarai la prima.	No agencies in the ranking: close a mission and you will be the first.
punti per la Lega	points for the League
punti scienza ed entra nella Lega	science points and join the League
A · fattibilità	A · feasibility
C · progetto di dettaglio	C · detailed design
D · assemblaggio e prove	D · assembly and tests
Si riapre il tavolo con gli stakeholder: i requisiti di missione e di sistema accettati vengono cancellati e si rinegoziano.	The table with the stakeholders reopens: accepted mission and system requirements are cancelled and renegotiated.
La prima rata è già incassata: non arriva una seconda volta.	The first instalment is already collected: it does not come a second time.
Puoi cambiare taglia del satellite. Lo staff tecnico torna al tavolo: i requisiti di sistema si rinegoziano.	You can change the satellite size. The technical staff returns to the table: system requirements are renegotiated.
Il lancio prenotato si disdice: perdi metà della prenotazione (	The booked launch is cancelled: you lose half the booking (
l’altra metà ti torna.	the other half comes back to you.
Puoi rifare l’analisi orbitale e scegliere un altro lancio. Il progetto del satellite resta com’è.	You can redo the orbit analysis and choose another launch. The satellite design stays as it is.
Il satellite si smonta: i pezzi comprati valgono ancora	The satellite is taken apart: the parts bought are still worth
(60%) quando ripassi la CDR,	(60%) when you pass the CDR again,
sono persi tra smontaggio e pezzi da buttare.	are lost to disassembly and scrapped parts.
Le prove fatte vanno rifatte. I macchinari del laboratorio restano.	Tests done must be redone. The lab machines stay.
La revisione FRR va ripetuta: la rata è già incassata.	The FRR review must be repeated: the instalment is already collected.
Da questa fase non si torna indietro.	There is no going back from this phase.
Ritorno di fase	Phase rollback
Torna alla fase	Go back to phase
Tornare indietro è possibile, ma costa: tempo, soldi e fiducia degli stakeholder. È quello che succede in un progetto vero quando una revisione scopre un problema.	Going back is possible, but it costs: time, money and stakeholder trust. That is what happens in a real project when a review uncovers a problem.
Costo della revisione straordinaria	Cost of the extraordinary review
Rimborso della prenotazione +	Booking refund +
Soddisfazione della NASA −	NASA satisfaction −
Sei tornato alla fase	You went back to phase
Il mio primo CubeSat: misurare la radiazione in orbita bassa.	My first CubeSat: measuring radiation in low orbit.
Tutorial saltato. Crea la tua prima missione con il tasto + in alto.	Tutorial skipped. Create your first mission with the + button at the top.
Fine del primo volo	End of the first flight
Era una prova: non dà punti, non va in bacheca e la tua agenzia riparte da	It was a trial: it gives no points, does not go on the board, and your agency restarts from
come se l’avessi saltato. Da adesso le missioni sono vere: le richieste cambiano ogni volta e decidi tu.	as if you had skipped it. From now on missions are real: the requests change every time and you decide.
prima torna al campus con la casetta in basso a destra.	first go back to the campus with the house button at the bottom right.
Tocca l’edificio sulla mappa.	Tap the building on the map.
Il razzo di un ente terzo è pronto, il servizio è già pagato. Lancia!	A third-party rocket is ready, the service is already paid. Launch!
Installa il banco per la prova funzionale: accende tutto e controlla che risponda.	Install the bench for the functional test: it switches everything on and checks it responds.
Un imprevisto in orbita: scegli tu cosa fare.	Something unexpected in orbit: you choose what to do.
Leggi e chiudi la finestra.	Read and close the window.
Benvenuto! Questa prima missione è guidata. Entra nell’edificio amministrativo: la NASA ti aspetta.	Welcome! This first mission is guided. Enter the administration building: NASA is waiting for you.
Torna nella sala riunioni.	Go back to the meeting room.
Passo 2: progetta il satellite nell’edificio di costruzione.	Step 2: design the satellite in the assembly building.
Ogni satellite si progetta sul banco da design. Tocca il banco di	Every satellite is designed on the design bench. Tap the bench of
Apri la scheda con tutti i pezzi.	Open the tab with all the parts.
Servono pannelli solari: scegli le ali dispiegabili, danno più potenza di quelli sul corpo.	You need solar panels: choose the deployable wings, they give more power than body-mounted ones.
Apri la scheda dei pannelli solari.	Open the solar panels tab.
Passo 3: torna al Centro di dinamica del volo	Step 3: go back to the flight dynamics centre
Tocca il banco di	Tap the bench of
Revisione di volo superata: comincia la fase E. Vai all’edificio amministrativo per il lancio	Flight review passed: phase E begins. Go to the administration building for the launch
Al laboratorio prove: i requisiti chiedono la prova di vibrazione.	To the test lab: the requirements ask for the vibration test.
Prova di vibrazione	Vibration test
in corso…	in progress…
Trascina il satellite sul banco per la prova funzionale.	Drag the satellite onto the bench for the functional test.
Il satellite è in orbita! Seguilo dalla sala controllo.	The satellite is in orbit! Follow it from the control room.
Un imprevisto: scegli tu cosa fare. Ogni opzione ha un costo e un rischio.	Something unexpected: you choose what to do. Every option has a cost and a risk.
Missione nominale compiuta: torna in sala controllo per la chiusura.	Nominal mission accomplished: go back to the control room for the close-out.
Tocca gli schermi per seguire la chiusura della missione.	Tap the screens to follow the mission close-out.
Hai un campus,	You have a campus,
e nessun satellite. La NASA finanzia il tuo primo CubeSat e ti apre il suo catalogo di tecnologie: si parte con poche carte, le altre si sbloccano salendo di livello.	and no satellite. NASA funds your first CubeSat and opens its technology catalogue to you: you start with a few cards, the others unlock as you level up.
Salvataggio non compatibile	Incompatible save
Fondo di avvio aumentato: +	Start-up fund increased: +
per la prima missione.	for the first mission.
Software e modi operativi sul banco	Software and operating modes on the bench
Il software si blocca al passaggio in safe mode.	The software freezes when switching to safe mode.
il software va in loop dopo il lancio: −15 m/s	the software loops after launch: −15 m/s
I carichi del lancio	Launch loads
Un bullone del meccanismo di rilascio si è allentato.	A bolt in the release mechanism has come loose.
un meccanismo si allenta: scienza −25%, a volte il satellite si perde	a mechanism comes loose: science −25%, sometimes the satellite is lost
Freddo e vuoto dell’eclisse	Cold and vacuum of the eclipse
Un riscaldatore non si accende a freddo.	A heater does not switch on when cold.
un pezzo resta al freddo in eclisse	a part stays cold in eclipse
Lo strappo della separazione dal razzo	The jolt of separation from the rocket
Il connettore di separazione si apre in ritardo.	The separation connector opens late.
esce dal razzo ruotando: −40% gas e −20 m/s	leaves the rocket spinning: −40% gas and −20 m/s
Il convertitore della batteria disturba la radio.	The battery converter interferes with the radio.
la radio di riserva va persa, o scienza −20%	the backup radio is lost, or science −20%
Massa e baricentro reali, al millimetro	Real mass and centre of mass, to the millimetre
Il baricentro reale è 4 mm fuori dal calcolo.	The real centre of mass is 4 mm off the calculation.
spinta fuori asse: −6% di ΔV	off-axis thrust: −6% ΔV
regole e detriti	rules and debris
il suo prodotto	their product
prove a terra	ground tests
lavora solo in orbita terrestre	works only in Earth orbit
fa solo sistemi di cattura	makes only capture systems
fa solo ottiche per telescopi	makes only telescope optics
fa solo camere per osservazione	makes only observation cameras
Per noi conta l’affidabilità: almeno il computer deve essere doppio.	Reliability matters to us: at least the computer must be duplicated.
Per noi conta l’affidabilità: computer e radio devono essere doppi.	Reliability matters to us: computer and radio must be duplicated.
Computer e radio ridondati	Redundant computer and radio
Assicuriamo il satellite se computer e radio hanno una scorta.	We insure the satellite if computer and radio have a spare.
Ridondanza su computer e radio	Redundancy on computer and radio
Assicuriamo solo satelliti con computer e radio di scorta, e un GPS per sapere dove sono.	We only insure satellites with spare computer and radio, and a GPS to know where they are.
Scorte di computer e radio, più navigazione	Spare computer and radio, plus navigation
Almeno la vibrazione va provata prima del lancio.	At least vibration must be tested before launch.
Il razzo non perdona: {T} superate.	The rocket is unforgiving: {T} passed.
Per agganciare il detrito il baricentro va conosciuto al millimetro: pesatelo.	To grab the debris the centre of mass must be known to the millimetre: weigh it.
A fine vita nessun detrito: tenete il ΔV per lo smaltimento.	No debris at end of life: keep the ΔV for disposal.
Riserva di ΔV per il fine vita	ΔV reserve for end of life
Il detrito agganciato deve rientrare: servono altri	The captured debris must re-enter: you need another
m/s per abbassarlo.	m/s to lower it.
m/s per far rientrare il detrito	m/s to de-orbit the debris
Zero sorprese a fine vita: il	Zero surprises at end of life:
di ΔV oltre il necessario.	ΔV beyond what is needed.
ΔV con	ΔV with
di margine	margin
Per risultati seri servono	Serious results need
mesi di dati.	months of data.
Voglio misurare anche durante le tempeste solari: sono i dati più rari.	I want to measure during solar storms too: those are the rarest data.
Immagini nitide vogliono un puntamento fine: serve lo star tracker.	Sharp images need fine pointing: you need the star tracker.
Le immagini vengono mosse se il satellite non punta bene: servono le ruote di reazione.	Images come out blurred if the satellite does not point well: you need reaction wheels.
Puntamento ≤ 0,1° (ruote di reazione)	Pointing ≤ 0.1° (reaction wheels)
Misureremo la qualità del collegamento per	We will measure the link quality for
Un ripetitore non può tacere: radio con trasmettitore di riserva.	A relay cannot go silent: radio with a backup transmitter.
Radio con riserva	Radio with backup
La rete deve funzionare a lungo:	The network must work for a long time:
mesi di servizio.	months of service.
di margine sulla potenza.	power margin.
Margine di potenza ≥	Power margin ≥
di ΔV in più di quello che serve.	more ΔV than needed.
Il budget è quello: il satellite, razzo compreso, non deve superare	The budget is fixed: the satellite, rocket included, must not exceed
Vogliamo seguire la missione per un anno scolastico:	We want to follow the mission for a school year:
di margine sotto il limite di massa della struttura.	margin below the structure’s mass limit.
Margine di massa ≥	Mass margin ≥
Lo strumento vuole un puntamento fine: star tracker.	The instrument needs fine pointing: star tracker.
Puntamento ≤ 0,01° per lo strumento	Pointing ≤ 0.01° for the instrument
In eclisse la batteria non deve scaricarsi oltre il	In eclipse the battery must not discharge beyond
Scarica in eclisse ≤	Eclipse discharge ≤
Il transponder è sempre acceso: voglio il	The transponder is always on: I want
di margine di potenza.	power margin.
Niente al freddo: ogni pezzo sensibile scaldato o vicino a una fonte di calore.	Nothing in the cold: every sensitive part heated or next to a heat source.
Il baricentro deve stare sulla linea dell’ugello: spinta in asse al	The centre of mass must sit on the nozzle line: thrust on axis at
Spinta in asse ≥	On-axis thrust ≥
L’avvicinamento al detrito non perdona errori:	The approach to the debris forgives no errors:
di ΔV in più.	more ΔV.
di margine per l’avvicinamento	margin for the approach
Prima del lancio almeno la vibrazione, senza eccezioni.	Before launch at least vibration, no exceptions.
Niente prototipi nei sottosistemi vitali: computer, radio e propulsione almeno a TRL 8.	No prototypes in vital subsystems: computer, radio and propulsion at least TRL 8.
Computer, radio e propulsione con TRL ≥ 8	Computer, radio and propulsion with TRL ≥ 8
Niente detriti attorno ad altri corpi: tenete il ΔV per lo smaltimento.	No debris around other bodies: keep the ΔV for disposal.
Smaltimento a fine vita	End-of-life disposal
Fate volare il nostro motore K-2. Sarà la sua prima volta nello spazio.	Fly our K-2 engine. It will be its first time in space.
Montate le nostre ali HX, le migliori celle sul mercato.	Fit our HX wings, the best cells on the market.
Serve comunicare in banda S attraverso la nostra rete.	You must communicate in S-band through our network.
Il nostro computer rad-hard deve volare.	Our rad-hard computer must fly.
Montate il nostro	Fit our
è fatto per missioni come questa.	it is made for missions like this one.
Superficie di Marte	Surface of Mars
Le nostre batterie allo stato solido non temono il freddo. Montatele.	Our solid-state batteries do not fear the cold. Fit them.
Il nostro computer FPGA è fatto a Torino. Vogliamo vederlo volare.	Our FPGA computer is made in Turin. We want to see it fly.
Ruote compatte con magnetotorquer: stanno in una sola unità.	Compact wheels with magnetorquers: they fit in a single unit.
Terminale laser: il 40% di dati in più. Serve un puntamento fine.	Laser terminal: 40% more data. It needs fine pointing.
Ali che si srotolano come un tappeto: 90 W. Usatele.	Wings that unroll like a carpet: 90 W. Use them.
Finanziamo solo missioni lunghe: almeno 12 mesi di dati.	We only fund long missions: at least 12 months of data.
Prima del lancio vogliamo vibrazione e termovuoto superate.	Before launch we want vibration and thermal vacuum passed.
I nostri studenti vogliono un 30% di margine sulla potenza.	Our students want a 30% power margin.
Venere è il nostro pianeta. Portateci lì.	Venus is our planet. Take us there.
Zero detriti: vogliamo il 30% di ΔV di riserva oltre il necessario.	Zero debris: we want a 30% ΔV reserve beyond what is needed.
Assicuriamo solo satelliti con scorta di computer, radio e ruote.	We only insure satellites with spare computer, radio and wheels.
Le classi seguiranno la missione per un anno scolastico: 9 mesi.	The classes will follow the mission for a school year: 9 months.
Pesate il satellite: prova di massa e baricentro.	Weigh the satellite: mass and centre-of-mass test.
Vibrazione e shock: il razzo non perdona.	Vibration and shock: the rocket is unforgiving.
Rete di terra	Ground network
Almeno 50 W dai pannelli, per provare i nostri sensori.	At least 50 W from the panels, to test our sensors.
Tenete il costo del satellite basso.	Keep the satellite cost low.
Mettete il nostro logo sulla struttura, e raccontateci la missione.	Put our logo on the structure, and tell us about the mission.
Assetto e navigazione	Attitude and navigation
Radio e comunicazioni	Radio and communications
Pannelli e generatori	Panels and generators
Piano di volo fino all’orbita obiettivo	Flight plan up to the target orbit
(piano di volo)	(flight plan)
Piano di volo verso l’orbita obiettivo (Centro di dinamica del volo)	Flight plan to the target orbit (flight dynamics centre)
Computer doppio o rad-hard; oppure safe mode durante le tempeste	Dual or rad-hard computer; or safe mode during storms
Un assetto con scorta, oppure i propulsori come riserva	Attitude with a spare, or thrusters as backup
Orbita sotto i 600 km, una vela di rientro o la propulsione	Orbit below 600 km, a drag sail or propulsion
Radio con trasmettitore di riserva	Radio with backup transmitter
Batteria più grande, riscaldatori o un accessorio termico	Bigger battery, heaters or a thermal accessory
Ridondanze e celle libere assorbono il colpo	Redundancy and free cells absorb the hit
Tieni ΔV di riserva per le correzioni	Keep ΔV in reserve for corrections
Propulsione più efficiente o missione più corta	More efficient propulsion or a shorter mission
Sposta i pezzi: baricentro sulla linea dell’ugello	Move the parts: centre of mass on the nozzle line
Pezzi pesanti in basso; la vibrazione lo scopre e si rinforza	Heavy parts at the bottom; vibration testing finds it and it gets reinforced
difetto trovato e lasciato in deroga:	defect found and left under a waiver:
di perdere tutto nella discesa	chance of losing everything in the descent
Prove di vibrazione e shock riducono le sorprese; la scienza sul suolo vale il rischio	Vibration and shock tests reduce surprises; science on the ground is worth the risk
che l’attrito faccia rientrare il satellite prima del tempo (pericentro a	chance that drag brings the satellite down early (periapsis at
Scegli una strategia propulsiva nel Centro di dinamica del volo	Choose a propulsion strategy in the flight dynamics centre
Separazione storta: il satellite esce dal razzo ruotando troppo veloce e il gas freddo non basta a fermarlo.	Crooked separation: the satellite leaves the rocket spinning too fast and the cold gas cannot stop it.
Separazione storta: il satellite esce dal razzo ruotando. −40% gas, −20 m/s.	Crooked separation: the satellite leaves the rocket spinning. −40% gas, −20 m/s.
con le bobine magnetiche.	with the magnetic coils.
Interferenze sulla radio principale: si passa subito alla riserva.	Interference on the main radio: switching straight to the backup.
Interferenze sulla radio: il collegamento perde il 20%.	Radio interference: the link loses 20%.
Il baricentro reale è fuori asse: ogni accensione spreca il 6% di ΔV.	The real centre of mass is off axis: every burn wastes 6% of ΔV.
Aerocattura fallita: il satellite è entrato troppo in basso nell’atmosfera.	Aerocapture failed: the satellite entered the atmosphere too low.
Il pericentro di «	The periapsis of «
scende a	drops to
km, dentro l’atmosfera: l’attrito ha frenato il satellite, che è rientrato e bruciato.	km, inside the atmosphere: drag slowed the satellite, which re-entered and burned up.
in corso: la scienza comincia al mese	in progress: science starts in month
del piano di volo eseguite	of the flight plan executed
dopo la frenata di cattura	after the capture burn
orbita di parcheggio	parking orbit
orbita di lavoro	working orbit
L’orbita finale non è quella obiettivo: metà della scienza va persa.	The final orbit is not the target one: half the science is lost.
Quota di lavoro: resa scientifica	Working altitude: science yield
Il lanciatore ti lascia direttamente in	The launcher leaves you directly in
il lander commerciale si è schiantato.	the commercial lander crashed.
atterraggio riuscito. Il payload lavora sul suolo.	successful landing. The payload works on the ground.
Da così lontano la radio arriva debole: metà dei dati si perde.	From this far the radio signal is weak: half the data is lost.
Riserva di ΔV al limite: il controllo missione chiude al mese	ΔV reserve at the limit: mission control closes at month
per garantire il disposal.	to guarantee disposal.
Propellente finito: niente più mantenimento d’orbita.	Propellant used up: no more orbit maintenance.
Fine missione: il payload resta sul suolo come stazione silenziosa.	End of mission: the payload stays on the ground as a silent station.
La vela di rientro si apre: il satellite rientrerà in pochi mesi.	The drag sail opens: the satellite will re-enter in a few months.
km l’atmosfera lo frena: rientrerà entro 5 anni.	km the atmosphere slows it: it will re-enter within 5 years.
km resterà in orbita per decenni: l’ente regolatore apre una contestazione.	km it will stay in orbit for decades: the regulator opens a dispute.
Disposal non riuscito: il satellite resta in orbita come detrito.	Disposal failed: the satellite stays in orbit as debris.
capacità persa:	capacity lost:
ATTENZIONE: riserva per il fine vita	WARNING: end-of-life reserve
bastano per ~	enough for ~
ruota di scorta pronta	spare wheel ready
A (B in standby)	A (B on standby)
A, nessuna scorta	A, no spare
trasmettitore di riserva pronto	backup transmitter ready
Una missione che funziona e consegna dati	A mission that works and delivers data
Un posto per CubeSat su una missione lunare: ti rilascia in un’orbita lunare alta	A CubeSat slot on a lunar mission: it releases you in a high lunar orbit
Il lander ti porta fino al suolo: si paga a chilo, il lancio è compreso	The lander takes you to the ground: you pay by the kilo, launch included
Un posto su una sonda interplanetaria: ti rilascia in un’orbita allungata	A slot on an interplanetary probe: it releases you in an elongated orbit
orbita bassa attorno alla Terra	low orbit around Earth
Rientro distruttivo in atmosfera.	Destructive atmospheric re-entry.
Impatto controllato sul lato nascosto della Luna.	Controlled impact on the far side of the Moon.
orbita attorno a Marte	orbit around Mars
Parcheggiato in un’orbita cimitero alta.	Parked in a high graveyard orbit.
Orbita di Marte	Mars orbit
orbita attorno a Venere	orbit around Venus
Ingresso controllato nell’atmosfera di Venere.	Controlled entry into Venus’s atmosphere.
Deve guardare fuori: mettilo sulla fila in alto.	It must look outwards: put it on the top row.
Deve stare sul fondo.	It must sit at the bottom.
L’antenna deve toccare una parete esterna.	The antenna must touch an outer wall.
Deve toccare una parete esterna.	It must touch an outer wall.
Tutti i sottosistemi a bordo	All subsystems on board
Ogni pezzo al suo posto	Every part in its place
Costo entro il budget	Cost within budget
Un pezzo vuole lo star tracker (puntamento ≤ 0,01°)	A part needs the star tracker (pointing ≤ 0.01°)
Un pezzo vuole le ruote di reazione (puntamento ≤ 0,1°)	A part needs reaction wheels (pointing ≤ 0.1°)
il mazzo di carte che la missione peschera	the deck of cards the mission will draw
di bruciare un computer se misuri	chance of burning out a computer if you measure
c’è una scorta	there is a spare
c’è la radio di riserva	there is the backup radio
una sola radio	only one radio
batteria e calore bastano	battery and heat are enough
colpisce una casella a caso:	hits a random cell:
la gravità lunare sposta l’orbita	lunar gravity shifts the orbit
non basta per	not enough for
mesi di missione	months of mission
una radio lenta trasmette metà dei dati	a slow radio transmits half the data
km il satellite resta in orbita per decenni	km the satellite stays in orbit for decades
del ΔV	of the ΔV
può cedere al lancio	may fail at launch
Cedimento strutturale al lancio: baricentro alto, mai provata in vibrazione.	Structural failure at launch: high centre of mass, never vibration-tested.
Al lancio un bullone allentato ha liberato un’ala: ha colpito la struttura e il satellite non risponde.	At launch a loose bolt freed a wing: it hit the structure and the satellite does not respond.
Un meccanismo si è allentato al lancio: un’ala non si apre del tutto. Scienza −25%.	A mechanism came loose at launch: a wing does not open fully. Science −25%.
Il software non esce più dal safe mode: nessun comando viene eseguito, satellite perso.	The software no longer leaves safe mode: no command is executed, satellite lost.
Il software va in loop al primo cambio di modo. Due settimane perse alla deriva: −15 m/s.	The software loops at the first mode change. Two weeks lost drifting: −15 m/s.
di bruciare un computer	chance of burning out a computer
Dati presi, ma un computer è bruciato. Ora voli senza scorta.	Data taken, but a computer burned out. Now you fly without a spare.
Un attuatore di assetto si è fermato.	An attitude actuator has stopped.
Un attuatore di assetto si è fermato, e non hai una scorta.	An attitude actuator has stopped, and you have no spare.
la quarta ruota prende il carico	the fourth wheel takes the load
Punta con i propulsori	Point with the thrusters
non hai propulsori	you have no thrusters
La scorta prende il carico.	The spare takes the load.
Assetto tenuto a colpi di propulsore.	Attitude held with thruster pulses.
Il trasmettitore principale tace.	The main transmitter is silent.
Passa alla riserva	Switch to the backup
persa per sempre	lost for good
(antenne di terra)	(ground antennas)
Radio di riserva accesa. Nessun dato perso.	Backup radio on. No data lost.
Si trasmette a bassa potenza.	Transmitting at low power.
Le antenne di terra riagganciano il segnale: la radio riparte.	The ground antennas reacquire the signal: the radio restarts.
Il Sole resta coperto per	The Sun stays hidden for
minuti. La batteria non basta per tenere tutto acceso.	minutes. The battery cannot keep everything on.
perdi i dati del mese	you lose the month’s data
45% di rovinare la batteria	45% chance of ruining the battery
Payload spenti per l’eclisse.	Payloads switched off for the eclipse.
Batteria scaricata a fondo: ha perso capacità.	Battery deeply discharged: it has lost capacity.
La batteria ha retto, di poco.	The battery held, just barely.
In eclisse un riscaldatore difettoso non si accende: la batteria gela e il satellite si spegne.	In eclipse a faulty heater does not switch on: the battery freezes and the satellite shuts down.
Una linea del propellente è gelata: −40 m/s.	A propellant line froze: −40 m/s.
Batteria al freddo: capacità −20%.	Cold battery: capacity −20%.
Eclisse passata senza danni.	Eclipse passed without damage.
Le concentrazioni di massa lunari stanno deformando l’orbita.	Lunar mass concentrations are distorting the orbit.
Atmosfera residua e gravità irregolare stanno deformando l’orbita.	Residual atmosphere and irregular gravity are distorting the orbit.
Orbita rimessa a posto.	Orbit fixed.
Una parte della scienza è fuori portata.	Part of the science is out of reach.
Richiesta di un partner	A partner’s request
chiede una campagna di misure extra.	asks for an extra measurement campaign.
Un granello a 20 km/s attraversa la struttura.	A grain at 20 km/s goes through the structure.
Guarda dove ha colpito	See where it hit
La riserva prende il suo posto.	The backup takes its place.
Ha attraversato una cella vuota. Nessun danno.	It went through an empty cell. No damage.
Batteria colpita: capacità dimezzata.	Battery hit: capacity halved.
Serbatoio forato: perso il 30% del propellente.	Punctured tank: 30% of the propellant lost.
Funziona a metà.	It works at half capacity.
Payload distrutto: niente più dati.	Payload destroyed: no more data.
Computer di bordo distrutto dal micrometeorite.	On-board computer destroyed by the micrometeoroid.
Il compromesso di AURASAT: vicino e lontano dalla superficie.	AURASAT’s compromise: near and far from the surface.
Atterraggio con un lander lunare commerciale	Landing with a commercial lunar lander
Atterraggio con un lander marziano	Landing with a Mars lander
Più in basso vedi più dettagli	Lower down you see more detail
Più in alto il corpo copre meno cielo	Higher up the body covers less sky
Più in alto vedi le stazioni più a lungo	Higher up you see the stations for longer
Conta misurare sia vicino sia lontano: il centro della fascia è il compromesso	Measuring both near and far matters: the middle of the band is the compromise
Per una dimostrazione la quota conta poco	For a demonstration altitude matters little
In basso l’atmosfera frena il satellite	Low down the atmosphere slows the satellite
In basso le mascon deformano l’orbita	Low down the mascons distort the orbit
Il lander commerciale ti porta fino al suolo.	The commercial lander takes you to the ground.
Il lanciatore dedicato ti porta già nell’orbita di lavoro.	The dedicated launcher takes you straight to the working orbit.
Rilascio dopo il viaggio dalla Terra: orbita lunare alta e allungata.	Release after the trip from Earth: high, elongated lunar orbit.
La sonda che ti porta frena per te: rilascio in un’orbita allungata.	The probe carrying you brakes for you: release in an elongated orbit.
Il rideshare ti rilascia in un’orbita di trasferimento allungata fino a 20.000 km.	The rideshare releases you in an elongated transfer orbit up to 20,000 km.
Rilascio in orbita di trasferimento geostazionaria (GTO): la circolarizzazione tocca a te.	Release into geostationary transfer orbit (GTO): circularising is up to you.
Arrivo dal viaggio interplanetario: la frenata di cattura costa	Arrival from the interplanetary trip: the capture burn costs
m/s ed è già nel conto.	m/s and is already counted.
Il motore frena il satellite all’arrivo.	The engine brakes the satellite on arrival.
Il satellite si tuffa nell’atmosfera per frenare. Serve uno scudo, e può finire male.	The satellite dives into the atmosphere to brake. It needs a shield, and it can end badly.
senza atmosfera non si può	not possible without an atmosphere
Manovre disegnate a mano	Hand-drawn manoeuvres
m/s di manovre, ma al tuo livello non hai ancora un propulsore (il primo si sblocca al livello	m/s of manoeuvres, but at your level you do not have a thruster yet (the first unlocks at level
scegli un’orbita di lavoro dove il razzo ti lascia già, senza manovre	choose a working orbit where the rocket already leaves you, without manoeuvres
m/s di manovre: monta un sistema di propulsione	m/s of manoeuvres: fit a propulsion system
c’è già un arredo	there is already furniture
c’è una persona	there is a person
troppo vicino a	too close to
c’è già una pianta	there is already a plant
c’è già	there is already
sopra una strada	on a road
DATI	DATA
REQUISITI	REQUIREMENTS
Radio con	Radio with
Le frequenze vanno coordinate: niente radio sperimentali sotto TRL {n}.	Frequencies must be coordinated: no experimental radios below TRL {n}.
Radio persa: nessun comando arriva più a bordo. Scienza {n}.	Radio lost: no command reaches the satellite any more. Science {n}.
Serbatoio	Tank
Standard	Standard
Grande ×{n}	Large ×{n}
Extra ×{n}	Extra ×{n}
Il satellite	The satellite
Rientro distruttivo	Destructive re-entry
Accetta, ma perde	They accept, but lose
Un no secco ne costa	A flat no costs
ne porta al massimo	carries at most
, ma	, but
ma	but
Proponi	Propose
kg, ma	kg, but
Misurare l’ambiente di radiazione attorno alla Luna, da vicino e da lontano.	Measure the radiation environment around the Moon, near and far.
Misurare l’ambiente di radiazione attorno alla Terra, da vicino e da lontano.	Measure the radiation environment around Earth, near and far.
Misurare l’ambiente di radiazione attorno a Marte, da vicino e da lontano.	Measure the radiation environment around Mars, near and far.
Misurare l’ambiente di radiazione attorno a Venere, da vicino e da lontano.	Measure the radiation environment around Venus, near and far.
Mappare tutta la superficie della Luna da un’orbita polare bassa.	Map the whole surface of the Moon from a low polar orbit.
Mappare tutta la superficie della Terra da un’orbita polare bassa.	Map the whole surface of Earth from a low polar orbit.
Mappare tutta la superficie di Marte da un’orbita polare bassa.	Map the whole surface of Mars from a low polar orbit.
Mappare tutta la superficie di Venere da un’orbita polare bassa.	Map the whole surface of Venus from a low polar orbit.
Portare un piccolo telescopio in un’orbita alta e stabile attorno alla Luna.	Take a small telescope to a high, stable orbit around the Moon.
Portare un piccolo telescopio in un’orbita alta e stabile attorno alla Terra.	Take a small telescope to a high, stable orbit around Earth.
Portare un piccolo telescopio in un’orbita alta e stabile attorno a Marte.	Take a small telescope to a high, stable orbit around Mars.
Portare un piccolo telescopio in un’orbita alta e stabile attorno a Venere.	Take a small telescope to a high, stable orbit around Venus.
Inserire un ripetitore in orbita attorno alla Luna per collegare le future missioni.	Put a relay into orbit around the Moon to link future missions.
Inserire un ripetitore in orbita attorno alla Terra per collegare le future missioni.	Put a relay into orbit around Earth to link future missions.
Inserire un ripetitore in orbita attorno a Marte per collegare le future missioni.	Put a relay into orbit around Mars to link future missions.
Inserire un ripetitore in orbita attorno a Venere per collegare le future missioni.	Put a relay into orbit around Venus to link future missions.
Raggiungere un vecchio stadio abbandonato attorno alla Luna e portarlo via.	Reach an old abandoned stage around the Moon and take it away.
Raggiungere un vecchio stadio abbandonato attorno alla Terra e portarlo via.	Reach an old abandoned stage around Earth and take it away.
Raggiungere un vecchio stadio abbandonato attorno a Marte e portarlo via.	Reach an old abandoned stage around Mars and take it away.
Raggiungere un vecchio stadio abbandonato attorno a Venere e portarlo via.	Reach an old abandoned stage around Venus and take it away.
Provare in volo, attorno alla Luna, una tecnologia mai volata.	Test in flight, around the Moon, a technology that has never flown.
Provare in volo, attorno alla Terra, una tecnologia mai volata.	Test in flight, around Earth, a technology that has never flown.
Provare in volo, attorno a Marte, una tecnologia mai volata.	Test in flight, around Mars, a technology that has never flown.
Provare in volo, attorno a Venere, una tecnologia mai volata.	Test in flight, around Venus, a technology that has never flown.
Hai un campus, {n} cr e nessun satellite. La NASA finanzia il tuo primo CubeSat e ti apre il suo catalogo di tecnologie: si parte con poche carte, le altre si sbloccano salendo di livello.	You have a campus, {n} cr and no satellite. NASA funds your first CubeSat and opens its technology catalogue to you: you start with a few cards, the others unlock as you level up.
cr e nessun satellite. La NASA finanzia il tuo primo CubeSat e ti apre il suo catalogo di tecnologie: si parte con poche carte, le altre si sbloccano salendo di livello.	cr and no satellite. NASA funds your first CubeSat and opens its technology catalogue to you: you start with a few cards, the others unlock as you level up.
A {n} km l’atmosfera lo frena: rientrerà entro {n} anni.	At {n} km the atmosphere slows it: it will re-enter within {n} years.
Il satellite {s}	The satellite {s}
Salta	Skip
Perché?	Why?
Dettagli	Details
Altre opzioni	More options
Testo più grande	Larger text
Dimensione del testo	Text size`, ex=new Map(); RAW.split('\n').forEach(l=>{ const i=l.indexOf('\t'); if(i>0) ex.set(l.slice(0,i),l.slice(i+1)); });
  const NUM=/[−+\-]?\d[\d.,]*\d|[−+\-]?\d/g, enNum=x=>/^[−+\-]?\d{1,3}(\.\d{3})+(,\d+)?$|^[−+\-]?\d+,\d+$/.test(x)?x.replace(/[.,]/g,c=>c==='.'?',':'.'):x;
  let NM=[]; const setNames=()=>{ let ex2=[]; try{ ex2=Object.values(E.LV).map(o=>o.n).concat(Object.values(L.PEOPLE).map(o=>o.n),Object.values(L.PEOPLE).map(o=>o.org)); }catch(e){} NM=(G?[G.co].concat(G.missions.map(m=>m.name)):[]).concat(ex2).filter(x=>x&&String(x).length>2).map(String).filter((x,i,a)=>a.indexOf(x)===i).sort((a,b)=>b.length-a.length); };
  function one(s){ if(!s) return s; let e=ex.get(s); if(e!=null) return e;
    const m=s.match(/^([^\p{L}\p{N}«(]+)(\p{L}.*)$/u); if(m){ const r=one(m[2]); if(r!==m[2]) return m[1]+r; }
    const ss=[]; let t=s; NM.forEach(n=>{ if(n.length>1&&t.indexOf(n)>=0){ t=t.split(n).join('\u0001'+String.fromCharCode(65+ss.length)+'\u0002'); ss.push(n); } });
    const nn=[]; t=t.replace(NUM,x=>{ nn.push(x); return '{n}'; }); const order=[]; t=t.replace(/\u0001([A-Z])\u0002/g,(_,i)=>{ order.push(ss[i.charCodeAt(0)-65]); return '{s}'; });
    if(t!==s){ e=ex.get(t); if(e!=null){ let i=0,j=0; return e.replace(/\{n\}/g,()=>enNum(nn[i++]||'')).replace(/\{s\}/g,()=>order[j++]||''); } }
    return s; }
  function tr(s){ const lead=s.match(/^\s*/)[0], trail=s.match(/\s*$/)[0], core=s.trim().replace(/\s+/g,' '); if(!core||!/\p{L}{2}/u.test(core)) return s; let r=one(core);
    if(r===core&&core.indexOf(' · ')>0) r=core.split(' · ').map(one).join(' · ');
    if(r===core) r=pieces(core);
    if(r===core){ const k=core.indexOf(': '); if(k>0&&k<70){ const a=core.slice(0,k+2), b=core.slice(k+2), ta=ex.has(a)?ex.get(a):one(core.slice(0,k))+': ', tb=tr(b); if(ta!==a||tb!==b) r=ta+tb; } }
    if(r===core) r=seg(core);
    return lead+r+trail; }
  function seg(t){ let x=one(t); if(x!==t) return x; const m=t.match(/^(.*?)([\s.,;:·)(]+)$/); if(m&&m[1]){ const y=one(m[1]); if(y!==m[1]) return y+m[2]; }
    if(t.indexOf('. ')>0){ const q=t.split('. ').map((u,i,a)=>i<a.length-1?u+'.':u); if(q.length>1){ const z=q.map(u=>{ const v=one(u); if(v!==u) return v; const w=u.replace(/\.$/,''); const v2=one(w); return v2!==w?v2+'.':u; }); if(z.some((u,i)=>u!==q[i])) return z.join(' '); } }
    if(t.indexOf(': ')>0){ const k=t.indexOf(': '), a=one(t.slice(0,k)), b=seg(t.slice(k+2)); if(a!==t.slice(0,k)||b!==t.slice(k+2)) return a+': '+b; }
    if(t.indexOf(', ')>0){ const q=t.split(', '), z=q.map(u=>{ const v=one(u); if(v!==u) return v; const w=u.replace(/[.;:]$/,''), v2=one(w); return v2!==w?v2+u.slice(w.length):u; }); if(z.some((u,i)=>u!==q[i])) return z.join(', '); }
    return t; }
  // ultima risorsa: il testo è stato composto da pezzi fissi e valori (numeri, nomi, «citazioni»): si traduce pezzo per pezzo
  function pieces(core){ let names=NM.filter(n=>n.length>1&&core.indexOf(n)>=0); const rx=new RegExp('([−+\\-]?\\d[\\d.,]*\\d%?|[−+\\-]?\\d%?|«[^»]*»'+(names.length?'|'+names.map(n=>n.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|'):'')+')');
    const parts=core.split(rx); if(parts.length<2) return core; let ch=false;
    const out=parts.map((p,i)=>{ if(i%2){ if(/^«/.test(p)){ const inn=p.slice(1,-1), t2=one(inn); if(t2!==inn){ ch=true; return '«'+t2+'»'; } return p; } if(/^[−+\-]?\d/.test(p)) return enNum(p); const tn=one(p); if(tn!==p) ch=true; return tn; }
      const t=p.trim(); if(!t||!/\p{L}{2}/u.test(t)) return p; const l0=p.match(/^\s*/)[0], t0=p.match(/\s*$/)[0]; let x=seg(t);
      if(x!==t) ch=true; return l0+x+t0; });
    return ch?out.join(''):core; }
  const SKIP={SCRIPT:1,STYLE:1,TEXTAREA:1,INPUT:1,CANVAS:1};
  function node(n){ if(n.nodeType===3){ if(n.__t===n.data) return; const p=n.parentNode; if(p&&SKIP[p.nodeName]) return; const r=tr(n.data); if(r!==n.data) n.data=r; n.__t=n.data; return; }
    if(n.nodeType!==1) return; ['title','aria-label','placeholder'].forEach(a=>{ const v=n.getAttribute&&n.getAttribute(a); if(v&&n['__a'+a]!==v){ const r=tr(v); if(r!==v) n.setAttribute(a,r); n['__a'+a]=n.getAttribute(a); } }); if(SKIP[n.nodeName]) return; for(let c=n.firstChild;c;c=c.nextSibling) node(c); }
  function start(){ if(LANG!=='en') return; document.documentElement.lang='en'; setNames(); node(document.body); new MutationObserver(ms=>{ setNames(); ms.forEach(m=>{ if(m.type==='characterData') node(m.target); else if(m.type==='attributes') node(m.target); else m.addedNodes.forEach(node); }); }).observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder']}); }
  return {start,tr}; })();

/* ---------- musica di sottofondo (due brani uniti in un unico loop, in mi) ---------- */
const MUS={url:'/audio/theme.mp3?v=46e8fedc362c',buf:null,src:null,gain:null,loading:false,vol:.3};
const musOn=()=>!G||G.music!==false;
window.MUSDBG=()=>({buf:!!MUS.buf,dur:MUS.buf?+MUS.buf.duration.toFixed(1):0,playing:!!MUS.src,ac:AC?AC.state:'-'});
async function musStart(){ if(!musOn()||MUS.src||MUS.loading) return; try{ AC=AC||new (window.AudioContext||window.webkitAudioContext)(); if(AC.state==='suspended') await AC.resume();
  if(!MUS.buf){ MUS.loading=true; const res=await fetch(MUS.url,{cache:'force-cache'}); if(!res.ok) throw new Error('Music HTTP '+res.status); const ab=await res.arrayBuffer(); MUS.buf=await new Promise((ok,ko)=>AC.decodeAudioData(ab,ok,ko)); MUS.loading=false; }
  if(!musOn()||MUS.src) return; const g=AC.createGain(), n=AC.currentTime; g.gain.setValueAtTime(0,n); g.gain.linearRampToValueAtTime(MUS.vol,n+2.5); const s=AC.createBufferSource(); s.buffer=MUS.buf; s.loop=true; s.connect(g); g.connect(AC.destination); s.start(); MUS.src=s; MUS.gain=g; }catch(e){ MUS.loading=false; } }
function musStop(){ if(!MUS.src||!AC) return; const s=MUS.src, g=MUS.gain, n=AC.currentTime; g.gain.cancelScheduledValues(n); g.gain.setValueAtTime(g.gain.value,n); g.gain.linearRampToValueAtTime(0,n+.6); setTimeout(()=>{ try{ s.stop(); }catch(e){} },700); MUS.src=null; }
['pointerdown','keydown','touchstart'].forEach(ev=>window.addEventListener(ev,e=>{ if(e.target&&e.target.closest&&e.target.closest('[data-act="music"]')) return; musStart(); },true));
document.addEventListener('visibilitychange',()=>{ if(!AC) return; if(document.hidden) AC.suspend(); else AC.resume(); });
function toast(t){ if(G&&G.tut) return; const el=$('#toast'); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>{el.hidden=true;},3200); }

/* ---------- icone e pezzi (dalla v2) ---------- */
const I={ mass:'<path d="M5 20h14l-2-11H7z"/><circle cx="12" cy="6" r="2.5"/>', pow:'<path d="M13 2 5 13h6l-1 9 8-12h-6z"/>', bat:'<rect x="3" y="8" width="16" height="9" rx="1.5"/><path d="M21 11v3"/>', fuel:'<path d="M12 3c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11z"/>',
  coin:'<circle cx="12" cy="12" r="8"/><path d="M14.5 9.5a3 3 0 1 0 0 5M8 11h5M8 13h5"/>', rot:'<path d="M20 12a8 8 0 1 1-3-6.2M20 4v5h-5"/>', heat:'<path d="M12 21a5 5 0 0 0 5-5c0-3-2-4-3-7-1 1-2 2-2 4-1-1-2-3-2-5-2 2-3 5-3 8a5 5 0 0 0 5 5z"/>', snow:'<path d="M12 3v18M4 7.5l16 9M20 7.5l-16 9"/>',
  gift:'<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M3 7h18v3H3zM12 7v13M12 7c-2-4-6-3-5 0M12 7c2-4 6-3 5 0"/>', want:'<path d="M5 12l4 4 10-10"/>' };
const ico=k=>'<svg class="ico" viewBox="0 0 24 24">'+I[k]+'</svg>';
const GL={ avi:'<rect x="-9" y="-9" width="18" height="18" rx="2"/><path d="M-5-9v-5M0-9v-5M5-9v-5M-5 9v5M0 9v5M5 9v5M-9-5h-5M-9 0h-5M-9 5h-5M9-5h5M9 0h5M9 5h5"/>', ray:'<circle r="10"/><circle r="3.5"/><path d="M-17-17l6 6M17-17l-6 6M0-18v5"/>',
  cell:'<path d="M-5-14h10M-3-14v8l-8 15a3 3 0 0 0 3 4h16a3 3 0 0 0 3-4l-8-15v-8"/><circle cx="-2" cy="6" r="1.5"/><circle cx="4" cy="9" r="1.5"/>', bat:'<rect x="-13" y="-8" width="24" height="16" rx="2"/><path d="M13-3v6M1-5l-5 6h5l-3 5"/>',
  prop:'<path d="M0-15c7 8 10 12 10 17a10 10 0 0 1-20 0c0-5 3-9 10-17z"/>', adcs:'<circle r="12"/><circle r="3"/><path d="M0-12v9M0 3v9M-12 0h9M3 0h9"/>', com:'<path d="M-12 9a15 15 0 0 1 21-21zM-2-2l9-9"/><path d="M6-15a9 9 0 0 1 9 9"/>', gas:'<path d="M-12-6h8l6 6-6 6h-8zM6-6l6-4M8 0h7M6 6l6 4"/>',
  nav:'<path d="M0-14l4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1z"/>', pwr:'<path d="M3-15-8 2h7l-3 13 12-18h-7z"/>', rob:'<rect x="-13" y="-7" width="26" height="9" rx="2"/><circle cx="-8" cy="8" r="4"/><circle cx="8" cy="8" r="4"/><path d="M0-7v-6h6"/>',
  eol:'<path d="M-13-2a13 13 0 0 1 26 0zM-13-2 0 12 13-2M0-2v14"/>', sol:'<rect x="-14" y="-10" width="28" height="20" rx="1"/><path d="M-14 0h28M-5-10v20M4-10v20"/>',
  acc:'<circle r="5"/><path d="M0-14v5M0 9v5M-14 0h5M9 0h5M-10-10l3.5 3.5M6.5 6.5 10 10M-10 10l3.5-3.5M6.5-6.5 10-10"/>', all:'<rect x="-12" y="-12" width="10" height="10" rx="2"/><rect x="2" y="-12" width="10" height="10" rx="2"/><rect x="-12" y="2" width="10" height="10" rx="2"/><rect x="2" y="2" width="10" height="10" rx="2"/>' };
const glyph=k=>'<svg viewBox="-20 -20 40 40" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(GL[k]||GL.acc)+'</svg>';
const EMB={ asm:['#3B6FD8','<circle r="13" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M0-9l2.6 6 6.4.6-4.9 4.2 1.5 6.3L0 4.8-5.6 8.1l1.5-6.3L-9-2.4l6.4-.6z" fill="#fff"/>'], bor:['#22A87A','<path d="M0-15l13 7.5v15L0 15l-13-7.5v-15z" fill="none" stroke="#fff" stroke-width="2.5"/><circle r="3" fill="#fff"/>'],
  kes:['#D9478F','<path d="M-14 8L0-12 14 8 0 2z" fill="#fff"/>'], hel:['#D99A12','<path d="M-12 6a12 12 0 0 1 24 0z" fill="#fff"/><path d="M0-10v-6M-11-5l-4-4M11-5l4-4M-16 10h32" stroke="#fff" stroke-width="2.5" fill="none"/>'], orb:['#8A55D0','<circle r="3" fill="#fff"/><path d="M-8-8a11 11 0 0 1 16 0M-13-13a18 18 0 0 1 26 0M-8 8a11 11 0 0 0 16 0" fill="none" stroke="#fff" stroke-width="2.5"/>'] };
const emb=id=>{ if(EMB[id]) return '<svg class="emb" viewBox="-27 -27 54 54"><circle r="26" fill="'+EMB[id][0]+'"/><g stroke-linecap="round" stroke-linejoin="round">'+EMB[id][1]+'</g></svg>'; const st=E.stk(id)||{n:'?'}, col=(PEO[id]||{}).col||'#64748B';
  return '<svg class="emb" viewBox="-27 -27 54 54"><circle r="26" fill="'+col+'"/><text y="7" text-anchor="middle" font-family="Barlow Condensed,Arial" font-weight="700" font-size="20" fill="#fff">'+esc(st.n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase())+'</text></svg>'; };
function miniShape(id,ride){ const sh=E.shape(id,0,ride||(cur()&&cur().sat.ride)||'S3'), w=Math.max.apply(null,sh.map(c=>c[0]))+1, h=Math.max.apply(null,sh.map(c=>c[1]))+1, k=12;
  return '<svg viewBox="'+(-(54-w*k)/2)+' '+(-(40-h*k)/2)+' 54 40">'+sh.map(c=>'<rect x="'+c[0]*k+'" y="'+c[1]*k+'" width="'+(k-1)+'" height="'+(k-1)+'" rx="2" fill="var(--c-'+P[id].cat+')"/>').join('')+'</svg>'; }
function geom(d){ const R=E.RIDES[d.ride], ox=104, oy=30; return {R,ox,oy,w:ox*2+R.cols*CELL,h:oy+R.rows*CELL+44}; }
function partSVG(d,cat,o){ const pl=d.placed[cat], cs=E.cellsOf(pl,d.ride), set={}; cs.forEach(c=>set[c[0]+','+c[1]]=1); const G2=o.g, Lp=o.L.parts[cat]||{ok:true}, vis=!o.only||o.only.indexOf(cat)>=0;
  let cx=0,cy=0; cs.forEach(c=>{cx+=c[0]+.5;cy+=c[1]+.5;}); cx=G2.ox+cx/cs.length*CELL; cy=G2.oy+cy/cs.length*CELL;
  const near=cs.reduce((a,c)=>{ const dx=G2.ox+(c[0]+.5)*CELL-cx, dy=G2.oy+(c[1]+.5)*CELL-cy, q=dx*dx+dy*dy; return q<a[0]?[q,c]:a; },[1e9,cs[0]])[1], tr=cs.reduce((a,c)=>c[1]<a[1]||(c[1]===a[1]&&c[0]>a[0])?c:a,cs[0]);
  return '<g class="part'+(sel===cat&&o.live?' sel':'')+(Lp.ok?'':' badp')+'" data-cat="'+cat+'" style="opacity:'+(vis?1:0)+';transition:opacity .5s">'+cs.map(c=>{ const l=set[(c[0]-1)+','+c[1]]?0:3,r=set[(c[0]+1)+','+c[1]]?0:3,t=set[c[0]+','+(c[1]-1)]?0:3,b=set[c[0]+','+(c[1]+1)]?0:3;
    return '<rect class="pc" x="'+(G2.ox+c[0]*CELL+l)+'" y="'+(G2.oy+c[1]*CELL+t)+'" width="'+(CELL-l-r)+'" height="'+(CELL-t-b)+'" fill="var(--c-'+cat+')"/>'; }).join('')+
    '<g class="gl" transform="translate('+(G2.ox+(near[0]+.5)*CELL)+' '+(G2.oy+(near[1]+.5)*CELL)+') scale(1.25)">'+GL[cat]+'</g>'+
    (Lp.cold&&o.live?'<g class="badge" data-heat="'+cat+'" transform="translate('+(G2.ox+(tr[0]+1)*CELL-14)+' '+(G2.oy+tr[1]*CELL+14)+')"><circle r="11" fill="'+(Lp.heater?'#D2443A':Lp.warm?'#1E2A3A':'#E3F2FF')+'" stroke="#1E2A3A" stroke-width="1.5"/><g transform="translate(-8 -8) scale(.67)" fill="none" stroke="'+(Lp.heater?'#fff':Lp.warm?'#F5B041':'#2F6FD6')+'" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">'+(Lp.warm?I.heat:I.snow)+'</g></g>':'')+'</g>'; }
function satSVG(d,o){ o=o||{}; const G2=geom(d), R=G2.R, Lx=E.layout(d), S2=E.SOLAR[d.sol], bw=R.cols*CELL, bh=R.rows*CELL; o.g=G2; o.L=Lx;
  let s='<svg '+(o.id?'id="'+o.id+'" ':'')+'viewBox="0 0 '+G2.w+' '+G2.h+'" class="'+(o.cls||'')+'" role="img" aria-label="Spaccato del satellite">';
  if(S2.wings){ [[8,G2.ox-6],[G2.ox+bw+6,G2.w-8]].forEach(x=>{ s+='<rect class="wing'+(S2.wings>1?' hx':'')+'" x="'+x[0]+'" y="'+(G2.oy+bh*.2)+'" width="'+(x[1]-x[0])+'" height="'+(bh*.6)+'" rx="3"/>'; for(let i=1;i<3;i++) s+='<path d="M'+(x[0]+(x[1]-x[0])*i/3)+' '+(G2.oy+bh*.2)+'v'+(bh*.6)+'" stroke="#9CC0FF" stroke-width="1" opacity=".7"/>'; }); }
  else s+='<rect x="'+(G2.ox-9)+'" y="'+(G2.oy+8)+'" width="6" height="'+(bh-16)+'" class="wing"/><rect x="'+(G2.ox+bw+3)+'" y="'+(G2.oy+8)+'" width="6" height="'+(bh-16)+'" class="wing"/>';
  s+=(o.live?'<text class="lbl" x="'+(G2.ox+bw/2)+'" y="16">↑ VISTA SUL CIELO</text>':'')+'<rect class="body-r" x="'+(G2.ox-3)+'" y="'+(G2.oy-3)+'" width="'+(bw+6)+'" height="'+(bh+6)+'" rx="6"/>';
  for(let y=0;y<R.rows;y++) for(let x=0;x<R.cols;x++) s+='<rect class="cellr" x="'+(G2.ox+x*CELL)+'" y="'+(G2.oy+y*CELL)+'" width="'+CELL+'" height="'+CELL+'"/>';
  Object.keys(d.placed).forEach(cat=>{ s+=partSVG(d,cat,o); });
  if(Lx.nozzle!=null){ const nx=G2.ox+Lx.nozzle*CELL, by=G2.oy+bh; s+='<path d="M'+(nx-12)+' '+(by+3)+'h24l6 20h-36z" fill="#7C8DA3"/>';
    if(o.live){ const gx=G2.ox+Lx.cogX*CELL, gy=G2.oy+Lx.cogY*CELL, col=Lx.align>=.95?'#1E9E5A':Lx.align>=.88?'#C27A00':'#D2443A';
      s+='<path d="M'+nx+' '+by+'V'+G2.oy+'" stroke="#2C9AC8" stroke-width="1.5" stroke-dasharray="5 5" pointer-events="none"/><g pointer-events="none"><circle cx="'+gx+'" cy="'+gy+'" r="9" fill="#fff" stroke="'+col+'" stroke-width="2.5"/><path d="M'+(gx-13)+' '+gy+'h26M'+gx+' '+(gy-13)+'v26" stroke="'+col+'" stroke-width="2"/></g>'; } }
  s+=(o.live?'<text class="lbl" x="'+(G2.ox+bw/2)+'" y="'+(G2.h-4)+'">ADATTATORE DEL LANCIATORE</text>':'')+'<g id="'+(o.live?'hl':'hlx')+'"></g></svg>'; return s; }

/* ---------- personaggi ---------- */
function person(x,y,s,col,id,opt){ opt=opt||{}; const face=opt.back?'':'';
  return '<g class="pp" data-p="'+id+'" transform="translate('+x+' '+y+') scale('+s+')">'+
    (opt.chair!==false?'<rect x="-34" y="-58" width="68" height="78" rx="12" fill="#3A4757"/>':'')+
    '<path d="M-30 30c0-34 12-52 30-52s30 18 30 52z" fill="#DCE2E9" stroke="#9AA7B6" stroke-width="2"/>'+
    '<path d="M-6-20l6 14 6-14" fill="none" stroke="'+col+'" stroke-width="5" stroke-linejoin="round"/><circle cx="13" cy="0" r="5" fill="'+col+'"/>'+
    '<ellipse cx="0" cy="-48" rx="20" ry="24" fill="#F6F8FA" stroke="#9AA7B6" stroke-width="2"/><ellipse cx="-6" cy="-56" rx="6" ry="8" fill="#fff" opacity=".8"/>'+
    (opt.glow?'<ellipse cx="0" cy="-48" rx="27" ry="31" fill="none" stroke="'+col+'" stroke-width="4" opacity=".75"/>':'')+face+'</g>'; }

/* ---------- campus ---------- */
const ISO={ox:500,oy:40,s:34}; const ip=(u,v,z)=>[ISO.ox+(u-v)*.866*ISO.s, ISO.oy+(u+v)*.5*ISO.s-(z||0)*ISO.s]; const pts=a=>a.map(p=>p[0].toFixed(1)+','+p[1].toFixed(1)).join(' ');
function box(u,v,a,b,h,c){ return '<polygon class="face" points="'+pts([ip(u+a,v,0),ip(u+a,v+b,0),ip(u+a,v+b,h),ip(u+a,v,h)])+'" fill="'+c[2]+'" stroke="#55657A" stroke-width="1"/>'+
  '<polygon class="face" points="'+pts([ip(u,v+b,0),ip(u+a,v+b,0),ip(u+a,v+b,h),ip(u,v+b,h)])+'" fill="'+c[1]+'" stroke="#55657A" stroke-width="1"/>'+
  '<polygon class="face" points="'+pts([ip(u,v,h),ip(u+a,v,h),ip(u+a,v+b,h),ip(u,v+b,h)])+'" fill="'+c[0]+'" stroke="#55657A" stroke-width="1"/>'; }
function bands(u,v,a,b,h,floors,glass,stripe){ let s=''; for(let k=0;k<floors;k++){ const z0=(k+.35)*h/floors, z1=(k+.75)*h/floors;
    s+='<polygon points="'+pts([ip(u+a*.08,v+b,z0),ip(u+a*.92,v+b,z0),ip(u+a*.92,v+b,z1),ip(u+a*.08,v+b,z1)])+'" fill="'+glass+'"/>';
    s+='<polygon points="'+pts([ip(u+a,v+b*.1,z0),ip(u+a,v+b*.9,z0),ip(u+a,v+b*.9,z1),ip(u+a,v+b*.1,z1)])+'" fill="'+glass+'" opacity=".85"/>'; }
  if(stripe) s+='<polygon points="'+pts([ip(u,v+b,h*.92),ip(u+a,v+b,h*.92),ip(u+a,v+b,h*.98),ip(u,v+b,h*.98)])+'" fill="'+stripe+'"/>'; return s; }
function dish(x,y,r,tilt){ return '<g transform="translate('+x+' '+y+')"><path d="M0 0v-'+(r*.9)+'" stroke="#55657A" stroke-width="3"/><g transform="translate(0 -'+r+') rotate('+(tilt||-25)+')"><ellipse rx="'+r+'" ry="'+(r*.45)+'" fill="#F4F7FA" stroke="#55657A" stroke-width="1.5"/><path d="M0 0l'+(r*.5)+' -'+(r*.6)+'" stroke="#55657A" stroke-width="2"/></g></g>'; }
function tree(u,v,k){ const p=ip(u,v,0), r=(k||1)*9; return '<ellipse cx="'+p[0]+'" cy="'+(p[1]+3)+'" rx="'+r+'" ry="'+(r*.4)+'" fill="#4F7F3A" opacity=".35"/><circle cx="'+p[0]+'" cy="'+(p[1]-r)+'" r="'+r+'" fill="#4E9A43" stroke="#3B7A33" stroke-width="1.5"/><circle cx="'+(p[0]-r*.3)+'" cy="'+(p[1]-r*1.35)+'" r="'+(r*.38)+'" fill="#7CC25F"/>'; }
function flat(u,v,a,b,fill,stroke,dash){ return '<polygon points="'+pts([ip(u,v,0),ip(u+a,v,0),ip(u+a,v+b,0),ip(u,v+b,0)])+'" fill="'+fill+'"'+(stroke?' stroke="'+stroke+'" stroke-width="2"':'')+(dash?' stroke-dasharray="'+dash+'"':'')+'/>'; }
function rocketSVG(x,y,k,cls){ k=k||1; return '<g class="'+(cls||'')+'" transform="translate('+x+' '+y+') scale('+k+')"><g class="flame"><path d="M-9 0q9 46 18 0z" fill="#FFB347"/><path d="M-5 0q5 26 10 0z" fill="#FFF3B0"/></g>'+
  '<path d="M-16 -8l-10 12v-26zM16 -8l10 12v-26z" fill="#D2443A" stroke="#7A2620"/><rect x="-14" y="-150" width="28" height="150" rx="3" fill="#F7F9FB" stroke="#55657A" stroke-width="1.5"/><rect x="-14" y="-110" width="28" height="9" fill="#2F6FD6"/><rect x="-14" y="-40" width="28" height="6" fill="#1E2A3A"/>'+
  '<path d="M-14 -150q14 -46 28 0z" fill="#F07B3F" stroke="#55657A" stroke-width="1.5"/><circle cx="0" cy="-128" r="5" fill="#BFD7F5" stroke="#55657A"/></g>'; }
// edifici di base: sempre presenti
const BLD=[
  {k:'mcc',n:'Mission Control Center',u:5.0,v:0.8,a:2.4,b:2.4,h:1.3,draw(o){ const c=['#F1F4F7','#D6DEE7','#BAC6D3'], p=ip(o.u+.3,o.v+o.b,0); return box(o.u,o.v,o.a,o.b,o.h,c)+bands(o.u,o.v,o.a,o.b,o.h,2,'#F3C27A','#F07B3F')+dish(p[0]-8,p[1]-2,24,-30); }},
  {k:'admin',n:'Edificio amministrativo',u:2.0,v:3.6,a:3.0,b:2.2,h:2.4,draw(o){ const c=['#F2F5F8','#D7DFE8','#BCC8D5'], f=ip(o.u+.6,o.v+.4,o.h); return box(o.u,o.v,o.a,o.b,o.h,c)+bands(o.u,o.v,o.a,o.b,o.h,3,'#7FA6C9')+box(o.u+1.4,o.v+.6,1.4,1.6,1.3,c)+bands(o.u+1.4,o.v+.6,1.4,1.6,1.3,2,'#7FA6C9')+
    '<path d="M'+f.join(' ')+'v-30" stroke="#55657A" stroke-width="2"/><path d="M'+f[0]+' '+(f[1]-30)+'h20l-5 6 5 6h-20z" fill="#F07B3F"/>'; }},
  {k:'build',n:'Edificio di costruzione',u:10.2,v:2.0,a:3.0,b:2.6,h:1.9,draw(o){ const c=['#EEF2F6','#D3DCE6','#B7C4D2'], p=ip(o.u+2.2,o.v+1,o.h); return box(o.u,o.v,o.a,o.b,o.h,c)+bands(o.u,o.v,o.a,o.b,o.h,2,'#86B2D6')+
    '<polygon points="'+pts([ip(o.u+.7,o.v+o.b,0),ip(o.u+1.8,o.v+o.b,0),ip(o.u+1.8,o.v+o.b,1.1),ip(o.u+.7,o.v+o.b,1.1)])+'" fill="#9AA9BA" stroke="#55657A"/>'+'<rect x="'+(p[0]-4)+'" y="'+(p[1]-24)+'" width="8" height="24" fill="#C9D3DD" stroke="#55657A"/><rect x="'+(p[0]+8)+'" y="'+(p[1]-16)+'" width="8" height="16" fill="#C9D3DD" stroke="#55657A"/>'; }},
  {k:'test',n:'Edificio di testing',u:2.0,v:10.0,a:2.6,b:2.2,h:1.1,draw(o){ const c=['#EEF2F6','#D3DCE6','#B7C4D2'], a=ip(o.u+.8,o.v+.7,o.h); return box(o.u,o.v,o.a,o.b,o.h,c)+bands(o.u,o.v,o.a,o.b,o.h,1,'#86B2D6')+
    '<circle cx="'+a[0]+'" cy="'+(a[1]-12)+'" r="19" fill="url(#sph)" stroke="#55657A" stroke-width="1.5"/>'+[0,1,2].map(i=>flat(o.u+o.a+.3,o.v+.2+i*.7,.9,.5,'#2D5BB8','#1C3F86')).join(''); }},
  {k:'fd',n:'Centro di dinamica del volo',u:9.9,v:-1.7,a:2.4,b:2.2,h:1.3,draw(o){ const c=['#F1F4F7','#D6DEE7','#BAC6D3'], t=ip(o.u+1.2,o.v+1.1,o.h);
    return box(o.u,o.v,o.a,o.b,o.h,c)+bands(o.u,o.v,o.a,o.b,o.h,2,'#86B2D6','#2F6FD6')+'<ellipse cx="'+t[0]+'" cy="'+(t[1]+2)+'" rx="30" ry="12" fill="#B7C4D2"/><path d="M'+(t[0]-26)+' '+t[1]+'a26 24 0 0 1 52 0z" fill="#EEF2F6" stroke="#55657A"/><path d="M'+(t[0]-4)+' '+(t[1]-23)+'l8 0l3 23h-14z" fill="#1E2A3A"/>'+
      '<ellipse cx="'+t[0]+'" cy="'+(t[1]-12)+'" rx="46" ry="13" fill="none" stroke="#F07B3F" stroke-width="2.5" stroke-dasharray="6 5" transform="rotate(-14 '+t[0]+' '+(t[1]-12)+')"/><circle cx="'+(t[0]+40)+'" cy="'+(t[1]-24)+'" r="4" fill="#F07B3F"/>'; }},
  {k:'pad',n:'Rampa di lancio',u:11.2,v:11.2,a:3.4,b:3.4,h:0,draw(o){ const c=ip(o.u+1.7,o.v+1.7,0), t=ip(o.u+2.5,o.v+1.1,0);
    return flat(o.u,o.v,o.a,o.b,'#C3CAD2','#8A96A5')+flat(o.u+1.2,o.v+1.2,1,1,'#7C8796')+
      '<g stroke="#C0392B" stroke-width="2.5" fill="none"><path d="M'+(t[0]-9)+' '+t[1]+'V'+(t[1]-152)+'M'+(t[0]+9)+' '+t[1]+'V'+(t[1]-152)+'"/>'+[...Array(8)].map((_,i)=>'<path d="M'+(t[0]-9)+' '+(t[1]-i*19)+'L'+(t[0]+9)+' '+(t[1]-(i+1)*19)+'M'+(t[0]+9)+' '+(t[1]-i*19)+'L'+(t[0]-9)+' '+(t[1]-(i+1)*19)+'"/>').join('')+'</g>'+
      (padMission()?'<path d="M'+(t[0]-9)+' '+(t[1]-96)+'H'+(c[0]+10)+'" stroke="#C0392B" stroke-width="4"/>'+rocketSVG(c[0],c[1]-4,.8*(E.LV[padMission().sat.lv].h||1)):''); }}
];
// lotti liberi: ci si costruiscono gli edifici sbloccati con i livelli
const PLOTS=[{u:-2.2,v:8.7},{u:10.4,v:5.4},{u:13.6,v:0.6},{u:4.6,v:12.8},{u:1.6,v:13.4}], PA=2.2, PB=2.0;
const BDRAW={
  factory(u,v){ const c=['#E9EDF2','#CBD4DE','#AEBBC9']; let s=box(u,v,PA,PB,1.0,c); for(let i=0;i<3;i++){ const u0=u+i*PA/3, u1=u0+PA/3; s+='<polygon points="'+pts([ip(u0,v,1.0),ip(u1,v,1.0),ip(u1,v,1.5),ip(u1,v+PB,1.5),ip(u1,v+PB,1.0),ip(u0,v+PB,1.0)])+'" fill="#9FB4CC" stroke="#55657A"/><polygon points="'+pts([ip(u1,v,1.5),ip(u1,v+PB,1.5),ip(u1,v+PB,1.0),ip(u1,v,1.0)])+'" fill="#6E8FB8" stroke="#55657A"/>'; }
    const ch=ip(u+.3,v+.3,1.0); return s+'<rect x="'+(ch[0]-6)+'" y="'+(ch[1]-46)+'" width="12" height="46" fill="#B7C4D2" stroke="#55657A"/><circle class="smoke" cx="'+ch[0]+'" cy="'+(ch[1]-54)+'" r="7" fill="#fff" opacity=".7"/>'; },
  ground(u,v){ const p=ip(u+1.2,v+1.0,0); return flat(u,v,PA,PB,'#C9D1D9','#8A96A5')+box(u+.2,v+1.2,.8,.7,.5,['#F1F4F7','#D6DEE7','#BAC6D3'])+dish(p[0]+6,p[1]+6,38,-35); },
  rnd(u,v){ const c=['#EAF3FB','#BFD6EC','#9DBEDF'], t=ip(u+1.1,v+1.0,1.6); return box(u+.1,v+.1,2.0,1.8,1.6,c)+bands(u+.1,v+.1,2.0,1.8,1.6,3,'#4E87C7')+'<path d="M'+(t[0]-20)+' '+t[1]+'a20 14 0 0 1 40 0z" fill="#D7E4F2" stroke="#55657A"/>'; },
  office(u,v){ const c=['#F5F1EA','#DCD3C6','#C4B8A6']; return box(u+.4,v+.3,1.4,1.4,3.4,c)+bands(u+.4,v+.3,1.4,1.4,3.4,6,'#6C8FB5','#22A87A'); },
  visit(u,v){ const c=['#FFF4EC','#F6D8C3','#E7BB9E']; return box(u,v+.2,PA,1.6,.9,c)+bands(u,v+.2,PA,1.6,.9,1,'#F3C27A','#F07B3F')+rocketSVG(ip(u+1.9,v+1.9,0)[0],ip(u+1.9,v+1.9,0)[1],.42); }
};
// la missione il cui razzo sta sulla rampa: lanciatore scelto, non ancora partita (prima chi è pronto)
const padPending=()=>G.pad?G.missions.filter(m=>['C','D'].indexOf(m.phase)>=0&&m.sat.lv==='HOME'):[];
function padMission(){ const p=padPending(), M=cur(); if(!p.length) return null; return p.find(m=>m.phase==='D'&&m.ready)||(p.indexOf(M)>=0?M:null)||p.find(m=>m.phase==='D')||p[0]; }
const hasB=k=>G.plots.indexOf(k)>=0, maxStake=()=>E.MAXSTAKE+(hasB('office')?1:0);
let CBAR=false, CPLACE=null, CDRAG=null, CSWALLOW=false, CTAB='Edifici', CSEL=null;
const CMENU={Edifici:['factory','ground','rnd','office','visit','pad'],Natura:['tree','pine','poplar','pond'],Infrastrutture:['parking','dish']};
function cKind(k){ const d=CAM.K[k], up=L.BUILD[k]; return { n:d.n, c:up?up.c:(d.c||0), lvl:up?up.lvl:(d.lvl||1), s:up?up.s:(k==='pad'?'Lanci in casa i tuoi CubeSat: −40% a ogni lancio.':d.deco?'Decorazione: rende il campus più bello.':'') }; }
function cBuilt(k){ return k==='pad'?!!G.pad:L.BUILD[k]?hasB(k):false; }
/* ---------- persone che camminano (campus e interni) ---------- */
const WK={map:{},cache:{},last:0,raf:0};
function wkRng(seed){ let s=seed>>>0||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
function wkHash(str){ let h=2166136261; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619); } return h>>>0; }
const WKSTY={
  skin:['#F0D3B8','#E8C3A0','#C99673','#9C6B4A','#6E4630'],
  hair:['#2E241E','#6B4A30','#1C1714','#B98A4E','#8A8A8A','#A34E2A'],
  top:['#3F5E74','#C7643E','#E8E6DF','#4F6B48','#2F3B45','#7A5C8E','#D9A441','#5E8FB8'],
  pant:['#3B4652','#5C6670','#2F3640','#7A6A58','#2C3E50'],
  shoe:['#2A2A28','#5A3A2A','#F2F2EE','#3A3F46']};
function wkFig(o){ const sk=o.skin, hr=o.hair, top=o.top, pant=o.pant, sh=o.shoe, hs=o.hs;
  const suit=o.kind==='suit', coat=o.kind==='coat', vest=o.kind==='vest';
  const T=suit?'#F6F8F9':top, Pn=suit?'#EEF2F4':pant, S=suit?'#7FB6C8':sh;
  const arm=(cls,x)=>'<g class="'+cls+'"><path d="M'+x+' -16.2L'+(x*1.12)+' -10.6" stroke="'+(coat?'#F7F8F6':T)+'" stroke-width="2.1" stroke-linecap="round"/><circle cx="'+(x*1.12)+'" cy="-10.1" r="1" fill="'+(suit?'#7FB6C8':sk)+'"/></g>';
  const leg=(cls,x)=>'<g class="'+cls+'"><path d="M'+x+' -9L'+x+' -1" stroke="'+Pn+'" stroke-width="2.5" stroke-linecap="round"/><ellipse cx="'+(x+.45)+'" cy="-.45" rx="1.55" ry=".8" fill="'+S+'"/></g>';
  const torso='<path d="M-3.5 -16.9Q-3.8 -12.6 -3.05 -8.4L3.05 -8.4Q3.8 -12.6 3.5 -16.9Q0 -18.3 -3.5 -16.9Z" fill="'+T+'"/>'+
    (coat?'<path d="M-3.7 -16.6Q-4 -10 -3.6 -5.6L-.2 -5.6L-.2 -16.4Z" fill="#F7F8F6"/><path d="M3.7 -16.6Q4 -10 3.6 -5.6L.4 -5.6L.4 -16.4Z" fill="#ECEEEB"/>':'')+
    (vest?'<path d="M-3.3 -16.4L-3 -9.2L3 -9.2L3.3 -16.4L1.4 -16.6L0 -12.8L-1.4 -16.6Z" fill="#F08A2E"/><path d="M-3.2 -12.4H3.2" stroke="#F4F1DC" stroke-width=".8"/>':'')+
    (!suit&&!coat&&!vest?'<path d="M-3.1 -9.4H3.1" stroke="'+mixC(T,'#000',.35)+'" stroke-width=".7"/>':'')+
    (suit?'<path d="M0 -16.8V-9" stroke="#D5DDE2" stroke-width=".5"/>':'');
  const headF=(suit?'<path d="M-3.1 -19.2Q-3.2 -24.2 0 -24.3Q3.2 -24.2 3.1 -19.2L3 -17.4H-3Z" fill="#F6F8F9"/><ellipse cx=".5" cy="-20.2" rx="1.9" ry="1.8" fill="'+sk+'"/><rect x="-1.1" y="-19.4" width="3.4" height="1.5" rx=".7" fill="#7FB6C8"/><circle cx="1.5" cy="-20.9" r=".28" fill="#22303A"/><circle cx="-.1" cy="-20.9" r=".28" fill="#22303A"/>':
     '<rect x="-.9" y="-18.1" width="1.9" height="1.6" fill="'+mixC(sk,'#5A3A2A',.15)+'"/><ellipse cx=".25" cy="-20.2" rx="2.5" ry="2.85" fill="'+sk+'"/><ellipse cx="-2.1" cy="-20" rx=".55" ry=".8" fill="'+mixC(sk,'#5A3A2A',.12)+'"/>'+
     '<circle cx="1.85" cy="-20.4" r=".3" fill="#22303A"/><circle cx=".35" cy="-20.4" r=".3" fill="#22303A"/><path d="M.7 -18.9Q1.2 -18.6 1.7 -18.9" stroke="'+mixC(sk,'#7A3A2A',.4)+'" stroke-width=".35" fill="none"/>'+hairF(hs,hr))+
    (vest?'<path d="M-2.9 -21.4Q-2.9 -25 .2 -25Q3.3 -25 3.3 -21.4Z" fill="#F2C14E"/><path d="M-3.4 -21.4H3.9" stroke="#D9A42E" stroke-width=".9" stroke-linecap="round"/>':'')+
    (o.headset?'<path d="M-2.6 -20.8Q-2.5 -23.9 .3 -24Q3.1 -23.9 3.1 -20.8" fill="none" stroke="#1E262E" stroke-width=".55"/><rect x="2.6" y="-21.2" width="1" height="1.6" rx=".4" fill="#1E262E"/><path d="M3.2 -19.8Q2.8 -18.6 1.6 -18.6" stroke="#1E262E" stroke-width=".4" fill="none"/>':'');
  const headB=suit?'<path d="M-3.1 -19.2Q-3.2 -24.2 0 -24.3Q3.2 -24.2 3.1 -19.2L3 -17.4H-3Z" fill="#EEF2F4"/>':
    '<rect x="-.9" y="-18.1" width="1.9" height="1.6" fill="'+mixC(sk,'#5A3A2A',.15)+'"/><ellipse cx=".25" cy="-20.2" rx="2.5" ry="2.85" fill="'+sk+'"/>'+hairB(hs,hr)+(vest?'<path d="M-2.9 -21.4Q-2.9 -25 .2 -25Q3.3 -25 3.3 -21.4Z" fill="#F2C14E"/>':'');
  return '<ellipse cx="1" cy=".4" rx="5.4" ry="1.7" fill="#22302A" opacity=".26"/><g class="bd">'+
    '<g class="ff">'+arm('arB',-3.15)+leg('lgA',-1.25)+leg('lgB',1.25)+torso+arm('arA',3.15)+headF+'</g>'+
    '<g class="fb">'+arm('arA',3.15)+leg('lgA',-1.25)+leg('lgB',1.25)+torso+arm('arB',-3.15)+headB+'</g></g>'; }
function mixC(a,b,t){ const h=c=>[1,3,5].map(i=>parseInt(c.substr(i,2),16)), A=h(a), B=h(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
function hairF(hs,c){ if(hs===3) return '<path d="M-2.3 -21.6Q-2.4 -22.6 -1.6 -22.9" stroke="'+c+'" stroke-width=".9" fill="none"/>';
  const cap='<path d="M-2.4 -20.4Q-2.6 -23.4 .3 -23.5Q3.2 -23.5 2.9 -21.2Q1.6 -22.4 .2 -22.1Q-1.2 -21.9 -2.4 -20.4Z" fill="'+c+'"/>';
  if(hs===1) return cap+'<path d="M-2.4 -21.2Q-3.4 -18 -2.8 -15.6L-1.8 -15.8Q-2.2 -18.4 -1.6 -21.4Z" fill="'+c+'"/>';
  if(hs===2) return cap+'<circle cx="-1.6" cy="-23.2" r="1.3" fill="'+c+'"/>';
  if(hs===4) return '<path d="M-2.7 -20.2Q-3.4 -24 .3 -24.2Q3.7 -24 3 -21.2Q2.2 -22.6 .3 -22.4Q-1.4 -22.2 -2.7 -20.2Z" fill="'+c+'"/>';
  return cap; }
function hairB(hs,c){ if(hs===3) return '<path d="M-2.3 -19.4Q.3 -18.4 2.8 -19.4" stroke="'+c+'" stroke-width="1" fill="none"/>';
  let s='<path d="M-2.45 -19.4Q-2.8 -23.5 .25 -23.6Q3.3 -23.5 2.95 -19.4Q.25 -18.2 -2.45 -19.4Z" fill="'+c+'"/>';
  if(hs===1) s+='<path d="M-2.4 -20Q-2.6 -16.6 .25 -15.8Q3.1 -16.6 2.9 -20Z" fill="'+c+'"/>';
  if(hs===2) s+='<circle cx=".25" cy="-23.2" r="1.4" fill="'+c+'"/>';
  return s; }
// percorsi: punti liberi collegati da segmenti liberi
function wkPaths(n,free,box,rng,step){ const out=[]; const pick=()=>{ for(let k=0;k<80;k++){ const x=box[0]+rng()*(box[2]-box[0]), y=box[1]+rng()*(box[3]-box[1]); if(free(x,y)) return [x,y]; } return null; };
  const clear=(a,b)=>{ const L=Math.hypot(b[0]-a[0],b[1]-a[1]), m=Math.max(1,Math.ceil(L/(step||.25))); for(let i=1;i<m;i++){ if(!free(a[0]+(b[0]-a[0])*i/m,a[1]+(b[1]-a[1])*i/m)) return false; } return true; };
  for(let w=0;w<n;w++){ const p0=pick(); if(!p0) continue; const pts=[p0];
    for(let k=0;k<5&&pts.length<4;k++){ let ok=null; for(let t=0;t<40;t++){ const q=pick(); if(!q) break; const d=Math.hypot(q[0]-pts[pts.length-1][0],q[1]-pts[pts.length-1][1]); if(d>1.5&&d<9&&clear(pts[pts.length-1],q)){ ok=q; break; } } if(ok) pts.push(ok); }
    if(pts.length<2) continue; const loop=pts.length>2&&clear(pts[pts.length-1],pts[0]); const seq=loop?pts.concat([pts[0]]):pts.concat(pts.slice(0,-1).reverse());
    out.push({seq,ph:rng()*60,sp:.45+rng()*.25,pause:[1.5+rng()*3.5,.6+rng()*2]}); }
  return out; }
function wkPos(w,t){ const s=w.seq; let cyc=w.cyc; if(!cyc){ cyc=0; for(let i=0;i<s.length-1;i++) cyc+=Math.hypot(s[i+1][0]-s[i][0],s[i+1][1]-s[i][1])/w.sp+w.pause[i%2]; w.cyc=cyc; }
  let tt=(t+w.ph)%cyc; for(let i=0;i<s.length-1;i++){ const a=s[i], b=s[i+1], p=w.pause[i%2]; if(tt<p) return {x:a[0],y:a[1],mv:0,dx:b[0]-a[0],dy:b[1]-a[1]}; tt-=p; const d=Math.hypot(b[0]-a[0],b[1]-a[1])/w.sp; if(tt<d){ const f=tt/d; return {x:a[0]+(b[0]-a[0])*f,y:a[1]+(b[1]-a[1])*f,mv:1,dx:b[0]-a[0],dy:b[1]-a[1]}; } tt-=d; }
  const z=s[s.length-1]; return {x:z[0],y:z[1],mv:0,dx:1,dy:0}; }
function wkStyle(rng,kind){ const r=a=>a[Math.floor(rng()*a.length)]; return {skin:r(WKSTY.skin),hair:r(WKSTY.hair),top:r(WKSTY.top),pant:r(WKSTY.pant),shoe:r(WKSTY.shoe),hs:Math.floor(rng()*5),kind:kind||'',headset:kind==='headset'}; }
// scena: 'campus' oppure il nome di una stanza
function wkScene(scene,st){ let key, n, free, box, kind=[], sc, Pf;
  if(scene==='campus'){ const it=G.world.items; key='c|'+it.map(i=>i.k+i.x+','+i.y).join(';')+'|'+siteK(); n=Math.min(12,4+Math.round(G.staff/3)); const S=CAM.site(); box=[Math.min(...S.map(p=>p[0])),Math.min(...S.map(p=>p[1])),Math.max(...S.map(p=>p[0])),Math.max(...S.map(p=>p[1]))];
    free=(x,y)=>!CAM.valid('poplar',x-.3,y-.3,it,null); sc=.85; Pf=CAM.P; }
  else { const room=scene, D=IR.dims; key='r|'+room+'|'+JSON.stringify((st.machines||[]).map(m=>[m.k,m.x,m.y]))+JSON.stringify(st.plants||[]); n={build:3,clean:2,test:2,mcc:1}[room]||0; if(!n) return [];
    box=[.6,.6,D[0]-.6,D[1]-.6]; free=(x,y)=>!IR.valid(room,'plant',x-.3,y-.3,st); kind={build:['vest','vest',''],clean:['suit','suit'],test:['coat','coat'],mcc:['headset']}[room]; sc=1.32; Pf=IR.P; }
  let ws=WK.cache[key]; if(!ws){ const rng=wkRng(wkHash(key)); ws=wkPaths(n,free,box,rng).map((w,i)=>Object.assign(w,{id:scene+'-'+i,sty:wkStyle(rng,kind[i%Math.max(1,kind.length)]||''),sc,Pf})); WK.cache[key]=ws; }
  const t=performance.now()/1000; return ws.map(w=>{ WK.map[w.id]=w; const p=wkPos(w,t); return {d:p.x+p.y+.05, svg:wkSVG(w,p,t)}; }); }
function wkFace(w,p){ const sx=p.dx-p.dy, sy=p.dx+p.dy; if(Math.abs(sx)+Math.abs(sy)>1e-6){ w.mir=sx<0?-1:1; w.bk=sy<0; } }
function wkSVG(w,p,t){ wkFace(w,p); const g=w.Pf(p.x,p.y); return '<g class="dzw'+(p.mv?' mv':'')+(w.bk?' bk':'')+'" data-w="'+w.id+'" style="--wd:-'+(t%1.28).toFixed(2)+'s" transform="translate('+g[0].toFixed(1)+' '+g[1].toFixed(1)+') scale('+(w.sc*w.mir)+' '+w.sc+')">'+wkFig(w.sty)+'</g>'; }
function wkFrame(now){ WK.raf=requestAnimationFrame(wkFrame); if(now-WK.last<40) return; WK.last=now; const els=document.querySelectorAll('.dzw'); if(!els.length) return; const t=now/1000;
  els.forEach(el=>{ const w=WK.map[el.dataset.w]; if(!w) return; const p=wkPos(w,t); wkFace(w,p); const g=w.Pf(p.x,p.y); el.setAttribute('transform','translate('+g[0].toFixed(1)+' '+g[1].toFixed(1)+') scale('+(w.sc*w.mir)+' '+w.sc+')');
    el.classList.toggle('mv',!!p.mv); el.classList.toggle('bk',!!w.bk); wkSlot(el,p.x+p.y+.05); }); }
function wkSlot(el,d){ const par=el.parentNode; if(!par) return; let arr=par._dz; if(arr&&arr.length&&arr[0][1].parentNode!==par){ arr=null; par._dzEnd=null; } if(!arr){ arr=par._dz=Array.from(par.children).filter(c=>c.dataset&&c.dataset.d!=null).map(c=>[+c.dataset.d,c]); }
  if(!arr.length) return; let lo=0, hi=arr.length; while(lo<hi){ const m=(lo+hi)>>1; if(arr[m][0]<=d) lo=m+1; else hi=m; }
  const tgt=lo<arr.length?arr[lo][1]:(par._dzEnd||(par._dzEnd=arr[arr.length-1][1].nextElementSibling&&!arr[arr.length-1][1].nextElementSibling.classList.contains('dzw')?arr[arr.length-1][1].nextElementSibling:null)); if(el._tgt!==tgt&&(!tgt||tgt.parentNode===par)){ par.insertBefore(el,tgt); el._tgt=tgt; } }
WK.raf=requestAnimationFrame(wkFrame);

function cCtx(){ const M=cur(), next=nextPlace(M), labels={}; ['admin','mcc','fd','build','test','pad'].forEach(k=>{ const w=waitOf(k); labels[k]=next===k?'!':w?w.replace('⏳',''):''; });
  const pm=padMission(), cam=G.world.cam, pad=300, view={ x0:(0-cam.x)/cam.z-pad, x1:(1280-cam.x)/cam.z+pad, y0:(0-cam.y)/cam.z-pad, y1:(800-cam.y)/cam.z+pad }; return { walkers:wkScene('campus'), labels, view, flag:G.flag||null, pad:{ rocket:!!pm, rocketH:pm?.85*(E.LV[pm.sat.lv]||{h:1}).h:1 } }; }
function vHub(v){ const W=G.world, cam=W.cam||(W.cam={x:0,y:0,z:1}), lv=L.level(G.xp), M=cur(), next=nextPlace(M);
  const st={items:W.items,mode:G.cedit?'edit':'',sel:CSEL,moving:CPLACE&&CPLACE.moveId};
  const tiles=CMENU[CTAB].map(k=>{ const ki=cKind(k), lock=lv<ki.lvl, built=cBuilt(k); return '<button class="ctile'+(CPLACE&&CPLACE.k===k&&!CPLACE.moveId?' on':'')+(lock||built?' lock':'')+'" data-act="cplace" data-k="'+k+'"'+(lock||built?' disabled':'')+' title="'+esc(ki.s)+'"><svg viewBox="-48 -44 96 66" aria-hidden="true">'+CAM.DEFS+CAM.mini(k)+'</svg><b>'+esc(ki.n)+'</b><small>'+(built?'costruito':k==='dish'&&!hasB('ground')?'serve la stazione di terra':lock?'livello '+ki.lvl:keur(ki.c)+(SREQ[k]?' · 👥'+SREQ[k]:'')+(k==='parking'?' · 🚗14':''))+'</small>'+(lock?'<span class="lk">🔒</span>':'')+'</button>'; }).join('');
  const pop=CSEL&&G.cedit?(()=>{ const it=W.items.find(i=>i.id===CSEL); if(!it) return ''; const d=CAM.K[it.k], ki=cKind(it.k), canDel=!d.core; return '<div class="cpop"><b>'+esc(d.n)+'</b><div class="row"><button class="btn small primary" data-act="cmove">Sposta</button>'+(canDel?'<button class="btn small" data-act="cdel">Rimuovi'+(ki.c?' · +'+keur(Math.round(ki.c/2)):'')+'</button>':'')+(it.k==='build'?'<button class="btn small" data-act="flagedit">Bandiera</button>':'')+'</div><span class="fine">'+(d.core?'Gli edifici principali si spostano ma non si demoliscono.':'Rimuovendolo recuperi metà del costo.')+'</span></div>'; })():'';
  const hintT=CPLACE?(CPLACE.moveId?'Scegli il nuovo posto per '+CAM.K[CPLACE.k].n.toLowerCase()+'. Esc per annullare.':'Tocca un punto libero del campus per costruire '+CAM.K[CPLACE.k].n.toLowerCase()+'. Esc per annullare.')+(CPLACE.why?' · '+CPLACE.why:''):G.cedit?'Modalità modifica: tocca un edificio, un albero o un oggetto per spostarlo o rimuoverlo.':'';
  scn(v,{bg:'#A9BF77'}); v.innerHTML='<div class="stage0"><section class="campus3 full" id="cam"><svg id="camsvg" class="'+(CPLACE?'placing':'')+(G.cedit?' editing':'')+'" viewBox="0 0 1280 800" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Il campus della tua agenzia">'+CAM.DEFS+'<g id="camg" transform="translate('+cam.x.toFixed(1)+' '+cam.y.toFixed(1)+') scale('+cam.z.toFixed(3)+')">'+CAM.world(st,cCtx())+'<g id="cghost"></g></g></svg>'+
    '<div class="ctools"><button data-act="staff" title="Dipendenti / posti auto">👥 '+G.staff+'/'+spaces()+'</button><button class="'+(G.cedit?'on':'')+'" data-act="cedit" title="'+(G.cedit?'Fine modifica':'Modifica campus')+'">'+(G.cedit?'✔️<span class="tl"> Fine modifica</span>':'✏️<span class="tl"> Modifica campus</span>')+'</button><button data-act="flagedit" title="Bandiera">🚩<span class="tl"> Bandiera</span></button></div>'+
    (hintT?'<div class="chint">'+esc(hintT)+'</div>':'')+pop+
    ((CBAR||CPLACE)?'<div class="cbar"><div class="ctabs">'+Object.keys(CMENU).map(t=>'<button class="'+(t===CTAB?'on':'')+'" data-act="ctab" data-k="'+t+'">'+t+'</button>').join('')+(CPLACE?'<button data-act="cesc" style="margin-left:auto">Annulla</button>':'')+'<button data-act="cbar" style="'+(CPLACE?'':'margin-left:auto')+'">Chiudi</button></div>'+(CPLACE?'':'<div class="ctiles">'+tiles+'</div>')+'</div>':'')+'</section></div>'+
    '<div class="bgrid" hidden>'+['admin','fd','build','test','mcc'].concat(G.pad?['pad']:[]).map(k=>{ const w=waitOf(k); return '<button class="btn" data-act="enter" data-k="'+k+'">'+CAM.K[k].n+(next===k?'<span class="bdg">!</span>':w?'<span class="bdg wait">'+w+'</span>':'')+'</button>'; }).join('')+G.plots.filter(Boolean).map(k=>'<button class="btn" data-act="binfo" data-k="'+k+'">'+L.BUILD[k].n+'</button>').join('')+'</div>'+
    '';
  if(CPLACE&&CPLACE.last) cGhost(CPLACE.last[0],CPLACE.last[1]);
}
function cSvgPt(e){ const svg=$('#camsvg'); if(!svg) return null; const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const m=svg.getScreenCTM(); if(!m) return null; const p=pt.matrixTransform(m.inverse()); return [p.x,p.y]; }
function cWorldPt(e){ const p=cSvgPt(e); if(!p) return null; const c=G.world.cam; return [(p[0]-c.x)/c.z,(p[1]-c.y)/c.z]; }
let CBOX=[-60,-140,1620,830];
const siteK=lv=>Math.min(2.2,1+.07*((lv||L.level(G.xp))-1));
function syncSite(){ const k=siteK(); CAM.setScale(k); CBOX=[778-(778+60)*k,410-(410+140)*k,778+(1620-778)*k,410+(830-410)*k]; }
function cClamp(){ const c=G.world.cam, svg=$('#camsvg'); let vw=1280, vh=800; if(svg){ const r=svg.getBoundingClientRect(); if(r.width&&r.height){ const k=Math.min(1280/r.width,800/r.height); vw=r.width*k; vh=r.height*k; } }
  const zmin=Math.max(vw/(CBOX[2]-CBOX[0]),vh/(CBOX[3]-CBOX[1])); if(c.z<zmin) c.z=zmin;
  const x0=640-vw/2, x1=640+vw/2, y0=400-vh/2, y1=400+vh/2;
  c.x=Math.min(x0-CBOX[0]*c.z,Math.max(x1-CBOX[2]*c.z,c.x)); c.y=Math.min(y0-CBOX[1]*c.z,Math.max(y1-CBOX[3]*c.z,c.y)); }
function cApplyCam(){ const g=$('#camg'), c=G.world.cam; cClamp(); if(g) g.setAttribute('transform','translate('+c.x.toFixed(1)+' '+c.y.toFixed(1)+') scale('+c.z.toFixed(3)+')'); }
let CAMRAF=0; function cApplyCamSoon(){ if(CAMRAF) return; CAMRAF=requestAnimationFrame(()=>{ CAMRAF=0; cApplyCam(); }); }
function cGhost(sx,sy){ if(!CPLACE) return; const d=CAM.K[CPLACE.k], gpt=CAM.toGrid(sx,sy); let x=Math.round((gpt[0]-d.w/2)*4)/4, y=Math.round((gpt[1]-d.h/2)*4)/4; const why=CAM.valid(CPLACE.k,x,y,G.world.items,CPLACE.moveId);
  CPLACE.x=x; CPLACE.y=y; CPLACE.ok=!why; CPLACE.why=why; CPLACE.last=[sx,sy]; const g=$('#cghost'); if(g) g.innerHTML=CAM.ghost(CPLACE.k,x,y,!why,Object.assign({rocket:0},cCtx()[CPLACE.k]||{},CPLACE.k==='build'?{flag:G.flag}:{}));
  const h=$('.chint'); if(h) h.textContent=(CPLACE.moveId?'Scegli il nuovo posto. ':'Tocca un punto libero del campus. ')+(why?'Qui no: '+why+'.':'Qui va bene.')+' Esc per annullare.'; }
function cPlaceAt(){ if(!CPLACE||!CPLACE.ok){ sfx.bad(); if(CPLACE&&CPLACE.why) toast('Qui no: '+CPLACE.why+'.'); return; } const k=CPLACE.k, ki=cKind(k), W=G.world;
  if(CPLACE.moveId){ const it=W.items.find(i=>i.id===CPLACE.moveId); if(it){ it.x=CPLACE.x; it.y=CPLACE.y; } sfx.put(); toast(CAM.K[k].n+' spostato.'); CPLACE=null; CSEL=null; save(); render(); return; }
  if(G.money<ki.c){ toast('Non hai abbastanza crediti.'); sfx.bad(); return; }
  addMoney(-ki.c); W.n=(W.n||100)+1; W.items.push({id:'w'+W.n,k,x:CPLACE.x,y:CPLACE.y,ang:-20-Math.round(Math.random()*25)});
  if(L.BUILD[k]){ G.plots=G.plots.filter(Boolean); G.plots.push(k); sfx.stamp(); toast(ki.n+' costruito: '+ki.s); CPLACE=null; }
  else if(k==='pad'){ G.pad=true; sfx.stamp(); toast('Rampa costruita: ora puoi lanciare da casa.'); CPLACE=null; }
  else { sfx.put(); if(G.money<ki.c) CPLACE=null; }
  save(); render(); }
document.addEventListener('pointerdown',e=>{ const svg=e.target.closest&&e.target.closest('#camsvg'); if(!svg||view!=='hub') return; CDRAG={x:e.clientX,y:e.clientY,cx:G.world.cam.x,cy:G.world.cam.y,moved:false,id:e.pointerId}; });
document.addEventListener('pointermove',e=>{ if(view!=='hub') return; if(CDRAG&&CDRAG.id===e.pointerId){ const dx=e.clientX-CDRAG.x, dy=e.clientY-CDRAG.y; if(!CDRAG.moved&&Math.hypot(dx,dy)>6){ CDRAG.moved=true; const s=$('#camsvg'); if(s){ s.classList.add('drag','panning'); try{ s.setPointerCapture(e.pointerId); }catch(_){} } }
    if(CDRAG.moved){ const svg=$('#camsvg'), r=svg.getBoundingClientRect(), k=Math.min(1280/r.width,800/r.height); G.world.cam.x=CDRAG.cx+dx*k; G.world.cam.y=CDRAG.cy+dy*k; G.world.cam.x=Math.max(-900,Math.min(900,G.world.cam.x)); G.world.cam.y=Math.max(-700,Math.min(600,G.world.cam.y)); cApplyCamSoon(); return; } }
  if(CPLACE&&e.target.closest&&e.target.closest('#camsvg')){ const p=cWorldPt(e); if(p) cGhost(p[0],p[1]); } });
document.addEventListener('pointerup',e=>{ if(!CDRAG||CDRAG.id!==e.pointerId) return; const was=CDRAG; CDRAG=null; const s=$('#camsvg'); if(s){ s.classList.remove('drag','panning'); try{ s.releasePointerCapture(e.pointerId); }catch(_){} } if(CAMRAF){ cancelAnimationFrame(CAMRAF); CAMRAF=0; }
  if(was.moved){ CSWALLOW=true; save(); if(view==='hub') render(); setTimeout(()=>{ CSWALLOW=false; },250); return; }
  if(view!=='hub') return; if(!(e.target.closest&&e.target.closest('#camsvg'))) return;
  if(CPLACE){ const p=cWorldPt(e); if(p) cGhost(p[0],p[1]); cPlaceAt(); CSWALLOW=true; return; }
  const w=e.target.closest('[data-wid]'); if(w&&G.cedit){ CSEL=w.dataset.wid; sfx.tap(); render(); CSWALLOW=true; return; }
  if(G.cedit&&CSEL){ CSEL=null; render(); } });
document.addEventListener('pointercancel',e=>{ if(!CDRAG||CDRAG.id!==e.pointerId) return; CDRAG=null; const s=$('#camsvg'); if(s){ s.classList.remove('drag','panning'); try{ s.releasePointerCapture(e.pointerId); }catch(_){} } if(CAMRAF){ cancelAnimationFrame(CAMRAF); CAMRAF=0; } });
document.addEventListener('click',e=>{ if(CSWALLOW){ CSWALLOW=false; if(e.target.closest&&e.target.closest('#camsvg')){ e.stopPropagation(); e.preventDefault(); } } },true);
const PTR=new Map(); let PINCH=null;
document.addEventListener('pointerdown',e=>{ if(!(e.target.closest&&e.target.closest('#camsvg'))||view!=='hub') return; PTR.set(e.pointerId,[e.clientX,e.clientY]); if(PTR.size===2){ const p=[...PTR.values()]; PINCH={d:Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1])}; const s=$('#camsvg'); if(s) s.classList.add('panning'); CDRAG=null; } },true);
document.addEventListener('pointermove',e=>{ if(!PTR.has(e.pointerId)) return; PTR.set(e.pointerId,[e.clientX,e.clientY]); if(PINCH&&PTR.size===2){ const p=[...PTR.values()], d=Math.hypot(p[0][0]-p[1][0],p[0][1]-p[1][1]); if(PINCH.d>10&&d>10){ const svg=$('#camsvg'); if(svg){ const m=svg.getScreenCTM(), pt=svg.createSVGPoint(); pt.x=(p[0][0]+p[1][0])/2; pt.y=(p[0][1]+p[1][1])/2; const q=pt.matrixTransform(m.inverse()); cZoom(d/PINCH.d,[q.x,q.y]); } PINCH.d=d; } CDRAG=null; e.stopPropagation(); } },true);
['pointerup','pointercancel'].forEach(t=>document.addEventListener(t,e=>{ if(PTR.delete(e.pointerId)&&PTR.size<2){ if(PINCH){ CSWALLOW=true; save(); const s=$('#camsvg'); if(s) s.classList.remove('panning'); setTimeout(()=>{ CSWALLOW=false; },250); } PINCH=null; } },true));
document.addEventListener('wheel',e=>{ const svg=e.target.closest&&e.target.closest('#camsvg'); if(!svg||view!=='hub') return; e.preventDefault(); cZoom(e.deltaY<0?1.12:1/1.12,cSvgPt(e)); },{passive:false});
function cZoom(f,at){ const c=G.world.cam, z=Math.max(.3,Math.min(2.4,c.z*f)); at=at||[640,400]; const wx=(at[0]-c.x)/c.z, wy=(at[1]-c.y)/c.z; c.z=z; c.x=at[0]-wx*z; c.y=at[1]-wy*z; cApplyCamSoon(); clearTimeout(cZoom.t); cZoom.t=setTimeout(()=>{ if(view==='hub') render(); },160); }
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&CPLACE&&view==='hub'){ CPLACE=null; render(); } });
// ---------- editor della bandiera ----------
const FLC=['#FFFFFF','#22313B','#45A9A3','#EB7D44','#CF5E4C','#3F6FB0','#F2C14E','#5E9E4A','#8E5BB0','#E98AB0','#9AA09A','#000000'];
let FLST={col:'#EB7D44',size:10};
function flagModal(){ const el=$('#ov'); el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true"><h3>Edificio di costruzione</h3><h2>Disegna la tua bandiera</h2><p class="fine">Comparirà sulla facciata dell’edificio di costruzione, come la grande bandiera sul Vehicle Assembly Building della NASA.</p>'+
  '<div class="fled"><canvas id="flc" width="300" height="180" aria-label="Tela della bandiera"></canvas><div><div class="pal">'+FLC.map(c=>'<button style="background:'+c+'" class="'+(FLST.col===c?'on':'')+'" data-act="flcol" data-k="'+c+'" aria-label="Colore '+c+'"></button>').join('')+'</div>'+
  '<div class="row" style="margin-top:10px"><button class="btn small" data-act="flsize" data-k="4">Fine</button><button class="btn small" data-act="flsize" data-k="10">Medio</button><button class="btn small" data-act="flsize" data-k="22">Grosso</button></div>'+
  '<div class="row" style="margin-top:8px"><button class="btn small" data-act="flfill">Riempi tutto</button><button class="btn small" data-act="fltpl" data-k="v">Tre bande verticali</button><button class="btn small" data-act="fltpl" data-k="h">Tre bande orizzontali</button><button class="btn small" data-act="fltpl" data-k="o">Orbita</button></div></div></div>'+
  '<div class="row" style="margin-top:14px"><button class="btn primary" data-act="flsave">Salva bandiera</button><button class="btn" data-act="flreset">Torna alle strisce</button><button class="btn" data-act="closeov">Annulla</button></div></div>'; el.hidden=false;
  const cv=$('#flc'), cx=cv.getContext('2d'); cx.fillStyle='#FFFFFF'; cx.fillRect(0,0,300,180); if(G.flag){ const im=new Image(); im.onload=()=>cx.drawImage(im,0,0,300,180); im.src=G.flag; }
  let down=false, last=null; const at=e=>{ const r=cv.getBoundingClientRect(); return [(e.clientX-r.left)*300/r.width,(e.clientY-r.top)*180/r.height]; };
  cv.addEventListener('pointerdown',e=>{ down=true; last=at(e); cv.setPointerCapture(e.pointerId); cx.fillStyle=FLST.col; cx.beginPath(); cx.arc(last[0],last[1],FLST.size/2,0,7); cx.fill(); });
  cv.addEventListener('pointermove',e=>{ if(!down) return; const p=at(e); cx.strokeStyle=FLST.col; cx.lineWidth=FLST.size; cx.lineCap='round'; cx.beginPath(); cx.moveTo(last[0],last[1]); cx.lineTo(p[0],p[1]); cx.stroke(); last=p; });
  cv.addEventListener('pointerup',()=>{ down=false; }); }
function flagTpl(k){ const cv=$('#flc'); if(!cv) return; const cx=cv.getContext('2d'), c=FLST.col;
  if(k==='v'){ ['#45A9A3','#FFFFFF','#EB7D44'].forEach((col,i)=>{ cx.fillStyle=col; cx.fillRect(i*100,0,100,180); }); }
  if(k==='h'){ ['#22313B','#FFFFFF','#45A9A3'].forEach((col,i)=>{ cx.fillStyle=col; cx.fillRect(0,i*60,300,60); }); }
  if(k==='o'){ cx.fillStyle='#22313B'; cx.fillRect(0,0,300,180); cx.fillStyle='#F2F2EE'; cx.beginPath(); cx.arc(150,90,34,0,7); cx.fill(); cx.strokeStyle='#EB7D44'; cx.lineWidth=7; cx.beginPath(); cx.ellipse(150,90,96,30,-.35,0,7); cx.stroke(); cx.fillStyle='#45A9A3'; cx.beginPath(); cx.arc(236,60,10,0,7); cx.fill(); } }
function tagShow(e,on){ const g=e.target.closest&&e.target.closest('.campus [data-tag]'); if(!g) return; const k=g.dataset.tag; $$('.campus .tag[data-tag="'+k+'"]').forEach(t=>t.classList.toggle('on',on)); }
document.addEventListener('pointerover',e=>tagShow(e,true)); document.addEventListener('pointerout',e=>tagShow(e,false));
function nextPlace(M){ if(!M) return null; if(M.phase==='0'||M.phase==='A') return M.stage==='done'?null:'admin'; if(M.phase==='B') return M.stage==='sat'?'build':'fd'; if(M.phase==='C') return 'build'; if(M.phase==='D'&&M.stage==='assembly') return M.buildEnd&&now()>=M.buildEnd?'build':null;
  if(M.phase==='D') return M.ready?(M.sat.lv==='HOME'?'pad':'admin'):'test'; if(M.phase==='E'||M.phase==='F') return 'mcc'; return null; }
function waitOf(k){ const n=G.missions.filter(M=>(k==='build'&&M.phase==='D'&&M.stage==='assembly'&&now()<M.buildEnd)||(k==='test'&&Object.keys(M.tr).some(t=>M.tr[t].res==='run'))||(k==='mcc'&&(M.phase==='E'||M.phase==='F'))||(k==='pad'&&M.phase==='D'&&M.ready&&M!==cur())).length; return n?'⏳'+n:''; }
function hint(M){ if(!M) return 'Crea la tua prima missione con il tasto + in alto a sinistra.'; const p=M.phase;
  return p==='0'||p==='A'?(p==='A'?(M.stage==='type'?'Fase A: nell’edificio amministrativo scegli il satellite, poi senti lo staff tecnico.':'Il tuo staff tecnico ha delle richieste: sala riunioni.'):M.stage==='partners'?'Entra nell’edificio amministrativo e scegli gli stakeholder.':'Al tavolo ti aspettano gli stakeholder.'):p==='A'?'Il tuo staff tecnico ha delle richieste: sala riunioni.':p==='B'?(M.stage==='sat'?'Fase B, passo 2: progetta il satellite nell’edificio di costruzione.':M.stage==='orb'?'Fase B, passo 3: orbite in dettaglio, poi la revisione PDR.':'Fase B, passo 1: nel Centro di dinamica del volo disegna la missione (DRM).'):
    p==='C'?'Fase C: progetto congelato. Ultimi ritocchi, poi la revisione CDR in cui compri i pezzi.':p==='D'&&M.stage==='assembly'?(now()>=M.buildEnd?'Assemblaggio completato: portalo al laboratorio prove.':'Assemblaggio in camera bianca. Intanto puoi lavorare a un’altra missione.'):p==='D'?(M.ready?(M.sat.lv==='HOME'?'Pronto al lancio: vai alla rampa.':'Fase E: vai all’edificio amministrativo per il lancio con l’ente terzo.'):'Porta il satellite al laboratorio prove.'):p==='E'||p==='F'?(M.pauseAt?'Il tempo è fermo: in sala controllo ti aspetta una decisione.':'In volo. Segui la telemetria dal Mission Control Center: gli eventi li decidi tu.'):'Missione completata. Guarda il bilancio nella cartella.'; }
function plotModal(i){ if(i<0||G.plots[i]){ toast('Nessun lotto libero.'); return; } const lv=L.level(G.xp), el=$('#ov');
  el.innerHTML='<div class="rv wide"><h3>Lotto libero</h3><h2>Cosa costruisci qui?</h2><p class="fine">Ogni edificio si costruisce una volta e vale per tutte le missioni. Livello attuale: '+lv+'.</p><div class="cat">'+Object.keys(L.BUILD).map(k=>{ const b=L.BUILD[k], built=hasB(k), lock=lv<b.lvl;
    return '<button class="ccard'+(lock||built?' lock':'')+'" data-act="buildb" data-k="'+k+'" data-i="'+i+'"'+(lock||built?' disabled':'')+'><svg viewBox="'+(ip(0,0,0)[0]-80)+' '+(ip(0,0,0)[1]-130)+' 160 170">'+BDRAW[k](0,0)+'</svg><b>'+b.n+'</b><span>'+b.s+'</span><small>'+(built?'già costruito':lock?'🔒 livello '+b.lvl:keur(b.c))+'</small></button>'; }).join('')+'</div><div class="row"><button class="btn" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false; }

/* ---------- HUD ---------- */
function riskMini(M){ const R=L.risks(M,G.lab.filter(Boolean)).list, col=(p,i)=>p*i>=6?'#F2B8AE':p*i>=3?'#F6DFA4':'#CDEBD6'; let s='<svg viewBox="0 0 36 36" aria-hidden="true"><rect width="36" height="36" rx="7" fill="#22313B"/>';
  for(let i=3;i>=1;i--) for(let p=1;p<=3;p++){ const x=3+(p-1)*10.5, y=3+(3-i)*10.5, n=R.filter(r=>r.p===p&&r.i===i).length; s+='<rect x="'+x+'" y="'+y+'" width="9.5" height="9.5" rx="2" fill="'+col(p,i)+'"/>'+(n?'<circle cx="'+(x+4.75)+'" cy="'+(y+4.75)+'" r="2.9" fill="#22313B"/>':''); }
  return s+'</svg>'; }
function hud(){ document.documentElement.classList.toggle('big',!!G.big); const M0=cur(), M=M0&&M0.phase==='done'&&view==='hub'?null:M0;
  const al=G.missions.some(m=>m.alert||m.pauseAt); $('#hud').innerHTML='<div class="hud-l"><button class="mcard'+(al?' alert':'')+'" data-act="switch" aria-label="Cambia missione">'+(al?'<span class="abdg" title="Problema in volo">!</span>':'')+(M?'<span><small>Missione</small><b>'+esc(M.name)+'</b></span><span class="pill">'+phn(M)+'</span>':'<span><small>Campus</small><b>'+esc(G.co||'La tua agenzia')+'</b></span>')+'</button><button class="plus" data-act="newm" aria-label="Nuova missione" title="Nuova missione">+</button>'+(M&&M.phase!=='0'&&M.phase!=='done'?'<button class="rmx" data-act="risks" title="Matrice dei rischi di '+esc(M.name)+'">'+riskMini(M)+'<span>Rischi</span></button>':'')+'</div>'+
    '<div class="hud-r"><button class="hico hmore" data-act="hmenu" aria-label="Altre opzioni" aria-expanded="'+document.body.classList.contains('hmo')+'">⋯</button><div class="hx"><button class="hico fsb" data-act="fullsc" aria-label="Schermo intero" title="Schermo intero"'+(document.fullscreenEnabled||document.webkitFullscreenEnabled?'':' hidden')+'>⛶</button><button class="hico tsz" data-act="tsize" aria-label="Dimensione del testo" title="Testo più grande" aria-pressed="'+!!G.big+'">A'+(G.big?'−':'+')+'</button><button class="hico lang" data-act="lang" title="'+(LANG==='en'?'Passa all’italiano':'Switch to English')+'" aria-label="'+(LANG==='en'?'Passa all’italiano':'Switch to English')+'">'+(LANG==='en'?'IT':'EN')+'</button><button class="hico" data-act="music" title="'+(G.music===false?'Accendi la musica':'Spegni la musica')+'" aria-label="'+(G.music===false?'Accendi la musica':'Spegni la musica')+'" aria-pressed="'+(G.music!==false)+'">'+(G.music===false?'🔇':'🔊')+'</button><button class="hico" data-act="folder" title="Cartella: missioni concluse e bacheca" aria-label="Cartella missioni e bacheca">🗂</button><button class="trophy" data-act="rank" title="Punti scienza totali: lo scopo del gioco">'+badge(leagueOf(G.sciTotal||0))+'<span>'+(G.sciTotal||0)+'<small>Lega '+LEAGUES[leagueOf(G.sciTotal||0)][1]+'</small></span></button>'+lvlChip()+'</div><div class="money'+(G.money<0?' neg':'')+'">'+keur(G.money)+'</div></div>';
  $('#dock').innerHTML=dockHTML();
  }
const dockHTML=()=>view==='hub'?'':'<button class="round" data-act="home" aria-label="Torna al campus" title="Torna al campus"><svg viewBox="0 0 48 48" fill="none" stroke="#22313B" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 23L24 9l16 14"/><path d="M13 19v19h22V19"/><path d="M21 38V28h6v10" fill="#EB7D44" stroke="#EB7D44"/></svg></button>';
function lvlChip(){ const lv=L.level(G.xp), a=L.LEVELS[lv-1], b=L.LEVELS[lv]; return '<div class="lvl" data-act="road" role="button" title="'+G.xp+' XP · tocca per la roadmap"><b>Liv '+lv+'</b><i><u style="width:'+(b?Math.round((G.xp-a)/(b-a)*100):100)+'%"></u></i></div>'; }
function gainXP(n){ if(G.tut) return; const l0=L.level(G.xp); G.xp+=n; const l1=L.level(G.xp); hud(); if(l1>l0){ G.fresh=E.DBX.filter(x=>x.lvl>l0&&x.lvl<=l1).map(x=>x.code); const un=Object.keys(L.BUILD).filter(k=>L.BUILD[k].lvl===l1).map(k=>L.BUILD[k].n).concat(L.TESTS.filter(k=>L.MACH[k].lvl===l1).map(k=>L.MACH[k].n)).concat(Object.keys(E.DEST).filter(k=>E.DEST[k].lvl===l1).map(k=>'destinazione '+E.DEST[k].n)).concat(Object.keys(E.LV).filter(k=>E.LV[k].lvl===l1&&l1>1).map(k=>E.LV[k].n.toLowerCase())).concat(Object.keys(E.RIDES).filter(k=>E.RIDES[k].lvl===l1&&l1>1).map(k=>E.RIDES[k].n)).concat([E.DBX.filter(x=>x.lvl===l1).length+' nuove tecnologie']).concat(l1>=3&&hasB('office')?['un nuovo sponsor nell’Ufficio partnership']:[]);
  const el=$('#lvup'); el.innerHTML='<b>Livello '+l1+'!</b>'+(un.length?'<span>Sbloccati: '+un.join(', ')+'</span>':''); el.hidden=false; clearTimeout(gainXP.t); gainXP.t=setTimeout(()=>{el.hidden=true;},5200); setTimeout(()=>sfx.stamp(),200); } }
function go(v){ cancelAnimationFrame(raf); if(v!==view){ BROOM=null; BVIEW='room'; MCCV=null; RSEL=null; if(!(RPLACE&&RPLACE.room===v)) RPLACE=null; } view=v; sel=null; render(); window.scrollTo(0,0); }
const stage=(inner,cls)=>'<div class="stage0"><div class="sbox'+(cls?' '+cls:'')+'">'+inner+'</div></div>';
const docks=(Lh,Rh)=>'<div class="docks">'+(Lh?'<aside class="dockL">'+Lh+'</aside>':'')+(Rh?'<aside class="dockR">'+Rh+'</aside>':'')+'</div>';
let DRW={}, LDUR=null, LBUSY=false;
const drwKey=o=>view+':'+(o&&o.key||'');
function drwOpen(key,side){ const k=key+side; return DRW[k]==null?(!!G.tut||(innerWidth>=1100&&innerHeight>500)):DRW[k]; }
function scn(v,o){ v.classList.add('scn'); if(o.L) v.classList.add('hasL'); if(o.R) v.classList.add('hasR'); v.style.setProperty('--stbg',o.bg||'#E9EDE6'); const key=drwKey(o); v.dataset.key=key;
  if(o.L&&drwOpen(key,'L')) v.classList.add('openL'); if(o.R&&drwOpen(key,'R')) v.classList.add('openR');
  const rb=x=>'<button class="rb'+(x.side&&v.classList.contains('open'+x.side)?' on':'')+'" '+(x.side?'data-act="drw" data-k="'+x.side+'"':'data-act="'+x.act+'"')+' title="'+esc(x.t)+'"><i>'+x.ic+'</i><small>'+esc(x.t)+'</small>'+(x.bd?'<span class="bd">'+x.bd+'</span>':'')+'</button>';
  if(o.railL&&o.railL.length) v.insertAdjacentHTML('beforeend','<div class="rail L">'+o.railL.map(rb).join('')+'</div>');
  if(o.railR&&o.railR.length) v.insertAdjacentHTML('beforeend','<div class="rail R">'+o.railR.map(rb).join('')+'</div>'); }
function setHeadH(){ const h=$('#view.scn>.head'); document.documentElement.style.setProperty('--headh',(h?Math.round(h.offsetHeight):0)+'px'); }
function addBack(v){ if(view==='hub') return; const h=v.querySelector(':scope>.head>div'); if(!h||h.querySelector('.hback')) return; const wall=view==='mcc'&&MCCV==='wall'; if(!wall) return;
  h.insertAdjacentHTML('afterbegin','<button class="hback" data-act="'+(wall?'mccroom':'home')+'">‹ '+(wall?'Sala controllo':'Campus')+'</button>'); }
function tutAllowed(t){ if(!G||!G.tut) return true; if(t.closest&&(t.closest('#coach')||t.closest('[data-act="music"]')||t.closest('[data-act="lang"]')||t.closest('[data-act="hmenu"]')||t.closest('[data-act="tsize"]')||t.closest('summary'))) return true; const stp=coachStep(); if(!stp||!stp.sel) return false;
  if(t.closest&&t.closest(stp.sel)) return true; const hl=document.querySelector('.coach-hl'); return !!(hl&&(hl===t||hl.contains(t))); }
['pointerdown','mousedown','touchstart','click','dblclick','wheel'].forEach(ev=>document.addEventListener(ev,e=>{ if(!G||!G.tut) return; if(ev==='wheel'){ if(!(e.target.closest&&(e.target.closest('#ptiles')||e.target.closest('.dockL')||e.target.closest('.dockR')||e.target.closest('#ov')))) e.preventDefault(); return; }
  if(tutAllowed(e.target)) return; e.preventDefault(); e.stopPropagation(); if(e.stopImmediatePropagation) e.stopImmediatePropagation(); if(ev==='click'){ const b=$('#coach'); if(b){ b.classList.remove('nudge'); void b.offsetWidth; b.classList.add('nudge'); } } },{capture:true,passive:false}));
function setHudH(){ const h=$('#hud'); if(h){ const b=h.getBoundingClientRect().bottom; if(b>0) document.documentElement.style.setProperty('--hudh',Math.round(b)+'px'); } }
function placeBub(){ const b=$('#mbub'), svg=$('#meetsvg'); if(!b||!svg) return; const m=svg.getScreenCTM(); if(!m) return; const pt=svg.createSVGPoint(); pt.x=+b.dataset.x; pt.y=+b.dataset.y; const q=pt.matrixTransform(m), sb=svg.getBoundingClientRect(), w=b.offsetWidth||260;
  b.style.left=Math.max(sb.left+w/2+8,Math.min(sb.right-w/2-8,q.x))+'px'; b.style.top=Math.max(($('#hud').getBoundingClientRect().bottom||60)+b.offsetHeight+8,q.y)+'px'; }
addEventListener('resize',()=>{ setHudH(); placeBub(); });
function render(){ cancelAnimationFrame(raf); if(CAMRAF){ cancelAnimationFrame(CAMRAF); CAMRAF=0; } const lvN=L.level(G.xp); G.missions.forEach(m=>{ m.lvlNow=lvN; m.padOwned=!!G.pad; }); hud(); const v=$('#view'); syncAgencies(); syncSite(); const v0=$('#view'); v0.className=''; v0.removeAttribute('style'); document.body.classList.add('fs'); if(cur()&&cur().phase==='done'&&view==='hub'&&$('#ov').hidden){ const ia=G.missions.findIndex(m=>m.phase!=='done'); if(ia>=0) G.cur=ia; } setHudH(); ({launch:vLaunchView,hub:vHub,admin:vAdmin,build:vBuild,test:vTest,mcc:vMcc,pad:vPad,fac:vFac,fd:vFD})[view](v); if(!v.classList.contains('scn')) v.classList.add('page'); addBack(v); setHudH(); setHeadH(); placeBub(); $('#dock').innerHTML=dockHTML(); if(G.tut) setTimeout(coach,0); save(); }
function addMoney(x,why){ G.money+=x; if(x>0) sfx.cash(); hud(); if(x){ const m=$('#hud .money'); if(m){ const r=m.getBoundingClientRect(), f=document.createElement('div'); f.className='mfloat '+(x>0?'p':'m'); f.textContent=(x>0?'+':'−')+keur(Math.abs(x)); f.style.right=(innerWidth-r.right+4)+'px'; f.style.top=(r.bottom+4+18*document.querySelectorAll('.mfloat').length)+'px'; document.body.appendChild(f); setTimeout(()=>f.remove(),1300); m.classList.remove('pulse'); void m.offsetWidth; m.classList.add('pulse'); } } if(why) toast(why); }

/* ---------- edificio amministrativo ---------- */
function vAdmin(v){ let M=cur(); const rdy=G.missions.find(m=>m.phase==='D'&&m.ready&&m.sat.lv!=='HOME'); if(M&&M.phase==='D'&&M.ready&&M.sat.lv!=='HOME') return vLaunch(v,M,false); if(rdy&&(!M||!((M.phase==='0'||M.phase==='A')&&M.stage!=='done'))){ G.cur=G.missions.indexOf(rdy); return vLaunch(v,rdy,false); } if(!M){ v.innerHTML='<div class="empty">Nessuna missione. Creane una dal pulsante in alto a sinistra.</div>'; return; }
  if(M.phase==='0'&&M.stage==='partners') return vPartners(v,M);
  if((M.phase==='0'||M.phase==='A')&&M.stage==='meeting') return vMeeting(v,M);
  if(M.phase==='A'&&M.stage==='type') return vSatType(v,M);
  vMeeting(v,M,true); }
// Fase A: che satellite costruisci. Per ora solo CubeSat; le altre classi arriveranno.
const RIDEC={};
function rideFeas(M,k){ const acc=M.reqs.filter(x=>M.waived.indexOf(x.id)<0).map(x=>x.id), key=M.id+'|'+k+'|'+acc.join(','); if(key in RIDEC) return RIDEC[key];
  const Mx=Object.assign({},M,{rideFixed:true,sat:Object.assign({},M.sat,{ride:k})}); let ok=!!(M.wit&&M.wit.ride===k&&L.satOK(Mx,M.wit,acc)); if(!ok) try{ ok=!!(L.anySat(Mx,acc,400,0x77)||L.anySat(Mx,acc,800,0x78)); }catch(e){ ok=true; } return RIDEC[key]=ok; }
function vSatType(v,M){ const lvN=L.level(G.xp), dest=M.sat.dest||'leo', why=k=>{ const R=E.RIDES[k]; if(lvN<R.lvl) return '🔒 livello '+R.lvl; if(!Object.keys(E.LV).some(l=>E.LV[l].fits.indexOf(k)>=0&&E.LV[l].dest.indexOf(dest)>=0&&!!E.LV[l].surf===L.landing(M))) return 'nessun lancio per '+E.DEST[dest].n+' accetta questa taglia'; if(!M.tut&&!rideFeas(M,k)) return '⚠ con i requisiti accettati non basta'; return ''; };
  v.innerHTML='<div class="stage0 dim"><svg class="full" viewBox="64 40 1152 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+IR.meet({seats:[],co:G.co,left:['REQUISITI'],right:[String(M.name).toUpperCase()]})+'</svg></div>'+'<div class="head"><div><h3>Edificio amministrativo · Fase A</h3><h1>Che satellite costruisci?</h1></div><p>Missione: <b>'+esc(O.TYPES[M.type||'sci'].n)+'</b> · '+esc(zoneName(M))+'. La classe e la taglia decidono quanto spazio, quanta massa e quanta energia avrai, e quanto costerà il lancio. Poi lo staff tecnico ti dirà i suoi requisiti di sistema.</p></div>'+
    '<h3 style="margin:4px 0 8px">CubeSat</h3><div class="sts">'+Object.keys(E.RIDES).map(k=>{ const R=E.RIDES[k], w=why(k); return '<button class="stc'+(M.sat.ride===k&&M.rideFixed?' sel':'')+(w?' lock':'')+'" data-act="pickType" data-k="'+k+'"'+(w?' disabled':'')+'>'+structIcon(k)+'<b>'+R.n+'</b><span class="fine">'+R.s+'</span><ul class="kv"><li><span>Struttura</span><b>'+keur(R.c)+'</b></li><li><span>Massa massima</span><b>'+R.massLim+' kg</b></li><li><span>Griglia</span><b>'+R.cols+' × '+R.rows+' caselle</b></li></ul>'+(w?'<small class="lk">'+w+'</small>':'')+'</button>'; }).join('')+'</div>'+
    '<h3 style="margin:18px 0 8px">Altre classi</h3><div class="sts"><div class="stc lock"><b>Microsatellite</b><span class="fine">Classe ESPA, fino a circa 180 kg</span><small class="lk">🔒 in arrivo</small></div></div>'; }
function vPartners(v,M){ const lv=L.level(G.xp), ini=(t,c)=>'<span class="ini" style="background:'+c+'">'+esc(String(t).replace(/[^A-Za-zÀ-ú ]/g,'').split(' ').map(w=>w[0]||'').join('').slice(0,3).toUpperCase())+'</span>';
  const lockedAg=AGENCIES.filter(a=>a[4]>lv), lockedSp=L.SPONSORS.filter(x=>!E.stk(x.id));
  v.innerHTML='<div class="stage0 dim"><svg class="full" viewBox="64 40 1152 680" preserveAspectRatio="xMidYMid slice" aria-hidden="true">'+IR.meet({seats:[],co:G.co,left:['REQUISITI'],right:[String(M.name).toUpperCase()]})+'</svg></div>'+'<div class="head"><div><h3>Edificio amministrativo · Fase 0</h3><h1>Chi siede al tavolo?</h1></div><p>'+esc(O.TYPES[M.type||'sci'].n)+' · '+esc(zoneName(M))+'. Scegli gli stakeholder: la NASA c’è sempre. Tocca ⓘ per i dettagli.</p></div>'+
    '<div class="pgrid" id="stks">'+E.STAKE.map(k=>'<button class="pt pstk" data-act="stk" data-id="'+k.id+'">'+emb(k.id)+'<span><b>'+esc(k.n.split(' · ')[0])+'</b><small>'+esc(k.k)+'</small><span class="fund">+'+keur(L.fund(k.id,M))+'</span></span><span class="pinfo" data-act="pinfo" data-id="'+k.id+'" title="Dettagli">i</span></button>').join('')+'</div>'+
    '<div class="row" style="margin-top:12px;justify-content:flex-end"><button class="btn primary" id="p0go" data-act="sit">Convoca la riunione</button></div>'+
    (lockedAg.length?'<div class="pgh">🔒 Agenzie partner della NASA Space Apps Challenge</div><div class="pgrid">'+lockedAg.map(a=>'<div class="pt lock">'+ini(a[1],a[6])+'<span><b>'+esc(a[1])+'</b><small>'+esc(a[3])+'</small><small>livello '+a[4]+'</small></span></div>').join('')+'</div>':'')+
    (lockedSp.length?'<div class="pgh">🔒 Sponsor da reclutare nell’Ufficio partnership</div><div class="pgrid">'+lockedSp.map(x=>'<div class="pt lock">'+ini(x.n,x.p[2])+'<span><b>'+esc(x.n)+'</b><small>'+esc(x.k)+' · '+esc(x.sec)+'</small></span></div>').join('')+'</div>':'');
  $$('#stks .pstk').forEach(b=>{ const on=M.stake.indexOf(b.dataset.id)>=0; b.classList.toggle('sel',on); b.classList.toggle('dim',!on&&(M.stake.length>=maxStake()||!!L.fits4(b.dataset.id,M))); }); $('#p0go').disabled=M.stake.indexOf('nasa')<0; }
// posti a sedere attorno al tavolo (coordinate della scena 1000×560)
const SEATS=[[300,300,.72],[232,378,.86],[156,468,1],[700,300,.72],[768,378,.86],[844,468,1]];
const meetVB=()=>{ const A=innerWidth/Math.max(1,innerHeight); if(A<=1152/680) return '64 40 1152 680'; const w=680*A; return (640-w/2)+' 40 '+w+' 680'; };
let RZT=0; addEventListener('resize',()=>{ clearTimeout(RZT); RZT=setTimeout(()=>{ if(G&&(view==='launch'||view==='pad'||(view==='admin'&&$('#meetsvg')))&&$('#ov').hidden&&!LBUSY) render(); },250); });
function vMeeting(v,M,idle){
  const castIds=M.table||L.cast(M,M.meetPh||M.phase); const r=M.queue.length?L.R(M.queue[0]):null, speaker=r?r.who:null;
  const seats=castIds.slice(0,7).map(id=>({name:PEO[id].n,col:PEO[id].col,look:IR.lookOf(id,PEO[id].col,PEO[id].n),joy:M.joy[id]==null?60:M.joy[id],speak:id===speaker,gone:M.left.indexOf(id)>=0}));
  const left=['REQUISITI'].concat(M.reqs.slice(-7).map(x=>({t:x.code+' '+L.R(x.id).t,ok:1}))); if(left.length===1) left.push('nessuno ancora');
  const right=[String(M.name).toUpperCase(),phn(M),'Requisiti '+M.reqs.length,'Budget '+keur(L.budgetOf?L.budgetOf(M):G.money)];
  let bubble=''; if(r){ const i=castIds.indexOf(r.who), p=IR.MSEAT[Math.max(0,Math.min(6,i))]; bubble='<div class="bubble mbub" id="mbub" data-x="'+p[0]+'" data-y="'+(p[1]-128*p[2]-30)+'">'+esc(r.say)+'</div>'; }
  const who=r?PEO[r.who]:null;
  const askBar=(!r&&idle&&G.tut)?'':r?'<div class="panel"><div class="ask"><div class="who"><span class="dot" style="background:'+who.col+'"></span><div><b>'+esc(who.n)+'</b><div class="fine">'+esc(who.role)+' · '+esc(who.org)+'</div></div></div>'+
      '<div><q>'+esc(r.say)+'</q><div class="price" id="price">'+priceHTML(M,r)+'</div><details class="mx"'+(innerWidth>=1100&&innerHeight>600?' open':'')+'><summary>Dettagli</summary><div class="to">Se accetti diventa un requisito '+(r.ph==='0'?'di missione':'di sistema')+': «'+esc(r.t)+'»'+(r.core?' · è la sua richiesta principale':'')+'</div>'+refuseHTML(M,r)+'</details></div>'+
      '<div class="row ansb"><button class="btn ok" data-act="yes">Accetta</button>'+(r.rule?'':softBtn(M,r)+'<button class="btn no" data-act="no">Rifiuta</button>')+'</div></div></div>'
    :'<div class="panel"><div><b>'+(idle?'Nessuna riunione in corso.':'Tutte le richieste sono sul tavolo.')+'</b><div class="fine">'+(idle?hint(M):'Chiudi la riunione per andare in revisione.')+'</div></div>'+(idle?'':'<button class="btn primary" data-act="endmeet">Chiudi la riunione</button>')+'</div>';
  v.innerHTML='<div class="head"><div><h3>Edificio amministrativo · '+phn(M)+'</h3><h1>Sala riunioni</h1></div><p>'+(M.meetPh==='A'?'Il tuo staff tecnico. Quello che accetti diventa un requisito di sistema.':'Gli stakeholder. Quello che accetti diventa un requisito di missione. Tocca lo schermo dei requisiti per rileggerli.')+'</p></div>'+
    stage('<svg id="meetsvg" class="full" viewBox="'+meetVB()+'" preserveAspectRatio="xMidYMid '+(innerWidth/Math.max(1,innerHeight)>1152/680?'meet':'slice')+'" role="img" aria-label="Sala riunioni vista da capotavola">'+IR.meet({seats,co:G.co,left,right})+'</svg>')+bubble+
    '<div class="acts">'+askBar+'</div>'+(M.reqs.length?'<div class="mtot" id="mtot"><span>Impegni presi</span><b>'+M.reqs.length+' req.</b><b>+'+keur((M.commit||{}).dc||0)+'</b><b>+'+nf((M.commit||{}).dm||0)+' kg</b></div>':''); scn(v,{bg:'#ECEBE4'}); }

// Il prezzo di dire sì, calcolato prima di rispondere
const PRC={};
const prKey=(M,r)=>r.id+'#'+M.reqs.map(x=>x.id).join(',')+'#'+M.stake.join(',');
function priceHTML(M,r){ const p=PRC[prKey(M,r)]; if(!p){ setTimeout(()=>pricePaint(M,r),40); return '<span class="pl">Se accetti</span><div class="pchips"><span class="pchip n">calcolo…</span></div>'; }
  const code=id=>{ const x=M.reqs.find(q=>q.id===id); return x?x.code:''; }, ch=(c,t,sm)=>'<span class="pchip '+c+'">'+t+(sm?'<small>'+sm+'</small>':'')+'</span>';
  let h='<span class="pl">Se accetti</span><div class="pchips">';
  if(p.kind==='tests'){ const miss=p.tests.filter(t=>G.lab.indexOf(t)<0), lv=L.level(G.xp), lock=miss.filter(t=>L.MACH[t].lvl>lv);
    h+=ch('r','+'+keur(p.tests.length*L.RUN),p.tests.length+' prov'+(p.tests.length>1?'e':'a'))+miss.map(t=>L.MACH[t].lvl>lv?ch('r','🔒 '+esc(L.MACH[t].short||L.MACH[t].n),'livello '+L.MACH[t].lvl):ch('o','+'+keur(L.MACH[t].c),esc(L.MACH[t].n))).join('')+'</div>'+(lock.length?'<span class="bad">Al tuo livello non puoi farla: al collaudo servirà una deroga.</span>':''); return h; }
  if(p.noBase) return h+ch('r','⚠ impossibile','già ora nessun satellite rispetta tutto')+'</div>';
  if(!p.ok) return h+ch('r','⚠ conflitto',p.conflicts.length?'con '+p.conflicts.map(code).join(', '):'nessun satellite possibile')+'</div><span class="fine">Se accetti, una delle due finirà in deroga.</span>';
  if(p.free) return h+ch('g','+0 cr')+ch('g','+0 kg')+'</div><span class="fine">Il satellite più economico la rispetta già.</span>';
  return h+ch(p.dc>0?'r':'g','+'+keur(p.dc))+ch(p.dm>0?'r':'g','+'+nf(p.dm)+' kg')+p.forced.map(f=>ch('o','cambia: '+esc(f))).join('')+'</div>'; }
function refuseHTML(M,r){ const who=PEO[r.who]; if(r.rule) return '<div class="nocon"><span>🔒 È una regola: non si può rifiutare.</span></div>';
  const j=M.joy[r.who]==null?60:M.joy[r.who], aft=Math.max(0,j-(r.core?L.JOY.noCore:L.JOY.no)), st=E.stk(r.who);
  return '<div class="nocon"><span>Se rifiuti, <b>'+esc(who.n)+'</b></span><div class="jbar" title="Soddisfazione"><i style="width:'+aft+'%"></i><u style="left:'+aft+'%;width:'+(j-aft)+'%"></u></div><span class="num">'+j+'% → <b class="'+(aft<=0?'bad':aft<35?'bad':'')+'">'+aft+'%</b></span>'+(aft<=0?'<span class="bad" style="grid-column:1/-1"><b>Lascia il tavolo</b>'+(st?' e porta via '+keur(st.fund)+' di fondi.':'.')+'</span>':r.core?'<span class="fine" style="grid-column:1/-1">È la sua richiesta principale: un no pesa di più.</span>':'')+'</div>'; }
function pricePaint(M,r){ const k=prKey(M,r); if(!PRC[k]) PRC[k]=L.priceOf(M,r.id); const el=$('#price'); if(el&&cur()===M&&M.queue[0]===r.id) el.innerHTML=priceHTML(M,r); }
function softBtn(M,r){ const sf=L.softOf(r.id,M), j=M.joy[r.who]==null?60:M.joy[r.who];
  if(!sf) return '<button class="btn" disabled title="Su questa richiesta non si tratta">Controproposta</button>';
  if(j<40) return '<button class="btn" disabled title="'+esc(PEO[r.who].n)+' è troppo scontento per trattare">Controproposta</button>';
  return '<button class="btn" data-act="soft" title="Proponi: «'+esc(sf.t)+'». Accetta, ma perde '+L.JOY.soft+' punti di soddisfazione invece di guadagnarne '+L.JOY.yes+'. Un no secco ne costa '+L.JOY.no+', una deroga più avanti '+L.JOY.waive+'.">Controproposta: «'+esc(sf.t)+'»</button>'; }

/* ---------- edificio di costruzione ---------- */
/* ---------- edificio di costruzione: lanciatore → struttura → integrazione 3D ---------- */

const zoneName=M=>{ const z=O.zoneOf(M); return E.DEST[M.sat.dest||'leo'].n+(z?' · '+z.n:''); };
function satThumb(M){ return M.snap?'<img class="thumb" src="'+M.snap+'" alt="Il satellite '+esc(M.name)+'">':satSVG(M.sat,{}); }
function vBuild(v){ const M=cur();
  if(M&&(M.phase==='C'||(M.phase==='B'&&M.drm&&M.drm.done))&&BVIEW==='yard'){ if(M.phase==='B') M.stage='sat'; if(S3.ok) vYard3(v,M); else { vYard(v,M); const h=v.querySelector('.head>div'); if(h&&!M.tut) h.insertAdjacentHTML('beforeend','<button class="btn small" data-act="toroom" style="margin-top:6px">← Officina</button>'); } return; }
  const asm=G.missions.filter(m=>m.phase==='D'&&m.stage==='assembly'), which=BROOM||(M&&M.phase==='D'&&M.stage==='assembly'?'clean':'build');
  if(which==='clean'){ if(M&&M.phase==='D'&&M.stage==='assembly') return vCleanroom(v,M); return vCleanroom(v,asm[0]||null); }
  const SZ={S3:1,S6:1.25,S12:1.5}, cols=['#45A9A3','#EB7D44','#3F6FB0','#8E5BB0'];
  const benches=G.missions.filter(m=>m.phase==='C'||(m.phase==='B'&&m.drm&&m.drm.done)).slice(0,4).map((m,i)=>({id:m.id,label:m.name+' · '+E.RIDES[m.sat.ride].n.replace('CubeSat ',''),size:SZ[m.sat.ride]||1,n:Math.min(5,Object.keys(m.sat.placed).length),col:cols[i%4]}));
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione</h3><h1>Officina</h1><div class="rtabs"><button class="btn small on" data-act="broom" data-k="build">Officina</button><button class="btn small" data-act="broom" data-k="clean">Camera bianca</button></div></div><p>'+(benches.length?'Tocca il banco di un satellite per progettarlo: puoi lavorare a più satelliti insieme.':'Nessun satellite da progettare: le missioni arrivano qui in fase B, dopo la DRM.')+'</p></div>'+stage(roomBox('build',{benches}),'rbx'); scn(v,{}); return;
  if(M&&M.phase==='D'&&M.stage==='assembly') return vCleanroom(v,M);
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione</h3><h1>'+esc(M.name)+'</h1></div><p>'+hint(M)+'</p></div><section class="panel" style="align-items:center">'+(Object.keys(M.sat.placed).length>2?'<div style="width:min(420px,100%)">'+satThumb(M)+'</div>':'<p class="fine">Qui si costruisce il satellite in fase C e lo si assembla in fase D.</p>')+'</section>'; }
function benchPanel(M){ const C=G.missions.filter(m=>m.phase==='C'), soon=G.missions.filter(m=>m.phase==='0'||m.phase==='A'||m.phase==='B');
  return '<div class="panel"><h3 style="margin:0">Banchi di lavoro</h3><div class="mlist">'+(C.length?C.map(m=>'<button class="mli'+(m===M?' on':'')+'" data-act="openyard" data-id="'+m.id+'"><span><b>'+esc(m.name)+'</b><div class="fine">'+esc(E.RIDES[m.sat.ride].n)+' · '+Object.keys(m.sat.placed).length+' pezzi montati</div></span><span class="btn small primary">Progetta →</span></button>').join(''):'<p class="fine">Nessun satellite da costruire. Una missione arriva qui in fase C, dopo la revisione PDR.</p>')+'</div>'+
    (soon.length?'<h3 style="margin:6px 0 0">In arrivo</h3><div class="mlist">'+soon.map(m=>'<div class="mli" style="cursor:default"><span><b>'+esc(m.name)+'</b><div class="fine">'+phn(m)+' · '+statusLine(m)+'</div></span></div>').join('')+'</div>':'')+'</div>'; }
function cleanPanel(){ const A=G.missions.filter(m=>m.phase==='D'&&m.stage==='assembly');
  return '<div class="panel" id="cleanp"><h3 style="margin:0">In assemblaggio</h3><div class="mlist">'+(A.length?A.map(m=>{ const done=now()>=m.buildEnd, p=Math.min(1,1-(m.buildEnd-now())/(m.buildDur||L.TIME.build));
    return '<div class="mli'+(m===cur()?' on':'')+'" data-act="pick" data-id="'+m.id+'"><span><b>'+esc(m.name)+'</b><div class="fine" id="cl-t-'+m.id+'">'+(done?'integrazione completata':'integrazione '+pct(Math.max(0,p))+' · '+Math.ceil((m.buildEnd-now())/1000/G.speed)+' s')+'</div></span><span id="cl-a-'+m.id+'" data-s="'+(done?'d':'w')+'">'+(done?'<button class="btn small primary" data-act="cdrm" data-id="'+m.id+'">Al laboratorio →</button>':'')+'</span><div class="prog"><i id="cl-b-'+m.id+'" style="width:'+Math.max(0,p)*100+'%"></i></div></div>'; }).join(''):'<p class="fine">Nessun satellite in assemblaggio. Ci arrivano dopo la CDR, in fase D. Più satelliti possono essere assemblati insieme.</p>')+'</div></div>'; }
function lvLock(k,M){ const o=E.LV[k], lv=L.level(G.xp); if(lv<o.lvl) return '🔒 livello '+o.lvl; if(o.pad&&!G.pad) return '🔒 costruisci la tua rampa di lancio'; return ''; }
const lvShown=(k,M)=>{ const o=E.LV[k]; return o.dest.indexOf(M.sat.dest||'leo')>=0&&!!o.surf===L.landing(M); };
function lvCostTxt(o){ if(o.surf) return '1.200 cr per kg'; return typeof o.c==='number'?keur(o.c):'da '+keur(Math.min.apply(null,Object.keys(o.c).map(k=>o.c[k]))); }
function vLaunchers(v,M){ const D=E.DEST[M.sat.dest||'leo'];
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione · Fase B · 1 di 3</h3><h1>Come vai nello spazio</h1></div><p>All’inizio paghi un ente terzo che porta il tuo CubeSat in orbita insieme ad altri. La tua rampa di lancio si costruisce dal livello 3 e costa meno a ogni lancio.</p></div>'+
    '<div class="lvs">'+Object.keys(E.LV).filter(k=>lvShown(k,M)).map(k=>{ const o=E.LV[k], lock=lvLock(k,M), need=E.dvNeed({lv:k,dest:M.sat.dest});
      return '<button class="lvc'+(lock?' lock':'')+(M.sat.lv===k?' sel':'')+'" data-act="pickLV" data-k="'+k+'"'+(lock?' disabled':'')+'><svg viewBox="0 0 120 230" aria-hidden="true"><rect x="0" y="214" width="120" height="16" fill="#DDE3EA"/>'+rocketSVG(60,212,o.h*1.05)+'</svg>'+
        '<div><b>'+o.n+'</b><span class="fine">'+o.k+'</span><ul class="kv"><li><span>Chi lancia</span><b>'+esc(o.who)+'</b></li><li><span>Strutture</span><b>'+o.fits.map(f=>E.RIDES[f].n.replace('CubeSat ','')).join(' · ')+'</b></li><li><span>Prezzo</span><b>'+lvCostTxt(o)+'</b></li></ul>'+(lock?'<small class="lk">'+lock+'</small>':'')+'</div></button>'; }).join('')+'</div>'; }
function structIcon(k){ const R=E.RIDES[k], u=20, w=R.cols*u, h=R.rows*u, d=R.depth*u*0.9;
  if(R.cyl){ const rx=w/2; return '<svg viewBox="-80 -125 160 165" aria-hidden="true"><ellipse cx="0" cy="'+(-h)+'" rx="'+rx+'" ry="'+(rx*.35)+'" fill="#E8EDF3" stroke="#55657A"/><path d="M'+(-rx)+' '+(-h)+'V0A'+rx+' '+(rx*.35)+' 0 0 0 '+rx+' 0V'+(-h)+'" fill="#1D3F8F" stroke="#55657A"/>'+[1,2,3,4].map(i=>'<path d="M'+(-rx)+' '+(-h*i/5)+'A'+rx+' '+(rx*.35)+' 0 0 0 '+rx+' '+(-h*i/5)+'" fill="none" stroke="#7FA6E8"/>').join('')+'</svg>'; }
  const dx=d*.7, dy=d*.4; return '<svg viewBox="-80 -125 160 165" aria-hidden="true"><g transform="translate('+(-(w+dx)/2)+' 20)"><polygon points="0,0 '+w+',0 '+w+','+(-h)+' 0,'+(-h)+'" fill="#D3DCE6" stroke="#55657A"/><polygon points="'+w+',0 '+(w+dx)+','+(-dy)+' '+(w+dx)+','+(-h-dy)+' '+w+','+(-h)+'" fill="#B7C4D2" stroke="#55657A"/><polygon points="0,'+(-h)+' '+w+','+(-h)+' '+(w+dx)+','+(-h-dy)+' '+dx+','+(-h-dy)+'" fill="#EEF2F6" stroke="#55657A"/>'+
    [...Array(R.cols-1)].map((_,i)=>'<path d="M'+((i+1)*u)+' 0V'+(-h)+'" stroke="#9AA9BA"/>').join('')+[...Array(R.rows-1)].map((_,i)=>'<path d="M0 '+(-(i+1)*u)+'H'+w+'" stroke="#9AA9BA"/>').join('')+'</g></svg>'; }
function vStructs(v,M){ const o=E.LV[M.sat.lv], lvN=L.level(G.xp);
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione · Fase B · 2 di 3</h3><h1>Scegli la struttura</h1></div><p>Le taglie standard dei CubeSat. Una U è un cubo da 10 cm; nella griglia ogni casella è mezza U di lato. Più grande vuol dire più spazio e più massa permessa, ma anche un lancio più caro.</p></div>'+
    '<div class="row" style="margin-bottom:12px"><button class="btn small" data-act="relv">← Cambia lanciatore</button><span class="chip on">'+esc(o.n)+'</span></div>'+
    '<div class="sts">'+o.fits.map(k=>{ const R=E.RIDES[k], lc=typeof o.c==='number'?o.c:o.c[k], lock=lvN<R.lvl; return '<button class="stc'+(M.sat.ride===k&&M.stage!=='struct'?' sel':'')+(lock?' lock':'')+'" data-act="pickST" data-k="'+k+'"'+(lock?' disabled':'')+'>'+structIcon(k)+'<b>'+R.n+'</b><span class="fine">'+R.s+'</span><ul class="kv"><li><span>Struttura</span><b>'+keur(R.c)+'</b></li><li><span>Lancio</span><b>'+(o.surf?'1.200 cr per kg':keur(lc))+'</b></li><li><span>Massa massima</span><b>'+R.massLim+' kg</b></li></ul>'+(lock?'<small class="lk">🔒 livello '+R.lvl+'</small>':'')+'</button>'; }).join('')+'</div>'; }
const ORIG=o=>{ const t=o.db||{}; return [t.om,t.op,t.oc].indexOf('●')>=0?'●':[t.om,t.op,t.oc].indexOf('◐')>=0?'◐':'○'; };
let shelfTab='all', shelfQ='', shelfSort='c';
const STABS=[['all','Tutti i pezzi'],['ray','Payload'],['avi','Computer'],['bat','Batteria'],['com','Radio'],['adcs','Assetto'],['nav','Navigazione'],['prop','Propulsione'],['pwr','Potenza extra'],['rob','Mobilità'],['eol','Rientro'],['sol','Pannelli solari'],['acc','Accessori']];
const CCOL={sol:'var(--c-cell)',acc:'var(--c-gas)'};
function shelfItems(M){ const d=M.sat, any=Object.assign({},M,{lvlNow:99}), lv=M.lvlNow||M.lvl||1, fr=G.fresh||[], out=[];
  const add=(kind,id,o,cat)=>{ let lock=''; if(!L.techOK(M,id,d.ride)){ if(!L.techOK(any,id,null)) return; const ln=L.effLvl(M,o); if(ln!==lv+1) return; lock='Liv. '+ln; }
    out.push({kind,id,o,cat,lock,fresh:!lock&&fr.indexOf(id)>=0}); };
  Object.keys(P).forEach(id=>add('part',id,P[id],P[id].cat));
  Object.keys(E.SOLAR).forEach(k=>{ if(E.solOK({ride:d.ride},k)) add('sol',k,E.SOLAR[k],'sol'); });
  Object.keys(ACC).forEach(k=>add('acc',k,ACC[k],'acc'));
  return out; }
function itemTile(it,d){ const o=it.o, t=o.db||{}, col=CCOL[it.cat]||'var(--c-'+it.cat+')', gk=it.cat==='acc'?(o.kind==='Termico'?'heat':'acc'):it.cat;
  const gl='<i class="gly" style="background:'+col+';color:#fff">'+(gk==='heat'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">'+I.heat+'</svg>':glyph(gk))+'</i>';
  const tip=esc(t.scopo||'')+' · TRL '+o.trl+' · '+esc(t.ente||'');
  if(it.lock) return '<button class="tile lock" data-act="lockinfo" data-k="'+it.id+'" title="'+esc(it.lock)+' · '+tip+'">'+gl+'<span>'+esc(o.n)+'</span><small>🔒 '+esc(it.lock)+'</small></button>';
  const sub=it.kind==='sol'?nf(o.gen)+' W · '+keur(o.c):keur(o.c)+(o.U?' · '+nf(o.U)+' U':'');
  const attr=it.kind==='part'?'data-id="'+it.id+'"':'data-act="'+it.kind+'" data-k="'+it.id+'"';
  return '<button class="tile'+(it.fresh?' fresh':'')+'" '+attr+' title="'+tip+'">'+gl+'<span>'+esc(o.n)+'</span><small>'+sub+'</small><small>TRL '+o.trl+' <i class="og">'+ORIG(o)+'</i></small>'+(it.fresh?'<em class="nw">NUOVO</em>':'')+'</button>'; }
function shelfFrame(){ return '<aside class="panel shelf"><h2>Magazzino pezzi</h2><div class="sbody"><nav class="stabs" id="stabs" aria-label="Categorie"></nav><div class="smain"><input id="pq" type="search" placeholder="Cerca un pezzo…" aria-label="Cerca un pezzo"><div class="ssort" id="ssort"></div><div class="stit" id="stit"></div><div class="tiles" id="ptiles"></div></div></div>'+
  '<p class="fine">Le carte grigie si sbloccano salendo di livello. Origine dei numeri: ● dato pubblicato · ◐ derivato · ○ stima. Le carte NASA vengono da TechPort.</p></aside>'; }
function renderShelf(only){ const M=cur(); if(!M||!$('#ptiles')) return; const d=M.sat, all=shelfItems(M), q=shelfQ.trim().toLowerCase();
  if(!only){ $('#stabs').innerHTML=STABS.filter(t=>t[0]==='all'||all.some(x=>x.cat===t[0])).map(t=>'<button class="stab'+(shelfTab===t[0]?' on':'')+'" data-act="stab" data-k="'+t[0]+'" title="'+t[1]+'" aria-label="'+t[1]+'">'+glyph(t[0])+(all.some(x=>x.fresh&&(t[0]==='all'||x.cat===t[0]))?'<i class="dot"></i>':'')+'</button>').join('');
    $('#ssort').innerHTML=[['n','Nome'],['m','Massa'],['c','Costo'],['u','Dim.']].map(x=>'<button class="'+(shelfSort===x[0]?'on':'')+'" data-act="ssort" data-k="'+x[0]+'">'+x[1]+(shelfSort===x[0]?' ▲':'')+'</button>').join(''); }
  const mass=o=>(o.m||0)+(o.propM||0), key={n:(a,b)=>a.o.n.localeCompare(b.o.n,'it'),m:(a,b)=>mass(a.o)-mass(b.o),c:(a,b)=>a.o.c-b.o.c,u:(a,b)=>(a.o.U||0)-(b.o.U||0)}[shelfSort];
  const its=all.filter(x=>(shelfTab==='all'||x.cat===shelfTab)&&(!q||(x.o.n+' '+((x.o.db||{}).ente||'')+' '+((x.o.db||{}).scopo||'')).toLowerCase().indexOf(q)>=0)).sort((a,b)=>(!!a.lock-!!b.lock)||(b.fresh-a.fresh)||key(a,b)||a.o.n.localeCompare(b.o.n));
  const nOk=its.filter(x=>!x.lock).length, tn=(STABS.find(t=>t[0]===shelfTab)||STABS[0])[1], must=E.CATS[shelfTab]&&E.CATS[shelfTab].must;
  $('#stit').innerHTML='<b>'+tn+(E.CATS[shelfTab]&&!must?' <span class="fine">· facoltativo</span>':'')+'</b><span>'+nOk+' disponibili'+(its.length>nOk?' · '+(its.length-nOk)+' bloccati':'')+'</span>';
  $('#ptiles').innerHTML=its.map(x=>itemTile(x,d)).join('')||'<p class="sempty">Nessun pezzo trovato.</p>';
  shelfMarks(); }
function shelfMarks(){ const d=cur().sat; $$('#ptiles .tile').forEach(t=>{ const id=t.dataset.id, a=t.dataset.act, k=t.dataset.k; let on=false; if(id&&P[id]){ const pl=d.placed[P[id].cat]; on=!!pl&&pl.id===id; } else if(a==='sol') on=d.sol===k; else if(a==='acc') on=!!(d.acc&&d.acc[k]); t.classList.toggle('on',on); }); }
function unfresh(id){ if(G.fresh){ const i=G.fresh.indexOf(id); if(i>=0){ G.fresh.splice(i,1); const t=$('#ptiles .tile.fresh[data-id="'+id+'"],#ptiles .tile.fresh[data-k="'+id+'"]'); if(t){ t.classList.remove('fresh'); const n=t.querySelector('.nw'); if(n) n.remove(); } } } }
document.addEventListener('input',e=>{ if(e.target.id==='pq'){ shelfQ=e.target.value; renderShelf(true); } });
function tileHTML(id,o,d){ return '<button class="tile" data-id="'+id+'" title="'+esc(o.db.scopo)+' · TRL '+o.trl+' · '+esc(o.db.ente)+'">'+miniShape(id,d.ride)+'<span>'+esc(o.n)+'</span><small>'+keur(o.c)+' · TRL '+o.trl+' <i class="og">'+ORIG(o)+'</i></small></button>'; }
function vYard3(v,M){ const cats=['ray','avi','bat','com','adcs','nav','prop','pwr','rob','eol'], d=M.sat, vis=id=>L.techOK(M,id,d.ride), o=E.LV[d.lv], R=E.RIDES[d.ride]; d.acc=d.acc||{};
  const accs=Object.keys(ACC).filter(k=>L.techOK(M,k,d.ride));
  const others=G.missions.filter(m=>(m.phase==='C'||(m.phase==='B'&&m.drm&&m.drm.done))&&m!==M);
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione · '+(M.phase==='B'?'Fase B · passo 2 di 3':'Fase C · progetto congelato')+'</h3><h1>'+(M.phase==='B'?'Progetta ':'Verifica ')+esc(M.name)+'</h1>'+(M.phase==='B'?bSteps(M):'')+'<div class="mchips">'+(M.tut?'':'<button class="btn small" data-act="toroom">← Officina</button>')+others.map(m=>'<button class="btn small" data-act="openyard" data-id="'+m.id+'" title="Passa al banco di '+esc(m.name)+'">⇄ '+esc(m.name)+'</button>').join('')+'</div></div><p>'+esc(o?o.n:'lancio da scegliere')+' · '+esc(R.n)+'. Porta i pezzi dentro la struttura e rispetta i requisiti. Trascina lo sfondo per girare il satellite; doppio tocco su un pezzo per ruotarlo.</p></div>'+
    '<div class="stage0"><div class="sbox ybx"><div id="sat3w" class="s3w fill full"></div></div><div class="ycon"><div class="why3d" id="why3d"></div><div class="info" id="info"></div>'+
    '<div class="row assist">'+(M.tut?'':'<button class="btn small" data-act="suggest" title="Ti dice dove sta il conflitto, non come risolverlo">Suggerimento</button>')+(M.phase==='C'?'<button class="btn small primary" data-act="pdr">Revisione CDR · compra i pezzi</button>':M.phase==='B'?'<button class="btn small primary" data-act="bstep" data-k="orb">Avanti: orbite in dettaglio →</button>':'')+'</div><div class="sugg" id="sugg" hidden></div></div></div>'+
    '<div class="rotate-hint">↻ Gira il telefono in orizzontale per costruire meglio</div>'+
    docks(shelfFrame(),drmStrip(M)+'<div class="panel"><div class="gauges" id="gauges"></div></div><div class="panel"><h3 style="margin:0">Requisiti</h3><ul class="reqs" id="breq"></ul></div><div id="riskw"></div>'); scn(v,{L:1,R:1,bg:'#EEF2F6',railL:[{ic:'🧩',t:'Componenti',side:'L'}],railR:[{ic:'📏',t:'Misure',side:'R'}]});
  S3.mount($('#sat3w'),{live:true,onPart:partDown,ratio:.82,maxH:560}); S3.update(d,{live:true,sel}); renderShelf(); bRefresh(); }
function autoRun(mode){ const M=cur(), d=M.sat; if(!M.first){ toast('Dalla seconda missione il satellite lo progetti tu.'); return; } if(mode==='arrange'&&Object.keys(d.placed).length<3){ toast('Prima scegli i pezzi dal magazzino, poi li dispongo io.'); return; }
  const best=L.autoDesign(M,mode,G.money,mode==='propose'?700:450); if(!best){ toast('Non ci stanno: prova una struttura più grande.'); sfx.bad(); return; }
  d.placed=best.d.placed; d.heat=best.d.heat; d.sol=best.d.sol; sel=null; sfx.put(); bRefresh();
  toast(best.sc.bad?'Fatto il possibile: restano '+best.sc.bad+' problemi. Guarda i requisiti in rosso.':(mode==='propose'?'Proposta pronta: tutti i requisiti di progetto rispettati. Ora pensa al piano di volo.':'Disposizione trovata: tutti i requisiti di progetto rispettati.')); }
// Suggerimento: indica quali requisiti tirano la stessa coperta, senza dire come risolvere
const PULL={cost:['costo'],light:['massa'],sys1:['massa'],red2:['massa','costo','potenza'],red3:['massa','costo','potenza'],relay:['massa','costo'],storm:['costo','potenza'],disp:['massa'],debre:['massa'],eco30:['massa'],dv20:['massa'],prpDeb:['massa'],prp1:['spazio'],pow30:['massa','costo'],gen50:['massa','costo'],pwrCom:['massa','costo'],pwr1:['massa','batteria'],point:['massa','potenza','costo'],sysTel:['massa','potenza','costo'],rate:['potenza','costo'],cell:['potenza','spazio'],cellw:['spazio'],thr1:['spazio','potenza'],pa1:['massa']};
const RESN2={massa:'la massa',costo:'il costo',potenza:'la potenza',batteria:'la batteria',spazio:'lo spazio nella struttura'};
function suggest(){ const M=cur(), st=L.status(M,M.sat,G.money+L.installment(M,'PDR')), b=st.b, bad=st.list.filter(x=>!x.ok&&x.kind!=='tests'&&x.kind!=='months');
  const pulls=x=>{ if(x.base){ return /Massa/.test(x.t)?['massa']:/pannelli/.test(x.t)?['potenza']:/batteria|eclisse/i.test(x.t)?['batteria','massa']:/Costo/.test(x.t)?['costo']:/Piano/.test(x.t)?['massa']:['spazio']; } const r=L.R(x.id); return r.tid&&r.tid.indexOf('p:')===0?['costo','massa']:(PULL[r.tid]||['costo']); };
  const tight=[]; if(b.wet>b.massLim*.93) tight.push('massa'); if(b.gen<b.demand*1.08) tight.push('potenza'); if(b.dod>.85) tight.push('batteria'); if(b.L.free<=1) tight.push('spazio'); if(b.cost>(G.money+L.installment(M,'PDR'))*.92) tight.push('costo');
  const nm=x=>'«'+esc(x.t)+'»'+(x.code&&x.code!=='BASE'?' ('+x.code+')':''); let h='';
  if(!bad.length) h='Nessun conflitto aperto: il progetto rispetta tutto.'+(tight.length?' Ma '+tight.map(k=>RESN2[k]).join(', ')+' '+(tight.length>1?'sono':'è')+' al limite: un cambio piccolo può rompere qualcosa.':'');
  else { let pair=null; for(let i=0;i<bad.length&&!pair;i++) for(let j=i+1;j<bad.length&&!pair;j++){ const c=pulls(bad[i]).filter(k=>pulls(bad[j]).indexOf(k)>=0); if(c.length) pair=[bad[i],bad[j],c[0]]; }
    if(pair) h='Il nodo è qui: '+nm(pair[0])+' e '+nm(pair[1])+' tirano la stessa coperta, '+RESN2[pair[2]]+'. Sistemarne uno rischia di rompere l’altro: decidi tu quale far cedere.';
    else { const x=bad[0], c=pulls(x), t2=c.filter(k=>tight.indexOf(k)>=0); h='Il problema più grosso è '+nm(x)+'. Pesa su '+c.map(k=>RESN2[k]).join(' e ')+(t2.length?', e '+RESN2[t2[0]]+' è già al limite: guarda cosa la sta consumando.':'.'); }
    if(bad.length>2) h+=' In tutto i requisiti in rosso sono '+bad.length+'.'; }
  const el=$('#sugg'); el.innerHTML='<b>Suggerimento</b> '+h; el.hidden=false; sfx.tap(); }
function partDown(cat,e){ const d=cur().sat, pl=d.placed[cat], c=cellAt(e); if(!pl||!c) return; drag={id:pl.id,rot:pl.rot,from:'grid',cat,ox:c.x-pl.x,oy:c.y-pl.y,sx:e.clientX,sy:e.clientY,moved:false}; e.preventDefault(); }

/* ---------- Centro di dinamica del volo ---------- */
let fdSel=1;
const fdLocked=M=>!M||['0','A','D','E','F','done'].indexOf(M.phase)>=0;
/* ---------- Design Reference Mission (fase B, passo 1) ---------- */
let DRMADD=false, DRMG=null, DRMH=600;
const DRMN={leo:'Terra',moon:'Luna',mars:'Marte',venus:'Venere'}, DRMDEL={leo:'nella',moon:'sulla',mars:'su',venus:'su'};
const drmNice=h=>h<1000?Math.round(h/10)*10:h<10000?Math.round(h/100)*100:Math.round(h/500)*500;
const drmKm=h=>nf(Math.round(h))+' km';
function drmRel(M){ const e=O.initial(M).el, pe=e.pe, ap=isFinite(e.ap)?e.ap:e.pe; return {pe,ap,h:Math.sqrt(Math.max(1,pe)*Math.max(1,ap)),circ:ap/Math.max(1,pe)<1.3}; }
function drmGrave(M){ const dest=M.sat.dest||'leo'; if(dest==='leo') return 36100; const Z=O.ZONES[dest].filter(z=>z.band); return drmNice(Math.max(...Z.map(z=>z.band[1]))*1.2); }
function drmBand(M){ const z=O.zoneOf(M); return z&&z.band?z.band:null; }
const drmIn=(M,h)=>{ const b=drmBand(M); return !!b&&h>=b[0]-1&&h<=b[1]+1; };
const drmLand=M=>!!(E.LV[M.sat.lv]&&E.LV[M.sat.lv].surf);
function drmInit(M){ if(M.drm&&M.drm.v===1) return M.drm; const r=drmRel(M), b=drmBand(M), mm=L.minMonths(M);
  const D={v:1,relMo:mm,star:-1,orbits:[],eol:null,done:false};
  if(!(r.circ&&drmIn(M,(r.pe+r.ap)/2))&&b){ D.orbits.push({h:drmNice(Math.sqrt(b[0]*b[1])),mo:mm}); D.star=0; D.relMo=0; }
  M.drm=D; drmSync(M); return D; }
function drmStarH(M){ const D=M.drm; if(!D) return null; if(D.star<0){ const r=drmRel(M); return (r.pe+r.ap)/2; } const o=D.orbits[D.star]; return o?o.h:null; }
function drmSync(M){ const D=M.drm, b=drmBand(M), h=drmStarH(M); if(!D||!b||h==null) return; M.traj=M.traj||{}; if(D.star<0){ delete M.traj.frac; return; } M.traj.frac=Math.max(0,Math.min(1,(h-b[0])/(b[1]-b[0]))); }
function drmMonths(M){ const D=M.drm; return (D.star<0?D.relMo:0)+D.orbits.reduce((a,o)=>a+o.mo,0); }
// scala verticale: per la Terra la quota sale dal basso, per gli altri corpi scende dalla superficie in alto
function drmScale(M,H){ const dest=M.sat.dest||'leo', lv=L.level(G.xp), Z0=O.ZONES[dest].filter(z=>z.band), Zu=Z0.filter(z=>z.lvl<=lv||z.band===drmBand(M)), Z=Zu.length?Zu:Z0, lo=Math.min(...Z.map(z=>z.band[0])), hi=Math.max(...Z.map(z=>z.band[1])), k=H/600;
  const gv=M.drm&&M.drm.eol&&M.drm.eol.k==='grave'?drmGrave(M)*1.12:0;
  if(dest==='leo'){ const hmin=100, hmax=Math.max(2000,hi*1.6,gv), yA=470*k, yS=548*k; return {leo:1,k,ySurf:yS,yAtm:yA,y:h=>h<=100?yS-(yS-yA)*h/100:yA-400*k*Math.log10(h/hmin)/Math.log10(hmax/hmin),h:y=>y>=yA?100*(yS-y)/(yS-yA):hmin*Math.pow(hmax/hmin,(yA-y)/(400*k)),min:160,max:hmax*.97}; }
  const hmin=lo*.5, hmax=Math.max(hi*1.4,gv), yT=92*k, yB=430*k; return {leo:0,k,yTop:yT,yGap:450*k,yEarth:560*k,y:h=>yT+8*k+(yB-yT-8*k)*Math.log10(Math.max(hmin,h)/hmin)/Math.log10(hmax/hmin),h:y=>hmin*Math.pow(hmax/hmin,(y-yT-8*k)/(yB-yT-8*k)),min:hmin*1.1,max:hmax*.95}; }
function drmLock(M,h){ const lv=L.level(G.xp), z=O.ZONES[M.sat.dest||'leo'].find(z=>z.band&&h>=z.band[0]&&h<=z.band[1]&&z.lvl>lv); return z?z.lvl:0; }
// ---- pianeti disegnati ----
function drmPlanet(kind,edge,top,o){ const R=2400, cx=500, cy=top?edge-R:edge+R, id='pl'+kind+(top?'t':'b'), k=o.k||1; let s='<defs><clipPath id="'+id+'c"><circle cx="'+cx+'" cy="'+cy+'" r="'+R+'"/></clipPath>';
  const G2=(i,a,b)=>'<linearGradient id="'+id+i+'" x1="0" y1="'+(top?1:0)+'" x2="0" y2="'+(top?0:1)+'"><stop offset="0" stop-color="'+a+'"/><stop offset="1" stop-color="'+b+'"/></linearGradient>';
  const sh='<linearGradient id="'+id+'sh" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".18"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0B1626" stop-opacity=".32"/></linearGradient>';
  const rnd=(i,j)=>{ const x=Math.sin(i*127.1+j*311.7)*43758.5; return x-Math.floor(x); }, near=t=>top?edge-t*k:edge+t*k;
  if(kind==='leo'){ s+=G2('g','#4FA3E3','#1C5598')+sh+'</defs>';
    if(o.atm) for(let i=0;i<6;i++){ const t=o.atm*(i+1)/6; s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R+t)+'" fill="#8FCBF2" opacity="'+(.13-i*.015).toFixed(3)+'"/>'; }
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R+3*k)+'" fill="#CDEBFF" opacity=".9"/><circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="url(#'+id+'g)"/><g clip-path="url(#'+id+'c)">';
    [[-420,120,18],[-160,70,12],[120,150,22],[420,90,16],[700,130,24],[1000,80,14],[1300,120,20]].forEach(([x,w,h],i)=>{ const y=near(10+rnd(i,1)*14); s+='<path d="M'+(x-w)+' '+(y+h*k)+'C'+(x-w*.8)+' '+(y+2*k)+' '+(x-w*.2)+' '+(y-2*k)+' '+(x+w*.1)+' '+(y+6*k)+'C'+(x+w*.5)+' '+(y+1*k)+' '+(x+w)+' '+(y+10*k)+' '+(x+w*.9)+' '+(y+h*k)+'Z" fill="'+(i%3===1?'#C7B07A':'#5FA35A')+'" opacity=".95"/><path d="M'+(x-w*.4)+' '+(y+12*k)+'q'+(w*.3)+' '+(-6*k)+' '+(w*.6)+' 0" stroke="#3E8045" stroke-width="'+(3*k)+'" fill="none" opacity=".6"/>'; });
    for(let i=0;i<9;i++){ const x=-500+i*230+rnd(i,3)*90, y=near(8+rnd(i,4)*26); s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+(60+rnd(i,5)*70)+'" ry="'+(4+rnd(i,6)*5)*k+'" fill="#fff" opacity="'+(.5+rnd(i,7)*.3).toFixed(2)+'"/>'; }
    s+='<rect x="-1500" y="'+(top?edge-400*k:edge)+'" width="4000" height="'+(400*k)+'" fill="url(#'+id+'sh)"/></g>'; return s; }
  if(kind==='moon'){ s+=G2('g','#BFC4CA','#8E959D')+sh+'</defs><circle cx="'+cx+'" cy="'+cy+'" r="'+(R+2*k)+'" fill="#E3E6E9"/><circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="url(#'+id+'g)"/><g clip-path="url(#'+id+'c)">';
    [[-300,80],[200,120],[700,90],[1200,110]].forEach(([x,w],i)=>{ s+='<ellipse cx="'+x+'" cy="'+near(30)+'" rx="'+w+'" ry="'+(22*k)+'" fill="#7E858D" opacity=".45"/>'; });
    for(let i=0;i<22;i++){ const x=-500+i*100+rnd(i,1)*60, y=near(10+rnd(i,2)*60), r=(6+rnd(i,3)*20); s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+r+'" ry="'+(r*.42*k)+'" fill="#6E757D" opacity=".55"/><ellipse cx="'+(x+r*.12)+'" cy="'+(y+(top?-1:1)*r*.08*k)+'" rx="'+(r*.86)+'" ry="'+(r*.34*k)+'" fill="#A9AFB6"/>'; }
    s+='<rect x="-1500" y="'+(top?edge-400*k:edge)+'" width="4000" height="'+(400*k)+'" fill="url(#'+id+'sh)"/></g>'; return s; }
  if(kind==='mars'){ s+=G2('g','#D9774B','#9A4428')+sh+'</defs>';
    for(let i=0;i<4;i++) s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R+(i+1)*5*k)+'" fill="#F2B49A" opacity=".12"/>';
    s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="url(#'+id+'g)"/><g clip-path="url(#'+id+'c)">';
    [[-350,140],[150,90],[620,170],[1150,120]].forEach(([x,w],i)=>{ s+='<path d="M'+(x-w)+' '+near(20)+'q'+(w*.5)+' '+((top?1:-1)*0)+' '+w+' '+(top?-14:14)*k+'t'+w+' '+(top?8:-8)*k+'l0 '+(top?-30:30)*k+'z" fill="#7E3A22" opacity=".45"/>'; });
    for(let i=0;i<14;i++){ const x=-500+i*150+rnd(i,8)*80, y=near(14+rnd(i,9)*50), r=5+rnd(i,10)*14; s+='<ellipse cx="'+x+'" cy="'+y+'" rx="'+r+'" ry="'+(r*.4*k)+'" fill="#8E3F24" opacity=".6"/>'; }
    s+='<rect x="-1500" y="'+(top?edge-400*k:edge)+'" width="4000" height="'+(400*k)+'" fill="url(#'+id+'sh)"/></g>'; return s; }
  /* venus */ s+=G2('g','#F1DFA8','#C9A55C')+sh+'</defs>'; for(let i=0;i<6;i++) s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+(R+(i+1)*6*k)+'" fill="#F5E2A8" opacity=".14"/>';
  s+='<circle cx="'+cx+'" cy="'+cy+'" r="'+R+'" fill="url(#'+id+'g)"/><g clip-path="url(#'+id+'c)">';
  for(let i=0;i<7;i++){ const y=near(8+i*11); s+='<path d="M-1500 '+y+'Q-800 '+(y+(i%2?8:-8)*k)+' -200 '+y+'T1100 '+y+'T2400 '+y+'" stroke="'+(i%2?'#E9CF8A':'#FFF2C9')+'" stroke-width="'+(5*k)+'" fill="none" opacity=".7"/>'; }
  s+='<rect x="-1500" y="'+(top?edge-400*k:edge)+'" width="4000" height="'+(400*k)+'" fill="url(#'+id+'sh)"/></g>'; return s; }
// ---- schema DRM ----
function drmSVG(M,o){ o=o||{}; const H=o.H||600, mini=!!o.mini, dest=M.sat.dest||'leo', S=drmScale(M,H), k=S.k, D=M.drm, f=mini?2.3:H<500?1.35:1, lw=mini?4.5:2.4;
  const T=(x,y,t,sz,a,c,w,it)=>'<text x="'+x+'" y="'+y+'" font-family="Inter,system-ui,sans-serif" font-size="'+(sz*f)+'" font-weight="'+(w||600)+'" fill="'+(c||'#3A4856')+'" text-anchor="'+(a||'start')+'"'+(it?' font-style="italic"':'')+'>'+esc(t)+'</text>';
  let s='<rect x="-1500" y="-200" width="4000" height="'+(H+400)+'" fill="#FBFCFD"/>';
  // fasce: obiettivo e bloccate
  const b=drmBand(M), lv=L.level(G.xp); O.ZONES[dest].filter(z=>z.band).forEach(z=>{ const y1=S.y(z.band[1]), y0=S.y(z.band[0]), lock=z.lvl>lv, tgt=b&&z.band===b;
    if(lock) s+='<rect x="-1500" y="'+Math.min(y0,y1)+'" width="4000" height="'+Math.abs(y0-y1)+'" fill="#E9EDF1" opacity=".8"/>'+(mini?'':T(16,Math.min(y0,y1)+16,'🔒 '+z.n.toLowerCase()+' · livello '+z.lvl,11,'start','#8D99A6',700));
    else if(tgt) s+='<rect x="-1500" y="'+Math.min(y0,y1)+'" width="4000" height="'+Math.abs(y0-y1)+'" fill="#3FA86B" opacity=".08"/>'+(mini?'':T(16,Math.min(y0,y1)+16,'FASCIA OBIETTIVO · '+z.n.toUpperCase()+' '+nf(z.band[0])+'–'+nf(z.band[1])+' km',11,'start','#2F7D4E',700)); });
  if(!mini){ const out=O.ZONES[dest].filter(z=>z.band&&(S.leo?z.band[0]>S.max:(z.band[0]>S.max||z.band[1]<S.min))); const up=out.filter(z=>z.band[0]>S.max), dn=out.filter(z=>z.band[1]<S.min);
    if(up.length) s+=T(976,S.leo?150*k:S.y(S.max)+16*k,(S.leo?'↑ ':'↓ ')+up.map(z=>z.n.toLowerCase()+(z.lvl>lv?' 🔒 liv. '+z.lvl:'')).join(' · '),11,'end','#8D99A6',600);
    if(dn.length) s+=T(976,S.y(S.min)-8*k,'↑ '+dn.map(z=>z.n.toLowerCase()+(z.lvl>lv?' 🔒 liv. '+z.lvl:'')).join(' · '),11,'end','#8D99A6',600); }
  // pianeti
  if(S.leo){ s+=drmPlanet('leo',S.ySurf,false,{atm:S.ySurf-S.yAtm,k}); if(!mini) s+=T(24,S.yAtm+20*k,'ATMOSFERA TERRESTRE',11,'start','#2C6E9E',700)+T(24,S.ySurf+34*k,'TERRA',13,'start','#fff',800); }
  else { s+=drmPlanet(dest,S.yTop,true,{k})+drmPlanet('leo',S.yEarth,false,{atm:10*k,k}); if(!mini) s+=T(976,S.yTop-12*k,DRMN[dest].toUpperCase(),13,'end',dest==='venus'?'#7A5A1E':'#fff',800)+T(24,S.yEarth+30*k,'TERRA',13,'start','#fff',800)+'<path d="M-1500 '+S.yGap+'H2500" stroke="#D5DCE3" stroke-dasharray="3 5"/>'+T(976,S.yGap+18*k,'↓ spazio tra la Terra e '+(dest==='moon'?'la Luna':dest==='mars'?'Marte':'Venere')+' (non in scala)',11,'end','#8D99A6',500); }
  // asse quote
  if(!mini){ const ticks=S.leo?[100,300,1000,3000,10000,36000]:[10,30,100,300,1000,3000,10000,30000]; ticks.forEach(h=>{ if(h<S.min*.9||h>S.max*1.05) return; const y=S.y(h); s+='<path d="M984 '+y+'h10" stroke="#AAB4BE" stroke-width="1.5"/>'+T(980,y+4,nf(h),10,'end','#9AA6B2',500); }); }
  const lanes=[], rel=drmRel(M), land=drmLand(M);
  const lineY=h=>S.y(h);
  // colonne
  const n=land?1:1+D.orbits.length+(D.eol?1:0), x0=mini?90:120, step=Math.min(mini?200:190,(mini?860:820)/Math.max(1,n)), X=i=>x0+i*step, LY=[], OL=(y,label,cls)=>{ let ly=y-(mini?9:7); if(LY.some(v=>Math.abs(v-ly)<(mini?26:15))) ly=y+(mini?26:15); LY.push(ly); return '<path d="M-1500 '+y+'H2500" stroke="'+(cls==='g'?'#B9C2CB':'#8D99A6')+'" stroke-width="'+(mini?3:1.6)+'" stroke-dasharray="'+(mini?'14 10':'7 6')+'"/>'+T(970,ly,label,mini?11:11,'end','#5E6B78',700); };
  const yE=S.leo?S.ySurf-4*k:S.yEarth-4*k;
  if(land){ const yS=S.yTop+4*k; s+=drmRocket(X(0),yE+2*k,k*(mini?1.6:1))+drmPath([[X(0),yE-22*k],[X(0),yS]],lw,mini)+(mini?'':T(X(0)+12,(yE+yS)/2,'lancio, viaggio e discesa con il lander',11.5,'start','#3A4856',500,1))+drmLander(X(0),yS+10*k,k*(mini?1.6:1));
    return s; }
  const hs=[rel.h].concat(D.orbits.map(o=>o.h)), ys=hs.map(lineY);
  s+=OL(ys[0],rel.circ?'RILASCIO · '+drmKm((rel.pe+rel.ap)/2):'RILASCIO · '+nf(rel.pe)+' × '+nf(rel.ap)+' km');
  D.orbits.forEach((o,i)=>{ s+=OL(ys[i+1],'ORBITA · '+drmKm(o.h)); });
  let eolY=null, eolK=D.eol&&D.eol.k;
  if(eolK==='grave'){ eolY=lineY(drmGrave(M)); s+=OL(eolY,'ORBITA CIMITERO · '+drmKm(drmGrave(M)),'g'); }
  else if(eolK==='reentry') eolY=S.leo?S.yAtm+40*k:S.yTop+2*k;
  else if(eolK==='impact') eolY=S.yTop+4*k;
  // percorso
  const pts=[[X(0),yE-22*k],[X(0),ys[0]]]; for(let i=0;i<hs.length;i++){ pts.push([X(i+1),ys[i]]); if(i+1<hs.length) pts.push([X(i+1),ys[i+1]]); }
  if(eolY!=null){ const xl=X(hs.length); pts.push([xl,eolY]); if(eolK==='grave') pts.push([xl+step*.6,eolY]); }
  s+=drmRocket(X(0),yE+2*k,k*(mini?1.6:1))+drmPath(pts,lw,mini);
  // soste, stella, note
  hs.forEach((h,i)=>{ const mo=i===0?(D.star<0?D.relMo:0):D.orbits[i-1].mo, xm=(X(i)+X(i+1))/2, y=ys[i], star=(i===0&&D.star<0)||(i>0&&D.star===i-1); if(!mo&&!star) return;
    s+=drmSat(xm,y,mini?1.8:1)+(star?'<g transform="translate('+(xm-(mini?42:28))+' '+(y-(mini?30:22))+')"><circle r="'+(mini?17:10)+'" fill="#F07B3F"/><text y="'+(mini?7:4.5)+'" font-size="'+(mini?20:12)+'" text-anchor="middle" fill="#fff" font-weight="800">★</text></g>':'')+drmPill(xm,y+(mini?34:22),mo+(mini?' m':' mesi'),mini); });
  if(!mini){ const note=(x,y,t)=>T(x+12,y,t,11.5,'start','#3A4856',500,1);
    s+=note(X(0),(yE+ys[0])/2,S.leo?'lancio e rilascio':'lancio e viaggio verso '+(dest==='moon'?'la Luna':DRMN[dest]));
    for(let i=1;i<hs.length;i++) s+=note(X(i),(ys[i-1]+ys[i])/2+4,(S.leo?hs[i]>hs[i-1]:hs[i]>hs[i-1])?'manovra di salita':'manovra di discesa');
    if(eolY!=null) s+=note(X(hs.length),(ys[hs.length-1]+eolY)/2+4,eolK==='reentry'?'rientro in atmosfera':eolK==='impact'?'impatto controllato':'verso l’orbita cimitero'); }
  if(eolK==='reentry') s+=drmFire(X(hs.length),eolY+(S.leo?14:8)*k,mini?1.8:1); if(eolK==='impact') s+=drmBurst(X(hs.length),eolY,mini?1.8:1); if(eolK==='grave') s+='<circle cx="'+(X(hs.length)+step*.6+6)+'" cy="'+eolY+'" r="'+(mini?8:5)+'" fill="#22313B"/>';
  // riga fantasma (aggiunta)
  if(!mini&&DRMG){ const y=lineY(DRMG.h); s+='<path d="M-1500 '+y+'H2500" stroke="'+(DRMG.ok?'#F07B3F':'#CF5E4C')+'" stroke-width="2" stroke-dasharray="7 6"/><g transform="translate('+Math.max(140,Math.min(860,DRMG.x))+' '+y+')"><rect x="-120" y="-40" width="240" height="26" rx="13" fill="#22313B"/><text y="-22" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff" font-family="Inter,sans-serif">'+esc(DRMG.ok?'Rilascia: nuova orbita a '+drmKm(DRMG.h):DRMG.why)+'</text><circle r="7" fill="'+(DRMG.ok?'#F07B3F':'#CF5E4C')+'" stroke="#fff" stroke-width="3"/></g>'; }
  return s; }
function drmPath(pts,lw,mini){ let d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1); const R=mini?24:18;
  for(let i=1;i<pts.length-1;i++){ const a=pts[i-1],b=pts[i],c=pts[i+1], l1=Math.hypot(b[0]-a[0],b[1]-a[1]), l2=Math.hypot(c[0]-b[0],c[1]-b[1]); if(l1<.1||l2<.1) continue; const r=Math.min(R,l1/2,l2/2), p1=[b[0]-(b[0]-a[0])/l1*r,b[1]-(b[1]-a[1])/l1*r], p2=[b[0]+(c[0]-b[0])/l2*r,b[1]+(c[1]-b[1])/l2*r]; d+='L'+p1[0].toFixed(1)+' '+p1[1].toFixed(1)+'Q'+b[0].toFixed(1)+' '+b[1].toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1); }
  const z=pts[pts.length-1]; d+='L'+z[0].toFixed(1)+' '+z[1].toFixed(1); let ah='';
  for(let i=0;i<pts.length-1;i++){ const a=pts[i],b=pts[i+1],L2=Math.hypot(b[0]-a[0],b[1]-a[1]); if(L2<(mini?60:46)) continue; const m=[(a[0]+b[0])/2,(a[1]+b[1])/2], ang=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI, sc=mini?1.9:1; ah+='<path d="M-6 -5.5L6 0L-6 5.5z" fill="#22313B" transform="translate('+m[0].toFixed(1)+' '+m[1].toFixed(1)+') rotate('+ang.toFixed(1)+') scale('+sc+')"/>'; }
  return '<path d="'+d+'" fill="none" stroke="#22313B" stroke-width="'+lw+'" stroke-linejoin="round"/>'+ah; }
const drmSat=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><rect x="-16" y="-3.5" width="10" height="7" fill="#3D6FB0"/><rect x="6" y="-3.5" width="10" height="7" fill="#3D6FB0"/><rect x="-5.5" y="-6.5" width="11" height="13" rx="1.5" fill="#fff" stroke="#22313B" stroke-width="1.6"/></g>';
const drmPill=(x,y,t,mini)=>{ const fs=mini?22:11, w=t.length*fs*.62+(mini?20:16), h=mini?32:20; return '<g transform="translate('+x+' '+y+')"><rect x="'+(-w/2)+'" y="'+(-h/2)+'" width="'+w+'" height="'+h+'" rx="'+(h/2)+'" fill="#fff" stroke="#C9D3DD"/><text y="'+(fs*.36)+'" text-anchor="middle" font-size="'+fs+'" font-weight="700" font-family="IBM Plex Mono,monospace" fill="#22313B">'+esc(t)+'</text></g>'; };
const drmRocket=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+(s*.9)+')"><path d="M-6 0V-34Q-6 -46 0 -54Q6 -46 6 -34V0Z" fill="#F4F4F1" stroke="#9AA3AA"/><rect x="-6" y="-30" width="12" height="3" fill="#F07B3F"/><path d="M-6 -8L-11 2H-6ZM6 -8L11 2H6Z" fill="#3F4A54"/><path d="M-4 2Q0 16 4 2Z" fill="#FFB347"/></g>';
const drmFire=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><ellipse cy="-10" rx="12" ry="22" fill="#FFB347" opacity=".55"/><ellipse cy="-4" rx="8" ry="12" fill="#FFE08A" opacity=".9"/><circle r="5.5" fill="#F2B06B" stroke="#22313B" stroke-width="1.2"/></g>';
const drmBurst=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><circle r="13" fill="#FFD27A" opacity=".75"/>'+[0,40,80,120,160,200,240,280,320].map(a=>'<path d="M0 0L'+(Math.cos(a*Math.PI/180)*19).toFixed(1)+' '+(Math.sin(a*Math.PI/180)*19).toFixed(1)+'" stroke="#F0532A" stroke-width="2" stroke-linecap="round"/>').join('')+'<circle r="3.5" fill="#22313B"/></g>';
const drmLander=(x,y,s)=>'<g transform="translate('+x+' '+y+') scale('+s+')"><path d="M-12 8L-7 0H7L12 8M-7 0V-6H7V0" stroke="#22313B" stroke-width="1.8" fill="#F2C14E"/><rect x="-5" y="-12" width="10" height="7" rx="1" fill="#fff" stroke="#22313B" stroke-width="1.4"/></g>';
// ---- barra dei passi della fase B ----
function bSteps(M){ const st=M.stage, D=M.drm||{}, it=[['drm','1 · Missione (DRM)'],['sat','2 · Satellite'],['orb','3 · Orbite in dettaglio']], cur0=st==='sat'?'sat':st==='orb'?'orb':'drm';
  return '<div class="bsteps">'+it.map(([k,n])=>'<button class="bst'+(k===cur0?' on':'')+(k!==cur0&&(k==='drm'?D.eol:k==='sat'?D.done:false)?' ok':'')+'" data-act="bstep" data-k="'+k+'">'+n+'</button>').join('<i></i>')+'<i></i><button class="bst pdr" data-act="pdrB">PDR</button></div>'; }
// ---- pannello sequenza ----
function drmPanel(M){ const D=M.drm, dest=M.sat.dest||'leo', land=drmLand(M), rel=drmRel(M), lvO=E.LV[M.sat.lv], atm=dest!=='moon';
  const row=(n,ti,sub,o)=>'<div class="dq'+(o.hl?' hl':'')+'"><span class="dn">'+n+'</span><div class="dt"><b>'+ti+'</b><span>'+sub+'</span></div>'+(o.extra||'')+'</div>';
  const mo=(i,v)=>'<span class="dmo"><button data-act="drmmo" data-i="'+i+'" data-d="-1" aria-label="meno">−</button><b class="num">'+v+' m</b><button data-act="drmmo" data-i="'+i+'" data-d="1" aria-label="più">+</button></span>';
  const starB=(i,on,ok)=>'<button class="dstar'+(on?' on':'')+'" data-act="drmstar" data-i="'+i+'"'+(ok?'':' disabled title="Fuori dalla fascia obiettivo"')+' aria-label="Orbita di lavoro">★</button>';
  const del=i=>'<button class="dx" data-act="drmdel" data-i="'+i+'" aria-label="Cancella">✕</button>';
  let h='<div class="panel drmp"><h3>Sequenza</h3><p class="fine">Nell’ordine in cui la crei. ★ = dove il satellite lavora.</p><div class="dseq">';
  h+=row('1','🚀 '+esc(lvO?lvO.n:'Lancio'),land?'il lander ti porta fino al suolo':(rel.circ?'rilascio in orbita a '+drmKm((rel.pe+rel.ap)/2):'rilascio in orbita '+nf(rel.pe)+' × '+nf(rel.ap)+' km')+' · fino a '+lvCap(M)+' kg',{extra:'<button class="btn small" data-act="drmlv">Cambia</button>'});
  if(!land){ const relOk=rel.circ&&drmIn(M,(rel.pe+rel.ap)/2); if(relOk||D.star<0) h+=row('·','Sosta nell’orbita di rilascio',D.star<0?'qui lavora il satellite':'solo di passaggio',{hl:D.star<0,extra:starB(-1,D.star<0,relOk)+(D.star<0?mo(-1,D.relMo):'')});
    D.orbits.forEach((o,i)=>{ h+=row(String(i+2),'Orbita '+drmKm(o.h),(D.star===i?'qui lavora il satellite':drmIn(M,o.h)?'nella fascia obiettivo':'fuori dalla fascia obiettivo')+' · a = '+nf(O.BODY[dest].R+o.h,0)+' km',{hl:D.star===i,extra:starB(i,D.star===i,drmIn(M,o.h))+mo(i,o.mo)+del(i)}); });
    if(D.eol) h+=row(String(D.orbits.length+2),{reentry:'🔥 Rientro in atmosfera',impact:'💥 Impatto controllato',grave:'🪦 Orbita cimitero'}[D.eol.k],{reentry:'fine vita senza detriti',impact:'fine vita sulla superficie',grave:'parcheggiato a '+drmKm(drmGrave(M))}[D.eol.k],{extra:'<button class="dx" data-act="drmeolx" aria-label="Cancella">✕</button>'}); }
  else h+=row('2','🛬 Sulla superficie','il satellite lavora a terra',{hl:1});
  h+='</div>';
  if(!land) h+='<button class="btn primary dadd'+(DRMADD?' on':'')+'" data-act="drmadd">'+(DRMADD?'✕ Annulla':'＋ Aggiungi orbita')+'</button>'+(DRMADD?'<p class="fine">Muovi il puntatore (o il dito) sullo schema e rilascia alla quota che vuoi.</p>':'')+
    '<h3 style="margin-top:12px">Fine vita (fase F)</h3><div class="deol">'+[['reentry','🔥 Rientro',atm?'in atmosfera':'niente atmosfera',!atm],['impact','💥 Impatto','sulla superficie',dest==='leo'],['grave','🪦 Cimitero',dest==='leo'?'sopra la geostazionaria':'orbita molto alta',false]].map(([k,n,sub,dis])=>'<button class="'+(D.eol&&D.eol.k===k?'on':'')+'" data-act="drmeol" data-k="'+k+'"'+(dis?' disabled':'')+'><b>'+n+'</b><small>'+sub+'</small></button>').join('')+'</div>';
  h+='<div class="dtot"><span>Durata totale</span><b class="num">'+(land?D.relMo:drmMonths(M))+' mesi</b></div><p class="fine">La DRM fissa il semiasse maggiore di ogni orbita. Al passo 3 scegli inclinazione, eccentricità e gli altri elementi, e vedi i Δv.</p>';
  const ready=land||(D.eol&&drmStarH(M)!=null); h+='<button class="btn primary" style="width:100%" data-act="bstep" data-k="sat"'+(ready?'':' disabled')+'>Avanti: progetta il satellite →</button>'+(ready?'':'<p class="fine">Serve un’orbita di lavoro ★ nella fascia obiettivo e un fine vita.</p>')+'</div>';
  return h; }
function vDRM(v,M){ const D=drmInit(M); DRMH=Math.round(Math.max(400,Math.min(600,1000/(innerWidth/Math.max(1,innerHeight))*1.05))); if(drmLand(M)){ D.eol={k:'surf'}; D.orbits=[]; }
  v.innerHTML='<div class="head"><div><h3>Centro di dinamica del volo · Fase B · passo 1 di 3</h3><h1>Design Reference Mission</h1>'+bSteps(M)+'</div><p>Disegna cosa fa il satellite, dove e in che ordine, fino alla fine della missione. Puoi tornare qui quando vuoi durante la fase B, senza costi.</p></div>'+
    stage('<section class="drm3 fsc" style="--ar:1000/'+DRMH+'"><svg id="drmsvg" class="'+(DRMADD?'adding':'')+'" viewBox="0 0 1000 '+DRMH+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Schema della missione">'+drmSVG(M,{H:DRMH})+'</svg></section>','rbx')+
    docks(drmPanel(M),null); scn(v,{L:1,bg:'#FBFCFD',railL:[{ic:'🧭',t:'Sequenza',side:'L'}]}); }
function drmRedraw(){ const M=cur(), sv=$('#drmsvg'); if(!sv||!M) return; sv.innerHTML=drmSVG(M,{H:DRMH}); }
function drmPt(e){ const sv=$('#drmsvg'); if(!sv) return null; const pt=sv.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const m=sv.getScreenCTM(); if(!m) return null; const p=pt.matrixTransform(m.inverse()); return p; }
function drmGhost(e){ const M=cur(); if(!DRMADD||!M||!M.drm) return; const p=drmPt(e); if(!p) return; const S=drmScale(M,DRMH), h=drmNice(S.h(p.y)); let why='', ok=true;
  if(h<S.min||h>S.max) { ok=false; why='Fuori dallo schema'; } else { const lk=drmLock(M,h); if(lk){ ok=false; why='🔒 Quota che si sblocca al livello '+lk; } }
  if(ok&&S.leo&&h<180){ ok=false; why='Troppo bassa: l’atmosfera frena il satellite'; }
  DRMG={h:Math.max(S.min,Math.min(S.max,h)),x:p.x,ok,why}; drmRedraw(); }
document.addEventListener('pointermove',e=>{ if(DRMADD&&e.target.closest&&e.target.closest('#drmsvg')) drmGhost(e); });
document.addEventListener('pointerup',e=>{ if(!DRMADD||!(e.target.closest&&e.target.closest('#drmsvg'))) return; drmGhost(e); const M=cur(); if(!DRMG) return; if(!DRMG.ok){ sfx.bad(); toast(DRMG.why); return; }
  const D=M.drm; D.orbits.push({h:DRMG.h,mo:3}); if(D.star==null||drmStarH(M)==null) { if(drmIn(M,DRMG.h)) D.star=D.orbits.length-1; } 
  DRMADD=false; DRMG=null; D.done=false; drmSync(M); sfx.put(); save(); render(); });
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&DRMADD){ DRMADD=false; DRMG=null; render(); } });
// ---- Δv della DRM (passo 3): il tratto fino all'orbita di lavoro viene dal piano 3D, il resto da trasferimenti di Hohmann ----
function drmDv(M,p){ const D=M.drm; if(!D||drmLand(M)) return {rows:[],extra:0}; if(p&&p.ob){ const rows=[]; if(p.ini.cap) rows.push({t:'Frenata di cattura',dv:p.capDv}); p.orbits.forEach((o,k)=>{ if(k) rows.push({t:'Verso '+o.name+(k===p.si?' ★':''),dv:o.dv}); }); if(p.eol&&p.eol.k) rows.push({t:p.eol.t,dv:p.eol.dv}); return {rows,extra:p.after}; } const B=O.BODY[M.sat.dest||'leo'], mu=B.mu, R=B.R, rel=drmRel(M), hs=[rel.h].concat(D.orbits.map(o=>o.h)), si=D.star<0?0:D.star+1, rows=[];
  const vc=r=>Math.sqrt(mu/r), hoh=(h1,h2)=>{ const r1=R+h1, r2=R+h2, a=(r1+r2)/2; return 1000*(Math.abs(Math.sqrt(mu*(2/r1-1/a))-vc(r1))+Math.abs(vc(r2)-Math.sqrt(mu*(2/r2-1/a)))); };
  const dvDown=(h,hp)=>{ const r=R+h, rp=R+hp, a=(r+rp)/2; return 1000*(vc(r)-Math.sqrt(mu*(2/r-1/a))); };
  rows.push({t:'Dal rilascio all’orbita di lavoro ★',dv:p.tot,src:'piano 3D'}); let extra=0;
  for(let i=si;i<hs.length-1;i++){ const dv=hoh(hs[i],hs[i+1]); extra+=dv; rows.push({t:'Da '+drmKm(hs[i])+' a '+drmKm(hs[i+1]),dv}); }
  const last=hs[hs.length-1];
  if(D.eol){ let dv=0, t=''; if(D.eol.k==='reentry'){ const nat=(M.sat.dest||'leo')==='leo'&&last<=600; dv=nat?0:dvDown(last,(M.sat.dest||'leo')==='leo'?60:50); t=nat?'Rientro naturale: l’atmosfera frena il satellite':'Rientro in atmosfera'; } else if(D.eol.k==='impact'){ dv=dvDown(last,0); t='Impatto controllato'; } else if(D.eol.k==='grave'){ dv=hoh(last,drmGrave(M)); t='Verso l’orbita cimitero'; } extra+=dv; rows.push({t,dv}); }
  return {rows,extra}; }
function drmTable(M,p){ const D=M.drm; if(!D) return ''; if(drmLand(M)) return '<div class="panel"><h3>Dalla DRM</h3><p class="fine">Missione con lander: il lancio porta il satellite fino al suolo.</p></div>';
  const dd=drmDv(M,p), tot=p.tot*1.05+dd.extra, av=p.dvAvail, bad=tot>av+1;
  return '<div class="panel drmt"><h3>Passaggi della DRM</h3><div class="drmS"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+drmSVG(M,{mini:true})+'</svg></div><ul class="tgl">'+dd.rows.map(r=>'<li><span></span><span>'+esc(r.t)+(r.src?' <small class="fine">('+r.src+')</small>':'')+'</span><span class="num">'+Math.round(r.dv)+' m/s</span></li>').join('')+
    '<li><span class="mk '+(bad?'n':'y')+'">'+(bad?'✕':'✓')+'</span><span><b>Totale (+5% di margine sul piano)</b></span><span class="num"><b>'+Math.round(tot)+' m/s</b></span></li><li><span></span><span>ΔV del satellite</span><span class="num">'+Math.round(av)+' m/s</span></li></ul>'+(bad?'<p class="why">Mancano '+Math.round(tot-av)+' m/s: serbatoio più grande al passo 2 (Grande o Extra), oppure togli una tappa al passo 1.</p>':'')+'<div class="row"><button class="btn small" data-act="bstep" data-k="drm">✎ Modifica DRM</button><button class="btn small" data-act="bstep" data-k="sat">← Satellite</button></div></div>'; }
function drmStrip(M){ if(!M.drm) return ''; return '<div class="panel drmt"><h3>La tua DRM</h3><div class="drmS"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+drmSVG(M,{mini:true})+'</svg></div><div class="row"><span class="fine">'+(drmLand(M)?'Lander fino al suolo':'★ '+drmKm(drmStarH(M)||0)+' · '+drmMonths(M)+' mesi'+(M.drm.eol?' · '+{reentry:'rientro',impact:'impatto',grave:'cimitero',surf:'superficie'}[M.drm.eol.k]:''))+'</span><button class="btn small" data-act="bstep" data-k="drm">✎ Modifica</button></div></div>'; }

/* ---------- v33 · Orbit Budget nel Centro di dinamica del volo: la DRM dà il semiasse, qui si scelgono gli altri elementi ---------- */
const OBC=['#5B8DEF','#3CC796','#C9A0FF','#F06EAA','#F2C84B','#6CC3F5'], OBREL='#9AA6B4', OBFIN='#FF7A6B', OBMID='#FFC2B5';
let OBSEL=1, OBV={tilt:28,az:35,sc:0,raf:0,t0:0};
const obCol=k=>k===0?OBREL:OBC[(k-1)%OBC.length];
const obOn=M=>{ if(!M||!M.drm||M.drm.v!==1||drmLand(M)) return false; const p=O.plan(M); return !!p.ob; };
function obBody(M){ return O.BODY[M.sat.dest||'leo']; }
function obSum(el){ return Math.abs(el.ap-el.pe)<1?nf(el.pe,0)+' km':nf(el.pe,0)+' × '+nf(el.ap,0)+' km'; }
function obKepler(Mn,e){ let E2=Mn; for(let k=0;k<12;k++) E2=E2-(E2-e*Math.sin(E2)-Mn)/(1-e*Math.cos(E2)); return 2*Math.atan2(Math.sqrt(1+e)*Math.sin(E2/2),Math.sqrt(1-e)*Math.cos(E2/2)); }
function obPos(el,B,nu){ const k=O.kep(el,B), [P,Q]=O.pqK(k), p=k.a*(1-k.e*k.e), r=p/(1+k.e*Math.cos(nu)), c=Math.cos(nu)*r, s=Math.sin(nu)*r; return [P[0]*c+Q[0]*s,P[1]*c+Q[1]*s,P[2]*c+Q[2]*s,r]; }
function obItems(M,p){ const it=[]; p.orbits.forEach((o,k)=>{ if(o.mid) it.push({el:o.mid,col:OBMID,dash:[3,5],w:1.3,tag:''}); it.push({el:o.el,col:obCol(k),dash:[],w:k===OBSEL?3.2:k===p.si?2.4:1.7,tag:k===0?'R':String(k+1),star:k===p.si,k}); });
  if(p.eol){ if(p.eol.mid) it.push({el:p.eol.mid,col:OBMID,dash:[3,5],w:1.3,tag:''}); if(p.eol.el&&p.eol.el!==p.orbits[p.orbits.length-1].el) it.push({el:p.eol.el,col:OBFIN,dash:[7,5],w:1.7,tag:'F'}); } return it; }
function obDraw(){ const cv=$('#obcv'), M=cur(); if(!cv||!M||!document.body.contains(cv)) return false; const p=O.plan(M), B=obBody(M), dest=M.sat.dest||'leo', W=cv.clientWidth, H=cv.clientHeight, dpr=Math.min(2,window.devicePixelRatio||1);
  if(!W||!H) return true; if(cv.width!==Math.round(W*dpr)) { cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr); } const g=cv.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0);
  g.fillStyle='#050912'; g.fillRect(0,0,W,H); for(let k=0;k<120;k++){ const a=Math.sin(k*91.7)*43758.5, b=Math.sin(k*12.9)*24634.6; g.fillStyle='rgba(200,215,240,'+(0.2+((k*37)%10)/25)+')'; g.fillRect((a-Math.floor(a))*W,(b-Math.floor(b))*H,1.2,1.2); }
  const items=obItems(M,p); let maxR=B.R*1.6; items.forEach(i=>{ maxR=Math.max(maxR,B.R+i.el.ap); }); const want=Math.min(W,H)/2*0.84/maxR;
  OBV.sc=OBV.sc?OBV.sc+(want-OBV.sc)*0.25:want; const sc=OBV.sc, cx=W/2, cy=H/2+(H>500?40:8), Rp=B.R*sc, D=Math.PI/180, ct=Math.cos(OBV.tilt*D), st=Math.sin(OBV.tilt*D), ca=Math.cos(OBV.az*D), sa=Math.sin(OBV.az*D);
  const proj=q=>{ const x=q[0]*ca-q[1]*sa, y=q[0]*sa+q[1]*ca, yy=y*ct-q[2]*st, z=y*st+q[2]*ct; return {x:cx+x*sc,y:cy-yy*sc,z}; }, hid=s=>s.z<0&&Math.hypot(s.x-cx,s.y-cy)<Rp;
  const A=O.ATMH[dest], atmR=A?(B.R+A[1])*sc:0;
  const pal={leo:['#4b8fd1','#14416f'],moon:['#c4c4ca','#5e5e66'],mars:['#d9744a','#7a2a0c'],venus:['#ecd08e','#9c7a3c']}[dest]||['#888','#444'];
  if(A){ const ga=g.createRadialGradient(cx,cy,Rp,cx,cy,atmR); ga.addColorStop(0,'rgba(120,190,255,.35)'); ga.addColorStop(1,'rgba(120,190,255,0)'); if(dest!=='leo'){ ga.addColorStop(0,'rgba(255,170,110,.35)'); } g.fillStyle=ga; g.beginPath(); g.arc(cx,cy,atmR,0,7); g.fill(); }
  const gr=g.createRadialGradient(cx-Rp*.35,cy-Rp*.35,Rp*.1,cx,cy,Rp); gr.addColorStop(0,pal[0]); gr.addColorStop(1,pal[1]); g.fillStyle=gr; g.beginPath(); g.arc(cx,cy,Rp,0,7); g.fill();
  g.strokeStyle='rgba(255,255,255,.22)'; g.lineWidth=1; g.beginPath(); g.ellipse(cx,cy,Rp,Math.max(.5,Rp*ct),0,0,7); g.stroke();
  const stroke=it=>{ const k=O.kep(it.el,B), [P,Q]=O.pqK(k), pp=k.a*(1-k.e*k.e), n=360; let pen=false, last=null;
    for(let j=0;j<=n;j++){ const nu=j/n*2*Math.PI, r=pp/(1+k.e*Math.cos(nu)), c=Math.cos(nu)*r, s=Math.sin(nu)*r, q=proj([P[0]*c+Q[0]*s,P[1]*c+Q[1]*s,P[2]*c+Q[2]*s]), inA=A&&r<B.R+A[1], bad=r<B.R;
      const col=bad?null:inA&&it.tag?'#FF4D3D':it.col; if(bad||hid(q)){ if(pen) g.stroke(); pen=false; continue; }
      if(!pen||col!==last){ if(pen) g.stroke(); g.beginPath(); g.strokeStyle=col; g.lineWidth=it.w; g.setLineDash(it.dash); if(pen&&it._q) g.moveTo(it._q.x,it._q.y); else g.moveTo(q.x,q.y); pen=true; last=col; } g.lineTo(q.x,q.y); it._q=q; }
    if(pen) g.stroke(); g.setLineDash([]); };
  items.forEach(stroke);
  g.font='600 10px "IBM Plex Mono",monospace'; g.textAlign='center'; g.textBaseline='middle';
  items.forEach((it,j)=>{ if(!it.tag) return; const q0=obPos(it.el,B,(40+57*j)*D); if(q0[3]<B.R*1.01) return; const q=proj(q0); if(hid(q)) return; g.fillStyle=it.col; g.beginPath(); g.arc(q.x,q.y,8,0,7); g.fill(); g.fillStyle='#050912'; g.fillText(it.star?'★':it.tag,q.x,q.y+.5); });
  // il satellite corre sull'orbita selezionata, a partire dall'anomalia media scelta
  const so=p.orbits[Math.min(OBSEL,p.orbits.length-1)]; if(so){ const el=so.el, k=O.kep(el,B), T=2*Math.PI*Math.sqrt(k.a**3/B.mu), Mn=((el.ma||0)*D+((performance.now()-OBV.t0)/1000)*2*Math.PI/8)%(2*Math.PI), nu=obKepler(Mn,k.e), q0=obPos(el,B,nu), q=proj(q0);
    if(q0[3]>B.R&&!hid(q)){ g.fillStyle='#fff'; g.beginPath(); g.arc(q.x,q.y,4.5,0,7); g.fill(); g.strokeStyle=obCol(OBSEL); g.lineWidth=2; g.stroke(); }
    if(H<420) return true; g.textAlign='left'; g.textBaseline='top'; g.fillStyle='#9FB0C2'; g.font='11px "IBM Plex Mono",monospace'; const tx=(so.name||'')+' · periodo '+(T<7200?nf(T/60,0)+' min':nf(T/3600,1)+' h'); g.fillText(window.GNG&&GNG.tr?GNG.tr(tx):tx,12,H-34); }
  const raw=90/sc, p10=Math.pow(10,Math.floor(Math.log10(raw))), nice=[1,2,5,10].map(x=>x*p10).reduce((a,x)=>Math.abs(x-raw)<Math.abs(a-raw)?x:a);
  g.strokeStyle='#8e9bb2'; g.lineWidth=1.5; g.beginPath(); g.moveTo(12,H-12); g.lineTo(12+nice*sc,H-12); g.stroke(); g.fillStyle='#8e9bb2'; g.textBaseline='bottom'; g.fillText(nf(nice,0)+' km',16+nice*sc,H-6);
  return true; }
function obLoop(){ cancelAnimationFrame(OBV.raf); OBV.t0=performance.now(); const f=()=>{ if(view!=='fd'||!obDraw()) return; OBV.raf=requestAnimationFrame(f); }; OBV.raf=requestAnimationFrame(f); }
function obBind(){ const cv=$('#obcv'); if(!cv) return; let dr=null; const turn=(dx,dy)=>{ OBV.az=((OBV.az+dx)%360+360)%360; OBV.tilt=Math.max(0,Math.min(90,OBV.tilt+dy)); };
  cv.addEventListener('pointerdown',e=>{ dr={x:e.clientX,y:e.clientY}; try{ cv.setPointerCapture(e.pointerId); }catch(_){} });
  cv.addEventListener('pointermove',e=>{ if(!dr) return; turn(-(e.clientX-dr.x)*.4,(e.clientY-dr.y)*.4); dr={x:e.clientX,y:e.clientY}; });
  ['pointerup','pointercancel','lostpointercapture'].forEach(t=>cv.addEventListener(t,()=>{ dr=null; })); cv.addEventListener('dblclick',()=>{ OBV.az=35; OBV.tilt=28; }); }
function obMeter(M,p){ const need=(p.tot+p.after)*1.05, av=p.dvAvail, over=need>av+1, segs=p.orbits.map((o,k)=>[k&&k<=p.si?o.dv:0,obCol(k)]).concat(p.orbits.map((o,k)=>[k>p.si?o.dv:0,obCol(k)])).filter(s=>s[0]>0.5); if(p.eol&&p.eol.dv>0.5) segs.push([p.eol.dv,OBFIN]); const base=Math.max(av,need,1);
  return '<div class="lbl">ΔV del piano (+5%)</div><div class="big num">'+nf(need,0)+'<small>m/s</small></div><div class="bar'+(over?' over':'')+'">'+segs.map(([d,c])=>'<i style="width:'+(d/base*100)+'%;background:'+c+'"></i>').join('')+'</div><div class="lbl">'+(over?'oltre il satellite di '+nf(need-av,0)+' m/s':'il satellite ne ha '+nf(av,0)+' m/s')+'</div>'+(p.atm&&p.atm.p>0.005?'<div class="atmw">⚠ '+pct(p.atm.p)+' di rientro anticipato</div>':''); }
function obStatus(M,p){ const t=p.t, f=p.final, chk=(l,x,r)=>'<li><span class="mk '+(x?'y':'n')+'">'+(x?'✓':'✕')+'</span><span>'+l+'</span><span class="num">'+r+'</span></li>';
  const need=(p.tot+p.after)*1.05, sk=E.skOf(M.sat), rest=p.dvAvail-need, mo=sk>0?Math.floor(rest/sk):Infinity, mm=L.minMonths(M), noMan=need<=1&&!M.sat.placed.prop;
  let h='<h3>Orbita di lavoro ★ · '+esc(O.TYPES[M.type||'sci'].n)+'</h3><ul class="tgl">'+chk('Pericentro',p.chk.pe,t.pe[0]+'–'+t.pe[1]+' km · ora '+nf(f.pe,0))+chk('Apocentro',p.chk.ap,t.ap[0]+'–'+t.ap[1]+' km · ora '+nf(f.ap,0))+chk('Inclinazione',p.chk.i,(t.i[1]>=180?'qualsiasi':t.i[0]+'–'+t.i[1]+'°')+' · ora '+nf(f.i,1)+'°')+'</ul>';
  if(p.bad) h+='<p class="why">'+esc(p.bad)+'</p>';
  h+='<ul class="tgl"><li><span></span><span>ΔV del piano (+5% di margine)</span><span class="num">'+nf(need,0)+' m/s</span></li><li><span></span><span>ΔV del satellite</span><span class="num">'+nf(p.dvAvail,0)+' m/s</span></li>'+(noMan?'':chk('Dopo il piano: mantenimento d’orbita',rest>=0&&mo>=mm,(rest>0?'~'+Math.max(0,Math.min(999,mo))+' mesi':'non basta')+' · servono '+mm))+'</ul>';
  if(p.atm&&p.atm.rows.length){ h+='<div class="atmbox"><b>⚠ Orbite dentro l’atmosfera</b><ul>'+p.atm.rows.map(x=>'<li>'+esc(x.n)+': pericentro '+nf(x.pe,0)+' km'+(x.crash?' · <b>tocca la superficie</b>':' · '+pct(x.r)+' di rientro')+'</li>').join('')+'</ul><p class="fine">Sotto i '+O.ATMH[M.sat.dest||'leo'][1]+' km l’aria frena il satellite a ogni passaggio al pericentro: rischia di rientrare e bruciare prima della fine della missione.</p></div>'; }
  return h; }
function obTLE(M,el,k){ const t=O.tle(el,obBody(M),(M.seed||1)%90000+10000+k); return '<details class="tlebox"><summary>Elementi in formato TLE</summary><pre class="tle">'+esc((M.name||'SAT').toUpperCase().slice(0,24))+'\n'+t[0]+'\n'+t[1]+'</pre><p class="fine">Riga 2: inclinazione, Ω (nodo ascendente), eccentricità (senza «0.»), ω (argomento del pericentro), anomalia media, moto medio in giri al giorno ('+nf(t[2],3)+').</p></details>'; }
function obSlider(k,key,lab,min,max,step,val,dis,fmtv){ return '<div class="fdrow obrow"><label for="ob'+key+k+'">'+lab+'</label><input type="range" id="ob'+key+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'" data-ob="'+key+'" data-k="'+k+'"'+dis+'><input type="number" class="num" id="obn'+key+k+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+(fmtv?fmtv(val):val)+'" data-ob="'+key+'" data-k="'+k+'"'+dis+'></div>'; }
function obEditor(M,p,k){ const o=p.orbits[k], B=obBody(M), Lg=M.ob.legs[o.leg], dis=fdLocked(M)?' disabled':'', a=B.R+o.h, em=Math.floor(O.eMax(o.h,B)*1000)/1000, ss=a<=12352*1.5?Math.acos(Math.max(-1,-Math.pow(a/12352,3.5)))*180/Math.PI:null;
  const pr=[['circ','Circolare'],['pol','Polare'],ss&&(M.sat.dest||'leo')==='leo'?['sso','Eliosincrona'] :null,['eq','Equatoriale'],['same','Piano precedente']].filter(Boolean);
  return '<div class="obed"><p class="fine">Dalla DRM: <b>a = '+nf(a,0)+' km</b> (semiasse maggiore = raggio '+nf(B.R,0)+' + quota '+nf(o.h,0)+'). Qui scegli il resto dell’orbita.</p>'+
    (dis?'':'<div class="presets">'+pr.map(([q,n])=>'<button class="chip2" data-act="obpre" data-k="'+k+'" data-p="'+q+'">'+n+'</button>').join('')+'</div>')+
    obSlider(k,'e','Eccentricità <small>e · forma</small>',0,em,0.001,Math.min(em,Lg.e||0),dis,v=>(+v).toFixed(3))+
    '<p class="fine obpa" id="obpa'+k+'"></p>'+
    obSlider(k,'i','Inclinazione <small>i · gradi</small>',0,180,0.1,Lg.i,dis)+obSlider(k,'raan','Nodo <small>Ω · gradi</small>',0,359.9,0.1,Lg.raan||0,dis)+obSlider(k,'argp','Pericentro <small>ω · gradi</small>',0,359.9,0.1,Lg.argp||0,dis)+obSlider(k,'ma','Anomalia <small>M · gradi</small>',0,359.9,0.1,Lg.ma||0,dis)+
    '<div id="obtle'+k+'">'+obTLE(M,o.el,k)+'</div></div>'; }
function obPanel(M,p){ const lk=fdLocked(M); let h='<div id="obst">'+obStatus(M,p)+'</div><h3 style="margin-top:8px">Le orbite della missione</h3><div class="obph">';
  p.orbits.forEach((o,k)=>{ if(k>0) h+='<div class="oblink">↓ ΔV <b id="obdv'+k+'">'+nf(o.dv,0)+' m/s</b>'+(o.mid?' <span class="fine" id="obvia'+k+'">via '+obSum(o.mid)+'</span>':'<span id="obvia'+k+'"></span>')+'</div>';
    const on=k===OBSEL&&k>0; h+='<article class="obc'+(on?' on':'')+'" style="--c:'+obCol(k)+'"><div class="obh"'+(k>0?' data-act="obsel" data-k="'+k+'" role="button" tabindex="0"':'')+'><span class="dot"></span><b>'+(k===0?'Rilascio':esc(o.name))+(k===p.si?' ★':'')+'</b><span class="sum num" id="obs'+k+'">'+obSum(o.el)+' · i '+nf(o.el.i,1)+'°</span></div>'+
      (k===0?'<p class="fine" style="margin:0 10px 8px">'+esc(p.ini.why)+(M.sat.lv?'':' Scegli il lanciatore qui sopra.')+'</p>':'')+(on?obEditor(M,p,k):'')+'</article>'; });
  if(p.eol&&p.eol.k){ h+='<div class="oblink">↓ ΔV <b id="obdvF">'+nf(p.eol.dv,0)+' m/s</b></div><article class="obc fin" style="--c:'+OBFIN+'"><div class="obh"><span class="dot"></span><b>Fine vita</b><span class="sum" id="obsF">'+esc(p.eol.t)+'</span></div></article>'; }
  h+='</div>';
  if(p.st.cap.length||p.st.tr.length){ const kg=dv=>p.wet*(1-Math.exp(-dv/(p.isp*9.80665))), cardS=(leg,o,base)=>{ const on=(leg==='cap'?p.sc:p.strn)===o, dv=base*o.f; return '<button class="stg'+(on?' sel':'')+(o.off?' lock':'')+'" data-act="strat" data-leg="'+leg+'" data-k="'+o.k+'"'+(o.off||lk?' disabled':'')+'><b>'+o.n+'</b><span>'+o.s+'</span><ul class="kv"><li><span>ΔV</span><b>'+Math.round(dv)+' m/s</b></li><li><span>Propellente</span><b>'+(o.k==='ion'?'pochissimo':nf(kg(dv),2)+' kg')+'</b></li><li><span>Rischio</span><b class="'+(o.risk?'bad':'')+'">'+(o.risk?Math.round(o.risk*100)+'% di perdere il satellite':'nessuno')+'</b></li></ul>'+(o.off?'<small class="lk">🔒 '+o.off+'</small>':'')+'</button>'; };
    h+='<details class="obstr"><summary>Come eseguire le manovre</summary>'+(p.st.cap.length?'<h3>Cattura all’arrivo</h3><div class="stgs">'+p.st.cap.map(o=>cardS('cap',o,p.ini.cap)).join('')+'</div>':'')+(p.st.tr.length?'<h3>Trasferimenti fino all’orbita ★</h3><div class="stgs">'+p.st.tr.map(o=>cardS('tr',o,p.raw.trDv)).join('')+'</div>':'')+'</details>'; }
  h+='<p class="fine tip">I trasferimenti si calcolano da soli: due accensioni agli apsidi, con il cambio di piano dove conviene. Cambiare inclinazione o nodo costa moltissimo in orbita bassa: conviene scegliere un lanciatore che ti rilascia già sul piano giusto.</p>';
  if(M.phase==='B') h+='<button class="btn primary" data-act="pdrB" style="margin-top:10px;width:100%">Revisione PDR</button>';
  return h; }
function obLive(M){ const p=O.plan(M), s=(id,t,html)=>{ const e=$('#'+id); if(e){ if(html) e.innerHTML=t; else e.textContent=t; } };
  s('obst',obStatus(M,p),1); s('obmeter',obMeter(M,p),1);
  p.orbits.forEach((o,k)=>{ s('obs'+k,obSum(o.el)+' · i '+nf(o.el.i,1)+'°'); if(k){ s('obdv'+k,nf(o.dv,0)+' m/s'); s('obvia'+k,o.mid?'via '+obSum(o.mid):''); } });
  if(p.eol){ s('obdvF',nf(p.eol.dv,0)+' m/s'); s('obsF',p.eol.t); }
  const o=p.orbits[OBSEL]; if(o&&OBSEL>0){ const B=obBody(M), dest=M.sat.dest||'leo', r=O.atmRisk(dest,o.el.pe); s('obpa'+OBSEL,'Pericentro <b>'+nf(o.el.pe,0)+' km</b> · apocentro <b>'+nf(o.el.ap,0)+' km</b>'+(o.el.pe<=0?' · <b class="bad">tocca la superficie</b>':r>0?' · <b class="bad">nell’atmosfera: '+pct(Math.min(.95,r*(OBSEL===p.si?1.5:1)))+' di rientro</b>':''),1); s('obtle'+OBSEL,obTLE(M,o.el,OBSEL),1);
    const L2=M.ob.legs[o.leg]; ['e','i','raan','argp','ma'].forEach(q=>{ [ 'ob'+q+OBSEL,'obn'+q+OBSEL ].forEach(id=>{ const e=$('#'+id); if(e&&document.activeElement!==e) e.value=q==='e'&&id.indexOf('obn')===0?(+L2[q]||0).toFixed(3):(L2[q]||0); }); }); }
  return p; }
function obView(v,M){ const p=O.plan(M); OBSEL=Math.max(1,Math.min(OBSEL,p.orbits.length-1)); if(p.orbits.length<2) OBSEL=0;
  v.innerHTML='<div class="head"><div><h3>Centro di dinamica del volo · '+phn(M)+'</h3><h1>Orbite in dettaglio · '+esc(M.name)+'</h1>'+(M.phase==='B'?bSteps(M):'')+'</div><p>'+(fdLocked(M)?'Il satellite è costruito: queste sono le orbite che volerà.':M.phase==='B'?'Passo 3: la DRM ha fissato il semiasse maggiore di ogni orbita. Ora scegli eccentricità, inclinazione, nodo, pericentro e anomalia: il ΔV si calcola da solo.':'Fase C: puoi ancora ritoccare le orbite; il lancio è già prenotato.')+'</p></div>'+
    stage('<div id="obw" class="s3w fdw fill full obw"><canvas id="obcv" aria-label="Vista orbitale: trascina per ruotarla"></canvas><div class="obmeter" id="obmeter">'+obMeter(M,p)+'</div><div class="obhint">Trascina per ruotare · doppio clic per riportare la vista</div></div>'+
      '<div class="fdleg"><div class="legend"><span><i style="background:'+OBREL+'"></i>rilascio</span><span><i style="background:'+OBC[0]+'"></i>orbite della DRM</span><span><i style="background:'+OBMID+'"></i>trasferimenti</span><span><i style="background:'+OBFIN+'"></i>fine vita</span><span><i style="background:#FF4D3D"></i>dentro l’atmosfera</span></div></div>')+
    docks(null,fdLaunch(M)+'<div class="panel" id="fdp">'+obPanel(M,p)+'</div>'); scn(v,{R:1,bg:'#0B1626',railR:[{ic:'🛰',t:'Orbite',side:'R'}]});
  obBind(); obLive(M); obLoop(); }
function obSet(k,key,val){ const M=cur(); if(!M||!M.ob||fdLocked(M)) return; const p=O.plan(M), o=p.orbits[k]; if(!o||o.leg==null) return; const Lg=M.ob.legs[o.leg]; if(key==='e') val=Math.max(0,Math.min(O.eMax(o.h,obBody(M)),val)); if(key==='i') val=Math.max(0,Math.min(180,val)); if(key!=='e'&&key!=='i') val=((val%360)+360)%360; Lg[key]=Math.round(val*1000)/1000; obLive(M); }
document.addEventListener('input',e=>{ const t=e.target; if(!t.dataset||!t.dataset.ob) return; const x=+t.value; if(!isFinite(x)) return; obSet(+t.dataset.k,t.dataset.ob,x); });
document.addEventListener('change',e=>{ if(e.target.dataset&&e.target.dataset.ob){ const M=cur(); if(M) save(); } });
function vFD(v){ const M=cur(); if(M&&M.phase==='B'&&M.stage!=='orb') return vDRM(v,M);
  if(!M){ v.innerHTML='<div class="head"><div><h3>Centro di dinamica del volo</h3><h1>Piano di volo</h1></div></div><div class="empty">Nessuna missione. Creane una con il tasto +.</div>'; return; }
  if(M.phase==='0'||M.phase==='A'){ v.innerHTML='<div class="head"><div><h3>Centro di dinamica del volo · '+phn(M)+'</h3><h1>Analisi orbitale</h1></div></div><div class="empty">L’analisi orbitale comincia in fase B, dopo che hai scelto il satellite e fissato i requisiti di sistema nell’edificio amministrativo.</div>'; return; }
  if(obOn(M)) return obView(v,M);
  // Piano di volo 2D: per le missioni salvate con il vecchio formato DRM mostriamo
  // lo schema della missione e i comandi numerici, senza alcuna vista 3D.
  const p=O.plan(M); fdSel=Math.min(Math.max(1,fdSel),Math.max(1,(M.fd.burns||[]).length));
  v.innerHTML='<div class="head"><div><h3>Centro di dinamica del volo · '+phn(M)+'</h3><h1>Analisi orbitale di '+esc(M.name)+'</h1>'+(M.phase==='B'?bSteps(M):'')+'</div><p>'+(fdLocked(M)?'Il satellite è costruito: il piano è quello che volerà.':M.phase==='B'?'Passo 3: le orbite in dettaglio. Qui compaiono i Δv di ogni passaggio della DRM.':'Fase C: puoi ancora ritoccare la quota e la strategia; il lancio è già prenotato.')+'</p></div>'+
    stage('<section class="drm3 fsc" style="--ar:1000/600;background:#0B1626"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Schema della missione">'+drmSVG(M,{H:600})+'</svg></section>'+
    '<div class="fdleg"><div class="legend"><span><i style="background:#9AA6B4"></i>orbita di rilascio</span><span><i style="background:#5B8DEF"></i>orbite intermedie</span><span><i style="background:#F07B3F"></i>orbita finale e punti di burn</span><span><i style="background:#2F6FD6"></i>lato opposto</span><span><i style="background:#1E9E5A"></i>orbita obiettivo</span></div>'+
    '<p>Usa i comandi a destra per quota e strategia. La vista orbitale 2D interattiva è disponibile per le missioni con DRM completa.</p></div>')+
    docks(null,(M.phase==='B'?drmTable(M,p):'')+fdLaunch(M)+'<div class="panel" id="fdp"></div>'); scn(v,{R:1,bg:'#0B1626',railR:[{ic:'🛰',t:'Piano di volo',side:'R'}]});
  fdRefresh(true); }
// il servizio di lancio si sceglie in fase B e si prenota alla PDR
function fdLaunch(M){ const lk=M.phase!=='B', ids=Object.keys(E.LV).filter(k=>lvShown(k,M)&&E.LV[k].fits.indexOf(M.sat.ride)>=0);
  return '<section class="panel" style="margin-bottom:14px"><h3 style="margin-bottom:8px">Come vai nello spazio'+(lk?' · prenotato':'')+'</h3><div class="lvs mini">'+ids.map(k=>{ const o=E.LV[k], lock=lvLock(k,M), c=o.surf?'1.200 cr per kg':keur(typeof o.c==='number'?o.c:o.c[M.sat.ride]);
    return '<button class="lvc'+(lock||(lk&&M.sat.lv!==k)?' lock':'')+(M.sat.lv===k?' sel':'')+'" data-act="pickLV" data-k="'+k+'"'+(lock||lk?' disabled':'')+'><svg class="lvico" viewBox="0 0 40 70" aria-hidden="true"><path d="M20 2Q30 14 30 30V56H10V30Q10 14 20 2Z" fill="#F4F4F1" stroke="#9AA3AA" stroke-width="1.5"/><path d="M10 44L3 58H10ZM30 44L37 58H30Z" fill="#3F4A54"/><rect x="10" y="30" width="20" height="4" fill="#EB7D44"/><circle cx="20" cy="20" r="4" fill="#7FB6C8" stroke="#22313B" stroke-width="1"/><path d="M14 58Q20 70 26 58Z" fill="#FFB347"/></svg><div><b>'+o.n+'</b><span class="fine">'+o.k+'</span><ul class="kv"><li><span>Chi lancia</span><b>'+esc(o.who)+'</b></li><li><span>Porta fino a</span><b>'+lvCap(M,k)+' kg</b></li><li><span>Prezzo per il '+esc(E.RIDES[M.sat.ride].n.replace('CubeSat ',''))+'</span><b>'+c+'</b></li></ul>'+(lock?'<small class="lk">'+lock+'</small>':'')+'</div></button>'; }).join('')+'</div></section>'; }
function fdRefresh(full){ const M=cur(); if(!M||view!=='fd') return; if(obOn(M)){ const fp=$('#fdp'); if(fp) fp.innerHTML=obPanel(M,O.plan(M)); obLive(M); return; } const p=O.plan(M), ex=!!(M.traj&&M.traj.expert); if(full||!ex) $('#fdp').innerHTML=ex?fdPanel(M,p):fdStrat(M,p); else fdNums(M,p); }
function setBurn(k,key,val){ const M=cur(); if(fdLocked(M)||!M.traj||!M.traj.expert||!M.fd.burns[k-1]) return; M.fd.burns[k-1][key]=val; fdRefresh(false); }
const apsName=nu=>{ nu=((nu%360)+360)%360; return nu<8||nu>352?'pericentro':Math.abs(nu-180)<8?'apocentro':Math.round(nu)+'° dal pericentro'; };
function fdSum(M,p){ const sk=E.skOf(M.sat), rest=p.dvAvail-p.tot*1.05, mo=Math.floor((rest-27)/sk), mm=L.minMonths(M), over=p.usedKg>p.propKg+1e-6, pct2=x=>Math.max(0,Math.min(100,x*100));
  const chk=(l,x,r,u)=>'<li><span class="mk '+(x?'y':'n')+'">'+(x?'✓':'✕')+'</span><span>'+l+'</span><span class="num">'+r+'</span></li>', f=p.final, t=p.t;
  return '<h3>Orbita obiettivo · '+esc(O.TYPES[M.type||'sci'].n)+'</h3>'+(t.debris?'<p class="fine">Il detrito vola a '+t.debris.pe+' × '+t.debris.ap+' km · i '+t.debris.i+'°: raggiungi la sua orbita.</p>':'')+
    '<ul class="tgl">'+chk('Pericentro',p.chk.pe,t.pe[0]+'–'+t.pe[1]+' km · ora '+Math.round(f.pe))+chk('Apocentro',p.chk.ap,t.ap[0]+'–'+t.ap[1]+' km · ora '+(isFinite(f.ap)?Math.round(f.ap):'∞'))+chk('Inclinazione',p.chk.i,(t.i[1]>=180?'qualsiasi':t.i[0]+'–'+t.i[1]+'°')+' · ora '+Math.round(f.i)+'°')+(p.st.cap.length||p.st.tr.length?chk('Strategia scelta',p.stratOk,p.stratOk?(p.expert?'a mano':[p.sc&&p.sc.n,p.strn&&p.strn.n].filter(Boolean).join(' + ')):'da scegliere qui sotto'):'')+'</ul>'+
    (p.bad?'<p class="why">'+esc(p.bad)+'</p>':'')+
    '<h3 style="margin-top:6px">Propellente</h3><div class="pbar"><div class="pl"><span>A bordo</span><b class="num">'+nf(p.propKg,1)+' kg</b></div><div class="pt"><i style="width:100%"></i></div>'+
    '<div class="pl"><span>Consumato dal piano</span><b class="num'+(over?' bad':'')+'">'+nf(p.usedKg,2)+' kg</b></div><div class="pt"><i class="'+(over?'bad':'use')+'" style="width:'+(p.propKg?pct2(p.usedKg/p.propKg):(p.usedKg>0?100:0))+'%"></i></div></div>'+
    '<p class="fine">'+(p.ref?(p.none?'Al tuo livello non hai ancora propulsori: il satellite resta dove lo lascia il razzo.':'Propulsore non ancora scelto: stima con il migliore del tuo livello ('+esc(p.refN)+') su un CubeSat da '+nf(p.wet,1)+' kg. Lo monterai in fase C.'):'Dal progetto: '+esc(P[M.sat.placed.prop.id].n)+', '+nf(p.wet,1)+' kg al lancio, Isp '+p.isp+' s.')+'</p>'+
    '<ul class="tgl">'+(p.ini.cap?'<li><span></span><span>Frenata di cattura</span><span class="num">'+p.ini.cap+' m/s</span></li>':'')+'<li><span></span><span>ΔV del piano (+5% di margine)</span><span class="num">'+Math.round(p.tot*1.05)+' m/s</span></li><li><span></span><span>ΔV disponibile</span><span class="num">'+Math.round(p.dvAvail)+' m/s</span></li>'+
    chk('Dopo il piano: mantenimento e fine vita',mo>=mm||!isFinite(mo),(!isFinite(mo)?'nessuna manovra':rest>27?'~'+Math.max(0,mo)+' mesi':'non basta')+' · servono '+mm)+'</ul>'; }
function fdPanel(M,p){ return fdPanel0(M,p)+(M.phase==='B'?'<button class="btn primary" data-act="pdrB" style="margin-top:10px;width:100%">Revisione PDR</button>':''); }
function fdPanel0(M,p){ const lk=fdLocked(M), maxH=Math.round(p.B.R*12), dis=lk?' disabled':'';
  let h='<div id="fdsum">'+fdSum(M,p)+'</div><h3 style="margin-top:6px">Orbite</h3><div class="orbs"><div class="orb-card"><div class="row" style="justify-content:space-between"><b><span class="dot2" style="background:#9AA6B4"></span> Orbita 0 · rilascio</b><span class="num fine">'+esc(E.LV[M.sat.lv]?E.LV[M.sat.lv].n:'lanciatore da scegliere')+'</span></div><div class="num">'+O.fmt(p.orbits[0].el)+'</div><p class="fine">'+esc(p.ini.why)+(M.sat.lv?'':' Scegli il lanciatore nell’edificio di costruzione: per ora uso il rideshare.')+'</p></div>';
  M.fd.burns.forEach((b,i)=>{ const k=i+1, o=p.orbits[k]; if(!o) return; const on=k===fdSel, last=k===M.fd.burns.length;
    h+='<div class="orb-card'+(on?' on':'')+'" data-k="'+k+'"><div class="row" style="justify-content:space-between"><button class="lnk" data-act="fdsel" data-k="'+k+'"><span class="dot2" style="background:'+(last?'#F07B3F':'#5B8DEF')+'"></span> Manovra '+k+' → orbita '+k+'</button><span class="row"><b class="num" id="fdv'+k+'">'+Math.round(o.dv)+' m/s · '+nf(p.used[k],2)+' kg</b>'+(lk?'':'<button class="x" data-act="fddel" data-k="'+k+'" aria-label="Elimina la manovra">✕</button>')+'</span></div>'+
      (on?'<div class="fdrow"><label for="fn'+k+'">Punto del burn</label><input type="range" id="fn'+k+'" min="0" max="359" step="1" value="'+Math.round(b.nu)+'" data-fd="nu" data-k="'+k+'"'+dis+'><span class="num" id="fnv'+k+'">'+apsName(b.nu)+'</span></div>'+
        '<div class="fdrow"><label for="fh'+k+'">Lato opposto</label><input type="range" id="fh'+k+'" min="30" max="'+maxH+'" step="10" value="'+Math.round(b.h)+'" data-fd="h" data-k="'+k+'"'+dis+'><input type="number" class="num" id="fhv'+k+'" min="30" max="'+maxH+'" step="10" value="'+Math.round(b.h)+'" data-fd="h" data-k="'+k+'"'+dis+'></div>'+
        '<div class="fdrow"><label for="fp'+k+'">Cambio di piano</label><input type="range" id="fp'+k+'" min="-90" max="90" step="1" value="'+Math.round(b.dp||0)+'" data-fd="dp" data-k="'+k+'"'+dis+'><span class="num" id="fpv'+k+'">'+Math.round(b.dp||0)+'°</span></div>':'')+
      '<div class="num" id="fdo'+k+'">'+O.fmt(o.el)+'</div></div>'; });
  h+='</div>'+(lk?'':'<button class="btn" data-act="fdadd">+ Nuova orbita</button><button class="lnk small" data-act="expert">← Torna alle strategie</button>')+'<p class="fine tip">Conviene accendere il motore agli apsidi, a 0° o a 180°: lì tutta la spinta va nella forma dell’orbita. I cambi di piano costano meno dove il satellite va più piano, cioè all’apocentro.</p>';
  return h; }
function fdStrat(M,p){ const lk=fdLocked(M), kg=dv=>p.wet*(1-Math.exp(-dv/(p.isp*9.80665))), tm=d=>d<1?Math.max(1,Math.round(d*24))+' ore':d<60?Math.round(d)+' giorni':Math.round(d/30)+' mesi';
  const card=(leg,o,base)=>{ const on=(M.traj||{})[leg]===o.k, dv=base*o.f; return '<button class="stg'+(on?' sel':'')+(o.off?' lock':'')+'" data-act="strat" data-leg="'+leg+'" data-k="'+o.k+'"'+(o.off||lk?' disabled':'')+'><b>'+o.n+'</b><span>'+o.s+'</span><ul class="kv"><li><span>ΔV</span><b>'+Math.round(dv)+' m/s</b></li><li><span>Propellente</span><b>'+(o.k==='ion'?'pochissimo':nf(kg(dv),2)+' kg')+'</b></li><li><span>Tempo</span><b>'+tm(o.days)+(o.delay?' · '+o.delay+' mesi senza scienza':'')+'</b></li><li><span>Rischio</span><b class="'+(o.risk?'bad':'')+'">'+(o.risk?Math.round(o.risk*100)+'% di perdere il satellite':'nessuno')+'</b></li></ul>'+(o.off?'<small class="lk">🔒 '+o.off+'</small>':'')+'</button>'; };
  let h='<div id="fdsum">'+fdSum(M,p)+'</div>';
  if(p.st.cap.length) h+='<h3>Tratto 1 · Cattura all’arrivo</h3><div class="stgs">'+p.st.cap.map(o=>card('cap',o,p.ini.cap)).join('')+'</div>';
  if(p.st.tr.length) h+='<h3>'+(p.st.cap.length?'Tratto 2':'Tratto 1')+' · Verso l’orbita di lavoro</h3><div class="stgs">'+p.st.tr.map(o=>card('tr',o,p.raw.trDv)).join('')+'</div>';
  if(p.land) h+='<h3>Atterraggio</h3><div class="result w"><b>'+esc(p.land.n)+'</b><br><span class="fine">'+(p.land.dv?p.land.dv+' m/s col motore del satellite · ':'Stadio di discesa dedicato · ')+keur(p.land.cost)+' · '+Math.round(p.land.risk*100)+'% di rischio · scienza ×'+p.land.sciK+'</span></div>';
  if(!p.st.cap.length&&!p.st.tr.length) h+='<p class="result ok">Il lanciatore ti lascia già nell’orbita giusta: nessuna manovra.</p>';
  const wk=p.work; if(wk&&wk.slider){ const bd=p.zone.band; h+='<h3>Quota di lavoro nella fascia</h3><div class="work"><input type="range" id="frac" min="0" max="100" step="5" value="'+Math.round(wk.fr*100)+'"'+(lk?' disabled':'')+' aria-label="Quota di lavoro dentro la fascia"><div class="row ends"><span>'+nf(bd[0],0)+' km</span><span>'+nf(bd[1],0)+' km</span></div>'+
    '<ul class="kv"><li><span>Orbita di lavoro</span><b id="wkO">'+O.fmt(p.final)+'</b></li><li><span>Resa scientifica</span><b id="wkQ">'+pct(wk.q)+'</b></li><li><span>Mantenimento d’orbita</span><b id="wkS">'+nf(E.skOf(M.sat),1)+' m/s al mese</b></li><li><span>ΔV del piano</span><b id="wkD">'+Math.round(p.tot)+' m/s</b></li></ul><p class="fine">'+esc(wk.why)+'.'+(wk.drag?' '+esc(wk.drag)+': più ΔV ogni mese.':'')+'</p></div>'; }
  h+='<h3>Le orbite</h3><ul class="tgl">'+p.orbits.map((o,k)=>'<li><span class="dot2" style="background:'+(k===0?'#9AA6B4':k===p.orbits.length-1?'#F07B3F':'#5B8DEF')+'"></span><span>'+(k===0?'Rilascio':'Accensione '+k)+'</span><span class="num">'+O.fmt(o.el)+'</span></li>').join('')+'</ul>';
  if(!lk) h+='<button class="lnk small" data-act="expert">Modalità esperto: disegna tu le manovre →</button>';
  if(M.phase==='B') h+='<button class="btn primary" data-act="pdrB" style="margin-top:10px;width:100%">Revisione PDR</button>';
  return h; }
function fdNums(M,p){ $('#fdsum').innerHTML=fdSum(M,p); M.fd.burns.forEach((b,i)=>{ const k=i+1, o=p.orbits[k]; if(!o) return; const s=(id,t)=>{ const e=$('#'+id); if(e) e.textContent=t; };
  s('fdv'+k,Math.round(o.dv)+' m/s · '+nf(p.used[k],2)+' kg'); s('fdo'+k,O.fmt(o.el)); s('fnv'+k,apsName(b.nu)); s('fpv'+k,Math.round(b.dp||0)+'°');
  const sv=(id,v)=>{ const e=$('#'+id); if(e&&document.activeElement!==e) e.value=Math.round(v); }; sv('fn'+k,b.nu); sv('fh'+k,b.h); sv('fhv'+k,b.h); sv('fp'+k,b.dp||0); }); }
document.addEventListener('input',e=>{ const t=e.target; if(!t.dataset||!t.dataset.fd) return; const v2=+t.value; if(!isFinite(v2)) return; setBurn(+t.dataset.k,t.dataset.fd,v2); });
document.addEventListener('change',e=>{ if(e.target.dataset&&e.target.dataset.fd) fdRefresh(true); });

/* ---------- edifici costruiti nei lotti: si entra e si fa qualcosa ---------- */
let MSEL=null, facK=null, offSec='Tutti';
function facScene(k){ const base='<svg viewBox="0 0 1000 380" preserveAspectRatio="xMidYMid slice" role="img" aria-label="'+L.BUILD[k].n+'"><rect width="1000" height="380" fill="#EEF2F6"/><rect width="1000" height="44" fill="#D3DCE6"/><polygon points="0,250 1000,250 1000,380 0,380" fill="#D9DFE6"/>';
  if(k==='factory') return base+'<rect x="80" y="232" width="840" height="34" rx="17" fill="#55657A"/><path class="belt" d="M100 249H900" stroke="#9AA9BA" stroke-width="6" stroke-dasharray="18 14"/>'+[0,1,2,3].map(i=>'<g class="box-move" style="animation-delay:'+(-i*2)+'s"><rect x="80" y="196" width="46" height="36" fill="#C9A24A" stroke="#6E5418" stroke-width="2"/></g>').join('')+
    '<g transform="translate(520 120)"><rect x="-30" y="110" width="60" height="20" fill="#7C8DA3"/><g class="arm"><rect x="-8" y="0" width="16" height="110" rx="6" fill="#F07B3F"/><g transform="translate(0 0)"><rect x="-70" y="-8" width="80" height="16" rx="6" fill="#F07B3F"/><rect x="-82" y="-14" width="16" height="28" fill="#55657A"/></g></g></g>'+
    '<rect x="70" y="70" width="230" height="90" rx="8" fill="#fff" stroke="#C9D3DD" stroke-width="3"/><text x="185" y="125" text-anchor="middle" font-family="Barlow Condensed,Arial" font-weight="700" font-size="30" fill="#1E2A3A">LINEA 1 · ×2</text></svg>';
  if(k==='ground') return base+'<rect x="80" y="70" width="840" height="160" rx="10" fill="#7FC0E8"/><path d="M80 200Q300 160 520 196T920 186V230H80z" fill="#9CC28A"/>'+'<g transform="translate(620 205)"><path d="M0 0v-70" stroke="#55657A" stroke-width="6"/><g class="dish-turn"><ellipse cx="0" cy="-90" rx="70" ry="30" fill="#F4F7FA" stroke="#55657A" stroke-width="3" transform="rotate(-25 0 -90)"/></g></g>'+
    [0,1,2].map(i=>'<rect x="'+(130+i*250)+'" y="270" width="200" height="60" rx="6" fill="#55657A"/><rect x="'+(145+i*250)+'" y="250" width="170" height="40" rx="4" fill="#0E1A2E"/><path d="M'+(155+i*250)+' 270h60M'+(155+i*250)+' 280h100" stroke="#9EE6B8" stroke-width="3"/>').join('')+'</svg>';
  if(k==='rnd') return base+'<rect x="90" y="70" width="300" height="140" rx="6" fill="#fff" stroke="#C9D3DD" stroke-width="3"/><path d="M120 110h120M120 140h200M120 170h90" stroke="#2F6FD6" stroke-width="4"/><text x="300" y="180" font-family="IBM Plex Mono,monospace" font-size="20" fill="#D2443A">p/2</text>'+
    '<rect x="470" y="230" width="420" height="20" fill="#9AA9BA"/><path d="M490 250v80M870 250v80" stroke="#7C8DA3" stroke-width="10"/><g transform="translate(560 230)"><rect x="-20" y="-10" width="40" height="10" fill="#55657A"/><path d="M0-10V-80l30-20" stroke="#55657A" stroke-width="10" fill="none"/><circle cx="34" cy="-102" r="10" fill="#1E2A3A"/></g>'+[0,1,2].map(i=>'<rect x="'+(680+i*60)+'" y="190" width="30" height="40" rx="4" fill="'+['#7C8CFF','#3CC796','#F06EAA'][i]+'" opacity=".8"/>').join('')+'</svg>';
  if(k==='office') return base+'<rect x="80" y="64" width="840" height="150" rx="8" fill="#fff" stroke="#C9D3DD" stroke-width="3"/>'+L.SPONSORS.slice(0,14).map((s,i)=>'<circle cx="'+(130+(i%7)*120)+'" cy="'+(105+Math.floor(i/7)*70)+'" r="24" fill="'+s.p[2]+'" opacity="'+(G.recruited.indexOf(s.id)>=0?1:.25)+'"/>').join('')+
    '<polygon points="330,262 670,262 760,360 240,360" fill="#B9773F" stroke="#6E4220" stroke-width="3"/></svg>';
  return base+'<rect x="420" y="70" width="160" height="40" rx="6" fill="#F07B3F"/><text x="500" y="98" text-anchor="middle" font-family="Barlow Condensed,Arial" font-weight="700" font-size="24" fill="#fff">MOSTRA</text>'+rocketSVG(160,330,1.4)+rocketSVG(840,330,1.1)+
    [0,1,2].map(i=>'<rect x="'+(300+i*150)+'" y="150" width="120" height="90" rx="6" fill="#0E1A2E" stroke="#55657A" stroke-width="4"/><circle cx="'+(360+i*150)+'" cy="195" r="22" fill="'+['#C9CED6','#3E7BD6','#C8603A'][i]+'"/>').join('')+'</svg>'; }
function vFac(v){ const k=facK, b=L.BUILD[k]; if(!k||!b){ go('hub'); return; } let body='';
  if(k==='factory'){ const c=G.missions.filter(m=>m.phase==='D'&&m.stage==='assembly'); body='<h3>In integrazione</h3>'+(c.length?'<ul class="cast">'+c.map(m=>'<li><span></span><span>'+esc(m.name)+'</span><span class="fine num">'+(now()>=m.buildEnd?'pronto':Math.ceil((m.buildEnd-now())/1000/G.speed)+' s')+'</span></li>').join('')+'</ul>':'<p class="fine">Nessun satellite in fase C. Quando ne avvii uno, la fabbrica dimezza il tempo di integrazione.</p>'); }
  if(k==='ground'){ const f=G.missions.filter(m=>m.phase==='E'||m.phase==='F'); body='<h3>Satelliti in contatto</h3>'+(f.length?'<ul class="cast">'+f.map(m=>'<li><span></span><span>'+esc(m.name)+' · '+esc(E.DEST[m.sat.dest||'moon'].n)+'</span><span class="fine num">'+(m.boost>1?'+'+Math.round((m.boost-1)*100)+'% dati':'lanciato prima')+'</span></li>').join('')+'</ul>':'<p class="fine">Nessun satellite in volo. Quelli che lanci da ora in poi scaricano il '+(20+3*dishN())+'% di dati in più.</p>')+'<h3 style="margin-top:12px">Antenne</h3><p class="fine">'+dishN()+' antenne collegate su 6. La stazione da sola vale +20% di dati; ogni antenna nel campus aggiunge +3% di dati e +5% di probabilità di riprendere il contatto radio quando il satellite tace. Le metti da «Modifica campus» → Infrastrutture.</p>'+(''); }
  if(k==='rnd') body='<h3>Probabilità di difetto per prova</h3><ul class="cast">'+L.TESTS.map(t=>'<li><span></span><span>'+L.MACH[t].n+'</span><span class="fine num">metà</span></li>').join('')+'</ul><p class="fine">Vale per i satelliti che superano la CDR da ora in poi.</p>';
  if(k==='visit'){ const ok=G.missions.filter(m=>m.result&&m.result.ok); body='<h3>In mostra</h3>'+(ok.length?ok.map(m=>'<article class="entry"><div>'+satThumb(m)+'</div><div><b>'+esc(m.name)+'</b><div class="fine">'+esc(E.DEST[m.sat.dest||'moon'].n)+' · '+m.result.sci+' scienza</div>'+(m.statement?'<p class="stmt">'+esc(m.statement)+'</p>':'')+'</div></article>').join(''):'<p class="fine">Le missioni riuscite finiscono qui, in mostra per il pubblico.</p>'); }
  if(k==='office'){ const lv=L.level(G.xp), picks=Math.max(1,lv-2)-G.recruited.length, secs=['Tutti'].concat(L.SPONSORS.map(s=>s.sec).filter((x,i,a)=>a.indexOf(x)===i));
    body='<div class="row" style="justify-content:space-between"><h2>Catalogo sponsor</h2><span class="pill'+(picks>0?' go':'')+'">'+(picks>0?'Puoi reclutarne '+picks:'Nuovo sponsor al prossimo livello')+'</span></div><p class="fine">Tutti gli sponsor del gioco. Chi recluti entra nell’elenco degli stakeholder dell’edificio amministrativo, con i suoi fondi, le sue tecnologie e le sue richieste. Uno nuovo a ogni livello.</p>'+
      '<input type="text" id="sq" placeholder="Cerca per nome, settore o tecnologia" autocomplete="off"><div class="chips" style="justify-content:flex-start">'+secs.map(s=>'<button class="chip'+(offSec===s?' on':'')+'" data-act="sec" data-k="'+s+'">'+s+'</button>').join('')+'</div><div id="slist" class="slist"></div>'; }
  const fst={dishes:dishN(),sats:G.missions.filter(m=>m.phase==='C'||(m.phase==='D'&&m.stage==='assembly')).slice(0,3).map(m=>({img:satImg(m),label:m.name})),proto:(cur()&&cur().sat&&Object.keys(cur().sat.placed).length)?satImg(cur()):null,
    logos:L.SPONSORS.slice(0,12).map(x=>({t:x.n.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase(),c:x.p[2],on:G.recruited.indexOf(x.id)>=0})),visit:0};
  fst.sats=k==='visit'?G.missions.filter(m=>m.result&&m.result.ok).slice(-5).map(m=>({img:satImg(m),label:m.name})):fst.sats;
  v.innerHTML='<div class="head"><div><h3>Campus · edificio costruito</h3><h1>'+b.n+'</h1></div><p>'+b.s+'</p></div>'+stage('<section class="room3 fsc" style="--ar:1000/620"><svg viewBox="'+IR.view+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+esc(b.n)+'">'+IR.fac(k,fst)+'</svg></section>','rbx')+docks(null,'<div class="panel">'+body+'</div>'); scn(v,{R:1,railR:[{ic:k==='office'?'🤝':'📋',t:k==='office'?'Sponsor':'Dettagli',side:'R'}]});
  if(k==='office') renderSponsors(); }
function renderSponsors(){ const el=$('#slist'); if(!el) return; const q=($('#sq')?$('#sq').value:'').trim().toLowerCase(), lv=L.level(G.xp), picks=Math.max(1,lv-2)-G.recruited.length;
  const gv=s=>L.SPEC[s.id]?'carte di '+L.SPEC[s.id].toLowerCase()+' un livello prima':'';
  const list=L.SPONSORS.filter(s=>(offSec==='Tutti'||s.sec===offSec)&&(!q||(s.n+' '+s.k+' '+s.sec+' '+gv(s)+' '+s.req.t).toLowerCase().indexOf(q)>=0));
  el.innerHTML=list.length?list.map(s=>{ const got=G.recruited.indexOf(s.id)>=0; return '<article class="spc'+(got?' got':'')+'"><span class="emb" style="background:'+s.p[2]+'">'+s.n.split(' ').map(w=>w[0]).join('').slice(0,2)+'</span><div><b>'+esc(s.n)+'</b><div class="fine">'+esc(s.k)+' · '+esc(s.sec)+' · '+keur(Math.round(s.fund*.35/10)*10)+'</div><div class="fine">'+(gv(s)?'Porta: '+esc(gv(s))+' · ':'')+'Chiede: '+esc(s.req.t)+'</div></div>'+
    (got?'<span class="pill">Nel roster</span>':'<button class="btn small primary" data-act="recruit" data-k="'+s.id+'"'+(picks>0?'':' disabled')+'>Recluta</button>')+'</article>'; }).join(''):'<p class="fine">Nessuno sponsor trovato.</p>'; }
document.addEventListener('input',e=>{ if(e.target.id==='sq') renderSponsors(); });

/* ---------- omini senza volto che camminano tra gli edifici ---------- */
const ROUTES=[[[3.6,5.9],[3.6,8],[8,8],[8,4.7],[11.4,4.7]],[[6.2,3.3],[6.4,8],[8,8],[8,11.2],[12,11.2]],[[3.3,12.3],[3.3,8],[8,8],[12.6,8],[12.6,11.2]],[[11.6,4.7],[8,4.7],[8,8],[4,8],[4,10]],[[6.6,3.3],[8,3.3],[8,8],[3.4,8],[3.4,5.9]],[[13,11.2],[13,8],[8,8],[8,3.4],[6.4,3.3]],[[1,8],[8,8],[16,8]],[[8,0],[8,16]]];
function walkers(){ const cols=['#F07B3F','#2F6FD6','#22A87A','#D9478F','#E0A100','#8A55D0','#3B6FD8','#C2410C'];
  return ROUTES.map((r,i)=>{ const pth='M'+r.map(p=>ip(p[0],p[1],0).map(n=>n.toFixed(1)).join(' ')).join('L'), dur=22+i*4;
    return '<g class="walker"><g><animateMotion dur="'+dur+'s" begin="'+(-i*3.1)+'s" repeatCount="indefinite" keyPoints="0;1;1;0;0" keyTimes="0;.46;.5;.96;1" calcMode="linear" path="'+pth+'"/>'+
      '<ellipse cx="0" cy="1" rx="5" ry="2" fill="#000" opacity=".18"/><g class="legs"><path d="M-2 0v-7M2 0v-7" stroke="#8A97A6" stroke-width="2.2" stroke-linecap="round"/></g><path d="M-4.5-6c0-6 2-9 4.5-9s4.5 3 4.5 9z" fill="#E9EDF2" stroke="#9AA7B6"/><path d="M-3-12h6v3h-6z" fill="'+cols[i%8]+'"/><ellipse cx="0" cy="-18" rx="3.6" ry="4.2" fill="#F6F8FA" stroke="#9AA7B6"/></g></g>'; }).join(''); }

function vYard(v,M){ const cats=['ray','avi','bat','com','adcs','nav','prop','pwr','rob','eol'], d=M.sat, vis=id=>L.techOK(M,id,d.ride);
  const phLbl=M.phase==='C'?'Fase C · progetto congelato':'Fase B · progetto';
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione · '+phLbl+'</h3><h1>'+(M.phase==='C'?'Verifica ':'Progetta ')+esc(M.name)+'</h1></div><p>Trascina i pezzi dentro la struttura e rispetta i requisiti che hai accettato al tavolo.</p></div>'+
    '<div class="yard"><aside class="panel shelf"><h2>Magazzino pezzi</h2>'+cats.filter(c=>Object.keys(P).some(id=>P[id].cat===c&&vis(id))).map(c=>'<div><h3 style="margin-bottom:6px">'+E.CATS[c].n+'</h3><div class="tiles">'+Object.keys(P).filter(id=>P[id].cat===c&&vis(id)).map(id=>tileHTML(id,P[id],d)).join('')+'</div></div>').join('')+'</aside>'+
    '<section class="stage"><div id="satw" style="width:100%;display:grid;place-items:center"></div><div class="chips" id="sols"></div><div class="info" id="info"></div></section>'+
    '<aside class="panel"><div class="gauges" id="gauges"></div><div><h3 style="margin-bottom:6px">Requisiti</h3><ul class="reqs" id="breq"></ul></div>'+(M.phase==='C'?'<button class="btn primary" data-act="pdr">Revisione CDR · compra i pezzi</button>':'<button class="btn primary" data-act="bstep" data-k="orb">Avanti: orbite in dettaglio →</button>')+'</aside></div><div id="riskw" style="margin-top:14px"></div>';
  bRefresh(); }
function gauge(icon,label,have,lim,txt,soft){ const r=lim?have/lim:0, ok=have<=lim+1e-9, cls=ok?(r>.92?'tight':'ok'):(soft?'tight':'bad');
  return '<div class="gauge '+cls+'"><div class="g-top"><span class="g-l">'+ico(icon)+label+'</span><span class="g-v">'+txt+'</span></div><div class="g-bar"><s></s><i style="width:'+Math.max(.02,Math.min(1.25,r))*80+'%"></i><b></b></div></div>'; }
const GPREV={};

/* ---------- dati e comunicazioni ---------- */
const DATAG={Scientifica:[0.3,1],Osservazione:[1.5,1.6],Telescopio:[1.2,1.6],Superficie:[0.8,1],Dimostrazione:[0.2,1],Telecomunicazioni:[0,1]};
function payData(id){ const t=P[id]&&P[id].db; if(!t) return 0; const m=String(t.mis||'').split(';')[0].trim(), g=DATAG[m]||[0.5,1]; return g[0]*Math.pow(Math.max(1,+t.sv||1),g[1]); }
function radioRef(t){ const s=(t.n||'')+' '+(t.code||''); if(/profondo|Vulcan|DSTX/i.test(s)) return 4e8; if(/Ka\b|banda X|XBAND/i.test(s)) return 4e6; return (+t.sv||0)<=20?3000:40000; }
function linkDist(M){ const dest=M.sat.dest||'leo'; if(dest==='moon') return 384400; if(dest==='mars') return 2.25e8; if(dest==='venus') return 1.6e8; const h=(M.drm&&typeof drmStarH==='function'&&drmStarH(M))||null, b=O.zoneOf(M).band; return h||(b?Math.sqrt(b[0]*b[1]):550); }
function contactMin(M){ const dest=M.sat.dest||'leo', z=(O.zoneOf(M)||{}).k; const base=dest!=='leo'?480:z==='high'?1200:z==='med'?300:30; return base*(hasB('ground')?1.5:1)*(1+.1*dishN()); }
function dataBud(M,d){ d=d||M.sat; const pid=d.placed.ray&&d.placed.ray.id, rid=d.placed.com&&d.placed.com.id, t=rid&&P[rid]?P[rid].db:null, gen=pid?payData(pid):0, dist=linkDist(M), ref=t?radioRef(t):1, rate=t?(+t.sv||0)*Math.min(1,Math.pow(ref/Math.max(dist,1),2)):0, cmin=contactMin(M), down=rate*cmin*60/8/1000;
  return {gen,down,rate,cmin,dist,ok:down>=gen-1e-9,k:gen>0?Math.min(1,down/gen):1}; }
const mbf=x=>x>=1000?nf(x/1000,1)+' GB':x>=10?nf(x)+' MB':nf(x,x<1?2:1)+' MB';
/* ---------- capacità dei lanciatori (kg nell'orbita di rilascio) ---------- */
const LVCAP={RS:{low:30,med:18,high:12},HOME:{low:20,med:8,high:4},MOON:{x:25},LANDER:{x:15},MARS:{x:30}};
function lvCap(M,k){ const c=LVCAP[k||M.sat.lv]; if(!c) return Infinity; if(c.x!=null) return c.x; const z=(O.zoneOf(M)||{}).k||'low'; return c[z]!=null?c[z]:c.low; }
/* ---------- difficoltà e modalità libera ---------- */
const DIFF={facile:{n:'Facile',money:1.6,inst:1.2,dk:.6,s:'Più soldi, rate più alte, meno guasti'},normale:{n:'Normale',money:1,inst:1,dk:1,s:'L’esperienza pensata per il gioco'},difficile:{n:'Difficile',money:.7,inst:.85,dk:1.4,s:'Budget stretto e più difetti nascosti'}};
const dif=()=>DIFF[(G&&G.diff)||'normale']||DIFF.normale;
let WDIFF='normale';
{ const inst0=L.installment; L.installment=function(M,ph){ return Math.round(inst0(M,ph)*dif().inst); }; }
/* ---------- resoconto scaricabile e confronto ---------- */
async function saveFile(name,text){ let d=null; try{ if(window.claude&&window.claude.use) d=await Promise.race([window.claude.use('downloads'),new Promise(r=>setTimeout(()=>r(null),3000))]); }catch(e){ d=null; }
  if(d){ try{ await d.save({filename:name,data:text}); toast('File pronto: '+name); }catch(e){ if(!e||e.code!=='declined') toast('Il download non è disponibile in questa vista.'); } return; }
  try{ const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/html'})); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },500); toast('File scaricato: '+name); }catch(e){ toast('Il download non è disponibile qui.'); } }
function missionFacts(m){ const d=m.sat, b=E.budget(d), db=dataBud(m), lv=E.LV[d.lv], r=m.result, p=O.plan(m);
  return [['Tipo',O.TYPES[m.type||'sci'].n],['Destinazione',zoneName(m)],['Satellite',E.RIDES[d.ride]?E.RIDES[d.ride].n:'—'],['Lanciatore',lv?lv.n:'—'],['Orbita di lavoro',m.drm&&!drmLand(m)?drmKm(drmStarH(m)||0):p.land?'sul suolo':O.fmt(p.final)],
    ['Massa',nf(b.wet,1)+' / '+Math.min(b.massLim,lvCap(m))+' kg'],['Potenza',nf(b.demand,1)+' / '+nf(b.gen,1)+' W'],['Costo',keur(b.cost)],['Dati',mbf(db.gen)+' prodotti · '+mbf(db.down)+' scaricati al giorno'],['ΔV del piano',Math.round(p.tot)+' / '+Math.round(p.dvAvail)+' m/s'],
    ['Durata',(r?r.months:m.duration||'—')+' mesi'],['Scienza',r?String(r.sci):'—'],['Esito',r?(r.ok?'Riuscita':'Non riuscita'):phn(m)]]; }
function reportHTML(M){ const f=missionFacts(M), mp=M.result?mcrParts(M):null, parts=Object.keys(M.sat.placed).map(c=>P[M.sat.placed[c].id]).filter(Boolean);
  const css='body{font:15px/1.5 system-ui,-apple-system,Segoe UI,Arial,sans-serif;color:#1E2A3A;background:#F3F6F9;margin:0;padding:24px}main{max-width:900px;margin:auto;background:#fff;border-radius:16px;padding:28px;box-shadow:0 4px 20px rgba(0,0,0,.08)}h1{font-size:28px;margin:0}h2{font-size:16px;text-transform:uppercase;letter-spacing:.08em;color:#5F6E80;margin:24px 0 8px}table{border-collapse:collapse;width:100%}td{padding:6px 8px;border-bottom:1px solid #E3E8ED;vertical-align:top}td:first-child{color:#5F6E80;width:38%}.num{font-family:ui-monospace,Menlo,monospace}.chain{display:grid;gap:8px}.chn{display:grid;grid-template-columns:1fr 20px 1.3fr 20px 1fr;gap:4px}.chn>div{border:1px solid #E3E8ED;border-radius:8px;padding:6px 8px;font-size:13px}.chn small{display:block;color:#5F6E80;font-size:11px;text-transform:uppercase}.bad{color:#B23A2C}.good{color:#1F7A44}.drm{border:1px solid #E3E8ED;border-radius:10px;overflow:hidden}.drm svg{display:block;width:100%;height:auto}table.pay td:last-child{text-align:right}footer{margin-top:24px;color:#8D99A6;font-size:12px}';
  return '<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Resoconto '+esc(M.name)+'</title><style>'+css+'</style></head><body><main><p style="color:#5F6E80;margin:0">Go No-Go · resoconto di missione · '+esc(G.co||'')+'</p><h1>'+esc(M.name)+'</h1>'+(M.statement?'<p><i>'+esc(M.statement)+'</i></p>':'')+
    '<h2>Profilo della missione</h2>'+(M.drm?'<div class="drm"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 600">'+drmSVG(M,{H:600})+'</svg></div>':'')+
    '<h2>Numeri chiave</h2><table>'+f.map(x=>'<tr><td>'+esc(x[0])+'</td><td class="num">'+esc(x[1])+'</td></tr>').join('')+'</table>'+
    '<h2>Satellite</h2><table>'+parts.map(o=>'<tr><td>'+esc(o.n)+'</td><td class="num">'+nf(o.m||0,2)+' kg · '+nf(o.p||0,1)+' W · '+keur(o.c||0)+' · TRL '+o.trl+'</td></tr>').join('')+'</table>'+
    '<h2>Requisiti</h2><table>'+M.reqs.map(x=>{ const q=L.R(x.id); return '<tr><td>'+esc(x.code)+'</td><td>'+esc(q?q.t:'')+(M.waived.indexOf(x.id)>=0?' <span class="bad">(deroga)</span>':'')+'</td></tr>'; }).join('')+'</table>'+
    (mp?'<h2>Risultato</h2><p>'+mp.head+' Scienza '+M.result.sci+'.</p>'+mp.money+mp.why:'<h2>Risultato</h2><p>Missione non ancora conclusa ('+phn(M)+').</p>')+'<footer>Creato con Go No-Go · NASA Space Apps Challenge 2026 Torino</footer></main></body></html>'; }
function cmpModal(a,b){ const ms=G.missions; if(ms.length<2){ toast('Servono almeno due missioni da confrontare.'); return; } a=a==null?0:a; b=b==null?Math.min(1,ms.length-1):b;
  const opt=sel=>ms.map((m,i)=>'<option value="'+i+'"'+(i===sel?' selected':'')+'>'+esc(m.name)+'</option>').join(''), fa=missionFacts(ms[a]), fb=missionFacts(ms[b]), el=$('#ov');
  el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true"><h3>Confronto</h3><h2>Due progetti a confronto</h2><p class="fine">Missioni diverse possono raggiungere lo stesso obiettivo con scelte diverse.</p><div class="cmp"><div></div><select id="cmpa">'+opt(a)+'</select><select id="cmpb">'+opt(b)+'</select>'+
    fa.map((x,i)=>'<div class="ck">'+esc(x[0])+'</div><div class="num">'+esc(x[1])+'</div><div class="num">'+esc(fb[i][1])+'</div>').join('')+'</div><div class="row"><button class="btn primary" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false;
  const ch=()=>cmpModal(+$('#cmpa').value,+$('#cmpb').value); $('#cmpa').onchange=ch; $('#cmpb').onchange=ch; }
/* ---------- pannello delle risorse in sala controllo ---------- */
function spark(vals,o){ const W=260,H=64, mx=o.max!=null?o.max:Math.max(1e-9,...vals), mn=o.min||0, n=Math.max(2,vals.length), X=i=>4+i*(W-8)/(n-1), Y=v=>H-6-(H-14)*(v-mn)/Math.max(1e-9,mx-mn);
  let d=vals.map((v,i)=>(i?'L':'M')+X(i).toFixed(1)+' '+Y(v).toFixed(1)).join('');
  return '<svg viewBox="0 0 '+W+' '+H+'" class="spk" aria-hidden="true"><path d="M4 '+(H-6)+'H'+(W-4)+'" stroke="#2E4152"/>'+(o.lim!=null?'<path d="M4 '+Y(o.lim).toFixed(1)+'H'+(W-4)+'" stroke="#CF5E4C" stroke-dasharray="4 4"/>':'')+'<path d="'+d+'" fill="none" stroke="'+(o.col||'#7FD3EA')+'" stroke-width="2.2"/>'+(o.mark!=null?'<circle cx="'+X(o.mark).toFixed(1)+'" cy="'+Y(vals[Math.max(0,Math.min(vals.length-1,Math.round(o.mark)))]).toFixed(1)+'" r="4" fill="#F07B3F" stroke="#fff"/>':'')+'</svg>'; }
function dashHTML(M,fl){ if(!M||!M.launchAt) return '<p class="fine">Le risorse si vedono dal lancio in poi.</p>'; const b=E.budget(M.sat), db=dataBud(M), p=O.plan(M), dur=Math.max(1,M.duration||12), mo=Math.min(dur,fl?fl.mo:0);
  const T=now()/1000, ph=(T/20)%1, ecl=.36, dod=Math.max(0,Math.min(1,b.dod||0)), soc=[]; for(let i=0;i<=60;i++){ const t=(i/20)%1; soc.push(t<ecl?100-dod*100*(t/ecl):100-dod*100*Math.max(0,1-(t-ecl)/(1-ecl)*1.6)); }
  const sk=E.skOf(M.sat), kgpm=p.isp?p.wet*(1-Math.exp(-sk/(p.isp*9.81))):0, k0=Math.max(0,(p.propKg||0)-(p.usedKg||0)), prop=[]; for(let m=0;m<=dur;m++) prop.push(Math.max(0,k0-kgpm*m));
  const back=[]; let acc=0; for(let m=0;m<=dur;m++){ back.push(acc); acc+=Math.max(0,db.gen-db.down)*30; }
  return '<div class="panel dash"><h3>Risorse di bordo</h3>'+
    '<div class="dsh"><b>Batteria in un’orbita</b><span class="num">'+(dod>0?'scende al '+Math.round(100-dod*100)+'% in eclisse':'nessuna eclisse')+'</span>'+spark(soc,{min:0,max:100,lim:20,col:'#9EE6B8',mark:ph*20})+'</div>'+
    '<div class="dsh"><b>Dati al giorno</b><span class="num">'+mbf(db.gen)+' prodotti · '+mbf(db.down)+' scaricati</span><div class="dbar"><i style="width:'+Math.round(db.k*100)+'%"></i></div><span class="fine">'+(db.ok?'Tutti i dati arrivano a terra.':'Arriva a terra solo il '+pct(db.k)+' dei dati: il resto si perde.')+'</span>'+(db.ok?'':spark(back,{col:'#F2A36F',mark:mo}))+'</div>'+
    '<div class="dsh"><b>Propellente</b><span class="num">'+(k0>0?nf(Math.max(0,k0-kgpm*mo),2)+' kg rimasti':'nessun propulsore')+'</span>'+(k0>0?spark(prop,{min:0,col:'#7FD3EA',mark:mo}):'')+'</div></div>'; }

function bRefresh(){ const M=cur(), d=M.sat; d.stake=M.stake; const cash=G.money+(M.lvPaid||0)+(M.partsCredit||0), st=L.status(M,d,cash), b=st.b, Lx=b.L, need=L.transferNeed(d)+27+E.skOf(d)*L.minMonths(M);
  if($('#sat3w')) S3.update(d,{live:true,sel,keepCam:true}); else $('#satw').innerHTML=satSVG(d,{id:'sat',live:true});
  if(false) $('#rides').innerHTML=Object.keys(E.RIDES).map(k=>{ const R=E.RIDES[k], un=true; return '<button class="chip'+(d.ride===k?' on':'')+(un?'':' lock')+'" data-act="ride" data-k="'+k+'">'+R.n+' <small>'+R.c+' cr</small></button>'; }).join('');
  if($('#sols')) $('#sols').innerHTML=L.availSol(M,d.ride).map(k=>{ const o=E.SOLAR[k]; return '<button class="chip'+(d.sol===k?' on':'')+'" data-act="sol" data-k="'+k+'" title="TRL '+o.trl+' · '+esc(o.db.ente)+'">'+esc(o.n)+' <small>'+nf(o.gen)+' W · '+keur(o.c)+'</small></button>'; }).join('');
  if($('#ptiles')) shelfMarks(); else $$('.tile').forEach(t=>{ const id=t.dataset.id, pl=P[id]&&d.placed[P[id].cat]; t.classList.toggle('on',!!pl&&pl.id===id); });
  $$('#accs .chip').forEach(c=>c.classList.toggle('on',!!d.acc[c.dataset.k]));
  $('#gauges').innerHTML=gauge('mass','Massa',b.wet,b.massLim,nf(b.wet)+' / '+b.massLim+' kg')+gauge('pow','Potenza',b.demand,b.gen,nf(b.demand)+' / '+b.gen+' W')+gauge('bat','Eclisse',b.dod,1,b.wh?'scarica al '+pct(b.dod)+' · max 100%':'manca la batteria')+
    (!d.placed.prop&&(d.planDv||0)<=1?gauge('fuel','ΔV',0,1,'nessuna manovra: non serve propulsione',true):gauge('fuel','ΔV',need,Math.max(1,b.fuel),nf(b.fuel,0)+' m/s · servono '+nf(need,0),true))+gauge('coin','Costo',costDue(M),Math.max(1,G.money),keur(costDue(M))+' / '+keur(G.money)+(M.lvPaid?' (lancio già pagato)':'')+(M.partsCredit?' (pezzi già comprati: −'+keur(M.partsCredit)+')':''));
  $('#breq').innerHTML=st.list.filter(x=>!x.base||!x.ok).map(x=>'<li><span class="c">'+(x.base?'BASE':x.code)+'</span><span>'+esc(x.t)+(x.kind==='tests'?' <span class="fine">(in fase D)</span>':'')+'</span><span class="mk '+(x.waived?'w':x.ok||x.kind==='tests'||x.kind==='months'?'y':'n')+'">'+(x.waived?'D':x.ok||x.kind==='tests'||x.kind==='months'?'✓':'✕')+'</span></li>').join('')||'<li><span></span><span>Tutto in regola.</span><span class="mk y">✓</span></li>';
  { const dbb=dataBud(M,d), cap=lvCap(M); $('#gauges').insertAdjacentHTML('beforeend',gauge('com','Dati',dbb.gen,dbb.down,dbb.gen?mbf(dbb.gen)+' / '+mbf(dbb.down)+' al giorno':'nessun payload')+(cap<b.massLim?'<p class="fine">Il lanciatore porta al massimo <b>'+cap+' kg</b> in quest’orbita.</p>':'')); }
  if(d.placed.prop){ const pr=P[d.placed.prop.id], cur0=d.tank||1, alt=k=>E.budget(Object.assign({},d,{tank:k})); $('#gauges').insertAdjacentHTML('beforeend','<div class="tankr"><span class="tl">Serbatoio</span>'+[[1,'Standard'],[2,'Grande ×2'],[3,'Extra ×3']].map(([k,n])=>{ const bb=alt(k); return '<button class="'+(cur0===k?'on':'')+'" data-act="tank" data-k="'+k+'"><b>'+n+'</b><small>'+nf(pr.propM*k,2)+' kg · '+nf(bb.fuel,0)+' m/s</small></button>'; }).join('')+'</div>'); }
  $$('#gauges .gauge').forEach(g=>{ const k=g.querySelector('.g-l').textContent, v=g.querySelector('.g-v').textContent; if(GPREV[k]!=null&&GPREV[k]!==v){ g.classList.remove('bump'); void g.offsetWidth; g.classList.add('bump'); } GPREV[k]=v; });
  const np=Object.keys(d.placed).length; if(bRefresh.np!=null&&np>bRefresh.np){ const w=$('#sat3w'); if(w){ w.classList.remove('snap'); void w.offsetWidth; w.classList.add('snap'); } } bRefresh.np=np;
  const cu=culprits(M,st); $$('#ptiles .tile.culprit').forEach(t=>t.classList.remove('culprit')); cu.forEach(c=>{ const t=$('#ptiles .tile[data-id="'+d.placed[c.cat].id+'"]'); if(t) t.classList.add('culprit'); });
  if($('#sat3w')&&!drag) S3.highlight([].concat(...cu.map(c=>E.cellsOf(d.placed[c.cat],d.ride))),false);
  const wy=$('#why3d'); if(wy) wy.innerHTML=cu.slice(0,2).map(c=>'<span>✕ '+esc(P[d.placed[c.cat].id].n)+' → '+esc(c.why)+'</span>').join('');
  $('#riskw').innerHTML=riskBtn(M); infoLine(Lx); }
function culprits(M,st){ const d=M.sat, out=[], seen={}; if(M.tut) return out;
  st.list.filter(x=>!x.ok&&x.id&&x.kind==='design').forEach(x=>{ const r=L.R(x.id); if(!r||!r.chk) return;
    Object.keys(d.placed).forEach(c=>{ if(seen[c]) return; const cur0=d.placed[c]; const alts=L.availCat(M,c,d.ride).filter(id=>id!==cur0.id).slice(0,8);
      for(const id of alts){ const d2=Object.assign({},d,{placed:Object.assign({},d.placed,{[c]:Object.assign({},cur0,{id})})}); let ok=false; try{ ok=!!r.chk(d2,E.budget(d2),M); }catch(e){} if(ok){ seen[c]=1; out.push({cat:c,why:x.code+' '+r.t}); break; } } }); });
  const ck=E.checks(d).list, bad=k=>ck.some(x=>x.k===k&&!x.ok), pl=Object.keys(d.placed).filter(c=>P[d.placed[c].id]);
  if(bad('mass')&&pl.length){ const c=pl.sort((a,b)=>(P[d.placed[b].id].m||0)-(P[d.placed[a].id].m||0))[0]; if(!seen[c]){ seen[c]=1; out.push({cat:c,why:'troppa massa: è il pezzo più pesante'}); } }
  if(bad('pow')&&pl.length){ const c=pl.slice().sort((a,b)=>(P[d.placed[b].id].p||0)-(P[d.placed[a].id].p||0))[0]; if(!seen[c]){ seen[c]=1; out.push({cat:c,why:'potenza: è il pezzo che consuma di più'}); } }
  if(bad('bat')&&d.placed.bat&&!seen.bat){ out.push({cat:'bat',why:'eclisse: la batteria non basta'}); }
  { const dbb=dataBud(M,d); if(!dbb.ok&&d.placed.com&&!seen.com) out.push({cat:'com',why:'la radio scarica solo il '+pct(dbb.k)+' dei dati'}); }
  return out; }
function infoLine(Lx){ const el=$('#info'); if(!el) return; const d=cur().sat, pl=sel&&d.placed[sel];
  if(!pl){ el.innerHTML='<span class="fine">Tocca un pezzo del magazzino per montarlo, poi trascinalo. Il mirino è il baricentro: tienilo sulla linea dell’ugello.</span>'; return; }
  const p=P[pl.id], f=Lx.parts[sel], t=p.db||{}; el.innerHTML='<div><b>'+esc(p.n)+'</b> <span class="fine">TRL '+p.trl+' · '+esc(t.ente||'')+'</span><div class="fine num">'+nf(p.m+(p.propM||0))+' kg '+(t.om||'')+' · '+nf(p.p)+' W '+(t.op||'')+' · '+keur(p.c)+' '+(t.oc||'')+' · '+nf(p.U)+' U'+(p.wh?' · '+p.wh+' Wh':'')+(p.isp?' · Isp '+p.isp+' s':'')+(p.rate?' · '+nf(p.rate,0)+' kbps':'')+(p.pt!=null?' · puntamento '+nf(p.pt,3)+'°':'')+'</div><div class="fine">'+esc(t.scopo||'')+(t.link?' · <a href="'+t.link+'" target="_blank" rel="noopener">scheda TechPort</a>':'')+'</div>'+
    (f.ok?(f.cold?'<div class="fine">'+(f.heater?'Riscaldatore acceso.':f.near?'Scaldato dal vicino.':'Al freddo in eclisse: mettilo accanto a computer o radio, o scaldalo.')+'</div>':''):'<div class="why">'+f.why+'</div>')+'</div>'+
    '<div class="row"><button class="btn small" data-act="rot">'+ico('rot')+' Ruota</button>'+(f.cold?'<button class="btn small" data-act="heat">'+ico('heat')+(d.heat[sel]?' Togli':' Scalda')+'</button>':'')+'<button class="btn small" data-act="del">Togli</button>'+'</div>'; }
function place(id,pl){ const d=cur().sat; unfresh(id); if(!pl){ toast('Non c’è spazio: sposta o togli qualcosa.'); sfx.bad(); return false; } d.placed[P[id].cat]=pl; sel=P[id].cat; sfx.put(); return true; }
let drag=null;
function cellAt(e){ if($('#sat3w')) return S3.cellAt(e.clientX,e.clientY); const svg=$('#sat'); if(!svg) return null; const r=svg.getBoundingClientRect(), G2=geom(cur().sat), k=G2.w/r.width; return {x:Math.floor(((e.clientX-r.left)*k-G2.ox)/CELL), y:Math.floor(((e.clientY-r.top)*k-G2.oy)/CELL), px:CELL/k, in:e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom}; }
function ghostHTML(id,rot,px){ const sh=E.shape(id,rot,cur().sat.ride), w=Math.max.apply(null,sh.map(c=>c[0]))+1, h=Math.max.apply(null,sh.map(c=>c[1]))+1; return '<svg width="'+w*px+'" height="'+h*px+'" viewBox="0 0 '+w+' '+h+'">'+sh.map(c=>'<rect x="'+(c[0]+.04)+'" y="'+(c[1]+.04)+'" width=".92" height=".92" fill="var(--c-'+P[id].cat+')"/>').join('')+'</svg>'; }
function dragHL(){ if($('#sat3w')&&drag){ const d=cur().sat, ok=E.fits(d,drag.id,drag.cx,drag.cy,drag.rot); S3.highlight(drag.over?E.shape(drag.id,drag.rot,d.ride).map(c=>[c[0]+drag.cx,c[1]+drag.cy]):[],ok); if(drag.g) drag.g.style.display=drag.over?'none':''; return; } const g=$('#hl'); if(!g||!drag) return; const d=cur().sat, G2=geom(d), ok=E.fits(d,drag.id,drag.cx,drag.cy,drag.rot);
  g.innerHTML=drag.over?E.shape(drag.id,drag.rot,d.ride).map(c=>{ const x=c[0]+drag.cx, y=c[1]+drag.cy; return (x<0||y<0||x>=G2.R.cols||y>=G2.R.rows)?'':'<rect class="hl'+(ok?'':' no')+'" x="'+(G2.ox+x*CELL+2)+'" y="'+(G2.oy+y*CELL+2)+'" width="'+(CELL-4)+'" height="'+(CELL-4)+'"/>'; }).join(''):''; }
const yardOn=M=>!!M&&(M.phase==='C'||(M.phase==='B'&&M.stage==='sat'));
document.addEventListener('pointerdown',e=>{ if(view!=='build'||!yardOn(cur())) return; if(e.target.closest('[data-heat]')) return;
  const part=e.target.closest('#sat .part'), tile=e.target.closest('.tile'); if(!part&&!tile) return; const d=cur().sat;
  if(tile){ const id=tile.dataset.id; if(!P[id]) return; const sh=E.shape(id,0,d.ride), w=Math.max.apply(null,sh.map(c=>c[0])), h=Math.max.apply(null,sh.map(c=>c[1])); drag={id,rot:0,from:'shelf',ox:Math.floor(w/2),oy:Math.floor(h/2),sx:e.clientX,sy:e.clientY,moved:false,touch:e.pointerType==='touch'}; }
  else { const cat=part.dataset.cat, pl=d.placed[cat], c=cellAt(e); drag={id:pl.id,rot:pl.rot,from:'grid',cat,ox:c.x-pl.x,oy:c.y-pl.y,sx:e.clientX,sy:e.clientY,moved:false}; e.preventDefault(); } });
document.addEventListener('pointermove',e=>{ if(!drag) return; if(!drag.moved){ if(Math.hypot(e.clientX-drag.sx,e.clientY-drag.sy)<7||(drag.from==='shelf'&&drag.touch)) return; drag.moved=true; const g=document.createElement('div'); g.className='ghost'; document.body.appendChild(g); drag.g=g; }
  const c=cellAt(e); if(!c) return; drag.cx=c.x-drag.ox; drag.cy=c.y-drag.oy; drag.over=c.in; drag.g.innerHTML=ghostHTML(drag.id,drag.rot,c.px); drag.g.style.left=(e.clientX-(drag.ox+.5)*c.px)+'px'; drag.g.style.top=(e.clientY-(drag.oy+.5)*c.px)+'px'; dragHL(); });
function endDrag(cancel){ if(!drag) return; const g=drag; drag=null; if(g.g) g.g.remove(); if(view!=='build') return; const d=cur().sat, cat=P[g.id].cat; if(cancel){ bRefresh(); return; }
  if(!g.moved){ if(g.from==='shelf'){ const c0=d.placed[cat]; if(c0&&c0.id===g.id) sel=cat; else { delete d.placed[cat]; const tp=cur().tut&&TUT.layout[cat]&&TUT.layout[cat].id===g.id?TUT.layout[cat]:null; if(!place(g.id,tp&&E.fits(d,g.id,tp.x,tp.y,tp.rot)?Object.assign({},tp):E.autoPlace(d,g.id,0))&&c0) d.placed[cat]=c0; } } else { sel=sel===g.cat?null:g.cat; sfx.tap(); } bRefresh(); return; }
  if(g.over&&E.fits(d,g.id,g.cx,g.cy,g.rot)) place(g.id,{id:g.id,x:g.cx,y:g.cy,rot:g.rot}); else if(!g.over&&g.from==='grid'){ delete d.placed[cat]; delete d.heat[cat]; sel=null; } else if(g.over) sfx.bad(); bRefresh(); }
document.addEventListener('pointerup',()=>endDrag(false)); document.addEventListener('pointercancel',()=>endDrag(true));
function rotateSel(){ if(drag&&drag.moved){ drag.rot=(drag.rot+1)&3; dragHL(); return; } const d=cur().sat, pl=sel&&d.placed[sel]; if(!pl) return;
  for(let r=1;r<4;r++){ const rot=(pl.rot+r)&3; for(const o of [[0,0],[-1,0],[0,-1],[1,0],[0,1],[-1,-1],[-2,0],[0,-2]]) if(E.fits(d,pl.id,pl.x+o[0],pl.y+o[1],rot)){ d.placed[sel]={id:pl.id,x:pl.x+o[0],y:pl.y+o[1],rot}; sfx.put(); bRefresh(); return; } } sfx.bad(); toast('Non c’è spazio per ruotarlo qui.'); }
function cleanStations(){ const SZ={S3:1.5,S6:1.9,S12:2.2}, cols=['#45A9A3','#EB7D44'], out=[null,null];
  G.missions.filter(m=>m.phase==='D'&&m.stage==='assembly'&&!m.asmWait).forEach(m=>{ let i=m.station; if(i==null||out[i]) i=out[0]?1:0; if(out[i]) return; m.station=i; const p=Math.min(1,1-(m.buildEnd-now())/(m.buildDur||L.TIME.build)), nc=Object.keys(m.sat.placed).length, n=Math.max(1,Math.ceil(Math.max(0,p)*nc));
    out[i]={id:m.id,label:m.name+' · '+(p>=1?'pronto ✓':pct(Math.max(0,p))),size:SZ[m.sat.ride]||1.5,n:Math.max(1,Math.min(5,Math.ceil(p*5))),col:cols[i],img:satImg(m,p>=1?nc:n)}; }); return out; }
function vCleanroom(v,M){ const A=G.missions.filter(m=>m.phase==='D'&&m.stage==='assembly'&&!m.asmWait);
  v.innerHTML='<div class="head"><div><h3>Edificio di costruzione · Fase D</h3><h1>Camera bianca</h1><div class="rtabs"><button class="btn small" data-act="broom" data-k="build">Officina</button><button class="btn small on" data-act="broom" data-k="clean">Camera bianca</button></div></div><p>'+(A.length?A.length+(A.length>1?' satelliti in assemblaggio, in parallelo.':' satellite in assemblaggio.')+' Tocca una postazione per vedere a che punto è; quando è pronto, toccalo per portarlo al laboratorio.':'Nessun satellite in assemblaggio.')+'</p></div>'+
    stage(roomBox('clean',{stations:cleanStations()},(()=>{ const W=G.missions.filter(m=>m.phase==='D'&&m.stage==='assembly'&&m.asmWait), m=W.indexOf(cur())>=0?cur():W[0]; return m?dsatHTML('clean',m,'Trascinalo su una postazione'):''; })()),'rbx'); scn(v,{}); }
function cleanSat(M,only){ if(!S3.ok) return satSVG(M.sat,{only}); return '<img src="'+S3.snap(M.sat,420,{only,png:true})+'" alt="Satellite in integrazione" style="width:100%;display:block">'; }
function cleanUpdate(){ if(view!=='build') return; const st=cleanStations(), key=st.map(x=>x?x.label+(x.img?'i':''):'-').join(','), svg=$('#roomsvg'); if(svg&&svg.dataset.room==='clean'&&svg.dataset.k!==key&&!RPLACE){ svg.dataset.k=key; svg.innerHTML=(()=>{ const st0=roomSt('clean',{stations:st}); IR.setWalkers(wkScene('clean',st0)); return IR.clean(st0); })()+'<g id="rghost"></g>'; } }

/* ---------- edificio di testing: una camera vuota con sei baie ---------- */
const BAYS=[[215,300,.52],[500,300,.52],[785,300,.52],[180,488,.74],[500,488,.74],[820,488,.74]];
const SATY={vib:-80,tvac:-82,func:-70,shock:-22,emc:-30,mass:-56};
function machineSVG(k,running){ const anim=running?' run':'';
  if(k==='vib') return '<g class="m-vib'+anim+'"><path d="M-110 0l40-50M110 0l-40-50M-30 0l-8-50M30 0l8-50" stroke="#7C8DA3" stroke-width="10"/><g class="'+(running?'shake':'')+'"><polygon points="-150,-80 150,-80 170,-50 -170,-50" fill="#C9D3DD" stroke="#55657A" stroke-width="2"/></g><path d="M-170 6c40-10 80 20 140 10" stroke="#E04B4B" stroke-width="5" fill="none"/><path d="M-170 16c40-10 80 20 140 10" stroke="#2F6FD6" stroke-width="5" fill="none"/><path d="M-170 26c40-10 80 20 140 10" stroke="#F3C24F" stroke-width="5" fill="none"/></g>';
  if(k==='tvac') return '<g><path d="M-110 0v-20M90 0v-20" stroke="#7C8DA3" stroke-width="12"/><rect x="-160" y="-160" width="300" height="150" rx="75" fill="'+(running?'#BFE0FF':'#D8DFE7')+'" stroke="#55657A" stroke-width="3"/><ellipse cx="140" cy="-85" rx="36" ry="75" fill="#C9D3DD" stroke="#55657A" stroke-width="3"/><path d="M-130-160v-26h220v26M-100-186v-16h160v16" stroke="#7C8DA3" stroke-width="4" fill="none"/>'+(running?'<circle cx="140" cy="-85" r="14" fill="#7FC4FF"/>':'')+'</g>';
  if(k==='func') return '<g><rect x="-140" y="-70" width="280" height="16" fill="#9AA9BA" stroke="#55657A"/><path d="M-125-54V0M125-54V0" stroke="#7C8DA3" stroke-width="10"/>'+[-130,-96,-62].map((x,i)=>'<rect x="'+x+'" y="-100" width="30" height="30" fill="'+['#7C8CFF','#3CC796','#F28B50'][i]+'" stroke="#55657A"/>').join('')+'<rect x="66" y="-122" width="60" height="42" rx="3" fill="#0E1A2E" stroke="#55657A"/><rect x="92" y="-80" width="8" height="10" fill="#55657A"/>'+(running?'<path d="M74-110h30M74-100h40M74-90h22" stroke="#9EE6B8" stroke-width="3"/><circle cx="-115" cy="-108" r="4" fill="#45D483"/><circle cx="-81" cy="-108" r="4" fill="#45D483"/>':'')+'</g>';
  if(k==='shock') return '<g><rect x="-100" y="-200" width="16" height="200" fill="#9AA9BA" stroke="#55657A"/><rect x="84" y="-200" width="16" height="200" fill="#9AA9BA" stroke="#55657A"/><rect x="-112" y="-212" width="224" height="16" fill="#7C8DA3" stroke="#55657A"/><rect x="-60" y="-22" width="120" height="22" fill="#55657A"/>'+
    '<g class="pend'+(running?' swing':'')+'"><path d="M0-196L-80-96" stroke="#55657A" stroke-width="7"/><circle cx="-80" cy="-96" r="20" fill="#D2443A" stroke="#7A2620" stroke-width="2"/></g></g>';
  if(k==='emc') return '<g><rect x="-140" y="-190" width="280" height="190" fill="#3A4757" stroke="#26313D" stroke-width="3"/><rect x="-120" y="-172" width="240" height="160" fill="#2B4C7E"/>'+
    [...Array(12)].map((_,i)=>'<path d="M'+(-120+i*20)+' -172l10 18l10-18M'+(-120+i*20)+' -12l10-18l10 18" fill="#4A78C2"/>').join('')+'<path d="M-90-12v-44M-100-12l10-44l10 44" stroke="#C9D3DD" stroke-width="3" fill="none"/><path d="M-104-68h28l6-14h-40z" fill="#E9EEF3"/>'+(running?'<g class="ping"><circle cx="-60" cy="-75" r="14" fill="none" stroke="#9EE6B8" stroke-width="3"/><circle cx="-60" cy="-75" r="28" fill="none" stroke="#9EE6B8" stroke-width="2" opacity=".6"/></g>':'')+'</g>';
  return '<g><rect x="-45" y="-48" width="90" height="48" fill="#9AA9BA" stroke="#55657A"/><ellipse cx="0" cy="-52" rx="78" ry="14" fill="#C9D3DD" stroke="#55657A" stroke-width="2"/><rect x="100" y="-120" width="16" height="120" fill="#7C8DA3"/><circle cx="108" cy="-136" r="22" fill="#fff" stroke="#55657A" stroke-width="3"/><path class="'+(running?'needle':'')+'" d="M108-136l12-10" stroke="#D2443A" stroke-width="3"/></g>'; }
function miniSat(){ return '<rect x="-56" y="-46" width="26" height="34" fill="#2D5BB8" stroke="#1C3F86"/><rect x="30" y="-46" width="26" height="34" fill="#2D5BB8" stroke="#1C3F86"/><rect x="-30" y="-60" width="60" height="60" fill="#C9A24A" stroke="#6E5418" stroke-width="3"/><rect x="-22" y="-52" width="44" height="44" fill="#E9EEF3" stroke="#6E5418"/><circle cx="0" cy="-30" r="8" fill="#F07B3F"/>'; }
function testState(M){ const out={}; L.TESTS.forEach(t=>{ const r=M.tr[t]; out[t]=r?r.res:null; }); return out; }
const RESN={pass:'superata',fixed:'riparata',waived:'deroga',defect:'difetto!',struct:'non superata'};
function vTest(v){ const M=cur(), ready=G.missions.filter(m=>m.phase==='D'&&m.stage!=='assembly'); const inLab=M&&M.phase==='D'&&M.stage!=='assembly'?M:null;
  const run=inLab?Object.keys(inLab.tr).find(t=>inLab.tr[t].res==='run'):null;
  let s='<svg viewBox="0 0 1000 560" role="img" aria-label="Laboratorio prove"><rect width="1000" height="560" fill="#EEF2F6"/><rect y="0" width="1000" height="56" fill="#D3DCE6"/>'+[0,1,2,3,4,5].map(i=>'<path d="M'+(i*200)+' 0l100 56" stroke="#B7C4D2" stroke-width="3"/>').join('')+
    '<rect x="60" y="80" width="180" height="90" rx="6" fill="#E3E9EF" stroke="#C9D3DD" stroke-width="3"/><rect x="760" y="80" width="180" height="90" rx="6" fill="#E3E9EF" stroke="#C9D3DD" stroke-width="3"/><text x="500" y="130" text-anchor="middle" font-family="Barlow Condensed,Arial" font-weight="700" font-size="22" letter-spacing="3" fill="#B7C4D2">CAMERA PROVE · CLASSE 100.000</text>'+
    '<polygon points="0,220 1000,220 1000,560 0,560" fill="#D9DFE6"/>'+[...Array(11)].map((_,i)=>'<path d="M'+(500+(i-5)*90)+' 220L'+(500+(i-5)*200)+' 560" stroke="#CDD5DE"/>').join('')+'<path d="M0 390H1000" stroke="#CDD5DE"/>';
  BAYS.forEach((b,i)=>{ const k=G.lab[i], sc=b[2];
    s+='<ellipse cx="'+b[0]+'" cy="'+(b[1]+4)+'" rx="'+(150*sc)+'" ry="'+(30*sc)+'" fill="'+(k?'#CBD3DC':'none')+'" stroke="#F3C24F" stroke-width="4" stroke-dasharray="'+(k?'0':'14 10')+'"/>';
    if(k){ s+='<g transform="translate('+b[0]+' '+b[1]+') scale('+sc+')">'+machineSVG(k,run===k)+(run===k?'<g transform="translate('+(k==='func'?0:0)+' '+SATY[k]+')"><g class="'+(k==='vib'?'shake':'')+'">'+miniSat()+'</g></g>':'')+'</g>'; } });
  s+='</svg>';
  const btn=(k,i)=>{ const b=BAYS[i]||[0,0,1], x=b[0]/10, y=(b[1]+34*b[2]+8)/5.6; if(!k) return '<button class="mbtn buy" data-act="bay" data-i="'+i+'" style="left:'+x+'%;top:'+y+'%">Baia libera<small>installa un macchinario</small></button>';
    const m=L.MACH[k], st=inLab?inLab.tr[k]:null;
    if(!inLab) return '<div class="mbtn" style="left:'+x+'%;top:'+y+'%">'+m.n+'<small>scegli un satellite</small></div>';
    if(st&&st.res==='run'){ const q=Math.min(1,1-(st.end-now())/(st.dur||L.TIME.test)); return '<div class="mbtn run" style="left:'+x+'%;top:'+y+'%">'+m.n+'<small>in prova…</small><div class="prog"><i style="width:'+q*100+'%"></i></div></div>'; }
    if(st) return '<div class="mbtn" style="left:'+x+'%;top:'+y+'%">'+m.n+'<small>'+RESN[st.res]+'</small></div>';
    return '<button class="mbtn" data-act="runtest" data-k="'+k+'" '+(run?'disabled':'')+' style="left:'+x+'%;top:'+y+'%">'+m.n+'<small>prova · '+L.RUN+' cr</small></button>'; };
  const res=inLab?L.TESTS.map(t=>{ const r=inLab.tr[t]; if(!r||r.res==='run') return ''; const n=L.MACH[t].n;
    if(r.res==='pass') return '<div class="result ok"><b>'+n+':</b> superata.</div>'; if(r.res==='fixed') return '<div class="result ok"><b>'+n+':</b> difetto riparato.</div>'; if(r.res==='waived') return '<div class="result w"><b>'+n+':</b> deroga, il difetto vola: '+L.MACH[t].fly+'.</div>';
    if(r.res==='struct') return '<div class="result bad"><b>'+n+':</b> baricentro troppo alto, la struttura oscilla.<div class="row" style="margin-top:8px"><button class="btn small" data-act="stiff">Rinforza · '+L.STIFFC+' cr</button></div></div>';
    return '<div class="result bad"><b>'+n+':</b> '+L.MACH[t].bug+' <span class="fine">Se vola: '+L.MACH[t].fly+'.</span><div class="row" style="margin-top:8px"><button class="btn small" data-act="fix" data-t="'+t+'">Ripara · '+L.FIXC+' cr</button><button class="btn small no" data-act="waive" data-t="'+t+'">Deroga</button></div></div>'; }).join(''):'';
  const pend=inLab&&Object.keys(inLab.tr).some(t=>['run','defect','struct'].indexOf(inLab.tr[t].res)>=0), own=G.lab.filter(Boolean);
  const resBad=res.split(/(?=<div class="result )/).filter(x=>x.indexOf('result bad')>=0).join('');
  const labActs=inLab?'<div class="acts">'+(resBad?'<div class="panel">'+resBad+'</div>':'')+(inLab.ready?'<div class="panel"><b>Revisione di volo superata: comincia la fase E.</b> <span class="fine">Esci dal laboratorio e vai '+(inLab.sat.lv==='HOME'?'alla <b>rampa di lancio</b> del campus':'all’<b>edificio amministrativo</b>: da lì segui il lancio con l’ente terzo')+'.</span></div>':'<button class="btn primary" data-act="frr" '+(pend?'disabled':'')+'>Revisione di volo</button>')+'</div>':'';
  v.innerHTML='<div class="head"><div><h3>Edificio di testing · '+(cur()&&cur().ready&&cur().phase==='D'?'Fase E':'Fase D')+'</h3><h1>Laboratorio prove</h1></div><p>'+(inLab?'Trascina '+esc(inLab.name)+' su un macchinario per provarlo ('+L.RUN+' cr a prova). ':'Scegli un satellite con il tasto «Satelliti». ')+'Ogni prova scopre un tipo di difetto prima che lo scopra lo spazio.</p></div>'+
    stage(roomBox('test',null,inLab&&!inLab.ready&&!Object.keys(inLab.tr).some(t=>inLab.tr[t].res==='run')&&G.lab.some(k=>!inLab.tr[k])?dsatHTML('test',inLab,'Trascinalo su un macchinario · '+L.RUN+' cr'):''),'rbx')+'<div class="docks"><aside class="dockL"><div class="panel"><h2 style="margin:0;font-size:16px">Magazzino</h2><div class="ware">'+(ready.length?ready.map(m=>{ const ts=testState(m); return '<button class="wcard'+(m===M?' on':'')+'" data-act="pick" data-id="'+m.id+'"><div>'+satThumb(m)+'</div><div><b>'+esc(m.name)+'</b><div class="tchips">'+(own.length?own.map(t=>'<span class="tchip '+(ts[t]==='pass'||ts[t]==='fixed'?'ok':ts[t]==='defect'||ts[t]==='struct'?'bad':ts[t]==='waived'?'w':'')+'">'+L.MACH[t].short+'</span>').join(''):'<span class="tchip">nessun macchinario</span>')+'</div>'+(m.ready?'<div class="fine">sulla rampa</div>':'')+'</div></button>'; }).join(''):'<p class="fine">Nessun satellite assemblato. Costruiscilo in fase C e assemblalo in camera bianca.</p>')+'</div></div></aside>'+
    '</div>'+labActs+'<div hidden><div class="bays3">'+G.lab.map((k,i)=>btn(k,i).replace(/ style="[^"]*"/,'')).join('')+(G.lab.length<LABMAX?'<button class="mbtn buy" data-act="labadd">+ Installa macchinario<small>'+G.lab.length+' di '+LABMAX+' · lo metti dove vuoi</small></button>':'')+'</div>'+
    (inLab?'<div class="panel">'+(res||'<p class="fine">Scegli quali prove fare su '+esc(inLab.name)+'. Ogni prova saltata resta un rischio nel registro dei rischi.</p>')+(inLab.ready?(inLab.sat.lv==='HOME'?'<p><b>Revisione di volo superata.</b> Il satellite è sulla tua rampa di lancio.</p>':'<div class="row" style="justify-content:space-between"><p><b>Revisione di volo superata.</b> Il lancio è affidato a un ente terzo.</p><button class="btn primary" data-act="xopen">Lancia</button></div>'):'<div class="row"><button class="btn primary" data-act="frr" '+(pend?'disabled':'')+'>Revisione di volo</button></div>')+'</div>'+riskBtn(inLab):'')+'</div>'; scn(v,{L:1,bg:'#E9EDE6',railL:[{ic:'🛰',t:'Satelliti',side:'L',bd:ready.length||''}],railR:[{ic:'＋',t:'Macchinario',act:'labadd'}]}); }
function bayModal(i){ const lv=L.level(G.xp), el=$('#ov');
  el.innerHTML='<div class="rv wide"><h3>Laboratorio · '+G.lab.length+' di '+LABMAX+' macchinari</h3><h2>Installa un macchinario</h2><p class="fine">Livello attuale: '+lv+'. I macchinari più avanzati si sbloccano salendo di livello.</p><div class="cat">'+L.TESTS.map(k=>{ const m=L.MACH[k], have=G.lab.indexOf(k)>=0, lock=lv<m.lvl;
    return '<button class="ccard'+(lock||have?' lock':'')+'" data-act="install" data-k="'+k+'" data-i="'+i+'"'+(lock||have?' disabled':'')+'><svg viewBox="-190 -230 380 270">'+machineSVG(k,false)+'</svg><b>'+m.n+'</b><span>'+m.s+'. Se il difetto vola: '+m.fly+'.</span><small>'+(have?'già installato':lock?'🔒 livello '+m.lvl:keur(m.c))+'</small></button>'; }).join('')+'</div><div class="row"><button class="btn" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false; }

/* ---------- registro dei rischi ---------- */
function riskBtn(M){ const R=L.risks(M,G.lab.filter(Boolean)), hi=R.list.filter(x=>x.p*x.i>=6).length, mid=R.list.filter(x=>x.p*x.i>=3&&x.p*x.i<6).length, lo=R.list.length-hi-mid;
  return '<button class="riskb" data-act="risks"><span>⚠ Registro dei rischi</span><span class="rdots">'+'<i style="background:#E2786A"></i>'.repeat(Math.min(hi,6))+'<i style="background:#F3C24F"></i>'.repeat(Math.min(mid,6))+'<i style="background:#8FD3A6"></i>'.repeat(Math.min(lo,6))+'</span><span class="fine">'+R.list.length+' aperti</span></button>'; }
function riskModal(){ const M=cur(); if(!M) return; const el=$('#ov'); el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true">'+riskPanel(M)+'<div class="row" style="margin-top:12px"><button class="btn primary" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false; }
function riskPanel(M,compact){ const R=L.risks(M,G.lab.filter(Boolean)), cls=(p,i)=>p*i>=6?'r':p*i>=3?'y':'g';
  let mx='<div class="mx" aria-label="Matrice dei rischi"><span class="ax ay">Impatto</span>';
  for(let i=3;i>=1;i--){ mx+='<span class="al">'+['','basso','serio','fatale'][i]+'</span>'; for(let p=1;p<=3;p++) mx+='<span class="c '+cls(p,i)+'">'+R.list.map((x,n)=>x.p===p&&x.i===i?'<b class="rd">'+(n+1)+'</b>':'').join('')+'</span>'; }
  mx+='<span></span><span></span>'+['rara','possibile','probabile'].map(t=>'<span class="al b">'+t+'</span>').join('')+'<span class="ax ax2">Probabilità</span></div>';
  const hi=R.list.filter(x=>x.p*x.i>=6).length;
  return '<section class="panel risk-p" id="riskp"><div class="row" style="justify-content:space-between"><h2>Registro dei rischi</h2><span class="fine">'+R.list.length+' aperti · '+hi+' alti · '+R.ok.length+' mitigati</span></div>'+
    '<div class="risk">'+mx+'<div><ol class="rlist">'+(R.list.length?R.list.slice(0,compact?5:20).map((x,n)=>'<li><b class="rd '+cls(x.p,x.i)+'">'+(n+1)+'</b><div><b>'+esc(x.t)+'</b> <span class="fine">· '+esc(x.s)+'</span><div class="mit">Mitigazione: '+esc(x.mit)+'</div></div></li>').join(''):'<li><span></span><span>Nessun rischio aperto.</span></li>')+'</ol>'+
    (R.ok.length?'<p class="fine okl">Mitigati: '+R.ok.map(x=>'✓ '+esc(x.t)).join(' · ')+'</p>':'')+(R.hidden.length?'<p class="hidr">⚠ '+R.hidden.map(h=>esc(PEO[h.who].n)+' ('+esc(PEO[h.who].role.toLowerCase())+')').join(', ')+' '+(R.hidden.length>1?'sono scontenti':'è scontento')+': i rischi del suo sottosistema non compaiono più nel registro. Non vuol dire che non ci siano.</p>':'')+'</div></div></section>'; }

/* ---------- rampa di lancio ---------- */
function fuelMonths(M){ const d=M.sat; if(!d.placed.prop) return ' <b>Senza propulsione la durata dipende solo da quanto regge il satellite.</b>'; const b=E.budget(d), left=Math.floor((b.fuel-L.transferNeed(d)-27)/Math.max(.1,E.skOf(d))); return ' <b>Il ΔV basta per circa '+Math.max(0,left)+' mesi.</b>'; }
function vPad(v){ { const r0=G.missions.filter(m=>m.phase==='D'&&m.ready&&m.sat.lv==='HOME'), M0=cur(), on0=M0&&M0.phase==='D'&&M0.ready&&M0.sat.lv==='HOME'?M0:r0[0]; if(on0){ G.cur=G.missions.indexOf(on0); return vLaunch(v,on0,true); } return vLaunch(v,null,true); }
  const M=cur(), ready=G.missions.filter(m=>m.phase==='D'&&m.ready), on=M&&M.phase==='D'&&M.ready?M:null, pend=padPending(), stand=M&&pend.indexOf(M)>=0?M:null;
  let s='<svg viewBox="0 0 1000 560" role="img" aria-label="Rampa di lancio"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5FA8E0"/><stop offset="1" stop-color="#CFE7F7"/></linearGradient></defs><rect width="1000" height="560" fill="url(#sky)"/>'+
    '<g fill="#fff" opacity=".8"><ellipse cx="160" cy="110" rx="70" ry="18"/><ellipse cx="210" cy="98" rx="46" ry="20"/><ellipse cx="790" cy="160" rx="80" ry="16"/></g><path d="M0 420L120 380L260 400L420 360L560 395L720 370L880 392L1000 372V560H0z" fill="#9CC28A"/><rect y="440" width="1000" height="120" fill="#A9D18A"/>'+
    '<polygon points="330,470 670,470 720,520 280,520" fill="#C3CAD2" stroke="#8A96A5" stroke-width="2"/><rect x="470" y="470" width="60" height="14" fill="#7C8796"/>'+
    '<g stroke="#C0392B" stroke-width="5" fill="none"><path d="M590 470V130M630 470V130"/>'+[...Array(17)].map((_,i)=>'<path d="M590 '+(470-i*20)+'L630 '+(450-i*20)+'M630 '+(470-i*20)+'L590 '+(450-i*20)+'"/>').join('')+'<path d="M530 200H590M530 300H590"/></g><rect x="580" y="120" width="60" height="12" fill="#8E2A20"/>'+
    '<g id="rk">'+(stand?rocketSVG(500,470,1.6*(E.LV[stand.sat.lv].h||1)):'')+'</g><g id="smk"></g></svg>';
  const R=on?E.RIDES[on.sat.ride]:null;
  v.innerHTML='<div class="head"><div><h3>Rampa di lancio'+(M?' · '+phn(M):'')+'</h3><h1>'+(on?esc(on.name)+' sulla rampa':'Rampa di lancio')+'</h1></div><p>'+(on?'Viaggia su '+E.LV[on.sat.lv].n+' verso '+zoneName(on)+'. Scegli quanti mesi di missione e avvia il conto alla rovescia.':'Qui arrivano i satelliti che hanno superato la revisione di volo.')+'</p></div>'+
    stage('<section class="scene fsc" id="padscene" style="--ar:1000/560">'+s+'<div class="ov-lay"><div class="cnt" id="cnt" hidden></div></div></section>','rbx')+
    '<div class="docks"><aside class="dockR"><div class="panel">'+(on?'<div class="row" style="justify-content:space-between"><div><b>Pronto al lancio.</b><div class="fine">Durata minima promessa: '+L.minMonths(on)+' mesi. La durata che dichiari è un impegno: ogni mese promesso e non volato costa '+L.MISSED+' cr di penale. Ogni mese di operazioni costa '+L.OPS+' cr. Un mese dura '+(L.TIME.month/1000)+' s, e il tempo si ferma quando devi decidere.'+fuelMonths(on)+(hasB('ground')?' La stazione di terra dà +20% di scienza.':'')+'</div></div><div class="row"><label for="dur" style="margin:0">Durata</label><select id="dur" style="width:auto">'+durOptions(on)+'</select><button class="btn primary" data-act="launch">Lancia</button></div></div>'
      :stand?'<p><b>Il '+esc(E.LV[stand.sat.lv].n)+' di '+esc(stand.name)+' è in preparazione.</b> <span class="fine">Il satellite arriva sulla rampa dopo la revisione di volo (FRR). '+hint(stand)+'</span></p>'
      :(pend.length?'<div class="row"><span>Razzi in preparazione:</span>'+pend.map(m=>'<button class="chip" data-act="pick" data-id="'+m.id+'">'+esc(m.name)+' <small>'+esc(E.LV[m.sat.lv].n)+'</small></button>').join('')+'</div>':'')+(ready.length?'<div class="row"><span>Satelliti pronti:</span>'+ready.map(m=>'<button class="chip" data-act="pick" data-id="'+m.id+'">'+esc(m.name)+'</button>').join('')+'</div>':(pend.length?'':'<p class="fine">La rampa è vuota: il razzo arriva quando scegli il lanciatore nell’edificio di costruzione.</p>')))+(on?'<div style="margin-top:8px">'+riskBtn(on)+'</div>':'')+'</div></aside></div>'; scn(v,{R:1,bg:'#BFDCEF'}); }

/* ---------- bunker di lancio ---------- */
function vLaunch(v,M,own){ const ok=M&&M.phase==='D'&&M.ready, lv=ok?(E.LV[M.sat.lv]||E.LV.RS):null; if(ok){ const o=durList(M); if(o.indexOf(LDUR)<0) LDUR=o[0]; }
  const port=innerWidth<innerHeight, A=innerWidth/Math.max(1,innerHeight), wide=A>1.6, vw=wide?800*A:1280;
  const svg='<svg id="lsvg" class="full" viewBox="'+(wide?(640-vw/2)+' 0 '+vw+' 800':'0 0 1280 800')+'" preserveAspectRatio="'+(port?'xMidYMax meet':wide?'xMidYMid meet':'xMidYMid slice')+'" role="img" aria-label="Bunker di lancio">'+IR.launchScene({name:ok?M.name:'Rampa vuota',lvn:String(G.co||'').toUpperCase().slice(0,13),dur:ok?LDUR:'—',cnt:ok?'T-10':'—',flag:G.flag||null,sub:ok?(own?'Rampa di lancio della tua agenzia':esc(lv.n)+' · sito di lancio esterno'):'Nessun satellite pronto',busy:LBUSY||!ok,empty:!ok,rocket:ok||(own&&padPending().length>0),h:ok?(lv.h||1):1})+'</svg>';
  v.innerHTML='<div class="head"><div><h3>'+(own?'Rampa di lancio':'Edificio amministrativo · lancio con un ente terzo')+(ok?' · Fase E':'')+'</h3><h1>'+(ok?esc(M.name)+' pronto al lancio':'Rampa di lancio')+'</h1></div><p>'+(ok?'Scegli la durata con − e +, poi premi LAUNCH. Ogni mese promesso e non volato costa '+L.MISSED+' cr; ogni mese di operazioni '+L.OPS+' cr.'+fuelMonths(M):'Qui arrivano i satelliti che hanno superato la revisione di volo.')+'</p></div>'+
    '<div class="stage0">'+svg+'</div>'; scn(v,{bg:'#2C343C'}); }
function vLaunchView(v){ const M=cur(); vLaunch(v,M,M&&M.sat.lv==='HOME'); }
/* ---------- Mission Control Center ---------- */
const STARS=[]; (function(){ const r=E.rng(42); for(let i=0;i<90;i++) STARS.push([r(),r(),r()*1.2+.3]); })();
// postazioni con operatori visti di spalle, davanti ai tre schermi grandi
function consoleRow(y,n,k,x0,x1,seed){ let s=''; const r=E.rng(seed), w=(x1-x0)/n;
  for(let i=0;i<n;i++){ const cx=x0+w*(i+.5);
    s+='<g transform="translate('+cx+' '+y+') scale('+k+')">'+
      '<path d="M-58 0h116l10 26h-136z" fill="#3A4757"/><rect x="-68" y="26" width="136" height="10" fill="#26313D"/>'+
      [-28,28].map(mx=>'<g transform="translate('+mx+' -6)"><rect x="-24" y="-38" width="48" height="32" rx="3" fill="#0E1A2E" stroke="#55657A" stroke-width="2"/>'+
        (r()<.5?'<path d="M-18 -16l8-6 7 4 8-10 7 5 6-3" stroke="'+(r()<.5?'#45D483':'#6FA8FF')+'" stroke-width="2" fill="none"/>':'<path d="M-18 -30h22M-18 -24h30M-18 -18h16M-18 -12h26" stroke="#9EE6B8" stroke-width="2"/>')+
        '<rect x="-3" y="-6" width="6" height="7" fill="#55657A"/></g>').join('')+
      '<g transform="translate('+(r()<.5?-8:8)+' 52)"><rect x="-22" y="-30" width="44" height="46" rx="10" fill="#2B3340"/><path d="M-20 -2c0-22 8-30 20-30s20 8 20 30z" fill="#DCE2E9" stroke="#9AA7B6" stroke-width="2"/><ellipse cx="0" cy="-42" rx="13" ry="15" fill="#F6F8FA" stroke="#9AA7B6" stroke-width="2"/><path d="M-13 -46a13 13 0 0 1 26 0" stroke="#55657A" stroke-width="3" fill="none"/></g></g>'; }
  return s; }
function vMccRoom(v){ const M=cur(), flying=G.missions.filter(m=>m.phase==='E'||m.phase==='F');
  v.innerHTML='<div class="head"><div><h3>Mission Control Center · Fasi E e F</h3><h1>Sala controllo</h1></div><p>'+(G.missions.some(m=>m.pauseAt)?'⚠ Una decisione ti aspetta: tocca gli schermi.':flying.length?flying.length+(flying.length>1?' satelliti in volo':' satellite in volo')+'. Tocca gli schermi per la telemetria.':'La telemetria parte con il lancio. Tocca gli schermi per aprirli.')+'</p></div>'+stage(roomBox('mcc'),'rbx')+'<div hidden>'+
    '<div class="docks"><aside class="dockR"><div class="panel"><h4 style="margin:0 0 6px">In volo</h4><div class="flylist">'+(flying.length?flying.map(m=>'<button class="chip'+(m===M?' on':'')+(m.alert?' al':'')+'" data-act="pick" data-id="'+m.id+'">'+(m.alert?'⚠ ':'')+esc(m.name)+' <small>'+phn(m)+'</small></button>').join(''):'<span class="fine">Nessuna missione in volo.</span>')+'</div></div></aside></div></div>'; scn(v,{}); if(G.missions.some(m=>m.pauseAt)) v.classList.add('pend'); }
function vMcc(v){ const M=cur(), flying=G.missions.filter(m=>m.phase==='E'||m.phase==='F'); const mode=MCCV||'room'; if(mode==='room') return vMccRoom(v);
  let s='<svg viewBox="0 0 1000 560" role="img" aria-label="Parete video della sala controllo">'+IR.mccWallBack()+'</svg>';
  const fl=M&&(M.phase==='E'||M.phase==='F'||M.phase==='done')&&M.launchAt?flightNow(M):null;
  const scr=(i,title,inner)=>'<div class="scr" style="left:'+(4+i*31.5)+'%;top:15.2%;width:29%;height:35.7%"><h4>'+title+'</h4>'+inner+'</div>';
  v.innerHTML='<div class="head"><div><h3>Mission Control Center · Fasi E e F</h3><h1>Sala controllo</h1></div><p>'+(fl?(M.phase==='done'?'Missione chiusa: la telemetria di '+esc(M.name)+' è archiviata qui sotto.':'Telemetria in diretta da '+esc(M.name)+'.'):'La telemetria parte con il lancio.')+'</p></div>'+
    '<div class="stage0"><div class="sbox rbx"><div class="mccw fsc" style="--ar:1000/560"><section class="scene" style="height:100%">'+s+'<div class="ov-lay">'+scr(0,'Telemetria orbitale','<canvas id="orb"></canvas>')+scr(1,'Stato satellite','<div class="vit" id="vit"></div>')+scr(2,'Codice telemetria','<div class="code" id="code" tabindex="0" aria-label="Codice di telemetria, scorrevole"></div>')+'<div class="dec" id="dec" hidden></div></div></section>'+'<div class="fmon fmL"><h4>Satellite</h4><div class="sat">'+(M&&M.sat&&Object.keys(M.sat.placed||{}).length?satThumb(M):'<span class="fine" style="color:#7FD3EA">—</span>')+'</div></div>'+'<div class="fmon fmC"><h4>In volo</h4><div class="flylist">'+(flying.length?flying.map(m=>'<button class="chip'+(m===M?' on':'')+(m.alert?' al':'')+'" data-act="pick" data-id="'+m.id+'">'+(m.alert?'⚠ ':'')+esc(m.name)+' <small>'+phn(m)+'</small></button>').join(''):'<span class="fine">Nessuna missione in volo.</span>')+'</div>'+
      (M&&M.phase==='D'&&M.ready?'<p class="fine"><b>'+esc(M.name)+'</b> è sulla rampa: vai alla rampa per il lancio.</p>':'')+'<h4>Giornale di missione</h4><ol class="log" id="mlog"></ol></div>'+'<div class="fmon fmR"><div class="gng"><div class="gr">🚀</div><div class="gt">GO<span>/</span>NO-GO</div><div class="gs">SPACE MISSION GAME</div><div class="gb">▶ PREMI START</div><div class="gh">RECORD '+(G.sciTotal||0)+' PTS</div></div></div>'+'</div></div></div>'+docks(null,'<div id="dashw">'+dashHTML(M,fl)+'</div>'); scn(v,{bg:'#C5CAD0',R:1,railR:[{ic:'📈',t:'Risorse',side:'R'}]});
  mccRefresh(true); mccLoop(); }
function flightNow(M){ const mo=L.monthsNow(M,now()); const fl=L.flight(M,Math.floor(mo)); fl.mo=mo; return fl; }
// La telemetria è legata al tempo della missione: 4 blocchi al mese, dal lancio alla fine. Si ricostruisce dal seme.
const TELE={}, SPM=4;
function teleUpTo(M){ const c=TELE[M.id]||(TELE[M.id]={s:-1,lines:[],fl:{},end:false}); if(!M.launchAt) return c;
  const mo=L.monthsNow(M,now()), fin=M.phase==='done', flAt=m=>c.fl[m]||(c.fl[m]=L.flight(M,m)), last=flAt(Math.max(0,Math.floor(Math.min(mo,M.duration+1))));
  const endM=last.f.endMonth||M.duration+1, S=Math.floor(Math.min(mo,endM)*SPM);
  const fmt=t=>{ const i=t.indexOf('//'), a=i>=0?t.slice(0,i):t, b=i>=0?t.slice(i):''; return esc(a).replace(/(WARN|ATTENZIONE|LOST|DEGRADED|WEAK|MORTO)/g,'<span class="e">$1</span>')+(b?'<span class="c">'+esc(b)+'</span>':''); };
  for(let s2=c.s+1;s2<=S;s2++){ const m=Math.floor(s2/SPM), fl=flAt(m);
    if(s2===0) c.lines.push('<span class="c">// ==== LANCIO di '+esc(M.name)+' · '+esc(E.DEST[M.sat.dest||'leo'].n)+' ====</span>');
    if(s2%SPM===0) fl.log.filter(l=>l.m===m&&!/^Mese \d+: \+/.test(l.t)).forEach(l=>c.lines.push('<span class="'+(l.tone==='bad'?'e':'g')+'">&gt;&gt; EVT M'+l.m+'  '+esc(l.t)+'</span>'));
    if(!fl.f.alive){ if(!c.end){ c.lines.push('<span class="e">LOSS OF SIGNAL — '+esc(fl.f.cause||'')+'</span>'); c.end=true; } c.s=S; break; }
    L.tele(M,fl.f,s2).forEach(t=>c.lines.push(fmt(t))); c.s=s2; }
  if(fin&&!c.end){ const fl=flAt(endM); fl.log.filter(l=>l.m>=Math.floor(S/SPM)&&!/^Mese \d+: \+/.test(l.t)&&c.lines.join('').indexOf(esc(l.t))<0).forEach(l=>c.lines.push('<span class="'+(l.tone==='bad'?'e':'g')+'">&gt;&gt; EVT M'+l.m+'  '+esc(l.t)+'</span>')); c.lines.push('<span class="c">// ==== FINE MISSIONE · trasmissione chiusa ====</span>'); c.end=true; }
  return c; }
function paintCode(el,c){ if(!el) return; const n=+(el.dataset.n||0), same=el.dataset.m===c.id; if(!same){ el.innerHTML=''; el.dataset.m=c.id; el.dataset.n=0; }
  const atEnd=el.scrollTop+el.clientHeight>=el.scrollHeight-24, from=same?n:0; if(c.lines.length>from){ el.insertAdjacentHTML('beforeend',c.lines.slice(from).map(t=>'<div>'+t+'</div>').join('')); el.dataset.n=c.lines.length; if(atEnd||!same) el.scrollTop=el.scrollHeight; } }
function mccRefresh(full){ const M=cur(); if(view!=='mcc') return; const fl=M&&M.launchAt?flightNow(M):null; if(fl&&M.alert){ M.alert=false; M.seenBad=fl.log.filter(l=>l.tone==='bad').length; hud(); } const vit=$('#vit'), code=$('#code'), all=null, log=$('#mlog'); if(!vit) return; { const dw=$('#dashw'); if(dw&&(!mccRefresh.t||Date.now()-mccRefresh.t>900)){ mccRefresh.t=Date.now(); dw.innerHTML=dashHTML(M,fl); } }
  if(!fl){ vit.innerHTML='<div>NESSUN SEGNALE</div><div style="opacity:.6">'+(M?esc(M.name)+' · '+phn(M):'')+'</div>'; code.innerHTML='<div class="c">// in attesa del lancio</div>'; code.dataset.m=''; if(all){ all.innerHTML='<div class="c">// la telemetria comincia quando il satellite lascia la rampa</div>'; all.dataset.m=''; } if(log) log.innerHTML='<li>Nessun evento.</li>'; return; }
  const f=fl.f, b=E.budget(M.sat), endM=f.endMonth||M.duration+1;
  const bar=(l,v2,t)=>'<div>'+l+' <span style="float:right">'+t+'</span><div class="vb"><i style="width:'+Math.max(0,Math.min(100,v2*100))+'%"></i></div></div>';
  vit.innerHTML=bar('MISSIONE',Math.min(1,fl.mo/endM),'mese '+f.month+' / '+M.duration)+bar('ΔV',f.fuel/Math.max(1,b.fuel),nf(Math.max(0,f.fuel),0)+' m/s')+bar('BATTERIA',f.bat/Math.max(1,b.wh),pct(f.bat/Math.max(1,b.wh)))+bar('GAS FREDDO',f.gas/100,Math.round(f.gas)+'%')+
    '<div>SCIENZA <span style="float:right">'+nf(f.sci,0)+'</span></div><div>SCORTE <span style="float:right">OBC '+(f.spare.obc?'+1':'—')+' · RADIO '+(f.spare.com?'+1':'—')+' · RUOTE '+(f.spare.rw?'+1':'—')+'</span></div><div>STATO <span style="float:right;color:'+(f.alive?'#4ED6A4':'#FF7466')+'">'+(!f.alive?'PERSO':M.phase==='done'?'CHIUSA':M.phase==='F'?'DISPOSAL':'NOMINALE')+'</span></div>';
  if(full&&log) log.innerHTML=fl.log.slice().reverse().map(l=>'<li class="'+l.tone+'">'+(l.m?'M'+l.m+' · ':'')+esc(l.t)+'</li>').join('');
  const c=teleUpTo(M); c.id=M.id; paintCode(code,c); paintCode(all,c); decCard(M,fl); }
// Il giocatore al posto dell'autopilota: ogni evento con più strade si ferma qui
function decCard(M,fl){ const el=$('#dec'); if(!el) return; const p=fl&&fl.pending; if(!p){ if(!el.hidden){ el.hidden=true; el.dataset.k=''; } return; }
  const key=M.id+p.m; if(el.dataset.k===key&&!el.hidden) return; el.dataset.k=key; el.hidden=false;
  el.innerHTML='<div class="dh"><span class="pause">⏸ tempo fermo</span><b>Mese '+p.m+' · '+esc(p.t)+'</b></div><p>'+esc(p.q)+'</p><div class="dops">'+p.opts.map(o=>'<button class="btn'+(o.k===p.auto?'':'')+'" data-act="decide" data-k="'+o.k+'"'+(o.off?' disabled':'')+'><b>'+esc(o.l)+'</b><small>'+esc(o.h||'')+'</small></button>').join('')+'</div>'+
    '<p class="fine">ΔV '+nf(Math.max(0,p.fuel),0)+' m/s · gas '+Math.max(0,Math.round(p.gas))+'% · '+(M.duration-p.m)+' mesi ancora. <button class="lnk small" data-act="autodec">Fai decidere all’autopilota</button></p>'; }
// pianeta disegnato una volta per destinazione
const PLAN={};
function planetCanvas(k){ if(PLAN[k]) return PLAN[k]; const S=256, cv=document.createElement('canvas'); cv.width=cv.height=S; const g=cv.getContext('2d'), r=E.rng(k.length*31+7), R=S/2-6;
  g.save(); g.beginPath(); g.arc(S/2,S/2,R,0,7); g.clip();
  const base={moon:['#C9CED6','#6F7682'],leo:['#4A8FE0','#16346F'],mars:['#D9774C','#6E2A16'],venus:['#F0D79A','#9C7A36']}[k], gr=g.createRadialGradient(S*.38,S*.36,10,S/2,S/2,R); gr.addColorStop(0,base[0]); gr.addColorStop(1,base[1]); g.fillStyle=gr; g.fillRect(0,0,S,S);
  if(k==='moon') for(let i=0;i<34;i++){ const x=r()*S, y=r()*S, rr=4+r()*20; g.fillStyle='rgba(60,64,72,'+(.12+r()*.2)+')'; g.beginPath(); g.arc(x,y,rr,0,7); g.fill(); g.strokeStyle='rgba(235,238,242,.25)'; g.beginPath(); g.arc(x-1,y-1,rr,3.4,5.6); g.stroke(); }
  if(k==='leo'){ for(let i=0;i<9;i++){ g.fillStyle=['#4E9A43','#7C8B4A','#A98D5B'][i%3]; g.beginPath(); g.ellipse(r()*S,40+r()*(S-80),18+r()*40,10+r()*26,r()*3,0,7); g.fill(); } g.fillStyle='rgba(255,255,255,.75)'; g.beginPath(); g.ellipse(S/2,10,R,22,0,0,7); g.fill(); for(let i=0;i<14;i++){ g.fillStyle='rgba(255,255,255,.4)'; g.beginPath(); g.ellipse(r()*S,r()*S,16+r()*30,3+r()*5,r(),0,7); g.fill(); } }
  if(k==='mars'){ for(let i=0;i<14;i++){ g.fillStyle='rgba(90,35,20,'+(.2+r()*.3)+')'; g.beginPath(); g.ellipse(r()*S,r()*S,14+r()*40,6+r()*16,r()*3,0,7); g.fill(); } g.fillStyle='#F6EFE8'; g.beginPath(); g.ellipse(S/2,12,46,14,0,0,7); g.fill(); }
  if(k==='venus') for(let y=0;y<S;y+=9){ g.fillStyle='rgba(255,245,215,'+(r()*.4)+')'; g.fillRect(0,y,S,4+r()*6); }
  const sh=g.createRadialGradient(S*.3,S*.3,R*.5,S*.45,S*.45,R*1.15); sh.addColorStop(0,'rgba(0,0,0,0)'); sh.addColorStop(1,'rgba(0,0,0,.55)'); g.fillStyle=sh; g.fillRect(0,0,S,S); g.restore();
  if(k==='leo'||k==='venus'){ g.strokeStyle=k==='leo'?'rgba(127,184,255,.55)':'rgba(255,226,160,.5)'; g.lineWidth=5; g.beginPath(); g.arc(S/2,S/2,R+2,0,7); g.stroke(); }
  PLAN[k]=cv; return cv; }
function mccLoop(){ const cv=$('#orb'); if(!cv) return; let last=0, ang=0;
  (function loop(ts){ raf=requestAnimationFrame(loop); const dt=Math.min(.05,(ts-last)/1000||0); last=ts; const M=cur(), w=cv.clientWidth, h=cv.clientHeight, dpr=Math.min(2,window.devicePixelRatio||1);
    if(cv.width!==Math.round(w*dpr)){ cv.width=Math.round(w*dpr); cv.height=Math.round(h*dpr); } const c=cv.getContext('2d'); c.setTransform(dpr,0,0,dpr,0,0); c.fillStyle='#0E1A2E'; c.fillRect(0,0,w,h);
    STARS.forEach(s2=>{ c.fillStyle='rgba(220,230,255,.7)'; c.fillRect(s2[0]*w,s2[1]*h,s2[2],s2[2]); });
    if(!M) return; const dest=M.sat.dest||'leo', B=O.BODY[dest], p=O.plan(M), el=p.final, fly=M.phase==='E'||M.phase==='F';
    const zz0=O.zoneOf(M), rp=B.R+el.pe, ra=Math.max(B.R+(isFinite(el.ap)?el.ap:el.pe), zz0&&zz0.alt?B.R+zz0.alt:0), a=(rp+ra)/2, e=(ra-rp)/(ra+rp), bb=a*Math.sqrt(1-e*e), sc=Math.min(w,h)/2*.86/ra, cx=w/2, cy=h/2+6;
    c.drawImage(planetCanvas(dest),cx-B.R*sc-3,cy-B.R*sc-3,(B.R*sc+3)*2,(B.R*sc+3)*2);
    const zz=O.zoneOf(M), lnd=!!(zz&&(zz.surf||(zz.moon&&!zz.to)));
    if(lnd&&(fly||M.phase==='done')){ if(zz.surf){ const ax=cx+Math.cos(-.7)*B.R*sc, ay=cy+Math.sin(-.7)*B.R*sc; c.fillStyle='#F0B43A'; c.fillRect(ax-3,ay-3,6,6); c.strokeStyle='#F0B43A'; c.beginPath(); c.moveTo(ax,ay-3); c.lineTo(ax,ay-14); c.stroke(); c.fillRect(ax,ay-14,8,5); }
      else { const mr=(B.R+zz.alt)*sc, ma=ts/9000; c.strokeStyle='rgba(111,168,255,.5)'; c.beginPath(); c.arc(cx,cy,mr,0,7); c.stroke(); const mx=cx+Math.cos(ma)*mr, my=cy-Math.sin(ma)*mr; c.fillStyle='#8B7D6B'; c.beginPath(); c.arc(mx,my,5,0,7); c.fill(); c.fillStyle='#F0B43A'; c.fillRect(mx-2,my-8,4,4); } }
    else if(fly||M.phase==='done'){ c.strokeStyle='rgba(111,168,255,.9)'; c.lineWidth=1.4; c.beginPath(); c.ellipse(cx-a*e*sc,cy,a*sc,bb*sc,0,0,7); c.stroke(); }
    if(fly&&!lnd){ const n=Math.sqrt(1/(a*a*a))*2600; ang+=dt*n*(1+e*Math.cos(ang))**2; const r2=a*(1-e*e)/(1+e*Math.cos(ang)), x=cx+r2*Math.cos(ang)*sc, y=cy-r2*Math.sin(ang)*sc; c.fillStyle='#F0B43A'; c.fillRect(x-3,y-3,6,6); }
    c.fillStyle='rgba(207,227,255,.85)'; c.font='600 11px IBM Plex Mono, monospace'; c.fillText(E.DEST[dest].n.toUpperCase()+(lnd?' · '+zz.n.toUpperCase():fly||M.phase==='done'?' · '+O.fmt(el):''),8,h-8); })(0); }

/* ---------- revisioni ---------- */
function review(o){ const el=$('#ov'); let body=o.body||'';
  if(o.short){ const warn=(body.match(/<p class="bad">[\s\S]*?<\/p>/g)||[]).join(''); body='<p class="rv-short">'+o.short+'</p>'+warn+'<details class="why"><summary>Perché?</summary>'+body.replace(/<p class="bad">[\s\S]*?<\/p>/g,'')+'<p class="rv-code"><span>ECSS: '+o.code+'</span><span>NASA: '+o.nasa+'</span></p></details>'; }
  else if(o.code&&o.code!=='—') body+='<p class="rv-code"><span>ECSS: '+o.code+'</span><span>NASA: '+o.nasa+'</span></p>';
  el.innerHTML='<div class="rv'+(o.stamp?' hasst':'')+'" role="dialog" aria-modal="true"><div class="rv-top"><div><h3>'+o.eb+'</h3><h2>'+o.name+'</h2></div>'+(o.stamp?'<div class="stamp'+(o.no?' no':'')+'">'+o.stamp+'</div>':'')+'</div>'+body+'<div class="row">'+o.actions+'</div></div>'; el.hidden=false; if(o.stamp) (o.no?sfx.bad:sfx.stamp)(); }
const closeOv=()=>{ rankModal.open=false; $('#ov').hidden=true; };
function pdrList(M){ return L.status(M,M.sat,G.money+(M.lvPaid||0)+(M.partsCredit||0)).list.filter(x=>!x.ok&&x.kind!=='tests'); }

/* ---------- missioni: cartella, cambio missione, nuova ---------- */
function switcher(){ const el=$('#pop'); if(!el.hidden){ el.hidden=true; return; }
  const doneN=G.missions.filter(m=>m.phase==='done').length; el.innerHTML='<h3>Missioni in corso</h3>'+G.missions.map((m,i)=>m.phase==='done'?'':'<button class="mrow'+(i===G.cur?' on':'')+'" data-act="setcur" data-i="'+i+'"><span><b>'+(m.alert?'⚠ ':'')+esc(m.name)+'</b><div class="fine">'+(m.alert?'problema in volo · ':'')+statusLine(m)+'</div></span><span class="pill">'+phn(m)+'</span></button>').join('')+(backInfo(cur())?'<button class="btn small" data-act="backph" title="Riapri la fase precedente pagando un prezzo">↩ '+esc(cur().name)+': torna alla fase '+backInfo(cur()).to+'</button>':'')+(G.missions.length===doneN?'<p class="fine">Nessuna missione in corso.</p>':'')+'<button class="btn primary" data-act="newm">+ Nuova missione</button>'+(doneN?'<button class="btn small" data-act="arch">🗂 Archivio: '+doneN+(doneN>1?' missioni concluse':' missione conclusa')+'</button>':''); el.hidden=false; }
function statusLine(m){ if(m.phase==='D'&&m.stage==='assembly'&&m.asmWait) return 'da portare in camera bianca'; if(m.phase==='D'&&m.stage==='assembly') return now()>=m.buildEnd?'assemblaggio completato':'assemblaggio in corso'; if(m.phase==='B') return m.stage==='sat'?'progetto del satellite':m.stage==='orb'?'orbite in dettaglio':'design reference mission'; if(m.phase==='C') return 'costruzione'; if(m.phase==='E'||m.phase==='F'){ const fl=flightNow(m); return fl.pending?'decisione in attesa · mese '+fl.pending.m:'mese '+fl.f.month+' di '+m.duration; } if(m.phase==='done') return m.result&&m.result.ok?'missione riuscita':'missione chiusa'; if(m.phase==='D') return m.ready?'pronta al lancio':'in laboratorio'; return m.reqs.length+' requisiti'; }
const STMT={moon:'Misurare la radiazione attorno alla Luna per proteggere i futuri equipaggi.',leo:'Osservare la Terra dall’orbita bassa e provare nuove tecnologie a basso costo.',mars:'Mappare la radiazione nell’orbita di Marte prima dell’arrivo dei primi esploratori.',venus:'Studiare l’atmosfera di Venere dall’orbita e capire perché è diventata un inferno.'};
let PGN=0;
function planet(k,r){ const D=E.DEST[k], gid='pg'+k+(++PGN); return '<svg viewBox="-40 -40 80 80" aria-hidden="true"><defs><radialGradient id="'+gid+'" cx=".35" cy=".35"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".25" stop-color="'+D.col+'"/><stop offset="1" stop-color="#1E2A3A"/></radialGradient></defs><circle r="'+(r||30)+'" fill="url(#'+gid+')"/>'+(k==='leo'?'<path d="M-14-8q8-10 18-4t10 12q-6 4-14 0z" fill="#4E9A43" opacity=".8"/>':'')+'</svg>'; }
const fmtKm=n=>nf(n,0);
function zoneBand(z){ return z.band?fmtKm(z.band[0])+'–'+fmtKm(z.band[1])+' km':z.alt?'a '+fmtKm(z.alt)+' km da Marte':z.surf?'sul suolo':'atterraggio'; }
function zoneIcon(body,z){ const col=E.DEST[body].col; let s='<svg viewBox="-60 -40 120 80" aria-hidden="true"><circle r="20" fill="'+col+'" stroke="#55657A"/>';
  if(z.band){ const r=z.k==='low'?27:z.k==='med'?38:52; s+='<ellipse rx="'+r+'" ry="'+(r*.45)+'" fill="none" stroke="#F07B3F" stroke-width="2.5"/><circle cx="'+r+'" cy="0" r="3.5" fill="#F0B43A"/>'; }
  else if(z.surf) s+='<g transform="translate(0 -21)"><rect x="-9" y="-8" width="18" height="6" rx="2" fill="#E9EEF3" stroke="#1E2A3A"/><circle cx="-6" cy="0" r="3" fill="#1E2A3A"/><circle cx="6" cy="0" r="3" fill="#1E2A3A"/><path d="M5 -8v-7" stroke="#1E2A3A" stroke-width="2"/></g>';
  else { const mc=z.to?'#C9CED6':'#8B7D6B'; s+='<circle cx="44" cy="-6" r="'+(z.to?11:7)+'" fill="'+mc+'" stroke="#55657A"/><path d="M40 '+(z.to?-19:-15)+'l4-6 4 6" stroke="#F07B3F" stroke-width="2.5" fill="none"/>'; }
  return s+'</svg>'; }
const nmState={dest:'leo',zone:'low'};
function nmStmt(){ const z=O.ZONES[nmState.dest].find(x=>x.k===nmState.zone)||{}, art={moon:['alla Luna','della Luna'],leo:['alla Terra','della Terra'],mars:['a Marte','di Marte'],venus:['a Venere','di Venere']}[nmState.dest], t=$('#mt')?$('#mt').value:'sci';
  if(z.surf) return 'Portare un rover sulla superficie '+art[1]+' e studiarne il suolo da vicino.';
  if(z.moon) return 'Atterrare su '+z.n.split(' ·')[0]+' e studiare il suolo di una luna di Marte.';
  return O.stmt(t,nmState.dest); }
function nmLanding(){ const z=O.ZONES[nmState.dest].find(x=>x.k===nmState.zone)||{}; return !!(z.surf||z.moon); }
const TYPEC={};
function typeAvail(t){ const lv=L.level(G.xp), key=[lv,nmState.dest,nmState.zone,t,G.pad?1:0,(E.STAKE.length)].join('|'); if(key in TYPEC) return TYPEC[key];
  const Mx=L.newMission('x','probe'+t); Mx.sat.dest=nmState.dest; Mx.zone=nmState.zone; Mx.stake=['nasa']; Mx.sat.stake=Mx.stake; Mx.type=t; Mx.lvl=Mx.lvlNow=lv; Mx.padOwned=!!G.pad; Mx.seed=12345;
  let ok=false; try{ ok=L.typeOK(Mx); }catch(e){ ok=true; } return TYPEC[key]=ok; }
function nmSync(){ const z=O.ZONES[nmState.dest].find(x=>x.k===nmState.zone), lnd=nmLanding(), sel=$('#mt');
  $('#nmSum').innerHTML=planet(nmState.dest,26)+'<div><b>'+esc(E.DEST[nmState.dest].n)+' · '+esc(z.n)+'</b><span class="fine">'+esc(zoneBand(z))+(lnd?' · stadio di discesa '+keur((O.LAND[nmState.dest]&&z.surf?O.LAND[nmState.dest]:O.LAND[z.k]||{}).cost||0):'')+'</span></div><button class="btn small" data-act="nmplanet">Cambia</button>';
  Array.from(sel.options).forEach(o=>{ const base=O.TYPES[o.value].n, land=lnd&&['tel','com','deb'].indexOf(o.value)>=0, ok=!land&&typeAvail(o.value); o.disabled=!ok; o.textContent=base+(ok?'':' · 🔒 '+(land?'non sul suolo':'non ancora possibile')); }); if(sel.selectedOptions[0].disabled){ const f=Array.from(sel.options).find(o=>!o.disabled); if(f) sel.value=f.value; }
  $('#mtd').textContent=Array.from(sel.options).some(o=>o.disabled&&!(lnd&&['tel','com','deb'].indexOf(o.value)>=0))?O.TYPES[sel.value].s+' I tipi con il lucchetto non hanno ancora un payload o un propulsore adatto al tuo livello: si sbloccano salendo.':lnd?'Sul suolo il payload è un '+(z.surf?'rover':'lander con trivella')+': servono missioni scientifiche, di osservazione o dimostrative.':O.TYPES[sel.value].s;
  const ms=$('#ms'); if(ms.dataset.auto==='1') ms.value=nmStmt(); }
const maxActive=()=>{ const lv=L.level(G.xp); return lv<=2?2:lv<=4?3:4; }, activeN=()=>G.missions.filter(m=>m.phase!=='done').length;
function newMission(){ if(activeN()>=maxActive()){ toast('Al livello '+L.level(G.xp)+' puoi gestire al massimo '+maxActive()+' missioni aperte. Chiudine una o sali di livello.'); sfx.bad(); return; } const el=$('#ov'), lv=L.level(G.xp); nmState.dest='leo'; nmState.zone='low';
  el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true"><div id="nmMain"><h3>Nuova missione</h3><h2>Che missione vuoi fare?</h2><div class="nm"><div><label for="mn">Titolo</label><input type="text" id="mn" maxlength="18" value="'+esc(['AURASAT','SELENE-1','LUX','ORBIS','ARTEMIDE','HERMES'][G.missions.length%6])+'">'+
    '<label for="mt" style="margin-top:14px">Tipo di missione</label><select id="mt">'+Object.keys(O.TYPES).map(k=>'<option value="'+k+'">'+O.TYPES[k].n+'</option>').join('')+'</select><p class="fine" id="mtd"></p>'+
    '<label for="ms" style="margin-top:14px">Mission statement</label><textarea id="ms" rows="3" maxlength="280" data-auto="1"></textarea><p class="fine">Una frase: perché questa missione esiste. Se riesce e la pubblichi, compare in bacheca.</p></div>'+
    '<div><label>Destinazione</label><div class="nmsum" id="nmSum"></div><label style="margin-top:12px">Scegli il corpo</label><div class="dests">'+Object.keys(E.DEST).map(k=>{ const D=E.DEST[k], lock=lv<D.lvl; return '<button class="dcard'+(k===nmState.dest?' sel':'')+(lock?' lock':'')+'" data-act="dest" data-k="'+k+'"'+(lock?' disabled':'')+'>'+planet(k)+'<b>'+D.n+'</b><small>'+(lock?'🔒 livello '+D.lvl:O.ZONES[k].length+' destinazioni')+'</small></button>'; }).join('')+'</div></div></div>'+
    '<div class="row"><button class="btn primary" data-act="mkm">Crea la missione</button><button class="btn" data-act="closeov">Annulla</button></div></div><div id="nmZone" hidden></div></div>'; el.hidden=false; $('#pop').hidden=true;
  $('#ms').addEventListener('input',e=>{ e.target.dataset.auto='0'; }); $('#mt').addEventListener('change',()=>nmSync()); nmSync(); }
function nmZones(k){ const lv=L.level(G.xp), D=E.DEST[k], Z=O.ZONES[k];
  $('#nmZone').innerHTML='<div class="row" style="gap:14px;align-items:center">'+planet(k,38).replace('<svg ','<svg style="width:84px;height:84px" ')+'<div><h3>Destinazioni su '+esc(D.n)+'</h3><h2>Dove vuoi andare?</h2></div></div>'+
    '<div class="zones">'+Z.map(z=>{ const lock=lv<z.lvl; return '<button class="zcard'+(nmState.dest===k&&nmState.zone===z.k?' sel':'')+(lock?' lock':'')+'" data-act="zone" data-b="'+k+'" data-k="'+z.k+'"'+(lock?' disabled':'')+'>'+zoneIcon(k,z)+'<b>'+esc(z.n)+'</b><small class="num">'+esc(zoneBand(z))+'</small><span>'+esc(z.s)+'</span>'+(lock?'<small class="lk">🔒 livello '+z.lvl+'</small>':'')+'</button>'; }).join('')+'</div>'+
    '<div class="row"><button class="btn" data-act="nmback">← Indietro</button></div>';
  $('#nmMain').hidden=true; $('#nmZone').hidden=false; }
let db=null, remote=[], shared=false;
let MYID=null, ISOWN=false;
function initBoard(){ if(!window.claude||!window.claude.use) return; window.claude.use('user').then(u=>{ if(!u) return; u.id().then(i=>{ MYID=i; }).catch(()=>{}); u.isOwner().then(o=>{ ISOWN=!!o; }).catch(()=>{}); }).catch(()=>{}); window.claude.use('db').then(x=>{ if(!x) return; db=x; shared=true; db.collection('agencies').orderBy('sci','desc').limit(50).onSnapshot(s=>{ RANK=s.docs.map(q=>Object.assign({_id:q.id},q.data())); if(rankModal.open&&!$('#ov').hidden&&$('.ladder')) rankModal(); },()=>{}); setTimeout(pushRank,2500); db.collection('missions3').orderBy('sci','desc').limit(40).onSnapshot(s=>{ remote=s.docs.map(q=>Object.assign({_id:q.id},q.data())); if(!$('#drawer').hidden&&folder.tab==='board') folder('board'); },()=>{ shared=false; }); }).catch(()=>{}); }
function folder(tab){ folder.tab=tab=tab||folder.tab||'mine'; const el=$('#drawer');
  const mine=G.missions.map((m,i)=>{ const r=m.result; return '<article class="entry"><div>'+satThumb(m)+'</div><div><b>'+esc(m.name)+'</b><div class="fine">'+esc(O.TYPES[m.type||'sci'].n)+' · '+esc(zoneName(m))+' · '+phn(m)+' · '+statusLine(m)+'</div>'+(m.statement?'<p class="stmt">'+esc(m.statement)+'</p>':'')+(r?'<div class="fine num">scienza '+r.sci+' · mesi '+r.months+' · bilancio fase F '+keur(r.net)+'</div>':'')+
    '<div class="row" style="margin-top:6px">'+(m.phase==='done'&&r&&r.ok&&!m.published&&!m.tut?'<button class="btn small primary" data-act="publish" data-i="'+i+'">Pubblica in bacheca</button>':'')+(m.published?'<span class="fine">Pubblicata</span>'+(m.boardId?'<button class="btn small no" data-act="unpub" data-id="'+esc(m.boardId)+'" data-i="'+i+'">Rimuovi dalla bacheca</button>':''):'')+(r?'<button class="btn small" data-act="mcr" data-i="'+i+'">Perché è andata così</button>':'')+(m.tut?'':'<button class="btn small" data-act="report" data-id="'+m.id+'">⬇ Resoconto</button>')+'<button class="btn small" data-act="setcur" data-i="'+i+'">Apri</button></div></div></article>'; }).join('');
  const myB=G.myBoard||[], mineB=m=>(MYID&&m.uid===MYID)||myB.indexOf(m._id)>=0;
  const board=(shared?remote:[]).map(m=>({_id:m._id,mine:mineB(m),name:String(m.name||'').slice(0,18),co:String(m.co||'').slice(0,28),sci:Math.max(0,+m.sci|0),months:Math.max(0,+m.months|0),reqs:Math.max(0,+m.reqs|0),ty:O.TYPES[m.ty]?m.ty:'sci',st:String(m.st||'').slice(0,280),dest:E.DEST[m.dest]?m.dest:'moon',stake:Array.isArray(m.stake)?m.stake.filter(id=>E.stk(id)):[]}));
  el.innerHTML='<div class="dr" role="dialog" aria-modal="true"><div class="row" style="justify-content:space-between"><h2>Cartella</h2><div class="row"><button class="btn small" data-act="cmp">⇄ Confronta</button><button class="btn small no" data-act="askreset">Ricomincia da capo</button><button class="btn small" data-act="closedr">Chiudi</button></div></div><div class="tabs"><button class="'+(tab==='mine'?'sel':'')+'" data-act="tab" data-t="mine">Le mie missioni</button><button class="'+(tab==='board'?'sel':'')+'" data-act="tab" data-t="board">Bacheca online</button></div>'+
    (tab==='mine'?(mine||'<div class="empty">Nessuna missione.</div>'):(board.length?board.map(m=>'<article class="entry"><div>'+m.stake.map(emb).join('')+'</div><div><b>'+esc(m.name)+'</b><div class="fine">'+esc(m.co)+' · '+esc(O.TYPES[m.ty].n)+' · '+esc(E.DEST[m.dest].n)+' · '+m.months+' mesi · '+m.reqs+' requisiti</div>'+(m.st?'<p class="stmt">'+esc(m.st)+'</p>':'')+'<div class="num">'+m.sci+' scienza</div>'+(m.mine||ISOWN?'<div class="row" style="margin-top:6px"><button class="btn small no" data-act="unpub" data-id="'+esc(m._id)+'">'+(m.mine?'Rimuovi la mia missione':'Rimuovi (moderazione)')+'</button></div>':'')+'</div></article>').join(''):'<div class="empty">'+(shared?'Nessuna missione pubblicata. Completa una missione e pubblicala: sarà la prima.':'La bacheca online si vede dalla pagina pubblicata.')+'</div>'))+'</div>'; el.hidden=false; }

/* ---------- tempo che scorre ---------- */
function tick(){ if(!G) return; clock(); let dirty=false;
  G.missions.forEach(M=>{
    if(M.phase==='D'&&M.stage==='assembly'&&M.buildEnd&&now()>=M.buildEnd&&!M.buildNote){ M.buildNote=true; dirty=true; toast(M.name+': assemblaggio completato. Portalo al laboratorio prove.'); sfx.ok(); }
    Object.keys(M.tr).forEach(t=>{ const r=M.tr[t]; if(r.res==='run'&&now()>=r.end){ dirty=true; const Lx=E.layout(M.sat); if(t==='vib'&&Lx.topHeavy&&!M.stiff) r.res='struct'; else if(M.defects[t]) r.res='defect'; else { r.res='pass'; M.tests[t]=true; } (r.res==='pass'?sfx.ok:sfx.bad)(); toast(M.name+': prova '+L.MACH[t].tn+(r.res==='pass'?' superata.':' con problemi.')); } });
    if(M.phase==='E'||M.phase==='F'){ const fl=flightNow(M), f=fl.f, endM=f.endMonth||M.duration+1;
      if(fl.pending&&!M.pauseAt){ M.pauseAt=now(); M.alert=true; dirty=true; sfx.bad(); toast('⏸ '+M.name+' · '+fl.pending.t+': serve una tua decisione in sala controllo.'); hud(); return; }
      if(fl.pending) return;
      const bad=fl.log.filter(l=>l.tone==='bad').length; if(bad>(M.seenBad||0)){ if(view==='mcc'&&M===cur()) M.seenBad=bad; else if(!M.alert||bad>(M.alertN||0)){ M.alert=true; M.alertN=bad; sfx.bad(); toast('⚠ '+M.name+': problema in volo. Controlla il Mission Control Center.'); hud(); } }
      if(M.phase==='E'&&(fl.mo>=M.duration||f.early)&&f.alive){ M.phase='F'; dirty=true; }
      if(!f.alive||f.ended&&fl.mo>=endM||fl.mo>=endM+.2){ finish(M,fl); dirty=true; } }
  });
  const C=cur();
  if(dirty){ if(view==='mcc') mccRefresh(true); else if(view!=='build'||!yardOn(C)) render(); else hud(); save(); }
  else { if(view==='build') cleanUpdate(); if(view==='test'&&!DSAT&&cur()&&cur().phase==='D'&&Object.keys(cur().tr).some(t=>cur().tr[t].res==='run')) vTest($('#view')); if(view==='mcc') mccRefresh(false); }
  if(Math.random()<.1) save(); }
function finish(M,fl){ if(M.phase==='done') return; const x=L.closeOut(M,fl,hasB('visit'));
  M.joy=x.joy; gainXP(x.ok?L.XP.win:L.XP.lose); M.result=Object.assign({},x,{joy:undefined}); M.phase='done'; M.got=(M.got||0)+x.inst;
  addMoney(x.net); if(!M.tut){ const l0=leagueOf(G.sciTotal||0); G.sciTotal=(G.sciTotal||0)+Math.max(0,x.sci|0); const l1=leagueOf(G.sciTotal); pushRank(); if(l1>l0) setTimeout(()=>leagueUp(l1),2600); hud(); } if(M===cur()) setTimeout(()=>mcrReview(M),300); else toast(M.name+': missione '+(x.ok?'riuscita':'chiusa')+'. Bilancio '+keur(x.net)+'.'); }
// La revisione di chiusura: i conti, le cause di ogni evento, e il "e se..."
let MCRM=null, WIO=[];
function causeOf(M,l){ const c=l.c||''; if(!c) return '';
  if(c.indexOf('test:')===0){ const t=c.slice(5), m=L.MACH[t], tr=M.tr&&M.tr[t]; return tr&&tr.res==='waived'?'La prova '+m.tn+' l’aveva trovato: hai firmato una deroga.':G.lab.indexOf(t)<0?'Non avevi il macchinario per la prova '+m.tn+' ('+m.n+').':'Hai saltato la prova '+m.tn+'.'; }
  if(c.indexOf('choice:')===0){ const x=(M.choiceL||{})[c.slice(7)]; return x?(x.auto?'L’autopilota, su tua delega, ha scelto «':'Hai scelto «')+esc(x.l)+'»'+(x.h?' ('+esc(x.h)+')':'')+'.':'Una tua scelta.'; }
  if(c.indexOf('auto:')===0) return 'Ha deciso l’autopilota.';
  const pl=O.plan(M);
  return ({'part:avi':'Il computer di bordo: senza scorta, o non resistente alle radiazioni.','part:adcs':'Assetto senza ruota di scorta.','part:com':'La radio scelta in progetto.','part:bat':'Batteria piccola per un’eclisse di '+Math.round(E.eclOf(M.sat)*60)+' minuti.',
    dur:'Il ΔV rimasto non bastava per i '+M.duration+' mesi che hai dichiarato.',strat:'La strategia «'+esc((pl.strn&&pl.strn.n)||(pl.sc&&pl.sc.n)||'')+'» scelta nel Centro di dinamica del volo.',land:'Il rischio dell’atterraggio: lo accetti scegliendo il suolo.',
    plan:'Il piano di volo non arrivava all’orbita obiettivo.',work:'La quota di lavoro scelta nella fascia.',random:'Il caso: nessuna scelta l’avrebbe evitato del tutto.'})[c]||''; }
function whatIfOpts(M,fl){ const o=[], r=M.result, cz=fl.log.map(l=>l.c||'');
  Object.keys(M.choiceL||{}).forEach(m=>{ const x=M.choiceL[m]; x.alt.forEach(a=>o.push({k:'choice',m:+m,v:a.k,l:'Mese '+m+' · '+x.t+': «'+a.l+'» invece di «'+x.l+'»'})); });
  L.TESTS.forEach(t=>{ if(cz.indexOf('test:'+t)>=0) o.unshift({k:'test',t,l:'Con la prova '+L.MACH[t].tn+' fatta e il difetto riparato'}); });
  if(r.missed){ const v=[6,9,12,18,24].filter(x=>x<=r.months&&x<M.duration&&x>=L.minMonths(M)).pop(); if(v) o.push({k:'dur',v,l:'Dichiarando '+v+' mesi invece di '+M.duration}); }
  const pl=O.plan(M); if(pl.strn&&pl.strn.k!=='hoh'&&pl.st.tr.some(x=>x.k==='hoh'&&!x.off)) o.push({k:'strat',v:'hoh',l:'Con il trasferimento Hohmann invece di «'+pl.strn.n+'»'});
  return o.slice(0,6); }
function mcrParts(M){ const r=M.result, fl=L.flight(M,M.duration+2,true);
  const rows=fl.log.filter(l=>l.c&&(l.tone==='bad'||l.c.indexOf('choice:')===0||l.c==='strat'||l.c==='work')).slice(0,9);
  const head=r.ok?'Missione riuscita: '+r.months+' mesi.':!r.alive?esc(r.cause||'Satellite perso.'):r.impact==null?'Il satellite è rimasto in orbita come detrito.':'Missione troppo breve.';
  const money='<table class="pay"><tr><td>Scienza consegnata ('+r.sci+' × 1,2)</td><td class="num">+'+keur(r.sciPay)+'</td></tr>'+(r.bonus?'<tr><td>Premi degli stakeholder soddisfatti</td><td class="num">+'+keur(r.bonus)+'</td></tr>':'')+(r.reward>r.sciPay+r.bonus?'<tr><td>Centro visitatori +15%</td><td class="num">+'+keur(r.reward-r.sciPay-r.bonus)+'</td></tr>':'')+
    '<tr><td>Ultima rata (MCR)'+(r.ok?'':' · non pagata: missione non riuscita')+'</td><td class="num">+'+keur(r.inst)+'</td></tr><tr><td>Operazioni: '+r.months+' mesi × '+L.OPS+' cr</td><td class="num bad">−'+keur(r.ops)+'</td></tr>'+(r.penalty?'<tr><td>Penale: '+r.missed+' mesi promessi e non volati</td><td class="num bad">−'+keur(r.penalty)+'</td></tr>':'')+'<tr class="tot"><td>Bilancio della fase F</td><td class="num">'+keur(r.net)+'</td></tr></table>';
  const why=rows.length?'<h3>Perché è andata così</h3><div class="chain">'+rows.map(l=>'<div class="chn"><div class="c1"><small>Origine</small>'+causeOf(M,l)+'</div><i>→</i><div class="c2"><small>Mese '+l.m+' · evento</small>'+esc(l.t)+'</div><i>→</i><div class="c3 '+(l.tone||'flat')+'"><small>Esito</small>'+(l.tone==='bad'?'Danno alla missione':l.tone==='good'?'Superato':'Effetto contenuto')+'</div></div>').join('')+'<div class="chn"><div class="c1"><small>Totale</small>'+r.sci+' punti scienza</div><i>→</i><div class="c2"><small>Fine</small>'+head+'</div><i>→</i><div class="c3 '+(r.ok?'good':'bad')+'"><small>Missione</small>'+(r.ok?'Riuscita':'Non riuscita')+'</div></div></div>':'';
  return {r,fl,rows,head,money,why}; }
function mcrReview(M){ const r=M.result; if(!r) return; const X=mcrParts(M), fl=X.fl, head=X.head, money=X.money, why=X.why; MCRM=M; WIO=whatIfOpts(M,fl);
  const wi=WIO.length?'<h3>E se…?</h3><p class="fine">Rigioca il volo cambiando una sola cosa.</p><div class="wis">'+WIO.map((o,i)=>'<button class="btn small" data-act="whatif" data-i="'+i+'">'+esc(o.l)+'</button>').join('')+'</div><div class="result w" id="wires" hidden></div>':'';
  review({eb:'Fine fase F',name:'Mission Close-out Review',code:'MCR',nasa:'Decommissioning Review',stamp:r.ok?'CHIUSA':'NON RIUSCITA',no:!r.ok,short:head+(LANG==='en'?' Science ':' Scienza ')+'<b class="num">'+r.sci+'</b>.',
    body:money+(r.quests.length?'<p class="fine">'+r.quests.map(q=>esc(E.stk(q.id).n)+(q.ok?' soddisfatto (+'+q.bonus+' cr)':' deluso')).join(' · ')+'</p>':'')+why+wi,
    actions:'<button class="btn primary" data-act="closeov">Chiudi</button>'+(!M.tut?'<button class="btn" data-act="report" data-id="'+M.id+'">⬇ Resoconto</button>':'')+(r.ok&&!M.published&&!M.tut?'<button class="btn" data-act="folder">Pubblica</button>':'')});
  $('#ov .rv').classList.add('wide'); }

/* ---------- azioni ---------- */
const ACT={
  enter(t){ $('#pop').hidden=true; if(t.dataset.k==='pad'&&!G.pad){ padModal(); return; } sfx.tap(); go(t.dataset.k); }, home(){ go('hub'); },
  switch(){ if(!G.missions.length){ newMission(); return; } switcher(); },
  setcur(t){ G.cur=+t.dataset.i; $('#pop').hidden=true; $('#drawer').hidden=true; sfx.tap(); render(); },
  newm(){ if(G.tut){ toast('Prima finisci il tutorial, oppure saltalo.'); sfx.bad(); return; } newMission(); }, closeov(){ closeOv(); }, closedr(){ $('#drawer').hidden=true; },
  mkm(){ setTimeout(()=>{ const m=cur(); if(m&&m.dk==null) m.dk=dif().dk; },0); const n=($('#mn').value.trim()||'MISSIONE').slice(0,18).toUpperCase(), D=nmState.dest, z=O.ZONES[D].find(x=>x.k===nmState.zone); if(!z||L.level(G.xp)<E.DEST[D].lvl||L.level(G.xp)<z.lvl){ toast('Destinazione bloccata.'); return; }
    if(activeN()>=maxActive()){ toast('Troppe missioni aperte.'); return; } const first=!G.missions.length, M=L.newMission(n,'m'+Date.now().toString(36)); M.first=first; M.statement=($('#ms').value||'').trim().slice(0,280); M.sat.dest=D; M.zone=nmState.zone; M.stake=['nasa']; M.sat.stake=M.stake; M.type=$('#mt').value; if($('#mt').selectedOptions[0].disabled){ toast('Questo tipo di missione non è ancora possibile al tuo livello.'); return; } M.lvl=L.level(G.xp); G.missions.push(M); G.cur=G.missions.length-1; closeOv(); sfx.ok(); render(); toast(M.name+' creata. Entra nell’edificio amministrativo: la NASA ti aspetta al tavolo.'); },
  dest(t){ sfx.tap(); nmZones(t.dataset.k); },
  nmplanet(){ sfx.tap(); nmZones(nmState.dest); },
  nmback(){ $('#nmZone').hidden=true; $('#nmMain').hidden=false; },
  zone(t){ let b=t.dataset.b, k=t.dataset.k; const z=O.ZONES[b].find(x=>x.k===k); if(z.to){ b=z.to.dest; k=z.to.zone; } nmState.dest=b; nmState.zone=k; $$('.dcard').forEach(x=>x.classList.toggle('sel',x.dataset.k===b)); $('#nmZone').hidden=true; $('#nmMain').hidden=false; sfx.ok(); nmSync(); },
  pickLV(t){ const M=cur(); if(M.phase!=='B') return; M.sat.lv=t.dataset.k; sfx.tap(); if(M.drm){ const keep=M.drm.eol; M.drm=null; drmInit(M); if(keep&&!drmLand(M)) M.drm.eol=keep; } closeOv(); render(); },
  drmlv(){ const M=cur(); const el=$('#ov'); el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true"><h3>Design Reference Mission</h3><h2>Come vai nello spazio</h2><p class="fine">Il lanciatore decide l’orbita di rilascio: il primo passaggio della tua missione.</p>'+fdLaunch(M)+'<div class="row"><button class="btn" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false; },
  drmadd(){ DRMADD=!DRMADD; DRMG=null; sfx.tap(); render(); },
  drmdel(t){ const M=cur(), D=M.drm, i=+t.dataset.i; D.orbits.splice(i,1); if(D.star===i){ const r=drmRel(M); D.star=r.circ&&drmIn(M,(r.pe+r.ap)/2)?-1:D.orbits.findIndex(o=>drmIn(M,o.h)); if(D.star<-1) D.star=-1; if(D.star===-1&&!(r.circ&&drmIn(M,(r.pe+r.ap)/2))) D.star=null; } else if(D.star>i) D.star--; D.done=false; drmSync(M); sfx.tap(); save(); render(); },
  drmmo(t){ const M=cur(), D=M.drm, i=+t.dataset.i, d=+t.dataset.d; if(i<0) D.relMo=Math.max(1,Math.min(60,D.relMo+d)); else D.orbits[i].mo=Math.max(1,Math.min(60,D.orbits[i].mo+d)); sfx.tap(); save(); render(); },
  drmstar(t){ const M=cur(), D=M.drm, i=+t.dataset.i; if(i<0){ if(!D.relMo) D.relMo=L.minMonths(M); } D.star=i; drmSync(M); sfx.tap(); save(); render(); },
  drmeol(t){ const M=cur(), D=M.drm, k=t.dataset.k; D.eol={k}; sfx.put(); save(); render(); },
  drmeolx(){ const M=cur(); M.drm.eol=null; M.drm.done=false; sfx.tap(); save(); render(); },
  bstep(t){ const M=cur(), k=t.dataset.k; if(!M||M.phase!=='B') return; const D=drmInit(M); if(k!=='drm'&&!(drmLand(M)||(D.eol&&drmStarH(M)!=null))){ toast('Prima completa la DRM: orbita di lavoro ★ e fine vita.'); return; } if(k!=='drm') D.done=true; M.stage=k; DRMADD=false; DRMG=null; sfx.tap(); save(); if(k==='sat'){ go('build'); BVIEW='yard'; render(); } else go('fd'); },
  pdrB(){ pdrB(); },
  toC(){ toC(); },
  pickST(t){ const M=cur(), d=M.sat; if(M.rideFixed) return; d.ride=t.dataset.k; d.stake=M.stake; d.acc=d.acc||{}; E.prune(d); if(!E.solOK(d,d.sol)||!L.techOK(M,d.sol,d.ride)) d.sol=L.availSol(M,d.ride)[0]||d.sol; M.stage='design'; sel=null; sfx.ok(); render(); },
  autoarr(){ autoRun('arrange'); }, autoprop(){ autoRun('propose'); }, suggest(){ suggest(); },
  strat(t){ const M=cur(); M.traj=M.traj||{}; M.traj[t.dataset.leg]=t.dataset.k; sfx.put(); fdRefresh(true); },
  expert(){ const M=cur(); M.traj=M.traj||{}; if(!M.traj.expert){ const p=O.plan(M); M.fd.burns=p.orbits.slice(1).map(o=>({nu:Math.round(o.b.nu),h:Math.round(o.b.h),dp:Math.round((o.b.dp||0)*10)/10})); M.traj.expert=true; fdSel=1; } else M.traj.expert=false; sfx.tap(); fdRefresh(true); },
  fdadd(){ const M=cur(), p=O.plan(M), last=p.final; M.fd.burns.push({nu:0,h:Math.round(isFinite(last.ap)?last.ap:last.pe),dp:0}); fdSel=M.fd.burns.length; sfx.put(); fdRefresh(true); },
  fddel(t){ const M=cur(), k=+t.dataset.k; M.fd.burns.splice(k-1,1); fdSel=Math.max(1,Math.min(fdSel,M.fd.burns.length)); sfx.tap(); fdRefresh(true); },
  fdsel(t){ fdSel=+t.dataset.k; sfx.tap(); fdRefresh(true); },
  obsel(t){ OBSEL=+t.dataset.k; sfx.tap(); fdRefresh(true); },
  obpre(t){ const M=cur(); if(!M||!M.ob||fdLocked(M)) return; const p=O.plan(M), k=+t.dataset.k, o=p.orbits[k]; if(!o||o.leg==null) return; const Lg=M.ob.legs[o.leg], q=t.dataset.p, B=obBody(M), a=B.R+o.h;
    if(q==='circ') Lg.e=0; else if(q==='pol') Lg.i=90; else if(q==='eq') Lg.i=0; else if(q==='sso') Lg.i=Math.round(Math.acos(Math.max(-1,-Math.pow(a/12352,3.5)))*1800/Math.PI)/10; else if(q==='same'){ const pr=p.orbits[k-1].el; Lg.i=Math.round(pr.i*10)/10; Lg.raan=Math.round((pr.raan||0)*10)/10; }
    sfx.put(); save(); fdRefresh(true); },
  relv(){ const M=cur(); M.stage='drm'; sfx.tap(); render(); },
  view(t){ if(S3.ok) S3.setView(t.dataset.k); },
  sec(t){ offSec=t.dataset.k; $$('[data-act="sec"]').forEach(b=>b.classList.toggle('on',b.dataset.k===offSec)); renderSponsors(); },
  recruit(t){ const id=t.dataset.k, lv=L.level(G.xp), picks=Math.max(1,lv-2)-G.recruited.length; if(picks<=0){ toast('Un nuovo sponsor si sblocca al prossimo livello.'); return; } G.recruited.push(id); L.addSponsor(id); sfx.stamp(); toast(E.stk(id).n+' è nel tuo roster: lo trovi nell’edificio amministrativo.'); render(); },
  askreset(){ $('#drawer').hidden=true; review({eb:'Attenzione',name:'Ricominciare da capo?',code:'—',nasa:'—',body:'<p>Cancelli agenzia, missioni, edifici, macchinari, sponsor e livello. Non si torna indietro.</p>',actions:'<button class="btn no" data-act="reset">Sì, ricomincia</button><button class="btn" data-act="closeov">Annulla</button>'}); },
  reset(){ try{ localStorage.removeItem('gng32.save'); }catch(e){} for(let i=E.STAKE.length-1;i>=0;i--) if(E.STAKE[i].sponsor||E.STAKE[i].ag) E.STAKE.splice(i,1); G=newG(); closeOv(); view='hub'; render(); welcome(); },
  speed(){ G.speed=1; },
  lang(){ try{ localStorage.setItem('gngLang',LANG==='en'?'it':'en'); }catch(e){} save(); location.reload(); },
  hmenu(){ document.body.classList.toggle('hmo'); sfx.tap(); hud(); },
  fullsc(){ const d=document, e=d.documentElement; if(d.fullscreenElement||d.webkitFullscreenElement){ (d.exitFullscreen||d.webkitExitFullscreen).call(d); } else { const f=e.requestFullscreen||e.webkitRequestFullscreen; if(f) Promise.resolve(f.call(e,{navigationUI:'hide'})).then(()=>{ try{ screen.orientation&&screen.orientation.lock&&screen.orientation.lock('landscape').catch(()=>{}); }catch(_){} }).catch(()=>toast('Schermo intero non disponibile qui.')); } },
  tsize(){ G.big=!G.big; document.documentElement.classList.toggle('big',G.big); save(); hud(); },
  music(){ G.music=G.music===false; if(G.music) musStart(); else musStop(); toast(G.music?'Musica accesa.':'Musica spenta.'); save(); hud(); },
  folder(){ closeOv(); folder('mine'); }, tab(t){ folder(t.dataset.t); },
  stk(t){ const M=cur(), id=t.dataset.id, i=M.stake.indexOf(id); if(id==='nasa'){ toast('La NASA finanzia la missione: resta al tavolo.'); return; } if(i<0&&L.fits4(id,M)){ toast(E.stk(id).n+' '+L.fits4(id,M)+'.'); sfx.bad(); return; } if(i>=0) M.stake.splice(i,1); else if(M.stake.length<maxStake()) M.stake.push(id); else { toast('Al massimo '+maxStake()+' stakeholder.'); return; } M.sat.stake=M.stake; sfx.tap(); vPartners($('#view'),M); },
  sit(){ const M=cur(); if(!M.stake.length) return; L.startMeeting(M,'0'); if(hasB('office')) M.stake.forEach(id=>{ M.joy[id]=75; }); sfx.ok(); render(); },
  yes(){ const M=cur(), id=M.queue[0], r=L.R(id), p=PRC[prKey(M,r)]; const chips=$$('#price .pchip').map(c=>{ const q=c.getBoundingClientRect(), n=c.cloneNode(true); n.classList.add('fly'); n.style.left=q.left+'px'; n.style.top=q.top+'px'; n.style.margin='0'; document.body.appendChild(n); return n; });
    if(p&&p.ok&&!p.free&&!p.noBase&&p.kind!=='tests'){ M.commit=M.commit||{dc:0,dm:0}; M.commit.dc+=p.dc||0; M.commit.dm+=p.dm||0; }
    L.answer(M,id,true); sfx.ok(); render(); const t=$('#mtot'); if(t){ const q=t.getBoundingClientRect(); chips.forEach(n=>{ const a=n.getBoundingClientRect(); requestAnimationFrame(()=>{ n.style.transform='translate('+(q.left+q.width/2-a.left-a.width/2)+'px,'+(q.top+q.height/2-a.top-a.height/2)+'px) scale(.3)'; n.style.opacity='0'; }); setTimeout(()=>n.remove(),760); }); setTimeout(()=>{ t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); },600); } else chips.forEach(n=>n.remove()); },
  soft(){ const M=cur(), id=M.queue[0], sf=L.softOf(id,M); L.answer(M,id,true,true); sfx.put(); toast(PEO[L.R(id).who].n+' accetta la controproposta: «'+sf.t+'».'); render(); },
  no(){ const M=cur(); if(L.R(M.queue[0]).rule) return; const lv=L.answer(M,M.queue[0],false); sfx.bad(); if(lv) gone(M,lv); render(); },
  endmeet(){ const M=cur();
    if(M.meetPh==='0'){ const fund=L.pledged(M); M.funded=fund; M.stage='done'; const inst=L.installment(M,'MDR');
      review({eb:'Fine fase 0',name:'Mission Definition Review',code:'MDR',nasa:'Mission Concept Review',stamp:'GO',short:LANG==='en'?'Mission requirements approved. <b class="num">'+keur(fund)+'</b> promised, paid in instalments.':'Requisiti di missione approvati. Promessi <b class="num">'+keur(fund)+'</b>, pagati a rate.',body:'<p>'+M.reqs.length+' requisiti di missione. Gli stakeholder promettono <b class="num">'+keur(fund)+'</b>, ma pagano a rate, alle revisioni.</p>'+payPlan(M,'MDR'),actions:'<button class="btn primary" data-act="toA">Incassa la prima rata e vai avanti</button>'}); }
    else { M.stage='done'; review({eb:'Fine fase A',name:'System Requirements Review',code:'PRR',nasa:'System Requirements Review',stamp:'GO',short:LANG==='en'?'System requirements set. Now you draw the orbit.':'Requisiti di sistema fissati. Ora si disegna l’orbita.',body:'<p>'+esc(E.RIDES[M.sat.ride].n)+' · '+M.reqs.filter(x=>x.kind==='SYS').length+' requisiti di sistema. In fase B si fa l’analisi orbitale nel Centro di dinamica del volo.</p>',actions:'<button class="btn primary" data-act="toB">Avanti</button>'}); } },
  toA(){ const M=cur(); closeOv(); const first=once(M,'MDR'), inst=first?L.installment(M,'MDR'):0; M.got=(M.got||0)+inst; if(inst) addMoney(inst); if(first) gainXP(L.XP.MDR); M.phase='A'; M.stage='type'; render(); toast((inst?'Prima rata: '+keur(inst)+'. ':'')+'Fase A: rientra nell’edificio amministrativo per scegliere il satellite e sentire lo staff tecnico.'); },
  pickType(t){ const M=cur(), d=M.sat; d.ride=t.dataset.k; M.rideFixed=true; d.stake=M.stake; d.acc=d.acc||{}; E.prune(d); d.sol=L.availSol(M,d.ride)[0]||d.sol; L.startMeeting(M,'A'); sfx.ok(); render(); },
  toB(){ const M=cur(); closeOv(); if(once(M,'SRR')) gainXP(L.XP.PRR); M.phase='B'; M.stage='drm'; if(!M.sat.lv){ const ks=Object.keys(E.LV).filter(k=>lvShown(k,M)&&!lvLock(k,M)&&E.LV[k].fits.indexOf(M.sat.ride)>=0); if(ks.length) M.sat.lv=ks[0]; } render(); toast('Fase B: esci e vai al Centro di dinamica del volo per disegnare la missione (DRM).'); },
  ride(t){ const d=cur().sat, k=t.dataset.k; d.ride=k; E.prune(d); sel=null; sfx.tap(); bRefresh(); },
  stab(t){ shelfTab=t.dataset.k; sfx.tap(); renderShelf(); },
  ssort(t){ shelfSort=t.dataset.k; sfx.tap(); renderShelf(); },
  lockinfo(t){ const M=cur(), id=t.dataset.k, o=P[id]||E.SOLAR[id]||ACC[id]; if(!o) return; const tt=o.db||{}, ln=L.effLvl(M,o), lv=M.lvlNow||M.lvl||1, el=$('#info'); sfx.tap(); if(!el) return;
    const why=ln>lv?'Si sblocca al livello '+ln+': ti mancano '+Math.max(0,L.LEVELS[ln-1]-G.xp)+' XP. Si guadagnano chiudendo missioni.':'Non entra in questa struttura: serve un CubeSat più grande.';
    toast('🔒 '+o.n+' · '+why); el.innerHTML='<div><b>🔒 '+esc(o.n)+'</b> <span class="fine">TRL '+o.trl+' · '+esc(tt.ente||'')+'</span><div class="fine num">'+nf((o.m||0)+(o.propM||0))+' kg · '+nf(o.p||0)+' W · '+keur(o.c)+(o.U?' · '+nf(o.U)+' U':'')+(o.isp?' · Isp '+o.isp+' s':'')+'</div><div class="fine">'+esc(tt.scopo||'')+'</div><div class="why">'+why+'</div></div>'; },
  tank(t){ const M=cur(), d=M.sat; if(M.phase!=='B'){ toast('Il progetto è congelato: il serbatoio si sceglie in fase B.'); sfx.bad(); return; } d.tank=+t.dataset.k; sfx.tap(); bRefresh(); save(); },
  sol(t){ const d=cur().sat, k=t.dataset.k; if(!E.SOLAR[k]) return; unfresh(k); d.sol=k; sfx.tap(); bRefresh(); },
  acc(t){ const d=cur().sat, k=t.dataset.k; unfresh(k); d.acc=d.acc||{}; d.acc[k]=!d.acc[k]; sfx.tap(); bRefresh(); },
  rot(){ rotateSel(); }, del(){ const d=cur().sat; if(sel){ delete d.placed[sel]; delete d.heat[sel]; sel=null; bRefresh(); } }, heat(){ const d=cur().sat; if(sel){ d.heat[sel]=!d.heat[sel]; sfx.tap(); bRefresh(); } },
  pdr(){ const M=cur(), bad=pdrList(M);
    if(!bad.length){ const cost=costDue(M); review({eb:'Fine fase C',name:'Critical Design Review',code:'CDR',nasa:'Critical Design Review',stamp:'GO',short:(LANG==='en'?'The design meets the requirements. Parts: ':'Il progetto rispetta i requisiti. Pezzi: ')+'<b class="num">'+keur(cost)+'</b>.',body:'<p>Il progetto rispetta tutti i requisiti. I pezzi costano <b class="num">'+keur(cost)+'</b>; l’assemblaggio in camera bianca richiede '+Math.round(L.TIME.build/1000)+' s.</p>'+(G.money<cost?'<p class="bad">In cassa ci sono solo '+keur(G.money)+'. Serve un progetto più economico.</p>':''),actions:'<button class="btn primary" data-act="toD">Compra i pezzi e assembla</button><button class="btn" data-act="closeov">Non ancora</button>'}); return; }
    const base=bad.filter(x=>x.base), soft=bad.filter(x=>!x.base);
    review({eb:'Fine fase C',name:'Critical Design Review',code:'CDR',nasa:'Critical Design Review',stamp:'NO-GO',no:true,body:'<ul class="reqs">'+bad.map(x=>'<li><span class="c">'+(x.base?'BASE':x.code)+'</span><span>'+esc(x.t)+(x.who?' <span class="fine">· '+esc(PEO[x.who].n)+'</span>':'')+'</span><span>'+(x.base?'':L.R(x.id).rule?'<span class="fine">regola</span>':'<button class="btn small no" data-act="waive" data-id="'+x.id+'">Deroga</button>')+'</span></li>').join('')+'</ul>'+
      (soft.length?'<p class="fine">Una deroga chiude il requisito, ma è una promessa rotta: chi lo ha chiesto perde '+L.JOY.waive+' punti di soddisfazione, e con loro una parte delle rate.</p>':'')+(base.length?'<p class="fine">I requisiti di base non si derogano.'+(base.some(x=>x.fd)?' Il piano di volo si progetta nel Centro di dinamica del volo.':'')+'</p>':''),actions:'<button class="btn primary" data-act="closeov">Torna al progetto</button>'}); },
  waive(t){ const M=cur(); if(t.dataset.t){ M.tr[t.dataset.t].res='waived'; sfx.bad(); render(); return; } if(L.R(t.dataset.id).rule){ toast('Le regole non si derogano.'); return; } const lv=L.waive(M,t.dataset.id); sfx.bad(); if(lv) gone(M,lv); closeOv(); if(M.phase==='D') ACT.frr(); else ACT.pdr(); },
  toD(){ const M=cur(), cost=costDue(M); if(G.money<cost){ toast('Non hai abbastanza crediti.'); return; } closeOv(); addMoney(-cost,'Pezzi comprati: −'+keur(cost)+'. Fase D: assemblaggio in camera bianca.'); if(once(M,'CDR')) gainXP(L.XP.CDR); M.paid=(M.paid||0); M.partsCredit=0; if(S3.ok){ try{ M.snap=S3.snap(M.sat,240); }catch(e){} } M.paid=(M.paid||0)+cost; M.partsVal=E.budget(M.sat).cost-(M.lvPaid||0); M.phase='D'; M.stage='assembly'; M.tests={}; M.tr={}; M.ready=false; M.buildDur=L.TIME.build*(hasB('factory')?.5:1)*(M.tut?.15:1)*workK(); M.buildEnd=9e15; M.asmWait=true; M.station=null; M.buildNote=false; render(); toast('Pezzi comprati. Ora porta il satellite su una postazione della camera bianca.'); },
  cdr(){ const M=cur(); M.rnd=hasB('rnd'); M.defects=M.tut?{}:L.defects(M); M.stage='test'; M.tests={}; M.tr={}; M.ready=false; sfx.ok(); render(); toast(M.name+' è assemblato: esci e portalo all’edificio di testing per le prove.'); },
  tolab(){ closeOv(); go('test'); },
  pick(t){ const i=G.missions.findIndex(m=>m.id===t.dataset.id); if(i>=0){ G.cur=i; sfx.tap(); render(); } },
  bay(t){ bayModal(+t.dataset.i); },
  install(t){ const k0=t.dataset.k, m0=L.MACH[k0]; if(G.money<m0.c){ toast('Non hai abbastanza soldi.'); sfx.bad(); return; } if(G.lab.length>=LABMAX){ toast('Laboratorio pieno.'); return; } closeOv(); RPLACE={room:'test',k:k0}; RSEL=null; go('test'); toast('Tocca un punto libero del laboratorio per posizionare '+m0.n.toLowerCase()+'.'); },
  installOld(t){ const k=t.dataset.k, m=L.MACH[k]; if(G.money<m.c){ toast('Non hai abbastanza soldi.'); sfx.bad(); return; } addMoney(-m.c); G.lab[+t.dataset.i]=k; closeOv(); sfx.put(); toast(m.n+' installato.'); render(); },
  plot(t){ CTAB='Edifici'; CBAR=true; G.cedit=true; go('hub'); },
  cplace(t){ const k=t.dataset.k, ki=cKind(k); if(k==='dish'&&!hasB('ground')){ toast('Le antenne si collegano alla stazione di terra: costruiscila prima (Edifici).'); sfx.bad(); return; } if(L.level(G.xp)<ki.lvl){ toast('Si sblocca al livello '+ki.lvl+'.'); return; } if(cBuilt(k)){ toast('Già costruito.'); return; } if(G.money<ki.c){ toast('Non hai abbastanza crediti.'); sfx.bad(); return; } if(SREQ[k]&&G.staff-staffNeed()<SREQ[k]){ toast(ki.n+': servono '+SREQ[k]+' dipendenti liberi, ne hai '+Math.max(0,G.staff-staffNeed())+'. Assumili (ognuno vuole un posto auto).'); sfx.bad(); staffModal(); return; } CPLACE={k}; CSEL=null; if(innerWidth<640&&G.world.cam.z>.7){ cZoom(.7/G.world.cam.z); } sfx.tap(); render(); },
  ctab(t){ CTAB=t.dataset.k; sfx.tap(); render(); }, cbar(){ CBAR=!CBAR; G.cedit=CBAR; CSEL=null; if(!CBAR) CPLACE=null; sfx.tap(); render(); }, cesc(){ CPLACE=null; render(); },
  czoom(t){ cZoom(+t.dataset.k>0?1.2:1/1.2); save(); },
  cedit(){ G.cedit=!G.cedit; CBAR=G.cedit; CSEL=null; CPLACE=null; sfx.tap(); render(); },
  cmove(){ const it=G.world.items.find(i=>i.id===CSEL); if(!it) return; CPLACE={k:it.k,moveId:it.id}; sfx.tap(); render(); },
  cdel(){ const W=G.world, it=W.items.find(i=>i.id===CSEL); if(!it||CAM.K[it.k].core) return; if(it.k==='parking'&&spaces()-SPACES<G.staff){ toast('Senza questo parcheggio '+(G.staff-(spaces()-SPACES))+' dipendenti resterebbero senza posto auto.'); sfx.bad(); return; } if(SREQ[it.k]){ /* l'edificio libera i suoi dipendenti */ } const ki=cKind(it.k); W.items=W.items.filter(i=>i!==it); if(L.BUILD[it.k]) G.plots=G.plots.filter(k=>k!==it.k); addMoney(Math.round(ki.c/2)); CSEL=null; sfx.tap(); toast(ki.n+' rimosso.'); save(); render(); },
  flagedit(){ flagModal(); }, flcol(t){ FLST.col=t.dataset.k; $$('.fled .pal button').forEach(b=>b.classList.toggle('on',b.dataset.k===FLST.col)); },
  flsize(t){ FLST.size=+t.dataset.k; }, flfill(){ const cv=$('#flc'); if(!cv) return; const cx=cv.getContext('2d'); cx.fillStyle=FLST.col; cx.fillRect(0,0,300,180); }, fltpl(t){ flagTpl(t.dataset.k); },
  flsave(){ const cv=$('#flc'); if(!cv) return; const c2=document.createElement('canvas'); c2.width=150; c2.height=90; c2.getContext('2d').drawImage(cv,0,0,150,90); G.flag=c2.toDataURL('image/png'); closeOv(); sfx.stamp(); toast('Bandiera dipinta sull’edificio di costruzione.'); save(); render(); },
  flreset(){ G.flag=null; closeOv(); save(); render(); },
  buildb(t){ const k=t.dataset.k, b=L.BUILD[k]; if(G.money<b.c){ toast('Non hai abbastanza soldi.'); sfx.bad(); return; } addMoney(-b.c); G.plots[+t.dataset.i]=k; closeOv(); sfx.stamp(); toast(b.n+' costruito: '+b.s); render(); },
  binfo(t){ facK=t.dataset.k||G.plots[+t.dataset.i]; sfx.tap(); go('fac'); },
  binfoOld(t){ const k=G.plots[+t.dataset.i], b=L.BUILD[k]; review({eb:'Edificio',name:b.n,code:'—',nasa:'—',body:'<p>'+b.s+'</p><p class="fine">Effetto attivo su tutte le missioni.</p>',actions:'<button class="btn primary" data-act="closeov">Chiudi</button>'}); },
  runtest(t){ const M=cur(), k=t.dataset.k; if(G.money<L.RUN){ toast('Non hai abbastanza soldi.'); return; } addMoney(-L.RUN); const td=L.TIME.test*(M.tut?.2:1)*workK(); M.tr[k]={res:'run',end:now()+td,dur:td}; sfx.tap(); render(); },
  fix(t){ const M=cur(); if(G.money<L.FIXC){ toast('Non hai abbastanza soldi.'); return; } addMoney(-L.FIXC); M.tr[t.dataset.t].res='fixed'; M.tests[t.dataset.t]=true; sfx.ok(); render(); },
  stiff(){ const M=cur(); if(G.money<L.STIFFC){ toast('Non hai abbastanza soldi.'); return; } addMoney(-L.STIFFC); M.stiff=true; if(M.defects.vib) M.tr.vib.res='defect'; else { M.tr.vib.res='pass'; M.tests.vib=true; } sfx.ok(); render(); },
  frr(){ const M=cur(), miss=L.status(M,M.sat).list.filter(x=>x.kind==='tests'&&!x.ok).sort((a,b)=>(L.R(a.id).rule?1:0)-(L.R(b.id).rule?1:0)), un=L.TESTS.filter(t=>!M.tests[t]), RK=L.risks(M,G.lab.filter(Boolean)).list, hi=RK.filter(x=>x.p*x.i>=6);
    if(miss.length){ review({eb:'Fine fase D',name:'Flight Readiness Review',code:'AR, FRR',nasa:'Flight Readiness Review',stamp:'NO-GO',no:true,body:'<p>'+miss.map(x=>x.code+' · '+esc(x.t)).join('<br>')+'</p><p class="fine">'+(L.R(miss[0].id).rule?'L’ente regolatore non autorizza il lancio senza queste prove: niente deroghe.':esc(PEO.pa.n)+' non firma senza queste prove.')+'</p>',actions:'<button class="btn primary" data-act="closeov">Torna alle prove</button>'+(L.R(miss[0].id).rule?'':'<button class="btn no" data-act="waive" data-id="'+miss[0].id+'">Deroga</button>')}); return; }
    review({eb:'Fine fase D',name:'Flight Readiness Review',code:'AR, FRR',nasa:'Flight Readiness Review',short:(LANG==='en'?'Open risks: ':'Rischi aperti: ')+'<b>'+RK.length+'</b>'+(hi.length?', <b class="bad">'+hi.length+(LANG==='en'?' high':' alti')+'</b>':'')+(LANG==='en'?'. The Go is your call.':'. Il Go lo decidi tu.'),body:(un.length?'<p>Senza prova superata: '+un.map(t=>L.MACH[t].n).join(', ')+'. Eventuali difetti voleranno con il satellite.</p>':'<p>Tutte le prove superate.</p>')+'<p><b>Rischi aperti: '+RK.length+'</b>, di cui <b>'+hi.length+' alti</b>'+(hi.length?': '+hi.map(x=>esc(x.t)).join(', '):'')+'.</p><p>Con il Go gli stakeholder versano la terza rata: <b class="num">'+keur(L.installment(M,'FRR'))+'</b>.</p><p>La decisione è tua.</p>',actions:'<button class="btn primary" data-act="go">Go</button><button class="btn" data-act="closeov">No-go</button>'}); },
  go(){ const M=cur(); M.ready=true; closeOv(); sfx.stamp(); const first=once(M,'FRR'); if(first) gainXP(L.XP.FRR); const inst=first?L.installment(M,'FRR'):0; M.got=(M.got||0)+inst; addMoney(inst); if(M.sat.lv!=='HOME'){ render(); toast(M.name+' è pronto: comincia la fase E. Vai all’edificio amministrativo per il lancio.'); return; } toast(M.name+' è sulla rampa di lancio: comincia la fase E.'); render(); },
  xopen(){ xLaunchModal(cur()); },
  xlaunch(){ const M=cur(); if(!M||M.phase!=='D'||!M.ready||LBUSY) return; LBUSY=true; M.duration=LDUR||M.duration; const rk=$('#lrk'), cnt=$('#lcnt'); $$('.lbtn,.ldur').forEach(b=>b.classList.add('dis')); let n=10; sfx.tap();
    const iv=setInterval(()=>{ n--; if(cnt) cnt.textContent=n>0?'T-'+n:'DECOLLO'; if(n===3&&rk) rk.classList.add('ign'); if(n>0){ sfx.tap(); return; } clearInterval(iv); sfx.stamp(); tone(60,1.8,'sawtooth',.06);
      const sm=$('#lsmk'); if(sm) sm.innerHTML=[-150,-90,-40,40,90,150,-200,200].map((x,i)=>'<circle class="puff" cx="'+(640+x)+'" cy="'+(540-Math.abs(x)*.08)+'" r="'+(34+i*4)+'" fill="#fff" style="animation-delay:'+(i*.07)+'s"/>').join('');
      if(rk){ rk.classList.remove('ign'); rk.classList.add('go'); rk.querySelector('.lfl').setAttribute('opacity','1'); }
      setTimeout(()=>{ startFlight(M); LBUSY=false; MCCV=null; render(); toast(M.name+' è in orbita: esci e vai al Mission Control Center per seguirlo.'); },3300); },420); },
  padsite(){ if(L.level(G.xp)<12){ toast('La rampa si sblocca al livello 12.'); return; } CTAB='Edifici'; CBAR=true; G.cedit=true; go('hub'); ACT.cplace({dataset:{k:'pad'}}); },
  buypad(){ closeOv(); CTAB='Edifici'; CBAR=true; G.cedit=true; go('hub'); ACT.cplace({dataset:{k:'pad'}}); },
  buypadOld(){ const c=600; if(L.level(G.xp)<12){ toast('La rampa si sblocca al livello 12.'); return; } if(G.money<c){ toast('Non hai abbastanza crediti.'); sfx.bad(); return; } addMoney(-c); G.pad=true; closeOv(); sfx.stamp(); toast('Rampa di lancio costruita: da ora puoi lanciare in casa, con il 40% in meno.'); render(); },
  launch(){ const M=cur(); if(!M||M.phase!=='D'||!M.ready) return; M.duration=+$('#dur').value; const el=$('#cnt'), rk=$('#rk'); el.hidden=false; let n=5; el.textContent='T-'+n; sfx.tap(); $$('[data-act="launch"]').forEach(b=>b.disabled=true);
    const iv=setInterval(()=>{ n--; if(n===1) rk.classList.add('ign'); if(n>0){ el.textContent='T-'+n; sfx.tap(); } else { clearInterval(iv); el.textContent='Decollo!'; sfx.stamp(); tone(60,1.6,'sawtooth',.06); rk.classList.add('go');
      $('#smk').innerHTML=[-60,-20,20,60,-100,100].map((x,i)=>'<circle class="puff" cx="'+(500+x)+'" cy="'+(478-Math.abs(x)*.1)+'" r="'+(26+i*3)+'" fill="#fff" style="animation-delay:'+(i*.08)+'s"/>').join('');
      startFlight(M); setTimeout(()=>{ el.hidden=true; toast(M.name+' in volo: segui la telemetria dal Mission Control Center.'); if(view==='pad') render(); },2600); } },700); },
  decide(t){ const M=cur(), p=L.decide(M,t.dataset.k,now()); if(!p) return; delete TELE[M.id]; const c=$('#code'); if(c) c.dataset.m=''; M.alert=false; sfx.put(); mccRefresh(true); hud(); save(); },
  autodec(){ const M=cur(), fl=L.flight(M,999); if(!fl.pending) return; ACT.decide({dataset:{k:fl.pending.auto}}); M.choiceL[fl.pending.m].auto=true; },
  mcr(t){ const M=G.missions[+t.dataset.i]; $('#drawer').hidden=true; mcrReview(M); },
  whatif(t){ const M=MCRM, o=WIO[+t.dataset.i]; if(!M||!o) return; const w=L.whatIf(M,Object.assign({visit:hasB('visit')},o)), r=M.result, x=w.out, d=x.net-r.net, el=$('#wires');
    el.innerHTML='<b>'+esc(o.l)+'</b><br>'+(x.ok?'Missione riuscita':!x.alive?'Satellite perso: '+esc(x.cause||''):'Missione chiusa male')+' · '+x.months+' mesi · scienza '+x.sci+' · bilancio <span class="num">'+keur(x.net)+'</span> <b class="'+(d>=0?'okc':'bad')+'">('+(d>=0?'+':'')+keur(d)+' rispetto a com’è andata)</b><div class="fine">Un solo cambiamento, poi il caso e l’autopilota fanno il resto: rigioca più volte la stessa idea e i numeri cambiano.</div>'; el.hidden=false; sfx.tap(); },
  unpub(t){ const id=t.dataset.id; if(!db||!shared||!id){ toast('La bacheca online è disponibile nella pagina pubblicata.'); return; }
    db.collection('missions3').doc(id).delete().then(()=>{ G.missions.forEach(m=>{ if(m.boardId===id){ m.published=false; m.boardId=null; } }); G.myBoard=(G.myBoard||[]).filter(x=>x!==id); save(); sfx.tap(); toast('Missione rimossa dalla bacheca.'); folder(folder.tab); }).catch(()=>toast('Non è stato possibile rimuoverla.')); },
  publish(t){ const M=G.missions[+t.dataset.i], r=M.result; if(M.tut){ toast('La missione tutorial non si pubblica.'); return; } const entry={uid:MYID||'',ty:M.type||'sci',co:G.co,name:M.name,sci:r.sci,months:r.months,reqs:M.reqs.length,stake:M.stake.filter(id=>EMB[id]),ts:Date.now(),st:(M.statement||'').slice(0,280),dest:M.sat.dest||'moon'};
    const done=ref=>{ M.published=true; if(ref&&ref.id){ M.boardId=ref.id; G.myBoard=(G.myBoard||[]).concat([ref.id]); } save(); sfx.ok(); toast('Pubblicata in bacheca.'); folder('board'); };
    if(db&&shared) db.collection('missions3').add(entry).then(done).catch(()=>toast('Non è stato possibile pubblicare: la bacheca accetta solo chi ha accesso in scrittura.')); else toast('La bacheca online è disponibile nella pagina pubblicata.'); },
  start(){ G.co=($('#co').value.trim()||'Perigeo Labs').slice(0,28); closeOv(); sfx.ok(); startTutorial(); },
  startskip(){ G.co=($('#co').value.trim()||'Perigeo Labs').slice(0,28); G.tutDone=true; G.diff=WDIFF; G.money=Math.round(L.START_MONEY*dif().money); closeOv(); sfx.ok(); render(); toast('Crea la tua prima missione con il tasto + in alto.'); },
  startsand(){ G.co=($('#co').value.trim()||'Perigeo Labs').slice(0,28); G.tutDone=true; G.sandbox=true; G.diff='facile'; G.xp=L.LEVELS[L.LEVELS.length-1]+1; G.money=99999; G.pad=true; ['factory','ground','rnd','office','visit'].forEach(k=>{ if(G.plots.indexOf(k)<0) G.plots.push(k); }); fixPlots(); save(); closeOv(); sfx.ok(); render(); toast('Modalità libera: tutto sbloccato, soldi senza limiti. Non conta per la classifica.'); },
  wdiff(t){ WDIFF=t.dataset.k; const co=$('#co')?$('#co').value:''; welcome(); if($('#co')) $('#co').value=co; },
  report(t){ const M=G.missions.find(m=>m.id===t.dataset.id)||cur(); if(!M) return; saveFile('resoconto-'+String(M.name).toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.html',reportHTML(M)); },
  cmp(){ $('#drawer').hidden=true; cmpModal(); },
  tutskip(){ endTutorial(true); },
  drw(t){ const v=$('#view'), side=t.dataset.k, key=v.dataset.key, on=!v.classList.contains('open'+side); DRW[key+side]=on; v.classList.toggle('open'+side,on); if(on&&innerWidth<900){ const o2=side==='L'?'R':'L'; if(v.classList.contains('open'+o2)){ DRW[key+o2]=false; v.classList.remove('open'+o2); $$('.rb[data-k="'+o2+'"]').forEach(b=>b.classList.remove('on')); } } $$('.rb[data-k="'+side+'"]').forEach(b=>b.classList.toggle('on',on)); sfx.tap(); setTimeout(()=>{ dispatchEvent(new Event('resize')); },30); },
  reqlist(){ const M=cur(); if(!M) return; review({eb:'Sala riunioni',name:'Requisiti accettati',code:'—',nasa:'Requirements',body:M.reqs.length?'<ul class="reqs">'+M.reqs.map(x=>'<li><span class="c">'+x.code+'</span><span>'+esc(L.R(x.id).t)+'</span><span></span></li>').join('')+'</ul>':'<p class="fine">Nessun requisito accettato finora.</p>',actions:'<button class="btn primary" data-act="closeov">Chiudi</button>'}); },
  station(t){ const m=G.missions.find(x=>x.phase==='D'&&x.stage==='assembly'&&!x.asmWait&&x.station===+t.dataset.i); if(!m){ toast('Postazione libera: qui arriva un satellite dopo la CDR.'); return; } const i=G.missions.indexOf(m); G.cur=i;
    if(now()>=m.buildEnd){ ACT.cdr(); return; } const p=Math.min(1,1-(m.buildEnd-now())/(m.buildDur||L.TIME.build)); toast(m.name+': integrazione '+pct(Math.max(0,p))+', mancano '+Math.ceil((m.buildEnd-now())/1000/G.speed)+' s.'); hud(); },
  durm(){ const o=durList(cur()), i=Math.max(0,o.indexOf(LDUR)-1); LDUR=o[i]; render(); }, durp(){ const o=durList(cur()), i=Math.min(o.length-1,o.indexOf(LDUR)+1); LDUR=o[i]; render(); },
  abort(){ if(LBUSY) return; sfx.tap(); go('hub'); },
  road(){ roadModal(); },
  pinfo(t){ const M=cur(), k=E.stk(t.dataset.id); if(!k||!M) return; review({eb:k.k,name:k.n,code:'—',nasa:'Stakeholder',body:'<p class="num" style="color:#1F8A4C;font-weight:700">+'+keur(L.fund(k.id,M))+'</p><ul class="cast" style="list-style:none;padding:0;display:grid;gap:6px"><li>'+ico('gift')+' '+(k.id==='nasa'?'Il catalogo NASA: '+E.DBX.filter(x=>x.code.indexOf('NASA')===0).length+' tecnologie, sbloccate con i livelli':k.spec?'Carte di '+esc(k.spec.toLowerCase())+' un livello prima':'Fondi per la missione')+'</li><li>Ci tiene a: '+L.interests(k.id).map(i=>L.INTN[i]||i).join(', ')+'</li><li>Al tavolo: '+esc(PEO[k.id].n)+', '+esc(PEO[k.id].role.toLowerCase())+'</li>'+(L.fits4(k.id,M)?'<li class="nope">Non pertinente: '+L.fits4(k.id,M)+'</li>':'')+'</ul>',actions:'<button class="btn primary" data-act="closeov">Chiudi</button>'}); },
  staff(){ staffModal(); }, risks(){ riskModal(); }, cdrm(t){ const i=G.missions.findIndex(m=>m.id===t.dataset.id); if(i<0) return; G.cur=i; ACT.cdr(); }, arch(){ $('#pop').hidden=true; folder('mine'); $('#drawer').hidden=false; }, rank(){ closeOv(); rankModal(); },
  hire(){ if(G.staff>=spaces()){ toast('Tutti i posti auto sono occupati: costruisci un parcheggio.'); return; } if(G.money<HIRE){ toast('Non hai abbastanza crediti.'); return; } addMoney(-HIRE); G.staff++; sfx.ok(); save(); staffModal(); hud(); if(view==='hub') render(); },
  fire(){ if(G.staff<=staffNeed()) return; G.staff--; sfx.tap(); save(); staffModal(); if(view==='hub') render(); },
  rplant(t){ if(G.money<PLANTC){ toast('Non hai abbastanza crediti.'); return; } RPLACE={room:t.dataset.r,k:'plant'}; RSEL=null; sfx.tap(); render(); },
  resc(){ RPLACE=null; render(); }, rselx(){ RSEL=null; render(); },
  plantsel(t){ RSEL={room:t.dataset.r,i:+t.dataset.i}; sfx.tap(); render(); },
  rplantdel(){ if(!RSEL) return; const R=G.rooms[RSEL.room]; R.plants.splice(RSEL.i,1); RSEL=null; sfx.tap(); toast('Pianta rimossa: squadra al '+morale()+'%.'); save(); render(); },
  labadd(){ if(G.lab.length>=LABMAX){ toast('Il laboratorio ha posto per '+LABMAX+' macchinari.'); return; } bayModal(G.lab.length); },
  mmove(){ if(MSEL==null) return; const k=G.lab[MSEL], M=cur(), r=M&&M.tr&&M.tr[k]; if(r&&r.res==='run'){ toast('Prova in corso: lo sposti quando ha finito.'); return; } G.lab.forEach((_,j)=>{ if(!G.labPos[j]) G.labPos[j]={x:1+j*2,y:9}; }); RPLACE={room:'test',k,moveI:MSEL}; MSEL=null; sfx.tap(); render(); }, mselx(){ MSEL=null; render(); },
  mach(t){ MSEL=G.lab.indexOf(t.dataset.k); if(MSEL<0) MSEL=null; const M=cur(), k=t.dataset.k, inLab=M&&M.phase==='D'&&M.stage!=='assembly'?M:null; if(inLab&&!inLab.tr[k]&&!Object.keys(inLab.tr).some(x=>inLab.tr[x].res==='run')){ toast('Trascina il satellite sul macchinario per avviare la prova.'); return; } toast(L.MACH[k].n+(inLab&&inLab.tr[k]?': prova già fatta per '+inLab.name+'.':inLab?'':': scegli un satellite dal magazzino a sinistra.')); },
  openyard(t){ const id=t.dataset.id; const i=G.missions.findIndex(m=>m.id===id); if(i>=0) G.cur=i; BVIEW='yard'; sfx.tap(); render(); },
  benchfree(){ toast('Banco libero: crea una nuova missione con il tasto + e portala in fase C.'); },
  broom(t){ BROOM=t.dataset.k; BVIEW='room'; sfx.tap(); render(); }, toroom(){ BVIEW='room'; sfx.tap(); render(); },
  mccwall(){ MCCV='wall'; sfx.tap(); render(); }, mccroom(){ MCCV='room'; sfx.tap(); render(); }, backph(){ backModal(); }, backgo(){ backGo(); }, tutend(){ endTutorial(false); },
};
const dishN=()=>hasB('ground')?Math.min(6,G.world.items.filter(i=>i.k==='dish').length):0;
function startFlight(M){ M.phase='E'; M.launchAt=now(); M.dataK=dataBud(M).k; M.boost=(hasB('ground')?1.2:1)+.03*dishN(); M.sig=.05*dishN(); gainXP(L.XP.launch); save(); }
const durList=M=>[6,9,12,18,24].filter(m=>m>=L.minMonths(M));
function durOptions(M){ return [6,9,12,18,24].filter(m=>m>=L.minMonths(M)).map(m=>'<option value="'+m+'">'+m+' mesi</option>').join(''); }
// lancio affidato a un ente terzo: niente rampa, si parte da un sito esterno
function xLaunchModal(M){ if(!M||M.phase!=='D'||!M.ready) return; const i=G.missions.indexOf(M); if(i>=0) G.cur=i; LDUR=null; LBUSY=false; closeOv(); go('launch'); }
function xLaunchModalOld(M){ const o=E.LV[M.sat.lv]||E.LV.RS;
  review({eb:'Fase D · lancio',name:'Lancio con un ente terzo',code:'—',nasa:'Launch',body:'<p>'+esc(M.name)+' parte con <b>'+esc(o.n.toLowerCase())+'</b>, da un sito di lancio esterno. Il servizio è già pagato.</p><div class="xl"><svg viewBox="0 0 120 150" aria-hidden="true"><rect x="0" y="134" width="120" height="16" fill="#DDE3EA"/><g id="xrk">'+rocketSVG(60,134,.9)+'</g></svg><div class="xcnt" id="xcnt" hidden></div></div>'+
    '<div class="row"><label for="xdur" style="margin:0">Durata dichiarata</label><select id="xdur" style="width:auto">'+durOptions(M)+'</select></div><p class="fine">Ogni mese promesso e non volato costa '+L.MISSED+' cr di penale; ogni mese di operazioni '+L.OPS+' cr.'+fuelMonths(M)+'</p>',
    actions:'<button class="btn primary" data-act="xlaunch">Lancia</button><button class="btn" data-act="closeov">Più tardi</button>'}); }
function padModal(){ const lv=L.level(G.xp); review({eb:'Campus',name:'Rampa di lancio',code:'—',nasa:'Launch pad',body:'<p>Con una rampa tua lanci i CubeSat in orbita bassa senza passare da un ente terzo: il 40% in meno a ogni lancio.</p><p class="num">Costo: 600 cr · livello minimo 12 (sei al livello '+lv+')</p>',actions:(lv>=12?'<button class="btn primary" data-act="buypad">Costruisci · 600 cr</button>':'')+'<button class="btn" data-act="closeov">Chiudi</button>'}); }
// PDR: il lancio è scelto e l'orbita è raggiungibile. Si incassa la seconda rata e si prenota il lancio.
O.hook.grave=M=>drmGrave(M);
O.hook.refProp=M=>{ const ride=M.sat.ride, ids=L.availCat(M,'prop',ride);
  if(!ids.length){ const any=Object.assign({},M,{lvlNow:99}), all=Object.keys(P).filter(id=>P[id].cat==='prop'&&L.techOK(any,id,ride)); return {none:true,lvl:all.length?Math.min.apply(null,all.map(id=>L.effLvl(M,P[id]))):5}; }
  const wet=(E.RIDES[ride]||{massLim:6}).massLim*0.6, best=ids.map(id=>P[id]).sort((a,b)=>b.isp*Math.log(wet/(wet-b.propM))-a.isp*Math.log(wet/(wet-a.propM)))[0]; return {isp:best.isp,propM:best.propM,n:best.n}; };
function pdrB(){ const M=cur(), p=O.plan(M), bad=[]; if(!M.drm||!(drmLand(M)||(M.drm.eol&&drmStarH(M)!=null))) bad.push('Completa la Design Reference Mission (passo 1): orbita di lavoro ★ e fine vita.'); else if(!M.drm.done) bad.push('Progetta il satellite (passo 2).'); else { const ck=E.checks(M.sat).list.filter(x=>!x.ok&&['parts','place','mass','pow','bat','point'].indexOf(x.k)>=0); ck.forEach(x=>bad.push('Satellite: '+esc(x.t)+'.')); const dd=drmDv(M,p); if(!ck.length&&!p.bad&&p.tot*1.05+dd.extra>p.dvAvail+1) bad.push('La DRM chiede '+Math.round(p.tot*1.05+dd.extra)+' m/s, il satellite ne ha '+Math.round(p.dvAvail)+'.'); }
  if(M.sat.lv){ const wet=E.budget(M.sat).wet, cap=lvCap(M); if(wet>cap+1e-9) bad.push('Il satellite pesa '+nf(wet,1)+' kg, ma '+esc(E.LV[M.sat.lv].n)+' ne porta al massimo '+cap+' in quest’orbita.'); }
  if(!M.sat.lv) bad.push('Scegli come vai nello spazio.'); else { if(p.bad) bad.push(esc(p.bad)+'.'); else if(!p.ok) bad.push(p.stratOk?'L’orbita finale non è dentro la fascia obiettivo.':'Scegli una strategia per ogni tratto del viaggio.'); else if(p.ref&&p.tot>1&&p.tot*1.05>p.dvAvail) bad.push('Il piano chiede '+Math.round(p.tot*1.05)+' m/s (con il margine), ma il miglior propulsore del tuo livello ne dà circa '+Math.round(p.dvAvail)+': scegli un’orbita più vicina a quella di rilascio.'); }
  const inst=L.installment(M,'PDR'), lc=M.sat.lv?E.lvCost(M.sat):0;
  if(bad.length){ review({eb:'Fine fase B',name:'Preliminary Design Review',code:'PDR',nasa:'Preliminary Design Review',stamp:'NO-GO',no:true,body:'<ul class="reqs">'+bad.map(x=>'<li><span class="c">ORB</span><span>'+x+'</span><span></span></li>').join('')+'</ul>',actions:'<button class="btn primary" data-act="closeov">Torna alla fase B</button>'}); return; }
  review({eb:'Fine fase B',name:'Preliminary Design Review',code:'PDR',nasa:'Preliminary Design Review',stamp:'GO',short:(LANG==='en'?'Orbit and launch approved. Second instalment: ':'Orbita e lancio approvati. Seconda rata: ')+'<b class="num">'+keur(inst)+'</b>.',body:'<p>Lancio: <b>'+esc(E.LV[M.sat.lv].n)+'</b>'+(lc?' · prenotazione '+keur(lc):'')+'. Orbita di lavoro: '+(p.land?'sul suolo':O.fmt(p.final))+'; ΔV del piano '+Math.round(p.tot)+' m/s'+(p.tot>1?': con il propulsore che hai scelto':'')+'. Fase C: il progetto si congela e alla CDR compri i pezzi.</p>'+(()=>{ const q=dataBud(M); return q.ok?'':'<p class="bad">Attenzione: la radio scarica solo il '+pct(q.k)+' dei dati prodotti. La scienza in volo calerà nella stessa misura.</p>'; })()+(p.atm&&p.atm.p>0.005&&p.atm.worst?'<p class="bad">Attenzione: '+pct(p.atm.p)+' di probabilità che l’attrito dell’atmosfera faccia rientrare il satellite prima del tempo (pericentro a '+nf(p.atm.worst.pe,0)+' km).</p>':'')+'<p>Gli stakeholder versano la seconda rata, <b class="num">'+keur(inst)+'</b>.</p>'+(G.money+inst<lc?'<p class="bad">Anche con la rata non basta per prenotare il lancio.</p>':'')+payPlan(M,'PDR'),actions:'<button class="btn primary" data-act="toC">Prenota il lancio e vai avanti</button><button class="btn" data-act="closeov">Non ancora</button>'}); }
function toC(){ const M=cur(), first=!(M.once&&M.once.PDR), inst=first?L.installment(M,'PDR'):0, lc=E.lvCost(M.sat); if(G.money+inst<lc){ toast('Non hai abbastanza crediti, nemmeno con la rata.'); return; } closeOv(); once(M,'PDR'); M.got=(M.got||0)+inst; M.lvPaid=lc; M.lvFixed=true; addMoney(inst-lc); if(first) gainXP(L.XP.PDR); M.phase='C'; M.stage='design'; render(); toast((inst?'Rata PDR '+keur(inst):'Nessuna nuova rata')+(lc?' · lancio prenotato −'+keur(lc):'')+'. Fase C: costruisci il satellite nell’edificio di costruzione.'); }
function gone(M,lv){ const P2=PEO[lv.who]; sfx.leave(); if(!lv.staff) M.funded=L.pledged(M);
  toast(lv.staff?P2.n+' se ne va: d’ora in poi nessuno ti segnala i rischi del suo sottosistema.':P2.org+' lascia la missione: niente più rate da lui. Le sue tecnologie non sono più disponibili.'); }
// rate: chi è contento paga tutto, chi è scontento paga meno
function payPlan(M,gate){ const G2=['MDR','PDR','FRR','MCR'], i=G2.indexOf(gate);
  return '<div class="tw"><table class="pay"><tr><th>Stakeholder</th><th>Soddisfazione</th>'+G2.map((g,k)=>'<th'+(k===i?' class="now"':'')+'>'+g+' '+Math.round(L.PAY[g]*100)+'%</th>').join('')+'</tr>'+
    M.stake.map(id=>{ const j=M.joy[id]==null?60:M.joy[id], k=L.joyK(j); return '<tr><td>'+esc(E.stk(id).n)+'</td><td class="'+(k<1?'bad':'')+'">'+j+'%'+(k<1?' · paga il '+Math.round(k*100)+'%':'')+'</td>'+G2.map((g,n)=>'<td class="num'+(n===i?' now':'')+'">'+keur(L.fund(id,M)*L.PAY[g]*k)+'</td>').join('')+'</tr>'; }).join('')+
    '</table></div><p class="fine">Le rate future dipendono dalla soddisfazione di quel momento. Sotto il 50% di soddisfazione si paga l’80%, sotto il 25% solo la metà. L’ultima rata arriva solo se la missione riesce.</p>'; }
document.addEventListener('click',e=>{ if(document.body.classList.contains('hmo')&&!(e.target.closest&&e.target.closest('.hud-r'))){ document.body.classList.remove('hmo'); hud(); } },true);
document.addEventListener('click',e=>{ if(e.target.closest('#lvup')){ $('#lvup').hidden=true; return; } const h=e.target.closest('[data-heat]'); if(h&&view==='build'){ sel=h.dataset.heat; ACT.heat(); return; }
  const t=e.target.closest('[data-act]'); if(!t){ if(e.target===$('#drawer')) $('#drawer').hidden=true; if(!e.target.closest('#pop')&&!e.target.closest('.mcard')) $('#pop').hidden=true; return; } if(t.disabled) return; ACT[t.dataset.act](t,e); });
document.addEventListener('input',e=>{ if(e.target.id!=='frac') return; const M=cur(); if(!M||fdLocked(M)) return; M.traj=M.traj||{}; M.traj.frac=+e.target.value/100; const p=O.plan(M);
  const set=(id,t)=>{ const el=$('#'+id); if(el) el.textContent=t; }; set('wkO',O.fmt(p.final)); set('wkQ',pct(p.work.q)); set('wkS',nf(E.skOf(M.sat),1)+' m/s al mese'); set('wkD',Math.round(p.tot)+' m/s'); if($('#fdsum')) $('#fdsum').innerHTML=fdSum(M,p); });
document.addEventListener('change',e=>{ if(e.target.id==='frac') fdRefresh(true); });
let TAP0=0; document.addEventListener('pointerdown',e=>{ if(!(e.target.closest&&e.target.closest('#sat3w'))) return; const t=Date.now(); if(t-TAP0<320){ rotateSel(); TAP0=0; } else TAP0=t; },true);
document.addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') return; if(view==='build'&&(e.key==='r'||e.key==='R')) rotateSel(); if(e.key==='Escape'){ $('#drawer').hidden=true; $('#pop').hidden=true; } });

/* ---------- agenzie partner della Space Apps Challenge (solo stakeholder, tecnologie in arrivo) ---------- */
[2400,3000,3600,4200,4800,5400,6000,6600,7200,7800,8400,9000,9600].forEach(x=>{ if(L.LEVELS.indexOf(x)<0) L.LEVELS.push(x); });
const AGENCIES=[
 ['asi','ASI','Agenzia Spaziale Italiana','Italia',2,'Dott.ssa Ferrero','#0F7B6C',['scienza','prove'],300],
 ['esa','ESA','European Space Agency','Europa',3,'Dr. Lindqvist','#1F4E9C',['affidabilita','sostenibilita'],320],
 ['csa','CSA','Canadian Space Agency','Canada',5,'Dr. Tremblay','#C0392B',['scienza','durata'],280],
 ['jaxa','JAXA','Japan Aerospace Exploration Agency','Giappone',4,'Dr. Tanaka','#2B5FA8',['prove','leggerezza'],300],
 ['isro','ISRO','Indian Space Research Organisation','India',6,'Dr. Iyer','#E07B22',['costo','leggerezza'],260],
 ['kasa','KASA','Korea AeroSpace Administration','Corea del Sud',8,'Dr. Park','#1E6FB8',['comunicazioni','prestazioni'],280],
 ['aeb','AEB','Agência Espacial Brasileira','Brasile',10,'Dott.ssa Souza','#2E8B3E',['scienza','visibilita'],240],
 ['conae','CONAE','Comisión Nacional de Actividades Espaciales','Argentina',11,'Ing. Fernández','#4A90C8',['scienza','comunicazioni'],240],
 ['uksa','UKSA','UK Space Agency','Regno Unito',7,'Dr. Hughes','#283C7A',['sostenibilita','costo'],270],
 ['aee','AEE','Agencia Espacial Española','Spagna',9,'Dott.ssa Martín','#B8322E',['visibilita','prove'],250],
 ['tua','TUA','Türkiye Uzay Ajansı','Turchia',12,'Dr. Yıldız','#C62828',['prestazioni','durata'],250],
 ['mbrsc','MBRSC','Mohammed Bin Rashid Space Centre','Emirati Arabi Uniti',13,'Ing. Al Mansouri','#9C7A3C',['scienza','energia'],300],
 ['bsa','BSA','Bahrain Space Agency','Bahrein',15,'Dott.ssa Al Sayed','#B03045',['visibilita','comunicazioni'],220],
 ['nasrda','NASRDA','National Space Research and Development Agency','Nigeria',14,'Dr. Okonkwo','#1D7A46',['comunicazioni','durata'],220],
 ['ggpen','GGPEN','National Space Programme Management Office','Angola',16,'Ing. Dos Santos','#B22234',['visibilita','scienza'],210],
 ['aep','AEP','Agencia Espacial del Paraguay','Paraguay',17,'Ing. Benítez','#2C5BA8',['visibilita','costo'],200],
 ['ases','ASES','Agence Sénégalaise d’Études Spatiales','Senegal',18,'Dr. Diop','#2F8F4E',['visibilita','durata'],200]];
function syncAgencies(){ if(!G) return; const lv=L.level(G.xp); AGENCIES.forEach(a=>{ if(lv<a[4]||E.stk(a[0])) return; E.STAKE.push({id:a[0],n:a[1]+' · '+a[3],k:'Agenzia spaziale',fund:a[8],rep:2,gives:[],spec:'',want:'Una missione riuscita in collaborazione',quest:'Missione riuscita',bonus:Math.round(a[8]/4),ag:1}); L.PEOPLE[a[0]]={n:a[5],org:a[1],role:'Responsabile programmi · '+a[2],col:a[6],stake:a[0]}; L.INT[a[0]]=a[7].slice(); }); }
function roadModal(){ const lv=L.level(G.xp), N=L.LEVELS.length, mA=l=>l<=2?2:l<=4?3:4, el=$('#ov');
  const rows=[]; for(let n=1;n<=N;n++){ const g=[];
    AGENCIES.filter(a=>a[4]===n).forEach(a=>g.push('🤝 '+a[1]+' al tavolo'));
    
    Object.keys(E.RIDES).filter(k=>E.RIDES[k].lvl===n&&n>1).forEach(k=>g.push('📦 '+E.RIDES[k].n));
    Object.keys(E.LV).filter(k=>E.LV[k].lvl===n&&n>1).forEach(k=>g.push('🚀 '+E.LV[k].n));
    Object.keys(L.BUILD).filter(k=>L.BUILD[k].lvl===n).forEach(k=>g.push('🏢 '+L.BUILD[k].n));
    if(n===12) g.push('🛫 Rampa di lancio');
    Object.keys(L.MACH).filter(k=>L.MACH[k].lvl===n&&n>1).forEach(k=>g.push('🔧 '+L.MACH[k].n));
    const t=E.DBX.filter(x=>x.lvl===n).length; if(t&&n>1) g.push('🧩 '+t+' nuove tecnologie');
    if(n>1&&mA(n)>mA(n-1)) g.push('📋 '+mA(n)+' missioni insieme');
    if(n>=3) g.push('✍️ +1 sponsor reclutabile');
    if(n>1) g.push('🌳 Campus più grande ('+Math.round(siteK(n)*siteK(n)*100)+'% dell’area iniziale)');
    if(n===1) g.push('NASA, scienziata ed ente regolatore','CubeSat 3U','🌍 Terra · orbita bassa','🔧 Tavola vibrante');
    if(n>1){ const ZN={leo:'Terra',moon:'Luna',mars:'Marte',venus:'Venere'}; Object.keys(O.ZONES||{}).forEach(d=>(O.ZONES[d]||[]).filter(z=>z.lvl===n).forEach(z=>g.push('🪐 '+ZN[d]+' · '+z.n.toLowerCase()))); }
    rows.push('<div class="rlv'+(n<lv?' done':n===lv?' cur':'')+'"><div class="n">'+n+'<small>'+(n<lv?'✓':n===lv?'sei qui':L.LEVELS[n-1]+' XP')+'</small></div><ul>'+g.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></div>'); }
  el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true"><h3>Roadmap</h3><h2>Livello '+lv+(L.LEVELS[lv]?' · mancano '+(L.LEVELS[lv]-G.xp)+' XP al '+(lv+1):'')+'</h2><p class="fine">I punti esperienza arrivano dalle revisioni superate, dai lanci e dalle missioni chiuse. Ogni livello sblocca qualcosa di nuovo.</p><div class="road" id="road">'+rows.join('')+'</div><div class="row" style="margin-top:12px"><button class="btn primary" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false;
  const c=el.querySelector('.rlv.cur'); if(c) c.scrollIntoView({block:'center'}); }
/* ---------- interni, staff, parcheggi, felicità, leghe ---------- */
const SREQ={admin:2,fd:2,build:3,test:2,mcc:3,factory:3,ground:2,rnd:3,office:2,visit:2,pad:4}, SPACES=14, SAL=.5, HIRE=10, PLANTC=8, LABMAX=9;
const staffNeed=()=>G.world.items.reduce((a,it)=>a+(SREQ[it.k]||0),0);
const spaces=()=>G.world.items.filter(i=>i.k==='parking').length*SPACES;
const plantsN=()=>Object.keys(G.rooms||{}).reduce((a,k)=>a+((G.rooms[k].plants||[]).length),0);
const morale=()=>Math.min(100,30+Math.round(70*plantsN()/Math.max(1,G.staff)));
const workK=()=>+(1.25-.45*morale()/100).toFixed(2);
const LEAGUES=[[0,'Terra','#3F8E8A'],[60,'Luna','#8E949A'],[180,'Marte','#C2553B'],[400,'Giove','#C9965A'],[800,'Saturno','#D9B35E'],[1500,'Nettuno','#3F6FB0'],[2600,'Fascia di Kuiper','#7A6AAE'],[4000,'Interstellare','#22313B']];
const leagueOf=x=>LEAGUES.reduce((a,l,i)=>x>=l[0]?i:a,0);
function badge(i){ const l=LEAGUES[i]||LEAGUES[0], c=l[2]; return '<svg viewBox="-20 -20 40 40" aria-hidden="true"><path d="M0-18l15 6v10q0 12-15 20q-15-8-15-20v-10z" fill="'+c+'"/><path d="M0-14l11 4.5v7.5q0 9-11 15q-11-6-11-15v-7.5z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.5"/><circle r="6.5" fill="#fff" opacity=".92"/><circle r="6.5" fill="'+c+'" opacity=".35"/>'+(i>=4?'<ellipse rx="11" ry="3.2" fill="none" stroke="#fff" stroke-width="1.6" transform="rotate(-18)"/>':'')+'<text y="15" text-anchor="middle" font-family="var(--f-b)" font-weight="800" font-size="7" fill="#fff">'+(i+1)+'</text></svg>'; }
let RPLACE=null, RSEL=null, MCCV=null, BROOM=null, BVIEW='room', RANK=[];
const SNAPC={};
function satImg(M,n){ if(!S3.ok||!M) return null; const cats=Object.keys(M.sat.placed); n=n==null?cats.length:Math.max(1,Math.min(cats.length,n)); const key=M.id+'|'+n+'|'+cats.map(c=>M.sat.placed[c].id).join(',')+'|'+(M.sat.sol||''); if(key in SNAPC) return SNAPC[key];
  try{ SNAPC[key]=S3.snap(M.sat,220,{only:cats.slice(0,n),png:true}); }catch(e){ SNAPC[key]=null; } return SNAPC[key]; }
function dsatHTML(kind,M,hint){ const img=satImg(M); return '<div class="dsat" data-drag="'+kind+'" data-id="'+M.id+'" title="Trascina il satellite">'+(img?'<img src="'+img+'" alt="">':'<div class="ph">🛰</div>')+'<b>'+esc(M.name)+'</b><small>'+hint+'</small></div>'; }
function dTargets(kind,id){ const M=G.missions.find(m=>m.id===id); if(!M) return [];
  if(kind==='clean'){ const st=cleanStations(); return $$('#roomsvg [data-act="station"]').filter(g=>!st[+g.dataset.i]); }
  const run=Object.keys(M.tr).some(x=>M.tr[x].res==='run'); return run?[]:$$('#roomsvg [data-act="mach"]').filter(g=>!M.tr[g.dataset.k]); }
let DSAT=null;
document.addEventListener('pointerdown',e=>{ const d=e.target.closest&&e.target.closest('.dsat'); if(!d||e.button>0) return; e.preventDefault(); const r=d.getBoundingClientRect(); DSAT={el:d,kind:d.dataset.drag,id:d.dataset.id}; document.body.appendChild(d); d.classList.add('drag'); d.style.left=e.clientX+'px'; d.style.top=e.clientY+'px'; d.style.bottom='auto';
  dTargets(DSAT.kind,DSAT.id).forEach(t=>t.classList.add('dtgt')); sfx.tap(); });
document.addEventListener('pointermove',e=>{ if(!DSAT) return; DSAT.el.style.left=e.clientX+'px'; DSAT.el.style.top=e.clientY+'px'; });
function dEnd(e){ if(!DSAT) return; const D=DSAT; DSAT=null; D.el.remove(); const ts=dTargets(D.kind,D.id); let best=null, bd=1e9;
  ts.forEach(t=>{ const r=t.getBoundingClientRect(), cx=r.left+r.width/2, cy=r.top+r.height/2, inside=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom, dd=inside?-1:Math.hypot(e.clientX-cx,e.clientY-cy); if(dd<bd){ bd=dd; best=t; } });
  $$('.dtgt').forEach(t=>t.classList.remove('dtgt'));
  if(best&&bd<110) dropOn(D,best); else { if(!ts.length) toast(D.kind==='clean'?'Le due postazioni sono occupate: aspetta che un satellite finisca.':'Nessun macchinario libero per questo satellite.'); else toast(D.kind==='clean'?'Lascialo sopra una postazione libera.':'Lascialo sopra un macchinario.'); render(); } }
document.addEventListener('pointerup',dEnd); document.addEventListener('pointercancel',dEnd);
function dropOn(D,t){ const i=G.missions.findIndex(m=>m.id===D.id), M=G.missions[i]; if(!M) return; G.cur=i;
  if(D.kind==='clean'){ M.asmWait=false; M.station=+t.dataset.i; M.buildEnd=now()+(M.buildDur||L.TIME.build); sfx.put(); toast(M.name+' è sulla postazione: i tecnici iniziano l’assemblaggio.'); save(); render(); return; }
  ACT.runtest({dataset:{k:t.dataset.k}}); }
function labProg(M){ const run=Object.keys(M.tr).filter(k=>M.tr[k].res==='run'); if(!run.length) return ''; return '<div class="panel wprog">'+run.map(k=>{ const r=M.tr[k], p=Math.max(0,Math.min(1,1-(r.end-now())/(r.dur||1))), sec=Math.max(0,Math.ceil((r.end-now())/1000)); return '<div class="wp"><span>'+esc(L.MACH[k].n)+'</span><div class="mbar"><i style="width:'+Math.round(p*100)+'%"></i></div><span class="num">'+pct(p)+' · '+sec+' s</span></div>'; }).join('')+'</div>'; }
function labMachines(){ const M=cur(), inLab=M&&M.phase==='D'&&M.stage!=='assembly'?M:null;
  return G.lab.map((k,i)=>{ const p=G.labPos[i]||{x:1+i*2,y:9}, st=inLab&&inLab.tr[k], m=L.MACH[k]; let lab='', col=SF2.teal, state='';
    if(st){ if(st.res==='run'){ lab='in prova · '+pct(Math.max(0,Math.min(1,1-(st.end-now())/(st.dur||1)))); state='run'; } else if(st.res==='pass'){ lab='superata'; col='#3FA86B'; } else if(st.res==='fixed'){ lab='riparata'; col='#3FA86B'; } else if(st.res==='waived'){ lab='in deroga'; col='#E8AA30'; } else { lab='difetto'; col='#CF5E4C'; } }
    else if(inLab) lab='pronta';
    return {k,i,x:p.x,y:p.y,n:m.n,lab,col,state,img:st&&st.res==='run'?satImg(inLab):null}; }); }
const SF2={teal:'#45A9A3'};
function roomSt(room,extra){ G.rooms=G.rooms||{}; const R=G.rooms[room]||(G.rooms[room]={plants:[]}); return Object.assign({plants:R.plants,sel:RSEL&&RSEL.room===room?RSEL.i:null,machines:room==='test'?labMachines():[]},extra||{}); }
function roomBox(room,extra,ovl){ const pl=(G.rooms[room]||{plants:[]}).plants.length, pk=RPLACE&&RPLACE.room===room;
  const tools='<div class="ctools">'+(room==='clean'||room==='test'?'':'<button data-act="rplant" data-r="'+room+'" title="Le piante rendono più felici i dipendenti">🪴<span class="tl"> Pianta · '+keur(PLANTC)+'</span></button>')+'<button data-act="staff" title="Squadra">👥 '+morale()+'%<span class="tl"> squadra</span></button>'+(pk?'<button class="on" data-act="resc">Annulla</button>':'')+'</div>';
  const pop=room==='test'&&MSEL!=null&&!pk&&G.lab[MSEL]?'<div class="cpop mpop"><b>'+esc(L.MACH[G.lab[MSEL]].n)+'</b><div class="row"><button class="btn small" data-act="mmove">✥ Sposta</button><button class="btn small" data-act="mselx">Chiudi</button></div><span class="fine">Puoi cambiare la disposizione del laboratorio quando vuoi.</span></div>':RSEL&&RSEL.room===room&&!pk?'<div class="cpop"><b>Pianta da interno</b><div class="row"><button class="btn small" data-act="rplantdel">Rimuovi</button><button class="btn small" data-act="rselx">Chiudi</button></div><span class="fine">'+plantsN()+' piante in tutto · squadra felice al '+morale()+'%</span></div>':'';
  const hint=pk?'<div class="chint" id="rhint">'+(RPLACE.k==='plant'?'Tocca un punto libero per mettere la pianta.':(RPLACE.moveI!=null?'Tocca il nuovo posto per: ':'Tocca un punto libero per posizionare: ')+L.MACH[RPLACE.k].n.toLowerCase()+'.')+' Esc per annullare.</div>':'';
  return '<section class="room3 fsc" style="--ar:1000/620"><svg id="roomsvg" data-room="'+room+'" class="'+(pk?'placing':'')+'" viewBox="'+IR.view+'" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Interno dell’edificio">'+(()=>{ const st0=roomSt(room,extra); IR.setWalkers(wkScene(room,st0)); return IR[room](st0); })()+'<g id="rghost"></g></svg>'+tools+pop+hint+(ovl||'')+'</section>'; }
function rPt(e){ const svg=$('#roomsvg'); if(!svg) return null; const pt=svg.createSVGPoint(); pt.x=e.clientX; pt.y=e.clientY; const m=svg.getScreenCTM(); if(!m) return null; const p=pt.matrixTransform(m.inverse()); return IR.toGrid(p.x,p.y); }
function rGhost(e){ if(!RPLACE) return; const g=rPt(e); if(!g) return; const f=IR.FOOT[RPLACE.k]||[1,1], x=Math.round((g[0]-f[0]/2)*4)/4, y=Math.round((g[1]-f[1]/2)*4)/4, room=RPLACE.room, why=IR.valid(room,RPLACE.k,x,y,roomSt(room),RPLACE.moveI);
  RPLACE.x=x; RPLACE.y=y; RPLACE.ok=!why; RPLACE.why=why; const gh=$('#rghost'); if(gh) gh.innerHTML=IR.ghost(room,{k:RPLACE.k,x,y,ok:!why}); const h=$('#rhint'); if(h) h.textContent=(why?'Qui no: '+why+'.':'Qui va bene.')+' Esc per annullare.'; }
document.addEventListener('pointermove',e=>{ if(RPLACE&&e.target.closest&&e.target.closest('#roomsvg')) rGhost(e); });
document.addEventListener('click',e=>{ const svg=e.target.closest&&e.target.closest('#roomsvg'); if(!svg||!RPLACE) return; e.stopPropagation(); e.preventDefault(); rGhost(e); rPlace(); },true);
document.addEventListener('keydown',e=>{ if(e.key==='Escape'&&RPLACE){ RPLACE=null; render(); } });
function rPlace(){ const R=RPLACE; if(!R) return; if(!R.ok){ sfx.bad(); toast('Qui no: '+(R.why||'spazio occupato')+'.'); return; }
  if(R.k==='plant'){ if(G.money<PLANTC){ toast('Non hai abbastanza crediti.'); RPLACE=null; render(); return; } addMoney(-PLANTC); G.rooms[R.room].plants.push({x:R.x,y:R.y}); sfx.put(); toast('Pianta aggiunta: la squadra è felice al '+morale()+'%.'); if(G.money<PLANTC) RPLACE=null; save(); render(); return; }
  if(R.moveI!=null){ G.labPos[R.moveI]={x:R.x,y:R.y}; RPLACE=null; sfx.put(); toast(L.MACH[R.k].n+' spostato.'); save(); render(); return; }
  const m=L.MACH[R.k]; if(G.money<m.c){ toast('Non hai abbastanza crediti.'); RPLACE=null; render(); return; } addMoney(-m.c); G.lab.push(R.k); G.labPos.push({x:R.x,y:R.y}); RPLACE=null; sfx.stamp(); toast(m.n+' installato.'); save(); render(); }
function staffModal(){ const need=staffNeed(), free=G.staff-need, sp=spaces(), mo=morale(), el=$('#ov');
  el.innerHTML='<div class="rv" role="dialog" aria-modal="true"><h3>Personale</h3><h2>La tua squadra</h2>'+
    '<div class="stl"><div><span>👥</span><span>Dipendenti</span><span class="num"><b>'+G.staff+'</b></span></div><div><span>🏢</span><span>Servono per far funzionare gli edifici</span><span class="num">'+need+'</span></div><div><span>✓</span><span>Liberi per nuovi edifici</span><span class="num">'+free+'</span></div><div><span>🚗</span><span>Posti auto (14 per parcheggio)</span><span class="num">'+G.staff+' / '+sp+'</span></div><div><span>cr</span><span>Stipendi a ogni nuova fase di una missione ('+String(SAL).replace('.',',')+' cr a testa). Se le missioni sono ferme non paghi nulla.</span><span class="num">−'+keur(Math.round(G.staff*SAL))+'</span></div></div>'+
    '<div style="margin:12px 0 4px" class="row"><b>Felicità della squadra</b><span class="fine" style="margin-left:auto">'+mo+'%</span></div><div class="mbar"><i style="width:'+mo+'%"></i></div>'+
    '<p class="fine">'+plantsN()+' piante da interno. Più piante, più felicità: con la squadra al '+mo+'% assemblaggio e prove durano ×'+String(workK()).replace('.',',')+'. Serve circa una pianta per dipendente per arrivare al 100%. Le piante si mettono dentro gli edifici.</p>'+
    (G.staff>=sp?'<p class="bad">Tutti i posti auto sono occupati: per assumere costruisci un parcheggio nel campus (Costruisci → Infrastrutture).</p>':'')+
    '<div class="row"><button class="btn primary" data-act="hire"'+(G.staff>=sp?' disabled':'')+'>Assumi · '+keur(HIRE)+'</button><button class="btn" data-act="fire"'+(G.staff<=need?' disabled':'')+'>Licenzia</button><button class="btn" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false; }
function rankModal(){ const me=G.sciTotal|0, li=leagueOf(me), nx=LEAGUES[li+1], el=$('#ov');
  const road=LEAGUES.map((l,i)=>'<div class="lrow'+(i===li?' on':i>li?' lock':'')+'">'+badge(i)+'<div><b>Lega '+l[1]+'</b><div class="fine">da '+l[0]+' punti scienza</div></div><span class="fine">'+(i<li?'✓':i===li?'sei qui':'🔒')+'</span></div>').reverse().join('');
  const rows=(shared?RANK:[]).map(r=>({id:r._id,co:String(r.co||'Agenzia').slice(0,28),sci:Math.max(0,+r.sci|0)})).sort((a,b)=>b.sci-a.sci);
  const mine=rows.findIndex(r=>r.id===MYID);
  const list=rows.length?rows.slice(0,50).map((r,i)=>'<div class="rk'+(r.id===MYID?' me':'')+'"><b class="num">'+(i+1)+'</b>'+badge(leagueOf(r.sci))+'<span>'+esc(r.co)+(r.id===MYID?' <span class="fine">(tu)</span>':'')+'</span><b class="num">'+r.sci+'</b></div>').join(''):'<p class="fine">'+(shared?'Nessuna agenzia in classifica: chiudi una missione e sarai la prima.':'La classifica mondiale si vede nella pagina pubblicata.')+'</p>';
  el.innerHTML='<div class="rv wide" role="dialog" aria-modal="true"><h3>Scopo del gioco</h3><h2>Più punti scienza possibile</h2><p class="fine">Ogni missione chiusa aggiunge i suoi punti scienza al totale della tua agenzia. Con i punti sali di lega, come le coppe di Clash Royale. Le missioni del tutorial non contano.</p>'+
    '<div class="row" style="gap:12px;align-items:center;margin:8px 0 12px">'+badge(li).replace('<svg ','<svg style="width:56px;height:56px" ')+'<div><b style="font-size:20px">'+me+' punti scienza</b><div class="fine">Lega '+LEAGUES[li][1]+(nx?' · mancano '+(nx[0]-me)+' punti per la Lega '+nx[1]:' · lega massima')+'</div>'+(nx?'<div class="mbar" style="width:240px;margin-top:6px"><i style="width:'+Math.round((me-LEAGUES[li][0])/(nx[0]-LEAGUES[li][0])*100)+'%"></i></div>':'')+'</div></div>'+
    '<div class="nm"><div><h3 style="margin:0 0 8px">Leghe</h3><div class="ladder">'+road+'</div></div><div><h3 style="margin:0 0 8px">Classifica mondiale'+(mine>=0?' · sei '+(mine+1)+'°':'')+'</h3><div class="ladder">'+list+'</div></div></div>'+
    '<div class="row" style="margin-top:12px"><button class="btn primary" data-act="closeov">Chiudi</button></div></div>'; el.hidden=false; rankModal.open=true; }
function pushRank(){ if(!db||!shared||!MYID||G.tut||G.sandbox||!(G.sciTotal>0)) return; db.collection('agencies').doc(MYID).set({co:String(G.co||'Agenzia').slice(0,28),sci:G.sciTotal|0,lg:leagueOf(G.sciTotal),ts:Date.now()}).catch(()=>{}); }
function leagueUp(i){ sfx.stamp(); review({eb:'Nuova lega',name:'Lega '+LEAGUES[i][1],code:'—',nasa:'Promotion',body:'<div class="row" style="gap:14px;align-items:center">'+badge(i).replace('<svg ','<svg style="width:72px;height:72px" ')+'<p>La tua agenzia ha raggiunto <b>'+LEAGUES[i][0]+' punti scienza</b> ed entra nella <b>Lega '+LEAGUES[i][1]+'</b>.</p></div>',actions:'<button class="btn primary" data-act="rank">Vedi la classifica</button><button class="btn" data-act="closeov">Continua</button>'}); }
/* ---------- tutorial: prima missione guidata, tutto fissato ---------- */
const TUT={ seed:7, capC:320, parts:['BASE-DOSE','BASE-OBC','BASE-BAT20','BASE-UHF','BASE-MAG'], sol:'BASE-SOL3D',
  layout:{ bat:{id:'BASE-BAT20',x:0,y:2,rot:1}, avi:{id:'BASE-OBC',x:1,y:5,rot:3}, ray:{id:'BASE-DOSE',x:1,y:0,rot:1}, com:{id:'BASE-UHF',x:1,y:1,rot:1}, adcs:{id:'BASE-MAG',x:0,y:5,rot:0} },
  say:{ 'BASE-DOSE':'Il payload è il motivo per cui si vola: un dosimetro che misura la radiazione. Toccalo per montarlo in cima, verso lo spazio.',
    'BASE-OBC':'Il computer di bordo comanda tutto il satellite. Toccalo.', 'BASE-BAT20':'La batteria tiene acceso il satellite quando passa nell’ombra della Terra (eclisse). Toccala.',
    'BASE-UHF':'La radio UHF manda i dati a terra. Toccala.', 'BASE-MAG':'Le bobine magnetiche orientano il satellite usando il campo magnetico terrestre. Toccale.' } };
const once=(M,k)=>{ M.once=M.once||{}; if(M.once[k]) return false; M.once[k]=1; return true; };
const costDue=M=>Math.max(0,E.budget(M.sat).cost-(M.lvPaid||0)-(M.partsCredit||0));
const PHN2={'0':'0 · definizione','A':'A · fattibilità','B':'B · progetto preliminare','C':'C · progetto di dettaglio','D':'D · assemblaggio e prove'};
function backInfo(M){ if(!M||M.tut) return null; const ph=M.phase, nasa=M.stake[0];
  if(ph==='A') return {to:'0',fee:20,joy:10,items:['Si riapre il tavolo con gli stakeholder: i requisiti di missione e di sistema accettati vengono cancellati e si rinegoziano.','La prima rata è già incassata: non arriva una seconda volta.']};
  if(ph==='B') return {to:'A',fee:15,joy:5,items:['Puoi cambiare taglia del satellite. Lo staff tecnico torna al tavolo: i requisiti di sistema si rinegoziano.']};
  if(ph==='C'){ const lose=Math.round((M.lvPaid||0)/2); return {to:'B',fee:0,refund:(M.lvPaid||0)-lose,joy:5,items:['Il lancio prenotato si disdice: perdi metà della prenotazione ('+keur(lose)+'), l’altra metà ti torna.','Puoi rifare l’analisi orbitale e scegliere un altro lancio. Il progetto del satellite resta com’è.']}; }
  if(ph==='D'){ const val=M.partsVal||M.paid||0, keep=Math.round(val*.6), lose=val-keep; return {to:'C',fee:10,joy:8,lost:lose,items:['Il satellite si smonta: i pezzi comprati valgono ancora '+keur(keep)+' (60%) quando ripassi la CDR, '+keur(lose)+' sono persi tra smontaggio e pezzi da buttare.','Le prove fatte vanno rifatte. I macchinari del laboratorio restano.',(M.ready?'La revisione FRR va ripetuta: la rata è già incassata.':'')].filter(Boolean)}; }
  return null; }
function backModal(){ const M=cur(), b=backInfo(M); $('#pop').hidden=true; if(!b){ toast('Da questa fase non si torna indietro.'); return; }
  review({eb:'Ritorno di fase',name:'Torna alla fase '+PHN2[b.to],code:'—',nasa:'Delta review',body:'<p>Tornare indietro è possibile, ma costa: tempo, soldi e fiducia degli stakeholder. È quello che succede in un progetto vero quando una revisione scopre un problema.</p><ul class="reqs">'+b.items.map(t=>'<li><span class="c">↩</span><span>'+esc(t)+'</span><span></span></li>').join('')+
    (b.fee?'<li><span class="c">cr</span><span>Costo della revisione straordinaria</span><span class="num">'+keur(b.fee)+'</span></li>':'')+(b.refund?'<li><span class="c">cr</span><span>Rimborso della prenotazione</span><span class="num">+'+keur(b.refund)+'</span></li>':'')+'<li><span class="c">☺</span><span>Soddisfazione della NASA</span><span class="num">−'+b.joy+'</span></li></ul>'+(G.money<b.fee?'<p class="bad">Non hai abbastanza crediti.</p>':''),
    actions:'<button class="btn primary" data-act="backgo"'+(G.money<b.fee?' disabled':'')+'>Torna alla fase '+b.to+'</button><button class="btn" data-act="closeov">Annulla</button>'}); }
function backGo(){ const M=cur(), b=backInfo(M); if(!b||G.money<b.fee) return; closeOv(); const d=M.sat;
  if(b.refund) addMoney(b.refund); if(b.fee) addMoney(-b.fee);
  M.stake.forEach(id=>{ M.joy[id]=Math.max(1,(M.joy[id]||60)-b.joy); });
  if(b.to==='0'){ M.reqs=[]; M.waived=[]; M.softs=[]; M.gen={}; M.queue=[]; M.rideFixed=false; M.wit=null; M.phase='0'; M.stage='partners'; }
  if(b.to==='A'){ M.reqs=M.reqs.filter(x=>x.kind!=='SYS'); M.softs=(M.softs||[]).filter(id=>(L.R(id)||{}).ph!=='A'); if(M.gen) delete M.gen.A; M.queue=[]; M.rideFixed=false; M.phase='A'; M.stage='type'; }
  if(b.to==='B'){ M.lvPaid=0; M.lvFixed=false; M.phase='B'; M.stage='drm'; }
  if(b.to==='C'){ M.partsCredit=Math.round((M.partsVal||M.paid||0)*.6); M.tests={}; M.tr={}; M.defects=null; M.ready=false; M.buildEnd=0; M.phase='C'; M.stage='design'; }
  M.log=M.log||[]; M.backs=(M.backs||0)+1; sfx.leave(); go('hub'); toast('Sei tornato alla fase '+b.to+'.'); }
function startTutorial(){ const M=L.newMission('PRIMO VOLO','tut'+Date.now().toString(36)); Object.assign(M,{tut:true,first:true,seed:TUT.seed,capC:TUT.capC,type:'sci',zone:'low',stake:['nasa'],lvl:1,statement:'Il mio primo CubeSat: misurare la radiazione in orbita bassa.'});
  M.sat.dest='leo'; M.sat.stake=M.stake; G.missions.push(M); G.cur=G.missions.length-1; G.tut=true; coach.ended=false; coach.mcr=false; view='hub'; render(); }
function endTutorial(skipped){ const co=G.co; G=newG(); G.co=co; G.tutDone=true; closeOv(); view='hub'; render(); save(); coach();
  if(skipped) toast('Tutorial saltato. Crea la tua prima missione con il tasto + in alto.'); else setTimeout(newMission,200); }
function tutEndModal(){ const M=G.missions[0], r=M.result||{};
  $('#ov').innerHTML='<div class="rv" role="dialog" aria-modal="true"><h3>Tutorial completato</h3><h2>'+(r.ok?'Primo volo riuscito!':'Fine del primo volo')+'</h2><p>Hai fatto tutte le fasi di una missione vera: requisiti con gli stakeholder (fase 0), satellite e requisiti di sistema (A), orbita e lancio (B), costruzione (C), assemblaggio e prove (D), volo (E) e chiusura (F).</p>'+
    '<p>Era una prova: non dà punti, non va in bacheca e la tua agenzia riparte da '+keur(L.START_MONEY)+', come se l’avessi saltato. Da adesso le missioni sono vere: le richieste cambiano ogni volta e decidi tu.</p><div class="row"><button class="btn primary" data-act="tutend">Crea la tua prima missione</button></div></div>'; $('#ov').hidden=false; }
let coachEl=null;
function coachStep(){ const M=G.missions[0]; if(!G.tut||!M) return null; const d=M.sat, ph=M.phase, st=M.stage, ovOn=!$('#ov').hidden, S=(sel,t,n)=>({sel,t,n}), here=k=>view===k, go2=(k,t,n)=>view!=='hub'?S('[data-act="home"]',t.replace(/\.$/,'')+'. Prima torna al campus: tocca la casetta.',n):S('#camsvg .wobj[data-act="enter"][data-k="'+k+'"]',t.replace(/\.$/,'')+'. Tocca l’edificio sulla mappa.',n);
  if(ovOn){ const has=q=>$('#ov '+q);
    if(has('#xcnt:not([hidden])')) return S(null,'Conto alla rovescia… decollo!',8);
    if(has('[data-act="tutend"]')) return S('#ov [data-act="tutend"]','Bravo! Hai chiuso il tutorial.',10);
    if(has('[data-act="toA"]')) return S('#ov [data-act="toA"]','Mission Definition Review: i requisiti di missione sono approvati. Premi per chiudere la fase 0 e incassare la prima rata.',1);
    if(has('[data-act="toB"]')) return S('#ov [data-act="toB"]','System Requirements Review: i requisiti di sistema sono fissati. Passa alla fase B.',3);
    if(has('[data-act="toC"]')) return S('#ov [data-act="toC"]','Preliminary Design Review: orbita e lancio vanno bene. Prenota il lancio: arriva anche la seconda rata.',4);
    if(has('[data-act="toD"]')) return S('#ov [data-act="toD"]','Critical Design Review: il progetto rispetta tutti i requisiti. Compra i pezzi e passa all’assemblaggio.',6);
    if(has('[data-act="go"]')) return S('#ov [data-act="go"]','Flight Readiness Review: le prove sono superate. Dai il GO.',8);
    if(has('[data-act="xlaunch"]:not([disabled])')) return S('#ov [data-act="xlaunch"]','Il razzo di un ente terzo è pronto, il servizio è già pagato. Lancia!',8);
    for(const k of ['vib','func']) if(has('[data-act="install"][data-k="'+k+'"]:not([disabled])')&&G.lab.indexOf(k)<0) return S('#ov [data-act="install"][data-k="'+k+'"]',k==='vib'?'Installa la tavola vibrante: simula le vibrazioni del razzo.':'Installa il banco per la prova funzionale: accende tutto e controlla che risponda.',7);
    if(has('[data-act="decide"]')) return S('#ov [data-act="decide"]','Un imprevisto in orbita: scegli tu cosa fare.',9);
    if(ph==='done'&&!has('[data-act="tutend"]')) coach.mcr=true;
    return S('#ov [data-act="closeov"]',ph==='done'?'Ecco la revisione di fine missione (MCR): scienza raccolta, rate e cosa è successo. Chiudila.':'Leggi e chiudi la finestra.',ph==='done'?10:null); }
  if(ph==='0'){ if(st==='partners'){ if(!here('admin')) return go2('admin','Benvenuto! Questa prima missione è guidata. Entra nell’edificio amministrativo: la NASA ti aspetta.',0); return S('[data-act="sit"]','Al tavolo siedono la NASA (finanzia), la tua scienziata e l’ente regolatore. Siediti per ascoltare le loro richieste.',0); }
    if(!here('admin')) return go2('admin','Torna nella sala riunioni.',0);
    return M.queue.length?S('[data-act="yes"]','Ogni richiesta accettata diventa un requisito di missione (MIS). In questa prova accettale tutte: sono già state scelte per te.',0):S('[data-act="endmeet"]','Hai i requisiti di missione. Chiudi la riunione: segue la revisione MDR.',1); }
  if(ph==='A'){ if(!here('admin')) return go2('admin','Fase A: rientra nell’edificio amministrativo per scegliere il satellite.',2);
    if(st==='type') return S('[data-act="pickType"][data-k="S3"]','Scegli un CubeSat 3U: tre cubi da 10 cm, al massimo 6 kg.',2);
    return M.queue.length?S('[data-act="yes"]','Adesso parla lo staff tecnico: i suoi sono requisiti di sistema (SYS). Accetta.',2):S('[data-act="endmeet"]','Chiudi la riunione: segue la revisione SRR.',3); }
  if(ph==='B'){ const dr=M.drm||{};
    if(st==='sat'){ if(!here('build')) return go2('build','Passo 2: progetta il satellite nell’edificio di costruzione.',5);
      if(BVIEW!=='yard') return S('#roomsvg [data-act="openyard"]','Ogni satellite si progetta sul banco da design. Tocca il banco di '+M.name+'.',5);
      const nx=TUT.parts.find(id=>{ const c=P[id].cat; return !(d.placed[c]&&d.placed[c].id===id); });
      if(nx) return $('#ptiles .tile[data-id="'+nx+'"]')?S('#ptiles .tile[data-id="'+nx+'"]',TUT.say[nx],5):S('[data-act="stab"][data-k="all"]','Apri la scheda con tutti i pezzi.',5);
      if(d.sol!==TUT.sol) return $('#ptiles [data-act="sol"][data-k="'+TUT.sol+'"]')?S('#ptiles [data-act="sol"][data-k="'+TUT.sol+'"]','Servono pannelli solari: scegli le ali dispiegabili, danno più potenza di quelli sul corpo.',5):S('[data-act="stab"][data-k="sol"]','Apri la scheda dei pannelli solari.',5);
      return S('.assist [data-act="bstep"][data-k="orb"]','Il satellite è completo: massa, potenza ed eclisse sono in verde. Passa al passo 3, le orbite in dettaglio.',5); }
    if(!here('fd')) return go2('fd',st==='orb'?'Passo 3: torna al Centro di dinamica del volo':'Fase B: vai al Centro di dinamica del volo per disegnare la missione (DRM).',4);
    if(st==='orb') return S('#fdp [data-act="pdrB"]','Il razzo ti lascia a 550 km, già nella fascia obiettivo: nessuna manovra, e il rientro avviene da solo per l’attrito dell’aria. Chiedi la revisione PDR.',5);
    if(!dr.eol) return S('[data-act="drmeol"][data-k="reentry"]','Questa è la Design Reference Mission: il razzo ti lascia a 550 km, dove il satellite lavora (★). Scegli come finisce la missione: rientro in atmosfera.',4);
    return S('.drmp [data-act="bstep"][data-k="sat"]','Missione disegnata. Ora progetta il satellite che deve farla.',4); }
  if(ph==='C'){ if(!here('build')) return go2('build','Fase C: il progetto si congela. Entra nell’edificio di costruzione.',6);
    if(BVIEW!=='yard') return S('#roomsvg [data-act="openyard"]','Tocca il banco di '+M.name+'.',6);
    return S('[data-act="pdr"]','Fase C: progetto congelato. Con la revisione CDR compri i pezzi.',6); }
  if(ph==='D'&&st==='assembly'){ if(!here('build')) return go2('build','Fase D: entra nell’edificio di costruzione, in camera bianca.',6);
    if(M.asmWait) return $('.dsat')?S('.dsat','Trascina il tuo satellite su una postazione libera: lì i tecnici lo assemblano.',6):S('[data-act="broom"][data-k="clean"]','Apri la camera bianca.',6);
    return now()>=M.buildEnd?S('[data-act="station"][data-i="0"]','Assemblaggio finito. Tocca il satellite sulla postazione per portarlo al laboratorio prove.',7):S(null,'I tecnici stanno assemblando il satellite in camera bianca, pezzo dopo pezzo. Aspetta qualche secondo.',6); }
  if(ph==='D'&&M.ready){ if(here('launch')||here('pad')||(here('admin')&&$('#lsvg'))) return LBUSY?S(null,'Conto alla rovescia… decollo!',8):S('[data-act="xlaunch"]','Il razzo è pronto sulla rampa e il servizio è già pagato. Premi LAUNCH!',8); return go2(M.sat.lv==='HOME'?'pad':'admin','Revisione di volo superata: comincia la fase E. Vai all’edificio amministrativo per il lancio',8); }
  if(ph==='D'){ const need=['vib','func'].filter(k=>L.MACH[k].lvl<=1); if(!here('test')) return go2('test','Al laboratorio prove: i requisiti chiedono la prova di vibrazione.',7);
    if(RPLACE&&RPLACE.room==='test') return S('#roomsvg','Tocca un punto libero del laboratorio per posizionare il macchinario: lo metti dove vuoi, ma senza toccare gli altri.',7);
    for(const k of need) if(G.lab.indexOf(k)<0) return S('.rb[data-act="labadd"]','Ogni prova vuole il suo macchinario. Tocca «Macchinario» a destra per installarne uno.',7);
    for(const k of need){ const r=M.tr[k]; if(r&&r.res==='run') return S(null,(k==='vib'?'Prova di vibrazione':'Prova funzionale')+' in corso…',7); if(!M.tests[k]&&!r) return S('.dsat',k==='vib'?'Trascina il satellite sulla tavola vibrante per lanciare la prova di vibrazione.':'Trascina il satellite sul banco per la prova funzionale.',7); }
    return S('[data-act="frr"]','Prova superata. Al livello 1 hai solo la tavola vibrante: gli altri macchinari si sbloccano salendo di livello. Chiedi la revisione FRR: decide se il satellite può volare.',8); }
  if(ph==='E'){ if(!here('mcc')) return go2('mcc','Il satellite è in orbita! Seguilo dalla sala controllo.',9);
    if(MCCV!=='wall') return S('#roomsvg [data-act="mccwall"]','Il satellite è in orbita! Tocca gli schermi della sala controllo per seguire la telemetria.',9);
    const db=$('#dec:not([hidden]) [data-act="decide"]'); if(db) return S('#dec:not([hidden]) [data-act="decide"]','Un imprevisto: scegli tu cosa fare. Ogni opzione ha un costo e un rischio.',9);
    return S(null,'Ogni mese il satellite raccoglie dati scientifici. Aspetta la fine della missione: nel tutorial il tempo scorre più veloce.',9); }
  if(ph==='F'){ if(!here('mcc')) return go2('mcc','Missione nominale compiuta: torna in sala controllo per la chiusura.',10); if(MCCV!=='wall') return S('#roomsvg [data-act="mccwall"]','Tocca gli schermi per seguire la chiusura della missione.',10); return S(null,'Fase F: la missione ha raggiunto la durata promessa. Il controllo missione chiude le operazioni e prepara il rientro.',10); }
  if(ph==='done') return S(null,'',10);
  return null; }
const vis=el=>{ if(!el) return false; const r=el.getBoundingClientRect(); return r.width>0&&r.height>0&&getComputedStyle(el).visibility!=='hidden'; };
function coach(){ const box=$('#coach'), hand=$('#chand'); if(!box) return; document.body.classList.toggle('tutmode',!!G.tut);
  const prev=document.querySelector('.coach-hl'); let stp=coachStep();
  if(!stp){ coach.mx=0; box.hidden=true; hand.hidden=true; if(prev) prev.classList.remove('coach-hl'); return; }
  const M=G.missions[0]; if(M&&M.phase==='done'&&$('#ov').hidden&&coach.mcr&&!coach.ended){ coach.ended=true; tutEndModal(); return; }
  let el=stp.sel?Array.from(document.querySelectorAll(stp.sel)).find(vis):null;
  { const any=el||(stp.sel?document.querySelector(stp.sel):null), dk=any&&any.closest&&any.closest('.dockL,.dockR'), vw=$('#view'); if(dk&&vw){ const sd=dk.classList.contains('dockL')?'L':'R', rb=document.querySelector('.rb[data-k="'+sd+'"]'); if(!vw.classList.contains('open'+sd)&&rb&&vis(rb)){ el=rb; stp=Object.assign({},stp,{t:'Apri il pannello '+(sd==='L'?'di sinistra':'di destra')+': tocca il tasto evidenziato.'}); } } }
  if(prev&&prev!==el) prev.classList.remove('coach-hl'); if(el&&el.matches('.campus .tag')) el.classList.add('on'); if(el&&!el.classList.contains('coach-hl')){ el.classList.add('coach-hl'); if(coach.last!==stp.sel){ coach.last=stp.sel; const r=el.getBoundingClientRect(); if(r.top<70||r.bottom>innerHeight-150) el.scrollIntoView({block:'center',behavior:'smooth'}); } }
  if(stp.t){ const key=stp.t+'|'+stp.n; if(box.dataset.k!==key){ box.dataset.k=key; const nn=Math.max(coach.mx||0,stp.n||0); coach.mx=nn; const tt=LANG==='en'?I18N.tr(stp.t):stp.t, ss=tt.replace(/([.!?…]) (?=[A-ZÀ-Ý«])/g,'$1\u0001').split('\u0001'); let act=ss.pop(); if(act.length<50&&ss.length) act=ss.pop()+' '+act; const ctx=ss.join(' '); box.innerHTML='<div class="ch"><span class="cn">'+Math.min(11,nn+1)+'/11</span><div class="bar"><i style="width:'+Math.round((nn+1)/11*100)+'%"></i></div></div><p class="cdo">'+esc(act)+'</p>'+(ctx?'<details class="cwhy"><summary>Perché?</summary><p>'+esc(ctx)+'</p></details>':'')+'<button class="cskip" data-act="tutskip">Salta</button>'; } box.hidden=false; const ovo=!$('#ov').hidden; let anch=false; box.classList.remove('anch','up','dn','strip','sb'); const shortS=innerHeight<=520; if(shortS){ box.classList.add('strip'); if(el){ const ov2=()=>{ const r=el.getBoundingClientRect(), q=box.getBoundingClientRect(); return r.bottom>q.top-4&&r.top<q.bottom+4&&r.right>q.left-4&&r.left<q.right+4; }; if(ov2()){ box.classList.add('sb'); if(ov2()) box.classList.remove('sb'); } } } else if(el&&!ovo){ const r=el.getBoundingClientRect(), bw=box.offsetWidth, bh=box.offsetHeight; if(r.height<innerHeight*.45&&r.bottom>0&&r.top<innerHeight){ let y=null, cls=''; if(r.bottom+bh+18<innerHeight) { y=r.bottom+12; cls='up'; } else if(r.top-bh-18>0){ y=r.top-bh-12; cls='dn'; } if(y!=null){ const x=Math.max(8,Math.min(innerWidth-bw-8,r.left+r.width/2-bw/2)); box.style.setProperty('--cx',x+'px'); box.style.setProperty('--cy',y+'px'); box.style.setProperty('--ax',Math.max(16,Math.min(bw-16,r.left+r.width/2-x))+'px'); box.classList.add('anch',cls); anch=true; } } } box.classList.toggle('ontop',ovo&&!anch); coach.anch=anch; } else box.hidden=true;
  if(el&&!coach.anch){ const r=el.getBoundingClientRect(); hand.hidden=false; hand.style.left=Math.min(innerWidth-40,Math.max(4,r.left+r.width/2-12))+'px'; hand.style.top=Math.min(innerHeight-40,r.bottom-4)+'px'; } else hand.hidden=true; }
setInterval(()=>{ if(G) coach(); },300);

/* ---------- avvio ---------- */
function newG(){ return {v:32,staff:12,sciTotal:0,labPos:[],rooms:{build:{plants:[{x:17,y:.4}]},clean:{plants:[]},test:{plants:[]},mcc:{plants:[{x:16.9,y:12.9}]}},world:CAM.defaultWorld(),flag:null,cedit:false,myBoard:[],tut:false,tutDone:false,fresh:[],pad:false,co:'',money:L.START_MONEY,xp:0,missions:[],cur:0,lab:[],plots:[],recruited:[],speed:1,vt:0,lastReal:Date.now()}; }
function welcome(){ $('#ov').innerHTML='<div class="rv" role="dialog" aria-modal="true"><h3>Benvenuto</h3><h2>Fonda la tua agenzia spaziale</h2><p>Hai un campus, '+keur(L.START_MONEY)+' e nessun satellite. La NASA finanzia il tuo primo CubeSat e ti apre il suo catalogo di tecnologie: si parte con poche carte, le altre si sbloccano salendo di livello.</p><p><b>Lo scopo:</b> raccogliere più punti scienza possibile e salire di lega nella classifica mondiale delle agenzie.</p>'+
    '<div><label for="co">Nome dell’agenzia</label><input type="text" id="co" maxlength="28" value="Perigeo Labs"></div><p class="fine">La prova guidata porta una missione intera, dall’idea al volo, in circa 10 minuti: requisiti, missione, satellite, prove, lancio e operazioni. Ti diciamo noi cosa toccare. Non dà punti e non cambia la partita.</p><div class="row"><button class="btn primary" data-act="start">Prova guidata · 10 minuti</button></div><h3 style="margin-top:14px">Oppure gioca subito</h3><div class="diffs">'+Object.keys(DIFF).map(k=>'<button class="'+(WDIFF===k?'on':'')+'" data-act="wdiff" data-k="'+k+'"><b>'+DIFF[k].n+'</b><small>'+DIFF[k].s+'</small></button>').join('')+'</div><div class="row"><button class="btn" data-act="startskip">Gioca · '+DIFF[WDIFF].n.toLowerCase()+'</button><button class="btn" data-act="startsand" title="Tutto sbloccato, nessun vincolo di budget">Modalità libera</button></div></div>'; $('#ov').hidden=false; }
function start(){ try{ start0(); }catch(e){ console.error(e); document.body.insertAdjacentHTML('beforeend','<div style="position:fixed;inset:0;z-index:999;display:grid;place-items:center;background:#DCE6EE;font:15px/1.5 sans-serif;padding:16px"><div style="max-width:440px;background:#fff;border-radius:16px;padding:22px;box-shadow:0 8px 30px rgba(0,0,0,.15)"><h2 style="font:700 22px/1.2 sans-serif;margin:0 0 8px">Salvataggio non compatibile</h2><p style="margin:0 0 14px">La partita salvata in questo browser viene da una versione precedente del gioco e non si riesce ad aprire.</p><p style="margin:0 0 14px;font-size:12px;color:#5F6E80">'+String(e&&e.message||e).replace(/</g,'&lt;')+'</p><button id="gngReset" style="background:#F07B3F;color:#fff;border:0;border-radius:10px;padding:10px 16px;font-weight:700;cursor:pointer">Ricomincia da capo</button></div></div>'); document.getElementById('gngReset').onclick=()=>{ try{ Object.keys(localStorage).filter(k=>/^gng/i.test(k)).forEach(k=>localStorage.removeItem(k)); }catch(_){} try{ sessionStorage.clear(); }catch(_){} location.href=location.href.split('#')[0]; setTimeout(()=>location.reload(),300); }; } }
// v33.1 · ogni edificio dichiarato costruito deve stare sulla mappa: lo piazza da solo vicino al centro del campus
function autoPlace(k){ const W=G.world; if(!W||!CAM.K[k]||W.items.some(i=>i.k===k)) return false; syncSite(); const d=CAM.K[k], cx=13.75, cy=7.25;
  for(let r=0;r<40;r+=0.5) for(let a=0;a<360;a+=12){ const t=a*Math.PI/180, x=Math.round((cx+Math.cos(t)*r-d.w/2)*4)/4, y=Math.round((cy+Math.sin(t)*r*.8-d.h/2)*4)/4;
    if(!CAM.valid(k,x,y,W.items)){ W.n=(W.n||100)+1; W.items.push({id:'w'+W.n,k,x,y,ang:-20-Math.round(Math.random()*25)}); return true; } }
  return false; }
function fixPlots(){ if(!G||!G.world) return; let ch=false; (G.plots||[]).filter(Boolean).forEach(k=>{ if(L.BUILD[k]&&autoPlace(k)) ch=true; }); if(G.pad&&autoPlace('pad')) ch=true; return ch; }
function start0(){ G=load(); if(G) G.speed=1; const fresh=!G; if(!G) G=newG(); G.recruited=G.recruited||[]; if(G.rooms&&G.rooms.clean) G.rooms.clean.plants=[]; if(G.rooms&&G.rooms.test) G.rooms.test.plants=[]; G.recruited.forEach(id=>L.addSponsor(id)); G.missions.forEach(m=>L.register(m));
  G.lastReal=G.lastReal||Date.now(); clock(); view='hub'; render(); initBoard(); setInterval(tick,500); let nw=innerWidth<640; addEventListener('resize',()=>{ const n=innerWidth<640; if(n!==nw){ nw=n; if(view==='hub') render(); } });
  if(fresh) welcome(); coach(); try{ if(fixPlots()) save(); }catch(e){ console.warn(e); } if(!fresh&&G.tutDone&&!G.sandbox&&!G.boost33&&!(G.missions||[]).some(m=>m.phase==='done'&&!m.tut)){ G.boost33=1; const add=Math.max(0,Math.round(L.START_MONEY*dif().money)-150); if(add){ G.money+=add; save(); setTimeout(()=>toast('Fondo di avvio aumentato: +'+keur(add)+' per la prima missione.'),1500); } } I18N.start(); }
window.GNG={tr:s=>I18N.tr(s),drmScale,drmDv,place:(id,i)=>dropOn({kind:'clean',id},{dataset:{i:String(i)}}),get G(){return G;},ACT,tick,render,go,fdRefresh:()=>fdRefresh(true)};
start();
})();
