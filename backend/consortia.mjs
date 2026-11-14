// Consortia (clans) API under /api/consortia. Every route needs a signed-in player (auth session cookie).
// A player belongs to at most one consortium, so member routes live under /mine and never take an id.
// Users appear only by username; internal user ids never leave the server. Errors are short codes
// (e.g. { error: 'full' }) that the game translates. Text is stored and returned as plain text only.
import { randomBytes, randomUUID, createHash } from 'node:crypto';
import { sessionUser } from './auth.mjs';

export const ROLES = ['member', 'chief_engineer', 'vice', 'director']; // index = rank
export const STICKERS = ['zorty_happy', 'zorty_cry', 'zorty_angry', 'zorty_laugh'];
export const CREST = {
  shapes: ['shield', 'circle', 'hexagon', 'star', 'diamond'],
  symbols: ['rocket', 'satellite', 'planet', 'moon', 'star', 'comet', 'telescope', 'orbit']
};
export const LIMITS = { members: 20, text: 300, motto: 60, request: 140, missionScience: 1000, page: 50, inactiveDays: 14 };
// System message codes (data.code): founded, joined, left, kicked, promoted, demoted, new_director,
// settings, science, launch, success, failure. The game turns them into translated sentences.

const rank = role => ROLES.indexOf(role);
const hash = value => createHash('sha256').update(value).digest('hex');
const NAME = /^[\p{L}\p{N}][\p{L}\p{N} _.'-]{1,22}[\p{L}\p{N}]$/u;
const LINK = /(https?:\/\/|www\.|\b[\p{L}\p{N}-]+\.(com|net|org|it|io|ly|gg|xyz|me|co|app|link|info|tv|ru|cn)\b)/iu;
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
  c.max_members, (SELECT count(*)::int FROM consortium_members x WHERE x.consortium_id = c.id) AS members`;
const summary = r => ({ id: r.id, name: r.name, crest: r.crest, motto: r.motto, kind: r.kind, level: r.level,
  science: r.science, minScience: r.min_science, maxMembers: r.max_members, members: r.members });
const message = r => r.deleted
  ? { id: r.id, kind: r.kind, author: r.author, at: r.created_at, deleted: true }
  : { id: r.id, kind: r.kind, author: r.author, role: r.author_role, at: r.created_at,
    ...(r.kind === 'text' ? { text: r.body } : r.kind === 'sticker' ? { sticker: r.body } : { data: r.data }) };
const MESSAGE_COLUMNS = `m.id::float8 AS id, m.kind, m.body, m.data, m.created_at, m.deleted_at IS NOT NULL AS deleted,
  u.username AS author, cm.role AS author_role FROM consortium_messages m LEFT JOIN users u ON u.id = m.author_id
  LEFT JOIN consortium_members cm ON cm.user_id = m.author_id AND cm.consortium_id = m.consortium_id`;

export function createConsortia({ db, origin }) {
  if (!origin || new URL(origin).origin !== origin) throw new Error('APP_ORIGIN must be an exact origin');

  function send(res, status, body) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
    res.end(JSON.stringify(body));
  }
  async function readJson(req) {
    const chunks = []; let bytes = 0;
    for await (const chunk of req) {
      bytes += chunk.length;
      if (bytes > 4096) throw new Fail(413, 'too_large');
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
    async search({ query }) {
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
        ORDER BY ${text ? 'lower(c.name)' : 'members DESC, science DESC, c.created_at'} LIMIT 20`, args);
      return { body: { consortia: list.map(summary) } };
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
      return { body: {
        consortium: { ...summary(c), schoolMode: c.school_mode, ...(lead ? { inviteCode: c.invite_code } : {}) },
        me: { username: mine.username, role: mine.role, science: mine.science, spectate: mine.spectate },
        members, requests, unread, player: { science }
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
      return { body: { spectate: body.spectate } };
    },

    async join({ user, body, params: [id] }) {
      if (body.code !== undefined && typeof body.code !== 'string') throw bad('code');
      if (body.message !== undefined && typeof body.message !== 'string') throw bad('message');
      const code = (body.code || '').trim().toUpperCase();
      const note = clean(body.message || '');
      if (note.length > LIMITS.request || LINK.test(note)) throw bad('message');
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
      return { body: { member: true, unread: n } };
    },

    async post({ user, body }) {
      let kind = body.kind, text = '', data = null;
      if (kind === 'text') {
        if (typeof body.text !== 'string') throw bad('text');
        text = clean(body.text);
        if (!text || text.length > LIMITS.text) throw bad('text');
        if (LINK.test(text)) throw new Fail(400, 'link');
      } else if (kind === 'sticker') {
        if (!STICKERS.includes(body.sticker)) throw bad('sticker');
        text = body.sticker;
      } else if (kind === 'mission') {
        data = missionCard(body.mission);
      } else throw bad('kind');
      const saved = await tx(db, async t => {
        // Locking the player's own row serialises their messages, so the 2-second limit holds.
        const [me] = await rows(t, `SELECT m.consortium_id AS cid, m.role, c.school_mode FROM consortium_members m
          JOIN consortia c ON c.id=m.consortium_id WHERE m.user_id=$1 FOR UPDATE OF m`, [user.id]);
        if (!me) throw new Fail(404, 'no_consortium');
        if (kind === 'text' && me.school_mode) throw new Fail(403, 'school_mode');
        const recent = await rows(t, `SELECT 1 FROM consortium_messages WHERE author_id=$1
          AND created_at > now() - interval '2 seconds' LIMIT 1`, [user.id]);
        if (recent.length) throw new Fail(429, 'slow_down');
        await t.query('UPDATE consortium_members SET last_seen_at=now() WHERE user_id=$1', [user.id]);
        const [m] = await rows(t, `INSERT INTO consortium_messages(consortium_id,author_id,kind,body,data)
          VALUES($1,$2,$3,$4,$5::jsonb) RETURNING id::float8 AS id, kind, body, data, created_at, false AS deleted`,
        [me.cid, user.id, kind, text, data && JSON.stringify(data)]);
        return message({ ...m, author: user.username, author_role: me.role });
      });
      return { status: 201, body: { message: saved } };
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
      const me = await touch(user.id);
      await limit(`activity:${user.id}`, 30);
      await system(db, me.cid, { code: body.type, user: user.username, mission });
      return { status: 201, body: { posted: true } };
    },

    // Science points of a finished mission: counted once per (player, mission), for the player and their consortium.
    async science({ user, body }) {
      if (typeof body.mission !== 'string' || !/^[A-Za-z0-9_.:-]{1,64}$/.test(body.mission)) throw bad('mission');
      if (!int(body.points, 0, LIMITS.missionScience)) throw bad('points');
      if (body.name !== undefined && typeof body.name !== 'string') throw bad('name');
      const name = clean(body.name || '').slice(0, 24);
      await limit(`science:${user.id}`, 60);
      return tx(db, async t => {
        const [me] = await rows(t, 'SELECT consortium_id AS cid FROM consortium_members WHERE user_id=$1 FOR UPDATE', [user.id]);
        const added = await rows(t, `INSERT INTO science_awards(user_id,mission_key,points,consortium_id) VALUES($1,$2,$3,$4)
          ON CONFLICT DO NOTHING RETURNING 1`, [user.id, body.mission, body.points, me?.cid ?? null]);
        if (added.length && me && body.points > 0) {
          await t.query('UPDATE consortium_members SET science=science+$2, last_seen_at=now() WHERE user_id=$1', [user.id, body.points]);
          await t.query('UPDATE consortia SET science=science+$2 WHERE id=$1', [me.cid, body.points]);
          await system(t, me.cid, { code: 'science', user: user.username, mission: name, points: body.points });
        }
        const consortium = me ? (await rows(t, 'SELECT science::float8 AS science FROM consortia WHERE id=$1', [me.cid]))[0] : null;
        return { body: { counted: added.length > 0, player: { science: await playerScience(t, user.id) }, consortium } };
      });
    }
  };

  const UUID = '([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})';
  const routes = [
    ['GET', '', 'search'], ['POST', '', 'create'],
    ['GET', '/mine', 'mine'], ['PATCH', '/mine', 'settings'],
    ['POST', '/mine/invite-code', 'inviteCode'], ['POST', '/mine/preferences', 'preferences'],
    ['POST', '/mine/requests/(\\d{1,15})', 'decide'],
    ['POST', '/mine/members/([A-Za-z0-9_]{3,24})', 'member'],
    ['GET', '/mine/messages', 'messages'], ['POST', '/mine/messages', 'post'],
    ['DELETE', '/mine/messages/(\\d{1,15})', 'remove'],
    ['GET', '/mine/unread', 'unread'], ['POST', '/mine/activity', 'activity'],
    ['POST', '/leave', 'leave'], ['POST', '/science', 'science'],
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
      if (writes && req.headers.origin !== origin) return send(res, 403, { error: 'origin' });
      const user = await sessionUser(db, req);
      if (!user) return send(res, 401, { error: 'login_required' });
      let body = {};
      if (req.method === 'POST' || req.method === 'PATCH') {
        if (req.headers['content-type']?.split(';')[0] !== 'application/json') return send(res, 415, { error: 'json_required' });
        body = await readJson(req);
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
