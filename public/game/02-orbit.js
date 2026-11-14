/* ===== ORBIT: meccanica del volo per il Centro di dinamica del volo. Nessun DOM.
   Due corpi, manovre impulsive. Ogni manovra: un punto sull'orbita precedente, la nuova altezza dal lato opposto
   (il punto del burn diventa un apside) e un cambio di piano. Tutto è calcolato da posizione e velocità. ===== */
const O = (function () {
  const D2R = Math.PI / 180, G0 = 9.80665;
  const BODY = { moon: { mu: 4902.8, R: 1737.4 }, leo: { mu: 398600.4, R: 6371 }, mars: { mu: 42828.4, R: 3389.5 }, venus: { mu: 324859, R: 6051.8 } };
  // Tipi di missione: orbita obiettivo in raggi del corpo (pe, ap) e inclinazione in gradi
  const TYPES = {
    sci: { n: 'Rilevamento scientifico', pay: 'RAY', bio: 1, s: 'Misure in orbita ellittica: bassa al pericentro, alta all’apocentro', sciK: 1, tgt: { pe: [0.05, 0.15], ap: [0.85, 1.5], i: [0, 180] },
      st: 'Misurare l’ambiente di radiazione attorno {A}, da vicino e da lontano.' },
    obs: { n: 'Osservazione e mappatura', pay: 'CAM', s: 'Orbita bassa, circolare e polare: vede tutta la superficie', sciK: 1.15, tgt: { pe: [0.04, 0.16], ap: [0.04, 0.18], i: [80, 100] },
      st: 'Mappare tutta la superficie {G} da un’orbita polare bassa.' },
    tel: { n: 'Telescopio', pay: 'TEL', s: 'Orbita alta e quasi circolare: il corpo copre poco cielo', sciK: 1.35, tgt: { pe: [0.3, 3], ap: [0.3, 3.5], i: [0, 180] },
      st: 'Portare un piccolo telescopio in un’orbita alta e stabile attorno {A}.' },
    com: { n: 'Telecomunicazioni: inserimento in orbita', pay: 'TRX', s: 'Orbita media inclinata, da cui vedere a lungo le stazioni', sciK: 1.2, tgt: { pe: [0.25, 1.2], ap: [0.25, 1.5], i: [40, 70] },
      st: 'Inserire un ripetitore in orbita attorno {A} per collegare le future missioni.' },
    deb: { n: 'Rimozione di un detrito', pay: 'ARM', s: 'Raggiungere l’orbita del detrito e agganciarlo', sciK: 1.3, tgt: null,
      st: 'Raggiungere un vecchio stadio abbandonato attorno {A} e portarlo via.' },
    demo: { n: 'Dimostrazione tecnologica', pay: 'TEC', bio: 1, s: 'Basta un’orbita stabile: conta provare la tecnologia', sciK: 0.7, tgt: { pe: [0.03, 10], ap: [0.03, 12], i: [0, 180] },
      st: 'Provare in volo, attorno {A}, una tecnologia mai volata.' }
  };
  const ART = { moon: ['alla Luna', 'della Luna'], leo: ['alla Terra', 'della Terra'], mars: ['a Marte', 'di Marte'], venus: ['a Venere', 'di Venere'] };
  const stmt = (type, dest) => TYPES[type].st.replace('{A}', ART[dest][0]).replace('{G}', ART[dest][1]);
  const capture = { moon: 0, leo: 0, mars: 400, venus: 450 };
  // Zone di destinazione per ogni corpo: orbite (fasce di quota in km), superficie (rover), lune (solo atterraggio)
  const ZONES = {
    leo: [{ k: 'low', n: 'Orbita bassa', band: [300, 1200], lvl: 1, s: 'Tra 300 e 1.200 km: osservazione, costellazioni, prove.' },
      { k: 'med', n: 'Orbita media', band: [8000, 20000], lvl: 2, s: 'La fascia della navigazione satellitare. Ci si arriva da un rilascio in orbita di trasferimento.' },
      { k: 'high', n: 'Orbita alta (geostazionaria)', band: [35000, 36500], iFix: [0, 5], lvl: 2, s: 'A 36.000 km il satellite sembra fermo nel cielo. Lunga strada da un rilascio in GTO.' }],
    moon: [{ k: 'low', n: 'Orbita bassa', band: [30, 300], lvl: 6, s: 'Sfiorando la superficie: mappe e misure di dettaglio.' },
      { k: 'med', n: 'Orbita media', band: [300, 3000], lvl: 5, s: 'Il compromesso di AURASAT: vicino e lontano dalla superficie.' },
      { k: 'high', n: 'Orbita alta', band: [3000, 10000], lvl: 5, s: 'Lontano dalla Luna: ottima per ponti radio e telescopi.' },
      { k: 'surf', n: 'Superficie · su un lander', surf: 1, lvl: 7, s: 'Compri un posto su un lander commerciale: il tuo CubeSat diventa uno strumento sul suolo lunare.' }],
    mars: [{ k: 'low', n: 'Orbita bassa', band: [200, 800], lvl: 11, s: 'Per guardare la superficie da vicino.' },
      { k: 'med', n: 'Orbita media', band: [800, 6000], lvl: 10, s: 'Vista ampia del pianeta e della sua atmosfera.' },
      { k: 'high', n: 'Orbita alta', band: [6000, 20000], lvl: 10, s: 'Ponte radio per le missioni in superficie.' },
      { k: 'surf', n: 'Superficie · su un lander', surf: 1, lvl: 12, s: 'Un lander commerciale ti porta giù: ingresso, paracadute, retrorazzi.' }],
    venus: [{ k: 'low', n: 'Orbita bassa', band: [200, 800], lvl: 15, s: 'Sotto le nubi non si vede: servono radar e infrarossi.' },
      { k: 'med', n: 'Orbita media', band: [800, 6000], lvl: 15, s: 'Per studiare la circolazione dell’atmosfera.' },
      { k: 'high', n: 'Orbita alta', band: [6000, 30000], lvl: 15, s: 'Vista d’insieme del pianeta e del vento solare.' }]
  };
  // atterraggi: lo stadio di discesa è comprato a parte (costo) e porta un rischio; sulle lune piccole basta il motore del satellite
  // atterraggi: si compra un posto su un lander commerciale, a peso. Il lander può fallire.
  const LAND = { moon: { n: 'Atterraggio con un lander lunare commerciale', perKg: 1200, cost: 0, risk: 0.1, dv: 0, sciK: 1.6 }, mars: { n: 'Atterraggio con un lander marziano', perKg: 3000, cost: 0, risk: 0.15, dv: 0, sciK: 1.7 } };
  // ore d'ombra per orbita (o notte sul suolo): niente più 267 minuti ovunque
  const ECL = { moon: { low: 0.8, med: 4.45, high: 3, surf: 6 }, leo: { low: 0.6, med: 1, high: 1.2 }, mars: { low: 0.7, med: 1, high: 1.5, surf: 12, phobos: 0.9, deimos: 1.1 }, venus: { low: 0.6, med: 0.9, high: 1.5 } };
  const zoneOf = M => { const d = M.sat, Z = ZONES[d.dest || 'leo'] || []; return Z.find(z => z.k === (M.zone || (d.dest === 'leo' ? 'low' : 'med'))) || Z[0]; };
  // quota di lavoro dentro la fascia: 0 = bordo basso, 1 = bordo alto. Cambia scienza e mantenimento d'orbita.
  const frac = M => M.traj && M.traj.frac != null ? M.traj.frac : 0.5;
  function work(M, el) { const z = zoneOf(M), T = M.type || 'sci', dest = M.sat.dest || 'leo';
    if (!z || !z.band || T === 'deb' || landOf(M)) return { q: 1, sk: 1, slider: false };
    const fr = el ? Math.max(0, Math.min(1, ((el.pe + (isFinite(el.ap) ? el.ap : el.pe)) / 2 - z.band[0]) / (z.band[1] - z.band[0]))) : frac(M), atm = !!ATM[dest];
    const q = T === 'obs' ? 1.25 - 0.5 * fr : (T === 'tel' || T === 'com') ? 0.8 + 0.4 * fr : T === 'sci' ? 1.1 - 0.4 * Math.abs(fr - 0.5) : 1;
    const skA = z.k === 'low' ? (atm ? 1.8 : dest === 'moon' ? 1 : 0.4) : 0.3, sk = 1 + skA * (1 - fr) * (1 - fr);
    const why = T === 'obs' ? 'Più in basso vedi più dettagli' : T === 'tel' ? 'Più in alto il corpo copre meno cielo' : T === 'com' ? 'Più in alto vedi le stazioni più a lungo' : T === 'sci' ? 'Conta misurare sia vicino sia lontano: il centro della fascia è il compromesso' : 'Per una dimostrazione la quota conta poco';
    return { q, sk, slider: true, fr, why, drag: z.k === 'low' ? (atm ? 'In basso l’atmosfera frena il satellite' : dest === 'moon' ? 'In basso le mascon deformano l’orbita' : '') : '' }; }
  function workEl(M, t) { const fr = frac(M), lerp = (r, x) => r[0] + (r[1] - r[0]) * x;
    if ((M.type || 'sci') === 'sci') { const pe = lerp(t.pe, fr * 0.5); return { pe: Math.round(pe), ap: Math.round(Math.max(pe, lerp(t.ap, 0.5 + fr * 0.5))) }; }
    const h = Math.round(lerp(t.pe, fr)); return { pe: h, ap: h }; }
  const landOf = M => { const z = zoneOf(M); if (!z) return null; if (z.surf) return LAND[M.sat.dest || 'moon']; return null; };

  // vettori
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const nrm = a => Math.hypot(a[0], a[1], a[2]), unit = a => mul(a, 1 / (nrm(a) || 1));
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

  // elementi (altezze in km, angoli in gradi) → posizione e velocità
  function state(el, nuDeg, B) { const rp = B.R + el.pe, ra = B.R + el.ap, a = (rp + ra) / 2, e = (ra - rp) / (ra + rp), p = a * (1 - e * e), nu = nuDeg * D2R;
    const r = p / (1 + e * Math.cos(nu)), sq = Math.sqrt(B.mu / p);
    const rP = [r * Math.cos(nu), r * Math.sin(nu), 0], vP = [-sq * Math.sin(nu), sq * (e + Math.cos(nu)), 0];
    const O = (el.raan || 0) * D2R, i = el.i * D2R, w = (el.argp || 0) * D2R, cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(i), si = Math.sin(i), cw = Math.cos(w), sw = Math.sin(w);
    const Q = [[cO * cw - sO * sw * ci, -cO * sw - sO * cw * ci], [sO * cw + cO * sw * ci, -sO * sw + cO * cw * ci], [sw * si, cw * si]];
    const rot = v => [Q[0][0] * v[0] + Q[0][1] * v[1], Q[1][0] * v[0] + Q[1][1] * v[1], Q[2][0] * v[0] + Q[2][1] * v[1]];
    return { r: rot(rP), v: rot(vP) }; }
  // posizione e velocità → elementi
  function elements(r, v, B) { const mu = B.mu, rm = nrm(r), vm = nrm(v), h = crs(r, v), hm = nrm(h);
    const ev = mul(sub(mul(r, vm * vm - mu / rm), mul(v, dot(r, v))), 1 / mu), e = nrm(ev), a = 1 / (2 / rm - vm * vm / mu);
    const i = Math.acos(clamp(h[2] / hm, -1, 1)), n = [-h[1], h[0], 0], nm = nrm(n);
    const raan = nm > 1e-9 ? Math.atan2(n[1], n[0]) : 0;
    let argp = 0; if (e > 1e-7) { if (nm > 1e-9) { argp = Math.acos(clamp(dot(n, ev) / (nm * e), -1, 1)); if (ev[2] < 0) argp = 2 * Math.PI - argp; } else { argp = Math.atan2(ev[1], ev[0]); if (h[2] < 0) argp = 2 * Math.PI - argp; } }
    else if (nm > 1e-9) { argp = 0; }
    let nu; if (e > 1e-7) { nu = Math.acos(clamp(dot(ev, r) / (e * rm), -1, 1)); if (dot(r, v) < 0) nu = 2 * Math.PI - nu; }
    else { const ref = nm > 1e-9 ? n : [1, 0, 0]; nu = Math.acos(clamp(dot(ref, r) / (nrm(ref) * rm), -1, 1)); if (dot(crs(ref, r), h) < 0) nu = 2 * Math.PI - nu; }
    const bound = e < 1 && a > 0;
    return { pe: a * (1 - e) - B.R, ap: bound ? a * (1 + e) - B.R : Infinity, i: i / D2R, raan: raan / D2R, argp: argp / D2R, nu: nu / D2R, e, a, bound }; }

  // una manovra: dal punto nu dell'orbita precedente, nuova altezza dal lato opposto, cambio di piano
  function burn(el, b, B) { const s = state(el, b.nu, B), rm = nrm(s.r), rOpp = B.R + b.h;
    const vm = Math.sqrt(B.mu * 2 * rOpp / (rm * (rm + rOpp)));
    const rh = unit(s.r), hh = unit(crs(s.r, s.v)), th = unit(crs(hh, rh)), d = (b.dp || 0) * D2R;
    const t2 = add(mul(th, Math.cos(d)), mul(crs(rh, th), Math.sin(d))), v2 = mul(t2, vm), dv = nrm(sub(v2, s.v)) * 1000;
    const out = elements(s.r, v2, B); return { el: { pe: out.pe, ap: out.ap, i: out.i, raan: out.raan, argp: out.argp }, dv, at: s.r, alt: rm - B.R }; }

  function target(M) { const d = M.sat, B = BODY[d.dest || 'moon'], T = TYPES[M.type || 'sci'], z = zoneOf(M);
    if (z && z.moon && z.alt) return { pe: [Math.round(z.alt * 0.97), Math.round(z.alt * 1.03)], ap: [Math.round(z.alt * 0.97), Math.round(z.alt * 1.03)], i: [0, z.i + 3] };
    const band = z && z.band ? z.band : (z && z.surf ? ZONES[d.dest || 'moon'][0].band : [Math.round(B.R * 0.05), Math.round(B.R * 1.5)]), iR = z && z.iFix ? z.iFix.slice() : T.tgt ? T.tgt.i.slice() : [0, 180];
    if (T.tgt || z.surf) return { pe: band.slice(), ap: band.slice(), i: z.surf ? [0, 180] : iR };
    const r = E.rng(((M.seed || 1) ^ 0x2545f491) >>> 0), pe = Math.round(band[0] + (band[1] - band[0]) * (0.1 + r() * 0.4)), ap = Math.round(Math.min(band[1], pe * (1.05 + r() * 0.5))), i = Math.round(40 + r() * 50);
    return { pe: [Math.round(pe * 0.94), Math.round(pe * 1.06)], ap: [Math.round(ap * 0.94), Math.round(ap * 1.06)], i: [i - 2, i + 2], debris: { pe, ap, i } }; }
  const mid = r => (r[0] + r[1]) / 2;
  function nominal(t) { const pe = mid(t.pe), ap = Math.max(pe, Math.min(t.ap[1], Math.max(t.ap[0], pe * 1.0001 + (t.ap[0] > pe ? (t.ap[0] - pe) * 1.15 : 0)))); return { pe, ap: Math.max(pe, ap), i: t.i[1] >= 180 ? 30 : mid(t.i), raan: 0, argp: 0 }; }
  // Orbita in cui ti lascia il lanciatore
  function initial(M) { const d = M.sat, dest = d.dest || 'moon', t = target(M), L = E.LV[d.lv];
    if (L && L.surf) return { el: { pe: 100, ap: 100, i: 90, raan: 0, argp: 0 }, cap: 0, why: 'Il lander commerciale ti porta fino al suolo.' };
    const k = !L ? 1 : typeof L.dvK === 'number' ? L.dvK : (L.dvK[dest] != null ? L.dvK[dest] : 1);
    if (k === 0) { const n = t.debris ? { pe: t.debris.pe, ap: t.debris.ap, i: t.debris.i, raan: 0, argp: 0 } : nominal(t); if (!t.debris && work(M).slider) Object.assign(n, workEl(M, t)); return { el: n, cap: 0, why: 'Il lanciatore dedicato ti porta già nell’orbita di lavoro.' }; }
    const iA = t.debris ? t.debris.i - 6 : (t.i[1] - t.i[0] < 60 ? (t.i[0] + t.i[1]) / 2 : 30);
    if (dest === 'moon') return { el: { pe: 800, ap: 8000, i: iA, raan: 0, argp: 0 }, cap: 0, why: 'Rilascio dopo il viaggio dalla Terra: orbita lunare alta e allungata.' };
    if (L && L.ell) return { el: { pe: 400, ap: 8000, i: iA, raan: 0, argp: 0 }, cap: 0, why: 'La sonda che ti porta frena per te: rilascio in un’orbita allungata.' };
    if (dest === 'leo') { const iT = t.debris ? t.debris.i - 6 : (t.i[1] - t.i[0] < 60 ? mid(t.i) : 97.6), z = zoneOf(M);
      if (z.k === 'med') return { el: { pe: 400, ap: 20000, i: iT, raan: 0, argp: 0 }, cap: 0, why: 'Il rideshare ti rilascia in un’orbita di trasferimento allungata fino a 20.000 km.' };
      if (z.k === 'high') return { el: { pe: 300, ap: 35786, i: Math.min(iT, 27), raan: 0, argp: 0 }, cap: 0, why: 'Rilascio in orbita di trasferimento geostazionaria (GTO): la circolarizzazione tocca a te.' };
      return { el: { pe: 550, ap: 560, i: iT, raan: 0, argp: 0 }, cap: 0, why: 'Il rideshare ti rilascia in orbita bassa circolare.' }; }
    return { el: { pe: 400, ap: 8000, i: iA, raan: 0, argp: 0 }, cap: Math.round(capture[dest] * k), why: 'Arrivo dal viaggio interplanetario: la frenata di cattura costa ' + Math.round(capture[dest] * k) + ' m/s ed è già nel conto.' }; }

  // Il piano completo: orbite, ΔV, propellente in kg, verifica dell'obiettivo
  // ---------- strategie: il giocatore sceglie un compromesso, la fisica calcola i numeri ----------
  const ATM = { leo: 1, mars: 1, venus: 1 };
  // il punto dell'obiettivo più vicino all'orbita di partenza
  function goalM(M, ini, t) { if (t.debris || !work(M).slider || !M.traj || M.traj.frac == null) return goal(ini, t); const w = workEl(M, t); return { pe: w.pe, ap: w.ap, i: Math.max(t.i[0], Math.min(t.i[1], ini.i)) }; }
  function goal(ini, t) { if (t.debris) return { pe: t.debris.pe, ap: t.debris.ap, i: t.debris.i }; const c = (x, r) => Math.max(r[0], Math.min(r[1], x)); const pe = c(ini.pe, t.pe), ap = Math.max(pe, c(ini.ap, t.ap)); return { pe, ap, i: c(ini.i, t.i) }; }
  // due accensioni agli apsidi (Hohmann), il cambio di piano dove si va più piano
  function autoBurns(ini, g, B) { const near = (a, b) => Math.abs(a - b) < 1.5; if (near(ini.pe, g.pe) && near(ini.ap, g.ap) && Math.abs(ini.i - g.i) < 0.5) return [];
    const di = g.i - ini.i, cands = [];
    [[0, g.ap, g.pe], [180, g.pe, g.ap]].forEach(([nu1, h1, h2]) => {
      const tryDp = (dp1, dp2) => { const r1 = burn(ini, { nu: nu1, h: h1, dp: dp1 }, B), o1 = r1.el, nu2 = Math.abs(o1.pe - h1) < Math.abs(o1.ap - h1) ? 0 : 180, r2 = burn(o1, { nu: nu2, h: h2, dp: dp2 }, B);
        return { burns: [{ nu: nu1, h: h1, dp: dp1 }, { nu: nu2, h: h2, dp: dp2 }], dv: r1.dv + r2.dv, err: Math.abs(r2.el.i - g.i) }; };
      // il cambio di piano va nell'accensione più alta
      const alt1 = ini.pe + (ini.ap - ini.pe) * (nu1 ? 1 : 0), first = alt1 >= h1;
      if (Math.abs(di) < 0.5) { cands.push(tryDp(0, 0)); return; }
      [1, -1].forEach(sg => { for (let k = 0; k <= 80; k++) { const dp = sg * Math.abs(di) * k / 40; cands.push(first ? tryDp(dp, 0) : tryDp(0, dp)); } }); });
    const okc = cands.filter(c => c.err < 0.5); const best = (okc.length ? okc : cands).sort((a, b) => okc.length ? a.dv - b.dv : a.err - b.err)[0];
    return best.burns; }
  const period = (el, B) => { const a = B.R + (el.pe + el.ap) / 2; return 2 * Math.PI * Math.sqrt(a * a * a / B.mu) / 86400; };
  function strategies(M, raw) { const d = M.sat, dest = d.dest || 'moon', pr = d.placed.prop ? E.PARTS[d.placed.prop.id] : null, ion = !!(pr && pr.isp > 1000), out = { cap: [], tr: [] };
    if (raw.cap > 0) { out.cap.push({ k: 'burn', n: 'Frenata propulsiva', s: 'Il motore frena il satellite all’arrivo.', f: 1, risk: 0, days: 1 });
      out.cap.push({ k: 'aero', n: 'Aerocattura', s: 'Il satellite si tuffa nell’atmosfera per frenare. Serve uno scudo, e può finire male.', f: 0.15, risk: 0.12, days: 2, off: ATM[dest] ? '' : 'senza atmosfera non si può' }); }
    if (raw.trDv > 0.5) { const days = raw.days, lowers = raw.lowersAp;
      out.tr.push({ k: 'hoh', n: 'Hohmann', s: 'Due accensioni agli apsidi. È la via più economica.', f: 1, risk: 0, days });
      out.tr.push({ k: 'aero', n: 'Aerofrenata', s: 'Passaggi ripetuti nell’alta atmosfera abbassano l’orbita quasi gratis. Due mesi senza scienza e qualche rischio.', f: 0.3, risk: 0.06, days: days + 60, delay: 2, off: !ATM[dest] ? 'senza atmosfera non si può' : !lowers ? 'serve solo per abbassare l’orbita' : '' });
      out.tr.push({ k: 'ion', n: 'Spirale ionica', s: 'Spinta minuscola per mesi: pochissimo propellente, due mesi senza scienza.', f: 1.15, isp: 1500, risk: 0, days: days + 60, delay: 2, off: ion ? '' : 'serve la propulsione ionica a bordo' }); }
    return out; }

  // ---------- Orbit Budget (v33): le orbite della DRM con gli elementi scelti dal giocatore ----------
  // La DRM fissa il semiasse maggiore (a = R + quota); qui si scelgono e, i, Ω, ω e l'anomalia media.
  const ATMH = { leo: [120, 250], mars: [80, 180], venus: [150, 300] };
  function atmRisk(dest, pe) { if (pe <= 0) return 1; const A = ATMH[dest]; if (!A || pe >= A[1]) return 0; if (pe <= A[0]) return 0.9; return 0.9 * (A[1] - pe) / (A[1] - A[0]); }
  const m360 = x => ((x % 360) + 360) % 360;
  function kep(el, B) { const rp = B.R + el.pe, ra = B.R + (isFinite(el.ap) ? el.ap : el.pe); return { a: (rp + ra) / 2, e: (ra - rp) / (ra + rp), i: el.i * D2R, raan: (el.raan || 0) * D2R, argp: (el.argp || 0) * D2R }; }
  function pqK(k) { const co = Math.cos(k.raan), so = Math.sin(k.raan), cw = Math.cos(k.argp), sw = Math.sin(k.argp), ci = Math.cos(k.i), si = Math.sin(k.i);
    return [[co * cw - so * sw * ci, so * cw + co * sw * ci, sw * si], [-co * sw - so * cw * ci, -so * sw + co * cw * ci, cw * si]]; }
  const normK = k => { const [P, Q] = pqK(k); return crs(P, Q); };
  const vv = (mu, r, a) => Math.sqrt(Math.max(0, mu * (2 / r - 1 / a)));
  // trasferimento a due impulsi agli apsidi con il cambio di piano ripartito al meglio; restituisce anche l'orbita intermedia
  function transfer(el1, el2, B) { const mu = B.mu, k1 = kep(el1, B), k2 = kep(el2, B), r1 = { rp: k1.a * (1 - k1.e), ra: k1.a * (1 + k1.e) }, r2 = { rp: k2.a * (1 - k2.e), ra: k2.a * (1 + k2.e) };
    const n1 = normK(k1), n2 = normK(k2), dth = Math.acos(clamp(dot(n1, n2), -1, 1));
    const bn = (r, aF, aT, al) => { const v = vv(mu, r, aF), w = vv(mu, r, aT); return Math.sqrt(Math.max(0, v * v + w * w - 2 * v * w * Math.cos(al))); };
    const aX = (r1.rp + r2.ra) / 2, aY = (r1.ra + r2.rp) / 2; let best = { dv: Infinity };
    for (let k = 0; k <= 180; k++) { const al = dth * k / 180, be = dth - al;
      const x1 = bn(r1.rp, k1.a, aX, al), x2 = bn(r2.ra, aX, k2.a, be); if (x1 + x2 < best.dv) best = { dv: x1 + x2, dv1: x1, dv2: x2, al, opt: 'X' };
      const y1 = bn(r1.ra, k1.a, aY, al), y2 = bn(r2.rp, aY, k2.a, be); if (y1 + y2 < best.dv) best = { dv: y1 + y2, dv1: y1, dv2: y2, al, opt: 'Y' }; }
    const first = best.opt === 'X' ? { rb: r1.rp, ro: r2.ra } : { rb: r1.ra, ro: r2.rp }, rpm = Math.min(first.rb, first.ro), ram = Math.max(first.rb, first.ro);
    let nm = n1; if (dth > 1e-9) { const k = unit(crs(n1, n2)), c = Math.cos(best.al), s = Math.sin(best.al); nm = add(add(mul(n1, c), mul(crs(k, n1), s)), mul(k, dot(k, n1) * (1 - c))); }
    const im = Math.acos(clamp(nm[2], -1, 1)), raanm = Math.abs(Math.sin(im)) > 1e-9 ? Math.atan2(nm[0], -nm[1]) : k1.raan;
    const sgn = best.opt === 'X' ? (first.rb <= first.ro ? 1 : -1) : (first.rb <= first.ro ? -1 : 1);
    let dm = mul(pqK(k1)[0], sgn); dm = unit(sub(dm, mul(nm, dot(dm, nm)))); const node = [Math.cos(raanm), Math.sin(raanm), 0], argpm = Math.atan2(dot(crs(node, dm), nm), dot(node, dm));
    const two = best.dv1 > 0.0005 && best.dv2 > 0.0005;
    return { dv: best.dv * 1000, dv1: best.dv1 * 1000, dv2: best.dv2 * 1000, mid: two ? { pe: rpm - B.R, ap: ram - B.R, i: im / D2R, raan: m360(raanm / D2R), argp: m360(argpm / D2R) } : null }; }
  function legEl(L, h, B) { const a = B.R + h, e = clamp(L.e || 0, 0, 0.95); return { pe: a * (1 - e) - B.R, ap: a * (1 + e) - B.R, i: L.i, raan: m360(L.raan || 0), argp: m360(L.argp || 0), ma: m360(L.ma || 0) }; }
  // fasce ammesse dell'eccentricità: il pericentro non deve toccare la superficie
  const eMax = (h, B) => Math.min(0.95, (B.R + h - B.R * 1.0) / (B.R + h));
  function obLegs(M, ini) { const D = M.drm, n = D.orbits.length, ob = M.ob || (M.ob = { legs: [] });
    while (ob.legs.length < n) { const p = ob.legs[ob.legs.length - 1]; ob.legs.push(p ? { e: 0, i: p.i, raan: p.raan, argp: 0, ma: 0 } : { e: 0, i: Math.round(ini.i * 10) / 10, raan: m360(ini.raan || 0), argp: 0, ma: 0 }); }
    if (ob.legs.length > n) ob.legs.length = n; return ob.legs; }
  // fine vita dall'ultima orbita
  function eolPlan(M, last, B, lf) { const D = M.drm, d = M.sat, dest = d.dest || 'leo', k = D.eol ? D.eol.k : null; if (!k || k === 'surf') return { dv: 0, el: null, t: '', k };
    const mu = B.mu, kl = kep(last, B), rp = kl.a * (1 - kl.e), ra = kl.a * (1 + kl.e);
    if (k === 'reentry' || k === 'impact') { const lfr = lf && (dest === 'leo' || dest === 'mars') ? (d.placed.eol ? lf.sail : lf.nom) : null, byGmat = lfr ? lfr.days != null && lfr.days <= 1825 : null, nat = k === 'reentry' && ATM[dest] && (byGmat != null ? byGmat : (d.placed.eol || last.pe <= (dest === 'leo' ? 600 : 250))), rpT = B.R + (k === 'impact' ? -50 : 60);
      if (nat) return { dv: 0, el: null, t: d.placed.eol ? 'Rientro con la vela: nessuna manovra' : 'Rientro naturale: l’atmosfera frena il satellite', k, nat: true };
      if (rp <= rpT) return { dv: 0, el: last, t: k === 'impact' ? 'Impatto: l’orbita tocca già la superficie' : 'Rientro: l’orbita entra già nell’atmosfera', k };
      const dv = (vv(mu, ra, kl.a) - vv(mu, ra, (ra + rpT) / 2)) * 1000; return { dv, el: { pe: rpT - B.R, ap: ra - B.R, i: last.i, raan: last.raan, argp: m360((last.argp || 0) + 180) }, t: k === 'impact' ? 'Impatto controllato' : 'Rientro in atmosfera', k }; }
    const hG = HOOK.grave ? HOOK.grave(M) : 36100, g = { pe: hG, ap: hG, i: last.i, raan: last.raan, argp: 0 }, tr = transfer(last, g, B);
    return { dv: tr.dv, el: g, mid: tr.mid, t: 'Verso l’orbita cimitero', k }; }
  function tle(el, B, no) { const a = B.R + (el.pe + el.ap) / 2, e = (el.ap - el.pe) / (2 * a), n = 86400 / (2 * Math.PI * Math.sqrt(a * a * a / B.mu));
    const f = (x, w, d) => x.toFixed(d).padStart(w, ' '), ck = s => String(s.split('').reduce((t, c) => t + (c === '-' ? 1 : /\d/.test(c) ? +c : 0), 0) % 10);
    const id = String(no || 99001).padStart(5, '0').slice(-5), l1 = '1 ' + id + 'U 26999A   26305.50000000  .00000000  00000-0  00000-0 0  999', l2 = '2 ' + id + ' ' + f(el.i, 8, 4) + ' ' + f(m360(el.raan || 0), 8, 4) + ' ' + e.toFixed(7).slice(2) + ' ' + f(m360(el.argp || 0), 8, 4) + ' ' + f(m360(el.ma || 0), 8, 4) + ' ' + f(n, 11, 8) + '    1';
    return [l1 + ck(l1), l2 + ck(l2), n]; }
  function plan(M) { const d = M.sat, B = BODY[d.dest || 'moon'], ini = initial(M), t = target(M), tj = M.traj || (M.traj = {}), expert = !!tj.expert;
    const landNow = landOf(M); if (landNow) ini.cap = 0;
    const obm = !landNow && !!(M.drm && M.drm.v === 1 && M.drm.orbits);
    const burns = landNow || obm ? [] : expert ? ((M.fd && M.fd.burns) || []) : autoBurns(ini.el, goalM(M, ini.el, t), B);
    const orbits = [{ el: ini.el, dv: 0, name: 'Rilascio' }], land = landOf(M); let lf = null, gmatOn = false, tot = ini.cap, bad = '', si = 0, after = 0, eol = null, atm = null;
    if (obm) { const D = M.drm, legs = obLegs(M, ini.el), dest = d.dest || 'leo'; si = D.star < 0 ? 0 : D.star + 1;
      D.orbits.forEach((o, k) => { const prev = orbits[orbits.length - 1].el, el = legEl(legs[k], o.h, B), tr = transfer(prev, el, B); orbits.push({ el, dv: tr.dv, mid: tr.mid, leg: k, h: o.h, name: 'Orbita ' + (k + 2) });
        if (k + 1 <= si) tot += tr.dv; else after += tr.dv; });
      // vita dell'orbita di lavoro calcolata da GMAT (propagazione fino al rientro): decide se il rientro naturale rispetta la regola dei 5 anni
      if (HOOK.gmatLf && !landNow) { const w = orbits[Math.min(si, orbits.length - 1)].el, bb = E.budget(d); lf = HOOK.gmatLf(M, { dest, el: { pe: w.pe, ap: isFinite(w.ap) ? w.ap : w.pe, i: w.i, raan: w.raan || 0, argp: w.argp || 0 }, mass: Math.round(bb.wet * 2) / 2, area: satArea(d), sail: !!d.placed.eol }); }
      eol = eolPlan(M, orbits[orbits.length - 1].el, B, lf); after += eol.dv;
      // ΔV calcolato da GMAT (NASA), se il servizio ha già risposto per questo piano: sostituisce i numeri del modello a due corpi
      const gx = HOOK.gmat ? HOOK.gmat(M, { dest, orbits: orbits.map(o => ({ el: o.el, mid: o.mid || null, dv: o.dv })), eol: eol && eol.el ? { el: eol.el, mid: eol.mid || null, dv: eol.dv } : null }) : null;
      if (gx && gx.legs && gx.legs.length === orbits.length - 1) { tot = ini.cap; after = 0; orbits.forEach((o, k) => { if (!k) return; o.dv = gx.legs[k - 1].dv; if (k <= si) tot += o.dv; else after += o.dv; }); if (gx.eol && eol.el) eol.dv = gx.eol.dv; after += eol.dv; gmatOn = true; }
      // atmosfera e superficie: ogni orbita percorsa (anche quelle di trasferimento) conta
      const rows = []; orbits.forEach((o, k) => { [[o.el, o.name, k === si ? 1.5 : 1], [o.mid, 'trasferimento verso ' + (o.name || ''), 0.5]].forEach(([el, n, w]) => { if (!el) return; const r = atmRisk(dest, el.pe); if (r > 0) rows.push({ n, pe: el.pe, r: Math.min(0.95, r * w), crash: el.pe <= 0 }); }); });
      if (eol.mid) { const r = atmRisk(dest, eol.mid.pe); if (r > 0) rows.push({ n: 'trasferimento verso il cimitero', pe: eol.mid.pe, r: r * 0.5, crash: eol.mid.pe <= 0 }); }
      const pAll = 1 - rows.reduce((q, x) => q * (1 - x.r), 1), worst = rows.slice().sort((a, b) => a.pe - b.pe)[0];
      atm = { rows, p: pAll, worst }; const cr = rows.find(x => x.crash); if (cr) bad = 'L’orbita «' + cr.n + '» tocca la superficie: alza il pericentro (meno eccentricità)'; }
    burns.forEach((b, k) => { const prev = orbits[orbits.length - 1].el; if (!isFinite(prev.ap)) { bad = 'Orbita aperta'; return; }
      const r = burn(prev, b, B); if (r.el.pe < 30) bad = 'L’orbita ' + (k + 1) + ' tocca la superficie'; orbits.push({ el: r.el, dv: r.dv, at: r.at, alt: r.alt, b }); tot += r.dv; });
    const trDv = tot - ini.cap, raw = { cap: ini.cap, trDv, days: orbits.slice(1, obm ? si + 1 : undefined).reduce((a, o) => a + period(o.el, B) / 2, 0), lowersAp: orbits.length > 1 && orbits[obm ? si : orbits.length - 1].el.ap < ini.el.ap - 1 };
    const st = strategies(M, raw), pick = (list, k) => list.find(x => x.k === k && !x.off), dflt = (list, k0) => obm ? (list.find(x => x.k === k0 && !x.off) || null) : null;
    const sc = st.cap.length ? (pick(st.cap, tj.cap) || dflt(st.cap, 'burn')) : null, strn = st.tr.length ? (expert && !obm ? { k: 'man', f: 1, risk: 0, days: raw.days, n: 'Manovre disegnate a mano' } : (pick(st.tr, tj.tr) || dflt(st.tr, 'hoh'))) : null;
    const capDv = ini.cap * (sc ? sc.f : 1), trEff = trDv * (strn ? strn.f : 1); tot = capDv + trEff + (land ? land.dv : 0);
    const stratOk = (!st.cap.length || !!sc) && (!st.tr.length || !!strn);
    const f = orbits[obm ? si : orbits.length - 1].el, inR = (x, r) => x >= r[0] - 0.5 && x <= r[1] + 0.5;
    const noProp = !d.placed.prop, early = ['0', 'A', 'B'].indexOf(M.phase) >= 0, rp = noProp ? (HOOK.refProp ? HOOK.refProp(M) : { isp: 231, propM: 0.5 }) : null, none = !!(rp && rp.none);
    if (!bad && noProp && tot + after > 1 && none) bad = 'Il piano chiede ' + Math.round(tot + after) + ' m/s di manovre, ma al tuo livello non hai ancora un propulsore (il primo si sblocca al livello ' + rp.lvl + '): scegli un’orbita di lavoro dove il razzo ti lascia già, senza manovre';
    else if (!bad && noProp && tot + after > 1 && !early) bad = 'Servono ' + Math.round(tot + after) + ' m/s di manovre: monta un sistema di propulsione';
    const chk = land ? { pe: true, ap: true, i: true } : { pe: inR(f.pe, t.pe), ap: inR(f.ap, t.ap), i: inR(f.i, t.i) }; const ok = !bad && chk.pe && chk.ap && chk.i && (stratOk || tot <= 1);
    // propellente: massa dal progetto se c'è, altrimenti un riferimento
    const b0 = E.budget(d), pr = d.placed.prop ? E.PARTS[d.placed.prop.id] : null, ref = !pr;
    const isp0 = pr ? pr.isp : (rp && !none ? rp.isp : 231), isp = isp0, propKg = pr ? pr.propM : (none ? 0 : rp.propM), wet = ref ? ((E.RIDES[d.ride] || { massLim: 6 }).massLim * 0.6) : b0.wet, dry = wet - propKg;
    let m = wet; const used = orbits.map((o, k) => { const dv = k === 0 ? capDv : o.dv * (strn ? strn.f : 1), m2 = m / Math.exp(dv / (isp * G0)), kg = m - m2; m = m2; return kg; });
    const usedKg = wet - m, dvAvail = ref ? (none ? 0 : isp * G0 * Math.log(wet / dry)) : b0.fuel;
    const z = zoneOf(M), wk = work(M, f); d.planDv = Math.round(tot + after); d.planOk = ok; d.landC = 0; d.landKg = land ? land.perKg : 0; d.noProp = noProp; d.alt = (f.pe + (isFinite(f.ap) ? f.ap : f.pe)) / 2; d.skK = wk.sk; d.eclH = ((ECL[d.dest || 'moon'] || {})[z ? z.k : 'med']) || E.M.eclH;
    // analisi GMAT dell'orbita di lavoro: eclisse, contatti, decadimento. Sostituisce i valori fissi quando il servizio ha risposto.
    const dd = d.dest || 'moon', an = !land && HOOK.gmatAn ? HOOK.gmatAn(M, { dest: dd, el: { pe: f.pe, ap: isFinite(f.ap) ? f.ap : f.pe, i: f.i, raan: f.raan || 0, argp: f.argp || 0 }, mass: Math.round(wet * 2) / 2, area: satArea(d) }) : null;
    d.skMs = null; if (an && an.eclipse && an.eclipse.events >= 0) { d.eclH = an.eclipse.maxMin / 60; d.eclSrc = 'gmat'; } else d.eclSrc = 'model'; if (an && an.evolution) d.skMs = an.evolution.skDvMonth;
    return { lf, an, gmat: gmatOn, ob: obm, si, after, eol, atm, work: wk, land, zone: zoneOf(M), st, sc, strn, raw, capDv, trEff, stratOk, expert, B, ini, t, orbits, tot, ok, chk, bad, final: f, propKg, usedKg, used, wet, isp, ref, dvAvail, refN: rp && !none ? rp.n : '', none }; }
  // anomalia vera da anomalia media (Newton su Keplero)
  function nuFromM(Mn, e) { let E2 = Mn; for (let k = 0; k < 12; k++) E2 = E2 - (E2 - e * Math.sin(E2) - Mn) / (1 - e * Math.cos(E2)); return 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E2 / 2), Math.sqrt(1 - e) * Math.cos(E2 / 2)); }
  // Script per GMAT (NASA General Mission Analysis Tool): stesse orbite e stessi trasferimenti del piano, calcolati da GMAT con un Target/Vary/Achieve.
  // Sintassi ricalcata sugli esempi ufficiali nasa/GMAT (Tut_SimpleOrbitTransfer, Ex_LunarTransfer, Ex_MarsOrbit).
  // Due impulsi agli apsidi, con il cambio di piano ripartito come nel piano del gioco (inclinazione intermedia = mid.i). Si impone l'inclinazione, non Ω.
  function gmat(M, p, opts) { opts = opts || {};
    const dest = (M.sat && M.sat.dest) || 'leo', B = BODY[dest], body = { leo: 'Earth', moon: 'Luna', mars: 'Mars', venus: 'Venus' }[dest], cs = dest === 'leo' ? 'EarthMJ2000Eq' : body + 'MJ2000Eq';
    const f = (x, d) => Number(x).toFixed(d == null ? 6 : d), L = [];
    const name = String(M.name || 'Mission').replace(/[\r\n]/g, ' ');
    L.push('%  Space Mission Design Game: ' + name, '%  Destination: ' + body + ' · generated for GMAT (R2025a-style script, syntax from the nasa/GMAT sample scripts)', '%  The game uses a two-body model with impulsive burns: GMAT\'s delta-V per leg should be close to the game\'s, not identical.', '');
    if (dest !== 'leo') L.push('Create CoordinateSystem ' + cs + ';', cs + '.Origin = ' + body + ';', cs + '.Axes   = MJ2000Eq;', '');
    // un'orbita perfettamente circolare non ha apsidi: una piccola eccentricità tiene valido il Propagate-to-apsis
    const e0 = p.orbits[0].el, k0 = kep(e0, B), ecc0 = Math.max(k0.e, 1e-4), ma = (e0.ma || 0) * D2R, ta = nuFromM(ma, ecc0) / D2R;
    L.push('Create Spacecraft Sat;', 'Sat.CoordinateSystem = ' + cs + ';', 'Sat.DisplayStateType = Keplerian;', 'Sat.SMA = ' + f(k0.a) + ';', 'Sat.ECC = ' + f(ecc0) + ';', 'Sat.INC = ' + f(e0.i) + ';', 'Sat.RAAN = ' + f(m360(e0.raan || 0)) + ';', 'Sat.AOP = ' + f(m360(e0.argp || 0)) + ';', 'Sat.TA = ' + f(m360(ta)) + ';', 'Sat.DryMass = ' + f(Math.max(1, p.wet || 10), 3) + ';', '');
    L.push('Create ForceModel PointMass;', 'PointMass.CentralBody = ' + body + ';', 'PointMass.PointMasses = {' + body + '};', 'PointMass.Drag = None;', 'PointMass.SRP = Off;', '', 'Create Propagator Prop;', 'Prop.FM = PointMass;', 'Prop.Type = PrinceDormand78;', '');
    const legs = [];
    p.orbits.forEach((o, k) => { if (k) legs.push({ from: p.orbits[k - 1].el, to: o.el, mid: o.mid, dv: o.dv, n: o.name || ('Orbita ' + (k + 1)) }); });
    const last = p.orbits[p.orbits.length - 1].el; if (p.eol && p.eol.el && p.eol.el !== last) legs.push({ from: last, to: p.eol.el, mid: p.eol.mid, dv: p.eol.dv, n: 'End of life' });
    legs.forEach((g, i) => { const n = i + 1; L.push('Create ImpulsiveBurn B' + n + 'a, B' + n + 'b;', 'Create Variable dv' + n + ';');
      ['a', 'b'].forEach(s => L.push('B' + n + s + '.CoordinateSystem = Local;', 'B' + n + s + '.Origin = ' + body + ';', 'B' + n + s + '.Axes = VNB;', 'B' + n + s + '.DecrementMass = false;')); });
    L.push('Create Variable dvTotal;', 'Create DifferentialCorrector DC;', 'DC.ShowProgress = false;', 'DC.MaximumIterations = 30;', 'DC.DerivativeMethod = ForwardDifference;', '');
    if (opts.report) L.push('Create ReportFile DVR;', "DVR.Filename = '" + String(opts.report).replace(/'/g, '') + "';", 'DVR.WriteHeaders = false;', 'DVR.Precision = 12;', '');
    else L.push('Create OrbitView View;', 'View.Add = {Sat, ' + body + '};', 'View.CoordinateSystem = ' + cs + ';', '');
    L.push('BeginMissionSequence;', '');
    const vary = (b, el, guess, step) => 'Vary DC(' + b + '.Element' + el + ' = ' + f(guess) + ', {Perturbation = 0.0001, Lower = -9.999999e300, Upper = 9.999999e300, MaxStep = ' + step + '});';
    legs.forEach((g, i) => { const n = i + 1, a1 = kep(g.from, B), a2 = kep(g.to, B), rp1 = a1.a * (1 - a1.e), ra1 = a1.a * (1 + a1.e), rp2 = a2.a * (1 - a2.e), ra2 = a2.a * (1 + a2.e), di = Math.abs(g.to.i - g.from.i) > 0.05, sci = 'Sat.' + (dest === 'leo' ? 'Earth' : body);
      L.push('% --- ' + g.n + ': game plan ' + f(g.dv || 0, 0) + ' m/s ---');
      const near = (ra, rb) => { let b = { d: Infinity }; [[0, ra[0]], [1, ra[1]]].forEach(([ia, x]) => rb.forEach((y, ib) => { if (Math.abs(x - y) < b.d) b = { d: Math.abs(x - y), ia, ib }; })); return b; };
      const dvg = Math.max(0.01, (g.dv || 0) / 1000), nGuess = (r, dI) => Math.sqrt(B.mu / r) * Math.abs(dI) * D2R * (dI >= 0 ? 1 : -1);
      if (g.mid) { const km = kep(g.mid, B), rpm = km.a * (1 - km.e), ram = km.a * (1 + km.e), pr = near([rp1, ra1], [rpm, ram]), atMidPe = pr.ib === 0, sg = atMidPe ? 1 : -1, other = atMidPe ? ram : rpm;
        L.push('Propagate Prop(Sat) {' + sci + '.' + (pr.ia === 0 ? 'Periapsis' : 'Apoapsis') + '};', 'Target DC {SolveMode = Solve, ExitMode = SaveAndContinue};',
          '   ' + vary('B' + n + 'a', 1, sg * dvg / 2, 0.5)); const d1 = g.mid.i - g.from.i, d2 = g.to.i - g.mid.i; if (di) L.push('   ' + vary('B' + n + 'a', 2, nGuess(pr.ia === 0 ? rp1 : ra1, d1), 0.5));
        L.push('   Maneuver B' + n + 'a(Sat);', '   Propagate Prop(Sat) {' + sci + '.' + (atMidPe ? 'Apoapsis' : 'Periapsis') + '};', '   Achieve DC(' + sci + '.RMAG = ' + f(other, 3) + ', {Tolerance = 0.1});'); if (di) L.push('   Achieve DC(Sat.' + cs + '.INC = ' + f(g.mid.i, 4) + ', {Tolerance = 0.001});');
        L.push('   ' + vary('B' + n + 'b', 1, sg * dvg / 2, 0.5)); if (di) L.push('   ' + vary('B' + n + 'b', 2, nGuess(other, d2), 0.5));
        L.push('   Maneuver B' + n + 'b(Sat);', '   Achieve DC(' + sci + '.SMA = ' + f((rp2 + ra2) / 2, 3) + ', {Tolerance = 0.1});'); if (di) L.push('   Achieve DC(Sat.' + cs + '.INC = ' + f(g.to.i, 4) + ', {Tolerance = 0.001});'); L.push('EndTarget;'); }
      else { const pr = near([rp1, ra1], [rp2, ra2]), sg = (rp2 + ra2) / 2 >= (rp1 + ra1) / 2 ? 1 : -1;
        L.push('Propagate Prop(Sat) {' + sci + '.' + (pr.ia === 0 ? 'Periapsis' : 'Apoapsis') + '};', 'Target DC {SolveMode = Solve, ExitMode = SaveAndContinue};', '   ' + vary('B' + n + 'a', 1, Math.abs(a2.a - a1.a) < 1 ? 0.001 * sg : sg * dvg, 0.5)); if (di) L.push('   ' + vary('B' + n + 'a', 2, nGuess(pr.ia === 0 ? rp1 : ra1, g.to.i - g.from.i), 0.5));
        L.push('   Maneuver B' + n + 'a(Sat);', '   Achieve DC(' + sci + '.SMA = ' + f((rp2 + ra2) / 2, 3) + ', {Tolerance = 0.1});'); if (di) L.push('   Achieve DC(Sat.' + cs + '.INC = ' + f(g.to.i, 4) + ', {Tolerance = 0.001});'); L.push('EndTarget;'); }
      L.push('GMAT dv' + n + ' = (sqrt(B' + n + 'a.Element1^2 + B' + n + 'a.Element2^2 + B' + n + 'a.Element3^2) + sqrt(B' + n + 'b.Element1^2 + B' + n + 'b.Element2^2 + B' + n + 'b.Element3^2)) * 1000;  % m/s, game: ' + f(g.dv || 0, 0), ''); });
    L.push('GMAT dvTotal = ' + (legs.length ? legs.map((g, i) => 'dv' + (i + 1)).join(' + ') : '0') + ';  % m/s'); if (opts.report) L.push('Report DVR ' + (legs.length ? legs.map((g, i) => 'dv' + (i + 1)).join(' ') : 'dvTotal')); else L.push('Propagate Prop(Sat) {Sat.ElapsedSecs = 86400};'); L.push('');
    return L.join('\n').replace(/ΔV/g, 'delta-V').replace(/[^\x00-\x7f]/g, '-'); } // GMAT rifiuta i caratteri non ASCII negli script
  // Modello fisico per corpo: campo di gravità, corpi perturbanti e atmosfera (GMAT non ha un'atmosfera di Venere: nessuna resistenza)
  const GMCFG = { leo: { b: 'Earth', field: 'JGM2.cof', deg: 4, pm: [], drag: 'JacchiaRoberts' }, moon: { b: 'Luna', field: 'LP165P.cof', deg: 20, pm: ['Earth', 'Sun'] },
    mars: { b: 'Mars', field: 'Mars50c.cof', deg: 20, pm: ['Sun'], drag: 'Exponential' }, venus: { b: 'Venus', field: 'MGNP180U.cof', deg: 20, pm: ['Sun'] } };
  const FIXED_EPOCH = '01 Jan 2027 12:00:00.000'; // il gioco non ha un calendario: data fissa
  function gmForce(dest, o) { o = o || {}; const c = GMCFG[dest], deg = o.deg != null ? o.deg : c.deg, L = ['Create ForceModel FM;', 'FM.CentralBody = ' + c.b + ';', 'FM.PrimaryBodies = {' + c.b + '};', 'FM.GravityField.' + c.b + '.Degree = ' + deg + ';', 'FM.GravityField.' + c.b + '.Order = ' + (o.order != null ? o.order : deg) + ';', 'FM.GravityField.' + c.b + ".PotentialFile = '" + c.field + "';"];
    if (c.pm.length) L.push('FM.PointMasses = {' + c.pm.join(', ') + '};');
    if (c.drag === 'JacchiaRoberts') { const f = o.f107 || 150; L.push('FM.Drag.AtmosphereModel = JacchiaRoberts;', "FM.Drag.HistoricWeatherSource = 'ConstantFluxAndGeoMag';", "FM.Drag.PredictedWeatherSource = 'ConstantFluxAndGeoMag';", 'FM.Drag.F107 = ' + f + ';', 'FM.Drag.F107A = ' + f + ';', 'FM.Drag.MagneticIndex = 3;'); }
    else if (c.drag) L.push('FM.Drag.AtmosphereModel = ' + c.drag + ';'); else L.push('FM.Drag = None;');
    L.push('FM.SRP = Off;', '', 'Create Propagator Prop;', 'Prop.FM = FM;', 'Prop.Type = PrinceDormand78;'); if (o.accuracy) L.push('Prop.Accuracy = ' + o.accuracy + ';'); L.push(''); return L; }
  function gmSat(dest, req, area) { const B = BODY[dest], c = GMCFG[dest], cs = dest === 'leo' ? 'EarthMJ2000Eq' : c.b + 'MJ2000Eq', k0 = kep(req.el, B), f = (x, d) => Number(x).toFixed(d == null ? 6 : d), L = [];
    if (dest !== 'leo') L.push('Create CoordinateSystem ' + cs + ';', cs + '.Origin = ' + c.b + ';', cs + '.Axes = MJ2000Eq;', '');
    L.push('Create Spacecraft Sat;', 'Sat.DateFormat = UTCGregorian;', "Sat.Epoch = '" + FIXED_EPOCH + "';", 'Sat.CoordinateSystem = ' + cs + ';', 'Sat.DisplayStateType = Keplerian;', 'Sat.SMA = ' + f(k0.a) + ';', 'Sat.ECC = ' + f(Math.max(k0.e, 1e-4)) + ';', 'Sat.INC = ' + f(req.el.i) + ';', 'Sat.RAAN = ' + f(m360(req.el.raan || 0)) + ';', 'Sat.AOP = ' + f(m360(req.el.argp || 0)) + ';', 'Sat.TA = 0;',
      'Sat.DryMass = ' + f(Math.max(1, req.mass || 4), 3) + ';', 'Sat.Cd = 2.2;', 'Sat.DragArea = ' + f(Math.max(0.001, area != null ? area : (req.area || 0.03)), 4) + ';', 'Sat.SRPArea = ' + f(Math.max(0.001, req.area || 0.03), 4) + ';', ''); return { L, cs, k0, B, c }; }

  // sezione d'urto media del satellite (m2) per la resistenza: 0,015 m2 per unità, un po' di più con le ali solari dispiegabili (approssimazione)
  const satArea = d => { const U = (E.RIDES[d.ride] || { U: 3 }).U, s = typeof d.sol === 'string' ? E.PARTS[d.sol] : null, wing = s && /dispieg|ali solari/i.test(s.n || '') ? 0.02 * U : 0; return Math.round((0.015 * U + wing) * 1000) / 1000; };
  // Stazioni di terra del gioco (GMAT calcola la visibilità): Milano sempre, Svalbard con l'edificio di terra, Canberra con la prima parabola
  const STATIONS = [{ k: 'milan', n: 'Milano', lat: 45.4642, lon: 9.19 }, { k: 'svalbard', n: 'Svalbard', lat: 78.2298, lon: 15.3878 }, { k: 'canberra', n: 'Canberra', lat: -35.4017, lon: 148.9817 }];
  // Analisi GMAT di un'orbita di lavoro, per ogni corpo: eclisse (EclipseLocator), contatti con le stazioni (ContactLocator) ed evoluzione dell'orbita
  // (resistenza e gravità per la Terra e Marte, perturbazioni di Terra e Sole per la Luna e Venere). req = { dest, el:{pe,ap,i,raan,argp}, mass, area }; opts.files = { ecl, con, st }.
  const ANALYSIS_DAYS = 30, ANTHR = { leo: 140, moon: 3, mars: 100, venus: 150 };
  function gmatAnalysis(req, opts) { opts = opts || {}; const F = opts.files || {}, dest = req.dest || 'leo', q = s => "'" + String(s).replace(/'/g, '') + "'", S = gmSat(dest, req), c = S.c, cs = S.cs, B = S.B, k0 = S.k0, leo = dest === 'leo', L = [];
    L.push('% Space Mission Design Game: GMAT analysis of the working orbit (' + c.b + ')', '', ...S.L, ...gmForce(dest));
    STATIONS.forEach(s => L.push('Create GroundStation ' + s.k + ';', s.k + '.StateType = Spherical;', s.k + '.Location1 = ' + s.lat.toFixed(4) + ';', s.k + '.Location2 = ' + s.lon.toFixed(4) + ';', s.k + '.Location3 = 0;', s.k + '.MinimumElevationAngle = 5;', ''));
    L.push('Create ContactLocator CL;', 'CL.Target = Sat;', 'CL.Filename = ' + q(F.con || 'contacts.txt') + ';', 'CL.Observers = {' + STATIONS.map(s => s.k).join(', ') + '};'); if (!leo) L.push('CL.OccultingBodies = {' + c.b + '};');
    L.push('CL.WriteReport = true;', 'CL.RunMode = Automatic;', 'CL.UseEntireInterval = true;', 'CL.StepSize = 60;', 'CL.LightTimeDirection = Transmit;', 'CL.UseLightTimeDelay = ' + (leo ? 'false' : 'true') + ';', 'CL.UseStellarAberration = false;', '');
    L.push('Create EclipseLocator EL;', 'EL.Spacecraft = Sat;', 'EL.Filename = ' + q(F.ecl || 'eclipse.txt') + ';', 'EL.OccultingBodies = {' + c.b + '};', 'EL.WriteReport = true;', 'EL.RunMode = Automatic;', 'EL.UseEntireInterval = true;', 'EL.StepSize = 60;', 'EL.UseLightTimeDelay = false;', 'EL.UseStellarAberration = false;', '');
    // Il SMA osculatore oscilla di diversi km in un'orbita (J2): le misure sono medie su un'orbita intera all'inizio e alla fine.
    // colonne: giorni, SMA, ECC, raggio del pericentro, RAAN, inclinazione, distanza dalla Terra
    const vars = ['Sat.ElapsedDays', 'Sat.' + c.b + '.SMA', 'Sat.' + c.b + '.ECC', 'Sat.' + c.b + '.RadPer', 'Sat.' + cs + '.RAAN', 'Sat.' + cs + '.INC', 'Sat.Earth.RMAG'].join(' '), steps = Math.ceil(2 * Math.PI * Math.sqrt(k0.a ** 3 / B.mu) / 60) + 2;
    L.push('Create Variable I;', 'Create ReportFile ST;', 'ST.Filename = ' + q(F.st || 'state.txt') + ';', 'ST.WriteHeaders = false;', 'ST.Precision = 12;', '', 'BeginMissionSequence;', '');
    // la propagazione si ferma poco sopra la superficie (o al limite dell'atmosfera): un'orbita che cade prima dei 30 giorni non deve far fallire i localizzatori
    const thr = ANTHR[dest], alive = 'Sat.' + c.b + '.Altitude > ' + (thr + 1), win = () => L.push("For 'Window' I = 1:1:" + steps + ';', "   If 'Alive' " + alive, '      Propagate Prop(Sat) {Sat.ElapsedSecs = 60};', '      Report ST ' + vars, '   EndIf;', 'EndFor;');
    win(); L.push('Propagate Prop(Sat) {Sat.ElapsedDays = ' + ANALYSIS_DAYS + ', Sat.' + c.b + '.Altitude = ' + thr + '};', 'Report ST ' + vars); win(); L.push('');
    return L.join('\n').replace(/[^\x00-\x7f]/g, '-'); }

  // Vita dell'orbita: propagazione fino al rientro (Terra, Marte: resistenza) o all'impatto / all'atmosfera (Luna, Venere: perturbazioni).
  // req = { dest, el, mass, area, scenario: nom | max | min | sail, sailArea }. Terra: 3 livelli di attività solare (F10.7 150 / 230 / 70). Tetto: 5 anni (regola FCC/ESA) o 1 anno.
  const LIFE = { leo: { thr: 140, cap: 1825, deg: 2, order: 0 }, mars: { thr: 100, cap: 1825, deg: 2, order: 0 }, moon: { thr: 3, cap: 365, deg: 20 }, venus: { thr: 150, cap: 365, deg: 20 } }; // stesso campo di gravità e stessa soglia dell'analisi: i due risultati devono concordare
  const F107 = { nom: 150, max: 230, min: 70, sail: 150 };
  function gmatLifetime(req, opts) { opts = opts || {}; const dest = req.dest || 'leo', sc = req.scenario || 'nom', lf = LIFE[dest], c = GMCFG[dest], file = String((opts.files || {}).st || 'life.txt').replace(/'/g, ''), area = sc === 'sail' ? Math.max(req.area || 0.03, req.sailArea || 1.0) : req.area;
    const S = gmSat(dest, req, area), L = ['% Space Mission Design Game: GMAT lifetime (' + c.b + ', ' + sc + ')', '', ...S.L, ...gmForce(dest, { f107: F107[sc], deg: lf.deg, order: lf.order, accuracy: '1e-8' }),
      'Create ReportFile ST;', "ST.Filename = '" + file + "';", 'ST.WriteHeaders = false;', 'ST.Precision = 10;', '', 'BeginMissionSequence;', '',
      'Propagate Prop(Sat) {Sat.ElapsedDays = ' + lf.cap + ', Sat.' + c.b + '.Altitude = ' + lf.thr + '};', 'Report ST Sat.ElapsedDays Sat.' + c.b + '.Altitude', ''];
    return L.join('\n').replace(/[^\x00-\x7f]/g, '-'); }
  const fmt = el => Math.round(el.pe) + ' × ' + (isFinite(el.ap) ? Math.round(el.ap) : '∞') + ' km · i ' + Math.round(el.i) + '°';
  const HOOK = { refProp: null, gmat: null, gmatAn: null, gmatLf: null };
  return { gmat, gmatAnalysis, gmatLifetime, LIFE, STATIONS, nuFromM, hook: HOOK, ECL, ATMH, atmRisk, transfer, legEl, eMax, tle, kep, pqK, work, workEl, frac, ZONES, LAND, zoneOf, landOf, goal, autoBurns, strategies, stmt, BODY, TYPES, state, elements, burn, plan, target, initial, fmt, D2R };
})();
if (typeof module !== 'undefined') module.exports = O;
