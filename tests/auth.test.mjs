import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { PGlite } from '@electric-sql/pglite';
import { readFile } from 'node:fs/promises';
import { createAuth } from '../backend/auth.mjs';
import { createStaticServer } from '../server.mjs';
describe('PostgreSQL authentication', () => {
  let pg, db, server, base;
  const credentials = { username:'Pilot_1', email:'pilot@example.com', password:'a long unique password 123!' };
  async function call(path, body, cookie, origin='https://game.example') {
    const response=await fetch(`${base}/api/auth/${path}`,{ method:body===undefined?'GET':'POST',
      headers:{Origin:origin,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
      body:body===undefined?undefined:JSON.stringify(body) });
    return {status:response.status,cookie:response.headers.get('set-cookie'),body:await response.json()};
  }
  beforeAll(async()=>{
    pg=new PGlite(); await pg.waitReady;
    const schema=await readFile(new URL('../db/001-auth.sql',import.meta.url),'utf8');
    await pg.exec(schema); await pg.exec(schema);
    let queue=Promise.resolve();
    db={query:(sql,args)=>{const next=queue.then(()=>pg.query(sql,args));queue=next.catch(()=>{});return next;}};
    server=createStaticServer({auth:createAuth({db,origin:'https://game.example',secure:true})});
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    base=`http://127.0.0.1:${server.address().port}`;
  },30000);
  afterAll(async()=>{await new Promise(resolve=>server.close(resolve));await pg.close();});
  it('registers, logs in by username/email, rotates, expires and revokes sessions',async()=>{
    expect((await call('me')).body.user).toBeNull();
    const registered=await call('register',credentials);
    expect(registered.status).toBe(201);
    expect(registered.cookie).toContain('HttpOnly');expect(registered.cookie).toContain('Secure');
    expect(registered.body.user.password_hash).toBeUndefined();
    const first=registered.cookie.split(';')[0];
    expect((await call('me',undefined,first)).body.user.username).toBe('Pilot_1');
    expect((await db.query('SELECT password_hash FROM users')).rows[0].password_hash).toMatch(/^scrypt\$/);
    const login=await call('login',{login:'PILOT_1',password:credentials.password},first);
    expect(login.status).toBe(200);
    expect((await call('me',undefined,first)).body.user).toBeNull();
    const second=login.cookie.split(';')[0];
    await call('logout',{},second);
    expect((await call('me',undefined,second)).body.user).toBeNull();
    const emailLogin=await call('login',{login:credentials.email,password:credentials.password});
    expect(emailLogin.status).toBe(200);
    await db.query("UPDATE sessions SET expires_at=now()-interval '1 second'");
    expect((await call('me',undefined,emailLogin.cookie.split(';')[0])).body.user).toBeNull();
  });
  it('rejects duplicates, invalid input, incorrect credentials and CSRF',async()=>{
    expect((await call('register',{...credentials,username:'pilot_1'})).status).toBe(409);
    expect((await call('register',{...credentials,username:'Other',email:'PILOT@example.com'})).status).toBe(409);
    expect((await call('register',{...credentials,password:'short'})).status).toBe(400);
    expect((await call('login',{login:'Pilot_1',password:'wrong'})).status).toBe(401);
    expect((await call('register',credentials,undefined,'https://evil.example')).status).toBe(403);
    expect((await call('logout',{},undefined,'https://evil.example')).status).toBe(403);
    expect((await call('unknown')).status).toBe(404);
  });
  it('shares persistent rate limits across requests',async()=>{
    await db.query('DELETE FROM auth_limits');
    for(let i=0;i<10;i++) expect((await call('login',{login:'absent',password:'wrong'})).status).toBe(401);
    expect((await call('login',{login:'absent',password:'wrong'})).status).toBe(429);
  },15000);
});
