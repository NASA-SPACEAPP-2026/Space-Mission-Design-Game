/* ===== SAT3D: il satellite in 3D con three.js. Ogni cella della griglia è un'unità da 10 cm.
   La logica (griglia, regole, baricentro) resta nel motore: qui si disegna e si traduce il puntatore in celle. ===== */
const S3 = (function () {
  const ok = (function () { try { if (!window.THREE) return false; const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } })();
  if (!ok) return { ok: false };
  const T = THREE;
  let R = null, scene, cam, root, sat, hlG, cogG, wrap = null, raf = 0, last = 0;
  let yaw = -0.55, pitch = 0.32, dist = 12, spin = false, dims = { cols: 4, rows: 4, D: 1 }, orbit = null, opts = {};
  const CATCOL = { avi: 0x7C8CFF, ray: 0xF0B43A, cell: 0x3CC796, bat: 0xF28B50, prop: 0x4DB8E8, adcs: 0xB783E3, com: 0xF06EAA, gas: 0x9DB0C4 };
  const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: 0.55, metalness: 0.15 }, o || {}));
  const MAT = { alu: M(0xC9D1DA, { metalness: 0.7, roughness: 0.35 }), rail: M(0x9AA6B4, { metalness: 0.75, roughness: 0.3 }), pcb: M(0x1F7A3A, { roughness: 0.7 }), chip: M(0x1B1F24, { roughness: 0.4 }),
    gold: M(0xD4A53A, { metalness: 0.9, roughness: 0.25 }), tank: M(0xD9DEE5, { metalness: 0.85, roughness: 0.22 }), dark: M(0x2B3340, { roughness: 0.6 }), black: M(0x111418, { roughness: 0.5 }),
    glass: M(0xBFE6FF, { transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.1 }), wheel: M(0x6B7785, { metalness: 0.8, roughness: 0.3 }), red: M(0xD2443A, { roughness: 0.45 }),
    cellbat: M(0x2F6FD6, { roughness: 0.35, metalness: 0.3 }), copper: M(0xB87333, { metalness: 0.85, roughness: 0.3 }), ion: M(0x64B5FF, { emissive: 0x2F6FD6, emissiveIntensity: 0.9 }),
    laser: M(0xFF5A5A, { emissive: 0xFF2A2A, emissiveIntensity: 1 }) };
  function solarTex(gold) { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'); g.fillStyle = '#1D3F8F'; g.fillRect(0, 0, 128, 128);
    g.strokeStyle = '#7FA6E8'; g.lineWidth = 2; for (let i = 0; i <= 128; i += 32) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 128); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(128, i); g.stroke(); }
    g.strokeStyle = gold ? '#E8B54A' : '#AFC6EE'; g.lineWidth = 6; g.strokeRect(0, 0, 128, 128); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; return t; }
  const SOLT = solarTex(false), SOLG = solarTex(true);
  function gridTex(cols, rows) { const k = 64, c = document.createElement('canvas'); c.width = cols * k; c.height = rows * k; const g = c.getContext('2d'); g.fillStyle = '#E6EBF1'; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = '#B9C4D1'; g.lineWidth = 2; for (let x = 0; x <= cols; x++) { g.beginPath(); g.moveTo(x * k, 0); g.lineTo(x * k, c.height); g.stroke(); } for (let y = 0; y <= rows; y++) { g.beginPath(); g.moveTo(0, y * k); g.lineTo(c.width, y * k); g.stroke(); }
    return new T.CanvasTexture(c); }

  function init() { if (R) return;
    R = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, alpha: true }); R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.outputEncoding = T.sRGBEncoding;
    R.domElement.id = 'sat3d'; R.domElement.style.display = 'block'; R.domElement.style.width = '100%'; R.domElement.style.touchAction = 'none';
    scene = new T.Scene(); scene.background = new T.Color(0xEEF2F6);
    cam = new T.PerspectiveCamera(32, 4 / 3, 0.1, 200);
    scene.add(new T.HemisphereLight(0xFFFFFF, 0x9AA6B4, 0.85)); const dl = new T.DirectionalLight(0xFFFFFF, 0.75); dl.position.set(6, 10, 8); scene.add(dl); const dl2 = new T.DirectionalLight(0xCFE3FF, 0.35); dl2.position.set(-8, 4, -6); scene.add(dl2);
    const floor = new T.Mesh(new T.CircleGeometry(6, 48), M(0xC9D2DC, { roughness: 1, metalness: 0 })); floor.rotation.x = -Math.PI / 2; floor.name = 'floor'; scene.add(floor);
    root = new T.Group(); scene.add(root); hlG = new T.Group(); cogG = new T.Group();
    R.domElement.addEventListener('pointerdown', down); R.domElement.addEventListener('wheel', e => { if (!opts.live) return; e.preventDefault(); dist = Math.max(dims.base * 0.6, Math.min(dims.base * 1.6, dist * (e.deltaY > 0 ? 1.08 : 0.93))); }, { passive: false });
  }
  function down(e) { if (opts.live && opts.onPart) { const cat = pick(e.clientX, e.clientY); if (cat) { opts.onPart(cat, e); return; } }
    orbit = { x: e.clientX, y: e.clientY, yaw, pitch }; spin = false; e.preventDefault();
    const mv = ev => { if (!orbit) return; yaw = orbit.yaw - (ev.clientX - orbit.x) * 0.008; pitch = Math.max(-0.15, Math.min(1.1, orbit.pitch + (ev.clientY - orbit.y) * 0.006)); };
    const up = () => { orbit = null; document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }

  function mount(el, o) { init(); opts = o || {}; spin = !!opts.spin; wrap = el; el.innerHTML = ''; el.appendChild(R.domElement); resize(); cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(loop); }
  function resize() { if (!wrap) return; const w = Math.max(200, wrap.clientWidth), h0 = Math.round(Math.min(opts.maxH || 520, w * (opts.ratio || 0.78))); const fh = wrap.classList.contains('fill') ? wrap.clientHeight : 0, h = fh > 80 ? fh : h0; R.setSize(w, h, false); R.domElement.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); }
  window.addEventListener('resize', () => { if (wrap && document.body.contains(R.domElement)) resize(); });
  function loop(ts) { if (!wrap || !document.body.contains(R.domElement)) { wrap = null; return; } raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0); last = ts; if (spin) yaw += dt * 0.35;
    const cy = dims.rows * 0.5 + 0.6; cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, cy + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(0, cy - 0.2, 0);
    root.traverse(o => { if (o.userData.pulse) o.material.emissiveIntensity = 0.35 + 0.35 * Math.sin(ts / 180); if (o.userData.spinY) o.rotation.y += dt * o.userData.spinY; });
    R.render(scene, cam); }

  // coordinate: x a destra, y in su (fila 0 in alto), z verso chi guarda. Il fondo del satellite sta a y = 0.
  const cx = c => -dims.cols / 2 + c + 0.5, cyy = r => dims.rows - r - 0.5 + 0.6;
  function add(g, geo, mat, x, y, z, rx, ry, rz) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); if (rx) m.rotation.x = rx; if (ry) m.rotation.y = ry; if (rz) m.rotation.z = rz; g.add(m); return m; }
  const box = (w, h, d) => new T.BoxGeometry(w, h, d), cyl = (r1, r2, h, s) => new T.CylinderGeometry(r1, r2, h, s || 20), sph = (r) => new T.SphereGeometry(r, 24, 16);

  // Ogni pezzo ha la forma di quello che è, dentro la scatola delle sue celle
  function partMesh(id, cat, w, h, D, out, P) { const g = new T.Group(), dd = D * 0.82; id = (P && P.look) || id; if (cat === 'nav') { cat = 'adcs'; id = 'NAV'; }
    if (cat === 'avi') { const n = 5, hh = h * 0.8, rad = id === 'O3';
      const stack = (ox, sw) => { for (let i = 0; i < n; i++) { const y = -hh / 2 + i * hh / (n - 1); add(g, box(sw, 0.04, dd), MAT.pcb, ox, y, 0); add(g, box(sw * 0.3, 0.05, dd * 0.3), MAT.chip, ox - sw * 0.15, y + 0.04, 0); add(g, box(sw * 0.15, 0.04, dd * 0.15), MAT.gold, ox + sw * 0.25, y + 0.04, dd * 0.2); }
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => add(g, cyl(0.025, 0.025, hh, 8), MAT.gold, ox + q[0] * sw * 0.42, 0, q[1] * dd * 0.42)); };
      if (P.spare) { stack(-w * 0.22, w * 0.4); stack(w * 0.22, w * 0.4); } else stack(0, w * 0.8);
      if (rad) add(g, box(w * 0.94, h * 0.94, dd * 1.02), M(0xAAB4C0, { metalness: 0.8, roughness: 0.3, transparent: true, opacity: 0.45 }), 0, 0, 0);
      if (id === 'O4') add(g, box(w * 0.3, 0.06, dd * 0.3), M(0x7A4FD6), 0, h * 0.42, 0); }
    else if (cat === 'ray') {
      if (id === 'CAM' || id === 'PXC') { add(g, box(w * 0.7, h * 0.5, dd * 0.7), MAT.dark, 0, -h * 0.15, 0); add(g, cyl(w * 0.22, w * 0.26, h * 0.35, 24), MAT.black, 0, h * 0.2, 0); add(g, cyl(w * 0.17, w * 0.17, 0.02, 24), M(0x6FA8FF, { metalness: 0.9, roughness: 0.1 }), 0, h * 0.38, 0); if (id === 'PXC') add(g, box(w * 0.2, 0.05, dd * 0.2), M(0xBE123C), w * 0.25, -h * 0.4, 0); }
      else if (id === 'TEL' || id === 'OPT') { const L = h * 0.9, rr = Math.min(w, dd) * 0.36; add(g, cyl(rr, rr, L, 28), M(0xF4F7FA, { metalness: 0.4 }), 0, 0, 0); add(g, cyl(rr * 0.9, rr * 0.9, 0.02, 28), MAT.black, 0, L / 2, 0); add(g, cyl(rr * 1.05, rr * 1.05, 0.06, 28), MAT.gold, 0, -L / 2 + 0.05, 0);
        if (id === 'OPT') [-1, 1].forEach(sd => add(g, box(0.05, L * 0.6, dd * 0.5), M(0x4338CA), sd * w * 0.42, 0, 0)); }
      else if (id === 'TRX') { add(g, box(w * 0.75, h * 0.55, dd * 0.75), MAT.dark, 0, -h * 0.12, 0); add(g, box(w * 0.5, 0.04, dd * 0.4), MAT.gold, 0, h * 0.18, 0); const ant = new T.Group(); add(ant, new T.SphereGeometry(0.34, 24, 10, 0, Math.PI * 2, 0, Math.PI / 3.2), M(0xF4F7FA, { side: T.DoubleSide, metalness: 0.4 }), 0, 0.05, 0, Math.PI); ant.position.set(0, h * 0.25, 0); orient(ant, out, w, h, dd); g.add(ant); }
      else if (id === 'ARM' || id === 'NET') { add(g, box(w * 0.8, h * 0.3, dd * 0.7), MAT.dark, 0, -h * 0.3, 0);
        if (id === 'ARM') { const a1 = add(g, cyl(0.05, 0.05, h * 0.55, 10), M(0xF07B3F), -w * 0.15, 0, 0, 0, 0, -0.5); add(g, sph(0.08), MAT.rail, -w * 0.02, h * 0.22, 0); add(g, cyl(0.045, 0.045, w * 0.35, 10), M(0xF07B3F), w * 0.12, h * 0.3, 0, 0, 0, Math.PI / 2.4); [-1, 1].forEach(sd => add(g, box(0.04, 0.16, 0.04), MAT.rail, w * 0.3, h * 0.4, sd * 0.06)); add(g, cyl(0.07, 0.07, 0.12, 14), MAT.black, w * 0.3, -h * 0.08, 0); }
        else { add(g, cyl(w * 0.3, w * 0.3, h * 0.4, 20), M(0x0F766E), 0, h * 0.05, 0); add(g, new T.SphereGeometry(w * 0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshBasicMaterial({ color: 0x9AF0D6, wireframe: true }), 0, h * 0.25, 0); } }
      else if (id === 'ROV') { add(g, box(w * 0.7, h * 0.28, dd * 0.6), M(0xE9EEF3, { metalness: 0.4 }), 0, h * 0.02, 0); add(g, box(w * 0.5, 0.03, dd * 0.5), M(0x1D3F8F), 0, h * 0.18, 0);
        [-1, 0, 1].forEach(k => [-1, 1].forEach(sd => add(g, cyl(0.1, 0.1, 0.07, 14), MAT.black, k * w * 0.27, -h * 0.25, sd * dd * 0.34, Math.PI / 2)));
        add(g, cyl(0.025, 0.025, h * 0.35, 8), MAT.rail, w * 0.25, h * 0.3, 0); add(g, box(0.14, 0.08, 0.08), MAT.dark, w * 0.25, h * 0.48, 0); }
      else if (id === 'LND') { add(g, box(w * 0.6, h * 0.3, dd * 0.6), MAT.alu, 0, h * 0.05, 0); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(q => { add(g, cyl(0.025, 0.025, h * 0.5, 8), MAT.rail, q[0] * w * 0.33, -h * 0.2, q[1] * dd * 0.3, q[1] * 0.4, 0, q[0] * -0.4); add(g, cyl(0.07, 0.07, 0.02, 12), MAT.dark, q[0] * w * 0.42, -h * 0.42, q[1] * dd * 0.38); });
        add(g, cyl(0.03, 0.01, h * 0.45, 8), M(0xF07B3F), 0, -h * 0.25, 0); }
      else if (id === 'TEC') { add(g, box(w * 0.7, h * 0.6, dd * 0.7), M(0xE9EEF3, { metalness: 0.5 }), 0, -h * 0.05, 0); add(g, box(w * 0.5, 0.05, dd * 0.5), M(0xF0B43A), 0, h * 0.27, 0); [-1, 0, 1].forEach(k => add(g, sph(0.04), M(0x45D483, { emissive: 0x2A8A50 }), k * w * 0.15, h * 0.32, dd * 0.2)); }
      else { add(g, box(w * 0.78, h * 0.55, dd * 0.78), MAT.alu, 0, -h * 0.12, 0); add(g, cyl(w * 0.24, w * 0.24, h * 0.32), MAT.gold, 0, h * 0.3, 0); add(g, cyl(w * 0.18, w * 0.18, 0.02), MAT.black, 0, h * 0.47, 0); } }
    else if (cat === 'cell') { add(g, box(w * 0.86, h * 0.86, dd * 0.86), MAT.glass, 0, 0, 0); add(g, box(w * 0.7, 0.04, dd * 0.7), MAT.alu, 0, -h * 0.05, 0);
      [0x3CC796, 0xF28B50, 0x7C8CFF, 0xF06EAA, 0x3CC796, 0xF0B43A].forEach((c, i) => { const x = -w * 0.25 + (i % 3) * w * 0.25, z = (i < 3 ? -1 : 1) * dd * 0.18; add(g, cyl(0.06, 0.06, h * 0.28, 12), M(0xEAF6FF, { transparent: true, opacity: 0.6 }), x, h * 0.1, z); add(g, sph(0.05), M(c), x, h * 0.02, z); }); }
    else if (cat === 'bat') { const nx = Math.max(2, Math.round(w * 3)), ny = Math.max(2, Math.round(h * 3)), r = Math.min(w / nx, h / ny) * 0.42;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) { const x = -w / 2 + (i + 0.5) * w / nx, y = -h / 2 + (j + 0.5) * h / ny; add(g, cyl(r, r, dd * 0.9, 14), id === 'B5' ? M(0x18A0A0, { metalness: 0.4 }) : MAT.cellbat, x, y, 0, Math.PI / 2); add(g, cyl(r * 0.5, r * 0.5, 0.02, 10), MAT.alu, x, y, dd * 0.46, Math.PI / 2); }
      add(g, box(w * 0.98, h * 0.98, 0.04), MAT.dark, 0, 0, -dd * 0.48); add(g, box(w * 0.98, 0.05, dd * 0.92), M(0xF28B50), 0, h * 0.47, 0); }
    else if (cat === 'prop') {
      if (id === 'P5') { add(g, box(w * 0.7, h * 0.55, dd * 0.7), MAT.dark, 0, h * 0.1, 0); add(g, sph(Math.min(w, h) * 0.18), MAT.tank, -w * 0.18, h * 0.25, 0); add(g, cyl(w * 0.3, w * 0.34, h * 0.2, 28), MAT.alu, 0, -h * 0.3, 0); const gr = add(g, cyl(w * 0.27, w * 0.27, 0.02, 28), MAT.ion, 0, -h * 0.41, 0); gr.userData.ion = 1; }
      else if (id === 'P3') { const t = add(g, sph(Math.min(w * 2 / 3, h) * 0.4), MAT.tank, -w / 6, h * 0.02, 0); t.scale.z = dd / (Math.min(w * 2 / 3, h) * 0.8); add(g, cyl(w * 0.1, w * 0.13, h * 0.42, 16), MAT.red, w / 3, -h * 0.22, 0); add(g, box(w * 0.3, 0.08, dd * 0.6), MAT.copper, w / 6, -h * 0.05, 0); }
      else if (w > h + 0.5) { const r = Math.min(h * 0.38, dd * 0.45), L = w * 0.86 - 2 * r; add(g, cyl(r, r, L, 28), MAT.tank, 0, 0, 0, 0, 0, Math.PI / 2); add(g, sph(r), MAT.tank, -L / 2, 0, 0); add(g, sph(r), MAT.tank, L / 2, 0, 0); add(g, cyl(0.03, 0.03, h * 0.5, 8), MAT.copper, 0, -h * 0.3, 0); }
      else { const r = Math.min(w, h) * 0.42; const t = add(g, sph(r), MAT.tank, 0, 0, 0); t.scale.z = Math.min(1, dd * 0.48 / r); add(g, cyl(0.03, 0.03, h * 0.3, 8), MAT.copper, 0, -h * 0.4, 0); add(g, cyl(r * 0.9, r * 0.9, 0.03, 24), MAT.rail, 0, 0, 0); }
      if (P.stutter) add(g, box(w * 0.2, h * 0.12, dd * 0.4), M(0xD9478F), -w * 0.3, h * 0.38, 0); }
    else if (cat === 'adcs') { const wh = (x, y, z, ax) => { const m = add(g, cyl(0.24, 0.24, 0.1, 24), MAT.wheel, x, y, z); if (ax === 'x') m.rotation.z = Math.PI / 2; if (ax === 'z') m.rotation.x = Math.PI / 2; add(g, cyl(0.06, 0.06, 0.12, 10), MAT.dark, x, y, z).rotation.copy(m.rotation); return m; };
      add(g, box(w * 0.86, 0.05, dd * 0.86), MAT.alu, 0, -h * 0.44, 0);
      if (id === 'A1') { wh(-w * 0.18, -h * 0.15, 0, 'y'); wh(w * 0.2, h * 0.05, 0, 'x'); wh(0, h * 0.22, -dd * 0.1, 'z'); }
      else if (id === 'A3') { wh(-w * 0.15, -h * 0.1, 0, 'y'); wh(w * 0.18, h * 0.15, 0, 'x'); [-0.25, 0.25].forEach(z => add(g, cyl(0.035, 0.035, w * 0.7, 10), MAT.copper, 0, h * 0.35, z * dd, 0, 0, Math.PI / 2)); }
      else { const y0 = -h * 0.3; wh(-w * 0.2, y0, -dd * 0.15, 'y'); wh(w * 0.2, y0 + 0.25, -dd * 0.15, 'x'); wh(-w * 0.2, y0 + 0.5, dd * 0.15, 'z'); wh(w * 0.15, y0 + 0.75, dd * 0.15, 'y');
        const st = new T.Group(); add(st, cyl(0.13, 0.13, 0.35, 18), MAT.black, 0, 0, 0); add(st, cyl(0.24, 0.13, 0.3, 18), MAT.dark, 0, 0.3, 0); st.position.set(0, h * 0.3, 0); orient(st, out, w, h, dd); g.add(st); } }
    else if (cat === 'com') { add(g, box(w * 0.7, h * 0.5, dd * 0.7), MAT.dark, 0, -h * 0.1, 0); add(g, box(w * 0.45, 0.04, dd * 0.4), MAT.pcb, 0, h * 0.18, 0);
      const ant = new T.Group();
      if (id === 'C3') { const dsh = add(ant, new T.SphereGeometry(0.32, 24, 10, 0, Math.PI * 2, 0, Math.PI / 3.2), M(0xF4F7FA, { side: T.DoubleSide, metalness: 0.4 }), 0, 0.05, 0, Math.PI); add(ant, cyl(0.02, 0.02, 0.3, 6), MAT.rail, 0, 0.2, 0); }
      else if (id === 'C4') { add(ant, cyl(0.13, 0.13, 0.4, 20), MAT.alu, 0, 0.1, 0); add(ant, cyl(0.1, 0.1, 0.02, 20), MAT.laser, 0, 0.31, 0); }
      else { add(ant, box(0.34, 0.03, 0.34), MAT.gold, 0, 0, 0); for (let i = 0; i < (P.spare ? 4 : 2); i++) add(ant, cyl(0.01, 0.01, 0.7, 6), MAT.rail, (i % 2 ? 0.14 : -0.14), 0.36, (i > 1 ? 0.14 : -0.14), (i % 2 ? 0.5 : -0.5)); }
      ant.position.set(0, h * 0.25, 0); orient(ant, out, w, h, dd); g.add(ant); }
    else if (cat === 'gas') { add(g, sph(Math.min(w, h) * 0.3), MAT.tank, 0, 0, 0); add(g, cyl(0.03, 0.03, w * 0.5, 8), MAT.copper, 0, 0, 0, 0, 0, Math.PI / 2);
      const nz = new T.Group(); [-0.18, 0.18].forEach(z => add(nz, cyl(0.02, 0.08, 0.14, 12), MAT.rail, 0, 0.06, z)); nz.position.set(0, 0, 0); orient(nz, out, w, h, dd); g.add(nz); }
    if (!g.children.length) { const col = { pwr: 0xE0A100, rob: 0x8B7D6B, eol: 0x9AA9BA }[cat] || 0xC9D3DD; add(g, box(w * 0.82, h * 0.7, dd * 0.82), M(col, { metalness: 0.3 }), 0, 0, 0); add(g, box(w * 0.5, 0.04, dd * 0.5), MAT.pcb, 0, h * 0.36, 0); }
    return g; }
  // ruota un gruppo (che punta verso +y) in modo che guardi fuori dalla parete più vicina
  function orient(o, out, w, h, dd) { if (out === 'L') { o.rotation.z = Math.PI / 2; o.position.x = -w * 0.42; o.position.y = 0; } else if (out === 'R') { o.rotation.z = -Math.PI / 2; o.position.x = w * 0.42; o.position.y = 0; } else if (out === 'T') { o.position.y = h * 0.38; } else { o.rotation.x = Math.PI / 2; o.position.z = dd * 0.4; o.position.y = 0; } }

  // Ricostruisce il satellite dal progetto
  function update(d, o) { if (!R) init(); o = o || {}; const Rd = E.RIDES[d.ride], S = E.SOLAR[d.sol] || { wings: 0 }, Lx = E.layout(d), D = Rd.depth;
    dims = { cols: Rd.cols, rows: Rd.rows, D, base: Math.max(Rd.cols, Rd.rows) * 2.0 + 4.5 }; if (!o.keepCam) dist = o.dist || dims.base;
    if (sat) { root.remove(sat); sat.traverse(x => { if (x.geometry) x.geometry.dispose(); }); }
    sat = new T.Group(); root.add(sat); const W = Rd.cols, H = Rd.rows, y0 = 0.6, yc = y0 + H / 2;
    // struttura
    if (Rd.cyl) { const rr = W / 2 + 0.12;
      add(sat, cyl(rr, rr, H, 40), M(0xD7E1EC, { transparent: true, opacity: 0.16, side: T.DoubleSide, depthWrite: false }), 0, yc, 0);
      [y0, y0 + H, yc].forEach(y => add(sat, new T.TorusGeometry(rr, 0.05, 8, 48), MAT.rail, 0, y, 0, Math.PI / 2));
      if (!S.wings) { const t = SOLT.clone(); t.needsUpdate = true; t.repeat.set(10, H); const pm = M(0xFFFFFF, { map: t, side: T.DoubleSide, metalness: 0.3, roughness: 0.35 });
        add(sat, new T.CylinderGeometry(rr + 0.02, rr + 0.02, H * 0.9, 40, 1, true, Math.PI * 0.75, Math.PI * 1.5), pm, 0, yc, 0); } }
    else { const hw = W / 2, hd = D / 2;
      [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(q => add(sat, box(0.12, H + 0.1, 0.12), MAT.rail, q[0], yc, q[1]));
      [y0, y0 + H].forEach(y => { add(sat, box(W + 0.12, 0.08, 0.1), MAT.rail, 0, y, -hd); add(sat, box(W + 0.12, 0.08, 0.1), MAT.rail, 0, y, hd); add(sat, box(0.1, 0.08, D), MAT.rail, -hw, y, 0); add(sat, box(0.1, 0.08, D), MAT.rail, hw, y, 0); });
      if (!S.wings) { [[-hw - 0.02, 0, Math.PI / 2], [hw + 0.02, 0, -Math.PI / 2]].forEach(q => { const t = SOLT.clone(); t.needsUpdate = true; t.repeat.set(Math.max(1, Math.round(D * 2)), H * 2); add(sat, new T.PlaneGeometry(D * 0.94, H * 0.94), M(0xFFFFFF, { map: t, side: T.DoubleSide, metalness: 0.3, roughness: 0.35 }), q[0], yc, 0, 0, q[2]); }); }
      else [[-hw - 0.01, Math.PI / 2], [hw + 0.01, -Math.PI / 2]].forEach(q => add(sat, new T.PlaneGeometry(D, H), M(0xD7E1EC, { transparent: true, opacity: 0.18, side: T.DoubleSide, depthWrite: false }), q[0], yc, 0, 0, q[1])); }
    const back = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshStandardMaterial({ map: gridTex(W, H), roughness: 0.9 })); back.position.set(0, yc, -D / 2 + 0.01); sat.add(back);
    add(sat, box(W, 0.06, D), M(0xDDE3EA), 0, y0 + 0.03, 0);
    // ali solari
    if (S.wings) { const ww = S.wings > 1 ? 2.8 : 2.1, wh = Math.min(H * 0.8, S.wings > 1 ? 2.4 : 1.8), tex = S.wings > 1 ? SOLG : SOLT;
      [-1, 1].forEach(sd => { const t = tex.clone(); t.needsUpdate = true; t.repeat.set(Math.round(ww * 2), Math.round(wh * 2)); const wx = sd * (W / 2 + (Rd.cyl ? 0.12 : 0) + 0.25 + ww / 2);
        add(sat, box(ww, wh, 0.04), M(0xFFFFFF, { map: t, metalness: 0.3, roughness: 0.35 }), wx, yc, 0); add(sat, box(0.3, 0.06, 0.06), MAT.rail, sd * (W / 2 + 0.2 + (Rd.cyl ? 0.12 : 0)), yc, 0); }); }
    // pezzi
    const only = o.only, hot = {};
    Object.keys(d.placed).forEach(cat => { if (only && only.indexOf(cat) < 0) return; const pl = d.placed[cat], P = E.PARTS[pl.id], cs = E.cellsOf(pl, d.ride), f = Lx.parts[cat] || { ok: true };
      let x0 = 99, x1 = -1, y0c = 99, y1 = -1; cs.forEach(c => { x0 = Math.min(x0, c[0]); x1 = Math.max(x1, c[0]); y0c = Math.min(y0c, c[1]); y1 = Math.max(y1, c[1]); });
      const w = x1 - x0 + 1, h = y1 - y0c + 1, out = x0 === 0 ? 'L' : x1 === W - 1 ? 'R' : y0c === 0 ? 'T' : 'F';
      const g = new T.Group(); g.position.set((cx(x0) + cx(x1)) / 2, (cyy(y0c) + cyy(y1)) / 2, 0);
      // impronta colorata sul fondo: dice a colpo d'occhio di che sottosistema si tratta
      cs.forEach(c => { const m = add(g, box(0.94, 0.94, 0.04), M(CATCOL[cat], { roughness: 0.6, emissive: 0x000000 }), cx(c[0]) - g.position.x, cyy(c[1]) - g.position.y, -D / 2 + 0.04); m.userData.foot = 1; });
      const pm = partMesh(pl.id, cat, w, h, D, out, P); g.add(pm);
      if (o.live) { if (!f.ok) g.traverse(m => { if (m.isMesh && m.userData.foot) { m.material = M(0xD2443A, { emissive: 0xD2443A }); m.userData.pulse = 1; } });
        else if (f.cold && !f.warm) g.traverse(m => { if (m.isMesh && m.userData.foot) m.material = M(0x7FC4FF, { emissive: 0x2F6FD6, emissiveIntensity: 0.5 }); });
        else if (f.heater) add(g, new T.TorusGeometry(Math.min(w, h) * 0.4, 0.03, 6, 32), M(0xFF7A3D, { emissive: 0xFF5A1F, emissiveIntensity: 0.8 }), 0, 0, D / 2 - 0.1);
        if (o.sel === cat) { const bx = new T.LineSegments(new T.EdgesGeometry(box(w * 0.98, h * 0.98, D * 0.98)), new T.LineBasicMaterial({ color: 0x1E2A3A })); g.add(bx); } }
      g.traverse(m => { m.userData.cat = cat; }); sat.add(g); hot[cat] = g; });
    // ugello e adattatore del lanciatore
    if (Lx.nozzle != null && (!only || only.indexOf('prop') >= 0)) { const pr = E.PARTS[d.placed.prop.id], nx = -W / 2 + Lx.nozzle;
      if (pr.isp > 1000) add(sat, cyl(0.28, 0.28, 0.05, 24), MAT.ion, nx, y0 - 0.05, 0); else { add(sat, cyl(0.12, 0.3, 0.45, 24), MAT.rail, nx, y0 - 0.2, 0); } }
    add(sat, cyl(Math.min(W, D) * 0.35, Math.min(W, D) * 0.38, 0.25, 32), MAT.dark, 0, 0.42, 0);
    // baricentro e asse di spinta
    if (o.live && Lx.nozzle != null) { const col = Lx.align >= 0.95 ? 0x1E9E5A : Lx.align >= 0.88 ? 0xC27A00 : 0xD2443A, gx = -W / 2 + Lx.cogX, gy = y0 + H - Lx.cogY;
      add(sat, sph(0.13), M(col, { emissive: col, emissiveIntensity: 0.6 }), gx, gy, D / 2 + 0.15); add(sat, new T.TorusGeometry(0.22, 0.03, 6, 24), M(col), gx, gy, D / 2 + 0.15);
      const ln = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(-W / 2 + Lx.nozzle, y0 - 0.4, D / 2 + 0.12), new T.Vector3(-W / 2 + Lx.nozzle, y0 + H + 0.3, D / 2 + 0.12)]), new T.LineDashedMaterial({ color: 0x2C9AC8, dashSize: 0.15, gapSize: 0.1 })); ln.computeLineDistances(); sat.add(ln); }
    TOON.outlineEach(sat, { minDim: 0.015 }); hlG = new T.Group(); sat.add(hlG); return hot; }

  // highlight durante il trascinamento
  function highlight(cells, good) { if (!hlG) return; while (hlG.children.length) hlG.remove(hlG.children[0]);
    (cells || []).forEach(c => { if (c[0] < 0 || c[1] < 0 || c[0] >= dims.cols || c[1] >= dims.rows) return; add(hlG, box(0.92, 0.92, dims.D * 0.9), M(good ? 0x1E9E5A : 0xD2443A, { transparent: true, opacity: 0.35, depthWrite: false }), cx(c[0]), cyy(c[1]), 0); }); }
  const ray = new T.Raycaster(), v2 = new T.Vector2();
  function setRay(x, y) { const r = R.domElement.getBoundingClientRect(); v2.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, cam); return r; }
  function pick(x, y) { if (!sat) return null; setRay(x, y); const hit = ray.intersectObjects(sat.children, true).find(h => h.object.userData.cat && h.object.isMesh); return hit ? hit.object.userData.cat : null; }
  function cellAt(x, y) { if (!R || !wrap) return null; const r = setRay(x, y), pl = new T.Plane(new T.Vector3(0, 0, 1), -dims.D / 2 * 0.0), p = new T.Vector3(); if (!ray.ray.intersectPlane(pl, p)) return null;
    const a = new T.Vector3(cx(0), cyy(0), 0).project(cam), b = new T.Vector3(cx(1), cyy(0), 0).project(cam), px = Math.abs(b.x - a.x) / 2 * r.width;
    return { x: Math.floor(p.x + dims.cols / 2), y: Math.floor(dims.rows + 0.6 - p.y), px, in: x >= r.left && x <= r.right && y >= r.top && y <= r.bottom }; }
  function snap(d, w, so) { so = so || {}; init(); const keep = { yaw, pitch, dist, wrap }; const c = document.createElement('div'); c.style.cssText = 'position:fixed;left:-9999px;width:' + (w || 220) + 'px'; document.body.appendChild(c);
    if (!keep.wrap) { c.appendChild(R.domElement); }
    const ow = R.domElement.width, oh = R.domElement.height; R.setSize(w || 220, (w || 220) * 0.8, false); cam.aspect = 1.25; cam.updateProjectionMatrix();
    update(d, { only: so.only }); yaw = -0.55; pitch = 0.3; const cy = dims.rows * 0.5 + 0.6; cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, cy + Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(0, cy - 0.2, 0);
    const fl = scene.getObjectByName('floor'); scene.background = so.png ? null : new T.Color(0xF3F6F9); if (so.png) fl.visible = false; R.render(scene, cam); const url = so.png ? R.domElement.toDataURL('image/png') : R.domElement.toDataURL('image/jpeg', 0.82); scene.background = new T.Color(0xEEF2F6); fl.visible = true;
    yaw = keep.yaw; pitch = keep.pitch; dist = keep.dist; R.setSize(ow / R.getPixelRatio(), oh / R.getPixelRatio(), false); if (keep.wrap) resize(); c.remove(); return url; }
  return { ok: true, mount, update, highlight, pick, cellAt, snap, resize, setSpin: v => { spin = v; }, setView: k => { spin = false; if (k === 'front') { yaw = 0; pitch = 0.06; } else { yaw = -0.55; pitch = 0.32; } } };
})();

