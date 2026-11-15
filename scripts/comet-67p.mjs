// Comet 67P/Churyumov-Gerasimenko for the game (public/tex/comet67p.json) from the official SHAP5 SPC plate model
// (NASA PDS / ESA PSA, RO-C-MULTI-5-67P-SHAPE-V2.0, file cg_spc_shap5_012k_cart.wrl, see public/tex/CREDITS.md).
// Nothing is invented: the shape is the plate model; the 3 grey tones come from the geometry itself
// (concave smooth ground = lighter dust deposits, rough convex cliffs = darker), quantised and cleaned like the planet maps.
// Usage: node scripts/comet-67p.mjs <cg_spc_shap5_012k_cart.wrl> public/tex/comet67p.json
import { readFileSync, writeFileSync } from 'node:fs';
const [inp, out] = process.argv.slice(2);
const txt = readFileSync(inp, 'utf8');
const pBlk = txt.slice(txt.indexOf('point ['), txt.indexOf(']', txt.indexOf('point [')));
const iBlk = txt.slice(txt.indexOf('coordIndex ['), txt.indexOf(']', txt.indexOf('coordIndex [')));
const nums = s => s.split('\n').filter(l => !l.trim().startsWith('#')).join(' ').match(/-?\d+(\.\d+)?(E[-+]?\d+)?/gi).map(Number);
const raw = nums(pBlk.slice(7)), idx = nums(iBlk.slice(12));
const NV = raw.length / 3; const F = [];
for (let i = 0; i < idx.length; i += 4) { if (idx[i + 3] !== -1) throw new Error('not triangles'); F.push([idx[i], idx[i + 1], idx[i + 2]]); }
// game axes: (x,y,z) -> (x, z, -y): proper rotation, z (spin axis) becomes three.js up
const P = []; let rMax = 0;
for (let i = 0; i < NV; i++) { const x = raw[i * 3], y = raw[i * 3 + 1], z = raw[i * 3 + 2]; P.push([x, z, -y]); rMax = Math.max(rMax, Math.hypot(x, y, z)); }
let vol = 0; for (const [a, b, c] of F) { const A = P[a], B = P[b], C = P[c]; vol += (A[0] * (B[1] * C[2] - B[2] * C[1]) - A[1] * (B[0] * C[2] - B[2] * C[0]) + A[2] * (B[0] * C[1] - B[1] * C[0])) / 6; }
if (vol < 0) F.forEach(f => { const t = f[1]; f[1] = f[2]; f[2] = t; });
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], crs = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], nrm = v => { const l = Math.hypot(...v) || 1; return v.map(x => x / l); }, dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
// neighbours
const NB = Array.from({ length: NV }, () => new Set()), VF = Array.from({ length: NV }, () => []);
F.forEach((f, k) => { for (let j = 0; j < 3; j++) { NB[f[j]].add(f[(j + 1) % 3]); NB[f[j]].add(f[(j + 2) % 3]); VF[f[j]].push(k); } });
const FN = F.map(([a, b, c]) => crs(sub(P[b], P[a]), sub(P[c], P[a])));
let N = P.map((_, i) => nrm(VF[i].reduce((s, k) => [s[0] + FN[k][0], s[1] + FN[k][1], s[2] + FN[k][2]], [0, 0, 0])));
const N0 = N;
// smoothed normals for clean toon bands (positions untouched: the silhouette stays the real one)
for (let pass = 0; pass < 7; pass++) N = N.map((n, i) => { let s = [n[0] * 2, n[1] * 2, n[2] * 2]; NB[i].forEach(j => { s = [s[0] + N[j][0], s[1] + N[j][1], s[2] + N[j][2]]; }); return nrm(s); });
// 3-ring neighbourhood
const ring = i => { const seen = new Set([i]); let fr = [i]; for (let r = 0; r < 4; r++) { const nx = []; fr.forEach(v => NB[v].forEach(j => { if (!seen.has(j)) { seen.add(j); nx.push(j); } })); fr = nx; } seen.delete(i); return [...seen]; };
const score = P.map((p, i) => { const R = ring(i); let c = [0, 0, 0], rough = 0; R.forEach(j => { c = [c[0] + P[j][0], c[1] + P[j][1], c[2] + P[j][2]]; rough += 1 - dot(N0[i], N0[j]); });
  c = c.map(v => v / R.length); const cav = dot(sub(c, p), N[i]) / rMax * 100; return cav * 1.0 - (rough / R.length) * 6; });
