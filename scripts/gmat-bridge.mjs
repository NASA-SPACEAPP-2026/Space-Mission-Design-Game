// Runs NASA's GMAT for the game: takes a numeric plan, returns the delta-V of each leg.
// The browser never sends script text: the script is generated here from validated numbers.
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const MAX_WAITING = 5, TIMEOUT_MS = 30000, ANALYSIS_TIMEOUT_MS = 120000, LIFETIME_TIMEOUT_MS = 240000, CACHE_MAX = 500;
const DESTS = new Set(['leo', 'moon', 'mars', 'venus']);

// 02-orbit.js is a classic script: evaluate it with a fake CommonJS `module`
let O = null;
function orbit() {
  if (O) return O;
  const mod = { exports: {} };
  new Function('module', readFileSync(fileURLToPath(new URL('../public/game/02-orbit.js', import.meta.url)), 'utf8'))(mod);
  return (O = mod.exports);
}

const num = (x, lo, hi) => typeof x === 'number' && Number.isFinite(x) && x >= lo && x <= hi;
function validEl(e, mid) {
  return e && typeof e === 'object' && num(e.pe, -1e3, 1e6) && num(e.ap, -1e3, 1e6) && e.ap >= e.pe - 1e-6 && num(e.i, 0, 180) && num(e.raan ?? 0, -720, 720) && num(e.argp ?? 0, -720, 720) && num(e.ma ?? 0, -720, 720);
}
const pick = e => ({ pe: e.pe, ap: e.ap, i: e.i, raan: e.raan ?? 0, argp: e.argp ?? 0, ma: e.ma ?? 0 });

/** Returns a clean plan or an error string. Only numbers survive. */
export function validate(b) {
  if (!b || typeof b !== 'object' || !DESTS.has(b.dest) || !num(b.wet ?? 4, 0.1, 1000) || !Array.isArray(b.orbits) || b.orbits.length < 2 || b.orbits.length > 12) return 'bad-plan';
  const orbits = [];
  for (const o of b.orbits) {
    if (!o || !validEl(o.el) || (o.mid != null && !validEl(o.mid)) || !num(o.dv ?? 0, 0, 1e6)) return 'bad-plan';
    orbits.push({ el: pick(o.el), mid: o.mid ? pick(o.mid) : null, dv: o.dv ?? 0, name: 'Orbit' });
  }
  let eol = null;
  if (b.eol) { if (!validEl(b.eol.el) || (b.eol.mid != null && !validEl(b.eol.mid)) || !num(b.eol.dv ?? 0, 0, 1e6)) return 'bad-plan'; eol = { el: pick(b.eol.el), mid: b.eol.mid ? pick(b.eol.mid) : null, dv: b.eol.dv ?? 0 }; }
  return { dest: b.dest, wet: b.wet ?? 4, orbits, eol };
}

export const planKey = p => createHash('sha1').update(JSON.stringify(p)).digest('hex');

/** The numbers on the last non-empty line of the GMAT report file. */
export const parseReport = txt => {
  const lines = String(txt).split(/\r?\n/).map(s => s.trim()).filter(Boolean), last = lines[lines.length - 1] || '';
  const v = (last.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g) || []).map(Number);
  return v.length && v.every(Number.isFinite) ? v : null;
};

const run = (bin, args, cwd, timeout = TIMEOUT_MS) => new Promise((res, rej) => execFile(bin, args, { cwd, timeout, maxBuffer: 4 << 20 }, (err, out, serr) => err ? rej(Object.assign(err, { out, serr })) : res(out)));


/* ---------- analysis of the working orbit: eclipse, ground contacts, decay ---------- */
export function validateAnalysis(b) {
  if (!b || typeof b !== 'object' || !DESTS.has(b.dest) || !validEl(b.el) || !num(b.mass ?? 4, 0.1, 1000) || !num(b.area ?? 0.03, 0.001, 5)) return 'bad-plan';
  return { dest: b.dest, el: pick(b.el), mass: b.mass ?? 4, area: b.area ?? 0.03 };
}

const SCENARIOS = new Set(['nom', 'max', 'min', 'sail']);
export function validateLifetime(b) {
  const p = validateAnalysis(b); if (typeof p === 'string') return p;
  if (!SCENARIOS.has(b.scenario) || (b.sailArea != null && !num(b.sailArea, 0.1, 100))) return 'bad-plan';
  return { ...p, scenario: b.scenario, sailArea: b.sailArea ?? 1.0 };
}

