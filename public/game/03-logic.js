/* ===== LOGICA v11 (CubeSat e crediti): campus, riunioni con gli stakeholder, missioni parallele in tempo reale. Usa E (engine2). Nessun DOM. ===== */
const L = (function () {
  /* assemblaggio, prove e riparazioni quasi istantanei: niente attese durante la demo */
  const TIME = { month: 10000, build: 1500, test: 1000, fix: 1000, countdown: 6000, win: 30000 };
  const START_MONEY = 400, RUN = 3, FIXC = 10, STIFFC = 15;
  // Macchinari del laboratorio: si installano in una baia vuota. Alcuni si sbloccano con il livello.
  const MACH = {
    func: { n: 'FlatSat', c: 20, lvl: 2, test: 'func', s: 'Software e modi operativi sul banco', tn: 'funzionale', short: 'FUNZ',
      bug: 'Il software si blocca al passaggio in safe mode.', fly: 'il software va in loop dopo il lancio: −15 m/s' },
    vib: { n: 'Tavola vibrante', c: 40, lvl: 1, test: 'vib', s: 'I carichi del lancio', tn: 'di vibrazione', short: 'VIB',
      bug: 'Un bullone del meccanismo di rilascio si è allentato.', fly: 'un meccanismo si allenta: scienza −25%, a volte il satellite si perde' },
    tvac: { n: 'Camera termovuoto', c: 80, lvl: 4, test: 'tvac', s: 'Freddo e vuoto dell’eclisse', tn: 'in termovuoto', short: 'TVAC',
      bug: 'Un riscaldatore non si accende a freddo.', fly: 'un pezzo resta al freddo in eclisse' },
    shock: { n: 'Banco shock', c: 40, lvl: 7, test: 'shock', s: 'Lo strappo della separazione dal razzo', tn: 'di shock', short: 'SHOCK',
      bug: 'Il connettore di separazione si apre in ritardo.', fly: 'esce dal razzo ruotando: −40% gas e −20 m/s' },
    emc: { n: 'Camera anecoica', c: 60, lvl: 12, test: 'emc', s: 'Interferenze elettromagnetiche tra i sottosistemi', tn: 'EMC', short: 'EMC',
      bug: 'Il convertitore della batteria disturba la radio.', fly: 'la radio di riserva va persa, o scienza −20%' },
    mass: { n: 'Bilancia di massa', c: 30, lvl: 17, test: 'mass', s: 'Massa e baricentro reali, al millimetro', tn: 'di massa', short: 'MASSA',
      bug: 'Il baricentro reale è 4 mm fuori dal calcolo.', fly: 'spinta fuori asse: −6% di ΔV' }
  };
  const TESTS = ['func', 'vib', 'tvac', 'shock', 'emc', 'mass'];
  // Livelli: si sale chiudendo revisioni e missioni
  const LEVELS = [0, 260, 550, 880, 1240, 1640, 2070, 2530, 3030, 3560, 4130, 4730, 5360, 6030, 6730, 7460, 8230, 9030, 9870, 10740];
  const XP = { MDR: 20, SRR: 20, PRR: 20, PDR: 30, CDR: 30, FRR: 30, launch: 20, win: 120, lose: 40 };
  const level = xp => LEVELS.reduce((a, t, i) => xp >= t ? i + 1 : a, 1);
  /* Progressione (v34): Tier logici, slot sponsor che crescono fino a esaurire il catalogo al livello massimo, missioni aperte in parallelo per fascia. Il livello massimo e' LEVELS.length: coincide con l'ultimo livello che sblocca qualcosa. */
  const TIERS = [{"from":1,"n":"Garage Lab"},{"from":5,"n":"Lunar Pioneer"},{"from":10,"n":"Red Planet"},{"from":15,"n":"Deep Space"},{"from":20,"n":"Sovereign Agency"}];
  const tierOf = lv => { let t = 0; TIERS.forEach((x, i) => { if (lv >= x.from) t = i; }); return t; };
  const sponsorSlots = lv => Math.max(1, Math.min(SPONSORS.length, Math.ceil((lv - 2) * SPONSORS.length / (LEVELS.length - 2))));
  const maxActiveAt = lv => lv <= 3 ? 2 : lv <= 9 ? 3 : 4;
  // Edifici da costruire nei lotti liberi del campus
  const BUILD = {
    factory: { n: 'Fabbrica', c: 250, lvl: 11, s: 'Integrazione in fase C due volte più veloce.' },
    ground: { n: 'Stazione di terra', c: 200, lvl: 3, s: 'Più contatti con il satellite: +20% di dati in volo, +3% per ogni antenna nel campus.' },
    rnd: { n: 'Centro R&D', c: 350, lvl: 14, s: 'Processi migliori: metà dei difetti di fabbricazione.' },
    office: { n: 'Ufficio partnership', c: 300, lvl: 6, s: 'Recluti sponsor: portano fondi e sbloccano prima le loro tecnologie.' },
    visit: { n: 'Centro visitatori', c: 400, lvl: 8, s: 'Pubblico e sponsor: premio di fine missione +15%.' }
  };

  // Personaggi: gli stakeholder sono gli sponsor; gli altri sono il tuo staff
  const PEOPLE = {
    nasa: { n: 'Dott.ssa Hale', org: 'NASA', role: 'Responsabile del programma', col: '#2F5DB8', stake: 'nasa' },
    reg: { n: 'Ing. Bassi', org: 'Ente regolatore', role: 'Autorizzazioni e detriti', col: '#5E6B78', staff: 1, reg: 1 },
    asm: { n: 'Dott.ssa Ferri', org: 'Agenzia Spaziale Mediterranea', role: 'Program manager', col: '#3B6FD8', stake: 'asm' },
    bor: { n: 'Prof. Lind', org: 'Istituto Borealis', role: 'Radiobiologo', col: '#22A87A', stake: 'bor' },
    kes: { n: 'Marco Vitale', org: 'Kestrel Propulsion', role: 'Fondatore', col: '#D9478F', stake: 'kes' },
    hel: { n: 'Sara Okafor', org: 'Helios Arrays', role: 'Vendite', col: '#D99A12', stake: 'hel' },
    orb: { n: 'Jonas Berg', org: 'Orbita Relay', role: 'Operazioni', col: '#8A55D0', stake: 'orb' },
    sci: { n: 'Dott.ssa Rinaldi', org: 'Il tuo staff', role: 'Scienziata di missione', col: '#E9733A', staff: 1 },
    sys: { n: 'Ing. Conti', org: 'Il tuo staff', role: 'Ingegnere di sistema', col: '#4F6177', staff: 1 },
    pwr: { n: 'Ing. Ruiz', org: 'Il tuo staff', role: 'Potenza', col: '#E0A100', staff: 1 },
    thr: { n: 'Ing. Sato', org: 'Il tuo staff', role: 'Termico', col: '#D2513A', staff: 1 },
    prp: { n: 'Ing. Moretti', org: 'Il tuo staff', role: 'Propulsione', col: '#2C9AC8', staff: 1 },
    pa: { n: 'Ing. Galli', org: 'Il tuo staff', role: 'Qualità', col: '#6C7A8B', staff: 1 }
  };
  const has = (d, cat, ids) => !!d.placed[cat] && ids.indexOf(d.placed[cat].id) >= 0;
  const transferNeed = d => (d.planDv != null ? d.planDv : E.dvNeed(d)) * 1.05;
  // Richieste: in fase 0 diventano requisiti di missione, in fase A requisiti di sistema
  const REQ = [];   // si riempie con le richieste generate per ogni missione
  const R = id => REQ.find(r => r.id === id);
  // ================= RICHIESTE GENERATE DALLA MISSIONE =================
  // 1) ogni persona ha degli interessi; 2) i modelli di richiesta dicono a quale interesse rispondono e quando si applicano;
  // 3) i prodotti degli sponsor generano richieste solo se servono a questa missione; 4) il nucleo delle richieste deve essere fattibile.
  const INT = { nasa: ['scienza', 'affidabilita', 'costo', 'durata'], reg: ['regole'], asm: ['affidabilita', 'costo', 'sostenibilita'], bor: ['biologia', 'scienza'], kes: ['prodotto', 'prestazioni', 'leggerezza'], hel: ['prodotto', 'energia'], orb: ['prodotto', 'comunicazioni'], sci: ['scienza', 'prove'],
    ion: ['prodotto'], sol: ['prodotto'], tav: ['prodotto'], gyr: ['prodotto'], pho: ['prodotto'], srl: ['prodotto'], grp: ['prodotto'], lum: ['prodotto'], pix: ['prodotto'],
    asa: ['durata', 'affidabilita'], fts: ['prove'], pol: ['energia', 'scienza'], mrs: ['scienza', 'prestazioni'], ven: ['scienza'], eco: ['sostenibilita'], ins: ['ridondanza'], lgt: ['leggerezza'],
    edu: ['durata', 'visibilita'], geo: ['scienza', 'comunicazioni'], mag: ['prove'], shk: ['prove'], tlm: ['comunicazioni'], pan: ['energia'], low: ['costo'], mus: ['visibilita'] };
  const INTN = { regole: 'regole e detriti', affidabilita: 'affidabilità', sostenibilita: 'sostenibilità', biologia: 'biologia', scienza: 'scienza', prodotto: 'il suo prodotto', prestazioni: 'prestazioni', energia: 'energia', comunicazioni: 'comunicazioni', prove: 'prove a terra', ridondanza: 'ridondanza', leggerezza: 'leggerezza', costo: 'costo', durata: 'durata', visibilita: 'visibilità' };
  // sponsor che finanziano solo certe missioni
  const ONLY = { mrs: { dest: 'mars', why: 'investe solo su Marte' }, ven: { dest: 'venus', why: 'finanzia solo Venere' }, geo: { dest: 'leo', why: 'lavora solo in orbita terrestre' },
    grp: { type: 'deb', why: 'fa solo sistemi di cattura' }, lum: { type: 'tel', why: 'fa solo ottiche per telescopi' }, pix: { type: 'obs', why: 'fa solo camere per osservazione' } };
  const fits4 = (who, M) => { const o = ONLY[who]; if (!o) return ''; if (o.dest && (M.sat.dest || 'leo') !== o.dest) return o.why; if (o.type && (M.type || 'sci') !== o.type) return o.why; return ''; };
  const landing = M => typeof O !== 'undefined' && !!O.landOf(M);
  const kitPay = () => null;
  const payOK = (M, id) => ((E.PARTS[id] && E.PARTS[id].pays) || []).indexOf(landing(M) ? 'land' : (M.type || 'sci')) >= 0;
  const lv_ = M => M.lvlNow || M.lvl || 1, needsProp = M => (M.sat.dest || 'leo') !== 'leo' || M.type === 'deb';
  const spare = (d, c) => !!d.placed[c] && !!E.PARTS[d.placed[c].id].spare;
  const needDv = (d, M, x) => transferNeed(d) + 27 + E.skOf(d) * minMonths(M) + (x || 0);
  const payN = M => { const T = typeof O !== 'undefined' ? O.TYPES[M.type || 'sci'] : null; const P = T && E.PARTS[T.pay]; return P ? P.n.split(' · ')[0].toLowerCase() : 'payload'; };
  // mk(M, s): s = versione ammorbidita, quella che il giocatore ottiene con una controproposta. sf: true se esiste.
  const mo = (n, s) => s ? Math.max(6, n - (n >= 18 ? 6 : 3)) : n;
  const capC = M => M.capC || 1400, capM = M => M.capM || 26;
  // le prove chieste sono solo quelle che al tuo livello si possono fare (le altre diventano la funzionale)
  const TN = { vib: 'vibrazione', tvac: 'termovuoto', func: 'funzionale', shock: 'shock', mass: 'massa', emc: 'EMC' };
  const avT = (M, l) => l.map(t => MACH[t].lvl <= (M.lvl || 1) ? t : (MACH.func.lvl <= (M.lvl || 1) ? 'func' : 'vib')).filter((t, i, a) => a.indexOf(t) === i);
  const tReq = (M, l, say) => { const ts = avT(M, l), n = ts.map(t => TN[t]), j = n.length > 1 ? n.slice(0, -1).join(', ') + ' e ' + n[n.length - 1] : n[0]; return { say: say.replace('{T}', j), t: (ts.length > 1 ? 'Prove di ' : 'Prova di ') + j + (ts.length > 1 ? ' superate' : ' superata'), kind: 'tests', tests: ts }; };
  const TPL = {
    red2: { sf: 1, int: 'affidabilita', when: M => lv_(M) >= 2, mk: (M, s) => s ? { say: 'Per noi conta l’affidabilità: almeno il computer deve essere doppio.', t: 'Computer ridondato', kind: 'design', chk: d => spare(d, 'avi') } : { say: 'Per noi conta l’affidabilità: computer e radio devono essere doppi.', t: 'Computer e radio ridondati', kind: 'design', chk: d => spare(d, 'avi') && spare(d, 'com') } },
    red3: { sf: 1, int: 'ridondanza', when: M => lv_(M) >= 2, mk: (M, s) => s ? { say: 'Assicuriamo il satellite se computer e radio hanno una scorta.', t: 'Ridondanza su computer e radio', kind: 'design', chk: d => spare(d, 'avi') && spare(d, 'com') } : { say: 'Assicuriamo solo satelliti con computer e radio di scorta, e un GPS per sapere dove sono.', t: 'Scorte di computer e radio, più navigazione', kind: 'design', chk: d => spare(d, 'avi') && spare(d, 'com') && !!d.placed.nav } },
    tvt: { sf: 1, int: 'prove', mk: (M, s) => tReq(M, s ? ['vib'] : ['vib', 'tvac'], s ? 'Almeno la vibrazione va provata prima del lancio.' : 'Prima del lancio vogliamo superate le prove di {T}.') },
    tshk: { sf: 1, int: 'prove', mk: (M, s) => tReq(M, s ? ['vib'] : ['vib', 'shock'], s ? 'Almeno la vibrazione va provata prima del lancio.' : 'Il razzo non perdona: {T} superate.') },
    tmass: { int: 'prove', when: M => (M.type === 'deb' || M.type === 'tel') && (M.lvl || 1) >= 3, mk: M => ({ say: M.type === 'deb' ? 'Per agganciare il detrito il baricentro va conosciuto al millimetro: pesatelo.' : 'Un telescopio vuole un baricentro perfetto: pesatelo.', t: 'Prova di massa superata', kind: 'tests', tests: ['mass'] }) },
    disp: { grp: 'dv', int: 'sostenibilita', when: needsProp, mk: () => ({ say: 'A fine vita nessun detrito: tenete il ΔV per lo smaltimento.', t: 'Riserva di ΔV per il fine vita', kind: 'design', chk: (d, b, M) => b.fuel >= needDv(d, M) }) },
    debre: { sf: 1, int: 'sostenibilita', when: M => M.type === 'deb', mk: (M, s) => { const x = s ? 30 : 60; return { say: 'Il detrito agganciato deve rientrare: servono altri ' + x + ' m/s per abbassarlo.', t: '+' + x + ' m/s per far rientrare il detrito', kind: 'design', chk: (d, b, M2) => b.fuel >= needDv(d, M2, x) }; } },
    eco30: { sf: 1, grp: 'dv', int: 'sostenibilita', when: needsProp, mk: (M, s) => { const x = s ? 15 : 30; return { say: 'Zero sorprese a fine vita: il ' + x + '% di ΔV oltre il necessario.', t: 'ΔV con ' + x + '% di margine', kind: 'design', chk: (d, b, M2) => b.fuel >= needDv(d, M2) * (1 + x / 100) }; } },
    months: { sf: 1, grp: 'mesi', int: 'scienza', when: M => ['sci', 'obs', 'tel'].indexOf(M.type) >= 0, mk: (M, s) => { const n = mo(M.type === 'sci' ? 18 : 12, s); return { say: 'Per risultati seri servono ' + n + ' mesi di dati.', t: 'Durata ≥ ' + n + ' mesi', kind: 'months', months: n }; } },
    storm: { int: 'scienza', when: M => M.type === 'sci' && lv_(M) >= 2, mk: () => ({ say: 'Voglio misurare anche durante le tempeste solari: sono i dati più rari.', t: 'Misure durante le tempeste solari', kind: 'design', storm: 1, chk: d => !!d.placed.avi && E.PARTS[d.placed.avi.id].pSpe <= 0.12 }) },
    point: { int: 'scienza', when: M => ['obs', 'tel', 'deb'].indexOf(M.type) >= 0 && lv_(M) >= 2, mk: M => lv_(M) >= 3 ? { say: 'Immagini nitide vogliono un puntamento fine: serve lo star tracker.', t: 'Puntamento ≤ 0,01° (star tracker)', kind: 'design', chk: d => E.pointing(d) <= 0.01 } : { say: 'Le immagini vengono mosse se il satellite non punta bene: servono le ruote di reazione.', t: 'Puntamento ≤ 0,1° (ruote di reazione)', kind: 'design', chk: d => E.pointing(d) <= 0.1 } },
    demo9: { sf: 1, grp: 'mesi', int: 'scienza', when: M => M.type === 'demo', mk: (M, s) => { const n = mo(9, s); return { say: 'L’esperimento va tenuto acceso almeno ' + n + ' mesi: vogliamo vedere come invecchia.', t: 'Durata ≥ ' + n + ' mesi', kind: 'months', months: n }; } },
    comdat: { sf: 1, grp: 'mesi', int: 'scienza', when: M => M.type === 'com', mk: (M, s) => { const n = mo(12, s); return { say: 'Misureremo la qualità del collegamento per ' + n + ' mesi.', t: 'Durata ≥ ' + n + ' mesi', kind: 'months', months: n }; } },
    rate: { int: 'comunicazioni', when: M => lv_(M) >= 2 && (M.type === 'com' || M.type === 'obs' || !!E.DEST[M.sat.dest || 'leo'].far), mk: M => ({ say: M.type === 'obs' ? 'Le immagini pesano: serve un collegamento veloce, almeno la banda S.' : 'Serve un collegamento veloce: almeno la banda S.', t: 'Collegamento ≥ 1 Mbps', kind: 'design', chk: d => !!d.placed.com && (E.PARTS[d.placed.com.id].rate || 0) >= 1000 }) },
    relay: { int: 'comunicazioni', when: M => M.type === 'com' && lv_(M) >= 2, mk: () => ({ say: 'Un ripetitore non può tacere: radio con trasmettitore di riserva.', t: 'Radio con riserva', kind: 'design', chk: d => spare(d, 'com') }) },
    comlong: { sf: 1, grp: 'mesi', int: 'comunicazioni', when: M => M.type === 'com', mk: (M, s) => { const n = mo(24, s); return { say: 'La rete deve funzionare a lungo: ' + n + ' mesi di servizio.', t: 'Durata ≥ ' + n + ' mesi', kind: 'months', months: n }; } },
    pow30: { sf: 1, int: 'energia', mk: (M, s) => { const x = s ? 15 : 30; return { say: 'Vogliamo il ' + x + '% di margine sulla potenza.', t: 'Margine di potenza ≥ ' + x + '%', kind: 'design', chk: (d, b) => b.gen >= b.demand * (1 + x / 100) }; } },
    gen50: { sf: 1, int: 'energia', when: M => ['com', 'tel', 'obs'].indexOf(M.type) >= 0 && lv_(M) >= 3, mk: (M, s) => { const x = s ? 25 : 30; return { say: 'Il ' + payN(M) + ' consuma: almeno ' + x + ' W dai pannelli.', t: 'Generazione ≥ ' + x + ' W', kind: 'design', chk: (d, b) => b.gen >= x }; } },
    dv20: { sf: 1, grp: 'dv', int: 'prestazioni', when: needsProp, mk: (M, s) => { const x = s ? 10 : 20; return { say: 'Voglio il ' + x + '% di ΔV in più di quello che serve.', t: 'ΔV con ' + x + '% di margine', kind: 'design', chk: (d, b, M2) => b.fuel >= needDv(d, M2) * (1 + x / 100) }; } },
    cost: { sf: 1, int: 'costo', mk: (M, s) => { const x = s ? Math.round(capC(M) * 1.15 / 10) * 10 : capC(M); return { say: 'Il budget è quello: il satellite, razzo compreso, non deve superare ' + x.toLocaleString('it-IT') + ' crediti.', t: 'Costo ≤ ' + x.toLocaleString('it-IT') + ' crediti', kind: 'design', cap: 'cost', chk: (d, b) => b.cost <= x }; } },
    light: { sf: 1, int: 'leggerezza', mk: (M, s) => { const x = s ? capM(M) + 2.5 : capM(M); return { say: 'Leggeri vuol dire economici: sotto i ' + x.toLocaleString('it-IT') + ' kg al lancio.', t: 'Massa al lancio ≤ ' + x.toLocaleString('it-IT') + ' kg', kind: 'design', cap: 'mass', chk: (d, b) => b.wet <= x }; } },
    m9: { sf: 1, grp: 'mesi', int: 'durata', mk: (M, s) => { const n = mo(9, s); return { say: 'Vogliamo seguire la missione per un anno scolastico: ' + n + ' mesi.', t: 'Durata ≥ ' + n + ' mesi', kind: 'months', months: n }; } },
    m12: { sf: 1, grp: 'mesi', int: 'durata', mk: (M, s) => { const n = mo(12, s); return { say: 'Finanziamo solo missioni lunghe: almeno ' + n + ' mesi.', t: 'Durata ≥ ' + n + ' mesi', kind: 'months', months: n }; } },
    logo: { int: 'visibilita', mk: () => ({ say: 'Per noi conta esserci: mettete il nostro logo sulla struttura.', t: 'Logo a bordo', kind: 'design', chk: () => true }) },
    // staff tecnico (fase A): ognuno guarda il suo sottosistema, ma sa che missione è
    sys1: { sf: 1, int: 'sys', mk: (M, s) => { const x = s ? 5 : 10; return { say: 'Teniamoci il ' + x + '% di margine sotto il limite di massa della struttura.', t: 'Margine di massa ≥ ' + x + '%', kind: 'design', chk: (d, b) => b.wet <= (1 - x / 100) * b.massLim }; } },
    sysTel: { int: 'sys', when: M => (M.type === 'tel' || M.type === 'obs') && lv_(M) >= 3, mk: () => ({ say: 'Lo strumento vuole un puntamento fine: star tracker.', t: 'Puntamento ≤ 0,01° per lo strumento', kind: 'design', chk: d => E.pointing(d) <= 0.01 }) },
    pwr1: { sf: 1, int: 'pwr', mk: (M, s) => { const x = s ? 70 : 50; return { say: 'In eclisse la batteria non deve scaricarsi oltre il ' + x + '%.', t: 'Scarica in eclisse ≤ ' + x + '%', kind: 'design', chk: (d, b) => b.wh > 0 && b.dod <= x / 100 }; } },
    pwrCom: { sf: 1, int: 'pwr', when: M => M.type === 'com', mk: (M, s) => { const x = s ? 12 : 25; return { say: 'Il transponder è sempre acceso: voglio il ' + x + '% di margine di potenza.', t: 'Margine di potenza ≥ ' + x + '%', kind: 'design', chk: (d, b) => b.gen >= b.demand * (1 + x / 100) }; } },
    thr1: { int: 'thr', mk: () => ({ say: 'Niente al freddo: ogni pezzo sensibile scaldato o vicino a una fonte di calore.', t: 'Nessun pezzo al freddo', kind: 'design', chk: (d, b) => !b.L.coldBad.length }) },
    prp1: { sf: 1, int: 'prp', when: needsProp, mk: (M, s) => { const x = s ? 94 : 97; return { say: 'Il baricentro deve stare sulla linea dell’ugello: spinta in asse al ' + x + '%.', t: 'Spinta in asse ≥ ' + x + '%', kind: 'design', chk: (d, b) => !!d.placed.prop && b.L.align >= x / 100 }; } },
    prpDeb: { sf: 1, int: 'prp', when: M => M.type === 'deb', mk: (M, s) => { const x = s ? 12 : 25; return { say: 'L’avvicinamento al detrito non perdona errori: ' + x + '% di ΔV in più.', t: 'ΔV con ' + x + '% di margine per l’avvicinamento', kind: 'design', chk: (d, b, M2) => b.fuel >= needDv(d, M2) * (1 + x / 100) }; } },
    pa2: { sf: 1, int: 'pa', mk: (M, s) => tReq(M, s ? ['vib'] : ['vib', 'tvac', 'func'], s ? 'Prima del lancio almeno la vibrazione, senza eccezioni.' : 'Prima del lancio: prove di {T}, senza eccezioni.') },
    pa1: { int: 'pa', when: M => lv_(M) >= 3, mk: () => ({ say: 'Niente prototipi nei sottosistemi vitali: computer, radio e propulsione almeno a TRL 8.', t: 'Computer, radio e propulsione con TRL ≥ 8', kind: 'design', chk: d => ['avi', 'com', 'prop'].every(c => !d.placed[c] || E.PARTS[d.placed[c].id].trl >= 8) }) },
    // ente regolatore: regole, non preferenze. Non si rifiutano e non si derogano.
    deorb: { int: 'regole', when: M => (M.sat.dest || 'leo') === 'leo', mk: () => ({ say: 'Regola dei 5 anni: a fine missione il satellite deve rientrare. Sotto i 600 km basta l’atmosfera, sopra servono propulsione o una vela di rientro.', t: 'Rientro entro 5 anni dalla fine', kind: 'design', rule: 1, chk: d => !!d.placed.prop || !!d.placed.eol || (d.alt || 0) <= E.M.eolAlt }) },
    freq: { int: 'regole', mk: () => ({ say: 'Le frequenze vanno coordinate: niente radio sperimentali sotto TRL 8.', t: 'Radio con TRL ≥ 8 (frequenze coordinate)', kind: 'design', rule: 1, chk: d => !!d.placed.com && E.PARTS[d.placed.com.id].trl >= 8 }) },
    vibreg: { int: 'regole', mk: () => ({ say: 'Chi vola insieme ad altri satelliti deve dimostrare di non rompersi: prova di vibrazione superata.', t: 'Prova di vibrazione per il lancio condiviso', kind: 'tests', rule: 1, tests: ['vib'] }) },
    dispreg: { int: 'regole', when: M => (M.sat.dest || 'leo') !== 'leo', mk: () => ({ say: 'Niente detriti attorno ad altri corpi: tenete il ΔV per lo smaltimento.', t: 'Smaltimento a fine vita', kind: 'design', rule: 1, chk: (d, b, M) => b.fuel >= needDv(d, M) }) }
  };
  const STAFFT = { sys: ['sysTel', 'sys1'], pwr: ['pwrCom', 'pwr1'], thr: ['thr1'], prp: ['prpDeb', 'prp1'], pa: ['pa2', 'pa1'] };
  const SAYP = { P3: 'Fate volare il nostro motore K-2. Sarà la sua prima volta nello spazio.', S3: 'Montate le nostre ali HX, le migliori celle sul mercato.', C3: 'Serve comunicare in banda S attraverso la nostra rete.', O3: 'Il nostro computer rad-hard deve volare.' };
  // la richiesta "usate il nostro prodotto", solo se il prodotto serve a questa missione
  function relevant(g, M) { const p = E.PARTS[g]; if (E.SOLAR[g]) return true; if (!p) return false; if (p.cat === 'ray') return !landing(M) && p.pay === (M.type || 'sci'); if (p.cat === 'cell') return !!(typeof O !== 'undefined' && O.TYPES[M.type || 'sci'].bio); return true; }
  function mkProd(g) { const p = E.PARTS[g], s = E.SOLAR[g], n = (p || s).n; return { say: SAYP[g] || ('Montate il nostro ' + n + ': è fatto per missioni come questa.'), t: n + ' a bordo', kind: 'design', chk: d => p ? has(d, p.cat, [g]) : d.sol === g }; }
  function build(g, M) { const T = g.tid.indexOf('p:') === 0 ? { mk: () => mkProd(g.tid.slice(2)) } : TPL[g.tid], soft = !!(M.softs && M.softs.indexOf(g.id) >= 0); return Object.assign({ id: g.id, who: g.who, ph: g.ph, core: g.core, tid: g.tid, sf: !!T.sf, soft }, T.mk(M, soft)); }
  // la versione ammorbidita di una richiesta, senza registrarla
  function softOf(id, M) { const r = R(id); if (!r || !r.sf || r.soft) return null; return Object.assign({}, r, TPL[r.tid].mk(M, true), { soft: true }); }
  function register(M) { ['0', 'A'].forEach(ph => ((M.gen && M.gen[ph]) || []).forEach(g => { const i = REQ.findIndex(r => r.id === g.id), r = build(g, M); if (i >= 0) REQ[i] = r; else REQ.push(r); })); }
  const interests = who => INT[who] || ['visibilita'];
  // missione tutorial: richieste fisse, niente a caso
  const TUTG = { '0': [['nasa', 'cost'], ['sci', 'tvt'], ['reg', 'deorb']], 'A': [['sys', 'sys1']] };
  // ogni richiesta generata deve stare insieme a quelle già accettate e a quelle che la precedono; altrimenti si cambia con una fattibile
  function satOK(M, d, ids) { if (!d || (M.rideFixed && d.ride !== M.sat.ride) || (M.lvFixed && d.lv !== M.sat.lv)) return false; const Mx = Object.assign({}, M, { reqs: ids.map(id => ({ id })), waived: [] }), b = E.budget(d), mm = minMonths(Mx);
    if (d.placed.prop && b.fuel < (d.planDv || 0) * 1.05 + 27 + E.skOf(d) * mm) return false; return ids.map(R).filter(q => q && q.kind === 'design').every(q => q.chk(d, b, Mx)); }
  function ensureFeasible(M, g, ph) { const t0 = Date.now(), acc = M.reqs.filter(x => M.waived.indexOf(x.id) < 0).map(x => x.id);
    let W = (M.wit && satOK(M, M.wit, acc)) ? M.wit : (anySat(M, acc, 500, 0x5150) || anySat(M, acc, 1200, 0x5152)); if (!W && ph !== '0') return;
    const S = acc.slice(), order = g.filter(x => x.core).concat(g.filter(x => !x.core)), haveT = () => S.map(id => (R(id) || {}).t);
    const fits = e => { const r = R(e.id); if (!r) return false; if (r.kind === 'tests') { const have = {}; S.forEach(id => { const q = R(id); if (q && q.kind === 'tests') q.tests.forEach(t => { have[t] = 1; }); }); return r.tests.some(t => !have[t]); } if (r.kind !== 'design' && r.kind !== 'months') return true; if (haveT().indexOf(r.t) >= 0) return false; const ids = S.concat([e.id]);
      if (W && satOK(M, W, ids)) return true; if (Date.now() - t0 > 5000) return false; const d = anySat(M, ids, 350, 0x5151) || anySat(M, ids, 900, 0x5153); if (d) { W = d; return true; } return false; };
    for (const e of order) { if (fits(e)) { S.push(e.id); continue; }
      const orig = e.tid, inG = k => g.some(x => x !== e && x.tid === k), ints = STAFFT[e.who] ? [e.who] : interests(e.who);
      const alts = Object.keys(TPL).filter(k => k !== orig && ints.indexOf(TPL[k].int) >= 0 && (!TPL[k].when || TPL[k].when(M)) && !inG(k) && !(TPL[k].grp && g.some(x => x !== e && TPL[x.tid] && TPL[x.tid].grp === TPL[k].grp)));
      let ok = false; for (const k of alts.sort((a, b) => (TPL[a].mk(M).kind === 'design') - (TPL[b].mk(M).kind === 'design')).slice(0, 4)) { e.tid = k; e.id = e.id.replace(/\|[^|]*$/, '|' + k); register(M); if (fits(e)) { ok = true; break; } }
      if (!ok && ph === '0' && e.who !== 'reg') { e.tid = 'logo'; e.id = e.id.replace(/\|[^|]*$/, '|logo'); register(M); ok = fits(e); }
      if (ok) S.push(e.id); else g.splice(g.indexOf(e), 1); }
    if (W && satOK(M, W, S)) M.wit = W; }
  // una missione di questo tipo si può fare al livello del giocatore? (esiste almeno un satellite completo)
  function typeOK(M) { const rides = Object.keys(E.RIDES).filter(k => rideOK(M, k)); if (!rides.some(k => availCat(M, 'ray', k).length)) return false;
    if (needsProp(M) && !rides.some(k => availCat(M, 'prop', k).length)) return false; return anySat(M, [], 400, 0x4242); }
  function generate(M, ph) { const r = E.rng(((M.seed || 1) ^ (ph === 'A' ? 0x51ed : 0x1234)) >>> 0), used = {}, out = [], id = (who, tid) => M.id + '|' + who + '|' + tid;
    const push = (who, tid, core) => { used[tid] = 1; if (TPL[tid] && TPL[tid].grp) used['g:' + TPL[tid].grp] = 1; out.push({ id: id(who, tid), tid, who, ph, core: core ? 1 : 0 }); };
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
    const lv = M.lvl || 1;
    if (M.tut) return (TUTG[ph] || []).map(x => ({ id: id(x[0], x[1]), tid: x[1], who: x[0], ph, core: 1 }));
    if (ph === 'A') { Object.keys(STAFFT).filter(w => lv >= 3 || (lv === 2 ? w !== 'prp' : (w === 'sys' || w === 'pa'))).forEach(who => { const have = M.reqs.map(x => (R(x.id) || {}).t), ok = STAFFT[who].filter(t => (!TPL[t].when || TPL[t].when(M)) && have.indexOf(TPL[t].mk(M).t) < 0 && !(t === 'pa2' && M.reqs.some(x => (R(x.id) || {}).kind === 'tests'))); if (who === 'pa') ok.slice(0, lv >= 3 ? 2 : 1).forEach((t, i) => push(who, t, i === 0)); else if (ok.length) push(who, ok[0], 0); }); return out; }
    M.stake.concat(['sci', 'reg']).forEach(who => { const ints = interests(who), S = E.stk(who) || { gives: [] };
      const prods = ints.indexOf('prodotto') >= 0 ? (S.gives || []).filter(g => relevant(g, M) && !E.LV[g]).map(g => 'p:' + g) : [];
      const tpls = shuffle(Object.keys(TPL).filter(k => ['sys', 'pwr', 'thr', 'prp', 'pa'].indexOf(TPL[k].int) < 0 && ints.indexOf(TPL[k].int) >= 0 && (!TPL[k].when || TPL[k].when(M)) && !used[k] && !(TPL[k].grp && used['g:' + TPL[k].grp])));
      tpls.sort((a, b) => (TPL[b].core || 0) - (TPL[a].core || 0));
      const cand = prods.concat(tpls); if (!cand.length) cand.push(who === 'sci' && !used.m9 && !used['g:mesi'] ? 'm9' : who === 'reg' ? 'freq' : 'logo');
      const n = lv <= 1 ? 1 : who === 'sci' ? 2 : who === 'nasa' ? (lv >= 3 ? 3 : 2) : who === 'reg' ? (lv >= 3 ? 2 : 1) : (r() < 0.55 ? 2 : 1);
      let k = 0; cand.forEach(t => { if (k >= n) return; if (t !== 'logo' && t.indexOf('p:') < 0 && (used[t] || (TPL[t].grp && used['g:' + TPL[t].grp]))) return; push(who, t, k === 0 && who !== 'sci'); k++; }); });
    return out; }
  // ---------- quali tecnologie può usare questa missione: livello (uno prima se uno sponsor è specializzato), luogo, taglia, tipo di payload ----------
  const LOCN = M => { const dest = (M.sat && M.sat.dest) || 'leo'; if (landing(M)) return dest === 'mars' ? 'Superficie di Marte' : 'Superficie lunare'; return E.DEST[dest].loc; };
  const effLvl = (M, o) => { const tip = o.db ? o.db.tip : ''; const early = (M.stake || []).some(s => { const S = E.stk(s); return S && S.spec && S.spec === tip; }); return o.lvl - (early ? 1 : 0); };
  function techOK(M, id, ride) { const o = E.PARTS[id] || E.SOLAR[id] || E.ACC[id]; if (!o) return false; const lv = M.lvlNow || M.lvl || 1;
    if (effLvl(M, o) > lv) return false; if (o.luo && o.luo !== 'Tutti' && o.luo.split(';').map(s => s.trim()).indexOf(LOCN(M)) < 0) return false;
    if (ride && !E.fitsRide(o, ride)) return false; if (E.PARTS[id] && E.PARTS[id].cat === 'ray' && !payOK(M, id)) return false; return true; }
  const availCat = (M, c, ride) => Object.keys(E.PARTS).filter(id => E.PARTS[id].cat === c && techOK(M, id, ride));
  const availSol = (M, ride) => Object.keys(E.SOLAR).filter(k => techOK(M, k, ride) && E.solOK({ ride }, k));
  const rideOK = (M, k) => (M.lvlNow || M.lvl || 1) >= E.RIDES[k].lvl;
  function lvOK(M, k) { const o = E.LV[k], dest = (M.sat && M.sat.dest) || 'leo'; if (!!o.surf !== landing(M)) return false; return o.dest.indexOf(dest) >= 0 && (M.lvlNow || M.lvl || 1) >= o.lvl && (!o.pad || !!M.padOwned); }
  const MUST = ['avi', 'bat', 'com', 'adcs', 'ray'], OPT = ['nav', 'prop', 'pwr', 'rob', 'eol'];
  // un satellite a caso, con le regole di posizione rispettate: lo usano la verifica di fattibilità, il prezzo delle richieste e l'assistente
  function sampleSat(M, o, r, keep) { const R0 = E.RIDES[o.ride], occ = new Uint8Array(R0.cols * R0.rows), sols = availSol(M, o.ride); if (!sols.length) return null;
    const d = { ride: o.ride, lv: o.lv, dest: M.sat.dest || 'leo', sol: keep && keep.sol || sols[Math.floor(r() * sols.length)], placed: {}, heat: {}, acc: {}, stake: M.stake, planDv: Math.round(o.dv), landKg: o.landKg, skK: o.skK, eclH: o.eclH, skMs: o.skMs, alt: o.alt };
    const cats = MUST.slice(); OPT.forEach(c => { if ((c === 'prop' && o.dv > 1) || (keep && keep.placed[c]) || (!keep && r() < 0.35)) cats.push(c); });
    const pick = {}; for (const c of cats) { const ids = keep && keep.placed[c] ? [keep.placed[c].id] : availCat(M, c, o.ride); if (!ids.length) { if (MUST.indexOf(c) >= 0 || c === 'prop' && o.dv > 1) return null; continue; } const sid = ids.length > 1 ? ids.slice().sort((x, y) => (E.PARTS[x].m + (E.PARTS[x].propM || 0)) * 10 + E.PARTS[x].p - (E.PARTS[y].m + (E.PARTS[y].propM || 0)) * 10 - E.PARTS[y].p) : ids; pick[c] = sid[Math.floor(Math.pow(r(), 1.8) * sid.length)]; }
    for (const c of Object.keys(pick).sort((a, b) => E.nCells(pick[b], o.ride) - E.nCells(pick[a], o.ride) + (r() - 0.5) * 2)) { const id = pick[c], P = E.PARTS[id], opts = [];
      for (let rot = 0; rot < 4; rot++) { const S = E.shape(id, rot, o.ride); for (let y = 0; y < R0.rows; y++) for (let x = 0; x < R0.cols; x++) if (S.every(p => p[0] + x < R0.cols && p[1] + y < R0.rows && !occ[(p[1] + y) * R0.cols + p[0] + x])) {
        const cs = S.map(p => [p[0] + x, p[1] + y]); if (P.top && !cs.some(q => q[1] === 0)) continue; if (P.bottom && !cs.some(q => q[1] === R0.rows - 1)) continue;
        if (P.wall === 'any' && !cs.some(q => q[0] === 0 || q[0] === R0.cols - 1 || q[1] === 0)) continue; opts.push({ id, x, y, rot }); } }
      if (!opts.length) return null; const pl = opts[Math.floor(r() * opts.length)]; E.shape(id, pl.rot, o.ride).forEach(p => { occ[(p[1] + pl.y) * R0.cols + p[0] + pl.x] = 1; }); d.placed[c] = pl; }
    d.noProp = !d.placed.prop; E.layout(d).coldBad.forEach(c => { d.heat[c] = true; }); return d; }
  const baseOK = (d, b, o) => b.wet <= b.massLim && b.gen >= b.demand && b.wh > 0 && b.dod <= 1 && b.pt <= E.needPt(d) && !Object.keys(b.L.parts).some(c => !b.L.parts[c].ok) && (!(o.dv > 1) || b.fuel >= o.dv * 1.05 + 27 + E.skOf(d) * E.M.minMonths);
  // ---------- quanto costa dire di sì: il satellite più economico con e senza la richiesta ----------
  function estDv(M, ride, lv) { const d = M.sat, keep = { ride: d.ride, lv: d.lv, planDv: d.planDv, planOk: d.planOk, landC: d.landC, landKg: d.landKg, skK: d.skK, eclH: d.eclH, skMs: d.skMs, eclSrc: d.eclSrc, alt: d.alt, noProp: d.noProp }; d.ride = ride; d.lv = lv;
    let out = null; try { const p = O.plan(M); out = { dv: p.tot, landKg: d.landKg, skK: d.skK, eclH: d.eclH, skMs: d.skMs, alt: d.alt }; } catch (e) { out = { dv: E.dvNeed(d), landKg: 0, skK: 1, eclH: E.M.eclH, alt: 550 }; }
    Object.assign(d, keep); return out; }
  function rideOpts(M) { const out = []; Object.keys(E.LV).filter(k => lvOK(M, k) && (!M.lvFixed || k === M.sat.lv)).forEach(lv => E.LV[lv].fits.filter(k => rideOK(M, k) && (!M.rideFixed || k === M.sat.ride)).forEach(ride => out.push(Object.assign({ ride, lv }, estDv(M, ride, lv))))); return out; }
  // come cheapest, ma si ferma al primo satellite valido: serve solo a sapere se esiste
  function anySatRaw(M, ids, ms, salt) { if (typeof O === 'undefined') return null; const t0 = Date.now(), r = E.rng(((M.seed || 1) ^ (salt || 0x2b2b)) >>> 0);
    const reqs = ids.map(R).filter(Boolean), Mx = Object.assign({}, M, { reqs: ids.map(id => ({ id })), waived: [] }), mm = minMonths(Mx), design = reqs.filter(q => q.kind === 'design');
    const rides = rideOpts(M); if (!rides.length) return false;
    while (Date.now() - t0 < (ms || 250)) { const o = rides[Math.floor(r() * rides.length)], d = sampleSat(M, o, r); if (!d) continue; const b = E.budget(d);
      if (!baseOK(d, b, o)) continue; if (d.placed.prop && b.fuel < o.dv * 1.05 + 27 + E.skOf(d) * mm) continue; if (!d.placed.prop && mm > E.M.minMonths && false) continue;
      if (design.every(q => q.chk(d, b, Mx))) return d; }
    return null; }
  // ---------- memoizzazione ----------
  // Le ricerche di fattibilità sono campionamenti casuali a tempo (da 0,3 s fino a diversi secondi nei casi peggiori).
  // Stessa domanda sullo stesso stato di missione = stessa risposta, e subito: la prima risposta resta in cache.
  // La chiave contiene tutta la missione tranne i campi che startMeeting stesso scrive o che non influenzano la ricerca.
  const MEMO = new Map(), MEMO_MAX = 96;
  const MEMO_VOLATILE = { wit: 1, gen: 1, table: 1, queue: 1, log: 1, joy: 1, capC: 1, capM: 1, feasible: 1, meetPh: 1, stage: 1, choices: 1, created: 1, left: 1, tr: 1, result: 1, reqs: 1, waived: 1 };
  const dup = v => { if (v == null || typeof v !== 'object') return v; try { return structuredClone(v); } catch (e) { return JSON.parse(JSON.stringify(v)); } };
  function memoKey(tag, M, ids, ms, salt) { try { return tag + '|' + ms + '|' + salt + '|' + ids.join(',') + '|' + JSON.stringify(M, function (k, v) { return this === M && MEMO_VOLATILE[k] ? undefined : v; }); } catch (e) { return null; } }
  function memoized(tag, raw, M, ids, ms, salt) { const key = memoKey(tag, M, ids, ms, salt); if (key == null) return raw(M, ids, ms, salt);
    if (MEMO.has(key)) return dup(MEMO.get(key));
    const out = raw(M, ids, ms, salt); MEMO.set(key, dup(out)); if (MEMO.size > MEMO_MAX) MEMO.delete(MEMO.keys().next().value); return out; }
  /** Esiste un satellite valido per queste richieste? Risultato in cache per (stato missione, richieste, budget, salt). */
  function anySat(M, ids, ms, salt) { return memoized('a', anySatRaw, M, ids, ms, salt); }
  /** Il satellite valido più economico (cfr. cheapestRaw). Risultato in cache per (stato missione, richieste, budget, salt). */
  function cheapest(M, ids, ms, salt) { return memoized('c', cheapestRaw, M, ids, ms, salt); }
  /** Svuota la cache delle ricerche (test, o dopo un cambio dei dati di gioco). */
  function memoClear() { MEMO.clear(); }
  /** Pre-calcola a vuoto, su una copia della missione, il lavoro di startMeeting: quando il giocatore si siede le ricerche sono già in cache. */
  function prewarm(M, ph) { if (!M || M.tut) return false; try { startMeeting(dup(M), ph || '0'); return true; } catch (e) { return false; } }
  function cheapestRaw(M, ids, ms, salt) { if (typeof O === 'undefined') return null; const t0 = Date.now(), r = E.rng(((M.seed || 1) ^ (salt || 0x3141)) >>> 0);
    const reqs = ids.map(R).filter(Boolean), Mx = Object.assign({}, M, { reqs: ids.map(id => ({ id })), waived: [] }), mm = minMonths(Mx), design = reqs.filter(q => q.kind === 'design');
    const rides = rideOpts(M); if (!rides.length) return null; let best = null, n = 0;
    while (Date.now() - t0 < (ms || 250)) { n++; const o = rides[Math.floor(r() * rides.length)], d = sampleSat(M, o, r); if (!d) continue; const b = E.budget(d);
      if (!baseOK(d, b, o)) continue; if (d.placed.prop && b.fuel < o.dv * 1.05 + 27 + E.skOf(d) * mm) continue;
      if (!design.every(q => q.chk(d, b, Mx))) continue;
      if (!best || b.cost < best.cost - 0.5 || (Math.abs(b.cost - best.cost) < 0.5 && b.wet < best.wet)) best = { cost: b.cost, wet: b.wet, d, fuel: b.fuel }; }
    if (best) best.n = n; return best; }
  // Esiste almeno un satellite che soddisfa insieme tutte le richieste principali?
  function feasible(M, defs, budgetMs) { const design = defs.filter(x => x.kind === 'design'); if (!design.length) return true;
    const ids = defs.filter(x => x && x.id && R(x.id)).map(x => x.id); if (ids.length === defs.length) return !!cheapest(M, ids, budgetMs || 250, 0x7777);
    const t0 = Date.now(), r = E.rng(((M.seed || 1) ^ 0x7777) >>> 0), rides = rideOpts(M); if (!rides.length) return false;
    while (Date.now() - t0 < (budgetMs || 250)) { const o = rides[Math.floor(r() * rides.length)], d = sampleSat(M, o, r); if (!d) continue; const b = E.budget(d); if (baseOK(d, b, o) && design.every(q => q.chk(d, b, M))) return true; }
    return false; }
  const PB = {};
  // Il prezzo di una richiesta: differenza di costo e massa, pezzi obbligati, conflitti con quello che hai già accettato
  function priceOf(M, id, ms) { const r = R(id), acc = M.reqs.filter(x => M.waived.indexOf(x.id) < 0).map(x => x.id);
    if (r.kind === 'tests') return { kind: 'tests', tests: r.tests };
    const key = M.id + '|' + acc.join(',') + '|' + M.stake.join(','), base = PB[key] || (PB[key] = cheapest(M, acc, ms || 250) || (M.wit && satOK(M, M.wit, acc) ? { cost: E.budget(M.wit).cost, wet: E.budget(M.wit).wet, d: M.wit } : null));
    if (!base) return { kind: r.kind, ok: false, noBase: true };
    const Mx = Object.assign({}, M, { reqs: acc.concat([id]).map(x => ({ id: x })), waived: [] }), b0 = E.budget(base.d);
    if (r.kind === 'design' && r.chk(base.d, b0, Mx)) return { kind: r.kind, ok: true, free: true, dc: 0, dm: 0, forced: [] };
    if (r.kind === 'months' && (base.d.noProp || b0.fuel >= base.d.planDv * 1.05 + 27 + E.skOf(base.d) * minMonths(Mx))) return { kind: r.kind, ok: true, free: true, dc: 0, dm: 0, forced: [] };
    const w = cheapest(M, acc.concat([id]), ms || 300, 0x2718) || (M.wit && satOK(M, M.wit, acc.concat([id])) ? { cost: E.budget(M.wit).cost, wet: E.budget(M.wit).wet, d: M.wit } : null);
    if (!w) { const conf = acc.filter(x => { const q = R(x); return q && (q.kind === 'design' || q.kind === 'months'); }).slice(0, 6).filter(x => !!cheapest(M, acc.filter(y => y !== x).concat([id]), 90, 0x1618));
      return { kind: r.kind, ok: false, conflicts: conf }; }
    const forced = []; Object.keys(w.d.placed).forEach(c => { const a = w.d.placed[c].id, b = base.d.placed[c] && base.d.placed[c].id, A = E.PARTS[a], B = b && E.PARTS[b]; if (a !== b && (!B || A.c > B.c || A.m + (A.propM || 0) > B.m + (B.propM || 0))) forced.push(A.n); });
    if (w.d.ride !== base.d.ride) forced.unshift(E.RIDES[w.d.ride].n); if (w.d.sol !== base.d.sol) forced.push(E.SOLAR[w.d.sol].n);
    if (w.d.lv !== base.d.lv) forced.unshift(E.LV[w.d.lv].n);
    return { kind: r.kind, ok: true, dc: Math.max(0, Math.round(w.cost - base.cost)), dm: Math.max(0, Math.round((w.wet - base.wet) * 10) / 10), forced: forced.slice(0, 4), base: base.cost }; }

  // ---------- catalogo degli sponsor: si reclutano dall'Ufficio partnership, uno per livello ----------
  const SPONSORS = [
    { id: 'asm', n: 'Agenzia Spaziale Mediterranea', k: 'Agenzia', sec: 'Istituzioni', fund: 600, gives: [], p: ['Dott.ssa Ferri', 'Program manager', '#3B6FD8'], req: { t: 'Affidabilità e costi sotto controllo' } },
    { id: 'bor', n: 'Istituto Borealis', k: 'Ricerca', sec: 'Ricerca', fund: 400, gives: [], p: ['Prof. Lind', 'Radiobiologo', '#22A87A'], req: { t: 'Scienza di qualità' } },
    { id: 'kes', n: 'Kestrel Propulsion', k: 'Start-up', sec: 'Propulsione', fund: 250, gives: [], p: ['Marco Vitale', 'Fondatore', '#D9478F'], req: { t: 'Prestazioni e leggerezza' } },
    { id: 'hel', n: 'Helios Arrays', k: 'PMI', sec: 'Energia', fund: 350, gives: [], p: ['Sara Okafor', 'Vendite', '#D99A12'], req: { t: 'Margini di energia' } },
    { id: 'orb', n: 'Orbita Relay', k: 'Operatore', sec: 'Comunicazioni', fund: 450, gives: [], p: ['Jonas Berg', 'Operazioni', '#8A55D0'], req: { t: 'Comunicazioni veloci' } },
    { id: 'ion', n: 'Ionica Space', k: 'Start-up', sec: 'Propulsione', fund: 300, gives: [], p: ['Dott. Ferraris', 'CTO', '#5B6CFF'], req: { say: 'Provate la nostra propulsione ionica: Isp 1500 s.', t: 'Propulsione ionica a bordo', kind: 'design', chk: d => has(d, 'prop', ['P5']) } },
    { id: 'sol', n: 'Solidea Energy', k: 'PMI', sec: 'Batterie', fund: 280, gives: [], p: ['Ing. Novak', 'Prodotto', '#18A0A0'], req: { say: 'Le nostre batterie allo stato solido non temono il freddo. Montatele.', t: 'Batteria allo stato solido', kind: 'design', chk: d => has(d, 'bat', ['B5']) } },
    { id: 'tav', n: 'Taurinia Avionics', k: 'PMI', sec: 'Avionica', fund: 320, gives: [], p: ['Ing. Bertola', 'Fondatrice', '#7A4FD6'], req: { say: 'Il nostro computer FPGA è fatto a Torino. Vogliamo vederlo volare.', t: 'Computer FPGA tollerante', kind: 'design', chk: d => has(d, 'avi', ['O4']) } },
    { id: 'gyr', n: 'Gyrolab', k: 'Start-up', sec: 'Assetto', fund: 260, gives: [], p: ['Dott. Kaur', 'Ricerca', '#C2410C'], req: { say: 'Ruote compatte con magnetotorquer: stanno in una sola unità.', t: 'Assetto Gyrolab', kind: 'design', chk: d => has(d, 'adcs', ['A3']) } },
    { id: 'pho', n: 'Photon Link', k: 'Start-up', sec: 'Comunicazioni', fund: 340, gives: [], p: ['Ing. Lemaire', 'CEO', '#DB2777'], req: { say: 'Terminale laser: il 40% di dati in più. Serve un puntamento fine.', t: 'Terminale ottico laser', kind: 'design', chk: d => has(d, 'com', ['C4']) } },
    { id: 'srl', n: 'SolarRoll', k: 'PMI', sec: 'Energia', fund: 300, gives: [], p: ['Sig.ra Ortiz', 'Vendite', '#CA8A04'], req: { say: 'Ali che si srotolano come un tappeto: 90 W. Usatele.', t: 'Ali roll-out SolarRoll', kind: 'design', chk: d => d.sol === 'S4' } },
    { id: 'asa', n: 'Agenzia Spaziale Alpina', k: 'Agenzia', sec: 'Istituzioni', fund: 700, gives: [], p: ['Dott. Rossetti', 'Direttore programmi', '#1D4ED8'], req: { say: 'Finanziamo solo missioni lunghe: almeno 12 mesi di dati.', t: 'Durata ≥ 12 mesi', kind: 'months', months: 12 } },
    { id: 'fts', n: 'Fondazione Torino Spazio', k: 'Fondazione', sec: 'Istituzioni', fund: 350, gives: [], p: ['Dott.ssa Gallo', 'Segretaria generale', '#0F766E'], req: { say: 'Prima del lancio vogliamo vibrazione e termovuoto superate.', t: 'Prove di vibrazione e termovuoto', kind: 'tests', tests: ['vib', 'tvac'] } },
    { id: 'pol', n: 'Politecnico Subalpino', k: 'Università', sec: 'Ricerca', fund: 200, gives: [], p: ['Prof.ssa Conte', 'Docente', '#B91C1C'], req: { say: 'I nostri studenti vogliono un 30% di margine sulla potenza.', t: 'Margine di potenza ≥ 30%', kind: 'design', chk: (d, b) => b.gen >= b.demand * 1.3 } },
    { id: 'mrs', n: 'Ares Exploration Fund', k: 'Fondo', sec: 'Investitori', fund: 650, gives: [], p: ['Sig. Hale', 'Partner', '#9A3412'], req: { say: 'Investiamo solo su Marte.', t: 'Destinazione Marte', kind: 'design', chk: d => d.dest === 'mars' } },
    { id: 'ven', n: 'Cytherea Institute', k: 'Ricerca', sec: 'Ricerca', fund: 500, gives: [], p: ['Dott.ssa Ivanova', 'Planetologa', '#A16207'], req: { say: 'Venere è il nostro pianeta. Portateci lì.', t: 'Destinazione Venere', kind: 'design', chk: d => d.dest === 'venus' } },
    { id: 'eco', n: 'CleanOrbit', k: 'Operatore', sec: 'Detriti', fund: 300, gives: [], p: ['Ing. Moreau', 'Sostenibilità', '#15803D'], req: { say: 'Zero detriti: vogliamo il 30% di ΔV di riserva oltre il necessario.', t: 'ΔV con 30% di margine', kind: 'design', chk: (d, b, M) => b.fuel >= (transferNeed(d) + 27 + E.skOf(d) * minMonths(M)) * 1.3 } },
    { id: 'ins', n: 'Assicurazioni Orbitali', k: 'Assicurazione', sec: 'Finanza', fund: 400, gives: [], p: ['Dott. Villa', 'Risk manager', '#475569'], req: { say: 'Assicuriamo solo satelliti con scorta di computer, radio e ruote.', t: 'Ridondanza su computer, radio e assetto', kind: 'design', chk: d => ['avi', 'com', 'adcs'].every(c => d.placed[c] && E.PARTS[d.placed[c].id].spare) } },
    { id: 'lgt', n: 'Lightcraft Ventures', k: 'Investitore', sec: 'Investitori', fund: 550, gives: [], p: ['Sig.ra Park', 'Investitrice', '#7C3AED'], req: { say: 'Leggeri vuol dire economici: sotto i 25 kg.', t: 'Massa al lancio ≤ 25 kg', kind: 'design', chk: (d, b) => b.wet <= 25 } },
    { id: 'edu', n: 'Scuole in Orbita', k: 'Associazione', sec: 'Educazione', fund: 120, gives: [], p: ['Maestra Elena', 'Coordinatrice', '#EA580C'], req: { say: 'Le classi seguiranno la missione per un anno scolastico: 9 mesi.', t: 'Durata ≥ 9 mesi', kind: 'months', months: 9 } },
    { id: 'geo', n: 'GeoScan Earth', k: 'Operatore', sec: 'Osservazione', fund: 380, gives: [], p: ['Ing. Sato K.', 'Operazioni', '#0369A1'], req: { say: 'Ci servono dati dall’orbita terrestre bassa.', t: 'Destinazione orbita terrestre', kind: 'design', chk: d => d.dest === 'leo' } },
    { id: 'mag', n: 'Magnetica Labs', k: 'PMI', sec: 'Test', fund: 220, gives: [], p: ['Ing. Russo', 'Laboratorio', '#BE185D'], req: { say: 'Pesate il satellite: prova di massa e baricentro.', t: 'Prova di massa superata', kind: 'tests', tests: ['mass'] } },
    { id: 'shk', n: 'Vibra Test Center', k: 'PMI', sec: 'Test', fund: 240, gives: [], p: ['Ing. Costa', 'Direttore tecnico', '#4D7C0F'], req: { say: 'Vibrazione e shock: il razzo non perdona.', t: 'Prove di vibrazione e shock', kind: 'tests', tests: ['vib', 'shock'] } },
    { id: 'tlm', n: 'DataRelay Europa', k: 'Operatore', sec: 'Comunicazioni', fund: 360, gives: [], p: ['Sig. Weber', 'Rete di terra', '#0E7490'], req: { say: 'Vogliamo un collegamento veloce: banda S o laser.', t: 'Collegamento ad alta velocità', kind: 'design', chk: d => !!d.placed.com && (E.PARTS[d.placed.com.id].bonus || 1) >= 1.15 } },
    { id: 'pan', n: 'Pannonia Solar', k: 'PMI', sec: 'Energia', fund: 260, gives: [], p: ['Ing. Horváth', 'Ricerca', '#B45309'], req: { say: 'Almeno 50 W dai pannelli, per provare i nostri sensori.', t: 'Generazione ≥ 50 W', kind: 'design', chk: (d, b) => b.gen >= 50 } },
    { id: 'low', n: 'Microfondo Spazio', k: 'Investitore', sec: 'Investitori', fund: 300, gives: [], p: ['Sig. Greco', 'Analista', '#334155'], req: { say: 'Tenete il costo del satellite basso.', t: 'Costo contenuto', kind: 'design', chk: (d, b) => b.cost <= 1200 } },
    { id: 'grp', n: 'Grappler Robotics', k: 'Start-up', sec: 'Robotica', fund: 380, gives: [], p: ['Ing. Okoye', 'CTO', '#0F766E'], req: { t: 'Rete di cattura Grappler' } },
    { id: 'lum', n: 'Lumen Optics', k: 'PMI', sec: 'Ottica', fund: 360, gives: [], p: ['Dott.ssa Sund', 'Ottica', '#4338CA'], req: { t: 'Ottica dispiegabile Lumen' } },
    { id: 'pix', n: 'PixelOrbit', k: 'Start-up', sec: 'Osservazione', fund: 330, gives: [], p: ['Sig. Mehta', 'Prodotto', '#BE123C'], req: { t: 'Camera iperspettrale' } },
    { id: 'mus', n: 'Museo dello Spazio', k: 'Museo', sec: 'Educazione', fund: 150, gives: [], p: ['Dott.ssa Neri', 'Curatrice', '#6D28D9'], req: { say: 'Mettete il nostro logo sulla struttura, e raccontateci la missione.', t: 'Logo del museo a bordo', kind: 'design', chk: () => true } }
  ];
  const SPEC = { ion: 'Propulsione', sol: 'Batteria', tav: 'Computer', gyr: 'Assetto e navigazione', pho: 'Radio e comunicazioni', srl: 'Pannelli e generatori', grp: 'Robotica', lum: 'Payload', pix: 'Payload',
    asm: 'Computer', bor: 'Payload', kes: 'Propulsione', hel: 'Pannelli e generatori', orb: 'Radio e comunicazioni' };
  function addSponsor(id) { const S = SPONSORS.find(x => x.id === id); if (!S || E.stk(id)) return; const fund = Math.round(S.fund * 0.35 / 10) * 10;
    E.STAKE.push({ id, n: S.n, k: S.k, fund, rep: 1, gives: [], spec: SPEC[id] || '', want: S.req.t, quest: 'Missione riuscita', bonus: Math.round(fund / 4), sponsor: 1 });
    PEOPLE[id] = { n: S.p[0], org: S.n, role: S.p[1], col: S.p[2], stake: id };
  }
  function cast(M, ph) { const lv = M.lvl || 1; return ph === '0' ? M.stake.concat(['sci', 'reg']) : ['sys', 'pwr', 'thr', 'prp', 'pa'].filter(w => lv >= 3 || (lv === 2 ? w !== 'prp' : (w === 'sys' || w === 'pa'))); }

  function newMission(name, id) {
    return { id, name, phase: '0', stage: 'partners', stake: [], sat: E.fresh(), type: 'sci', fd: { burns: [] }, joy: {}, left: [], reqs: [], queue: [], waived: [],
      funded: 0, paid: 0, machinesUsed: {}, tests: {}, tr: {}, defects: null, stiff: false, seed: (Math.random() * 2147483647) | 0,
      buildEnd: 0, launchAt: 0, duration: 12, result: null, created: Date.now(), log: [], interactive: true, choices: {}, softs: [] };
  }
  function minMonths(M) { return M.reqs.reduce((a, x) => { const r = R(x.id); return r.kind === 'months' && M.waived.indexOf(x.id) < 0 ? Math.max(a, r.months) : a; }, E.M.minMonths); }
  function startMeeting(M, ph) { M.stage = 'meeting'; M.meetPh = ph; M.table = cast(M, ph);
    cast(M, ph).forEach(w => { if (M.joy[w] == null) M.joy[w] = 60; });
    if (ph === '0' && !M.capC) { const b = cheapest(M, [], 300); M.capC = b ? Math.ceil(b.cost * 1.15 / 10) * 10 : 1400; M.capM = b ? Math.round(b.wet * 1.12 * 2) / 2 : 26; }
    M.gen = M.gen || {}; const g = generate(M, ph); M.gen[ph] = g; register(M);
    if (!M.tut) ensureFeasible(M, g, ph); register(M); M.feasible = true;
    M.queue = g.filter(x => x.core).concat(g.filter(x => !x.core)).map(x => x.id); }
  // Accetta o rifiuta. Ritorna chi lascia la missione, se qualcuno se ne va
  // una promessa rotta (deroga) pesa più di un no detto subito
  const JOY = { yes: 10, soft: 8, no: 25, noCore: 40, waive: 50 };
  // Finestra di lancio rilassata (rifiuto di quella chiesta dagli stakeholder): UNICO posto dei due valori.
  // joy = punti di soddisfazione persi da ogni stakeholder (stessa scala di JOY.no); pay = quota delle rate future che non viene più versata.
  const LW = { joy: JOY.no, pay: 0.15 };
  function answer(M, id, yes, soft) { const r = R(id); M.queue = M.queue.filter(q => q !== id);
    if (yes && soft) { M.softs = M.softs || []; M.softs.push(id); register(M); M.joy[r.who] = Math.max(0, M.joy[r.who] - JOY.soft); }
    if (yes) { const n = M.reqs.filter(x => x.kind === (r.ph === '0' ? 'MIS' : 'SYS')).length + 1;
      M.reqs.push({ id, kind: r.ph === '0' ? 'MIS' : 'SYS', code: (r.ph === '0' ? 'MIS-' : 'SYS-') + String(n).padStart(2, '0') });
      if (!soft) M.joy[r.who] = Math.min(100, M.joy[r.who] + JOY.yes); return null; }
    if (r.rule) return null;
    M.joy[r.who] = Math.max(0, M.joy[r.who] - (r.core ? JOY.noCore : JOY.no));
    return M.joy[r.who] <= 0 ? leave(M, r.who) : null; }
  function leave(M, who) { const P = PEOPLE[who]; M.joy[who] = 0;
    M.queue = M.queue.filter(q => R(q).who !== who); M.reqs = M.reqs.filter(x => R(x.id).who !== who);
    if (P.stake) { M.stake = M.stake.filter(s => s !== who); M.left.push(who); E.prune(M.sat); M.sat.stake = M.stake; return { who, fund: E.stk(who).fund, staff: false }; }
    M.left.push(who); return { who, fund: 0, staff: true }; }
  function waive(M, id) { const r = R(id); if (r.rule) return null; if (M.waived.indexOf(id) < 0) M.waived.push(id); M.joy[r.who] = Math.max(0, (M.joy[r.who] == null ? 60 : M.joy[r.who]) - JOY.waive);
    return M.joy[r.who] <= 0 ? leave(M, r.who) : null; }
  // Stato dei requisiti accettati contro il progetto attuale
  function status(M, d, cash) { const pl = typeof O !== 'undefined' ? O.plan(M) : null, b = E.budget(d), out = [];
    const base = E.checks(d).list.filter(x => ['parts', 'place', 'mass', 'pow', 'bat', 'point'].indexOf(x.k) >= 0);
    base.forEach(x => out.push({ code: 'BASE', t: x.t, ok: x.ok, base: 1 }));
    if (cash != null) out.push({ code: 'BASE', t: 'Costo entro la cassa', ok: b.cost <= cash, base: 1 });
    if (pl) out.push({ code: 'BASE', t: pl.ok ? 'Piano di volo fino all’orbita obiettivo' : pl.bad ? pl.bad + ' (piano di volo)' : 'Piano di volo verso l’orbita obiettivo (Centro di dinamica del volo)', ok: pl.ok, base: 1, fd: 1 });
    M.reqs.forEach(x => { const r = R(x.id); let ok = true;
      if (r.kind === 'design') ok = !!r.chk(d, b, M); if (r.kind === 'tests') ok = r.tests.every(t => M.tests[t]); if (r.kind === 'months') ok = true;
      out.push({ code: x.code, id: x.id, t: r.t, who: r.who, ok: ok || M.waived.indexOf(x.id) >= 0, waived: M.waived.indexOf(x.id) >= 0, kind: r.kind }); });
    return { list: out, b }; }

  // Difetti nascosti nel satellite integrato: li trova solo la prova giusta
  // staff scontento (soddisfazione sotto 50, o andato via): lavora controvoglia e non ti segnala i rischi del suo sottosistema
  const mad = (M, w) => M.joy && M.joy[w] != null && (M.joy[w] < 50 || M.left.indexOf(w) >= 0);
  const OWN = { eol: 'sys', ecl: 'pwr', fuel: 'prp', cog: 'prp', k2: 'prp', top: 'sys', spe: 'sys', radio: 'sys', rw: 'sys', far: 'sys', 't-tvac': 'thr', 't-func': 'pa', 't-vib': 'pa', 't-shock': 'pa', 't-emc': 'pa', 't-mass': 'pa' };
  const TMAP = { funzionale: 'func', vibrazione: 'vib', termovuoto: 'tvac', EMC: 'emc', shock: 'shock', massa: 'mass' }, TRLP = { 7: 0.10, 8: 0.05, 9: 0.02 };
  function defectP(M, t) { const d = M.sat, k = (M.dk || 1) * (M.rnd ? 0.5 : 1) * (mad(M, 'pa') ? 1.5 : 1) * (t === 'tvac' && mad(M, 'thr') ? 1.4 : 1);
    let p = { func: 0.06, vib: 0.05, tvac: 0.05, shock: 0.12, emc: 0.06, mass: 0.12 }[t];
    const parts = Object.keys(d.placed).map(c => E.PARTS[d.placed[c].id]).concat([E.SOLAR[d.sol]]).concat(Object.keys(d.acc || {}).filter(x => d.acc[x]).map(x => E.ACC[x])).filter(Boolean);
    parts.forEach(o => { if (o.db && TMAP[o.db.test] === t) p += TRLP[o.trl] || 0.02; });
    if (t === 'func' && d.acc && d.acc['NASA-33948']) p *= 0.7; if (t === 'func' && d.acc && d.acc['NASA-11771']) p *= 0.85;
    return Math.min(0.9, p * k); }
  function defects(M) { const r = E.rng((M.seed ^ 0x5bd1e995) >>> 0), out = {}; TESTS.forEach(t => { out[t] = r() < defectP(M, t); }); return out; }

  // ---------- assistente di integrazione (solo nella prima missione): dispone i pezzi, o li sceglie ----------
  function autoDesign(M, mode, cash, ms) { const d0 = M.sat, r = E.rng((((M.seed || 1) ^ Math.imul((M.adN = (M.adN || 0) + 1), 2654435761)) >>> 0) || 1), t0 = Date.now();
    const reqs = M.reqs.filter(x => M.waived.indexOf(x.id) < 0).map(x => R(x.id)).filter(q => q && q.kind === 'design');
    const o = { ride: d0.ride, lv: d0.lv, dv: d0.planDv || 0, landKg: d0.landKg, skK: d0.skK, eclH: d0.eclH, skMs: d0.skMs, alt: d0.alt };
    const score = d => { const b = E.budget(d), base = E.checks(d).list.filter(x => ['parts', 'place', 'mass', 'pow', 'bat', 'point'].indexOf(x.k) >= 0 && !x.ok).length, rq = reqs.filter(q => !q.chk(d, b, M)).length;
      return { bad: base + rq + (cash != null && b.cost > cash ? 1 : 0) + (o.dv > 1 && !d.placed.prop ? 1 : 0), cost: b.cost }; };
    let best = null;
    while (Date.now() - t0 < (ms || 500)) { const d = sampleSat(M, o, r, mode === 'arrange' ? d0 : null); if (!d) continue; if (mode === 'arrange') d.acc = Object.assign({}, d0.acc);
      const sc = score(d); if (!best || sc.bad < best.sc.bad || (sc.bad === best.sc.bad && sc.cost < best.sc.cost)) best = { d, sc }; if (best.sc.bad === 0 && Date.now() - t0 > (ms || 500) * 0.4) break; }
    return best; }

  // ---------- registro dei rischi: probabilità × impatto, da 1 a 3 ----------
  const RMAP = {
    spe: { p: x => x.lvl === 'hi' ? 3 : x.lvl === 'mid' ? 2 : 1, i: (d, P) => P('avi').spare ? 2 : 3, mit: 'Computer doppio o rad-hard; oppure safe mode durante le tempeste' },
    rw: { p: () => 2, i: () => 2, mit: 'Un assetto con scorta, oppure i propulsori come riserva' },
    eol: { p: () => 3, i: () => 2, mit: 'Orbita sotto i 600 km, una vela di rientro o la propulsione' },
    radio: { p: () => 2, i: () => 3, mit: 'Radio con trasmettitore di riserva' },
    ecl: { p: () => 3, i: () => 2, mit: 'Batteria più grande, riscaldatori o un accessorio termico' },
    met: { p: () => 1, i: () => 2, mit: 'Ridondanze e celle libere assorbono il colpo' },
    mascon: { p: () => 3, i: () => 1, mit: 'Tieni ΔV di riserva per le correzioni' },
    fuel: { p: () => 3, i: () => 3, mit: 'Propulsione più efficiente o missione più corta' },
    
    cog: { p: () => 3, i: () => 2, mit: 'Sposta i pezzi: baricentro sulla linea dell’ugello' },
    top: { p: () => 2, i: () => 3, mit: 'Pezzi pesanti in basso; la vibrazione lo scopre e si rinforza' }
  };
  const TI = { func: 1, vib: 2, tvac: 2, shock: 2, emc: 1, mass: 1 };
  function risks(M, owned) { const d = M.sat, P = c => d.placed[c] ? E.PARTS[d.placed[c].id] : {}, out = [], ok = [];
    E.risks(d).forEach(x => { const m = RMAP[x.id]; if (!m) return; const row = { id: x.id, t: x.t, s: x.s, mit: m.mit, art: x.art };
      if (x.lvl === 'ok') ok.push(row); else { row.p = m.p(x); row.i = m.i(d, P); if (x.id === 'spe' && M.reqs.some(q => R(q.id).storm)) row.p = Math.min(3, row.p + 1); out.push(row); } });
    if (M.phase === 'D' || M.phase === 'C') TESTS.forEach(t => { const m = MACH[t], tr = M.tr && M.tr[t], done = M.tests && M.tests[t];
      const row = { id: 't-' + t, t: 'Difetto nascosto (' + m.short + ')', s: 'se vola: ' + m.fly, mit: 'Prova ' + m.tn + ' con ' + m.n + (owned && owned.indexOf(t) < 0 ? ' (da installare)' : ''), test: t };
      if (done) { row.s = 'prova superata'; ok.push(row); return; }
      if (tr && tr.res === 'waived') { row.p = 3; row.i = TI[t]; row.s = 'difetto trovato e lasciato in deroga: ' + m.fly; row.waived = 1; out.push(row); return; }
      row.p = defectP(M, t) >= 0.25 ? 2 : 1; row.i = TI[t]; out.push(row); });
    if (typeof O !== 'undefined') { const pl = O.plan(M); if (pl.land) out.push({ id: 'land', t: pl.land.n, s: Math.round(pl.land.risk * 100) + '% di perdere tutto nella discesa', mit: 'Prove di vibrazione e shock riducono le sorprese; la scienza sul suolo vale il rischio', p: pl.land.risk > 0.1 ? 2 : 1, i: 3 }); if (pl.atm && pl.atm.p > 0.005 && pl.atm.worst) out.push({ id: 'atm', t: 'Pericentro nell’atmosfera', s: Math.round(pl.atm.p * 100) + '% che l’attrito faccia rientrare il satellite prima del tempo (pericentro a ' + Math.round(pl.atm.worst.pe) + ' km)', mit: 'Nel Centro di dinamica del volo riduci l’eccentricità: il pericentro deve stare sopra l’atmosfera', p: pl.atm.p > 0.3 ? 3 : pl.atm.p > 0.1 ? 2 : 1, i: 3 }); [pl.sc, pl.strn].forEach(x => { if (x && x.risk) out.push({ id: 'st-' + x.k, t: x.n, s: Math.round(x.risk * 100) + '% di perdere il satellite', mit: 'Scegli una strategia propulsiva nel Centro di dinamica del volo', p: x.risk > 0.1 ? 2 : 1, i: 3 }); }); }
    const hid = {}, vis = out.filter(x => { const w = OWN[x.id] || (x.id.indexOf('st-') === 0 ? 'prp' : ''); if (w && mad(M, w)) { hid[w] = (hid[w] || 0) + 1; return false; } return true; });
    const hidden = Object.keys(hid).map(w => ({ who: w, n: hid[w] }));
    vis.sort((a, b) => b.p * b.i - a.p * a.i || b.i - a.i); return { list: vis, ok, hidden }; }

  // ---------- volo automatico, ricostruito dal seme: niente da salvare oltre al seme ----------
  function choose(id, f, M, rem) { const ev = E.EV[id], opts = ev.opts(f).filter(o => !o.off), k = opts.map(o => o.k), keep = 27 + E.M.sk * rem;
    if (k.indexOf('ok') >= 0) return 'ok';
    if (id === 'spe') return M.reqs.some(x => R(x.id).storm) ? 'a' : 'b';
    if (id === 'rw') return k.indexOf('a') >= 0 ? 'a' : 'b';
    if (id === 'radio') return 'b';
    if (id === 'ecl') return 'a';
    if (id === 'mascon') return f.fuel >= 15 + keep ? 'a' : 'b';
    if (id === 'partner') return f.fuel >= 10 + keep ? 'a' : 'b';
    return k[0]; }
  // Il volo si ricostruisce dal seme e dalle scelte del giocatore (M.choices[mese]).
  // Se un evento ha più opzioni e il giocatore non ha ancora deciso, il volo si ferma lì: pending.
  // auto = true: le scelte mancanti le prende l'autopilota (serve per i "e se...").
  const EVC = { spe: 'part:avi', rw: 'part:adcs', radio: 'part:com', ecl: 'part:bat', met: 'random', mascon: 'random', partner: 'random' };
  function evLabel(id, f, d) { return id === 'mascon' && d.dest && d.dest !== 'moon' ? 'Perturbazioni orbitali' : id === 'ecl' ? 'Eclisse di ' + f.eclM + ' minuti' : E.EV[id].t; }
  function flight(M, upto, auto) {
    const d = M.sat, pl = typeof O !== 'undefined' ? O.plan(M) : null, r = E.rng(M.seed), f = E.newFlight(d, M.tests, M.defects, M.stiff, r), log = [], at = (m, t, tone, c) => log.push({ m, t, tone: tone || '', c: c || '' });
    const df = M.defects || {}, lat = t => !!df[t] && !(M.tests && M.tests[t]), ch = M.choices || {};
    if (M.boost) f.bonus *= M.boost; if (M.dataK != null) f.bonus *= M.dataK; f.sig = M.sig || 0;
    E.launch(f).forEach(l => at(0, l.t, l.tone, l.c)); if (!f.alive) return { f, log };
    if (lat('shock')) { if (r() < 0.2) { f.alive = false; f.ended = true; f.cause = 'Separazione storta: il satellite esce dal razzo ruotando troppo veloce e il gas freddo non basta a fermarlo.'; at(0, f.cause, 'bad', 'test:shock'); return { f, log }; }
      f.gas -= 40; f.fuel -= 20; at(0, 'Separazione storta: il satellite esce dal razzo ruotando. −40% gas, −20 m/s.', 'bad', 'test:shock'); }
    if (f.gas) f.gas -= 22; at(0, 'Detumbling completato' + (d.placed.adcs && /magnetic/i.test(E.PARTS[d.placed.adcs.id].n) ? ' con le bobine magnetiche.' : '.'), 'good');
    if (lat('emc')) { if (f.spare.com > 0) { f.spare.com--; at(0, 'Interferenze sulla radio principale: si passa subito alla riserva.', 'bad', 'test:emc'); } else { f.mult *= 0.8; at(0, 'Interferenze sulla radio: il collegamento perde il 20%.', 'bad', 'test:emc'); } }
    if (lat('mass')) { f.fuel *= 0.94; at(0, 'Il baricentro reale è fuori asse: ogni accensione spreca il 6% di ΔV.', 'bad', 'test:mass'); }
    E.commission(f).forEach(l => at(0, l.t, l.tone, l.c)); if (!f.alive) return { f, log };
    const D = E.DEST[d.dest || 'leo']; f.sciK = (f.sciK || 1) * ((typeof O !== 'undefined' && O.TYPES[M.type || 'sci']) ? O.TYPES[M.type || 'sci'].sciK : 1);
    if (pl && pl.sc && pl.sc.risk && r() < pl.sc.risk) { f.alive = false; f.ended = true; f.cause = 'Aerocattura fallita: il satellite è entrato troppo in basso nell’atmosfera.'; at(0, f.cause, 'bad', 'strat'); return { f, log }; }
    if (pl && pl.strn && pl.strn.risk && r() < pl.strn.risk) { f.alive = false; f.ended = true; f.cause = 'Aerofrenata: un passaggio troppo basso ha surriscaldato il satellite.'; at(0, f.cause, 'bad', 'strat'); return { f, log }; }
    if (pl && pl.atm && pl.atm.p > 0 && r() < pl.atm.p) { const w = pl.atm.worst; f.alive = false; f.ended = true; f.cause = 'Il pericentro di «' + w.n + '» scende a ' + Math.round(w.pe) + ' km, dentro l’atmosfera: l’attrito ha frenato il satellite, che è rientrato e bruciato.'; at(0, f.cause, 'bad', 'atm'); return { f, log }; }
    if (pl && pl.strn && pl.strn.delay) { f.ionDelay = pl.strn.delay; at(0, pl.strn.n + ' in corso: la scienza comincia al mese ' + (pl.strn.delay + 1) + '.', '', 'strat'); }
    if (pl) { f.fuel -= transferNeed(d); const nb = pl.ob ? pl.si : pl.orbits.length - 1; at(0, (nb ? nb + (nb > 1 ? ' manovre' : ' manovra') + ' del piano di volo eseguite' + (pl.ini.cap ? ' dopo la frenata di cattura' : '') + ': ' : 'Nessuna manovra: ') + (pl.land ? 'orbita di parcheggio ' : 'orbita di lavoro ') + O.fmt(pl.final) + '.', 'good');
      if (!pl.ok) { f.mult *= 0.5; at(0, 'L’orbita finale non è quella obiettivo: metà della scienza va persa.', 'bad', 'plan'); }
      if (pl.work && pl.work.slider) { f.sciK *= pl.work.q; if (Math.abs(pl.work.q - 1) > 0.04) at(0, 'Quota di lavoro: resa scientifica ' + Math.round(pl.work.q * 100) + '%.', pl.work.q < 1 ? 'bad' : 'good', 'work'); } }
    else if (!f.direct) { f.fuel -= transferNeed(d); at(0, 'Trasferimento completato: ' + D.orbit + '.', 'good'); } else at(0, 'Il lanciatore ti lascia direttamente in ' + D.orbit + '.', 'good');
    if (pl && pl.land) { if (r() < pl.land.risk) { f.alive = false; f.ended = true; f.cause = pl.land.n + ': il lander commerciale si è schiantato.'; at(0, f.cause, 'bad', 'land'); return { f, log }; }
      f.surface = true; f.sk = 0.3; f.sciK = (f.sciK || 1) * pl.land.sciK; at(0, pl.land.n + ': atterraggio riuscito. Il payload lavora sul suolo.', 'good'); }
    if (f.weak) at(0, 'Da così lontano la radio arriva debole: metà dei dati si perde.', 'bad', 'part:com');
    f.pe = E.M.peOp; f.ap = E.M.apOp; f.reached = true;
    const end = Math.min(upto, M.duration); f.endMonth = M.duration + 1;
    while (f.alive && f.month < end) {
      if (!f.noProp && f.fuel - f.sk < 27) { f.early = true; f.endMonth = f.month + 1; at(f.month, 'Riserva di ΔV al limite: il controllo missione chiude al mese ' + f.month + ' per garantire il disposal.', 'bad', 'dur'); break; }
      let g = E.month(f); if (f.ionDelay && f.month <= f.ionDelay) { f.sci -= g; g = 0; } at(f.month, 'Mese ' + f.month + ': +' + Math.round(g) + ' scienza');
      if (f.nofuel) { at(f.month, 'Propellente finito: niente più mantenimento d’orbita.', 'bad', 'dur'); f.ended = true; break; }
      if (f.month % 2 === 0 && f.month < M.duration) { let id = E.nextEvent(f); if (f.surface && id === 'mascon') id = E.nextEvent(f);
        const ev = E.EV[id], live = ev.opts(f).filter(o => !o.off), rem = M.duration - f.month, lab = evLabel(id, f, d); let k, cz = EVC[id];
        if (live.length <= 1) k = live.length ? live[0].k : choose(id, f, M, rem);
        else if (ch[f.month] != null) { k = ch[f.month]; cz = 'choice:' + f.month; }
        else if (M.interactive && !auto) return { f, log, pending: { m: f.month, id, t: lab, art: ev.art, q: ev.q(f), opts: ev.opts(f), auto: choose(id, f, M, rem), fuel: f.fuel, gas: f.gas } };
        else { k = choose(id, f, M, rem); cz = 'auto:' + f.month; }
        const res = ev.run(f, k); at(f.month, lab + ': ' + res.t, res.tone === 'flat' ? '' : res.tone, res.c || cz); if (res.end) break; } }
    if (f.alive && !f.ended && upto >= f.endMonth && f.surface) { f.ended = true; f.impact = 'far'; at(f.endMonth, 'Fine missione: il payload resta sul suolo come stazione silenziosa.', 'good'); }
    if (f.alive && !f.ended && upto >= f.endMonth && f.noProp) { f.ended = true; const alt = d.alt || 550;
      if (d.placed.eol || alt <= E.M.eolAlt) { f.impact = 'far'; at(f.endMonth, d.placed.eol ? 'La vela di rientro si apre: il satellite rientrerà in pochi mesi.' : 'A ' + Math.round(alt) + ' km l’atmosfera lo frena: rientrerà entro 5 anni.', 'good'); }
      else { f.impact = null; at(f.endMonth, 'A ' + Math.round(alt) + ' km resterà in orbita per decenni: l’ente regolatore apre una contestazione.', 'bad', 'dur'); } }
    if (f.alive && !f.ended && upto >= f.endMonth) { f.ended = true;
      if (f.fuel >= 27 && r() >= (E.PARTS[d.placed.prop.id].stutter ? 0.02 : 0.005)) { f.fuel -= 27; f.impact = 'far'; at(f.endMonth, D.end, 'good'); }
      else { f.impact = null; at(f.endMonth, 'Disposal non riuscito: il satellite resta in orbita come detrito.', 'bad', f.fuel < 27 ? 'dur' : 'random'); } }
    if (f.nofuel) f.impact = null;
    return { f, log };
  }
  // A che mese siamo: il tempo della missione si ferma mentre aspetta una tua decisione
  function monthsNow(M, now, speed) { if (!M.launchAt) return 0; const t = (M.pauseAt || now) - M.launchAt - (M.pausedMs || 0); return Math.max(0, t * (speed || 1) / (TIME.month * (M.tut ? 0.35 : 1))); }
  function decide(M, k, now) { const fl = flight(M, 999), p = fl.pending; if (!p) return null; M.choices = M.choices || {}; M.choices[p.m] = k;
    M.choiceL = M.choiceL || {}; const o = p.opts.find(x => x.k === k); M.choiceL[p.m] = { t: p.t, l: o ? o.l : k, h: o ? o.h : '', alt: p.opts.filter(x => x.k !== k && !x.off).map(x => ({ k: x.k, l: x.l })) };
    if (M.pauseAt) { M.pausedMs = (M.pausedMs || 0) + (now - M.pauseAt); M.pauseAt = 0; } return p; }

  // ---------- soldi: rate degli stakeholder alle revisioni, costi di esercizio, penali ----------
  const PAY = { MDR: 0.15, PDR: 0.30, FRR: 0.15, MCR: 0.40 }, OPS = 2, MISSED = 20, MISSCAP = 400;
  const joyK = j => j >= 50 ? 1 : j >= 25 ? 0.8 : 0.5;
  const fund = (id, M) => E.fundOf(id, M);
  // Moltiplicatore delle rate (difficoltà e crew): lo imposta l'interfaccia. Vive qui, alla fonte, così vale per tutte e quattro le rate,
  // compresa l'ultima (MCR) che closeOut calcola direttamente.
  const SCALE = { inst: () => 1 };
  function installment(M, gate, joy) { joy = joy || M.joy; return Math.round(M.stake.reduce((a, id) => a + fund(id, M) * PAY[gate] * joyK(joy[id] == null ? 60 : joy[id]), 0) * SCALE.inst() * (M.payK == null ? 1 : M.payK)); }
  const pledged = M => M.stake.reduce((a, id) => a + fund(id, M), 0);
  // Chiusura della missione: tutti i conti in un posto solo (li usa anche il "e se...")
  function closeOut(M, fl, visit) { const f = fl.f, months = f.month, mm = minMonths(M), ok = f.alive && f.impact === 'far' && months >= E.M.minMonths, joy = Object.assign({}, M.joy), quests = [];
    const missed = Math.max(0, M.duration - months), penalty = Math.min(MISSCAP, Math.round(pledged(M) * 0.25), missed * MISSED) + (ok ? 0 : Math.round(pledged(M) * 0.10));
    M.stake.forEach(id => { const happy = ok && months >= mm; joy[id] = Math.max(0, Math.min(100, (joy[id] == null ? 60 : joy[id]) + (happy ? 15 : -30) - (missed ? 20 : 0) + (M.drm && M.drm.win === 'rush' ? 10 : 0))); const b = happy && joy[id] >= 50 ? Math.round(id === 'nasa' ? fund(id, M) * 0.35 : E.stk(id).bonus * 1.5) : 0; quests.push({ id, ok: happy, bonus: b }); });
    const bonus = quests.reduce((a, q) => a + q.bonus, 0), sciPay = Math.round(f.sci * 2.2), reward = Math.round((sciPay + bonus + (f.extra || 0)) * (visit ? 1.15 : 1)), inst = ok ? installment(M, 'MCR', joy) : 0, ops = OPS * months;
    return { ok, sci: Math.round(f.sci), months, missed, penalty, ops, inst, reward, sciPay, bonus, quests, joy, net: reward + inst - penalty - ops, impact: f.impact, cause: f.cause, alive: f.alive }; }
  // E se...? Rigioca il volo cambiando una sola cosa
  function whatIf(M, ch) { const C = JSON.parse(JSON.stringify(M)); C.interactive = false;
    if (ch.k === 'choice') { C.choices = {}; Object.keys(M.choices || {}).forEach(m => { if (+m < ch.m) C.choices[m] = M.choices[m]; }); C.choices[ch.m] = ch.v; C.interactive = true; }
    if (ch.k === 'test') { C.tests = Object.assign({}, C.tests); C.tests[ch.t] = true; }
    if (ch.k === 'dur') C.duration = ch.v;
    if (ch.k === 'strat') { C.traj = Object.assign({}, C.traj); C.traj.tr = ch.v; }
    const fl = flight(C, 999, true); return { fl, out: closeOut(C, fl, ch.visit) }; }

  // ---------- telemetria: codice semplificato che legge lo stato vero del satellite ----------
  function tele(M, f, tick) { const r = E.rng((M.seed ^ tick * 2654435761) >>> 0), d = M.sat, b = E.budget(d), D = E.DEST[d.dest || 'leo'], out = [];
    const day = Math.floor(tick * 7.6), ts = 'T+' + String(day).padStart(3, '0') + 'd', ecl = (tick % 9) < 2;
    const batK = f.bat / Math.max(1, b.wh), soc = Math.max(5, Math.min(100, (ecl ? 64 : 92) * batK + r() * 4)), left = Math.max(0, Math.floor((f.fuel - 27) / f.sk));
    const P = c => d.placed[c] ? E.PARTS[d.placed[c].id] : {}, k = tick % 6, cm = s => '  // ' + s;
    if (k === 0) { out.push('// ' + ts + ' · mese ' + f.month + ' di ' + M.duration + ' · ' + (typeof O !== 'undefined' ? O.fmt(O.plan(M).final) : D.orbit)); out.push('fdir.status   = ' + (f.alive ? (batK < 0.7 || f.mult < 0.75 || left < 2 ? 'WARN' : 'NOMINAL') : 'LOST')); }
    if (k === 1) { out.push('eps.battery   = ' + soc.toFixed(0) + ' %' + cm(batK < 0.7 ? 'capacità persa: ' + Math.round((1 - batK) * 100) + '%' : 'sana')); out.push('eps.solar     = ' + (ecl ? '0.0 W' + cm('in eclisse') : (b.gen * (0.9 + r() * 0.1)).toFixed(1) + ' W')); }
    if (k === 2 && f.noProp) { out.push('prop          = —' + cm('nessuna propulsione: l’orbita decade da sola')); }
    if (k === 2 && !f.noProp) { out.push('prop.dv_left  = ' + Math.max(0, f.fuel).toFixed(0) + ' m/s' + cm(left < 2 ? 'ATTENZIONE: riserva per il fine vita' : 'bastano per ~' + left + ' mesi')); out.push('prop.cold_gas = ' + Math.max(0, Math.round(f.gas)) + ' %'); }
    if (k === 3) { out.push('aocs.wheels   = ' + (f.mult < 0.75 && !f.spare.rw ? 'DEGRADED' : 'OK') + cm(f.spare.rw ? 'ruota di scorta pronta' : 'nessuna scorta')); out.push('obc.active    = ' + (f.spare.obc ? 'A (B in standby)' : 'A, nessuna scorta') + cm('rischio tempesta ' + Math.round(f.pSpe * 100) + '%')); }
    if (k === 4) { out.push('com.link      = ' + (f.weak ? 'WEAK' : 'OK') + '  ' + (P('com').n || 'radio') + cm(f.spare.com ? 'trasmettitore di riserva pronto' : 'unico trasmettitore')); out.push('payload       = ' + (f.ray ? 'ON' : 'OFF') + cm((P('ray').n || 'payload') + ' · resa ' + Math.round(f.mult * f.bonus * 100) + '%')); }
    if (k === 5) { out.push('sci.total     = ' + Math.round(f.sci) + cm('+' + Math.round(10 * f.mult * f.bonus * (f.sciK || 1)) + ' al mese circa')); out.push(left < 2 ? 'if (prop.dv_left < 27) disposal.arm();   // si prepara la chiusura' : 'sched.downlink(next=' + Math.floor(1 + r() * 5) + 'h, dur=35min);'); }
    return out; }

  return { TIERS, tierOf, sponsorSlots, maxActiveAt, SCALE, prewarm, memoClear, satOK, anySat, typeOK, ensureFeasible, TUTG, needsProp, fund, techOK, availCat, availSol, rideOK, lvOK, LOCN, effLvl, SPEC, sampleSat, JOY, LW, softOf, cheapest, priceOf, decide, PAY, joyK, installment, pledged, closeOut, whatIf, OPS, MISSED, MISSCAP, mad, OWN, evLabel, kitPay, landing, autoDesign, INT, INTN, ONLY, fits4, interests, generate, register, feasible, TPL, SPONSORS, addSponsor, TESTS, LEVELS, XP, level, BUILD, defects, defectP, risks, TIME, START_MONEY, MACH, RUN, FIXC, STIFFC, PEOPLE, REQ, R, cast, newMission, minMonths, startMeeting, answer, leave, waive, status, flight, monthsNow, tele, transferNeed };
})();
if (typeof module !== 'undefined') module.exports = L;
