import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validate, validateAnalysis, validateLifetime, parseReport, parseLifetime, createBridge } from '../scripts/gmat-bridge.mjs';

const el={pe:400,ap:800,i:51.6,raan:0,argp:0,ma:0};
const plan=()=>({dest:'leo',wet:4,orbits:[{el:{...el},dv:0},{el:{...el,pe:800},dv:100}]});
const invalid=[null,undefined,'400',true,false,{},[],NaN,Infinity,-Infinity];

describe('GMAT hostile numeric input',()=>{
  it.each(['pe','ap','i','raan','argp','ma'].flatMap(key=>invalid.filter(v=>v!=null || ['pe','ap','i'].includes(key)).map(value=>({key,value}))))('rejects $key = $value',({key,value})=>{
    const badEl={...el,[key]:value}, p=plan(); p.orbits[0].el=badEl;
    expect(validate(p)).toBe('bad-plan');
    expect(validateAnalysis({dest:'leo',el:badEl})).toBe('bad-plan');
    expect(validateLifetime({dest:'leo',el:badEl,scenario:'nom'})).toBe('bad-plan');
  });
  it.each(['wet','dv'].flatMap(key=>[...invalid.filter(v=>v!=null),-1,1e7].map(value=>({key,value}))))('rejects $key = $value',({key,value})=>{
    const p=plan(); if(key==='wet')p.wet=value;else p.orbits[1].dv=value;
    expect(validate(p)).toBe('bad-plan');
  });
  it.each(['leo','moon','mars','venus'])('strips extra properties for %s without changing its input',dest=>{
    const p=plan();p.dest=dest;p.script='System("bad")';p.orbits[0].el.script='bad';
    const before=JSON.stringify(p), clean=validate(p);
    expect(typeof clean).toBe('object');expect(JSON.stringify(clean)).not.toContain('bad');expect(JSON.stringify(p)).toBe(before);
  });
});

describe('GMAT report integrity',()=>{
  it.each(['dv1 dv2','NaN 2','Infinity 1','1 error','some status 200','1.2.3','1e999'])('rejects a nonnumeric report: %s',text=>expect(parseReport(text)).toBeNull());
  it.each([['1.5 2e3',[1.5,2000]],['+1.5 -2.0e-3',[1.5,-0.002]],['.5 1.',[0.5,1]],['header\r\n 1 2 \r\n',[1,2]]])('parses complete numeric tokens: %s',(text,wanted)=>expect(parseReport(text)).toEqual(wanted));
  it.each(['-1 140','NaN 140','88 error 140'])('rejects corrupt lifetime results: %s',text=>expect(parseLifetime(text,1825)).toBeNull());
  it('does not cache an unsuccessful calculation and recovers on the next request',async()=>{
    let runs=0;
    const bridge=createBridge({gmatConsole:'fake',exec:async(_bin,_args,cwd)=>{runs++;await writeFile(join(cwd,'dv.txt'),runs===1?'NaN':'12.5');}});
    expect((await bridge.handle(plan())).error).toBe('gmat-no-result');
    expect((await bridge.handle(plan())).legs).toEqual([{dv:12.5}]);
    await bridge.handle(plan());expect(runs).toBe(2);
  });
  it('serializes distinct queued jobs and recovers after an executable failure',async()=>{
    let active=0, peak=0,runs=0;
    const bridge=createBridge({gmatConsole:'fake',exec:async(_bin,_args,cwd)=>{
      active++;peak=Math.max(peak,active);runs++;
      try{await new Promise(r=>setTimeout(r,5));if(runs===1)throw new Error('simulated executable failure');await writeFile(join(cwd,'dv.txt'),'42');}finally{active--;}
    }});
    const results=await Promise.all(Array.from({length:5},(_,i)=>{const p=plan();p.wet=i+1;return bridge.handle(p);}));
    expect(peak).toBe(1);expect(results[0].error).toBe('gmat-failed');expect(results.slice(1).every(r=>r.legs?.[0].dv===42)).toBe(true);
  });
});
