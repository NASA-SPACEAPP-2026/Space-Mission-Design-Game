// Consortia (clans) API under /api/consortia. Every route needs a signed-in player (auth session cookie).
// A player belongs to at most one consortium, so member routes live under /mine and never take an id.
// Users appear only by username; internal user ids never leave the server. Errors are short codes
// (e.g. { error: 'full' }) that the game translates. Text is stored and returned as plain text only.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { sessionUser } from './auth.mjs';

export const ROLES = ['member', 'chief_engineer', 'vice', 'director']; // index = rank
export const STICKERS = ['zorty_happy', 'zorty_cry', 'zorty_angry', 'zorty_laugh', 'zorty_cheer', 'zorty_think', 'zorty_wow'];
// Consortium levels from the all-time science points; some stickers unlock with them (the others are there from level 1).
export const LEVELS = [0, 400, 1200, 3000, 6000];
export const levelOf = science => LEVELS.reduce((l, min, i) => (science >= min ? i + 1 : l), 1);
export const STICKER_LEVEL = { zorty_cheer: 2, zorty_think: 3, zorty_wow: 4 };
export const CREST = {
  shapes: ['shield', 'circle', 'hexagon', 'star', 'diamond'],
  symbols: ['rocket', 'satellite', 'planet', 'moon', 'star', 'comet', 'telescope', 'orbit']
};
export const LIMITS = { members: 20, text: 300, motto: 60, request: 140, missionScience: 1000, page: 50, inactiveDays: 14,
  // spectate: compressed game state (base64), request body for PUT /live, how long a viewer keeps the stream on, when a player counts as gone
  liveState: 160_000, liveBody: 200_000, watchSeconds: 20, liveSeconds: 60 };
// System message codes (data.code): founded, joined, left, kicked, promoted, demoted, new_director,
// settings, science, launch, success, failure, joint_new, joint_done. The game turns them into translated sentences.

/* ---------- Joint mission (lite) ----------
   2 to 4 teammates design one satellite together, each with a NASA role, one turn at a time:
   plan (destination, budget) → sat (bus, computer, attitude, battery, solar) → sci (payload) → com (radio) → review.
   A choice that breaks a budget owned by another role (mass and power: sat; cost: plan) becomes a request that role
   accepts, counters with another option, or rejects. The physics (mass, power, cost) is the game's own and runs in the
   browser; the server enforces who may change what and when, versions every action, and awards the science points. */
export const JOINT = {
  roles: ['plan', 'sat', 'sci', 'com'],
  keys: { dest: 'plan', budget: 'plan', ride: 'sat', avi: 'sat', adcs: 'sat', bat: 'sat', sol: 'sat', ray: 'sci', com: 'com' },
  need: { plan: ['dest', 'budget'], sat: ['ride', 'avi', 'adcs', 'bat', 'sol'], sci: ['ray'], com: ['com'] },
  owners: { mass: 'sat', power: 'sat', cost: 'plan' },
  dests: ['leo', 'moon', 'mars'], rides: ['S3', 'S6', 'S12'],
  points: { leo: 60, moon: 120, mars: 200 }
};
const PART = /^[A-Z]{3,5}-[A-Z0-9]{1,12}$/;
function jointValue(key, value) {
  if (key === 'dest') return JOINT.dests.includes(value);
  if (key === 'ride') return JOINT.rides.includes(value);
  if (key === 'budget') return int(value, 200, 20000);
  return typeof value === 'string' && PART.test(value);
}
export const jointPoints = s => Math.round((JOINT.points[s.design.dest] || 60) * (1 + 0.1 * (jointPlayers(s).length - 1)));
const jointPlayers = s => [...new Set(JOINT.roles.map(r => s.roles[r]).filter(Boolean))];
export function jointNew(name, user) {
  return { name, by: user, phase: 'lobby', turn: null, roles: { plan: user, sat: null, sci: null, com: null },
    design: { dest: 'leo', budget: 1000, ride: 'S3', sol: 'BASE-SOL3D' }, done: {}, request: null, votes: {}, log: [], seq: 0, points: 0 };
}
// Pure rules: returns the next state or throws Fail. canAdmin: director or deputy of the consortium.
export function jointReduce(state, a, user, canAdmin) {
  const s = structuredClone(state), mine = r => s.roles[r] === user, players = jointPlayers(s);
  const no = code => { throw new Fail(409, code); };
  const log = (code, extra) => { s.log.push({ code, user, at: new Date().toISOString(), ...extra }); s.log = s.log.slice(-30); };
  if (!a || typeof a.type !== 'string') throw bad('type');
  if (s.phase === 'done' || s.phase === 'abandoned') no('closed');
  switch (a.type) {
    case 'join': {
      if (s.phase !== 'lobby') no('started');
      if (!JOINT.roles.includes(a.role)) throw bad('role');
      if (s.roles[a.role]) no('role_taken');
      if (players.includes(user)) no('has_role');
      s.roles[a.role] = user; log('join', { role: a.role }); break;
    }
    case 'leave': {
      if (s.phase !== 'lobby') no('started');
      if (user === s.by) no('creator');
      JOINT.roles.forEach(r => { if (s.roles[r] === user) s.roles[r] = null; }); log('leave'); break;
    }
    case 'start': {
      if (s.phase !== 'lobby') no('started');
      if (user !== s.by && !canAdmin) throw new Fail(403, 'forbidden');
      if (players.length < 2) no('need_two');
      // free roles go round-robin to the players, in role order
      let i = 0; JOINT.roles.forEach(r => { if (!s.roles[r]) s.roles[r] = players[i++ % players.length]; });
      s.phase = 'design'; s.turn = null; log('start'); break;
    }
    case 'set': {
      if (s.phase !== 'design') no('not_design');
      const owner = JOINT.keys[a.key];
      if (!owner) throw bad('key');
      if (!mine(owner)) throw new Fail(403, 'not_your_role');
      if (s.done[owner]) no('role_done');
      if (s.request && s.request.from === owner) no('pending_request'); // ponytail: one pending request per mission, a list if players hit it
      if (!jointValue(a.key, a.value)) throw bad('value');
      const q = a.req;
      if (q != null) {
        if (typeof q !== 'object' || JOINT.owners[q.kind] !== q.to || typeof q.delta !== 'number' || !(q.delta >= 0 && q.delta <= 1e5)) throw bad('req');
        if (!mine(q.to)) {
          if (s.request) no('pending_request'); // one request at a time: a second would overwrite the first
          s.request = { id: ++s.seq, from: owner, by: user, to: q.to, key: a.key, value: a.value, kind: q.kind, delta: Math.round(q.delta * 100) / 100 };
          log('request', { key: a.key, value: a.value, to: q.to, kind: q.kind }); break;
        }
      }
      s.design[a.key] = a.value; log('set', { key: a.key, value: a.value }); break;
    }
    case 'answer': {
      const q = s.request;
      if (!q) no('no_request');
      if (!mine(q.to)) throw new Fail(403, 'not_your_role');
      if (a.decision === 'accept') {
        s.design[q.key] = q.value;
        if (q.kind === 'cost') s.design.budget = Math.min(20000, s.design.budget + Math.ceil(q.delta / 50) * 50);
      } else if (a.decision === 'counter') {
        if (!jointValue(q.key, a.value)) throw bad('value');
        s.design[q.key] = a.value;
      } else if (a.decision !== 'reject') throw bad('decision');
      log('answer', { decision: a.decision, key: q.key, value: a.decision === 'counter' ? a.value : q.value, to: q.by });
      s.request = null; break;
    }
    case 'done': {
      if (s.phase !== 'design') no('not_design');
      if (!JOINT.roles.includes(a.role)) throw bad('role');
      if (!mine(a.role)) throw new Fail(403, 'not_your_role');
      if (s.done[a.role]) no('role_done');
      if (s.request && (s.request.from === a.role || s.request.to === a.role)) no('pending_request');
      if (JOINT.need[a.role].some(k => s.design[k] == null)) no('incomplete');
      s.done[a.role] = true; log('done', { role: a.role });
      if (JOINT.roles.every(r => s.done[r])) { s.phase = 'review'; s.votes = {}; }
      break;
    }
    case 'vote': {
      if (s.phase !== 'review') no('not_review');
      if (!players.includes(user)) throw new Fail(403, 'not_player');
      if (a.go === true) {
        if (a.ok !== true) no('checks_failed');
        s.votes[user] = 'go'; log('go');
        if (players.every(p => s.votes[p] === 'go')) { s.phase = 'done'; s.points = jointPoints(s); log('done_all'); }
      } else if (a.go === false) {
        if (!JOINT.roles.includes(a.rework)) throw bad('rework');
        s.phase = 'design'; s.done[a.rework] = false; s.votes = {}; log('nogo', { role: a.rework });
      } else throw bad('go');
      break;
    }
    case 'abandon': {
      if (user !== s.by && !canAdmin) throw new Fail(403, 'forbidden');
      s.phase = 'abandoned'; log('abandon'); break;
    }
    default: throw bad('type');
  }
  return s;
}
// True when this player has something to do: an undone role, a request addressed to them, or an open vote.
export function jointWaiting(s, user) {
  if (!s || s.phase === 'done' || s.phase === 'abandoned') return false;
  if (s.phase === 'review') return jointPlayers(s).includes(user) && s.votes[user] !== 'go';
  if (s.phase !== 'design') return false;
  return JOINT.roles.some(r => s.roles[r] === user && !s.done[r]) || (!!s.request && s.roles[s.request.to] === user);
}
const jointStatus = phase => phase === 'lobby' ? 'open' : phase === 'done' ? 'done' : phase === 'abandoned' ? 'abandoned' : 'active';

