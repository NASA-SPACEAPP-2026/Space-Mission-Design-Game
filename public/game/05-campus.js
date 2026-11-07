// ===================== CAMPUS 3: mondo aperto, edifici posizionabili liberamente =====================
const CAM = (() => {
  const f1 = n => (+n).toFixed(1), pts = a => a.map(p => f1(p[0]) + ',' + f1(p[1])).join(' '), poly = (a, at) => '<polygon points="' + pts(a) + '" ' + (at || '') + '/>';
  function hx(c) { c = c.replace('#', ''); return [0, 2, 4].map(i => parseInt(c.substr(i, 2), 16)); }
  function rgb(a) { return '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function mix(a, b, t) { const A = hx(a), B = hx(b); return rgb(A.map((v, i) => v + (B[i] - v) * t)); }
  const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const FT = "Inter, system-ui, sans-serif", FD = "'Inter Display', Inter, system-ui, sans-serif";
  let C = { ox: 610, oy: 185, tw: 48, th: 24, tz: 24 }, ID = 0;
  const P = (x, y, z = 0) => [C.ox + (x - y) * C.tw / 2, C.oy + (x + y) * C.th / 2 - z * C.tz];
  const gp = a => a.map(q => P(q[0], q[1], q[2] || 0));
  const TEAL = '#45A9A3', ORANGE = '#EB7D44', DARK = '#22313B', MID = '#66777F';
  const RC = { roof: '#C9C8C1', glass1: '#9FC3CC', glass2: '#5E8C99', asph: '#8D928F', curb: '#E4E1D7', lawn: '#A9BF77' };

  // ---------- drawing primitives ----------
  function rpath(pl, R) { const p = gp(pl), n = p.length; R = R || 46; let d = 'M' + f1(p[0][0]) + ' ' + f1(p[0][1]);
    for (let i = 1; i < n - 1; i++) { const a = p[i - 1], b = p[i], c = p[i + 1], l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]), r = Math.min(R, l1 / 2, l2 / 2);
      const q1 = [b[0] - (b[0] - a[0]) / l1 * r, b[1] - (b[1] - a[1]) / l1 * r], q2 = [b[0] + (c[0] - b[0]) / l2 * r, b[1] + (c[1] - b[1]) / l2 * r];
      d += 'L' + f1(q1[0]) + ' ' + f1(q1[1]) + 'Q' + f1(b[0]) + ' ' + f1(b[1]) + ' ' + f1(q2[0]) + ' ' + f1(q2[1]); }
    return d + 'L' + f1(p[n - 1][0]) + ' ' + f1(p[n - 1][1]); }
  function smooth(p, closed) { const n = p.length; if (n < 2) return ''; let d = 'M' + f1(p[0][0]) + ' ' + f1(p[0][1]); const g = i => closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))];
    for (let i = 0; i < (closed ? n : n - 1); i++) { const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2); const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]; d += 'C' + f1(c1[0]) + ' ' + f1(c1[1]) + ' ' + f1(c2[0]) + ' ' + f1(c2[1]) + ' ' + f1(p2[0]) + ' ' + f1(p2[1]); }
    return d + (closed ? 'Z' : ''); }
  function rface(q, col, k) { const id = 'rf' + (++ID); return '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + mix(col, '#ffffff', .10 * (k || 1)) + '"/><stop offset="1" stop-color="' + mix(col, '#4A4A40', .10 * (k || 1)) + '"/></linearGradient></defs>' + poly(q, 'fill="url(#' + id + ')" stroke="' + col + '" stroke-width=".8" stroke-linejoin="round"'); }
  function winGrid(ax, ay, bx, by, z0, z1, floors, cols, o = {}) { let s = ''; const fh = (z1 - z0) / floors;
    for (let f = 0; f < floors; f++) { const za = z0 + f * fh + fh * (o.sill || .28), zb = za + fh * (o.wh || .5);
      if (o.ribbon) { const q = [P(ax, ay, za), P(bx, by, za), P(bx, by, zb), P(ax, ay, zb)]; const id = 'gl' + (++ID); s += '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + RC.glass1 + '"/><stop offset="1" stop-color="' + RC.glass2 + '"/></linearGradient></defs>' + poly(q, 'fill="url(#' + id + ')" opacity="' + (o.dark ? .85 : 1) + '"');
        for (let c = 1; c < cols; c++) { const t = c / cols, p0 = P(ax + (bx - ax) * t, ay + (by - ay) * t, za), p1 = P(ax + (bx - ax) * t, ay + (by - ay) * t, zb); s += '<line x1="' + f1(p0[0]) + '" y1="' + f1(p0[1]) + '" x2="' + f1(p1[0]) + '" y2="' + f1(p1[1]) + '" stroke="#E9ECE8" stroke-width="1"/>'; }
        continue; }
      for (let c = 0; c < cols; c++) { const t0 = (c + .18) / cols, t1 = (c + .82) / cols; s += poly([P(ax + (bx - ax) * t0, ay + (by - ay) * t0, za), P(ax + (bx - ax) * t1, ay + (by - ay) * t1, za), P(ax + (bx - ax) * t1, ay + (by - ay) * t1, zb), P(ax + (bx - ax) * t0, ay + (by - ay) * t0, zb)], 'fill="' + (o.dark ? RC.glass2 : mix(RC.glass1, RC.glass2, (f + c) % 3 * .2)) + '"'); } }
    return s; }
  function rbox(x0, y0, x1, y1, z0, z1, col) { return rface([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], col, .6) + rface([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], mix(col, '#5A5A50', .15), .6) + poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], 'fill="' + mix(col, '#ffffff', .15) + '"'); }
  function rblock(x0, y0, x1, y1, z0, z1, col, o = {}) { let s = rface([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], mix(col, '#ffffff', .04)) + rface([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], mix(col, '#5A5A50', .14));
    if (o.win) s += winGrid(x0, y1, x1, y1, z0, z1, o.win[0], o.win[1], o.wo || {}) + winGrid(x1, y1, x1, y0, z0, z1, o.win[0], o.win[2] || o.win[1], Object.assign({ dark: 1 }, o.wo || {}));
    if (o.fins) { const n = o.fins; for (let i = 1; i < n; i++) { const t = i / n, a = P(x0 + (x1 - x0) * t, y1, z0 + .1), b = P(x0 + (x1 - x0) * t, y1, z1 - .05); s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + mix(col, '#ffffff', .25) + '" stroke-width="3"/><line x1="' + f1(a[0] + 2) + '" y1="' + f1(a[1] + 1) + '" x2="' + f1(b[0] + 2) + '" y2="' + f1(b[1] + 1) + '" stroke="' + mix(col, '#5A5A50', .25) + '" stroke-width="1"/>'; }
      const m = Math.round(n * (y1 - y0) / (x1 - x0)); for (let i = 1; i < m; i++) { const t = i / m, a = P(x1, y1 - (y1 - y0) * t, z0 + .1), b = P(x1, y1 - (y1 - y0) * t, z1 - .05); s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="' + mix(col, '#5A5A50', .08) + '" stroke-width="3"/>'; } }
    s += poly([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], 'fill="' + (o.roof || RC.roof) + '" stroke="' + mix(col, '#ffffff', .2) + '" stroke-width="2.2" stroke-linejoin="round"');
    if (o.units !== false && (x1 - x0) * (y1 - y0) > 2) { const ux = x0 + (x1 - x0) * .25, uy = y0 + (y1 - y0) * .3; s += rbox(ux, uy, ux + .5, uy + .35, z1, z1 + .25, '#BFC1BA') + rbox(ux + .8, uy + .1, ux + 1.1, uy + .4, z1, z1 + .18, '#B3B6AF'); }
    return s; }
  function cyl(cx, cy, r, z0, z1, c, dome) { const a = P(cx, cy, z0), b = P(cx, cy, z1), rx = r * C.tw * .707, ry = r * C.th * .707, id = 'cy' + (++ID), dk = mix(c, '#4A4A40', .16);
    let s = '<defs><linearGradient id="' + id + '" x1="0" x2="1"><stop offset="0" stop-color="' + mix(c, '#ffffff', .12) + '"/><stop offset=".5" stop-color="' + c + '"/><stop offset="1" stop-color="' + dk + '"/></linearGradient></defs><path d="M' + f1(a[0] - rx) + ' ' + f1(a[1]) + 'A' + f1(rx) + ' ' + f1(ry) + ' 0 0 0 ' + f1(a[0] + rx) + ' ' + f1(a[1]) + 'L' + f1(b[0] + rx) + ' ' + f1(b[1]) + 'A' + f1(rx) + ' ' + f1(ry) + ' 0 0 1 ' + f1(b[0] - rx) + ' ' + f1(b[1]) + 'Z" fill="url(#' + id + ')"/>';
    if (dome) { const id2 = 'dm' + (++ID); s += '<defs><radialGradient id="' + id2 + '" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#fff"/><stop offset=".6" stop-color="' + mix(c, '#ffffff', .2) + '"/><stop offset="1" stop-color="' + dk + '"/></radialGradient></defs><path d="M' + f1(b[0] - rx) + ' ' + f1(b[1]) + 'A' + f1(rx) + ' ' + f1(rx * .9) + ' 0 0 1 ' + f1(b[0] + rx) + ' ' + f1(b[1]) + 'A' + f1(rx) + ' ' + f1(ry) + ' 0 0 1 ' + f1(b[0] - rx) + ' ' + f1(b[1]) + 'Z" fill="url(#' + id2 + ')"/>'; }
    else s += '<ellipse cx="' + f1(b[0]) + '" cy="' + f1(b[1]) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="' + mix(c, '#ffffff', .2) + '"/>';
    return s; }
  function rshadow(x0, y0, x1, y1, h) { const dx = h * .7, dy = h * .22; return poly([P(x0, y0), P(x1, y0), P(x1 + dx, y0 + dy), P(x1 + dx, y1 + dy), P(x0 + dx, y1 + dy), P(x0, y1)], 'fill="#3E4A2E" opacity=".26" filter="url(#csoft)"'); }
  function apron(x0, y0, x1, y1, col) { const q = gp([[x0, y0], [x1, y0], [x1, y1], [x0, y1]]); return '<polygon points="' + pts(q) + '" fill="' + (col || '#DCD8CD') + '" stroke="' + (col || '#DCD8CD') + '" stroke-width="10" stroke-linejoin="round"/><polygon points="' + pts(q) + '" fill="none" stroke="#CBC6B6" stroke-width="1.5" stroke-linejoin="round" transform="translate(0 0)"/>'; }
  function rtree(x, y, k, type) { const g = P(x, y), s = k || 1, t = type === 'poplar' ? 'poplar' : type === 'pine' ? 'pine' : 'round'; return '<use class="tr" data-d="' + (x + y).toFixed(3) + '" href="#tr-' + t + '" transform="translate(' + f1(g[0]) + ' ' + f1(g[1]) + ') scale(' + s + ')"/>'; }
  function rperson(x, y, i, dir, walk) { const g = P(x, y), sk = ['#E8C3A0', '#C99673', '#9C6B4A', '#6E4630', '#F0D3B8'][i % 5], hr = ['#2E241E', '#6B4A30', '#1C1714', '#B98A4E', '#8A8A8A'][i % 5], top = ['#F2F2EE', '#3F5E74', '#C7643E', '#E8E6DF', '#4F6B48', '#2F3B45'][i % 6], pant = ['#3B4652', '#5C6670', '#2F3640', '#7A6A58'][i % 4], w = walk ? 1 : 0;
    return '<g class="walker" transform="translate(' + f1(g[0]) + ' ' + f1(g[1]) + ') scale(' + (dir || 1) + ' 1)"><ellipse cx="4" cy="0.5" rx="6" ry="2" fill="#2E3A24" opacity=".3"/><path d="M-1.2 0l' + (w ? '-2' : '0') + ' -7M1.2 0l' + (w ? '2' : '0') + ' -7" stroke="' + pant + '" stroke-width="2.3" stroke-linecap="round"/><rect x="-3" y="-15" width="6" height="8.5" rx="2.4" fill="' + top + '"/><path d="M-3-13l' + (w ? '-1.5 5' : '-.6 5.5') + 'M3-13l' + (w ? '1.5 5' : '.6 5.5') + '" stroke="' + top + '" stroke-width="1.8" stroke-linecap="round"/><circle cx="0" cy="-17.6" r="2.6" fill="' + sk + '"/><path d="M-2.7-17.8q0-3.3 2.7-3.3q2.7 0 2.7 3.3q-1.4-1.3-2.7-1.3q-1.3 0-2.7 1.3z" fill="' + hr + '"/></g>'; }
  function rcar(x, y, col, rot) { const a = rot ? .36 : .7, b = rot ? .7 : .36; return rbox(x - a / 2, y - b / 2, x + a / 2, y + b / 2, .04, .2, col) + rbox(x - a / 2 + (rot ? .04 : .16), y - b / 2 + (rot ? .16 : .04), x + a / 2 - (rot ? .04 : .12), y + b / 2 - (rot ? .12 : .04), .2, .33, '#3E4E5A'); }
  function dishBig(x, y, k) { let s = rbox(x - .55, y - .55, x + .55, y + .55, 0, .35, '#D8D5CC') + rbox(x - .3, y - .3, x + .3, y + .3, .35, 1.6 * k, '#E8E6DF'); const b = P(x, y, 1.6 * k + .25), r = 46 * k, id = 'dg' + (++ID);
    return s + '<g transform="translate(' + f1(b[0]) + ' ' + f1(b[1]) + ') rotate(-24)"><defs><radialGradient id="' + id + '" cx=".4" cy=".35"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#C9CCC7"/></radialGradient></defs><path d="M-' + r + ' 0A' + r + ' ' + (r * .5) + ' 0 0 0 ' + r + ' 0" fill="#B9BCB6"/><ellipse rx="' + r + '" ry="' + (r * .5) + '" fill="url(#' + id + ')" stroke="#D9DBD6" stroke-width="2"/><ellipse rx="' + (r * .75) + '" ry="' + (r * .36) + '" fill="none" stroke="#C7CAC4" stroke-width="1"/><path d="M-' + (r * .6) + ' ' + (r * .1) + 'L0 -' + (r * .62) + 'L' + (r * .6) + ' ' + (r * .1) + 'M0 ' + (r * .25) + 'L0 -' + (r * .62) + '" stroke="#9AA09A" stroke-width="1.6" fill="none"/><ellipse cy="-' + (r * .64) + '" rx="' + (r * .1) + '" ry="' + (r * .05) + '" fill="#E8E6DF" stroke="#9AA09A"/></g>'; }
  function dishSmall(x, y, k, ang) { const b = P(x, y, .25), r = 13 * (k || 1); return '<ellipse cx="' + f1(b[0] + 8) + '" cy="' + f1(b[1] + 5) + '" rx="' + (r * .9) + '" ry="' + (r * .35) + '" fill="#3E4A2E" opacity=".25"/><rect x="' + f1(b[0] - 2) + '" y="' + f1(b[1] - r * .7) + '" width="4" height="' + f1(r * .7 + 6) + '" fill="#D3D1C9"/><g transform="translate(' + f1(b[0]) + ' ' + f1(b[1] - r * .8) + ') rotate(' + (ang || -30) + ')"><ellipse rx="' + r + '" ry="' + (r * .48) + '" fill="#F4F3EF" stroke="#C9CBC5" stroke-width="1.2"/><path d="M0 0V-' + (r * .6) + '" stroke="#8E948E" stroke-width="1.2"/></g>'; }
  function rocket(b, sc) { sc = sc || 1; return '<g transform="translate(' + f1(b[0]) + ' ' + f1(b[1]) + ') scale(' + sc + ')"><path d="M-7 0V-120Q-7-150 0-162Q7-150 7-120V0Z" fill="#F4F4F1"/><path d="M2 0V-120Q2-150 0-162Q7-150 7-120V0Z" fill="#D6D8D3"/><rect x="-7" y="-92" width="14" height="6" fill="#2E2E2A"/><rect x="-7" y="-60" width="14" height="2.5" fill="#C24F3A"/><path d="M-7-8l-6 8v-14l6-8zM7-8l6 8v-14l-6-8z" fill="#CFCFC9"/></g>'; }
  function pond(cx, cy) { const sh = [[cx - 1.6, cy - .4], [cx - .9, cy - 1.2], [cx + .4, cy - 1.1], [cx + 1.5, cy - .5], [cx + 1.7, cy + .5], [cx + .8, cy + 1.2], [cx - .5, cy + 1.0], [cx - 1.4, cy + .6]];
    const id = 'pw' + (++ID); let s = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8FC2C2"/><stop offset=".6" stop-color="#5E9EA3"/><stop offset="1" stop-color="#477F86"/></linearGradient></defs><path d="' + smooth(gp(sh), true) + '" fill="#CFCAB9" stroke="#BDB7A3" stroke-width="5"/><path d="' + smooth(gp(sh.map(p => [cx + (p[0] - cx) * .9, cy + (p[1] - cy) * .9])), true) + '" fill="url(#' + id + ')"/>';
    [[cx - .4, cy - .3], [cx + .7, cy + .4], [cx - 1, cy + .3], [cx + .2, cy + .7]].forEach((l, i) => { const g = P(l[0], l[1]); s += '<ellipse cx="' + f1(g[0]) + '" cy="' + f1(g[1]) + '" rx="' + (5 + i % 2 * 2) + '" ry="' + (2.6 + i % 2) + '" fill="#6E8F45"/><circle cx="' + f1(g[0] + 2) + '" cy="' + f1(g[1] - 1) + '" r="1.4" fill="#F1E3E8"/>'; });
    return s; }
  function flags(x, y) { return [[x, y], [x + .4, y - .3], [x + .8, y - .6]].map((f, i) => { const g = P(f[0], f[1]); return '<line x1="' + f1(g[0]) + '" y1="' + f1(g[1]) + '" x2="' + f1(g[0]) + '" y2="' + f1(g[1] - 40) + '" stroke="#B9BCB6" stroke-width="1.6"/><path d="M' + f1(g[0]) + ' ' + f1(g[1] - 40) + 'q8 2 16 0v10q-8 2-16 0z" fill="' + ['#3F6FB0', ORANGE, TEAL][i] + '"/>'; }).join(''); }
  // drawing of the user flag on the right face (x = X) of the assembly building
  function faceImage(X, yA, yB, z0, z1, href) { const W = 300, H = 180, span = yA - yB, o = P(X, yA, z1); const a = span / W * C.tw / 2, b = -span / W * C.th / 2, d = (z1 - z0) / H * C.tz;
    return '<image href="' + href + '" width="' + W + '" height="' + H + '" preserveAspectRatio="none" transform="matrix(' + [a, b, 0, d, o[0], o[1]].map(v => (+v).toFixed(4)).join(' ') + ')" opacity=".95"/>'; }

  // ---------- kinds: footprint w × h (grid), cost, level, draw(x0,y0) ----------
  const K = {
    admin: { n: 'Edificio amministrativo', w: 4.6, h: 4.4, core: 1, act: 'enter', draw(x, y) { return apron(x, y, x + 4.6, y + 4.4) + rshadow(x + .6, y + .4, x + 3.8, y + 2, 2.2) + rblock(x + .6, y + .4, x + 3.8, y + 2, 0, 2.2, '#EEEDE6', { win: [3, 9, 4], wo: { ribbon: 1, sill: .22, wh: .55 } }) + rblock(x + .6, y + 2, x + 2, y + 4, 0, 2.2, '#EEEDE6', { win: [3, 4, 5], wo: { ribbon: 1, sill: .22, wh: .55 } }) + rbox(x + 2, y + 2.8, x + 3, y + 3.7, 1, 1.08, '#F4F3EE') + flags(x + 3.5, y + 3.4); }, top: 2.6 },
    mcc: { n: 'Mission Control Center', w: 3.4, h: 2.6, core: 1, act: 'enter', draw(x, y) { return apron(x, y, x + 3.4, y + 2.6) + rshadow(x + .3, y + .4, x + 2.9, y + 2.2, 1.8) + rblock(x + .3, y + .4, x + 2.9, y + 2.2, 0, 1.8, '#DCD8CC', { fins: 12 }) + cyl(x + .9, y + .9, .25, 1.8, 2.5, '#E8E6DF'); }, top: 2.6 },
    fd: { n: 'Centro di dinamica del volo', w: 3, h: 2.4, core: 1, act: 'enter', draw(x, y) { const g = P(x + 2.2, y + .8, 1.4); return apron(x, y, x + 3, y + 2.4) + rshadow(x + .3, y + .4, x + 2.6, y + 2, 1.4) + rblock(x + .3, y + .4, x + 2.6, y + 2, 0, 1.4, '#E9E7E0', { win: [2, 5, 5], wo: { ribbon: 1, sill: .3, wh: .4 }, units: false }) + dishSmall(x + 2, y + .9, 1.1, -30).replace(/translate\(([\d.]+) ([\d.]+)\) rotate/, (m, a, b) => 'translate(' + a + ' ' + (b - 30) + ') rotate'); }, top: 2.4 },
    build: { n: 'Edificio di costruzione', w: 6.8, h: 5.2, core: 1, act: 'enter', draw(x, y, ctx) { const X0 = x + 2.2, Y0 = y + .8, X1 = x + 5.2, Y1 = y + 4; let v = apron(x, y, x + 6.8, y + 5.2, '#D6D2C6') + rshadow(X0, Y0, X1, Y1, 6.6) + rblock(x + .6, y + 2, X0, Y1, 0, 1.8, '#E2E0D8', { win: [2, 6, 5] }) + rblock(X0, Y0, X1, Y1, 0, 6.6, '#E9E8E2', { units: false });
      for (let k = 1; k < 10; k++) { const t = k / 10, a = P(X0 + 3 * t, Y1, .05), b = P(X0 + 3 * t, Y1, 6.55); v += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="#D6D4CC" stroke-width="1"/>'; }
      v += poly(gp([[X0 + .9, Y1, 0], [X0 + 2.1, Y1, 0], [X0 + 2.1, Y1, 5.4], [X0 + .9, Y1, 5.4]]), 'fill="#C9C9C2"') + [...Array(9)].map((_, i) => { const a = P(X0 + .9, Y1, .6 * i + .6), b = P(X0 + 2.1, Y1, .6 * i + .6); return '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="#B4B4AC" stroke-width="1"/>'; }).join('');
      if (ctx && ctx.flag) v += faceImage(X1, Y1 - .15, Y0 + .15, 2.8, 6.2, ctx.flag);
      else v += poly(gp([[X1, Y0 + .6, 1.4], [X1, Y0 + 1.5, 1.4], [X1, Y0 + 1.5, 6.1], [X1, Y0 + .6, 6.1]]), 'fill="' + ORANGE + '" opacity=".9"') + poly(gp([[X1, Y0 + 1.5, 1.4], [X1, Y0 + 2.3, 1.4], [X1, Y0 + 2.3, 6.1], [X1, Y0 + 1.5, 6.1]]), 'fill="' + TEAL + '" opacity=".9"');
      return v; }, top: 6.8, flagFace: 1 },
    test: { n: 'Edificio di testing', w: 4.8, h: 4.6, core: 1, act: 'enter', draw(x, y) { return apron(x, y, x + 4.8, y + 4.6, '#D6D2C6') + rshadow(x + .6, y + 1.4, x + 4, y + 4, 2.4) + cyl(x + 2.8, y + .85, .75, 0, 3.4, '#E7E6DF') + cyl(x + 2.8, y + .85, .75, 3.4, 3.6, '#F2F1EC', true) + rblock(x + .6, y + 1.4, x + 4, y + 4, 0, 2.4, '#E6E4DC', { win: [1, 8, 6], wo: { ribbon: 1, sill: .62, wh: .22 } }); }, top: 3.8 },
    pad: { n: 'Rampa di lancio', w: 5.6, h: 4.4, core: 1, act: 'enter', lvl: 3, c: 600, draw(x, y, ctx) { const cx = x + 2.6, cy = y + 2.0; let s = ''; const hs = [[cx - 2.2, cy - 1.2], [cx + 1.4, cy - 1.6], [cx + 2.4, cy - .2], [cx + 1.8, cy + 1.8], [cx - 1.2, cy + 2.2], [cx - 2.4, cy + .8]];
      s += '<path d="' + smooth(gp(hs), true) + '" fill="#D3CFC3" stroke="#C2BDAE" stroke-width="3"/>' + poly(gp([[cx - .25, cy + .2], [cx + 2.1, cy + .2], [cx + 2.1, cy + .75], [cx - .25, cy + .75]]), 'fill="#4A4A44"');
      const g = P(cx + 1.6, cy - 1.2, 0); s += '<line x1="' + f1(g[0] - 6) + '" y1="' + f1(g[1]) + '" x2="' + f1(g[0] - 3) + '" y2="' + f1(g[1] - 34) + '" stroke="#A9ADA6" stroke-width="2"/><line x1="' + f1(g[0] + 6) + '" y1="' + f1(g[1]) + '" x2="' + f1(g[0] + 3) + '" y2="' + f1(g[1] - 34) + '" stroke="#A9ADA6" stroke-width="2"/><circle cx="' + f1(g[0]) + '" cy="' + f1(g[1] - 44) + '" r="13" fill="#E4E5E1"/><circle cx="' + f1(g[0] - 4) + '" cy="' + f1(g[1] - 48) + '" r="5" fill="#fff" opacity=".7"/>';
      s += rshadow(cx - .5, cy - .8, cx + .1, cy - .2, 7.2); const tx0 = cx - .55, ty0 = cy - .85, tx1 = cx - .05, ty1 = cy - .35, H = 7;
      s += rface([P(tx0, ty1, 0), P(tx1, ty1, 0), P(tx1, ty1, H), P(tx0, ty1, H)], '#C24F3A', .8) + rface([P(tx1, ty0, 0), P(tx1, ty1, 0), P(tx1, ty1, H), P(tx1, ty0, H)], '#A8432F', .8);
      for (let z = .5; z < H; z += .5) { const a = P(tx0, ty1, z), b = P(tx1, ty1, z - .5), c = P(tx1, ty1, z), d = P(tx1, ty0, z - .5); s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="#E7A592" stroke-width=".8"/><line x1="' + f1(c[0]) + '" y1="' + f1(c[1]) + '" x2="' + f1(d[0]) + '" y2="' + f1(d[1]) + '" stroke="#D58C78" stroke-width=".8"/>'; }
      const m = P(cx - 1.4, cy - 1.4, 0), mt = P(cx - 1.4, cy - 1.4, 9.2); s += '<line x1="' + f1(m[0]) + '" y1="' + f1(m[1]) + '" x2="' + f1(mt[0]) + '" y2="' + f1(mt[1]) + '" stroke="#9AA09A" stroke-width="2.4"/>';
      if (ctx && ctx.rocket) s += rbox(tx1, ty0 + .15, cx + .25, ty0 + .3, 5.2, 5.38, '#B7B9B2') + rocket(P(cx + .3, cy - .6, 0), ctx.rocketH || 1);
      return s; }, top: 9.6 },
    factory: { n: 'Fabbrica', w: 3.8, h: 3, up: 1, act: 'binfo', draw(x, y) { let s = apron(x, y, x + 3.8, y + 3, '#D6D2C6') + rshadow(x + .3, y + .4, x + 3.4, y + 2.6, 1.6) + rblock(x + .3, y + .4, x + 3.4, y + 2.6, 0, 1.4, '#E4E2DA', { win: [1, 7, 5], wo: { ribbon: 1, sill: .55, wh: .3 }, units: false });
      for (let i = 0; i < 3; i++) { const a = x + .3 + i * 1.03, b = a + 1.03; s += poly(gp([[a, y + .4, 1.4], [b, y + .4, 1.4], [b, y + .4, 2.0], [b, y + 2.6, 2.0], [b, y + 2.6, 1.4], [a, y + 2.6, 1.4]]), 'fill="#B9C9CF"') + poly(gp([[b, y + .4, 1.4], [b, y + 2.6, 1.4], [b, y + 2.6, 2.0], [b, y + .4, 2.0]]), 'fill="#8FB0BA"'); }
      return s + cyl(x + .7, y + .8, .18, 1.4, 3, '#C9C8C1'); }, top: 3.2 },
    ground: { n: 'Stazione di terra', w: 3, h: 3, up: 1, act: 'binfo', draw(x, y) { return apron(x, y, x + 3, y + 3, '#D6D2C6') + rblock(x + .3, y + 1.9, x + 1.3, y + 2.8, 0, .9, '#E6E4DC', { win: [1, 2, 2], units: false }) + dishBig(x + 1.8, y + 1.2, 1); }, top: 4.2 },
    rnd: { n: 'Centro R&D', w: 3.2, h: 3, up: 1, act: 'binfo', draw(x, y) { return apron(x, y, x + 3.2, y + 3) + rshadow(x + .3, y + .4, x + 2.9, y + 2.6, 1.8) + rblock(x + .3, y + .4, x + 2.9, y + 2.6, 0, 1.8, '#EEEDE6', { win: [2, 6, 5], wo: { ribbon: 1, sill: .2, wh: .62 }, units: false }) + cyl(x + 1.6, y + 1.5, .6, 1.8, 2, '#F2F1EC', true); }, top: 3 },
    office: { n: 'Ufficio partnership', w: 2.6, h: 2.6, up: 1, act: 'binfo', draw(x, y) { return apron(x, y, x + 2.6, y + 2.6) + rshadow(x + .4, y + .4, x + 2.2, y + 2.2, 3.4) + rblock(x + .4, y + .4, x + 2.2, y + 2.2, 0, 3.4, '#E9E8E2', { win: [5, 4, 4], wo: { ribbon: 1, sill: .18, wh: .62 } }); }, top: 4 },
    visit: { n: 'Centro visitatori', w: 4, h: 3, up: 1, act: 'binfo', draw(x, y) { return apron(x, y, x + 4, y + 3) + rshadow(x + .3, y + .3, x + 2.6, y + 2.2, 1.2) + rblock(x + .3, y + .3, x + 2.6, y + 2.2, 0, 1.2, '#EEEDE6', { win: [1, 6, 4], wo: { ribbon: 1, sill: .2, wh: .6 } }) + rocket(P(x + 3.3, y + 1.4, 0), .55) + rocket(P(x + 3.1, y + 2.4, 0), .42); }, top: 4 },
    tree: { n: 'Albero', w: .9, h: .9, deco: 1, c: 5, draw(x, y) { return rtree(x + .45, y + .45, 1.05, 'round'); } },
    pine: { n: 'Pino', w: .9, h: .9, deco: 1, c: 5, draw(x, y) { return rtree(x + .45, y + .45, 1.05, 'pine'); } },
    poplar: { n: 'Pioppo', w: .6, h: .6, deco: 1, c: 4, draw(x, y) { return rtree(x + .3, y + .3, 1.05, 'poplar'); } },
    pond: { n: 'Laghetto', w: 3.6, h: 2.8, deco: 1, c: 30, draw(x, y) { return pond(x + 1.8, y + 1.4); } },
    parking: { n: 'Parcheggio', w: 4, h: 2, deco: 1, c: 40, draw(x, y) { let s = apron(x, y, x + 4, y + 2, '#C9C7BF'); for (let i = 0; i < 7; i++) { const a = P(x + .3 + i * .52, y + .1), b = P(x + .3 + i * .52, y + .8), c = P(x + .3 + i * .52, y + 1.2), d = P(x + .3 + i * .52, y + 1.9); s += '<line x1="' + f1(a[0]) + '" y1="' + f1(a[1]) + '" x2="' + f1(b[0]) + '" y2="' + f1(b[1]) + '" stroke="#F2F0E9" stroke-width="1.2"/><line x1="' + f1(c[0]) + '" y1="' + f1(c[1]) + '" x2="' + f1(d[0]) + '" y2="' + f1(d[1]) + '" stroke="#F2F0E9" stroke-width="1.2"/>'; }
      [[.55, .45, '#C9CCCB'], [1.07, .45, '#4E6A86'], [2.11, .45, '#9B4A3C'], [3.15, .45, '#E3E1DA'], [.55, 1.55, '#5B5F5A'], [1.59, 1.55, '#D9D6CE'], [2.63, 1.55, '#7D8C6A']].forEach(c => s += rcar(x + c[0], y + c[1], c[2], 1)); return s; } },
    dish: { n: 'Antenna di comunicazione', w: 1, h: 1, deco: 1, c: 15, draw(x, y, ctx) { return dishSmall(x + .5, y + .5, 1, ctx && ctx.ang || -28); } },
  };
  // ---------- roads (fixed network) and site ----------
  const R1 = [[-130, 25.7], [-14, 17.6], [-4, 16.9], [1, 16.6], [6, 16.5], [11.4, 15.9], [16.6, 14], [19.6, 10.8], [21.8, 8.8], [26, 8.4], [36, 8.6], [150, 10.9]];
  const R2 = [[6, 16.5], [6.25, 13.4], [6.5, 10.4], [6.2, 8.6], [4.6, 7.8], [1, 7.5], [-14, 6.6], [-130, -0.4]];
  const R3 = [[6.45, 9.4], [9.4, 8.7], [12.6, 8.5], [15.6, 8.4], [18.6, 8.5], [21.8, 8.8]];
  const ROADS = [[R1, 15], [R2, 11], [R3, 11]];
  const SITE0 = [[-4, -3], [6, -6], [16, -6.5], [24, -8], [31, -6], [32.5, 4], [30, 13], [25.5, 19], [16, 22], [5, 22.5], [-2.5, 20.5], [-5, 9]];
  let SITE = SITE0.map(p => p.slice()), SCALE = 1;
  function setScale(k) { if (k === SCALE) return; SCALE = k; const cx = 13.75, cy = 7.25; SITE = SITE0.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]); }
  function densify(pl, step) { const out = []; for (let i = 0; i < pl.length - 1; i++) { const a = pl[i], b = pl[i + 1], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / (step || .25))); for (let k = 0; k < n; k++) out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); } out.push(pl[pl.length - 1]); return out; }
  function distPL(p, pl) { let m = 1e9; for (let i = 0; i < pl.length - 1; i++) { const a = pl[i], b = pl[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], L = dx * dx + dy * dy || 1; let t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / L; t = Math.max(0, Math.min(1, t)); m = Math.min(m, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy)); } return m; }
  const RD = ROADS.map(r => [r[0], r[1] / 2 / 26 + .22]);
  function inPoly(p, pg) { let c = false; for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) { const a = pg[i], b = pg[j]; if ((a[1] > p[1]) !== (b[1] > p[1]) && p[0] < (b[0] - a[0]) * (p[1] - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; }
  // world default layout
  function defaultWorld() { const it = []; let n = 0; const add = (k, x, y, o) => it.push(Object.assign({ id: 'w' + (++n), k, x, y }, o || {}));
    add('admin', 0.9, 10.2); add('mcc', 7.4, 12.2); add('fd', 12.2, 11.2); add('build', 11.7, 2.4); add('test', 6.4, 3.0); add('pond', -1.6, 3.9); add('parking', 7.5, 17.1);
    for (let i = 0; i < 8; i++) add('poplar', -1.9 + i * 1.05, 17.6 - i * .08);
    [[-2.8, 8.2, 'pine'], [-2.5, 14.4, 'pine'], [18.2, 12.2, 'tree'], [19.2, 14, 'pine'], [17, 16, 'tree'], [21, 4.6, 'pine'], [23.2, 3.4, 'tree'], [22.2, 11, 'tree'], [11.2, 13.6, 'tree'], [16.4, 1, 'pine'], [10.8, 1, 'tree'], [19.2, 6.2, 'tree'], [15.4, 16.4, 'tree'], [2.6, 18.6, 'tree'], [13.4, 18.4, 'pine'], [-.8, 3.8, 'tree'], [7, 14.4, 'tree']].forEach(t => add(t[2], t[0], t[1]));
    const ok = []; it.forEach(x => { const why = valid(x.k, x.x, x.y, ok, null); if (!why) ok.push(x); else if (typeof console !== 'undefined' && (K[x.k].core)) console.warn('campus: ' + x.k + ' ' + why); }); return { items: ok, n: 100, cam: { x: 0, y: 0, z: 1 } }; }
  function rectOf(k, x, y) { const d = K[k]; return [x, y, x + d.w, y + d.h]; }
  function overlap(a, b, g) { return a[0] < b[2] + g && a[2] > b[0] - g && a[1] < b[3] + g && a[3] > b[1] - g; }
  function valid(k, x, y, items, skipId, extraRoads) { const r = rectOf(k, x, y), d = K[k];
    const corners = [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]; if (!corners.every(c => inPoly(c, SITE))) return 'fuori dal campus';
    for (const it of items) { if (it.id === skipId) continue; if (overlap(r, rectOf(it.k, it.x, it.y), d.deco && K[it.k].deco ? .05 : .2)) return 'c’è già ' + K[it.k].n.toLowerCase(); }
    const samp = []; for (let i = 0; i <= 4; i++) for (let j = 0; j <= 4; j++) samp.push([r[0] + (r[2] - r[0]) * i / 4, r[1] + (r[3] - r[1]) * j / 4]);
    for (const [pl, half] of RD.concat(extraRoads || [])) for (const p of samp) if (distPL(p, pl) < half) return 'sopra una strada';
    return ''; }
  // ---------- world render ----------
  function crawler(items) { const b = items.find(i => i.k === 'build'), p = items.find(i => i.k === 'pad'); if (!b || !p) return null; const a = [b.x + 5.4, b.y + 2.4], z = [p.x + 1, p.y + 2.2]; return [a, lerp(a, z, .35), lerp(a, z, .7), z]; }
  const STREAM = [[39, -140], [37, -16], [35.4, -4], [36.6, 6], [34.6, 16], [35.6, 26], [33, 38], [31, 160]];
  const hsh = (a, b) => { let h = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return h - Math.floor(h); };
  let NAT = null, NATK = 0;
  function nature() { if (NAT && NATK === SCALE) return NAT; NATK = SCALE; const ring = SITE.concat([SITE[0]]), cx = 13.75, cy = 7.25, hills = [], trees = [];
    const R0 = Math.max(...SITE.map(p => Math.hypot(p[0] - cx, p[1] - cy)));
    for (let a = 0; a < 360; a += 33) { const t = (a + hsh(a, 3) * 14) * Math.PI / 180, r = R0 + 5 + hsh(a, 7) * 7, x = cx + Math.cos(t) * r, y = cy + Math.sin(t) * r * .9;
      if (RD.some(([pl, h]) => distPL([x, y], pl) < h + 4.5) || distPL([x, y], STREAM) < 5 || distPL([x, y], ring) < 3.5) continue; hills.push({ x, y, r: 3 + hsh(a, 11) * 2.6, h: 30 + hsh(a, 13) * 34 }); }
    const inHill = (x, y) => hills.some(hl => Math.hypot(x - hl.x, y - hl.y) < hl.r * 1.05 || (x + y < hl.x + hl.y && Math.abs((x - y) - (hl.x - hl.y)) < hl.r * 1.3 && hl.x + hl.y - (x + y) < hl.r * 2.6));
    const gx0 = cx - (cx + 22) * SCALE - 4, gx1 = cx + (48 - cx) * SCALE + 4, gy0 = cy - (cy + 22) * SCALE - 4, gy1 = cy + (40 - cy) * SCALE + 4;
    for (let x = gx0; x <= gx1; x += 1.05) for (let y = gy0; y <= gy1; y += 1.05) { const jx = x + (hsh(x, y) - .5) * .8, jy = y + (hsh(y, x) - .5) * .8, p = [jx, jy];
      if (inPoly(p, SITE)) continue; const d = distPL(p, ring); if (d < .8 || d > 26) continue;
      if (RD.some(([pl, h]) => distPL(p, pl) < h + .45) || distPL(p, STREAM) < 1.1 || inHill(jx, jy)) continue;
      const keep = d < 4 ? .8 : d < 9 ? .55 : .3; if (hsh(jx * 3.1, jy * 1.7) > keep) continue;
      const q = hsh(jx * 5.3, jy * 2.9); trees.push({ x: jx, y: jy, t: q < .5 ? 'pine' : q < .85 ? 'round' : 'poplar', k: .85 + hsh(jy * 7.7, jx) * .45 }); }
    NAT = { hills, trees }; return NAT; }
  function naturalTrees(view) { return nature().trees.flatMap((t, i) => {
    if (!t.screen) { t.screen = P(t.x, t.y); t.svg = rtree(t.x, t.y, t.k, t.t).replace('class="tr"', 'class="tr" data-nat="' + i + '"'); }
    const g = t.screen; return view && (g[0] < view.x0 || g[0] > view.x1 || g[1] < view.y0 || g[1] > view.y1) ? [] : [{ id: String(i), d: t.x + t.y, svg: t.svg }];
  }); }
  function crossing() { let best = null; for (let i = 0; i < R1.length - 1; i++) { const a = R1[i], b = R1[i + 1]; for (let k = 0; k <= 400; k++) { const p = lerp(a, b, k / 400), d = distPL(p, STREAM); if (!best || d < best.d) best = { d, p, u: [b[0] - a[0], b[1] - a[1]] }; } } const L = Math.hypot(best.u[0], best.u[1]); best.u = [best.u[0] / L, best.u[1] / L]; return best; }
  let BR = null;
  function bridge() { BR = BR || crossing(); const c = BR.p, u = BR.u, n = [-u[1], u[0]], hw = .36, sp = 1.05, at = (t, o, z) => P(c[0] + u[0] * t + n[0] * o, c[1] + u[1] * t + n[1] * o, z || 0);
    let o = '';
    [-1, 1].forEach(sd => { const oo = sd * hw; o += '<polygon points="' + pts([at(-sp, oo), at(sp, oo), at(sp, oo, -.12), at(-sp, oo, -.12)]) + '" fill="#B7B3A6"/>';
      o += '<polygon points="' + pts([at(-sp, oo), at(sp, oo), at(sp, oo + sd * .07), at(-sp, oo + sd * .07)]) + '" fill="#E3DFD3"/>';
      for (let t = -sp; t <= sp + 1e-6; t += sp / 4) { const a = at(t, oo + sd * .035), b = at(t, oo + sd * .035, .22); o += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'V' + f1(b[1]) + '" stroke="#8C97A0" stroke-width="1.6"/>'; }
      const a = at(-sp, oo + sd * .035, .22), b = at(sp, oo + sd * .035, .22); o += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]) + '" stroke="#C9D0D6" stroke-width="2.2" stroke-linecap="round"/>'; });
    return o; }
  function hillSVG(hl) { const g = P(hl.x, hl.y), rx = hl.r * C.tw * .72, ry = rx * .5, h = hl.h;
    return '<g><ellipse cx="' + f1(g[0] + rx * .12) + '" cy="' + f1(g[1] + ry * .25) + '" rx="' + f1(rx) + '" ry="' + f1(ry) + '" fill="#7E9858" opacity=".35"/>' +
      '<path d="M' + f1(g[0] - rx) + ' ' + f1(g[1]) + 'C' + f1(g[0] - rx * .55) + ' ' + f1(g[1] - h * 1.15) + ' ' + f1(g[0] + rx * .45) + ' ' + f1(g[1] - h * 1.2) + ' ' + f1(g[0] + rx) + ' ' + f1(g[1]) + 'Q' + f1(g[0]) + ' ' + f1(g[1] + ry * .9) + ' ' + f1(g[0] - rx) + ' ' + f1(g[1]) + 'Z" fill="url(#chill)"/>' +
      '<path d="M' + f1(g[0] - rx * .1) + ' ' + f1(g[1] - h * .9) + 'C' + f1(g[0] + rx * .3) + ' ' + f1(g[1] - h * .85) + ' ' + f1(g[0] + rx * .7) + ' ' + f1(g[1] - h * .4) + ' ' + f1(g[0] + rx) + ' ' + f1(g[1]) + 'Q' + f1(g[0] + rx * .6) + ' ' + f1(g[1] + ry * .5) + ' ' + f1(g[0] + rx * .2) + ' ' + f1(g[1] + ry * .6) + 'C' + f1(g[0] + rx * .45) + ' ' + f1(g[1] - h * .3) + ' ' + f1(g[0] + rx * .2) + ' ' + f1(g[1] - h * .7) + ' ' + f1(g[0] - rx * .1) + ' ' + f1(g[1] - h * .9) + 'Z" fill="#6F8A4A" opacity=".35"/></g>'; }
  function world(st, ctx) { ID = 0; let s = ''; const items = st.items; const NATR = nature();
    // ground
    s += '<rect x="-3000" y="-3000" width="7000" height="7000" fill="#A9BF77"/><rect x="-600" y="-500" width="2500" height="1800" fill="url(#groundg)" opacity=".55"/>';
    for (let i = 0; i < 220; i++) { const x = ((i * 173) % 2400) - 560, y = ((i * 97) % 1700) - 460; s += '<ellipse cx="' + x + '" cy="' + y + '" rx="' + (8 + (i % 6) * 4) + '" ry="' + (3 + (i % 4) * 1.6) + '" fill="' + ['#B7CA86', '#9DB46A', '#AFC37E', '#93AC62'][i % 4] + '" opacity=".55"/>'; }
    for (let i = 0; i < 260; i++) { const x = ((i * 211) % 2400) - 560, y = ((i * 131) % 1700) - 460; s += '<circle cx="' + x + '" cy="' + y + '" r="1.3" fill="' + ['#F2EFE4', '#E9D98A', '#D9B7C9'][i % 3] + '" opacity=".7"/>'; }
    const stream = STREAM; s += '<defs><linearGradient id="chill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B5C985"/><stop offset="1" stop-color="#93AD62"/></linearGradient></defs>'; s += '<path d="' + smooth(gp(stream)) + '" fill="none" stroke="#B9C99A" stroke-width="13" stroke-linecap="round"/><path d="' + smooth(gp(stream)) + '" fill="none" stroke="#86B6B4" stroke-width="7" stroke-linecap="round"/>';
    NATR.hills.slice().sort((a, b) => (a.x + a.y) - (b.x + b.y)).forEach(hl => s += hillSVG(hl));
    s += '<path d="' + smooth(gp(SITE), true) + '" fill="#ADC47A" opacity=".85"/><path d="' + smooth(gp(SITE), true) + '" fill="none" stroke="#8E968D" stroke-width="1.2" stroke-dasharray="3 3"/>';
    const cw = crawler(items); if (cw) s += '<path d="' + smooth(gp(cw)) + '" fill="none" stroke="#D9D2BC" stroke-width="18" stroke-linecap="round"/><path d="' + smooth(gp(cw)) + '" fill="none" stroke="#9BB46A" stroke-width="6"/>';
    ROADS.forEach(r => s += '<path d="' + rpath(r[0]) + '" fill="none" stroke="' + RC.curb + '" stroke-width="' + (r[1] + 6) + '" stroke-linecap="round" stroke-linejoin="round"/>');
    ROADS.forEach(r => s += '<path d="' + rpath(r[0]) + '" fill="none" stroke="' + RC.asph + '" stroke-width="' + r[1] + '" stroke-linecap="round" stroke-linejoin="round"/>');
    // tratteggio: la strada principale prosegue dritta agli incroci, quelle laterali si fermano al bordo
    const JM = [[], [[6, 16.5, 13]], [[6.45, 9.4, 11], [21.8, 8.8, 34]]], dash = d => '<path d="' + d + '" fill="none" stroke="#F3F1EA" stroke-width="1.6" stroke-dasharray="10 10" opacity=".85"/>';
    ROADS.forEach((r, i) => { if (!JM[i].length) { s += dash(rpath(r[0])); return; } const id = 'rdm' + i;
      s += '<mask id="' + id + '" maskUnits="userSpaceOnUse" x="-9000" y="-9000" width="20000" height="20000"><rect x="-9000" y="-9000" width="20000" height="20000" fill="#fff"/>' + JM[i].map(j => { const g = P(j[0], j[1]); return '<ellipse cx="' + f1(g[0]) + '" cy="' + f1(g[1]) + '" rx="' + j[2] + '" ry="' + f1(j[2] * .7) + '" fill="#000"/>'; }).join('') + '</mask><g mask="url(#' + id + ')">' + dash(rpath(r[0])) + '</g>'; });
    s += bridge();
    // depth sorted objects
    const list = items.map(it => ({ d: it.x + it.y + (K[it.k].w + K[it.k].h) / 2, it }));
    const people = [[5.4, 15.8, 0, 1], [4.4, 9.6, 5, -1], [11.4, 10.4, 1, 1], [12.8, 7.9, 0, 1], [16.2, 9.6, 3, -1], [8.6, 7.9, 4, 1], [20.4, 9.9, 2, 1], [2.6, 8.4, 1, -1]];
    if (!(ctx && ctx.walkers)) people.forEach(p => list.push({ d: p[0] + p[1], svg: rperson(p[0], p[1], p[2], p[3], 1) }));
    naturalTrees(ctx && ctx.view).forEach(t => list.push({ d: t.d, svg: t.svg }));

    if (ctx && ctx.walkers) ctx.walkers.forEach(w => list.push({ d: w.d, svg: w.svg, wk: 1 }));
    list.sort((a, b) => a.d - b.d).forEach(o => { if (o.wk) { s += o.svg; return; } if (o.svg) { s += o.svg; return; } const it = o.it, d = K[it.k], sel = st.sel === it.id;
      const attrs = st.mode ? 'data-wid="' + it.id + '"' : (d.core ? 'data-act="enter" data-k="' + it.k + '"' : d.up ? 'data-act="binfo" data-k="' + it.k + '"' : 'data-wid="' + it.id + '"');
      s += '<g class="wobj' + (sel ? ' wsel' : '') + (st.moving === it.id ? ' wmov' : '') + '" data-d="' + o.d.toFixed(3) + '" ' + attrs + '><title>' + d.n + '</title>' + d.draw(it.x, it.y, Object.assign({ ang: it.ang }, ctx && ctx[it.k] || {}, it.k === 'build' ? { flag: ctx && ctx.flag } : {})) + '</g>'; });
    // labels for core buildings
    items.filter(it => K[it.k].core || K[it.k].up).forEach(it => { const d = K[it.k], g = P(it.x + d.w / 2, it.y + d.h / 2, d.top || 3), lab = ctx && ctx.labels && ctx.labels[it.k] || ''; if (!lab) return;
      const w = Math.max(80, d.n.length * 7.2 + 26 + (lab ? 26 : 0)); s += '<g class="wlab" ' + (d.core ? 'data-act="enter" data-k="' + it.k + '"' : 'data-act="binfo" data-k="' + it.k + '"') + '><rect x="' + f1(g[0] - w / 2) + '" y="' + f1(g[1] - 34) + '" width="' + w + '" height="26" rx="13" fill="rgba(250,250,246,.94)" filter="url(#cds)"/><text x="' + f1(g[0] - w / 2 + 13) + '" y="' + f1(g[1] - 17) + '" font-family="' + FT + '" font-weight="700" font-size="11.5" fill="' + DARK + '">' + d.n + '</text>' + (lab ? '<circle cx="' + f1(g[0] + w / 2 - 14) + '" cy="' + f1(g[1] - 21) + '" r="9" fill="' + (lab === '!' ? ORANGE : TEAL) + '"/><text x="' + f1(g[0] + w / 2 - 14) + '" y="' + f1(g[1] - 17) + '" text-anchor="middle" font-family="' + FD + '" font-weight="800" font-size="' + (lab === '!' ? 12 : 9) + '" fill="#fff">' + lab + '</text>' : '') + '</g>'; });
    return s; }
  // Reuse each detailed tree as an SVG image so browsers can cache its rendering.
  const TREE_ART = { 'poplar': '<ellipse cx="14" cy="3" rx="16" ry="6" fill="#3E4A2E" opacity=".28"/><rect x="-1.2" y="-8" width="2.4" height="8" fill="#6B5A48"/><ellipse cx="0" cy="-24" rx="6.5" ry="19" fill="#5F7F3E"/><ellipse cx="-2" cy="-27" rx="4" ry="14" fill="#7D9C50"/>', 'pine': '<ellipse cx="14" cy="3" rx="16" ry="6" fill="#3E4A2E" opacity=".28"/><rect x="-1.6" y="-14" width="3.2" height="14" fill="#7A6450"/><ellipse cx="0" cy="-20" rx="17" ry="8" fill="#4F6E3A"/><ellipse cx="-3" cy="-23" rx="12" ry="5.5" fill="#6A8A48"/>', 'round': '<ellipse cx="14" cy="3" rx="16" ry="6" fill="#3E4A2E" opacity=".28"/><rect x="-1.8" y="-10" width="3.6" height="10" fill="#6B5A48"/><circle cx="-5" cy="-16" r="8" fill="#56763A"/><circle cx="5" cy="-17" r="8.5" fill="#56763A"/><circle cx="0" cy="-23" r="9.5" fill="#6B8C45"/><circle cx="-3" cy="-26" r="5" fill="#88A85A"/>' };
  const TREE_DEFS = Object.keys(TREE_ART).map(type => {
    const image = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -46 55 55">' + TREE_ART[type] + '</svg>';
    return '<symbol id="tr-' + type + '" overflow="visible"><image x="-20" y="-46" width="55" height="55" href="data:image/svg+xml,' + encodeURIComponent(image) + '"/></symbol>';
  }).join('');
  const DEFS = '<defs><filter id="csoft" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="7"/></filter><filter id="cds" x="-20%" y="-20%" width="140%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#3E4A2E" flood-opacity=".2"/></filter><radialGradient id="groundg" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#B7CA86"/><stop offset="1" stop-color="#A9BF77"/></radialGradient>' + TREE_DEFS + '</defs>';
  // ghost for placement
  function ghost(k, x, y, ok, ctx) { const d = K[k], r = rectOf(k, x, y); return '<g opacity=".72">' + d.draw(x, y, ctx || {}) + '</g>' + poly(gp([[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]]), 'fill="' + (ok ? 'rgba(69,169,163,.22)' : 'rgba(207,94,76,.28)') + '" stroke="' + (ok ? TEAL : '#CF5E4C') + '" stroke-width="2.5" stroke-dasharray="8 5"'); }
  function toGrid(sx, sy) { const a = (sx - C.ox) / (C.tw / 2), b = (sy - C.oy) / (C.th / 2); return [(a + b) / 2, (b - a) / 2]; }
  function mini(k) { const keep = C; const d = K[k]; const sc = Math.min(1, 3.2 / Math.max(d.w, d.h, (d.top || 1) * .55)); C = { ox: 0, oy: 0, tw: 22 * sc, th: 11 * sc, tz: 11 * sc }; const g = P(d.w / 2, d.h / 2); const s = '<g transform="translate(' + f1(-g[0]) + ' ' + f1(-g[1] + 10) + ')">' + d.draw(0, 0, { rocket: 1, ang: -28 }) + '</g>'; C = keep; return s; }
  return { site: () => SITE, setScale, K, DEFS, world, naturalTrees, ghost, valid, toGrid, defaultWorld, rectOf, mini, crawler, P: (x, y, z) => P(x, y, z), C: () => C };
})();

