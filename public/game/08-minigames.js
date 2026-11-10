/* ===== MINIGIOCHI DELLE PROVE (v39) =====
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
  function sat(g, x, y, s, rot) {
    g.save(); g.translate(x, y); g.rotate(rot || 0); g.scale(s, s);
    g.fillStyle = '#3D6FB0'; g.fillRect(-46, -8, 26, 16); g.fillRect(20, -8, 26, 16);
    g.strokeStyle = '#22313B'; g.lineWidth = 1.5; g.strokeRect(-46, -8, 26, 16); g.strokeRect(20, -8, 26, 16);
    g.fillStyle = '#D8DEE9'; g.fillRect(-20, -20, 40, 40); g.strokeRect(-20, -20, 40, 40);
    g.beginPath(); g.moveTo(-20, -7); g.lineTo(20, -7); g.moveTo(-20, 7); g.lineTo(20, 7); g.stroke();
    g.restore();
  }
  function bar(g, x, y, w, h, v, lo, hi) {
    g.fillStyle = '#1C212C'; g.fillRect(x, y, w, h);
    g.fillStyle = 'rgba(63,199,126,.35)'; g.fillRect(x + w * lo, y, w * (hi - lo), h);
    g.fillStyle = v >= lo && v <= hi ? C.ok : v > hi ? C.bad : C.warn; g.fillRect(x, y, w * Math.max(0, Math.min(1, v)), h);
  }

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
        g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
        const amp = s.energy * 14, t = performance.now() / 28, jx = Math.sin(t) * amp, jy = Math.cos(t * 1.3) * amp * 0.4;
        g.fillStyle = '#2B3140'; g.fillRect(W * 0.2, H * 0.72, W * 0.6, 12);
        g.fillStyle = '#F2C14E'; g.fillRect(W * 0.2 + jx, H * 0.66 + jy, W * 0.6, 10);
        sat(g, W / 2 + jx, H * 0.45 + jy, Math.min(1.3, H / 160), 0);
        bar(g, 16, 14, W - 32, 12, s.energy / 1.2, 0.40 / 1.2, 0.85 / 1.2);
        g.fillStyle = C.mute; g.font = '600 11px system-ui,sans-serif'; g.fillText(T('vibrazione', 'vibration'), 16, 42);
        if (!s.idle) { g.fillStyle = C.ok; g.fillRect(16, H - 14, (W - 32) * Math.min(1, s.inBand / (s.dur * 0.85)), 5); }
        g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.arc(s.px, H * 0.88, 9, 0, 6.3); g.fill();
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
        g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
        g.fillStyle = 'rgba(255,255,255,.04)'; g.fillRect(0, 0, W / 2, H);
        g.fillStyle = '#2B3140'; g.beginPath(); g.moveTo(W / 2 - 16, H * 0.86); g.lineTo(W / 2 + 16, H * 0.86); g.lineTo(W / 2, H * 0.62); g.fill();
        g.save(); g.translate(W / 2, H * 0.62); g.rotate(s.a);
        g.fillStyle = Math.abs(s.a) < 0.15 ? C.ok : C.warn; g.fillRect(-W * 0.26, -6, W * 0.52, 6); g.restore();
        const sk = Math.min(1.1, H / 190), dd = 27 * sk; sat(g, W / 2 + Math.sin(s.a) * dd, H * 0.62 - 6 - Math.cos(s.a) * dd, sk, s.a);
        g.fillStyle = C.mute; g.font = '700 13px system-ui,sans-serif'; g.textAlign = 'center';
        g.fillText('◀ ' + T('tocca qui', 'tap here'), W * 0.18, H * 0.25); g.fillText(T('tocca qui', 'tap here') + ' ▶', W * 0.82, H * 0.25); g.textAlign = 'left';
        if (!s.idle) { g.fillStyle = C.ok; g.fillRect(16, H - 12, (W - 32) * Math.min(1, s.ok / (s.dur * 0.8)), 5); }
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
        g.fillStyle = C.bg; g.fillRect(0, 0, W, H);
        const x0 = 24, x1 = W - 24, y = H * 0.5;
        const grd = g.createLinearGradient(x0, 0, x1, 0); grd.addColorStop(0, '#3D7FE0'); grd.addColorStop(0.5, '#7A8496'); grd.addColorStop(1, '#E2553F');
        g.fillStyle = grd; g.fillRect(x0, y - 14, x1 - x0, 28);
        g.fillStyle = 'rgba(63,199,126,.85)'; g.fillRect(x0 + (x1 - x0) * s.zone[0], y - 20, (x1 - x0) * (s.zone[1] - s.zone[0]), 40);
        const nx = x0 + (x1 - x0) * s.x; g.fillStyle = s.flash > 0 ? '#fff' : C.ink; g.fillRect(nx - 3, y - 30, 6, 60);
        g.fillStyle = C.mute; g.font = '600 12px system-ui,sans-serif'; g.fillText('−150 °C', x0, y + 46); g.textAlign = 'right'; g.fillText('+120 °C', x1, y + 46); g.textAlign = 'left';
        s.hits.forEach((h, i) => { g.fillStyle = h >= 0.8 ? C.ok : h >= 0.45 ? C.warn : C.bad; g.beginPath(); g.arc(W / 2 - 24 + i * 24, 22, 7, 0, 6.3); g.fill(); });
        for (let i = s.hits.length; i < 3; i++) { g.strokeStyle = C.mute; g.beginPath(); g.arc(W / 2 - 24 + i * 24, 22, 7, 0, 6.3); g.stroke(); }
      }
    }
  };

  const API = { has, play, get open() { return open; }, _s: null };
  return API;
})();