const ms = s => Date.parse(String(s).trim().replace(/^(\d\d) (\w{3}) (\d{4}) (.*)$/, '$1 $2 $3 $4 UTC'));
/** Shadow per orbit from an EclipseLocator report. The last event is dropped: it may be cut off by the end of the run. */
export function parseEclipse(txt, days) {
  const ev = new Map();
  for (const l of String(txt).split(/\r?\n/)) { const m = l.match(/(?:Umbra|Penumbra)\s+(\d+)\s+([\d.]+)\s*$/); if (m) ev.set(+m[1], +m[2]); }
  const all = [...ev.entries()].sort((a, b) => a[0] - b[0]), tot = all.map(e => e[1]), kept = tot.slice(0, Math.max(0, tot.length - 1));
  const sum = tot.reduce((a, x) => a + x, 0), n = kept.length;
  return { events: tot.length, avgMin: n ? kept.reduce((a, x) => a + x, 0) / n / 60 : 0, maxMin: n ? Math.max(...kept) / 60 : 0, sunlitPct: Math.max(0, Math.min(100, 100 * (1 - sum / (days * 86400)))) };
}
/** Passes and contact minutes per day for each ground station, from a ContactLocator report. */
export function parseContacts(txt, days) {
  const out = {}; let cur = null;
  for (const l of String(txt).split(/\r?\n/)) {
    const o = l.match(/^Observer:\s*(\S+)/); if (o) { cur = out[o[1]] = { passes: 0, seconds: 0 }; continue; }
    const m = l.match(/^\d\d \w{3} \d{4} [\d:.]+\s+\d\d \w{3} \d{4} [\d:.]+\s+([\d.]+)\s*$/); if (m && cur) { cur.passes++; cur.seconds += +m[1]; }
  }
  return Object.fromEntries(Object.entries(out).map(([k, v]) => [k, { passesDay: v.passes / days, minDay: v.seconds / 60 / days }]));
}
/** State report rows: days, SMA, ECC, periapsis radius, RAAN, INC, distance to Earth. Two windows of one orbit each (start and end): the means remove the short-period oscillation of the osculating elements. */
export function parseState(txt) {
  const rows = String(txt).split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(l => l.split(/\s+/).map(Number)).filter(r => r.length >= 7 && r.every(Number.isFinite));
  // first window: days < 0.2. The row after it is the one written when the 30-day propagation stopped, then the second window.
  const w1 = rows.filter(r => r[0] < 0.2), w2 = rows.filter(r => r[0] >= 0.2);
  if (w1.length < 2 || !w2.length) return null;
  // RAAN (column 4) is an angle: use the circular mean, or a polar orbit near 0/360 averages to 180
  const R = Math.PI / 180, mean = rs => rs[0].map((_, c) => c === 4 ? (Math.atan2(rs.reduce((a, r) => a + Math.sin(r[c] * R), 0), rs.reduce((a, r) => a + Math.cos(r[c] * R), 0)) / R + 360) % 360 : rs.reduce((a, r) => a + r[c], 0) / rs.length);
  return { a: mean(w1), b: mean(w2), stopDays: w2[0][0] };
}
/** Last line of a lifetime report: days elapsed and altitude when the run stopped. Not re-entered if it ran to the cap. */
export function parseLifetime(txt, cap) {
  const last = String(txt).split(/\r?\n/).map(s => s.trim()).filter(Boolean).pop() || '', v = (last.match(/-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?/g) || []).map(Number);
  if (v.length < 2 || !v.every(Number.isFinite)) return null;
  return { days: v[0] < cap - 0.5 ? v[0] : null, cap, alt: v[1] };
}
// scale height of the upper atmosphere (km), coarse: only used for the legacy lifetime estimate shown when the full lifetime run is not available
const scaleH = alt => alt < 300 ? 45 : alt < 400 ? 52 : alt < 500 ? 60 : alt < 600 ? 70 : 85;
const DECAY_NOISE_KM_MONTH = 0.3; // below this the measured change is within the noise of the orbit-mean
const C_KM_S = 299792.458;

/** Everything the game needs from one analysis run, for any body. B = { mu, R } of the central body. */
export function derive(dest, req, st, ecl, con, days, B) {
  const a = (req.el.pe + req.el.ap) / 2 + B.R, period = 2 * Math.PI * Math.sqrt(a ** 3 / B.mu);
  const out = { period, eclipse: ecl, contacts: con, evolution: null, decay: null, earth: null, impact: null, days };
  if (!st) return out;
  if (st.stopDays != null && st.stopDays < days - 0.5) out.impact = { days: st.stopDays }; // the orbit reached the surface / the atmosphere interface before the 30 days were over
  const span = st.b[0] - st.a[0] || days, k = 30 / span, smaLoss = (st.a[1] - st.b[1]) * k, eccGrow = (st.b[2] - st.a[2]) * k, periDrift = (st.b[3] - st.a[3]) * k;
  const node = (((st.b[4] - st.a[4] + 540) % 360) - 180) / span, v = Math.sqrt(B.mu / a) * 1000;
  let sk;
  if (dest === 'leo') {
    const alt = (st.a[3] + st.b[3]) / 2 - B.R, ok = smaLoss > DECAY_NOISE_KM_MONTH;
    sk = ok ? v / 2 * smaLoss / a : 0;
    out.decay = { kmMonth: Math.max(0, smaLoss), measurable: ok, skDvMonth: sk, lifeMonths: ok ? scaleH(alt) / smaLoss : null, nodeDegDay: node, sso: Math.abs(node - 0.9856) < 0.12 };
  } else {
    // Moon, Mars, Venus: eccentricity growth and drift of the apsides (third-body and gravity-field perturbations, plus drag at Mars)
    sk = v / 2 * (Math.abs(eccGrow) + Math.abs(smaLoss) / a);
    const d0 = st.a[6], d1 = st.b[6]; out.earth = { km0: d0, km1: d1, lightMin0: d0 / C_KM_S / 60, lightMin1: d1 / C_KM_S / 60 };
  }
  out.evolution = { smaKmMonth: -smaLoss, eccGrowthMonth: eccGrow, periKmMonth: periDrift, skDvMonth: sk, nodeDegDay: node };
  return out;
}

