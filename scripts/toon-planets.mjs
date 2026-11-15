// Turns the real NASA planet maps into cartoon-style maps without inventing anything:
// a Kuwahara filter flattens colours into even areas while keeping coastlines, craters and ice caps,
// the colours are reduced to a small palette taken from the map itself (a little more vivid),
// and a thin dark line is drawn where the colour changes a lot, like an ink outline.
//
// Usage: node scripts/toon-planets.mjs <input dir with earth/moon/mars/venus.jpg> <output dir>
// The originals are in the git history (public/tex before the toon maps). Needs a Chromium browser:
// set CHROME_PATH, otherwise Microsoft Edge is used from its default Windows path.
import { chromium } from 'playwright-core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const [inDir, outDir] = process.argv.slice(2);
if (!inDir || !outDir) { console.error('Usage: node scripts/toon-planets.mjs <inDir> <outDir>'); process.exit(1); }
// r = Kuwahara radius, k = palette size, sat = saturation boost, lift = gamma that brightens dark colours, edge = colour distance that gets an outline
const PLANETS = {
  earth: { r: 5, k: 12, sat: 1.55, lift: .78, edge: 60 },
  moon: { r: 3, k: 7, sat: 1.0, lift: .85, edge: 30 },
  mars: { r: 4, k: 9, sat: 1.45, lift: .82, edge: 34 },
  venus: { r: 5, k: 7, sat: 1.35, lift: .85, edge: 26 },
};

