/* ===== MINIGIOCHI DELLE PROVE (v40: grafica nuova) =====
   Tre giochi brevi (6–10 s) che si avviano quando una prova parte:
   - vib  (tavola vibrante): trascina il dito avanti e indietro per tenere la vibrazione nella fascia giusta;
   - mass (massa e baricentro): tocca a sinistra / a destra per tenere il satellite in equilibrio;
   - tvac (termovuoto): ferma la temperatura nella zona verde, tre volte.
   Il punteggio (0–1) accorcia la prova; i difetti nascosti restano quelli di prima: il gioco non cambia l'esito.
   Si può sempre saltare. Nessuna dipendenza: canvas 2D e pointer events. */
window.GNGMINI = (function () {
  'use strict';
  let LANG_EN = true;
  const EN = () => LANG_EN;
  const T = (it, en) => (EN() ? en : it);
  const KINDS = { vib: 1, mass: 1, tvac: 1 };
  const has = k => !!KINDS[k];
  let open = false;

  function shell(title, help, info) {
    const el = document.createElement('div');
    el.id = 'mg';
    el.innerHTML = '<div class="mgb" role="dialog" aria-modal="true"><div class="mgh"><b></b><span class="mgs"></span></div><p class="mgt"></p><canvas></canvas><div class="mgr"><button class="lnk" type="button" data-mg="skip"></button><button class="mgbig" type="button" data-mg="go"></button></div></div>';
    el.querySelector('.mgh b').textContent = title;
    el.querySelector('.mgt').textContent = help;
    el.querySelector('.mgs').textContent = info || '';
    el.querySelector('[data-mg="skip"]').textContent = T('Salta: prova normale', 'Skip: normal test');
    el.querySelector('[data-mg="go"]').textContent = T('Via!', 'Start!');
    document.body.appendChild(el);
    return el;
  }

  function sizeCanvas(cv) {
    const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(10, Math.round(r.width * d)); cv.height = Math.max(10, Math.round(r.height * d));
    const g = cv.getContext('2d'); g.setTransform(d, 0, 0, d, 0, 0);
    return { g, W: r.width, H: r.height };
  }

  function play(kind, opt, done) {
    if (!has(kind) || open) { done(null); return; }
    open = true; LANG_EN = !(opt && opt.en === false);
    const G = GAMES[kind];
    const el = shell(G.title(), G.help(), '');
    const cv = el.querySelector('canvas'), btn = el.querySelector('[data-mg="go"]'), skip = el.querySelector('[data-mg="skip"]'), sc = el.querySelector('.mgs');
    let raf = 0, state = null, finished = false;
    const finish = score => {
      if (finished) return; finished = true; cancelAnimationFrame(raf);
      const s = score == null ? null : Math.max(0, Math.min(1, score));
      if (s == null) { close(null); return; }
      const lab = s >= 0.8 ? ['ok', T('Perfetto!', 'Perfect!')] : s >= 0.45 ? ['mid', T('Buono', 'Good')] : ['bad', T('Da rifare… la prova va avanti normale', 'Rough… the test runs at normal speed')];
      const p = document.createElement('div'); p.className = 'mgres ' + lab[0]; p.textContent = lab[1] + ' · ' + Math.round(s * 100) + '%';
      cv.replaceWith(p); el.querySelector('.mgt').textContent = s >= 0.45 ? T('La prova finisce prima.', 'The test finishes sooner.') : '';
      btn.textContent = 'OK'; btn.hidden = false; skip.hidden = true; btn.onclick = () => close(s);
      setTimeout(() => { if (document.getElementById('mg')) close(s); }, 1800);
    };
    const close = s => { if (!open) return; open = false; cancelAnimationFrame(raf); el.remove(); done(s); };
    skip.onclick = () => { finished = true; close(null); };
    const frame = t => { if (finished) return; const r = G.step(state, t, sz); sc.textContent = r.label || ''; G.draw(state, sz); if (r.done) finish(r.score); else raf = requestAnimationFrame(frame); };
    let sz = null;
    btn.onclick = () => {
      btn.hidden = true; sz = sizeCanvas(cv); state = G.init(sz, cv, performance.now()); API._s = state; raf = requestAnimationFrame(frame);
    };
    // anteprima ferma, cosi' si capisce subito cosa fare
    requestAnimationFrame(() => { sz = sizeCanvas(cv); const s0 = G.init(sz, cv, performance.now(), true); G.draw(s0, sz); });
  }

  /* ---------- disegno condiviso ---------- */
  const C = { bg: '#0E1118', ink: '#F1ECE6', mute: '#6E7686', ok: '#3FC77E', warn: '#F2C14E', bad: '#FF7A6B', acc: '#F07B3F', teal: '#7FD8CC' };
  /* sfondo da laboratorio: luce dall'alto, griglia sul pavimento, vignetta */
  function lab(g, W, H, tint) {
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, tint || '#16233A'); bg.addColorStop(0.62, '#0E1424'); bg.addColorStop(1, '#090C14');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const fy = H * 0.78; g.strokeStyle = 'rgba(127,216,204,.08)'; g.lineWidth = 1;
    for (let i = -12; i <= 12; i++) { g.beginPath(); g.moveTo(W / 2 + i * 22, fy); g.lineTo(W / 2 + i * 70, H); g.stroke(); }
    for (let k = 0; k < 5; k++) { const y = fy + (H - fy) * (k / 5) * (k / 5); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    const sp = g.createRadialGradient(W / 2, -H * 0.2, 10, W / 2, H * 0.3, H * 0.9); sp.addColorStop(0, 'rgba(160,200,255,.16)'); sp.addColorStop(1, 'rgba(160,200,255,0)');
    g.fillStyle = sp; g.fillRect(0, 0, W, H);
    const vg = g.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.max(W, H) * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
  }
  function rr(g, x, y, w, h, r) { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); }
  /* CubeSat 3U: binari scuri, celle solari, antenna ripiegata; con wings le ali aperte */
  function sat(g, x, y, s, rot, wings) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = 'rgba(0,0,0,.28)'; g.beginPath(); g.ellipse(0, 34, 30, 5, 0, 0, 6.3); g.fill();
    if (wings) {
      [-1, 1].forEach(d => { const x0 = d < 0 ? -66 : 22; const wg = g.createLinearGradient(x0, -14, x0, 14); wg.addColorStop(0, '#2E5FA8'); wg.addColorStop(1, '#1D3E78');
        g.fillStyle = wg; rr(g, x0, -14, 44, 28, 2); g.fill(); g.strokeStyle = '#9FB3CF'; g.lineWidth = 1.2; g.stroke();
        g.strokeStyle = 'rgba(160,200,255,.35)'; g.lineWidth = .8; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x0 + k * 11, -14); g.lineTo(x0 + k * 11, 14); g.stroke(); } g.beginPath(); g.moveTo(x0, 0); g.lineTo(x0 + 44, 0); g.stroke();
        g.fillStyle = '#8A93A3'; g.fillRect(d < 0 ? -22 : 18, -2, 4, 4); });
    }
    const bd = g.createLinearGradient(-20, 0, 20, 0); bd.addColorStop(0, '#AEB7C4'); bd.addColorStop(0.45, '#EEF2F7'); bd.addColorStop(1, '#8D97A6');
    g.fillStyle = bd; rr(g, -20, -30, 40, 60, 3); g.fill();
    for (let r = 0; r < 3; r++) { const cy = -27 + r * 19; const cg = g.createLinearGradient(-15, cy, 15, cy + 16); cg.addColorStop(0, '#2C5DAF'); cg.addColorStop(1, '#173A74'); g.fillStyle = cg; g.fillRect(-15, cy, 30, 16);
      g.strokeStyle = 'rgba(170,205,255,.45)'; g.lineWidth = .7; g.beginPath(); g.moveTo(0, cy); g.lineTo(0, cy + 16); g.moveTo(-15, cy + 8); g.lineTo(15, cy + 8); g.stroke(); }
    g.fillStyle = '#3A4252'; [-20, 17].forEach(xx => g.fillRect(xx, -30, 3, 60)); g.fillRect(-20, -30, 40, 3); g.fillRect(-20, 27, 40, 3);
    g.strokeStyle = '#C9D0DA'; g.lineWidth = 1.4; g.beginPath(); g.moveTo(6, -30); g.lineTo(14, -40); g.stroke(); g.fillStyle = '#F07B3F'; g.beginPath(); g.arc(14, -41, 2.2, 0, 6.3); g.fill();
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(-18, -28, 3, 56);
    g.restore();
  }
  /* misuratore arrotondato con fascia verde luminosa */
  function bar(g, x, y, w, h, v, lo, hi) {
    g.fillStyle = '#121826'; rr(g, x, y, w, h, h / 2); g.fill(); g.strokeStyle = 'rgba(255,255,255,.08)'; g.lineWidth = 1; g.stroke();
    g.save(); rr(g, x, y, w, h, h / 2); g.clip();
    g.fillStyle = 'rgba(63,199,126,.22)'; g.fillRect(x + w * lo, y, w * (hi - lo), h);
    const ok = v >= lo && v <= hi, c = ok ? C.ok : v > hi ? C.bad : C.warn, fw = w * Math.max(0, Math.min(1, v));
    const fg = g.createLinearGradient(x, 0, x + fw, 0); fg.addColorStop(0, 'rgba(255,255,255,.05)'); fg.addColorStop(1, c); g.fillStyle = fg; g.fillRect(x, y, fw, h);
    g.restore();
    g.strokeStyle = C.ok; g.lineWidth = 2; g.setLineDash([3, 3]); [lo, hi].forEach(q => { g.beginPath(); g.moveTo(x + w * q, y - 3); g.lineTo(x + w * q, y + h + 3); g.stroke(); }); g.setLineDash([]);
    if (ok) { g.shadowColor = C.ok; g.shadowBlur = 12; g.fillStyle = C.ok; g.beginPath(); g.arc(x + fw, y + h / 2, h * 0.55, 0, 6.3); g.fill(); g.shadowBlur = 0; }
  }
  function prog(g, W, H, f) { g.fillStyle = 'rgba(255,255,255,.08)'; rr(g, 16, H - 12, W - 32, 5, 2.5); g.fill(); if (f > 0) { g.fillStyle = C.ok; rr(g, 16, H - 12, Math.max(5, (W - 32) * Math.min(1, f)), 5, 2.5); g.fill(); } }

  const GAMES = {
    /* --- tavola vibrante: muovi il dito avanti e indietro, abbastanza veloce ma non troppo --- */
    vib: {
      title: () => T('Tavola vibrante', 'Shaker table'),
      help: () => T('Trascina il dito avanti e indietro: tieni la vibrazione nella fascia verde per 6 secondi.', 'Swipe back and forth: keep the vibration in the green band for 6 seconds.'),
      init(sz, cv, t0, idle) {
        const s = { t0, idle, energy: idle ? 0.55 : 0, spd: 0, inBand: 0, lastX: null, lastT: t0, px: sz.W / 2, dur: 6000, total: 0 };
        if (!idle) {
          const mv = e => { const r = cv.getBoundingClientRect(), x = e.clientX - r.left, t = performance.now(); if (s.lastX != null) { const v = Math.abs(x - s.lastX) / Math.max(8, t - s.lastT); s.spd = s.spd * 0.7 + v * 0.3; } s.lastX = x; s.lastT = t; s.px = x; };
          cv.onpointerdown = e => { cv.setPointerCapture && cv.setPointerCapture(e.pointerId); s.lastX = null; mv(e); };
          cv.onpointermove = e => { if (e.buttons || e.pointerType === 'touch') mv(e); };
        }
        return s;
      },
      step(s, t) {
        const dt = Math.min(50, t - s.lastStep || 16); s.lastStep = t;
        if (performance.now() - s.lastT > 150) s.spd *= Math.exp(-dt / 200); const target = Math.min(1.2, s.spd / 2.2); s.energy += (target - s.energy) * Math.min(1, dt / 120);
        const el = t - s.t0; s.total = el;
        if (s.energy >= 0.40 && s.energy <= 0.85) s.inBand += dt;
        const left = Math.max(0, s.dur - el);
        return { label: (left / 1000).toFixed(1) + ' s', done: el >= s.dur, score: s.inBand / s.dur / 0.85 };
      },
      draw(s, { g, W, H }) {
        lab(g, W, H);
        const amp = s.energy * 14, t = performance.now() / 28, jy = Math.sin(t) * amp * 0.55, jx = Math.cos(t * 1.3) * amp * 0.25, inb = s.energy >= 0.40 && s.energy <= 0.85;
        const cx = W / 2, by = H * 0.80, tw = Math.min(W * 0.5, 300);
        /* macchina: base, molle, piatto a strisce gialle e nere */
        const bg2 = g.createLinearGradient(0, by - 18, 0, by + 14); bg2.addColorStop(0, '#3B4456'); bg2.addColorStop(1, '#1D222E'); g.fillStyle = bg2; rr(g, cx - tw / 2 - 16, by - 10, tw + 32, 24, 4); g.fill();
        g.fillStyle = '#8A93A3'; for (let k = 0; k < 6; k++) g.fillRect(cx - tw / 2 - 8 + k * (tw + 16) / 5 - 2, by - 4, 4, 4);
        g.strokeStyle = '#7C8596'; g.lineWidth = 3; [-0.36, 0.36].forEach(f => { g.beginPath(); for (let k = 0; k <= 8; k++) { const yy = by - 10 - k * (18 + jy) / 8; g.lineTo(cx + f * tw + (k % 2 ? 6 : -6), yy); } g.stroke(); });
        const py = by - 34 + jy;
        g.save(); rr(g, cx - tw / 2 + jx, py, tw, 14, 3); g.clip(); g.fillStyle = '#F2C14E'; g.fillRect(cx - tw / 2 + jx, py, tw, 14); g.fillStyle = '#1E2230'; for (let k = -2; k < tw / 14 + 2; k++) { g.beginPath(); g.moveTo(cx - tw / 2 + jx + k * 18, py + 14); g.lineTo(cx - tw / 2 + jx + k * 18 + 9, py); g.lineTo(cx - tw / 2 + jx + k * 18 + 16, py); g.lineTo(cx - tw / 2 + jx + k * 18 + 7, py + 14); g.fill(); } g.restore();
        /* satellite che vibra, con scie di movimento */
        const sk = Math.min(1.25, H / 175), sy = py - 32 * sk;
        if (amp > 2) { g.globalAlpha = 0.18; sat(g, cx + jx * 0.6, sy - jy * 0.9, sk, 0); g.globalAlpha = 1; }
        sat(g, cx + jx, sy + jy * 0.4, sk, 0);
        if (inb && !s.idle) { g.strokeStyle = 'rgba(63,199,126,.55)'; g.lineWidth = 2; for (let k = 0; k < 3; k++) { const r = 44 * sk + k * 10 + (t * 2 % 10); g.globalAlpha = 0.5 - k * 0.15; g.beginPath(); g.arc(cx, sy, r, -2.6, -0.5); g.stroke(); g.beginPath(); g.arc(cx, sy, r, 0.5, 2.6); g.stroke(); } g.globalAlpha = 1; }
        bar(g, 16, 12, W - 32, 12, s.energy / 1.2, 0.40 / 1.2, 0.85 / 1.2);
        g.fillStyle = inb ? C.ok : C.mute; g.font = '700 11px system-ui,sans-serif'; g.fillText(inb ? T('vibrazione giusta!', 'right vibration!') : s.energy > 0.85 ? T('troppo forte', 'too strong') : T('vibrazione', 'vibration'), 16, 40);
        if (!s.idle) prog(g, W, H, s.inBand / (s.dur * 0.85));
        /* dito guida */
        const hx = s.idle ? cx + Math.sin(performance.now() / 260) * tw * 0.32 : s.px; g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(hx, H * 0.93, 9, 0, 6.3); g.fill();
        if (s.idle) { g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '700 12px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('◀  ' + T('scorri', 'swipe') + '  ▶', cx, H * 0.93 - 14); g.textAlign = 'left'; }
      }
    },

    /* --- massa e baricentro: tocca il lato che si alza per riportarlo in equilibrio --- */
    mass: {
      title: () => T('Massa e baricentro', 'Mass and balance'),
      help: () => T('Il satellite si inclina: tocca a sinistra o a destra per tenerlo dritto per 7 secondi.', 'The satellite tips over: tap left or right to keep it level for 7 seconds.'),
      init(sz, cv, t0, idle) {
        const s = { t0, idle, a: idle ? 0.08 : 0.02, v: 0, ok: 0, dur: 7000, push: 0 };
        if (!idle) cv.onpointerdown = e => { const r = cv.getBoundingClientRect(); s.push = (e.clientX - r.left < r.width / 2 ? -1 : 1); s.v += s.push * 0.00045; };
        return s;
      },
      step(s, t) {
        const dt = Math.min(50, t - s.last || 16); s.last = t; const el = t - s.t0;
        const wobble = Math.sin(el / 900) * 0.0000011 + Math.sin(el / 310) * 0.0000007;
        s.v += (s.a * 0.0000013 + wobble) * dt; s.v *= Math.pow(0.985, dt / 16); s.a = Math.max(-0.7, Math.min(0.7, s.a + s.v * dt)); if (Math.abs(s.a) >= 0.7) s.v = 0;
        if (Math.abs(s.a) < 0.15) s.ok += dt;
        return { label: ((s.dur - el) / 1000).toFixed(1) + ' s', done: el >= s.dur, score: s.ok / s.dur / 0.8 };
      },
      draw(s, { g, W, H }) {
        lab(g, W, H, '#1A2236');
        const ok = Math.abs(s.a) < 0.15, cx = W / 2, fy = H * 0.66;
        /* metà schermo che si tocca: si illumina il lato giusto */
        const side = s.a > 0.05 ? -1 : s.a < -0.05 ? 1 : 0;
        if (side) { const lg = g.createLinearGradient(side < 0 ? 0 : W, 0, cx, 0); lg.addColorStop(0, 'rgba(240,123,63,.18)'); lg.addColorStop(1, 'rgba(240,123,63,0)'); g.fillStyle = lg; g.fillRect(side < 0 ? 0 : cx, 0, cx, H); }
        /* fulcro */
        const fg = g.createLinearGradient(cx - 22, 0, cx + 22, 0); fg.addColorStop(0, '#5B6576'); fg.addColorStop(0.5, '#9AA4B4'); fg.addColorStop(1, '#4A5262');
        g.fillStyle = fg; g.beginPath(); g.moveTo(cx - 24, H * 0.9); g.lineTo(cx + 24, H * 0.9); g.lineTo(cx, fy + 2); g.closePath(); g.fill();
        g.fillStyle = '#2A303C'; rr(g, cx - 40, H * 0.9, 80, 8, 3); g.fill();
        /* trave */
        g.save(); g.translate(cx, fy); g.rotate(s.a);
        const bw = Math.min(W * 0.56, 340); const tg = g.createLinearGradient(0, -8, 0, 4); tg.addColorStop(0, ok ? '#5BE39A' : '#F6D06A'); tg.addColorStop(1, ok ? '#2E9F63' : '#C99A2E');
        g.fillStyle = tg; rr(g, -bw / 2, -8, bw, 9, 3); g.fill(); g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = -4; k <= 4; k++) g.fillRect(k * bw / 10 - 1, -6, 2, 5);
        g.fillStyle = '#E9EEF4'; g.beginPath(); g.arc(0, -3, 4, 0, 6.3); g.fill();
        g.restore();
        const sk = Math.min(1.05, H / 200), dd = 40 * sk; sat(g, cx + Math.sin(s.a) * dd, fy - 8 - Math.cos(s.a) * dd, sk, s.a, true);
        /* livella a bolla in alto */
        const lw = Math.min(220, W * 0.4), lx = cx - lw / 2, ly = 14; g.fillStyle = '#121826'; rr(g, lx, ly, lw, 16, 8); g.fill(); g.strokeStyle = 'rgba(255,255,255,.12)'; g.stroke();
        g.fillStyle = 'rgba(63,199,126,.25)'; g.fillRect(cx - lw * 0.11, ly + 2, lw * 0.22, 12);
        const bx = cx + Math.max(-1, Math.min(1, s.a / 0.7)) * (lw / 2 - 10); g.fillStyle = ok ? C.ok : C.warn; g.shadowColor = g.fillStyle; g.shadowBlur = ok ? 10 : 0; g.beginPath(); g.ellipse(bx, ly + 8, 9, 5.5, 0, 0, 6.3); g.fill(); g.shadowBlur = 0;
        g.fillStyle = 'rgba(255,255,255,.55)'; g.font = '700 12px system-ui,sans-serif'; g.textAlign = 'center';
        g.fillText('◀ ' + T('tocca qui', 'tap here'), W * 0.16, H * 0.42); g.fillText(T('tocca qui', 'tap here') + ' ▶', W * 0.84, H * 0.42); g.textAlign = 'left';
        if (!s.idle) prog(g, W, H, s.ok / (s.dur * 0.8));
      }
    },

    /* --- termovuoto: ferma la lancetta della temperatura nella zona verde (3 volte) --- */
    tvac: {
      title: () => T('Camera termovuoto', 'Thermal vacuum'),
      help: () => T('La temperatura sale e scende: tocca quando la lancetta è nella zona verde. Tre cicli.', 'Temperature swings up and down: tap when the needle is in the green zone. Three cycles.'),
      init(sz, cv, t0, idle) {
        const s = { t0, idle, round: 0, hits: [], x: 0.2, speed: 0.0008, dir: 1, zone: [0.62, 0.80], flash: 0, wait: 0 };
        if (!idle) cv.onpointerdown = () => {
          if (s.wait > 0 || s.round >= 3) return; const c = (s.zone[0] + s.zone[1]) / 2, half = (s.zone[1] - s.zone[0]) / 2;
          const d = Math.abs(s.x - c); s.hits.push(d <= half ? 1 - d / half * 0.35 : Math.max(0, 0.4 - (d - half) * 3)); s.flash = 1; s.wait = 450; s.round++;
          s.zone = s.round === 1 ? [0.16, 0.32] : [0.47, 0.61]; s.speed *= 1.2;
        };
        return s;
      },
      step(s, t) {
        const dt = Math.min(50, t - s.last || 16); s.last = t;
        if (s.wait > 0) s.wait -= dt; else { s.x += s.dir * s.speed * dt; if (s.x > 1) { s.x = 1; s.dir = -1; } if (s.x < 0) { s.x = 0; s.dir = 1; } }
        s.flash = Math.max(0, s.flash - dt / 300);
        const done = s.round >= 3 && s.wait <= 0 || (t - s.t0) > 15000;
        const score = s.hits.length ? s.hits.reduce((a, b) => a + b, 0) / 3 : 0;
        return { label: Math.min(3, s.round + 1) + ' / 3', done, score };
      },
      draw(s, { g, W, H }) {
        lab(g, W, H, '#151B30');
        /* camera termovuoto con oblò: dentro il satellite, la luce cambia col calore */
        const ccx = W * 0.24, ccy = H * 0.52, R = Math.min(H * 0.36, W * 0.17);
        const hot = s.x, glow = hot < 0.5 ? 'rgba(80,150,255,' + (0.5 - hot) * 0.8 + ')' : 'rgba(255,110,70,' + (hot - 0.5) * 0.8 + ')';
        const cg = g.createRadialGradient(ccx - R * 0.3, ccy - R * 0.3, 4, ccx, ccy, R * 1.25); cg.addColorStop(0, '#E4E9EF'); cg.addColorStop(1, '#7D8796'); g.fillStyle = cg; g.beginPath(); g.arc(ccx, ccy, R * 1.22, 0, 6.3); g.fill();
        for (let k = 0; k < 12; k++) { const a = k / 12 * 6.283; g.fillStyle = '#4C5462'; g.beginPath(); g.arc(ccx + Math.cos(a) * R * 1.11, ccy + Math.sin(a) * R * 1.11, 2.4, 0, 6.3); g.fill(); }
        g.fillStyle = '#0B1220'; g.beginPath(); g.arc(ccx, ccy, R, 0, 6.3); g.fill();
        g.save(); g.beginPath(); g.arc(ccx, ccy, R, 0, 6.3); g.clip(); g.fillStyle = glow; g.fillRect(ccx - R, ccy - R, 2 * R, 2 * R); sat(g, ccx, ccy, R / 46, 0); g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.ellipse(ccx - R * 0.35, ccy - R * 0.45, R * 0.5, R * 0.18, -0.5, 0, 6.3); g.fill(); g.restore();
        /* quadrante a semicerchio: freddo blu, caldo rosso, zona verde */
        const gx = W * 0.66, gy = H * 0.74, GR = Math.min(H * 0.55, W * 0.28), A0 = Math.PI, A1 = 2 * Math.PI, ang = q => A0 + (A1 - A0) * q;
        for (let k = 0; k < 40; k++) { const q0 = k / 40, q1 = (k + 1) / 40, c = q0 < 0.5 ? [61 + q0 * 2 * 60, 127 + q0 * 2 * 5, 224 - q0 * 2 * 90] : [122 + (q0 - .5) * 2 * 104, 132 - (q0 - .5) * 2 * 47, 134 - (q0 - .5) * 2 * 71];
          g.strokeStyle = 'rgb(' + c.map(Math.round).join(',') + ')'; g.lineWidth = 14; g.beginPath(); g.arc(gx, gy, GR, ang(q0), ang(q1) + 0.01); g.stroke(); }
        g.strokeStyle = 'rgba(63,199,126,.95)'; g.lineWidth = 22; g.shadowColor = C.ok; g.shadowBlur = 10; g.beginPath(); g.arc(gx, gy, GR, ang(s.zone[0]), ang(s.zone[1])); g.stroke(); g.shadowBlur = 0;
        g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = 1.5; for (let k = 0; k <= 10; k++) { const a = ang(k / 10); g.beginPath(); g.moveTo(gx + Math.cos(a) * (GR - 16), gy + Math.sin(a) * (GR - 16)); g.lineTo(gx + Math.cos(a) * (GR - 10), gy + Math.sin(a) * (GR - 10)); g.stroke(); }
        const na = ang(s.x); g.strokeStyle = s.flash > 0 ? '#fff' : '#F1ECE6'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(na) * (GR - 4), gy + Math.sin(na) * (GR - 4)); g.stroke(); g.lineCap = 'butt';
        g.fillStyle = '#2A303C'; g.beginPath(); g.arc(gx, gy, 9, 0, 6.3); g.fill(); g.fillStyle = '#F07B3F'; g.beginPath(); g.arc(gx, gy, 4, 0, 6.3); g.fill();
        if (s.flash > 0) { g.globalAlpha = s.flash; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(gx, gy, GR + 14 + (1 - s.flash) * 10, A0, A1); g.stroke(); g.globalAlpha = 1; }
        const tc = Math.round(-150 + 270 * s.x); g.fillStyle = '#F1ECE6'; g.font = '800 20px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText((tc > 0 ? '+' : '') + tc + ' °C', gx, gy - GR * 0.5);
        g.fillStyle = C.mute; g.font = '600 11px system-ui,sans-serif'; g.fillText('−150', gx - GR, gy + 18); g.fillText('+120', gx + GR, gy + 18); g.textAlign = 'left';
        s.hits.forEach((h, i) => { g.fillStyle = h >= 0.8 ? C.ok : h >= 0.45 ? C.warn : C.bad; g.beginPath(); g.arc(W - 70 + i * 22, 20, 7, 0, 6.3); g.fill(); });
        for (let i = s.hits.length; i < 3; i++) { g.strokeStyle = C.mute; g.lineWidth = 1.5; g.beginPath(); g.arc(W - 70 + i * 22, 20, 7, 0, 6.3); g.stroke(); }
      }
    }
  };

  const API = { has, play, get open() { return open; }, _s: null };
  return API;
})();
