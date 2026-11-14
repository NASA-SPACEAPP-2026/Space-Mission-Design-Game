import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createAuth } from '../backend/auth.mjs';
import { createConsortia } from '../backend/consortia.mjs';
import { createStaticServer } from '../server.mjs';
import { migrate } from '../backend/database.mjs';

const ORIGIN = 'https://game.example';
const crest = { shape: 'shield', color: '#3F8E8A', symbol: 'rocket' };

describe('Consortia API', () => {
  let pg, db, server, base;
  const cookies = {};
  async function api(who, method, path, body, { origin = ORIGIN, type = 'application/json' } = {}) {
    const response = await fetch(`${base}/api/consortia${path}`, { method,
      headers: { Origin: origin, ...(type ? { 'Content-Type': type } : {}), ...(who ? { Cookie: cookies[who] } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body) });
    return { status: response.status, body: await response.json() };
  }
  const get = (who, path) => api(who, 'GET', path);
  const post = (who, path, body = {}) => api(who, 'POST', path, body);
  // The chat allows one message every 2 seconds: move earlier messages back in time instead of waiting.
  const cool = () => db.query(`UPDATE consortium_messages SET created_at = created_at - interval '5 seconds'`);
  const systemCodes = async who => (await get(who, '/mine/messages')).body.messages.filter(m => m.kind === 'system').map(m => m.data.code);

  beforeAll(async () => {
    pg = new PGlite(); await pg.waitReady;
    await migrate({ query: sql => pg.exec(sql) });
    let queue = Promise.resolve();
    const run = job => { const next = queue.then(job); queue = next.catch(() => {}); return next; };
    db = {
      query: (sql, args) => run(() => pg.query(sql, args)),
      tx: fn => run(() => pg.transaction(t => fn({ query: (sql, args) => t.query(sql, args) })))
    };
    server = createStaticServer({ auth: createAuth({ db, origin: ORIGIN, secure: true }), consortia: createConsortia({ db, origin: ORIGIN }) });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    for (const name of ['Ada', 'Bob', 'Cyd', 'Dan', 'Eve', 'Fay']) {
      const response = await fetch(`${base}/api/auth/register`, { method: 'POST',
        headers: { Origin: ORIGIN, 'Content-Type': 'application/json' }, body: JSON.stringify({ username: name, password: 'secret' }) });
      expect(response.status).toBe(201);
      cookies[name] = response.headers.get('set-cookie').split(';')[0];
    }
  }, 60000);
  afterAll(async () => { await new Promise(resolve => server.close(resolve)); await pg.close(); });

  it('requires login, same origin and JSON', async () => {
    expect((await get(null, '')).status).toBe(401);
    expect((await api('Ada', 'POST', '', { name: 'Nope' }, { origin: 'https://evil.example' })).status).toBe(403);
    expect((await api('Ada', 'POST', '', { name: 'Nope' }, { type: 'text/plain' })).status).toBe(415);
    expect((await get('Ada', '/nothing/here')).status).toBe(404);
    expect((await api('Ada', 'DELETE', '/mine')).status).toBe(405);
    expect((await get('Ada', '/mine')).body).toEqual({ consortium: null, player: { science: 0 } });
    expect((await get('Ada', '/mine/messages')).body.error).toBe('no_consortium');
  });

  it('creates a consortium with validated settings, one per player, unique names', async () => {
    expect((await post('Ada', '', { name: 'x', crest })).body).toEqual({ error: 'invalid', field: 'name' });
    expect((await post('Ada', '', { name: 'Orbiters', crest: { ...crest, shape: 'skull' } })).body.field).toBe('crest');
    expect((await post('Ada', '', { name: 'Orbiters', crest, motto: 'see www.evil.com' })).body.field).toBe('motto');
    const created = await post('Ada', '', { name: '  Orbiters  ', crest, motto: 'Ad astra' });
    expect(created.status).toBe(201);
    expect(created.body.consortium).toMatchObject({ name: 'Orbiters', kind: 'open', members: 1, maxMembers: 20, minScience: 0, level: 1 });
    expect(created.body.consortium.crest.color).toBe('#3f8e8a');
    expect((await post('Ada', '', { name: 'Second', crest })).body.error).toBe('already_member');
    expect((await post('Eve', '', { name: 'ORBITERS', crest })).body.error).toBe('name_taken');
    const mine = (await get('Ada', '/mine')).body;
    expect(mine.me.role).toBe('director');
    expect(mine.consortium.inviteCode).toMatch(/^[A-Z2-9]{8}$/);
    expect(mine.members).toEqual([expect.objectContaining({ username: 'Ada', role: 'director', status: 'online' })]);
    expect(JSON.stringify(mine)).not.toMatch(/user_?id|password|email/i);
    expect(await systemCodes('Ada')).toEqual(['founded']);
  });

  it('searches by name and recommends open consortia with free places', async () => {
    expect((await post('Eve', '', { name: 'Hidden Orbit', crest, kind: 'invite' })).status).toBe(201);
    const recommended = (await get('Dan', '')).body.consortia.map(c => c.name);
    expect(recommended).toContain('Orbiters');
    expect(recommended).not.toContain('Hidden Orbit');
    expect((await get('Dan', '?q=hidden')).body.consortia.map(c => c.name)).toEqual(['Hidden Orbit']);
    expect((await get('Dan', '?q=%25')).body.consortia).toEqual([]);
    expect((await get('Dan', '?q=orbit&maxMin=0&free=1')).body.consortia).toHaveLength(2);
    expect((await get('Dan', '?maxMin=abc')).status).toBe(400);
    const id = (await get('Dan', '?q=orbiters')).body.consortia[0].id;
    const profile = (await get('Dan', `/${id}`)).body;
    expect(profile.members).toEqual([{ username: 'Ada', role: 'director', science: 0 }]);
    expect((await get('Dan', '/00000000-0000-4000-8000-000000000000')).status).toBe(404);
  });

  it('joins open, by request, by invite code, and enforces minimum science and size', async () => {
    const id = (await get('Bob', '?q=orbiters')).body.consortia[0].id;
    const hidden = (await get('Dan', '?q=hidden')).body.consortia[0].id;
    expect((await post('Bob', `/${id}/join`)).body).toEqual({ joined: true });
    expect((await post('Bob', `/${id}/join`)).body.error).toBe('already_member');
    expect((await post('Ada', '/mine/members/Bob', { action: 'promote' })).body.member.role).toBe('chief_engineer');
    expect((await post('Ada', '/mine/members/bob', { action: 'promote' })).body.member.role).toBe('vice');

    expect((await api('Bob', 'PATCH', '/mine', { kind: 'request' })).body.consortium.kind).toBe('request');
    const asked = await post('Cyd', `/${id}/join`, { message: 'Ciao!' });
    expect(asked.status).toBe(202);
    const requests = (await get('Ada', '/mine')).body.requests;
    expect(requests).toEqual([expect.objectContaining({ username: 'Cyd', message: 'Ciao!', science: 0 })]);
    expect((await get('Cyd', '/mine')).body.consortium).toBeNull();
    expect((await post('Bob', `/mine/requests/${requests[0].id}`, { accept: true })).body).toEqual({ accepted: true });
    expect((await get('Cyd', '/mine')).body.me.role).toBe('member');
    expect((await get('Cyd', '/mine')).body.consortium.inviteCode).toBeUndefined();

    expect((await post('Dan', `/${hidden}/join`)).body.error).toBe('invite_only');
    expect((await post('Dan', `/${hidden}/join`, { code: 'WRONG123' })).body.error).toBe('wrong_code');
    const code = (await get('Eve', '/mine')).body.consortium.inviteCode;
    expect((await post('Dan', `/${hidden}/join`, { code: code.toLowerCase() })).body).toEqual({ joined: true });
    const fresh = (await post('Eve', '/mine/invite-code')).body.inviteCode;
    expect(fresh).not.toBe(code);

    expect((await api('Ada', 'PATCH', '/mine', { kind: 'open', minScience: 50 })).status).toBe(200);
    expect((await post('Fay', `/${id}/join`)).body).toEqual({ error: 'not_enough_science', required: 50, science: 0 });
    expect((await post('Fay', '/science', { mission: 'fay-1', points: 60 })).body).toEqual({ counted: true, player: { science: 60 }, consortium: null });
    expect((await post('Fay', `/${id}/join`)).body).toEqual({ joined: true });

    expect((await api('Ada', 'PATCH', '/mine', { maxMembers: 2 })).body.error).toBe('too_many_members');
    expect((await api('Ada', 'PATCH', '/mine', { maxMembers: 4, minScience: 0 })).body.consortium.maxMembers).toBe(4);
    expect((await post('Eve', '/leave')).body).toEqual({ left: true, disbanded: false });
    expect((await post('Eve', `/${id}/join`)).body.error).toBe('full');
    expect((await api('Cyd', 'PATCH', '/mine', { motto: 'Hi' })).status).toBe(403);
    expect(await systemCodes('Ada')).toEqual(['founded', 'joined', 'promoted', 'promoted', 'settings', 'joined', 'settings', 'joined', 'settings']);
  });

  it('lets each role do only what it may', async () => {
    expect((await post('Cyd', '/mine/members/Fay', { action: 'kick' })).status).toBe(403);
    expect((await post('Cyd', '/mine/members/Fay', { action: 'promote' })).status).toBe(403);
    expect((await post('Bob', '/mine/members/Ada', { action: 'kick' })).status).toBe(403);
    expect((await post('Bob', '/mine/members/Ada', { action: 'demote' })).status).toBe(403);
    expect((await post('Bob', '/mine/members/Ada', { action: 'transfer' })).status).toBe(403);
    expect((await post('Bob', '/mine/members/Cyd', { action: 'promote' })).body.member.role).toBe('chief_engineer');
    expect((await post('Bob', '/mine/members/Cyd', { action: 'promote' })).status).toBe(403);
    expect((await post('Ada', '/mine/members/Ada', { action: 'demote' })).body.error).toBe('self');
    expect((await post('Ada', '/mine/members/Dan', { action: 'kick' })).body.error).toBe('member_not_found');
    expect((await post('Ada', '/mine/members/Bob', { action: 'explode' })).body.field).toBe('action');
    expect((await post('Bob', '/mine/members/Fay', { action: 'kick' })).body).toEqual({ kicked: true });
    expect((await get('Fay', '/mine')).body.consortium).toBeNull();
    expect((await post('Ada', '/mine/members/Bob', { action: 'transfer' })).body.member.role).toBe('director');
    const roles = Object.fromEntries((await get('Ada', '/mine')).body.members.map(m => [m.username, m.role]));
    expect(roles).toEqual({ Bob: 'director', Ada: 'vice', Cyd: 'chief_engineer' });
  });

  it('runs the chat: plain text, stickers, mission cards, limits, unread and deletion', async () => {
    await get('Cyd', '/mine/messages');
    await cool();
    const hello = await post('Ada', '/mine/messages', { kind: 'text', text: '  Ciao <b>team</b>\n' });
    expect(hello.status).toBe(201);
    expect(hello.body.message).toMatchObject({ kind: 'text', text: 'Ciao <b>team</b>', author: 'Ada', role: 'vice' });
    expect((await post('Ada', '/mine/messages', { kind: 'sticker', sticker: 'zorty_happy' })).body.error).toBe('slow_down');
    await cool();
    expect((await post('Ada', '/mine/messages', { kind: 'text', text: 'x'.repeat(301) })).body.field).toBe('text');
    expect((await post('Ada', '/mine/messages', { kind: 'text', text: 'go to https://evil.example' })).body.error).toBe('link');
    expect((await post('Ada', '/mine/messages', { kind: 'sticker', sticker: 'zorty_evil' })).body.field).toBe('sticker');
    expect((await post('Ada', '/mine/messages', { kind: 'sticker', sticker: 'zorty_happy' })).body.message.sticker).toBe('zorty_happy');
    await cool();
    const card = await post('Ada', '/mine/messages', { kind: 'mission', mission: { name: 'AURASAT', type: 'obs', dest: 'Marte', sci: 120, months: 9, ok: true, script: '<x>' } });
    expect(card.body.message.data).toEqual({ name: 'AURASAT', type: 'obs', dest: 'Marte', sci: 120, months: 9, ok: true });

    expect((await get('Cyd', '/mine/unread')).body).toEqual({ member: true, unread: 3 });
    const feed = (await get('Cyd', '/mine/messages')).body;
    expect(feed.messages.at(-1).id).toBe(feed.lastId);
    expect((await get('Cyd', '/mine/unread')).body.unread).toBe(0);
    expect((await get('Cyd', `/mine/messages?after=${feed.lastId}`)).body.messages).toEqual([]);
    expect((await get('Cyd', '/mine/messages?after=-1')).status).toBe(400);
    expect((await get('Fay', '/mine/unread')).body).toEqual({ member: false, unread: 0 });

    const id = hello.body.message.id;
    expect((await api('Cyd', 'DELETE', `/mine/messages/${id}`)).status).toBe(403);
    expect((await api('Dan', 'DELETE', `/mine/messages/${id}`)).status).toBe(404);
    expect((await api('Ada', 'DELETE', `/mine/messages/${id}`)).body).toEqual({ deleted: true });
    const deleted = (await get('Cyd', `/mine/messages?after=${id - 1}`)).body.messages[0];
    expect(deleted).toEqual({ id, kind: 'text', author: 'Ada', at: expect.any(String), deleted: true });
    expect((await get('Dan', `/mine/messages`)).body.messages.some(m => m.author === 'Ada')).toBe(false);

    expect((await api('Bob', 'PATCH', '/mine', { schoolMode: true })).body.consortium.schoolMode).toBe(true);
    await cool();
    expect((await post('Cyd', '/mine/messages', { kind: 'text', text: 'ciao' })).body.error).toBe('school_mode');
    expect((await post('Cyd', '/mine/messages', { kind: 'sticker', sticker: 'zorty_laugh' })).status).toBe(201);
    await api('Bob', 'PATCH', '/mine', { schoolMode: false });
    expect((await post('Cyd', '/mine/activity', { type: 'launch', mission: 'AURASAT' })).status).toBe(201);
    expect((await post('Cyd', '/mine/preferences', { spectate: false })).body).toEqual({ spectate: false });
    expect((await get('Cyd', '/mine')).body.me.spectate).toBe(false);
  });

  it('counts mission science once, for the player and the consortium', async () => {
    const first = await post('Cyd', '/science', { mission: 'm-1', points: 120, name: 'AURASAT' });
    expect(first.body).toEqual({ counted: true, player: { science: 120 }, consortium: { science: 120 } });
    expect((await post('Cyd', '/science', { mission: 'm-1', points: 999 })).body).toEqual({ counted: false, player: { science: 120 }, consortium: { science: 120 } });
    expect((await post('Cyd', '/science', { mission: 'm-2', points: 1001 })).body.field).toBe('points');
    expect((await post('Cyd', '/science', { mission: 'bad key!', points: 1 })).body.field).toBe('mission');
    expect((await post('Cyd', '/science', { mission: 'm-3', points: 1.5 })).body.field).toBe('points');
    const mine = (await get('Cyd', '/mine')).body;
    expect(mine.me.science).toBe(120);
    expect(mine.consortium.science).toBe(120);
    const last = (await get('Cyd', '/mine/messages')).body.messages.at(-1);
    expect(last.data).toEqual({ code: 'science', user: 'Cyd', mission: 'AURASAT', points: 120 });
  });

  it('hands over leadership when the director leaves or is inactive, and disbands when empty', async () => {
    expect((await post('Bob', '/leave')).body).toEqual({ left: true, disbanded: false });
    expect((await get('Ada', '/mine')).body.me.role).toBe('director');
    expect((await post('Bob', '/leave')).body.error).toBe('no_consortium');

    await db.query(`UPDATE consortium_members SET last_seen_at = now() - interval '15 days'
      WHERE user_id = (SELECT id FROM users WHERE username = 'Ada')`);
    const roles = Object.fromEntries((await get('Cyd', '/mine')).body.members.map(m => [m.username, m.role]));
    expect(roles).toEqual({ Cyd: 'director', Ada: 'vice' });
    const last = (await get('Cyd', '/mine/messages')).body.messages.at(-1);
    expect(last.data).toEqual({ code: 'new_director', user: 'Cyd', reason: 'inactive' });

    const id = (await get('Cyd', '/mine')).body.consortium.id;
    expect((await post('Ada', '/leave')).body.disbanded).toBe(false);
    expect((await post('Cyd', '/leave')).body).toEqual({ left: true, disbanded: true });
    expect((await get('Cyd', `/${id}`)).status).toBe(404);
    expect((await db.query('SELECT count(*)::int AS n FROM consortium_messages WHERE consortium_id=$1', [id])).rows[0].n).toBe(0);
    expect((await db.query('SELECT count(*)::int AS n FROM science_awards')).rows[0].n).toBe(2);
  });

  it('upgrades an existing accounts database and can run twice', async () => {
    const old = new PGlite(); await old.waitReady;
    try {
      await old.exec(await readFile(new URL('../db/001-auth.sql', import.meta.url), 'utf8'));
      await old.exec(await readFile(new URL('../db/002-username-accounts.sql', import.meta.url), 'utf8'));
      await old.query('INSERT INTO users(id,username,password_hash) VALUES($1,$2,$3)', ['00000000-0000-4000-8000-000000000001', 'Existing', 'kept']);
      const adapter = { query: sql => old.exec(sql) };
      await migrate(adapter); await migrate(adapter);
      expect((await old.query('SELECT username,password_hash FROM users')).rows).toEqual([{ username: 'Existing', password_hash: 'kept' }]);
      const tables = (await old.query(`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`)).rows.map(r => r.table_name);
      expect(tables).toEqual(expect.arrayContaining(['consortia', 'consortium_members', 'consortium_requests', 'consortium_messages',
        'message_reports', 'science_awards', 'live_sessions', 'joint_missions', 'consortium_challenges', 'challenge_scores']));
    } finally { await old.close(); }
  }, 15000);
});
