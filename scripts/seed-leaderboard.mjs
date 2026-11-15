// Fictitious players + science points to test the leaderboard. The players live in an editable worksheet
// (CSV: opens in Excel, Numbers and Google Sheets); this script generates it once and then syncs the database to it.
//
//   node --env-file-if-exists=.env scripts/seed-leaderboard.mjs --generate [--count=100] [--seed=N] [--file=PATH] [--force]
//   node --env-file-if-exists=.env scripts/seed-leaderboard.mjs [--file=PATH] [--dry-run] [--yes]
//   node --env-file-if-exists=.env scripts/seed-leaderboard.mjs --clean [--yes]
//
// Worksheet columns:  username ; science ; missions   (missions is optional; ';' ',' or TAB all work; '#' starts a comment)
//   science  = the player's total science points (what the leaderboard shows)
//   missions = in how many awards the total is split in science_awards (blank = automatic)
// Every run makes the database match the worksheet: fake players that are no longer in it are removed first.
// Fake accounts are recognised by the placeholder email <username>@seed.invalid; their password is unknown to everybody.
// With NODE_ENV=production the script refuses to touch the database unless --yes is passed.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { database, migrate } from '../backend/database.mjs';
import { passwordHash } from '../backend/auth.mjs';
import { isProfaneUsername } from '../backend/username-filter.mjs';

const DEFAULT_FILE = new URL('./seed-leaderboard.csv', import.meta.url).pathname;
const EMAIL_DOMAIN = 'seed.invalid';
const USERNAME_RE = /^[a-zA-Z0-9_]{3,24}$/;

const MALE = ['mattia', 'marco', 'luca', 'andrea', 'francesco', 'alessandro', 'lorenzo', 'matteo', 'davide', 'simone', 'federico',
  'riccardo', 'gabriele', 'giuseppe', 'antonio', 'giovanni', 'stefano', 'nicola', 'daniele', 'emanuele', 'tommaso', 'filippo',
  'edoardo', 'leonardo', 'samuele', 'christian', 'michele', 'fabio', 'pietro', 'giacomo', 'alberto', 'claudio', 'enrico', 'vincenzo',
  'salvatore', 'roberto', 'paolo', 'giorgio', 'massimo', 'diego', 'manuel', 'dario', 'gianluca', 'elia', 'nicolo', 'jacopo', 'ale',
  'giulio', 'cristian', 'raffaele', 'mirko', 'thomas', 'kevin', 'alex', 'denis', 'valerio', 'ivan', 'fabrizio'];
const FEMALE = ['giulia', 'sara', 'chiara', 'francesca', 'martina', 'alessia', 'elisa', 'federica', 'valentina', 'silvia', 'elena',
  'giorgia', 'laura', 'anna', 'sofia', 'aurora', 'alice', 'beatrice', 'ginevra', 'greta', 'noemi', 'arianna', 'camilla', 'ilaria',
  'marta', 'irene', 'serena', 'veronica', 'cristina', 'roberta', 'paola', 'claudia', 'simona', 'monica', 'viola', 'rebecca', 'asia',
  'emma', 'vittoria', 'benedetta', 'caterina', 'lucia', 'margherita', 'angelica', 'miriam', 'eleonora', 'michela', 'vale', 'giada',
  'martina', 'jessica', 'denise', 'erica', 'debora', 'nicole', 'sabrina'];
// Big space missions, with the numbers that really go with them (mission number or launch year).
const MISSIONS = {
  apollo: [8, 11, 13, 17], artemis: [1, 2, 3], voyager: [1, 2, 77], cassini: [97], curiosity: [11, 12], perseverance: [21], juno: [11],
  rosetta: ['04'], philae: [], hubble: [90], webb: [21], galileo: [89], pioneer: [10, 11], viking: [1, 2, 75], mariner: [4, 10],
  gemini: [4, 7], sputnik: [1, 57], skylab: [73], soyuz: [11, 19], vostok: [1], dawn: ['07'], kepler: ['09'], tess: [18], ingenuity: [],
  opportunity: ['03'], spirit: ['03'], sojourner: [97], hayabusa: [2], messenger: ['04'], magellan: [89], giotto: [85], stardust: [99],
  ulysses: [90], planck: ['09'], gaia: [13], insight: [18], maven: [13], chandrayaan: [3], bepicolombo: [], exomars: [], newhorizons: ['06'],
  osirisrex: [], mercury: [7], luna: [9, 17], mir: [86], tiangong: [], zhurong: [], pathfinder: [97],
};
const ANGLO_SUFFIX = ['z', 'x', 'zz', 'xx', 'k', '_'];                    // mattiaz, marcox, lucazz ...
const PREFIX = ['x', 'its', 'real', 'the', 'mr', 'dj', 'itz'];                 // xmattia, itsgiulia ...

