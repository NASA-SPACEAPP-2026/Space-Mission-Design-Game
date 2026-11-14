import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createBridge, derive, parseContacts, parseEclipse, parseReport, parseState, validate, validateAnalysis } from '../scripts/gmat-bridge.mjs';
import { readFile } from 'node:fs/promises';

const el = (h, i = 28.5) => ({ pe: h, ap: h, i, raan: 0, argp: 0, ma: 0 });
const plan = (over = {}) => ({ dest: 'leo', orbits: [{ el: el(400), dv: 0 }, { el: el(35786), dv: 3857, mid: { pe: 400, ap: 35786, i: 28.5, raan: 0, argp: 0 } }], eol: null, ...over });
// fake GmatConsole: writes the report file the bridge expects
const fake = (text) => async (bin, args, cwd) => { await writeFile(join(cwd, 'dv.txt'), text); return ''; };

describe('gmat bridge', () => {
  it('rejects anything that is not a clean numeric plan', () => {
    expect(validate(null)).toBe('bad-plan');
    expect(validate({ ...plan(), dest: 'pluto' })).toBe('bad-plan');
    expect(validate({ ...plan(), orbits: [plan().orbits[0]] })).toBe('bad-plan');
    expect(validate({ ...plan(), orbits: [{ el: { ...el(400), pe: 'x' }, dv: 0 }, plan().orbits[1]] })).toBe('bad-plan');
    expect(validate({ ...plan(), orbits: [{ el: el(400), dv: 0, extra: 'Create Spacecraft; System("rm -rf /")' }, plan().orbits[1]] }).orbits[0]).not.toHaveProperty('extra');
  });
  it('reports no-gmat when GMAT is not installed', async () => {
    expect(await createBridge({ gmatConsole: '' }).handle(plan())).toEqual({ error: 'no-gmat' });
  });
  it('parses the delta-V of each leg from the report', async () => {
    const r = await createBridge({ gmatConsole: 'x', exec: fake('3860.5\n') }).handle(plan());
    expect(r.legs).toEqual([{ dv: 3860.5 }]);
  });
  it('parseReport takes the numbers on the last line', () => {
    expect(parseReport('dv1 dv2\n1.5 2e3\n')).toEqual([1.5, 2000]);
    expect(parseReport('')).toBeNull();
  });
  it('turns a failed GMAT run into an error, not a crash', async () => {
    const r = await createBridge({ gmatConsole: 'x', exec: async () => { throw new Error('boom'); } }).handle(plan());
    expect(r.error).toBe('gmat-failed');
  });
  it('answers repeated plans from the cache', async () => {
    let n = 0; const b = createBridge({ gmatConsole: 'x', exec: async (bin, a, cwd) => { n++; await writeFile(join(cwd, 'dv.txt'), '1\n'); } });
    await b.handle(plan()); await b.handle(plan()); expect(n).toBe(1);
  });
  it('says busy when too many requests are waiting', async () => {
    let release; const gate = new Promise(r => { release = r; });
    const b = createBridge({ gmatConsole: 'x', exec: async (bin, a, cwd) => { await gate; await writeFile(join(cwd, 'dv.txt'), '1\n'); } });
    const jobs = Array.from({ length: 8 }, (_, i) => b.handle(plan({ orbits: [{ el: el(400), dv: 0 }, { el: el(1000 + i), dv: 1 }] })));
    await new Promise(r => setTimeout(r, 50)); release();
    const out = await Promise.all(jobs);
    expect(out.some(r => r.error === 'busy')).toBe(true);
  });

});

const ECL = `Spacecraft: Sat

Start Time (UTC)            Stop Time (UTC)               Duration (s)    Occ Body        Type        Event Number  Total Duration (s)
01 Jan 2027 12:08:49.960    01 Jan 2027 12:43:29.161      2079.2005839    Earth           Umbra       1             2079.2005839
01 Jan 2027 13:40:59.626    01 Jan 2027 13:41:09.244      9.6173534752    Earth           Penumbra    2             2089.2083783
01 Jan 2027 13:41:09.244    01 Jan 2027 14:15:48.835      2079.5910248    Earth           Umbra       2             2089.2083783
01 Jan 2027 15:13:28.511    01 Jan 2027 15:48:08.494      1800.0000000    Earth           Umbra       3             1800.0000000
`;
const CON = `Target: Sat

Observer: milan
Start Time (UTC)            Stop Time (UTC)               Duration (s)
01 Jan 2027 18:19:11.759    01 Jan 2027 18:24:33.529      360.0
02 Jan 2027 00:42:48.162    02 Jan 2027 00:50:48.725      480.0

Number of events : 2

Observer: svalbard
Start Time (UTC)            Stop Time (UTC)               Duration (s)

Number of events : 0
`;