const rank = role => ROLES.indexOf(role);
const hash = value => createHash('sha256').update(value).digest('hex');
const NAME = /^[\p{L}\p{N}][\p{L}\p{N} _.'-]{1,22}[\p{L}\p{N}]$/u;
const LINK = /(https?:\/\/|www\.|\b[\p{L}\p{N}-]+\.(com|net|org|it|io|ly|gg|xyz|me|co|app|link|info|tv|ru|cn)\b)/iu;
/* ---------- Moderation ----------
   The game is used by school classes: chat text, names, mottos and mission names are checked for bad language
   (Italian and English, blasphemy, slurs). Text is normalised first (accents, l33t digits) and every letter of a word may
   be stretched ("fuuuck"). Words start at a word boundary, so innocent words that merely contain one pass ("scazzottata"). */
const RUDE_WORDS = ['cazz', 'minchi', 'stronz', 'coglion', 'puttan', 'vaffancul', 'fancul', 'bastard', 'froci', 'ricchion', 'fottut', 'fottiti',
  'zoccol', 'mignott', 'fuck', 'shit', 'bitch', 'asshole', 'cunt', 'motherf', 'whore', 'slut', 'nigg', 'retard', 'faggot'];
const RUDE_EXACT = ['merd[ae]', 'fig(?:a|he)(?![a-z])', 'troi(?:a|e)(?![a-z])', 'negr(?:o|a|i|e)(?![a-z])'];
const RUDE = new RegExp('(^|[^a-z])(' + RUDE_WORDS.map(w => w.split('').map(c => c + '+').join('')).concat(RUDE_EXACT).join('|') + ')');
const BLASPHEMY = /(^| )(porc[oa] ?(dio|madonna|zio)|dio ?(cane|porco|maiale|bestia|boia|ladro)|madonna ?(puttana|troia))/;
const LEET = { 0: 'o', 1: 'i', 3: 'e', 4: 'a', 5: 's', 7: 't', 8: 'b', '@': 'a', $: 's', '!': 'i', '|': 'i' };
export function rude(text) {
  const t = String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[0134578@$!|]/g, c => LEET[c]);
  return RUDE.test(t) || BLASPHEMY.test(t.replace(/[^a-z]+/g, ' ').replace(/([a-z])\1+/g, '$1'));
}
// Preset phrases: the only text allowed in school mode. Stored with their code, shown in the reader's language.
export const PHRASES = {
  nice_launch: 'Bel lancio!', need_solar: 'Mi serve un pannello solare', go: 'GO per il lancio!', help: 'Mi aiutate?',
  thanks: 'Grazie!', well_done: 'Ben fatto, squadra!', joint: 'Entro nella missione congiunta', watch_me: 'Guardatemi giocare!'
};
export const REPORTS_TO_HIDE = 3;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const ROLE_ORDER = `array_position(ARRAY['director','vice','chief_engineer','member'], m.role)`;

class Fail extends Error {
  constructor(status, code, extra) { super(code); this.status = status; this.code = code; this.extra = extra; }
}
const bad = (field) => new Fail(400, 'invalid', { field });

// Plain one-line text: no control characters, no invisible direction overrides, single spaces.
const clean = value => String(value).normalize('NFC')
  .replace(/[​‎‏‪-‮⁦-⁩﻿]/g, '')
  .replace(/\p{Cc}+/gu, ' ').replace(/\s+/g, ' ').trim();
const int = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
const rows = (c, sql, args) => c.query(sql, args).then(r => r.rows);
const newCode = () => Array.from(randomBytes(8), b => CODE_CHARS[b % CODE_CHARS.length]).join('');

async function tx(db, fn) {
  if (typeof db.tx === 'function') return db.tx(fn);
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally { client.release(); }
}
const uniqueAs = (code) => error => {
  if (error?.code === '23505') throw new Fail(409, typeof code === 'function' ? code(error) : code);
  throw error;
};

function settingsFrom(body, creating) {
  const out = {};
  if (creating) {
    if (typeof body.name !== 'string') throw bad('name');
    const name = clean(body.name);
    if (!NAME.test(name) || LINK.test(name)) throw bad('name');
    if (rude(name)) throw new Fail(400, 'language', { field: 'name' });
    out.name = name;
  }
  if (creating || body.crest !== undefined) {
    const c = body.crest;
    if (!c || typeof c !== 'object' || !CREST.shapes.includes(c.shape) || !CREST.symbols.includes(c.symbol) ||
      typeof c.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(c.color)) throw bad('crest');
    out.crest = { shape: c.shape, color: c.color.toLowerCase(), symbol: c.symbol };
  }
  if (body.motto !== undefined) {
    if (typeof body.motto !== 'string') throw bad('motto');
    const motto = clean(body.motto);
    if (motto.length > LIMITS.motto || LINK.test(motto)) throw bad('motto');
    if (rude(motto)) throw new Fail(400, 'language', { field: 'motto' });
    out.motto = motto;
  }
  if (body.kind !== undefined) {
    if (!['open', 'request', 'invite'].includes(body.kind)) throw bad('kind');
    out.kind = body.kind;
  }
  if (body.minScience !== undefined) {
    if (!int(body.minScience, 0, 1_000_000)) throw bad('minScience');
    out.min_science = body.minScience;
  }
  if (body.maxMembers !== undefined) {
    if (!int(body.maxMembers, 2, LIMITS.members)) throw bad('maxMembers');
    out.max_members = body.maxMembers;
  }
  if (body.schoolMode !== undefined) {
    if (typeof body.schoolMode !== 'boolean') throw bad('schoolMode');
    out.school_mode = body.schoolMode;
  }
  return out;
}

function missionCard(m) {
  if (!m || typeof m !== 'object') throw bad('mission');
  const text = (value, max, field) => {
    if (value === undefined) return undefined;
    if (typeof value !== 'string') throw bad(field);
    const t = clean(value);
    if (t.length > max || LINK.test(t)) throw bad(field);
    if (rude(t)) throw new Fail(400, 'language', { field });
    return t;
  };
  const name = text(m.name, 24, 'mission.name');
  if (!name) throw bad('mission.name');
  const card = { name, type: text(m.type, 16, 'mission.type'), dest: text(m.dest, 24, 'mission.dest') };
  if (m.sci !== undefined) { if (!int(m.sci, 0, 100_000)) throw bad('mission.sci'); card.sci = m.sci; }
  if (m.months !== undefined) { if (!int(m.months, 0, 600)) throw bad('mission.months'); card.months = m.months; }
  if (m.ok !== undefined) { if (typeof m.ok !== 'boolean') throw bad('mission.ok'); card.ok = m.ok; }
  return card;
}

const SUMMARY = `c.id, c.name, c.crest, c.motto, c.kind, c.level, c.science::float8 AS science, c.min_science,
  c.max_members, (SELECT count(*)::int FROM consortium_members x WHERE x.consortium_id = c.id) AS members,
  jsonb_array_length(c.trophies) AS trophies`;
const summary = r => ({ id: r.id, name: r.name, crest: r.crest, motto: r.motto, kind: r.kind, level: r.level,
  science: r.science, minScience: r.min_science, maxMembers: r.max_members, members: r.members, trophies: r.trophies || 0 });

/* ---------- Weekly challenge ----------
   Every Monday (UTC) the same goal for every consortium, picked from this list. A finished mission whose facts meet the goal
   brings its science points to the consortium's weekly score as well. The first visit of a new week closes the old ones:
   the top three consortia get a trophy and bonus science, announced in their chat. */