;
/* ===== FD3: editor 3D delle orbite per il Centro di dinamica del volo. Unità: raggi del corpo centrale. ===== */
const FD3 = (function () {
  const ok = (function () { try { if (!window.THREE) return false; const c = document.createElement('canvas'); return !!(c.getContext('webgl') || c.getContext('experimental-webgl')); } catch (e) { return false; } })();
  if (!ok) return { ok: false };
  const T = THREE; let R = null, scene, cam, world, body = null, bodyKey = '', wrap = null, raf = 0, cb = {}, pl = null, sel = 0, drag = null, picks = [];
  let yaw = 0.7, pitch = 0.5, dist = 14, autoDist = 14;
  const COL = { first: 0x9AA6B4, mid: 0x5B8DEF, last: 0xF07B3F, tgt: 0x1E9E5A, burn: 0xF07B3F, apo: 0x2F6FD6 };
  function tex(k) { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'), r = E.rng(k.length * 97 + 3);
    const base = { moon: '#A9AEB6', leo: '#2F6FC9', mars: '#B9583A', venus: '#D9B871' }[k] || E.EXT[k].pal[0]; g.fillStyle = base;
    if (E.EXT[k]) { for (let y = 0; y < 256; y += 14) { g.fillStyle = 'rgba(' + (k === 'sun' ? '255,240,160' : '60,40,20') + ',' + (0.12 + r() * 0.22) + ')'; g.fillRect(0, y, 512, 5 + r() * 7); } } g.fillRect(0, 0, 512, 256);
    if (k === 'moon') { for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(70,74,84,' + (0.15 + r() * 0.25) + ')'; g.beginPath(); g.ellipse(r() * 512, r() * 256, 10 + r() * 46, 8 + r() * 30, 0, 0, 7); g.fill(); } for (let i = 0; i < 120; i++) { g.strokeStyle = 'rgba(40,44,50,.35)'; g.beginPath(); g.arc(r() * 512, r() * 256, 1 + r() * 6, 0, 7); g.stroke(); } }
    if (k === 'leo') { c.width = 1024; c.height = 512; const W = 1024, H = 512, X = lo => (lo + 180) / 360 * W, Y = la => (90 - la) / 180 * H;
      const og = g.createLinearGradient(0, 0, 0, H); og.addColorStop(0, '#16407A'); og.addColorStop(.25, '#1F5FA8'); og.addColorStop(.5, '#2B7CC4'); og.addColorStop(.75, '#1F5FA8'); og.addColorStop(1, '#16407A'); g.fillStyle = og; g.fillRect(0, 0, W, H);
      const C = [ // continenti semplificati [lon,lat]
        [[-165,68],[-140,70],[-95,72],[-80,63],[-62,58],[-55,50],[-66,44],[-75,35],[-81,25],[-97,26],[-97,19],[-88,15],[-80,8],[-78,9],[-92,15],[-105,20],[-117,32],[-124,40],[-125,49],[-135,57],[-150,60],[-165,62]],
        [[-80,10],[-62,11],[-50,0],[-35,-6],[-38,-15],[-48,-26],[-58,-36],[-65,-42],[-68,-55],[-74,-50],[-72,-30],[-71,-18],[-81,-5],[-78,2]],
        [[-55,60],[-42,60],[-22,70],[-20,80],[-45,83],[-62,78],[-58,70]],
        [[-10,36],[-6,44],[-2,48],[-5,58],[5,62],[12,66],[25,71],[45,68],[70,73],[110,77],[140,72],[170,69],[180,66],[162,58],[140,54],[132,43],[122,32],[121,24],[109,20],[106,10],[100,4],[98,14],[92,22],[80,15],[77,8],[72,20],[60,25],[52,27],[48,29],[56,22],[44,13],[35,29],[27,37],[22,38],[14,42],[3,43]],
        [[-17,15],[-10,28],[0,36],[11,37],[25,32],[33,31],[43,12],[51,11],[40,-3],[40,-15],[35,-24],[27,-34],[18,-34],[12,-17],[9,-1],[8,4],[-8,4],[-16,8]],
        [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-25],[151,-34],[145,-39],[137,-35],[130,-32],[115,-34]],
        [[44,-12],[50,-15],[48,-25],[44,-25]], [[130,32],[136,35],[141,41],[140,36],[135,33]], [[-6,50],[2,51],[-3,58],[-6,56]], [[95,5],[105,-6],[118,-8],[125,1],[118,6],[108,3]], [[166,-46],[174,-41],[178,-38],[172,-35],[170,-44]] ];
      const land = g.createLinearGradient(0, 0, 0, H); land.addColorStop(0, '#7C8F5E'); land.addColorStop(.3, '#5E9A4E'); land.addColorStop(.42, '#C9B27A'); land.addColorStop(.5, '#4E9A43'); land.addColorStop(.58, '#C2A86C'); land.addColorStop(.75, '#6B9A52'); land.addColorStop(1, '#7C8F5E');
      g.fillStyle = land; g.strokeStyle = 'rgba(230,240,220,.35)'; g.lineWidth = 1.5; g.lineJoin = 'round';
      C.forEach(pl => { g.beginPath(); pl.forEach((q, i) => i ? g.lineTo(X(q[0]), Y(q[1])) : g.moveTo(X(q[0]), Y(q[1]))); g.closePath(); g.fill(); g.stroke(); });
      [[0, 34, 1], [H, H - 40, -1]].forEach(([y0, y1]) => { const ig = g.createLinearGradient(0, y0, 0, y1); ig.addColorStop(0, 'rgba(246,250,252,1)'); ig.addColorStop(.6, 'rgba(246,250,252,.85)'); ig.addColorStop(1, 'rgba(246,250,252,0)'); g.fillStyle = ig; g.fillRect(0, Math.min(y0, y1), W, Math.abs(y1 - y0)); });
      for (let i = 0; i < 46; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.06 + r() * 0.12) + ')'; g.beginPath(); g.ellipse(r() * W, 60 + r() * (H - 120), 30 + r() * 90, 5 + r() * 9, (r() - .5) * .3, 0, 7); g.fill(); } }
    if (k === 'mars') { for (let i = 0; i < 20; i++) { g.fillStyle = 'rgba(90,40,25,' + (0.2 + r() * 0.3) + ')'; g.beginPath(); g.ellipse(r() * 512, r() * 256, 18 + r() * 60, 8 + r() * 24, 0, 0, 7); g.fill(); } g.fillStyle = '#F4EEE8'; g.fillRect(0, 0, 512, 12); g.fillRect(0, 246, 512, 10); }
    if (k === 'venus') { for (let y = 0; y < 256; y += 8) { g.fillStyle = 'rgba(255,240,200,' + (r() * 0.35) + ')'; g.fillRect(0, y, 512, 4 + r() * 6); } }
    return new T.CanvasTexture(c); }
  function init() { if (R) return; R = new T.WebGLRenderer({ antialias: true }); R.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); R.domElement.id = 'fd3d'; R.domElement.style.cssText = 'display:block;width:100%;touch-action:none';
    scene = new T.Scene(); scene.background = new T.Color(0x0B1626); cam = new T.PerspectiveCamera(40, 4 / 3, 0.01, 2000);
    scene.add(new T.AmbientLight(0xFFFFFF, 0.14)); const sun = new T.DirectionalLight(0xFFFFFF, 1.35); sun.position.set(10, 4, 6); scene.add(sun);
    const sg = new T.BufferGeometry(), sp = [], rr = E.rng(7); for (let i = 0; i < 900; i++) { const u = rr() * 2 - 1, t = rr() * 6.283, s = Math.sqrt(1 - u * u); sp.push(300 * s * Math.cos(t), 300 * u, 300 * s * Math.sin(t)); }
    sg.setAttribute('position', new T.Float32BufferAttribute(sp, 3)); scene.add(new T.Points(sg, new T.PointsMaterial({ color: 0xDDE6FF, size: 1.2, sizeAttenuation: false })));
    world = new T.Group(); scene.add(world);
    R.domElement.addEventListener('pointerdown', down); R.domElement.addEventListener('wheel', e => { e.preventDefault(); dist = Math.max(autoDist * 0.25, Math.min(autoDist * 2.5, dist * (e.deltaY > 0 ? 1.1 : 0.9))); }, { passive: false }); }
  // coordinate del gioco (z = polo) → three (y in su)
  const V = (p, s) => new T.Vector3(p[0] * s, p[2] * s, -p[1] * s);
  function mount(el, o) { init(); cb = o || {}; wrap = el; el.innerHTML = ''; el.appendChild(R.domElement); resize(); cancelAnimationFrame(raf); raf = requestAnimationFrame(loop); }
  function resize() { if (!wrap) return; const w = Math.max(240, wrap.clientWidth), h0 = Math.round(Math.min(620, w * 0.78)); const fh = wrap.classList.contains('fill') ? wrap.clientHeight : 0, h = fh > 80 ? fh : h0; R.setSize(w, h, false); R.domElement.style.height = h + 'px'; cam.aspect = w / h; cam.updateProjectionMatrix(); }
  window.addEventListener('resize', () => { if (wrap && document.body.contains(R.domElement)) resize(); });
  let lastF = 0; function loop(ts) { if (!wrap || !document.body.contains(R.domElement)) { wrap = null; return; } raf = requestAnimationFrame(loop); const dF = Math.min(0.05, (ts - lastF) / 1000 || 0.016); lastF = ts;
    cam.position.set(Math.sin(yaw) * Math.cos(pitch) * dist, Math.sin(pitch) * dist, Math.cos(yaw) * Math.cos(pitch) * dist); cam.lookAt(0, 0, 0); if (body) body.rotation.y += 0.048 * dF; /* 0,0008 rad a fotogramma a 60 Hz = 0,048 rad/s */ R.render(scene, cam); }
  function tube(pts, col, rad, op) { const c = new T.CatmullRomCurve3(pts, true); return new T.Mesh(new T.TubeGeometry(c, Math.max(64, pts.length), rad, 6, true), new T.MeshBasicMaterial({ color: col, transparent: op != null, opacity: op == null ? 1 : op, depthWrite: op == null })); }
  function ring(el, B, n) { const out = []; for (let k = 0; k < n; k++) out.push(V(O.state(el, k * 360 / n, B).r, 1 / B.R)); return out; }
  function clear() { while (world.children.length) { const c = world.children[0]; world.remove(c); c.traverse(x => { if (x.geometry) x.geometry.dispose(); }); } picks = []; }
  function show(p, s, dest) { if (!R) init(); pl = p; sel = s || 0; const B = p.B, sc = 1 / B.R; clear();
    if (bodyKey !== dest) { bodyKey = dest; body = new T.Mesh(new T.SphereGeometry(1, 48, 32), new T.MeshStandardMaterial({ map: tex(dest), roughness: 0.95 })); }
    world.add(body); if (dest === 'leo' || dest === 'venus') { const col = dest === 'leo' ? 0x6FB4FF : 0xFFE2A0; world.add(new T.Mesh(new T.SphereGeometry(1.012, 48, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.10, depthWrite: false }))); world.add(new T.Mesh(new T.SphereGeometry(1.06, 48, 32), new T.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.22, side: T.BackSide, blending: T.AdditiveBlending, depthWrite: false }))); }
    world.add(new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, -1.5, 0), new T.Vector3(0, 1.5, 0)]), new T.LineBasicMaterial({ color: 0x6B7785 })));
    let maxR = 2; const th = Math.max(0.012, 0.006 * (dist / 6));
    // obiettivo
    const tN = p.t.debris ? { pe: p.t.debris.pe, ap: p.t.debris.ap, i: p.t.debris.i, raan: 0, argp: 0 } : null;
    const tg = tN || { pe: (p.t.pe[0] + p.t.pe[1]) / 2, ap: Math.max((p.t.pe[0] + p.t.pe[1]) / 2, Math.min(p.t.ap[1], Math.max(p.t.ap[0], (p.t.ap[0] + p.t.ap[1]) / 2))), i: p.t.i[1] >= 180 ? p.final.i : (p.t.i[0] + p.t.i[1]) / 2, raan: p.final.raan || 0, argp: p.final.argp || 0 };
    world.add(tube(ring(tg, B, 160), COL.tgt, th * 2.2, 0.28));
    if (tN) { const dp = V(O.state(tN, 40, B).r, sc); const db = new T.Mesh(new T.BoxGeometry(0.08, 0.04, 0.12), new T.MeshStandardMaterial({ color: 0x9AA6B4, metalness: 0.6 })); db.position.copy(dp); db.rotation.set(0.6, 0.3, 0.2); world.add(db); }
    p.orbits.forEach((o, k) => { if (!isFinite(o.el.ap)) return; const pts = ring(o.el, B, 180); pts.forEach(v => { maxR = Math.max(maxR, v.length()); });
      const last = k === p.orbits.length - 1, col = k === 0 ? COL.first : last ? COL.last : COL.mid; world.add(tube(pts, col, th * (last || k === sel ? 1.6 : 1), k === 0 && p.orbits.length > 1 ? 0.6 : null));
      if (k > 0) { const m = new T.Mesh(new T.SphereGeometry(k === sel ? 0.09 : 0.06, 16, 12), new T.MeshBasicMaterial({ color: COL.burn })); m.position.copy(V(o.at, sc)); m.userData = { kind: 'nu', k }; world.add(m); picks.push(m);
        if (k === sel) { const u = V(o.at, 1).normalize().multiplyScalar(-1), rOpp = (B.R + o.b.h) * sc, a = new T.Mesh(new T.SphereGeometry(0.085, 16, 12), new T.MeshBasicMaterial({ color: COL.apo })); a.position.copy(u.clone().multiplyScalar(rOpp)); a.userData = { kind: 'h', k, u }; world.add(a); picks.push(a);
          const dl = new T.Line(new T.BufferGeometry().setFromPoints([new T.Vector3(0, 0, 0), u.clone().multiplyScalar(rOpp * 1.15)]), new T.LineDashedMaterial({ color: COL.apo, dashSize: 0.08, gapSize: 0.06 })); dl.computeLineDistances(); world.add(dl);
          const rg = new T.Mesh(new T.TorusGeometry(0.15, 0.015, 8, 32), new T.MeshBasicMaterial({ color: COL.burn })); rg.position.copy(V(o.at, sc)); rg.lookAt(cam.position); world.add(rg); } } });
    // la sonda sull'orbita finale
    const sat = new T.Mesh(new T.BoxGeometry(0.07, 0.07, 0.07), new T.MeshStandardMaterial({ color: 0xF0B43A, emissive: 0x6B4A10 })); sat.position.copy(V(O.state(p.final, 120, B).r, sc)); world.add(sat);
    const want = Math.min(40, maxR * 2.15 + 1); if (Math.abs(want - autoDist) / autoDist > 0.35 && !drag) { autoDist = want; dist = want; } }
  const ray = new T.Raycaster(), v2 = new T.Vector2();
  function setRay(x, y) { const r = R.domElement.getBoundingClientRect(); v2.set((x - r.left) / r.width * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, cam); return r; }
  function down(e) { setRay(e.clientX, e.clientY); ray.params.Points = { threshold: 0 }; const hit = ray.intersectObjects(picks, false)[0];
    if (hit) { drag = hit.object.userData; if (cb.onSel && drag.k !== sel) cb.onSel(drag.k); e.preventDefault(); }
    else drag = { kind: 'cam', x: e.clientX, y: e.clientY, yaw, pitch };
    const mv = ev => move(ev), up = () => { drag = null; document.removeEventListener('pointermove', mv); document.removeEventListener('pointerup', up); if (cb.onEnd) cb.onEnd(); };
    document.addEventListener('pointermove', mv); document.addEventListener('pointerup', up); }
  function move(e) { if (!drag || !pl) return;
    if (drag.kind === 'cam') { yaw = drag.yaw - (e.clientX - drag.x) * 0.008; pitch = Math.max(-1.45, Math.min(1.45, drag.pitch + (e.clientY - drag.y) * 0.006)); return; }
    const B = pl.B, sc = 1 / B.R, rect = R.domElement.getBoundingClientRect();
    if (drag.kind === 'nu') { const prev = pl.orbits[drag.k - 1].el; let best = 1e9, nu = 0;
      for (let a = 0; a < 360; a += 1) { const p = V(O.state(prev, a, B).r, sc).project(cam), sx = (p.x + 1) / 2 * rect.width + rect.left, sy = (1 - p.y) / 2 * rect.height + rect.top, d = (sx - e.clientX) ** 2 + (sy - e.clientY) ** 2; if (d < best) { best = d; nu = a; } }
      if (cb.onNu) cb.onNu(drag.k, nu); }
    if (drag.kind === 'h') { setRay(e.clientX, e.clientY); const u = drag.u, w0 = ray.ray.origin.clone(), d = ray.ray.direction, b = u.dot(d), dd = u.dot(w0), ee = d.dot(w0), den = 1 - b * b;
      const t = den > 1e-6 ? (dd - b * ee) / den : dd; const h = Math.max(30, t / sc - B.R); if (cb.onH) cb.onH(drag.k, Math.round(h / 10) * 10); } }
  return { ok: true, mount, show, resize };
})();
