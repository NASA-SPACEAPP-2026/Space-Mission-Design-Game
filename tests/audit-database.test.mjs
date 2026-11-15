import { describe, expect, it } from 'vitest';
import { database } from '../backend/database.mjs';

const DATABASE_URL='postgresql://audit:unused@127.0.0.1:5432/audit';
describe('database configuration without external connections',()=>{
  it.each([{}, {DATABASE_URL:''}, {DATABASE_URL:'not a URL'}])('rejects missing or invalid configuration: %j',env=>expect(()=>database(env)).toThrow());
  it('rejects disabling TLS in production',()=>{
    expect(()=>database({DATABASE_URL,NODE_ENV:'production',DATABASE_SSL:'false'})).toThrow('Production requires database TLS');
  });
  it.each([undefined,'require','no-verify','disable'])('keeps certificate verification with sslmode=%s',async sslmode=>{
    const pool=database({DATABASE_URL:DATABASE_URL+(sslmode?'?sslmode='+sslmode:''),NODE_ENV:'production'});
    try{
      expect(pool.options.ssl).toEqual({rejectUnauthorized:true});
      expect(new URL(pool.options.connectionString).searchParams.has('sslmode')).toBe(false);
      expect(pool.options.max).toBe(5);
      expect(pool.options.connectionTimeoutMillis).toBe(5000);
      expect(pool.totalCount).toBe(0);
    }finally{await pool.end();}
  });
  it('allows local plaintext connections and a custom timeout',async()=>{
    const pool=database({DATABASE_URL,DATABASE_SSL:'false',DATABASE_CONNECT_TIMEOUT_MS:'1234'});
    try{expect(pool.options.ssl).toBe(false);expect(pool.options.connectionTimeoutMillis).toBe(1234);expect(pool.totalCount).toBe(0);}finally{await pool.end();}
  });
});