export const CHALLENGES = [
  { id: 'moon-budget', dest: 'moon', maxCost: 1800, it: 'Una missione riuscita sulla Luna che costa meno di 1800 crediti', en: 'A successful Moon mission costing under 1,800 credits' },
  { id: 'observe', type: 'obs', it: 'Una missione di osservazione e mappatura riuscita', en: 'A successful observation and mapping mission' },
  { id: 'leo-cheap', dest: 'leo', maxCost: 400, it: 'Una missione riuscita in orbita terrestre con meno di 400 crediti', en: 'A successful Earth-orbit mission under 400 credits' },
  { id: 'telescope', type: 'tel', it: 'Un telescopio in orbita: missione riuscita', en: 'A telescope in orbit: mission successful' },
  { id: 'long-life', minMonths: 18, it: 'Una missione riuscita che lavora almeno 18 mesi', en: 'A successful mission that works at least 18 months' },
  { id: 'mars', dest: 'mars', it: 'Una missione riuscita su Marte', en: 'A successful mission to Mars' },
  { id: 'relay', type: 'com', it: 'Un ripetitore per telecomunicazioni in orbita: missione riuscita', en: 'A telecom relay in orbit: mission successful' },
  { id: 'science', type: 'sci', it: 'Una missione di rilevamento scientifico riuscita', en: 'A successful science survey mission' }
];
export const PRIZES = [300, 200, 100];
const DAY = 86_400_000;
// Monday 00:00 UTC of the week of `date`, as YYYY-MM-DD
export const weekOf = date => { const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())); d.setUTCDate(d.getUTCDate() - (d.getUTCDay() + 6) % 7); return d.toISOString().slice(0, 10); };
export const goalOf = week => CHALLENGES[Math.floor(Date.parse(week + 'T00:00:00Z') / (7 * DAY)) % CHALLENGES.length];
export const meetsGoal = (g, f) => !!f && f.ok === true && (!g.dest || f.dest === g.dest) && (!g.type || f.type === g.type) &&
  (g.maxCost == null || f.cost <= g.maxCost) && (g.minMonths == null || f.months >= g.minMonths);
function missionFacts(f) {
  if (f == null) return null;
  if (typeof f !== 'object' || typeof f.ok !== 'boolean' || typeof f.dest !== 'string' || !/^[a-z]{2,12}$/.test(f.dest) ||
    typeof f.type !== 'string' || !/^[a-z]{2,8}$/.test(f.type) || !int(f.cost, 0, 1e6) || !int(f.months, 0, 600)) throw bad('facts');
  return { ok: f.ok, dest: f.dest, type: f.type, cost: f.cost, months: f.months };
}
const message = r => r.deleted
  ? { id: r.id, kind: r.kind, author: r.author, at: r.created_at, deleted: true }
  : { id: r.id, kind: r.kind, author: r.author, role: r.author_role, at: r.created_at,
    ...(r.kind === 'text' ? { text: r.body, ...(r.data && r.data.phrase ? { phrase: r.data.phrase } : {}) } : r.kind === 'sticker' ? { sticker: r.body, ...(r.data && r.data.to ? { to: r.data.to } : {}) } : { data: r.data }) };
const MESSAGE_COLUMNS = `m.id::float8 AS id, m.kind, m.body, m.data, m.created_at, m.deleted_at IS NOT NULL AS deleted,
  u.username AS author, cm.role AS author_role FROM consortium_messages m LEFT JOIN users u ON u.id = m.author_id
  LEFT JOIN consortium_members cm ON cm.user_id = m.author_id AND cm.consortium_id = m.consortium_id`;