export function createBridge({ gmatConsole = process.env.GMAT_CONSOLE, exec = run } = {}) {
  const cache = new Map();
  const makeQueue = () => { let busy = false; const waiting = [];
    const next = () => { if (busy || !waiting.length) return; busy = true; const job = waiting.shift(); job().finally(() => { busy = false; next(); }); };
    return fn => new Promise(res => { if (waiting.length >= MAX_WAITING) return res({ error: 'busy' }); waiting.push(() => fn().then(res, e => res({ error: 'gmat-failed', detail: String(e && e.message || e).slice(0, 200) }))); next(); }); };
  const enqueue = makeQueue(), enqueueAn = makeQueue(), enqueueLf = makeQueue();

  async function solve(p) {
    const dir = await mkdtemp(join(tmpdir(), 'gmat-')), report = join(dir, 'dv.txt');
    try {
      const Or = orbit(), script = Or.gmat({ name: 'Mission', sat: { dest: p.dest } }, { wet: p.wet, orbits: p.orbits, eol: p.eol }, { report });
      const file = join(dir, 'm.script'); await writeFile(file, script);
      await exec(gmatConsole, ['--run', file], dir);
      const v = parseReport(await readFile(report, 'utf8')), legs = p.orbits.length - 1 + (p.eol ? 1 : 0);
      if (!v || v.length < legs) return { error: 'gmat-no-result' };
      return { legs: v.slice(0, p.orbits.length - 1).map(dv => ({ dv })), eol: p.eol ? { dv: v[p.orbits.length - 1] } : null };
    } finally { rm(dir, { recursive: true, force: true }).catch(() => {}); }
  }

  async function solveAnalysis(p) {
    const dir = await mkdtemp(join(tmpdir(), 'gmat-an-')), files = { ecl: join(dir, 'ecl.txt'), con: join(dir, 'con.txt'), st: join(dir, 'st.txt') };
    try {
      const Or = orbit(), days = 30, script = Or.gmatAnalysis(p, { files }), file = join(dir, 'a.script');
      await writeFile(file, script);
      await exec(gmatConsole, ['--run', file], dir, ANALYSIS_TIMEOUT_MS);
      const rd = f => readFile(f, 'utf8').catch(() => '');
      const [e, c, s] = await Promise.all([rd(files.ecl), rd(files.con), rd(files.st)]);
      if (!e) return { error: 'gmat-no-result' };
      return derive(p.dest, p, parseState(s), parseEclipse(e, days), parseContacts(c, days), days, Or.BODY[p.dest]);
    } finally { rm(dir, { recursive: true, force: true }).catch(() => {}); }
  }

  async function solveLifetime(p) {
    const dir = await mkdtemp(join(tmpdir(), 'gmat-lf-')), st = join(dir, 'life.txt');
    try {
      const Or = orbit(), file = join(dir, 'l.script'); await writeFile(file, Or.gmatLifetime(p, { files: { st } }));
      await exec(gmatConsole, ['--run', file], dir, LIFETIME_TIMEOUT_MS);
      const r = parseLifetime(await readFile(st, 'utf8').catch(() => ''), Or.LIFE[p.dest].cap);
      return r ? { scenario: p.scenario, ...r } : { error: 'gmat-no-result' };
    } finally { rm(dir, { recursive: true, force: true }).catch(() => {}); }
  }

  return {
    async lifetime(body) {
      if (!gmatConsole) return { error: 'no-gmat' };
      const p = validateLifetime(body); if (typeof p === 'string') return { error: p };
      const key = 'lf:' + planKey(p); if (cache.has(key)) return cache.get(key);
      const r = await enqueueLf(() => solveLifetime(p));
      if (!r.error) { cache.set(key, r); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); }
      return r;
    },
    async analyze(body) {
      if (!gmatConsole) return { error: 'no-gmat' };
      const p = validateAnalysis(body); if (typeof p === 'string') return { error: p };
      const key = 'an:' + planKey(p); if (cache.has(key)) return cache.get(key);
      const r = await enqueueAn(() => solveAnalysis(p));
      if (!r.error) { cache.set(key, r); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); }
      return r;
    },
    async handle(body) {
      if (!gmatConsole) return { error: 'no-gmat' };
      const p = validate(body); if (typeof p === 'string') return { error: p };
      const key = planKey(p); if (cache.has(key)) return cache.get(key);
      const r = await enqueue(() => solve(p));
      if (!r.error) { cache.set(key, r); if (cache.size > CACHE_MAX) cache.delete(cache.keys().next().value); }
      return r;
    }
  };
}
