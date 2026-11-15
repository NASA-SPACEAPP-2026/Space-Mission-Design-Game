import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { JOINT, jointNew, jointReduce, jointWaiting, meetsGoal, weekOf, goalOf, CHALLENGES } from '../backend/consortia.mjs';

const source = ['01-data.js', '02-orbit.js', '03-logic.js'].map(f => readFileSync(new URL(`../public/game/${f}`, import.meta.url), 'utf8')).join('\n');
const { E, O, L } = runInNewContext(`${source}\n;({E,O,L})`);
const norm = a => Math.hypot(...a);
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const cases = Object.entries(O.BODY).flatMap(([dest, body]) => Array.from({length: 20}, (_, seed) => ({dest, body, seed})));

describe('orbital invariants across every destination', () => {
  it.each(cases)('$dest / orbit $seed preserves energy, momentum and elements', ({body, seed}) => {
    const rng = E.rng(seed + 12345);
    const el = {pe: 300 + rng()*1000, ap: 3000 + rng()*15000, i: 5 + rng()*170, raan: rng()*360, argp: rng()*360};
    const a = body.R + (el.pe+el.ap)/2;
    const e = (el.ap-el.pe)/(2*a);
    for (const nu of [0, 37, 90, 180, 270, 359]) {
      const {r, v} = O.state(el, nu, body);
      expect(norm(v)**2/2 - body.mu/norm(r)).toBeCloseTo(-body.mu/(2*a), 8);
      expect(norm(cross(r, v))).toBeCloseTo(Math.sqrt(body.mu*a*(1-e*e)), 6);
      const restored = O.elements(r, v, body);
      expect(restored.bound).toBe(true);
      expect(restored.pe).toBeCloseTo(el.pe, 5);
      expect(restored.ap).toBeCloseTo(el.ap, 5);
      expect(restored.i).toBeCloseTo(el.i, 7);
    }
  });

  it.each(Object.entries(O.BODY))('%s circular transfer agrees with the Hohmann equation', (_dest, body) => {
    for (const [h1, h2] of [[300, 300], [300, 1000], [1000, 300], [1000, 10000]]) {
      const r1=body.R+h1, r2=body.R+h2, at=(r1+r2)/2;
      const expected=(Math.abs(Math.sqrt(body.mu*(2/r1-1/at))-Math.sqrt(body.mu/r1))+Math.abs(Math.sqrt(body.mu/r2)-Math.sqrt(body.mu*(2/r2-1/at))))*1000;
      const transfer=O.transfer({pe:h1,ap:h1,i:0,raan:0,argp:0},{pe:h2,ap:h2,i:0,raan:0,argp:0},body);
      expect(transfer.dv).toBeCloseTo(expected, 5);
      expect(transfer.dv).toBeGreaterThanOrEqual(0);
    }
  });

  it.each(Array.from({length:40}, (_, i) => i))('mission %i owns its mutable state and survives a JSON round trip', seed => {
    const a=L.newMission('audit', `Mission ${seed}`), b=L.newMission('audit', `Other ${seed}`);
    a.sat.placed.audit={id:'BASE-OBC'};
    a.stake.push('nasa');
    expect(b.sat.placed.audit).toBeUndefined();
    expect(b.stake).not.toContain('nasa');
    expect(JSON.parse(JSON.stringify(a)).sat.placed.audit.id).toBe('BASE-OBC');
    const r1=E.rng(seed), r2=E.rng(seed);
    for(let i=0;i<30;i++) { const n=r1(); expect(n).toBe(r2()); expect(n).toBeGreaterThanOrEqual(0); expect(n).toBeLessThan(1); }
  });
});

describe('joint mission state machine', () => {
  it.each(['Alice','constructor','__proto__'])('lets the valid username %s finish a mission', username => {
    let s=jointNew('Audit Mission', username);
    const step=(a, who=username) => {const before=JSON.stringify(s); const next=jointReduce(s,a,who,false); expect(JSON.stringify(s)).toBe(before); s=next;};
    step({type:'join',role:'sat'},'Bob');
    step({type:'start'});
    for(const [key,value] of Object.entries({avi:'BASE-OBC',adcs:'BASE-MAG',bat:'BASE-BAT20',ray:'BASE-CAM',com:'BASE-UHF'})) step({type:'set',key,value},s.roles[JOINT.keys[key]]);
    for(const role of JOINT.roles) step({type:'done',role},s.roles[role]);
    expect(s.phase).toBe('review');
    for(const who of new Set(Object.values(s.roles))) step({type:'vote',go:true,ok:true},who);
    expect(s.phase).toBe('done');
    expect(s.points).toBe(66);
    expect(jointWaiting(s,username)).toBe(false);
    expect(()=>jointReduce(s,{type:'vote',go:true,ok:true},username,false)).toThrow();
  });

  it.each([null,{}, {type:'set',key:'constructor',value:'BASE-OBC'}, {type:'start'}, {type:'vote',go:true,ok:true}, {type:'abandon'}])('rejects unauthorized or out-of-phase actions: %j', action => {
    const s=jointNew('Audit Mission','Alice'), before=JSON.stringify(s);
    expect(()=>jointReduce(s,action,'Mallory',false)).toThrow();
    expect(JSON.stringify(s)).toBe(before);
  });
});

describe('weekly challenge boundaries', () => {
  it.each(CHALLENGES.filter(g=>g.maxCost))('$id requires a cost strictly below its advertised limit', goal => {
    const facts={ok:true,dest:goal.dest,type:'sci',months:12,cost:goal.maxCost};
    expect(meetsGoal(goal,facts)).toBe(false);
    expect(meetsGoal(goal,{...facts,cost:goal.maxCost-1})).toBe(true);
  });
  it.each(['2026-01-01','2026-11-15','2026-12-31','2027-01-01','2028-02-29'])('keeps a complete UTC week at %s', date => {
    const monday=weekOf(new Date(date+'T23:59:59Z'));
    expect(new Date(monday).getUTCDay()).toBe(1);
    for(let d=0;d<7;d++) expect(weekOf(new Date(Date.parse(monday)+d*86400000))).toBe(monday);
    expect(CHALLENGES).toContain(goalOf(monday));
  });
});
