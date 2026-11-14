import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { beforeAll, describe, expect, it } from 'vitest';

// Loads public/game/09-consortia.js without a browser: the module only touches the DOM when the panel opens.
async function loadModule(search) {
  const source = await readFile(new URL('../public/game/09-consortia.js', import.meta.url), 'utf8');
  const store = new Map();
  const context = {
    window: {}, location: { search }, URLSearchParams, console, setTimeout, clearTimeout, setInterval, clearInterval,
    CompressionStream, DecompressionStream, Response, Blob, TextEncoder, TextDecoder, btoa, atob,
    localStorage: { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k) }
  };
  runInNewContext(source, context);
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
