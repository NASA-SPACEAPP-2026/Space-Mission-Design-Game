import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createAuth } from '../backend/auth.mjs';
import { createConsortia } from '../backend/consortia.mjs';
import { migrate } from '../backend/database.mjs';
import { createStaticServer } from '../server.mjs';

const ORIGIN='https://audit.example';
const crest={shape:'shield',color:'#abcdef',symbol:'rocket'};
let pg, db, server, base;
const cookies=[], ids=[];
async function call(path,{method='POST',body={},raw,who=0,origin=ORIGIN,type='application/json',cookie,signal=AbortSignal.timeout(4000)}={}) {
  const response=await fetch(base+path,{method,signal,headers:{...(origin?{Origin:origin}:{}),...(type?{'Content-Type':type}:{}),Cookie:cookie??cookies[who]??''},
    body:['GET','HEAD'].includes(method)?undefined:raw??JSON.stringify(body)});
  return {status:response.status,headers:response.headers,body:await response.json()};
}
beforeAll(async()=>{
  pg=new PGlite();await pg.waitReady;await migrate({query:sql=>pg.exec(sql)});
  let queue=Promise.resolve();const run=fn=>{const next=queue.then(fn);queue=next.catch(()=>{});return next;};
  db={query:(sql,args)=>run(()=>pg.query(sql,args)),tx:fn=>run(()=>pg.transaction(t=>fn({query:(sql,args)=>t.query(sql,args)})))};
  for(let i=0;i<8;i++){
    const id=randomUUID(),token=randomBytes(32).toString('hex');ids.push(id);cookies.push('gng_session='+token);
    await db.query('INSERT INTO users(id,username,password_hash) VALUES($1,$2,$3)',[id,`Audit_${i}`,'unused-test-hash']);
    await db.query("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 day')",[createHash('sha256').update(token).digest('hex'),id]);
  }
  server=createStaticServer({auth:createAuth({db,origin:ORIGIN}),consortia:createConsortia({db,origin:ORIGIN})});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}`;
},60000);
beforeEach(()=>db.query('DELETE FROM auth_limits'));
afterAll(async()=>{if(server)await new Promise(r=>server.close(r));if(pg)await pg.close();});

describe('API malformed input matrix',()=>{
  const bodies=['null','true','42','"text"','[]','[{}]','{','{"password":null}','{"password":42}','{"password":{}}'];
  const paths=['/api/auth/register','/api/auth/login','/api/consortia','/api/consortia/science','/api/consortia/live'];
  it.each(paths.flatMap(path=>bodies.filter(raw=>!path.endsWith('/live') || !raw.startsWith('{"password"')).map(raw=>({path,raw}))))('$path rejects $raw with a client error',async({path,raw})=>{
    const r=await call(path,{raw,method:path.endsWith('/live')?'PUT':'POST'});
    expect(r.status).toBe(400);expect(r.body.error).toBeTypeOf('string');
    expect(r.headers.get('cache-control')).toBe('no-store');
  });
  it.each(paths)('%s rejects oversized bodies and remains reachable',async path=>{
    const r=await call(path,{body:{password:'x'.repeat(210000)},method:path.endsWith('/live')?'PUT':'POST'});
    expect(r.status).toBe(413);
    expect((await call('/api/auth/me',{method:'GET'})).status).toBe(200);
  });
  it.each(paths.flatMap(path=>['https://evil.example','https://audit.example.evil.test','null',null].map(origin=>({path,origin}))))('$path rejects origin $origin',async({path,origin})=>{
    expect((await call(path,{origin,method:path.endsWith('/live')?'PUT':'POST'})).status).toBe(403);
  });
  it.each(paths.flatMap(path=>['text/plain','application/x-www-form-urlencoded',null].map(type=>({path,type}))))('$path rejects content type $type',async({path,type})=>{
    expect((await call(path,{type,method:path.endsWith('/live')?'PUT':'POST'})).status).toBe(415);
  });
  it.each(['gng_session=garbage','gng_session='+'a'.repeat(64),'other=cookie','gng_session=%00','gng_session='+'x'.repeat(1000)])('does not accept a forged cookie: %s',async cookie=>{
    expect((await call('/api/auth/me',{method:'GET',cookie})).body.user).toBeNull();
    expect((await call('/api/consortia/mine',{method:'GET',cookie})).status).toBe(401);
  });
  it.each([-1,1001,1.5,'50',true,null,{},[],1e30])('rejects invalid science points %j',async points=>{
    expect((await call('/api/consortia/science',{body:{mission:'audit-invalid',points}})).status).toBe(400);
  });
});

describe('API stress and transaction invariants',()=>{
  it('returns independent sessions for 120 parallel authenticated reads',async()=>{
    const results=await Promise.all(Array.from({length:120},(_,i)=>call('/api/auth/me',{method:'GET',who:i%8})));
    results.forEach((r,i)=>{expect(r.status).toBe(200);expect(r.body.user.username).toBe(`Audit_${i%8}`);expect(r.body.user.password_hash).toBeUndefined();});
  });
  it('keeps a persistent connection usable after 30 alternating oversized uploads',async()=>{
    for(let i=0;i<30;i++){
      const r=await call(i%2?'/api/auth/login':'/api/consortia/science',{body:{password:'x'.repeat(210000)},signal:AbortSignal.timeout(2000)});
      expect(r.status).toBe(413);
      expect((await call('/api/auth/me',{method:'GET',who:i%8})).body.user.username).toBe(`Audit_${i%8}`);
    }
  });
  it('counts exactly one science award for 25 concurrent duplicate submissions',async()=>{
    const before=Number((await db.query('SELECT coalesce(sum(points),0) AS n FROM science_awards WHERE user_id=$1',[ids[0]])).rows[0].n);
    const results=await Promise.all(Array.from({length:25},()=>call('/api/consortia/science',{body:{mission:'audit-same-mission',points:17}})));
    expect(results.every(r=>r.status===200)).toBe(true);
    expect(results.filter(r=>r.body.counted)).toHaveLength(1);
    const after=Number((await db.query('SELECT sum(points) AS n FROM science_awards WHERE user_id=$1',[ids[0]])).rows[0].n);
    expect(after-before).toBe(17);
  });
  it('admits only one applicant to the last consortium seat',async()=>{
    const created=await call('/api/consortia',{body:{name:'Audit Orbit',crest,maxMembers:2}});
    expect(created.status).toBe(201);
    const cid=created.body.consortium.id;
    const results=await Promise.all(Array.from({length:7},(_,i)=>call(`/api/consortia/${cid}/join`,{who:i+1})));
    expect(results.filter(r=>r.status===200)).toHaveLength(1);
    expect(results.filter(r=>r.body.error==='full')).toHaveLength(6);
    expect((await call(`/api/consortia/${cid}`,{method:'GET'})).body.consortium.members).toBe(2);
  });
  it('treats SQL metacharacters and LIKE wildcards as literal search text',async()=>{
    for(const q of ["' OR 1=1 --",'%', '_', '\\', "'; DROP TABLE users; --"]){
      const r=await call('/api/consortia?q='+encodeURIComponent(q),{method:'GET'});
      expect(r.status).toBe(200);expect(r.body.consortia).toEqual([]);
    }
    expect((await db.query('SELECT count(*)::int AS n FROM users')).rows[0].n).toBe(8);
  });
});