function toon(src, o) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.onerror = reject;
    im.onload = () => {
      const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
      const x = c.getContext('2d'); x.drawImage(im, 0, 0); const img = x.getImageData(0, 0, W, H), d = img.data, N = W * H;
      // 1) Kuwahara filter with summed-area tables (R, G, B, luminance, luminance²)
      const S = [0, 1, 2, 3, 4].map(() => new Float64Array((W + 1) * (H + 1)));
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
        const i = (y * W + xx) * 4, L = .299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2], v = [d[i], d[i + 1], d[i + 2], L, L * L], a = (y + 1) * (W + 1) + xx + 1;
        for (let k = 0; k < 5; k++) S[k][a] = v[k] + S[k][a - 1] + S[k][a - W - 1] - S[k][a - W - 2];
      }
      const box = (k, x0, y0, x1, y1) => S[k][(y1 + 1) * (W + 1) + x1 + 1] - S[k][y0 * (W + 1) + x1 + 1] - S[k][(y1 + 1) * (W + 1) + x0] + S[k][y0 * (W + 1) + x0];
      const r = o.r, flat = new Float32Array(N * 3);
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
        let best = 1e18, br = 0, bg = 0, bb = 0;
        for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
          const x0 = Math.max(0, Math.min(xx, xx + dx * r)), x1 = Math.min(W - 1, Math.max(xx, xx + dx * r)), y0 = Math.max(0, Math.min(y, y + dy * r)), y1 = Math.min(H - 1, Math.max(y, y + dy * r)), n = (x1 - x0 + 1) * (y1 - y0 + 1);
          const m = box(3, x0, y0, x1, y1) / n, v = box(4, x0, y0, x1, y1) / n - m * m;
          if (v < best) { best = v; br = box(0, x0, y0, x1, y1) / n; bg = box(1, x0, y0, x1, y1) / n; bb = box(2, x0, y0, x1, y1) / n; }
        }
        const p = (y * W + xx) * 3; flat[p] = br; flat[p + 1] = bg; flat[p + 2] = bb;
      }
      // 2) palette from the map itself (k-means on a deterministic sample)
      const K = o.k, pal = [], step = Math.max(1, Math.floor(N / 30000)), samp = [];
      for (let i = 0; i < N; i += step) samp.push(i);
      for (let j = 0; j < K; j++) { const i = samp[Math.floor((j + .5) / K * samp.length)] * 3; pal.push([flat[i], flat[i + 1], flat[i + 2]]); }
      samp.sort((a, b) => (flat[a * 3] + flat[a * 3 + 1] + flat[a * 3 + 2]) - (flat[b * 3] + flat[b * 3 + 1] + flat[b * 3 + 2]));
      for (let j = 0; j < K; j++) { const i = samp[Math.floor((j + .5) / K * samp.length)] * 3; pal[j] = [flat[i], flat[i + 1], flat[i + 2]]; }
      const near = (p) => { let bj = 0, bd = 1e18; for (let j = 0; j < K; j++) { const a = flat[p] - pal[j][0], b = flat[p + 1] - pal[j][1], e = flat[p + 2] - pal[j][2], q = a * a * 2 + b * b * 4 + e * e * 3; if (q < bd) { bd = q; bj = j; } } return bj; };
      for (let it = 0; it < 14; it++) {
        const sum = pal.map(() => [0, 0, 0, 0]);
        for (const i of samp) { const p = i * 3, j = near(p); sum[j][0] += flat[p]; sum[j][1] += flat[p + 1]; sum[j][2] += flat[p + 2]; sum[j][3]++; }
        sum.forEach((s, j) => { if (s[3]) pal[j] = [s[0] / s[3], s[1] / s[3], s[2] / s[3]]; });
      }
      // 3) more vivid and brighter, same hues (saturation around the grey of the same brightness, then a gentle gamma)
      const vivid = pal.map(([R, G, B]) => { const L = .299 * R + .587 * G + .114 * B; return [R, G, B].map(v => 255 * Math.pow(Math.max(0, Math.min(255, L + (v - L) * o.sat)) / 255, o.lift)); });
      let lab = new Uint8Array(N); for (let i = 0; i < N; i++) lab[i] = near(i * 3);
      // 3b) majority filter on the colour labels: removes the speckles, keeps the shapes
      for (let pass = 0; pass < 2; pass++) { const out = new Uint8Array(N), cnt = new Uint16Array(K);
        for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) { cnt.fill(0); let bj = lab[y * W + xx], bc = 0;
          for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const yy = Math.min(H - 1, Math.max(0, y + dy)), xw = (xx + dx + W) % W, j = lab[yy * W + xw]; if (++cnt[j] > bc) { bc = cnt[j]; bj = j; } }
          out[y * W + xx] = cnt[lab[y * W + xx]] >= bc ? lab[y * W + xx] : bj; }
        lab = out; }
      // 4) ink outline on the lighter side of a strong colour change (e.g. the coast, drawn on the land), in a dark tone of the darker colour
      const dist = (a, b) => Math.hypot(vivid[a][0] - vivid[b][0], vivid[a][1] - vivid[b][1], vivid[a][2] - vivid[b][2]), lum = j => vivid[j][0] + vivid[j][1] + vivid[j][2];
      for (let y = 0; y < H; y++) for (let xx = 0; xx < W; xx++) {
        const i = y * W + xx, j = lab[i]; let c = vivid[j];
        for (const n of [xx + 1 < W ? i + 1 : -1, xx > 0 ? i - 1 : -1, y + 1 < H ? i + W : -1, y > 0 ? i - W : -1]) { if (n < 0) continue; const m = lab[n]; if (m !== j && dist(j, m) > o.edge && lum(j) > lum(m)) { c = vivid[m].map(v => v * .55); break; } }
        const q = i * 4; d[q] = c[0]; d[q + 1] = c[1]; d[q + 2] = c[2]; d[q + 3] = 255;
      }
      x.putImageData(img, 0, 0); resolve(c.toDataURL('image/jpeg', .9));
    };
    im.src = src;
  });
}

const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
try {
  const page = await browser.newPage();
  await mkdir(outDir, { recursive: true });
  for (const [name, opt] of Object.entries(PLANETS)) {
    const src = 'data:image/jpeg;base64,' + (await readFile(join(inDir, name + '.jpg'))).toString('base64');
    const url = await page.evaluate(`(${toon.toString()})(${JSON.stringify(src)}, ${JSON.stringify(opt)})`);
    const buf = Buffer.from(url.split(',')[1], 'base64');
    await writeFile(join(outDir, name + '.jpg'), buf);
    console.log(name, buf.length, 'bytes');
  }
} finally { await browser.close(); }
