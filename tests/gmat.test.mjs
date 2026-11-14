import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// 02-orbit.js is a classic script (no ESM exports): evaluate it with a fake CommonJS `module`
const mod = { exports: {} };
new Function('module', readFileSync(new URL('../public/game/02-orbit.js', import.meta.url), 'utf8'))(mod);
const O = mod.exports;

// piano a mano: rilascio circolare a 400 km, poi orbita circolare a 35.786 km, stessa inclinazione
function plan(dest, h1, h2, i) {
  const B = O.BODY[dest], el1 = { pe: h1, ap: h1, i, raan: 0, argp: 0 }, el2 = { pe: h2, ap: h2, i, raan: 0, argp: 0 }, tr = O.transfer(el1, el2, B);
  return { tr, p: { wet: 4, orbits: [{ el: el1, dv: 0, name: 'Rilascio' }, { el: el2, dv: tr.dv, mid: tr.mid, name: 'Orbita 2' }], eol: null } };
}

describe('O.gmat', () => {
  it('LEO → GEO: Hohmann dv is sane and the script has one Target per leg', () => {
    const { tr, p } = plan('leo', 400, 35786, 28.5);
    expect(tr.dv).toBeGreaterThan(3700); expect(tr.dv).toBeLessThan(4100);
    const s = O.gmat({ name: 'Test', sat: { dest: 'leo' } }, p);
    expect(s).toMatch(/Sat\.SMA = 6771\.0/);
    expect(s).toContain('Sat.CoordinateSystem = EarthMJ2000Eq;');
    expect(s).toContain('PointMass.CentralBody = Earth;');
    expect((s.match(/^Target DC/gm) || []).length).toBe(1);
    expect(s).toContain('BeginMissionSequence;');
    expect(s).toMatch(/Achieve DC\(Sat\.Earth\.RMAG = 42157\./);
  });
  it('Moon plan uses a Luna-centred frame', () => {
    const { p } = plan('moon', 800, 300, 40);
    const s = O.gmat({ name: 'Lunar', sat: { dest: 'moon' } }, p);
    expect(s).toContain('MoonMJ2000Eq.Origin = Luna;'.replace('MoonMJ2000Eq', 'LunaMJ2000Eq'));
    expect(s).toContain('PointMass.CentralBody = Luna;');
    expect(s).toContain('Sat.Luna.');
  });
  it('plane change adds an INC achieve', () => {
    const B = O.BODY.leo, el1 = { pe: 500, ap: 500, i: 51.6, raan: 0, argp: 0 }, el2 = { pe: 500, ap: 500, i: 97, raan: 0, argp: 0 }, tr = O.transfer(el1, el2, B);
    const s = O.gmat({ name: 'Plane', sat: { dest: 'leo' } }, { wet: 4, orbits: [{ el: el1, dv: 0 }, { el: el2, dv: tr.dv, mid: tr.mid }], eol: null });
    expect(s).toMatch(/\.INC = 97\.0000/);
  });

  it('analysis script: ASCII, three stations, locators, loop variable created before the mission sequence', () => {
    const s = O.gmatAnalysis({ dest: 'leo', el: { pe: 450, ap: 450, i: 97.8, raan: 0, argp: 0 }, mass: 4, area: 0.03 }, { files: { ecl: '/w/e.txt', con: '/w/c.txt', st: '/w/s.txt' } });
    expect(/^[\x00-\x7f]*$/.test(s)).toBe(true);
    for (const st of ['milan', 'svalbard', 'canberra']) expect(s).toContain('Create GroundStation ' + st + ';');
    expect(s).toContain('Create EclipseLocator EL;'); expect(s).toContain('Create ContactLocator CL;');
    expect(s.indexOf('Create Variable I;')).toBeLessThan(s.indexOf('BeginMissionSequence;'));
    expect(s).toContain("CL.Filename = '/w/c.txt';");
    expect((s.match(/^For /gm) || []).length).toBe(2);
  });
  it('analysis script for the Moon only looks at eclipses', () => {
    const s = O.gmatAnalysis({ dest: 'moon', el: { pe: 100, ap: 100, i: 90, raan: 0, argp: 0 }, mass: 4, area: 0.03 }, {});
    expect(s).toContain('EL.OccultingBodies = {Luna};'); expect(s).not.toContain('ContactLocator'); expect(s).not.toContain('Drag.');
  });
});