describe('analysis parsers', () => {
  it('eclipse: per-orbit shadow from event totals, last (possibly truncated) event dropped', () => {
    const e = parseEclipse(ECL, 30);
    expect(e.events).toBe(3); expect(e.maxMin).toBeCloseTo(2089.2083783 / 60, 4); expect(e.avgMin).toBeCloseTo((2079.2005839 + 2089.2083783) / 2 / 60, 4);
    expect(parseEclipse('Spacecraft: Sat\n', 30)).toMatchObject({ events: 0, avgMin: 0, maxMin: 0, sunlitPct: 100 });
  });
  it('contacts: passes and minutes per day for each station', () => {
    const c = parseContacts(CON, 2);
    expect(c.milan.passesDay).toBe(1); expect(c.milan.minDay).toBeCloseTo(7, 5); expect(c.svalbard).toEqual({ passesDay: 0, minDay: 0 });
  });
  it('state: window means, RAAN as a circular mean (polar orbits sit around 0/360)', () => {
    const rows = ['0 6800 420 359 90', '0 6802 422 1 90', '30 6790 410 359 90', '30 6792 412 1 90'].join('\n');
    const s = parseState(rows);
    expect(s.a[1]).toBe(6801); expect(s.b[1]).toBe(6791); expect(Math.min(s.a[3], 360 - s.a[3])).toBeLessThan(0.01);
  });
  it('derive: decay, station-keeping dv, lifetime, node drift and SSO flag', () => {
    const st = { a: [0, 6971, 600, 10, 97.8], b: [30, 6970, 599, 39.8, 97.8] };
    const out = derive('leo', { el: { pe: 600, ap: 600 } }, st, { events: 0 }, {}, 30, 398600.4);
    expect(out.decay.kmMonth).toBeCloseTo(1, 5); expect(out.decay.nodeDegDay).toBeCloseTo(0.9933, 3); expect(out.decay.sso).toBe(true);
    expect(out.decay.lifeMonths).toBeGreaterThan(50); expect(out.decay.skDvMonth).toBeGreaterThan(0);
    expect(derive('moon', { el: { pe: 100, ap: 100 } }, null, { events: 3 }, null, 7, 4902.8).decay).toBeNull();
  });
  it('analysis input is validated and never carries script text or stations', () => {
    expect(validateAnalysis({ dest: 'leo', el: { pe: 500, ap: 500, i: 51.6 }, mass: 4, area: 0.03, stations: [{ lat: 1 }], script: 'x' })).toEqual({ dest: 'leo', el: { pe: 500, ap: 500, i: 51.6, raan: 0, argp: 0, ma: 0 }, mass: 4, area: 0.03 });
    expect(validateAnalysis({ dest: 'leo', el: { pe: 500, ap: 500, i: 51.6 }, mass: 1e9 })).toBe('bad-plan');
    expect(validateAnalysis({ dest: 'sun', el: { pe: 500, ap: 500, i: 51.6 } })).toBe('bad-plan');
  });
  it('analyze: runs the (fake) GMAT, reads the three reports and caches the answer', async () => {
    let runs = 0;
    const exec = async (bin, args, cwd) => {
      runs++; const s = await readFile(args[1], 'utf8'), f = k => s.match(new RegExp(k + "\\.Filename = '([^']+)'"))[1];
      await writeFile(f('EL'), ECL); await writeFile(f('CL'), CON);
      await writeFile(f('ST'), ['0 6821 450 10 51.6', '0 6821 450 10 51.6', '30 6811 440 205 51.6', '30 6811 440 205 51.6'].join('\n'));
    };
    const b = createBridge({ gmatConsole: 'x', exec }), req = { dest: 'leo', el: { pe: 450, ap: 450, i: 51.6 }, mass: 4, area: 0.03 };
    const r = await b.analyze(req);
    expect(r.eclipse.maxMin).toBeGreaterThan(30); expect(r.contacts.milan.passesDay).toBeGreaterThan(0); expect(r.decay.kmMonth).toBeCloseTo(10, 3);
    await b.analyze(req); expect(runs).toBe(1);
    expect((await b.analyze({ dest: 'leo', el: { pe: 450, ap: 450, i: 51.6 }, mass: 'x' })).error).toBe('bad-plan');
  });
});
