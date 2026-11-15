import { readFile } from 'node:fs/promises';
import { createContext, runInContext } from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

// Loads public/game/09-consortia.js without a browser: the module only touches the DOM when the panel opens.
// withData: also loads the game data (01-data.js, the E object) that the joint mission uses for mass, power and cost.
async function loadModule(search, withData) {
  const source = await readFile(new URL('../public/game/09-consortia.js', import.meta.url), 'utf8');
  const data = withData ? await readFile(new URL('../public/game/01-data.js', import.meta.url), 'utf8') : '';
  const store = new Map();
  const context = {
    window: {}, location: { search }, URLSearchParams, console, setTimeout, clearTimeout, setInterval, clearInterval,
    CompressionStream, DecompressionStream, Response, Blob, TextEncoder, TextDecoder, btoa, atob,
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) }
  };
  createContext(context);
  if (data) runInContext(data, context);
  runInContext(source, context);
  return context.window.GNGCLAN;
}

describe('consortium panel module', () => {
  let C;
  beforeAll(async () => { C = await loadModule('?clan=demo'); });

  it('draws crests only from the allowed shapes, symbols and colours', () => {
    const svg = C.crestSVG({ shape: '<script>', color: 'red" onload="x', symbol: 'nope' }, 40);
    expect(svg).not.toMatch(/<script|onload/);
    expect(svg).toContain('fill="#66777f"');
    expect(C.crestSVG({ shape: 'star', color: '#1E9E5A', symbol: 'moon' })).toContain('#1E9E5A');
  });

  it('offers exactly the stickers the server accepts, and never echoes unknown codes', async () => {
    const { STICKERS } = await import('../backend/consortia.mjs');
    expect(C.stickers()).toEqual(STICKERS);
    expect(C.stickerHTML('zorty_cry', 84)).toContain('clz-zorty_cry');
    expect(C.stickerHTML('zorty_cry', 84)).toContain('aria-label="Zorty che piange"');
    const unknown = C.stickerHTML('<img onerror=x>', 84);
    expect(unknown).not.toContain('onerror');
    expect(unknown).not.toContain('clz-');
  });

  it('turns system message codes into sentences', () => {
    const { sysText, errText } = C._test;
    expect(sysText({ code: 'joined', user: 'Ada' })).toBe('Ada è entrato nel consorzio');
    expect(sysText({ code: 'science', user: 'Ada', mission: 'AURASAT', points: 120 })).toBe('Ada ha chiuso AURASAT: +120 punti scienza');
    expect(sysText({ code: 'new_director', user: 'Bob', reason: 'inactive' })).toContain('14 giorni');
    expect(sysText({ code: 'unknown' })).toBe('');
    expect(errText({ data: { error: 'not_enough_science', required: 50, science: 10 } })).toBe('Servono 50 punti scienza (ne hai 10).');
    expect(errText({ data: { error: 'something-new' } })).toBe('Servizio consorzi non disponibile.');
  });

  it('compresses the spectate game state and restores it exactly', async () => {
    const { pack, unpack } = C._test;
    const game = { co: 'Agenzia Città', missions: Array.from({ length: 30 }, (_, i) => ({ id: 'm' + i, name: 'AURASAT ' + i, log: 'Tempesta solare ☀️ '.repeat(20) })), world: { items: [] } };
    const json = JSON.stringify(game), packed = await pack(json);
    expect(packed.enc).toBe('gz');
    expect(packed.data).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);
    expect(packed.data.length).toBeLessThan(json.length / 4);
    expect(JSON.parse(await unpack(packed))).toEqual(game);
    expect(JSON.parse(await unpack({ enc: 'raw', data: Buffer.from(json).toString('base64') }))).toEqual(game);
  });

  it('checks a joint design with the game rules and turns over-budget choices into requests', async () => {
    const G = await loadModule('', true);
    const { jNeedReq, jChecks, jOptions, jCounter } = G._test;
    const design = { dest: 'leo', budget: 1600, ride: 'S3', sol: 'BASE-SOL3D', avi: 'BASE-OBC', adcs: 'BASE-MAG', bat: 'BASE-BAT20', com: 'BASE-UHF', ray: 'BASE-DOSE' };
    const s = { roles: { plan: 'Ada', sat: 'Bob', sci: 'Cyd', com: 'Ada' }, design };
    expect(jOptions('ray', design).map(o => o.v)).toContain('BASE-CAM');
    expect(jOptions('sol', { ride: 'S6' }).every(o => !/3[BD]$/.test(o.v))).toBe(true);
    const review = jChecks(design);
    expect(review.ok).toBe(true);
    expect(review.list[0].t).toContain('Rideshare');
    expect(jChecks({ ...design, dest: 'mars' }).list[0].ok).toBe(false); // no launch for a 3U to Mars
    // Within budget: no request. Over budget: a request to Planning, with an amount.
    expect(jNeedReq(s, 'ray', 'BASE-CAM', 'Cyd')).toBeNull();
    const tight = { ...s, design: { ...design, budget: 290 } }; // 288 cr with the dosimeter, 300 with the camera
    const req = jNeedReq(tight, 'ray', 'BASE-CAM', 'Cyd');
    expect(req).toMatchObject({ to: 'plan', kind: 'cost' });
    expect(req.delta).toBeGreaterThan(0);
    // Whoever owns the budget pays for their own choices without asking.
    expect(jNeedReq(tight, 'com', 'BASE-UHF2', 'Ada')).toBeNull();
    // Counter-offers stay within the limit.
    const counters = jCounter({ ...tight, design: { ...design, budget: 1000 }, request: { key: 'ray', value: 'BASE-CAM', kind: 'cost' } });
    expect(counters.every(o => o.v !== 'BASE-CAM')).toBe(true);
  });

  it('runs the weekly challenge in the offline demo', async () => {
    const api = (await loadModule('?clan=demo'))._test.demo.call;
    const before = (await api('GET', '/challenge')).data;
    expect(before.mine).toBeNull();
    expect(before.ranking.map(r => r.name)).toEqual(['Kuiper Crew', 'Orbita Milano']);
    expect(Date.parse(before.endsAt) - Date.parse(before.week + 'T00:00:00Z')).toBe(7 * 86400000);
    await api('POST', '/demo-milano/join', {});
    const g = before.goal, facts = { ok: true, dest: g.dest || 'leo', type: g.type || 'sci', cost: g.maxCost ? g.maxCost - 1 : 100, months: g.minMonths || 12 };
    expect((await api('POST', '/science', { mission: 'x1', points: 50, facts: { ...facts, ok: false } })).data.challenge).toBeUndefined();
    expect((await api('POST', '/science', { mission: 'x2', points: 80, facts })).data.challenge).toMatchObject({ matched: true, points: 80 });
    const after = (await api('GET', '/challenge')).data;
    expect(after.ranking.map(r => [r.name, r.points])).toEqual([['Orbita Milano', 220], ['Kuiper Crew', 210]]);
    expect(after.mine.week).toEqual({ points: 220, rank: 1 });
    expect(after.allTime.find(r => r.name === 'Kuiper Crew').trophies).toBe(2);
  });

  it('runs a joint mission in the offline demo with the same rules as the server', async () => {
    const api = (await loadModule('?clan=demo'))._test.demo.call;
    await api('POST', '/demo-milano/join', {});
    const made = (await api('POST', '/mine/joint', { name: 'Luna Ice' })).data;
    let v = made.version;
    const act = async body => { const r = await api('POST', `/mine/joint/${made.id}/actions`, { v, ...body }); if (r.status === 200) v = r.data.version; return r; };
    expect((await api('GET', '/mine/joint')).data.joint[0]).toMatchObject({ name: 'Luna Ice', phase: 'lobby', roles: { plan: 'Matteo' } });
    expect((await act({ type: 'start' })).data.error).toBe('need_two');
    expect((await api('POST', `/mine/joint/${made.id}/actions`, { v: v + 5, type: 'start' })).data.error).toBe('stale');
    expect((await act({ type: 'set', key: 'dest', value: 'moon' })).data.error).toBe('not_design');
    expect((await api('GET', `/mine/joint/${made.id}?v=${v}`)).data).toEqual({ same: true, version: v });
    expect((await api('GET', '/mine/messages')).data.messages.at(-1).data).toMatchObject({ code: 'joint_new', mission: 'Luna Ice', id: made.id });
  });

  it('runs the offline demo from search to chat to leaving', async () => {
    const api = C._test.demo.call;
    const recommended = (await api('GET', '')).data.consortia.map(c => c.name);
    expect(recommended).toEqual(['Orbita Milano', 'Kuiper Crew']);
    expect((await api('GET', '/mine')).data.consortium).toBeNull();
    expect((await api('POST', '/demo-torino/join', {})).data.error).toBe('invite_only');
    expect((await api('POST', '/demo-kuiper/join', {})).status).toBe(202);
    expect((await api('POST', '/demo-milano/join', {})).data).toEqual({ joined: true });
    const mine = (await api('GET', '/mine')).data;
    expect(mine.consortium.name).toBe('Orbita Milano');
    expect(mine.members).toHaveLength(6);
    expect(mine.me.role).toBe('member');
    const feed = (await api('GET', '/mine/messages')).data;
    expect(feed.messages.at(-1).data).toEqual({ code: 'joined', user: 'Matteo' });
    expect((await api('POST', '/mine/messages', { kind: 'text', text: 'see www.evil.com' })).data.error).toBe('link');
    expect((await api('POST', '/mine/messages', { kind: 'text', text: 'Ciao!' })).status).toBe(201);
    expect((await api('POST', '/science', { mission: 'm1', points: 90, name: 'AURASAT' })).data).toMatchObject({ counted: true, player: { science: 90 } });
    expect((await api('POST', '/science', { mission: 'm1', points: 90 })).data.counted).toBe(false);
    expect((await api('POST', '/mine/members/Giulia', { action: 'kick' })).status).toBe(403);
    expect((await api('GET', '/live/Giulia')).data).toMatchObject({ username: 'Giulia', demo: true });
    expect((await api('GET', '/live/Luca')).data.error).toBe('not_live');
    expect((await api('POST', '/leave', {})).data).toEqual({ left: true, disbanded: false });
    expect((await api('GET', '/mine')).data.consortium).toBeNull();
  });
});