export function createConsortia({ db, origin, now = () => new Date() }) {
  const origins = String(origin || '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!origins.length || origins.some((o) => { try { return new URL(o).origin !== o; } catch { return true; } })) throw new Error('APP_ORIGIN must be an exact origin');

  function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
  }
  async function readJson(req, max = 4096) {
    const chunks = []; let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > max) throw new Fail(413, 'too_large');
      chunks.push(chunk);
    }
    if (!bytes) return {};
    let body;
    try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw new Fail(400, 'bad_json'); }
    if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Fail(400, 'bad_json');
    return body;
  }
  // Same shared table as the login limits, so limits hold across App Service workers.
  async function limit(key, max) {
    const [r] = await rows(db, `INSERT INTO auth_limits(key,attempts,expires_at)
      VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET
      attempts=CASE WHEN auth_limits.expires_at<=now() THEN 1 ELSE auth_limits.attempts+1 END,
      expires_at=CASE WHEN auth_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END
      RETURNING attempts`, [hash(`consortia:${key}`)]);
    if (r.attempts > max) throw new Fail(429, 'slow_down');
  }

  const playerScience = async (c, uid) =>
    (await rows(c, 'SELECT coalesce(sum(points),0)::float8 AS s FROM science_awards WHERE user_id=$1', [uid]))[0].s;
  const membership = async (c, uid) =>
    (await rows(c, 'SELECT consortium_id AS cid, role FROM consortium_members WHERE user_id=$1', [uid]))[0] || null;
  const system = (c, cid, data) =>
    c.query(`INSERT INTO consortium_messages(consortium_id,kind,data) VALUES($1,'system',$2::jsonb)`, [cid, JSON.stringify(data)]);
  const count = async (c, cid) =>
    (await rows(c, 'SELECT count(*)::int AS n FROM consortium_members WHERE consortium_id=$1', [cid]))[0].n;

  // Marks the player as seen (presence) and returns their membership, or throws 404 no_consortium.
  async function touch(uid) {
    const [m] = await rows(db, `UPDATE consortium_members SET last_seen_at=now() WHERE user_id=$1
      RETURNING consortium_id AS cid, role, last_read_id::float8 AS last_read`, [uid]);
    if (!m) throw new Fail(404, 'no_consortium');
    return m;
  }
  // Inside a transaction: locks the player's consortium, then re-reads their role (it may have just changed).
  async function lockMine(t, uid, minRank = 0) {
    const m = await membership(t, uid);
    if (!m) throw new Fail(404, 'no_consortium');
    await t.query('SELECT 1 FROM consortia WHERE id=$1 FOR UPDATE', [m.cid]);
    const [me] = await rows(t, `UPDATE consortium_members SET last_seen_at=now() WHERE user_id=$1 AND consortium_id=$2
      RETURNING consortium_id AS cid, role`, [uid, m.cid]);
    if (!me) throw new Fail(409, 'conflict');
    if (rank(me.role) < minRank) throw new Fail(403, 'forbidden');
    return me;
  }
  // Best member to lead next: a vice first, then a chief engineer, then anyone; most recently active first.
  async function successor(t, cid, excluded, activeOnly) {
    return (await rows(t, `SELECT m.user_id, u.username FROM consortium_members m JOIN users u ON u.id=m.user_id
      WHERE m.consortium_id=$1 AND ($2::uuid IS NULL OR m.user_id<>$2::uuid)
      ${activeOnly ? `AND m.last_seen_at > now() - interval '${LIMITS.inactiveDays} days'` : ''}
      ORDER BY array_position(ARRAY['vice','chief_engineer','member'], m.role), m.last_seen_at DESC LIMIT 1`,
    [cid, excluded ?? null]))[0] || null;
  }
  async function addMember(t, cid, uid, username) {
    await t.query('INSERT INTO consortium_members(user_id,consortium_id) VALUES($1,$2)', [uid, cid]);
    await t.query(`UPDATE consortium_requests SET status='cancelled', decided_at=now() WHERE user_id=$1 AND status='pending'`, [uid]);
    await system(t, cid, { code: 'joined', user: username });
  }
  // A director absent for 14 days (or missing) hands over to the most active vice. Checked lazily.
  async function ensureDirector(cid) {
    const active = await rows(db, `SELECT 1 FROM consortium_members WHERE consortium_id=$1 AND role='director'
      AND last_seen_at > now() - interval '${LIMITS.inactiveDays} days'`, [cid]);
    if (active.length) return;
    await tx(db, async t => {
      await t.query('SELECT 1 FROM consortia WHERE id=$1 FOR UPDATE', [cid]);
      const [dir] = await rows(t, `SELECT user_id, last_seen_at > now() - interval '${LIMITS.inactiveDays} days' AS active
        FROM consortium_members WHERE consortium_id=$1 AND role='director'`, [cid]);
      if (dir?.active) return;
      const next = await successor(t, cid, dir?.user_id, true);
      if (!next) return;
      if (dir) await t.query(`UPDATE consortium_members SET role='vice' WHERE user_id=$1`, [dir.user_id]);
      await t.query(`UPDATE consortium_members SET role='director' WHERE user_id=$1`, [next.user_id]);
      await system(t, cid, { code: 'new_director', user: next.username, reason: 'inactive' });
    });
  }

  const handlers = {
    async search({ user, query }) {
      const text = clean(query.get('q') || '').slice(0, 24);
      const args = [], where = [];
      const full = `(SELECT count(*) FROM consortium_members x WHERE x.consortium_id=c.id) >= c.max_members`;
      if (text) {
        args.push(`%${text.replace(/[\\%_]/g, '\\$&')}%`);
        where.push(`c.name ILIKE $${args.length}`);
      } else where.push(`c.kind <> 'invite'`, `NOT ${full}`); // recommended list
      if (query.get('free') === '1') where.push(`NOT ${full}`);
      const maxMin = query.get('maxMin');
      if (maxMin !== null) {
        if (!/^\d{1,9}$/.test(maxMin)) throw bad('maxMin');
        args.push(Number(maxMin));
        where.push(`c.min_science <= $${args.length}`);
      }
      const list = await rows(db, `SELECT ${SUMMARY} FROM consortia c WHERE ${where.join(' AND ')}
        ORDER BY ${text ? 'lower(c.name)' : 'science DESC, members DESC, c.created_at'} LIMIT 20`, args);
      // Which of these the player has already asked to join, so the client can show "waiting for response".
      let asked = new Set();
      if (user && list.length) asked = new Set((await rows(db, `SELECT consortium_id FROM consortium_requests WHERE user_id=$1 AND status='pending' AND consortium_id = ANY($2::uuid[])`, [user.id, list.map(c => c.id)])).map(r => r.consortium_id));
      return { body: { consortia: list.map(c => ({ ...summary(c), ...(asked.has(c.id) ? { requested: true } : {}) })) } };
    },

    async create({ user, body }) {
      const s = settingsFrom(body, true);
      await limit(`create:${user.id}`, 10);
      const id = randomUUID();
      await tx(db, async t => {
        if (await membership(t, user.id)) throw new Fail(409, 'already_member');
        await t.query(`INSERT INTO consortia(id,name,crest,motto,kind,invite_code,min_science,max_members,school_mode,created_by)
          VALUES($1,$2,$3::jsonb,$4,$5,$6,$7,$8,$9,$10)`, [id, s.name, JSON.stringify(s.crest), s.motto ?? '', s.kind ?? 'open',
          newCode(), s.min_science ?? 0, s.max_members ?? LIMITS.members, s.school_mode ?? false, user.id]);
        await t.query(`INSERT INTO consortium_members(user_id,consortium_id,role) VALUES($1,$2,'director')`, [user.id, id]);
        await t.query(`UPDATE consortium_requests SET status='cancelled', decided_at=now() WHERE user_id=$1 AND status='pending'`, [user.id]);
        await system(t, id, { code: 'founded', user: user.username });
      }).catch(uniqueAs(e => String(e.constraint || e.message).includes('name') ? 'name_taken' : 'already_member'));
      const [c] = await rows(db, `SELECT ${SUMMARY} FROM consortia c WHERE c.id=$1`, [id]);
      return { status: 201, body: { consortium: summary(c) } };
    },

    async profile({ params: [id] }) {
      const [c] = await rows(db, `SELECT ${SUMMARY} FROM consortia c WHERE c.id=$1`, [id]);
      if (!c) throw new Fail(404, 'not_found');
      const members = await rows(db, `SELECT u.username, m.role, m.science::float8 AS science FROM consortium_members m
        JOIN users u ON u.id=m.user_id WHERE m.consortium_id=$1 ORDER BY ${ROLE_ORDER}, m.science DESC`, [id]);
      return { body: { consortium: summary(c), members } };
    },

    async mine({ user }) {
      const science = await playerScience(db, user.id);
      let me;
      try { me = await touch(user.id); } catch (e) {
        if (e.code === 'no_consortium') return { body: { consortium: null, player: { science } } };
        throw e;
      }
      await ensureDirector(me.cid);
      const [c] = await rows(db, `SELECT ${SUMMARY}, c.invite_code, c.school_mode FROM consortia c WHERE c.id=$1`, [me.cid]);
      const members = await rows(db, `SELECT u.username, m.role, m.science::float8 AS science, m.joined_at AS "joinedAt",
        m.spectate_allowed AS spectate, CASE WHEN l.updated_at > now() - interval '30 seconds' THEN 'playing'
        WHEN m.last_seen_at > now() - interval '2 minutes' THEN 'online' ELSE 'offline' END AS status
        FROM consortium_members m JOIN users u ON u.id=m.user_id LEFT JOIN live_sessions l ON l.user_id=m.user_id
        WHERE m.consortium_id=$1 ORDER BY ${ROLE_ORDER}, m.science DESC, u.username`, [me.cid]);
      const mine = members.find(m => m.username === user.username);
      const lead = rank(mine.role) >= 2;
      const requests = lead ? await rows(db, `SELECT r.id::float8 AS id, u.username, r.message, r.created_at AS at,
        (SELECT coalesce(sum(points),0)::float8 FROM science_awards a WHERE a.user_id=r.user_id) AS science
        FROM consortium_requests r JOIN users u ON u.id=r.user_id WHERE r.consortium_id=$1 AND r.status='pending'
        ORDER BY r.id`, [me.cid]) : [];
      const [{ n: unread }] = await rows(db, `SELECT count(*)::int AS n FROM consortium_messages WHERE consortium_id=$1
        AND id > $2 AND author_id IS DISTINCT FROM $3 AND deleted_at IS NULL`, [me.cid, me.last_read, user.id]);
      // reported messages still to review (director and deputy only)
      const reports = lead ? (await rows(db, `SELECT count(DISTINCT m.id)::int AS n FROM consortium_messages m JOIN message_reports r ON r.message_id=m.id
        WHERE m.consortium_id=$1 AND m.reviewed_at IS NULL`, [me.cid]))[0].n : 0;
      return { body: {
        consortium: { ...summary(c), schoolMode: c.school_mode, ...(lead ? { inviteCode: c.invite_code } : {}) },
        me: { username: mine.username, role: mine.role, science: mine.science, spectate: mine.spectate },
        members, requests, unread, player: { science }, ...(lead ? { reports } : {})
      } };
    },

    async settings({ user, body }) {
      const s = settingsFrom(body, false);
      const columns = Object.keys(s);
      if (!columns.length) throw bad('settings');
      const c = await tx(db, async t => {
        const me = await lockMine(t, user.id, 2);
        if (s.max_members !== undefined && s.max_members < await count(t, me.cid)) throw new Fail(409, 'too_many_members');
        const values = columns.map(k => k === 'crest' ? JSON.stringify(s[k]) : s[k]);
        const sets = columns.map((k, i) => `${k}=$${i + 2}${k === 'crest' ? '::jsonb' : ''}`);
        await t.query(`UPDATE consortia SET ${sets.join(',')} WHERE id=$1`, [me.cid, ...values]);
        await system(t, me.cid, { code: 'settings', user: user.username });
        return (await rows(t, `SELECT ${SUMMARY}, c.school_mode FROM consortia c WHERE c.id=$1`, [me.cid]))[0];
      });
      return { body: { consortium: { ...summary(c), schoolMode: c.school_mode } } };
    },

    async inviteCode({ user }) {
      const code = newCode();
      await tx(db, async t => {
        const me = await lockMine(t, user.id, 2);
        await t.query('UPDATE consortia SET invite_code=$2 WHERE id=$1', [me.cid, code]);
      });
      return { body: { inviteCode: code } };
    },

    async preferences({ user, body }) {
      if (typeof body.spectate !== 'boolean') throw bad('spectate');
      await touch(user.id);
      await db.query('UPDATE consortium_members SET spectate_allowed=$2 WHERE user_id=$1', [user.id, body.spectate]);
      if (!body.spectate) await db.query(`UPDATE live_sessions SET state=state - 'pack', watched_until=NULL WHERE user_id=$1`, [user.id]);
      return { body: { spectate: body.spectate } };
    },

    async join({ user, body, params: [id] }) {
      if (body.code !== undefined && typeof body.code !== 'string') throw bad('code');
      if (body.message !== undefined && typeof body.message !== 'string') throw bad('message');
      const code = (body.code || '').trim().toUpperCase();
      const note = clean(body.message || '');
      if (note.length > LIMITS.request || LINK.test(note)) throw bad('message');
      if (rude(note)) throw new Fail(400, 'language', { field: 'message' });
      await limit(`join:${user.id}`, 30);
      return tx(db, async t => {
        const [c] = await rows(t, 'SELECT id, kind, invite_code, min_science, max_members FROM consortia WHERE id=$1 FOR UPDATE', [id]);
        if (!c) throw new Fail(404, 'not_found');
        if (await membership(t, user.id)) throw new Fail(409, 'already_member');
        if (await count(t, c.id) >= c.max_members) throw new Fail(409, 'full');
        // A valid invite code lets the player in whatever the type and minimum score.
        if (!(code && code === c.invite_code)) {
          if (c.kind === 'invite') throw new Fail(403, code ? 'wrong_code' : 'invite_only');
          const science = await playerScience(t, user.id);
          if (science < c.min_science) throw new Fail(403, 'not_enough_science', { required: c.min_science, science });
          if (c.kind === 'request') {
            await t.query(`INSERT INTO consortium_requests(consortium_id,user_id,message) VALUES($1,$2,$3)
              ON CONFLICT (consortium_id,user_id) WHERE status='pending' DO NOTHING`, [c.id, user.id, note]);
            return { status: 202, body: { requested: true } };
          }
        }
        await addMember(t, c.id, user.id, user.username);
        return { body: { joined: true } };
      }).catch(uniqueAs('already_member'));
    },

    async decide({ user, body, params: [rid] }) {
      if (typeof body.accept !== 'boolean') throw bad('accept');
      return tx(db, async t => {
        const me = await lockMine(t, user.id, 2);
        const [r] = await rows(t, `SELECT r.user_id, u.username FROM consortium_requests r JOIN users u ON u.id=r.user_id
          WHERE r.id=$1 AND r.consortium_id=$2 AND r.status='pending' FOR UPDATE OF r`, [rid, me.cid]);
        if (!r) throw new Fail(404, 'request_not_found');
        const close = status => t.query(`UPDATE consortium_requests SET status=$2, decided_by=$3, decided_at=now() WHERE id=$1`,
          [rid, status, user.id]);
        if (!body.accept) { await close('rejected'); return { body: { accepted: false } }; }
        if (await membership(t, r.user_id)) { await close('cancelled'); return { status: 409, body: { error: 'already_member' } }; }
        const [c] = await rows(t, 'SELECT max_members FROM consortia WHERE id=$1', [me.cid]);
        if (await count(t, me.cid) >= c.max_members) throw new Fail(409, 'full');
        await close('accepted');
        await addMember(t, me.cid, r.user_id, r.username);
        return { body: { accepted: true } };
      }).catch(uniqueAs('already_member'));
    },

    async member({ user, body, params: [username] }) {
      const action = body.action;
      if (!['promote', 'demote', 'kick', 'transfer'].includes(action)) throw bad('action');
      return tx(db, async t => {
        const me = await lockMine(t, user.id, 1);
        const [target] = await rows(t, `SELECT m.user_id, m.role, u.username FROM consortium_members m JOIN users u ON u.id=m.user_id
          WHERE lower(u.username)=lower($1) AND m.consortium_id=$2`, [username, me.cid]);
        if (!target) throw new Fail(404, 'member_not_found');
        if (target.user_id === user.id) throw new Fail(400, 'self');
        const R = rank(me.role), T = rank(target.role);
        const setRole = role => t.query('UPDATE consortium_members SET role=$2 WHERE user_id=$1', [target.user_id, role]);
        if (action === 'promote') {
          // Nobody can raise a member to their own rank or above; the director role moves only by transfer.
          if (T + 1 >= rank('director')) throw new Fail(400, 'invalid', { field: 'action' });
          if (R <= T + 1) throw new Fail(403, 'forbidden');
          await setRole(ROLES[T + 1]);
          await system(t, me.cid, { code: 'promoted', user: target.username, role: ROLES[T + 1] });
          return { body: { member: { username: target.username, role: ROLES[T + 1] } } };
        }
        if (action === 'demote') {
          if (T === 0) throw new Fail(400, 'invalid', { field: 'action' });
          if (R <= T) throw new Fail(403, 'forbidden');
          await setRole(ROLES[T - 1]);
          await system(t, me.cid, { code: 'demoted', user: target.username, role: ROLES[T - 1] });
          return { body: { member: { username: target.username, role: ROLES[T - 1] } } };
        }
        if (action === 'kick') {
          if (R < rank('vice') || R <= T) throw new Fail(403, 'forbidden');
          await t.query('DELETE FROM consortium_members WHERE user_id=$1', [target.user_id]);
          await t.query('DELETE FROM live_sessions WHERE user_id=$1', [target.user_id]);
          await system(t, me.cid, { code: 'kicked', user: target.username, by: user.username });
          return { body: { kicked: true } };
        }
        if (me.role !== 'director') throw new Fail(403, 'forbidden');
        await t.query(`UPDATE consortium_members SET role='vice' WHERE user_id=$1`, [user.id]);
        await setRole('director');
        await system(t, me.cid, { code: 'new_director', user: target.username, reason: 'transfer' });
        return { body: { member: { username: target.username, role: 'director' } } };
      });
    },

    async leave({ user }) {
      return tx(db, async t => {
        const me = await lockMine(t, user.id);
        await t.query('DELETE FROM consortium_members WHERE user_id=$1', [user.id]);
        await t.query('DELETE FROM live_sessions WHERE user_id=$1', [user.id]);
        if (await count(t, me.cid) === 0) {
          await t.query('DELETE FROM consortia WHERE id=$1', [me.cid]);
          return { body: { left: true, disbanded: true } };
        }
        await system(t, me.cid, { code: 'left', user: user.username });
        if (me.role === 'director') {
          const next = await successor(t, me.cid, null, false);
          await t.query(`UPDATE consortium_members SET role='director' WHERE user_id=$1`, [next.user_id]);
          await system(t, me.cid, { code: 'new_director', user: next.username, reason: 'left' });
        }
        return { body: { left: true, disbanded: false } };
      });
    },

    async messages({ user, query }) {
      const me = await touch(user.id);
      const after = query.get('after');
      if (after !== null && !/^\d{1,15}$/.test(after)) throw bad('after');
      const list = after !== null
        ? await rows(db, `SELECT ${MESSAGE_COLUMNS} WHERE m.consortium_id=$1 AND m.id>$2 ORDER BY m.id LIMIT ${LIMITS.page}`, [me.cid, after])
        : await rows(db, `SELECT * FROM (SELECT ${MESSAGE_COLUMNS} WHERE m.consortium_id=$1 ORDER BY m.id DESC LIMIT ${LIMITS.page}) x
          ORDER BY id`, [me.cid]);
      const lastId = list.length ? list[list.length - 1].id : Number(after || 0);
      if (lastId > me.last_read) await db.query('UPDATE consortium_members SET last_read_id=GREATEST(last_read_id,$2) WHERE user_id=$1', [user.id, lastId]);
      return { body: { messages: list.map(message), lastId, more: after !== null && list.length === LIMITS.page } };
    },

    async unread({ user }) {
      const [r] = await rows(db, `UPDATE consortium_members SET last_seen_at=now() WHERE user_id=$1
        RETURNING consortium_id, last_read_id`, [user.id]);
      if (!r) return { body: { member: false, unread: 0 } };
      const [{ n }] = await rows(db, `SELECT count(*)::int AS n FROM consortium_messages WHERE consortium_id=$1
        AND id > $2 AND author_id IS DISTINCT FROM $3 AND deleted_at IS NULL`, [r.consortium_id, r.last_read_id, user.id]);
      // Joint missions where this player has something to do (an undone role, a request for them, a vote).
      const js = await rows(db, `SELECT state FROM joint_missions WHERE consortium_id=$1 AND status IN ('open','active') LIMIT 3`, [r.consortium_id]);
      return { body: { member: true, unread: n, joint: js.filter(j => jointWaiting(j.state, user.username)).length } };
    },

    async post({ user, body }) {
      let kind = body.kind, text = '', data = null;
      if (kind === 'text') {
        if (typeof body.text !== 'string') throw bad('text');
        text = clean(body.text);
        if (!text || text.length > LIMITS.text) throw bad('text');
        if (LINK.test(text)) throw new Fail(400, 'link');
        if (rude(text)) throw new Fail(400, 'language');
      } else if (kind === 'phrase') {
        // a preset phrase: stored as text with its code, so every reader sees it in their own language
        if (!Object.prototype.hasOwnProperty.call(PHRASES, body.phrase)) throw bad('phrase');
        kind = 'text'; text = PHRASES[body.phrase]; data = { phrase: body.phrase };
      } else if (kind === 'sticker') {
        if (!STICKERS.includes(body.sticker)) throw bad('sticker');
        text = body.sticker;
        // A sticker sent while watching a teammate is addressed to them: it pops up on their screen.
        if (body.to !== undefined && (typeof body.to !== 'string' || !/^[A-Za-z0-9_]{3,24}$/.test(body.to))) throw bad('to');
      } else if (kind === 'mission') {
        data = missionCard(body.mission);
      } else throw bad('kind');
      const saved = await tx(db, async t => {
        // Locking the player's own row serialises their messages, so the 2-second limit holds.
        const [me] = await rows(t, `SELECT m.consortium_id AS cid, m.role, c.school_mode, c.level FROM consortium_members m
          JOIN consortia c ON c.id=m.consortium_id WHERE m.user_id=$1 FOR UPDATE OF m`, [user.id]);
        if (!me) throw new Fail(404, 'no_consortium');
        if (kind === 'text' && !data && me.school_mode) throw new Fail(403, 'school_mode');
        if (kind === 'sticker' && (STICKER_LEVEL[text] || 1) > me.level) throw new Fail(403, 'sticker_locked', { level: STICKER_LEVEL[text] });
        const recent = await rows(t, `SELECT 1 FROM consortium_messages WHERE author_id=$1
          AND created_at > now() - interval '2 seconds' LIMIT 1`, [user.id]);
        if (recent.length) throw new Fail(429, 'slow_down');
        if (kind === 'sticker' && body.to !== undefined) {
          const [to] = await rows(t, `SELECT u.username FROM consortium_members m JOIN users u ON u.id=m.user_id
            WHERE lower(u.username)=lower($1) AND m.consortium_id=$2`, [body.to, me.cid]);
          if (!to) throw new Fail(404, 'member_not_found');
          data = { to: to.username };
        }
        await t.query('UPDATE consortium_members SET last_seen_at=now() WHERE user_id=$1', [user.id]);
        const [m] = await rows(t, `INSERT INTO consortium_messages(consortium_id,author_id,kind,body,data)
          VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id::float8 AS id, kind, body, data, created_at, false AS deleted`,
        [me.cid, user.id, kind, text, data && JSON.stringify(data)]);
        return message({ ...m, author: user.username, author_role: me.role });
      });
      return { status: 201, body: { message: saved } };
    },

    // Report a teammate's message. Reports from three different members (REPORTS_TO_HIDE) hide it at once; it stays stored for review.
    async report({ user, body, params: [mid] }) {
      const reason = body.reason ?? 'rude';
      if (!['rude', 'spam', 'other'].includes(reason)) throw bad('reason');
      await limit(`report:${user.id}`, 30);
      return tx(db, async t => {
        const [me] = await rows(t, 'SELECT consortium_id AS cid FROM consortium_members WHERE user_id=$1', [user.id]);
        if (!me) throw new Fail(404, 'no_consortium');
        const [m] = await rows(t, 'SELECT author_id, kind, deleted_at FROM consortium_messages WHERE id=$1 AND consortium_id=$2 FOR UPDATE', [mid, me.cid]);
        if (!m || m.kind === 'system') throw new Fail(404, 'message_not_found');
        if (m.author_id === user.id) throw new Fail(400, 'self');
        const added = await rows(t, 'INSERT INTO message_reports(message_id,reporter_id,reason) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING 1', [mid, user.id, reason]);
        const [{ n }] = await rows(t, 'SELECT count(*)::int AS n FROM message_reports WHERE message_id=$1', [mid]);
        let hidden = !!m.deleted_at;
        if (added.length) await t.query('UPDATE consortium_messages SET reviewed_at=NULL WHERE id=$1', [mid]);
        if (!hidden && n >= REPORTS_TO_HIDE) { await t.query('UPDATE consortium_messages SET deleted_at=now() WHERE id=$1', [mid]); hidden = true; }
        return { body: { reported: true, reports: n, hidden } };
      });
    },

    // Director and deputy: the reported messages still to review, with how many reports and why.
    async reports({ user }) {
      const me = await touch(user.id);
      if (rank(me.role) < rank('vice')) throw new Fail(403, 'forbidden');
      const list = await rows(db, `SELECT m.id::float8 AS id, m.kind, m.body, m.data, m.created_at AS at, m.deleted_at IS NOT NULL AS hidden,
        u.username AS author, count(r.*)::int AS reports, array_agg(DISTINCT r.reason) AS reasons
        FROM consortium_messages m JOIN message_reports r ON r.message_id=m.id LEFT JOIN users u ON u.id=m.author_id
        WHERE m.consortium_id=$1 AND m.reviewed_at IS NULL GROUP BY m.id, u.username ORDER BY max(r.created_at) DESC LIMIT 30`, [me.cid]);
      return { body: { reports: list.map(x => ({ id: x.id, author: x.author, kind: x.kind, at: x.at, hidden: x.hidden, reports: x.reports, reasons: x.reasons,
        ...(x.kind === 'text' ? { text: x.body } : x.kind === 'sticker' ? { sticker: x.body } : { data: x.data }) })) } };
    },

    // delete: the message is removed for good; dismiss: the report is closed and a message hidden by reports comes back
    // (never one its author deleted).
    async review({ user, body, params: [mid] }) {
      if (!['dismiss', 'delete'].includes(body.action)) throw bad('action');
      return tx(db, async t => {
        const me = await lockMine(t, user.id, rank('vice'));
        const [m] = await rows(t, `SELECT 1 FROM consortium_messages m WHERE m.id=$1 AND m.consortium_id=$2
          AND EXISTS (SELECT 1 FROM message_reports r WHERE r.message_id=m.id)`, [mid, me.cid]);
        if (!m) throw new Fail(404, 'message_not_found');
        if (body.action === 'delete') await t.query('UPDATE consortium_messages SET deleted_at=coalesce(deleted_at, now()), deleted_by=$2, reviewed_at=now() WHERE id=$1', [mid, user.id]);
        else await t.query('UPDATE consortium_messages SET deleted_at=CASE WHEN deleted_by IS NULL THEN NULL ELSE deleted_at END, reviewed_at=now() WHERE id=$1', [mid]);
        return { body: { reviewed: true, action: body.action } };
      });
    },

    async remove({ user, params: [mid] }) {
      const me = await touch(user.id);
      const [m] = await rows(db, `SELECT author_id FROM consortium_messages WHERE id=$1 AND consortium_id=$2
        AND deleted_at IS NULL AND kind <> 'system'`, [mid, me.cid]);
      if (!m) throw new Fail(404, 'message_not_found');
      if (m.author_id !== user.id && rank(me.role) < rank('vice')) throw new Fail(403, 'forbidden');
      await db.query('UPDATE consortium_messages SET deleted_at=now(), deleted_by=$2 WHERE id=$1', [mid, user.id]);
      return { body: { deleted: true } };
    },

    async activity({ user, body }) {
      if (!['launch', 'success', 'failure'].includes(body.type)) throw bad('type');
      if (typeof body.mission !== 'string') throw bad('mission');
      const mission = clean(body.mission);
      if (!mission || mission.length > 24 || LINK.test(mission)) throw bad('mission');
      if (rude(mission)) throw new Fail(400, 'language', { field: 'mission' });
      const me = await touch(user.id);
      await limit(`activity:${user.id}`, 30);
      await system(db, me.cid, { code: body.type, user: user.username, mission });
      return { status: 201, body: { posted: true } };
    },

    // Joint missions of my consortium: open and running ones, plus those closed in the last day.
    async jointList({ user }) {
      const me = await touch(user.id);
      const list = await rows(db, `SELECT id, state, status, version, updated_at FROM joint_missions WHERE consortium_id=$1
        AND (status IN ('open','active') OR updated_at > now() - interval '1 day') ORDER BY updated_at DESC LIMIT 10`, [me.cid]);
      return { body: { joint: list.map(j => ({ id: j.id, name: j.state.name, status: j.status, phase: j.state.phase, turn: j.state.turn,
        roles: j.state.roles, done: j.state.done, waiting: jointWaiting(j.state, user.username), by: j.state.by, version: j.version, updatedAt: j.updated_at })) } };
    },

    async jointCreate({ user, body }) {
      if (typeof body.name !== 'string') throw bad('name');
      const name = clean(body.name);
      if (name.length < 3 || name.length > 24 || LINK.test(name)) throw bad('name');
      if (rude(name)) throw new Fail(400, 'language', { field: 'name' });
      await limit(`joint:${user.id}`, 10);
      const id = randomUUID(), state = jointNew(name, user.username);
      await tx(db, async t => {
        const me = await lockMine(t, user.id);
        const [{ n }] = await rows(t, `SELECT count(*)::int AS n FROM joint_missions WHERE consortium_id=$1 AND status IN ('open','active')`, [me.cid]);
        if (n >= 3) throw new Fail(409, 'too_many_joint');
        await t.query(`INSERT INTO joint_missions(id,consortium_id,created_by,status,roles,turn,state) VALUES($1,$2,$3,'open',$4::jsonb,NULL,$5::jsonb)`,
          [id, me.cid, user.id, JSON.stringify(state.roles), JSON.stringify(state)]);
        await system(t, me.cid, { code: 'joint_new', user: user.username, mission: name, id });
      });
      return { status: 201, body: { id, version: 1, status: 'open', state } };
    },

    // ?v=<version>: if nothing changed the reply is tiny ({ same: true }).
    async jointGet({ user, query, params: [id] }) {
      const me = await touch(user.id);
      const [j] = await rows(db, 'SELECT id, state, status, version FROM joint_missions WHERE id=$1 AND consortium_id=$2', [id, me.cid]);
      if (!j) throw new Fail(404, 'not_found');
      if (query.get('v') === String(j.version)) return { body: { same: true, version: j.version } };
      return { body: { id: j.id, status: j.status, version: j.version, state: j.state } };
    },

    // Every action carries the version the player saw: if a teammate changed something meanwhile, it is refused (stale)
    // with the current version, and the game reloads before trying again. Nobody overwrites anybody.
    async jointAct({ user, body, params: [id] }) {
      if (!int(body.v, 1, 1e9)) throw bad('v');
      await limit(`jointact:${user.id}`, 400);
      return tx(db, async t => {
        const me = await lockMine(t, user.id);
        const [j] = await rows(t, 'SELECT id, state, version FROM joint_missions WHERE id=$1 AND consortium_id=$2 FOR UPDATE', [id, me.cid]);
        if (!j) throw new Fail(404, 'not_found');
        if (body.v !== j.version) throw new Fail(409, 'stale', { version: j.version });
        const s = jointReduce(j.state, body, user.username, rank(me.role) >= 2), status = jointStatus(s.phase), version = j.version + 1;
        await t.query(`UPDATE joint_missions SET state=$2::jsonb, roles=$3::jsonb, turn=$4, status=$5, version=$6, updated_at=now() WHERE id=$1`,
          [id, JSON.stringify(s), JSON.stringify(s.roles), s.turn, status, version]);
        if (status === 'done') {
          // Science points for every player, once (science_awards key), for them and for the consortium.
          const players = await rows(t, `SELECT u.id, u.username FROM users u JOIN consortium_members m ON m.user_id=u.id
            WHERE m.consortium_id=$1 AND u.username = ANY($2::text[])`, [me.cid, jointPlayers(s)]);
          for (const p of players) {
            const added = await rows(t, `INSERT INTO science_awards(user_id,mission_key,points,consortium_id) VALUES($1,$2,$3,$4)
              ON CONFLICT DO NOTHING RETURNING 1`, [p.id, 'joint-' + id, s.points, me.cid]);
            if (added.length) {
              await t.query('UPDATE consortium_members SET science=science+$2 WHERE user_id=$1', [p.id, s.points]);
              await t.query('UPDATE consortia SET science=science+$2 WHERE id=$1', [me.cid, s.points]);
            }
          }
          await levelUp(t, me.cid);
          await system(t, me.cid, { code: 'joint_done', mission: s.name, users: players.map(p => p.username), points: s.points, design: s.design });
        }
        return { body: { id, status, version, state: s } };
      });
    },

    // Spectate, player side: a heartbeat every few seconds (view + mission name). The compressed game state is added
    // only while someone watches (the reply says so). Stickers addressed to the player come back in the reply.
    async live({ user, body }) {
      const view = body.view ?? '';
      if (typeof view !== 'string' || !/^[a-z]{0,12}$/.test(view)) throw bad('view');
      if (body.mission !== undefined && typeof body.mission !== 'string') throw bad('mission');
      const mission = clean(body.mission || '').slice(0, 24);
      const since = body.since ?? 0;
      if (!int(since, 0, 1e15)) throw bad('since');
      let pack = null;
      if (body.state != null) {
        const s = body.state;
        if (typeof s !== 'object' || !['gz', 'raw'].includes(s.enc) || typeof s.data !== 'string' || !s.data ||
          s.data.length > LIMITS.liveState || !/^[A-Za-z0-9+/]+={0,2}$/.test(s.data)) throw bad('state');
        pack = { enc: s.enc, data: s.data };
      }
      const [me] = await rows(db, `UPDATE consortium_members SET last_seen_at=now() WHERE user_id=$1
        RETURNING consortium_id AS cid, spectate_allowed AS ok`, [user.id]);
      if (!me) throw new Fail(404, 'no_consortium');
      if (!me.ok) pack = null; // spectate switched off: never keep a game state for others
      const mode = pack ? 'set' : me.ok ? 'keep' : 'drop';
      const state = { view, mission, at: new Date().toISOString(), ...(pack ? { pack } : {}) };
      const [r] = await rows(db, `INSERT INTO live_sessions(user_id,consortium_id,state,updated_at) VALUES($1,$2,$3::jsonb,now())
        ON CONFLICT (user_id) DO UPDATE SET consortium_id=EXCLUDED.consortium_id, updated_at=now(),
        state = CASE WHEN $4='keep' AND live_sessions.consortium_id=EXCLUDED.consortium_id THEN coalesce(live_sessions.state,'{}'::jsonb) || EXCLUDED.state ELSE EXCLUDED.state END
        RETURNING coalesce(watched_until > now(), false) AS watched`, [user.id, me.cid, JSON.stringify(state), mode]);
      const reactions = await rows(db, `SELECT m.id::float8 AS id, m.body AS sticker, u.username AS author
        FROM consortium_messages m JOIN users u ON u.id=m.author_id WHERE m.consortium_id=$1 AND m.kind='sticker'
        AND m.deleted_at IS NULL AND m.data->>'to'=$2 AND m.id>$3 AND m.created_at > now() - interval '30 seconds'
        ORDER BY m.id LIMIT 10`, [me.cid, user.username, since]);
      return { body: { watched: !!(me.ok && r.watched), reactions, lastId: reactions.length ? reactions[reactions.length - 1].id : since } };
    },

    // Spectate, viewer side: only a teammate, only if they allow it and are playing now. Reading keeps the stream on.
    async watch({ user, params: [username] }) {
      const me = await touch(user.id);
      const [t] = await rows(db, `SELECT u.id, u.username, m.spectate_allowed AS ok, l.state,
        coalesce(l.updated_at > now() - interval '${LIMITS.liveSeconds} seconds', false) AS live
        FROM users u JOIN consortium_members m ON m.user_id=u.id AND m.consortium_id=$2
        LEFT JOIN live_sessions l ON l.user_id=u.id AND l.consortium_id=$2 WHERE lower(u.username)=lower($1)`, [username, me.cid]);
      if (!t) throw new Fail(404, 'member_not_found');
      if (t.id === user.id) throw new Fail(400, 'self');
      if (!t.ok) throw new Fail(403, 'spectate_off');
      if (!t.live) throw new Fail(404, 'not_live');
      await db.query(`UPDATE live_sessions SET watched_until=now() + interval '${LIMITS.watchSeconds} seconds' WHERE user_id=$1`, [t.id]);
      const s = t.state || {};
      return { body: { username: t.username, view: s.view || '', mission: s.mission || '', at: s.at || null, state: s.pack || null } };
    },

    // Science points of a finished mission: counted once per (player, mission), for the player and their consortium.
    async science({ user, body }) {
      if (typeof body.mission !== 'string' || !/^[A-Za-z0-9_.:-]{1,64}$/.test(body.mission)) throw bad('mission');
      if (!int(body.points, 0, LIMITS.missionScience)) throw bad('points');
      if (body.name !== undefined && typeof body.name !== 'string') throw bad('name');
      const raw = clean(body.name || '').slice(0, 24), name = rude(raw) ? '' : raw, facts = missionFacts(body.facts);
      await limit(`science:${user.id}`, 60);
      const week = weekOf(now()), goal = goalOf(week);
      return tx(db, async t => {
        const [me] = await rows(t, 'SELECT consortium_id AS cid FROM consortium_members WHERE user_id=$1 FOR UPDATE', [user.id]);
        const added = await rows(t, `INSERT INTO science_awards(user_id,mission_key,points,consortium_id) VALUES($1,$2,$3,$4)
          ON CONFLICT DO NOTHING RETURNING 1`, [user.id, body.mission, body.points, me?.cid ?? null]);
        let challenge = null;
        if (added.length && me && body.points > 0) {
          await t.query('UPDATE consortium_members SET science=science+$2, last_seen_at=now() WHERE user_id=$1', [user.id, body.points]);
          await t.query('UPDATE consortia SET science=science+$2 WHERE id=$1', [me.cid, body.points]);
          await system(t, me.cid, { code: 'science', user: user.username, mission: name, points: body.points });
          await levelUp(t, me.cid);
          // The weekly challenge: the same points, if the mission meets this week's goal.
          if (meetsGoal(goal, facts)) {
            await ensureWeek(t, week);
            await t.query(`INSERT INTO challenge_scores(week,consortium_id,points) VALUES($1,$2,$3)
              ON CONFLICT (week,consortium_id) DO UPDATE SET points=challenge_scores.points+EXCLUDED.points`, [week, me.cid, body.points]);
            await system(t, me.cid, { code: 'challenge_points', user: user.username, mission: name, points: body.points });
            challenge = { matched: true, points: body.points, goal: goal.id };
          }
        }
        const consortium = me ? (await rows(t, 'SELECT science::float8 AS science FROM consortia WHERE id=$1', [me.cid]))[0] : null;
        return { body: { counted: added.length > 0, player: { science: await playerScience(t, user.id) }, consortium, ...(challenge ? { challenge } : {}) } };
      });
    },

    // Worldwide player ranking: total science points per player (science_awards), top 50 plus the caller's own place.
    async leaderboard({ user }) {
      const top = await rows(db, `SELECT u.username, sum(a.points)::float8 AS science FROM science_awards a
        JOIN users u ON u.id=a.user_id GROUP BY u.id, u.username ORDER BY science DESC, lower(u.username) LIMIT 50`);
      const science = await playerScience(db, user.id);
      const [r] = await rows(db, `SELECT count(*)::int + 1 AS n FROM (SELECT sum(points) AS s FROM science_awards GROUP BY user_id) t WHERE t.s > $1`, [science]);
      return { body: { players: top, me: { username: user.username, science, rank: science > 0 ? r.n : null } } };
    },

    // This week's goal, time left, the weekly ranking, the all-time ranking, my places, and the last closed week's podium.
    async challenge({ user }) {
      const week = weekOf(now()), goal = goalOf(week);
      await closeWeeks(week);
      await ensureWeek(db, week);
      const [me] = await rows(db, 'SELECT consortium_id AS cid FROM consortium_members WHERE user_id=$1', [user.id]);
      const ranking = await rows(db, `SELECT c.id, c.name, c.crest, c.level, s.points::float8 AS points FROM challenge_scores s
        JOIN consortia c ON c.id=s.consortium_id WHERE s.week=$1 AND s.points>0 ORDER BY s.points DESC, lower(c.name) LIMIT 20`, [week]);
      const allTime = await rows(db, `SELECT c.id, c.name, c.crest, c.level, c.science::float8 AS points, jsonb_array_length(c.trophies) AS trophies
        FROM consortia c WHERE c.science>0 ORDER BY c.science DESC, lower(c.name) LIMIT 20`);
      let mine = null;
      if (me) {
        const [w] = await rows(db, `SELECT coalesce((SELECT points FROM challenge_scores WHERE week=$1 AND consortium_id=$2),0)::float8 AS points`, [week, me.cid]);
        const [wr] = await rows(db, `SELECT count(*)::int + 1 AS n FROM challenge_scores WHERE week=$1 AND points>$2`, [week, w.points]);
        const [a] = await rows(db, `SELECT science::float8 AS points, jsonb_array_length(trophies) AS trophies, trophies AS list FROM consortia WHERE id=$1`, [me.cid]);
        const [ar] = await rows(db, `SELECT count(*)::int + 1 AS n FROM consortia WHERE science>$1`, [a.points]);
        mine = { id: me.cid, week: { points: w.points, rank: w.points > 0 ? wr.n : null }, allTime: { points: a.points, rank: ar.n }, trophies: a.list };
      }
      const [last] = await rows(db, `SELECT week::text AS week, results FROM consortium_challenges WHERE finalized_at IS NOT NULL ORDER BY week DESC LIMIT 1`);
      const endsAt = new Date(Date.parse(week + 'T00:00:00Z') + 7 * DAY).toISOString();
      return { body: { week, endsAt, goal, prizes: PRIZES, ranking, allTime, mine, last: last ? { week: last.week, podium: last.results || [] } : null } };
    }
  };

  // The level follows the all-time science points and never goes down; a new level is announced in the chat.
  async function levelUp(t, cid) {
    const [c] = await rows(t, 'SELECT science::float8 AS science, level FROM consortia WHERE id=$1', [cid]);
    const next = c ? levelOf(c.science) : 1;
    if (!c || next <= c.level) return;
    await t.query('UPDATE consortia SET level=$2 WHERE id=$1', [cid, next]);
    await system(t, cid, { code: 'level_up', level: next });
  }
  async function ensureWeek(c, week) {
    await c.query(`INSERT INTO consortium_challenges(week,goal) VALUES($1,$2::jsonb) ON CONFLICT (week) DO NOTHING`, [week, JSON.stringify(goalOf(week))]);
  }
  // Closes every past week still open: the podium gets trophies and bonus science, and each winner hears it in the chat.
  async function closeWeeks(current) {
    const open = await rows(db, `SELECT week::text AS week FROM consortium_challenges WHERE finalized_at IS NULL AND week < $1 ORDER BY week`, [current]);
    for (const { week } of open) {
      await tx(db, async t => {
        const [row] = await rows(t, `SELECT finalized_at FROM consortium_challenges WHERE week=$1 FOR UPDATE`, [week]);
        if (!row || row.finalized_at) return;
        const top = await rows(t, `SELECT s.consortium_id AS id, c.name, s.points::float8 AS points FROM challenge_scores s JOIN consortia c ON c.id=s.consortium_id
          WHERE s.week=$1 AND s.points>0 ORDER BY s.points DESC, lower(c.name) LIMIT ${PRIZES.length}`, [week]);
        const podium = top.map((x, i) => ({ place: i + 1, id: x.id, name: x.name, points: x.points, bonus: PRIZES[i] }));
        for (const p of podium) {
          await t.query(`UPDATE consortia SET science=science+$2, trophies=trophies || jsonb_build_array(jsonb_build_object('week',$3::text,'place',$4::int)) WHERE id=$1`,
            [p.id, p.bonus, week, p.place]);
          await system(t, p.id, { code: 'challenge_won', place: p.place, points: p.points, bonus: p.bonus, week });
          await levelUp(t, p.id);
        }
        await t.query(`UPDATE consortium_challenges SET results=$2::jsonb, finalized_at=now() WHERE week=$1`, [week, JSON.stringify(podium)]);
      });
    }
  }

  const UUID = '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';
  const routes = [
    ['GET', '', 'search'], ['POST', '', 'create'],
    ['GET', '/mine', 'mine'], ['PATCH', '/mine', 'settings'],
    ['POST', '/mine/invite-code', 'inviteCode'], ['POST', '/mine/preferences', 'preferences'],
    ['POST', '/mine/requests/(\\d{1,15})', 'decide'],
    ['POST', '/mine/members/([A-Za-z0-9_]{3,24})', 'member'],
    ['GET', '/mine/messages', 'messages'], ['POST', '/mine/messages', 'post'],
    ['DELETE', '/mine/messages/(\\d{1,15})', 'remove'], ['POST', '/mine/messages/(\\d{1,15})/report', 'report'],
    ['GET', '/mine/reports', 'reports'], ['POST', '/mine/reports/(\\d{1,15})', 'review'],
    ['GET', '/mine/unread', 'unread'], ['POST', '/mine/activity', 'activity'],
    ['POST', '/leave', 'leave'], ['POST', '/science', 'science'],
    ['PUT', '/live', 'live'], ['GET', '/live/([A-Za-z0-9_]{3,24})', 'watch'],
    ['GET', '/challenge', 'challenge'], ['GET', '/leaderboard', 'leaderboard'],
    ['GET', '/mine/joint', 'jointList'], ['POST', '/mine/joint', 'jointCreate'],
    ['GET', `/mine/joint/${UUID}`, 'jointGet'], ['POST', `/mine/joint/${UUID}/actions`, 'jointAct'],
    ['GET', `/${UUID}`, 'profile'], ['POST', `/${UUID}/join`, 'join']
  ].map(([method, path, name]) => ({ method, pattern: new RegExp(`^${path}$`), run: handlers[name] }));

  return async (req, res, pathname) => {
    try {
      const sub = pathname.slice('/api/consortia'.length).replace(/\/$/, '');
      const matching = routes.filter(r => r.pattern.test(sub));
      if (!matching.length) return send(res, 404, { error: 'not_found' });
      const route = matching.find(r => r.method === req.method);
      if (!route) return send(res, 405, { error: 'method_not_allowed' });
      const writes = req.method !== 'GET';
      // Exact Origin + JSON body, as for the login API, block cross-site requests.
      if (writes && !origins.includes(req.headers.origin)) return send(res, 403, { error: 'origin' });
      const user = await sessionUser(db, req);
      if (!user) return send(res, 401, { error: 'login_required' });
      let body = {};
      if (req.method === 'POST' || req.method === 'PATCH' || req.method === 'PUT') {
        if (req.headers['content-type']?.split(';')[0] !== 'application/json') return send(res, 415, { error: 'json_required' });
        body = await readJson(req, sub === '/live' ? LIMITS.liveBody : 4096);
      }
      const query = new URL(req.url ?? '/', 'http://localhost').searchParams;
      const out = await route.run({ user, body, query, params: sub.match(route.pattern).slice(1) });
      return send(res, out.status || 200, out.body);
    } catch (error) {
      if (error instanceof Fail) return send(res, error.status, { error: error.code, ...error.extra });
      // Never log request bodies, chat text or SQL parameters.
      console.error('Consortia request failed', error.code || error.name);
      return send(res, 503, { error: 'unavailable' });
    }
  };
}