// face score -> 3 tones by percentile (25% dark, 50% mid, 25% light)
const fs = F.map(f => (score[f[0]] + score[f[1]] + score[f[2]]) / 3), srt = [...fs].sort((a, b) => a - b);
const q1 = srt[Math.floor(srt.length * .22)], q3 = srt[Math.floor(srt.length * .80)];
let tone = fs.map(s => s < q1 ? 0 : s > q3 ? 2 : 1);
// face adjacency (shared edge) + majority filter: removes speckles, keeps shapes
const EF = new Map(); F.forEach((f, k) => { for (let j = 0; j < 3; j++) { const a = f[j], b = f[(j + 1) % 3], key = a < b ? a + ',' + b : b + ',' + a; (EF.get(key) || EF.set(key, []).get(key)).push(k); } });
const FA = F.map(() => []); EF.forEach(l => { if (l.length === 2) { FA[l[0]].push(l[1]); FA[l[1]].push(l[0]); } });
const FA2 = FA.map((l, k) => { const s = new Set(l); l.forEach(m => FA[m].forEach(n => s.add(n))); s.delete(k); return [...s]; });
for (let pass = 0; pass < 6; pass++) tone = tone.map((t, k) => { const c = [0, 0, 0]; c[t] += 2; FA2[k].forEach(m => c[tone[m]]++); return c.indexOf(Math.max(...c)); });
// quantise: positions int16 of r/rMax, normals int8, faces uint16, tones uint8
const q = new Int16Array(NV * 3), qn = new Int8Array(NV * 3);
P.forEach((p, i) => { for (let k = 0; k < 3; k++) { q[i * 3 + k] = Math.round(p[k] / rMax * 32767); qn[i * 3 + k] = Math.round(N[i][k] * 127); } });
const fi = new Uint16Array(F.flat()), ft = new Uint8Array(tone);
// size along the principal axes (power iteration on the vertex covariance, then deflation)
const mu = [0, 1, 2].map(k => P.reduce((s, p) => s + p[k], 0) / NV), C = [0, 1, 2].map(a => [0, 1, 2].map(b => P.reduce((s, p) => s + (p[a] - mu[a]) * (p[b] - mu[b]), 0)));
const axes = []; for (let k = 0; k < 3; k++) { let v = nrm([1, .3 + k, .7 - k * .4]); axes.forEach(a => { const d = dot(v, a); v = nrm(v.map((x, i) => x - d * a[i])); });
  for (let it = 0; it < 200; it++) { let w = C.map(r => dot(r, v)); axes.forEach(a => { const d = dot(w, a); w = w.map((x, i) => x - d * a[i]); }); v = nrm(w); } axes.push(v); }
const dims = axes.map(a => { const pr = P.map(p => dot(p, a)); return +(Math.max(...pr) - Math.min(...pr)).toFixed(2); });
const b64 = a => Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64');
const res = { src: 'NASA PDS / ESA PSA RO-C-MULTI-5-67P-SHAPE-V2.0, ' + inp.split(/[\\/]/).pop() + ' (Gaskell, Jorda, Capanna, Hviid, Gutierrez 2017)', km: +rMax.toFixed(3), dims, nv: NV, nf: F.length, p: b64(q), n: b64(qn), f: b64(fi), t: b64(ft) };
writeFileSync(out, JSON.stringify(res));
console.log('verts', NV, 'faces', F.length, 'rMax km', rMax.toFixed(3), 'vol km3', Math.abs(vol).toFixed(2), vol < 0 ? '(flipped)' : '', 'tones', [0, 1, 2].map(t => tone.filter(x => x === t).length), 'bytes', JSON.stringify(res).length);