function rng(seed) { // mulberry32: repeatable when --seed is given
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const strSeed = s => createHash('sha256').update(s).digest().readUInt32LE(0);
const cap = w => w[0].toUpperCase() + w.slice(1);

function makeUsername(rand) {
  const pick = list => list[Math.floor(rand() * list.length)];
  const name = () => (rand() < 0.5 ? pick(MALE) : pick(FEMALE));
  const yy = () => String((rand() < 0.7 ? 1996 + Math.floor(rand() * 15) : 1970 + Math.floor(rand() * 26)) % 100).padStart(2, '0'); // birth year, 2 digits
  const styles = [
    [26, () => name() + yy()],                                   // giulia98, marco03
    [8, () => `${name()}_${yy()}`],                              // luca_01
    [10, () => name()],                                          // federico
    [3, () => `${name()}_${String.fromCharCode(97 + Math.floor(rand() * 26))}`], // marco_b
    [16, () => { const n = name(); return n + pick(ANGLO_SUFFIX) + (rand() < 0.25 ? yy() : ''); }], // mattiaz, marcox98
    [7, () => pick(PREFIX) + (rand() < 0.3 ? '_' : '') + name()],                                    // xmattia, its_giulia
    [4, () => { const n = name(); return n + n.slice(-1); }],                                        // giuliaa, marcoo
    [22, () => {                                                 // apollo11, Voyager_2, curiosity, hubble90
      const base = pick(Object.keys(MISSIONS)), nums = MISSIONS[base];
      const num = nums.length && rand() < 0.75 ? String(pick(nums)) : '';
      const w = rand() < 0.2 ? cap(base) : base;
      return w + (num && rand() < 0.2 ? '_' : '') + num;
    }],
  ];
  let x = rand() * styles.reduce((s, [w]) => s + w, 0), build = styles[0][1];
  for (const [w, f] of styles) { if ((x -= w) < 0) { build = f; break; } }
  let u = build();
  if (rand() < 0.04) u = cap(u);
  return u.slice(0, 24);
}

// Skewed on purpose: a few strong players, many in the middle, some beginners (and a few at zero).
export function generate(count, rand = Math.random) {
  const used = new Set(), rows = [];
  for (let i = 0; i < count; i++) {
    let username, tries = 0;
    do { username = makeUsername(rand); if (++tries > 200) username += String(Math.floor(rand() * 100)); } while (used.has(username.toLowerCase()) || !USERNAME_RE.test(username) || isProfaneUsername(username));
    used.add(username.toLowerCase());
    const skill = Math.pow(rand(), 2.2);
    rows.push({ username, science: rand() < 0.07 ? 0 : Math.round(30 + skill * 3000 + rand() * 250), missions: null });
  }
  return rows.sort((a, b) => b.science - a.science);
}

export function toCsv(rows) {
  return ['# Go No-Go fake players. Edit by hand: username ; science (total points) ; missions (optional).',
    'username;science;missions', ...rows.map(r => `${r.username};${r.science};${r.missions ?? ''}`)].join('\n') + '\n';
}

export function parseCsv(text) {
  const lines = text.replace(/^﻿/, '').split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
  if (!lines.length) throw new Error('The worksheet is empty');
  const delim = [';', '\t', ','].find(d => lines[0].includes(d)) ?? ';';
  const cell = v => (v ?? '').trim().replace(/^"(.*)"$/, '$1').trim();
  const head = lines[0].split(delim).map(c => cell(c).toLowerCase());
  const col = name => head.indexOf(name);
  if (col('username') < 0 || col('science') < 0) throw new Error('Header must contain the columns username and science');
  const used = new Set(), rows = [];
  lines.slice(1).forEach((line, idx) => {
    const c = line.split(delim), at = `row ${idx + 2}`;
    const username = cell(c[col('username')]);
    if (!username) return;
    if (!USERNAME_RE.test(username)) throw new Error(`${at}: invalid username "${username}" (3-24 characters: letters, digits, _)`);
    if (isProfaneUsername(username)) throw new Error(`${at}: username "${username}" is not allowed (profanity filter)`);
    if (used.has(username.toLowerCase())) throw new Error(`${at}: duplicate username "${username}"`);
    used.add(username.toLowerCase());
    const science = Number(cell(c[col('science')]).replace(/[\s.]/g, ''));
    if (!Number.isInteger(science) || science < 0) throw new Error(`${at}: science must be an integer >= 0 ("${cell(c[col('science')])}")`);
    const mRaw = col('missions') >= 0 ? cell(c[col('missions')]) : '';
    const missions = mRaw === '' ? null : Number(mRaw);
    if (missions !== null && (!Number.isInteger(missions) || missions < 1)) throw new Error(`${at}: missions must be an integer >= 1 or blank`);
    rows.push({ username, science, missions });
  });
  if (!rows.length) throw new Error('No players in the worksheet');
  return rows;
}

// Splits a player's total into several awards (one per fake mission) that add up exactly to the total.
export function awardsFor({ username, science, missions }) {
  if (science <= 0) return [];
  const rand = rng(strSeed(username));
  const n = Math.min(science, missions ?? Math.max(1, Math.min(25, Math.round(science / 180 + rand() * 2))));
  const w = Array.from({ length: n }, () => 0.3 + rand()), sum = w.reduce((a, b) => a + b, 0);
  const pts = w.map(x => 1 + Math.floor(x / sum * (science - n)));
  pts[0] += science - pts.reduce((a, b) => a + b, 0);
  return pts.map((points, i) => ({ key: `seed-${i + 1}`, points }));
}

// `db` is a pg client (or anything with query(sql, params)); runs inside one transaction.
export async function seed(db, rows, hash) {
  await db.query('BEGIN');
  try {
    await db.query(`DELETE FROM users WHERE email LIKE '%@${EMAIL_DOMAIN}'`);
    const clash = await db.query('SELECT username FROM users WHERE lower(username) = ANY($1::text[])', [rows.map(r => r.username.toLowerCase())]);
    if (clash.rows.length) throw new Error('These usernames already belong to real players, rename them in the worksheet: ' + clash.rows.map(r => r.username).join(', '));
    for (const r of rows) {
      const id = randomUUID();
      await db.query(`INSERT INTO users(id,username,email,password_hash,created_at) VALUES($1,$2,$3,$4, now() - ($5 || ' minutes')::interval)`,
        [id, r.username, `${r.username.toLowerCase()}@${EMAIL_DOMAIN}`, hash, String(Math.floor(Math.random() * 14 * 24 * 60))]);
      for (const a of awardsFor(r)) await db.query('INSERT INTO science_awards(user_id,mission_key,points) VALUES($1,$2,$3)', [id, a.key, a.points]);
    }
    await db.query('COMMIT');
  } catch (e) { await db.query('ROLLBACK'); throw e; }
}

export async function clean(db) {
  const r = await db.query(`DELETE FROM users WHERE email LIKE '%@${EMAIL_DOMAIN}'`); // science_awards follow (ON DELETE CASCADE)
  return r.rowCount ?? r.affectedRows ?? 0;
}

async function main() {
  const args = new Map(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
  const file = args.get('file') && args.get('file') !== true ? args.get('file') : DEFAULT_FILE;

  if (args.has('generate')) {
    const count = Number(args.get('count') ?? 100);
    if (!Number.isInteger(count) || count < 1 || count > 999) throw new Error('--count must be between 1 and 999');
    if (existsSync(file) && !args.has('force')) throw new Error(`${file} already exists (it may contain your edits). Use --force to overwrite it.`);
    writeFileSync(file, toCsv(generate(count, args.has('seed') ? rng(Number(args.get('seed'))) : Math.random)));
    console.log(`Worksheet written: ${file} (${count} players). Edit it, then run the script without --generate.`);
    return;
  }

  if (args.has('dry-run')) {
    const rows = parseCsv(readFileSync(file, 'utf8')), total = rows.reduce((s, r) => s + r.science, 0);
    console.log(`Dry run: ${rows.length} players from ${file}, ${total} science points in total, no database access.`);
    for (const r of rows.slice(0, 5)) console.log(String(r.science).padStart(6), r.username.padEnd(26), awardsFor(r).length, 'awards');
    return;
  }

  if (process.env.NODE_ENV === 'production' && !args.has('yes')) throw new Error('NODE_ENV=production: pass --yes to confirm');
  const rows = args.has('clean') ? null : parseCsv(readFileSync(file, 'utf8')); // validate the worksheet before touching anything
  const pool = database();
  const db = await pool.connect();
  try {
    console.log('Database:', new URL(process.env.DATABASE_URL).host);
    await migrate(pool); // repeatable; makes sure the tables exist
    if (!rows) { console.log(`Removed ${await clean(db)} fictitious players.`); return; }
    await seed(db, rows, await passwordHash(randomBytes(24).toString('hex'))); // valid hash format, unknown password
    console.log(`Done: ${rows.length} fictitious players, ${rows.reduce((s, r) => s + awardsFor(r).length, 0)} science awards, ${rows.reduce((s, r) => s + r.science, 0)} points.`);
  } finally { db.release(); await pool.end(); }
}
if (import.meta.url === `file://${process.argv[1]}`) await main();
