import { randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { isProfaneUsername } from './username-filter.mjs';
const scrypt = promisify(scryptCallback);
const hash = value => createHash('sha256').update(value).digest('hex');
const cookieName = 'gng_session';
const lifetime = 60 * 60 * 24 * 7;
const params = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
let activeHashes = 0;

export async function passwordHash(password, salt = randomBytes(16).toString('hex')) {
  if (activeHashes >= 4) throw new Error('Password service busy');
  activeHashes++;
  try {
    const key = await scrypt(password, salt, 64, params);
    return `scrypt$${salt}$${key.toString('hex')}`;
  } finally { activeHashes--; }
}
export async function passwordMatches(password, encoded) {
  const [, salt, expected] = encoded.split('$');
  const actual = (await passwordHash(password, salt)).split('$')[2];
  const a = Buffer.from(actual, 'hex'), b = Buffer.from(expected, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}
const publicUser = row => ({ id: row.id, username: row.username, email: row.email });
const tokenOf = req => (req.headers.cookie || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1) || '';
async function userForToken(db, token) {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  const result = await db.query(`SELECT u.id,u.username,u.email FROM users u JOIN sessions s
    ON s.user_id=u.id WHERE s.token_hash=$1 AND s.expires_at > now()`, [hash(token)]);
  return result.rows[0] || null;
}
// Shared with other API modules (consortia): the signed-in user of a request, or null.
export const sessionUser = (db, req) => userForToken(db, tokenOf(req));

export function createAuth({ db, origin, secure = true }) {
  // APP_ORIGIN may list several exact origins separated by commas (e.g. the azurewebsites.net host and a custom domain).
  const origins = String(origin || '').split(',').map((o) => o.trim()).filter(Boolean);
  if (!origins.length || origins.some((o) => { try { return new URL(o).origin !== o; } catch { return true; } })) throw new Error('APP_ORIGIN must be an exact origin');
  if (secure && origins.some((o) => !o.startsWith('https://'))) throw new Error('Production requires HTTPS APP_ORIGIN');
  const dummy = passwordHash(randomBytes(32).toString('hex'));
  function send(res, status, body, cookie, extraHeaders) {
    res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
      ...(cookie ? { 'Set-Cookie': cookie } : {}), ...(extraHeaders || {}) });
    res.end(JSON.stringify(body));
  }
  function cookie(token, age) {
    return `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`;
  }
  const session = token => userForToken(db, token);
  async function limited(key, max) {
    const result = await db.query(`INSERT INTO auth_limits(key,attempts,expires_at)
      VALUES($1,1,now()+interval '15 minutes') ON CONFLICT(key) DO UPDATE SET
      attempts=CASE WHEN auth_limits.expires_at<=now() THEN 1 ELSE auth_limits.attempts+1 END,
      expires_at=CASE WHEN auth_limits.expires_at<=now() THEN now()+interval '15 minutes' ELSE auth_limits.expires_at END
      RETURNING attempts`, [hash(key)]);
    return result.rows[0].attempts > max;
  }
  return async (req, res, pathname) => {
    const token = tokenOf(req);
    try {
      if (pathname === '/api/auth/me' && req.method === 'GET') {
        await db.query('SELECT 1 FROM users LIMIT 0');
        const user = await session(token);
        return send(res, 200, { user: user ? publicUser(user) : null });
      }
      if (!['/api/auth/register', '/api/auth/login', '/api/auth/logout'].includes(pathname)) return send(res, 404, { error: 'Endpoint not found' });
      if (req.method !== 'POST') return send(res, 405, { error: 'Method not allowed' });
      // Exact Origin + JSON requests prevent cross-site form and fetch CSRF.
      if (!origins.includes(req.headers.origin)) return send(res, 403, { error: 'Origin not allowed' });
      if (pathname.endsWith('/logout')) {
        await db.query('DELETE FROM sessions WHERE token_hash=$1', [hash(token)]);
        // Wipe cookies on logout. "cache" is deliberately NOT cleared: the browser blocks the response until the whole HTTP cache
        // is purged (seconds with the game bundle cached) and static assets hold no user data. "storage" is NOT cleared either:
        // it would delete the local game saves (localStorage).
        return send(res, 200, { user: null }, cookie('', 0), { 'Clear-Site-Data': '"cookies"' });
      }
      if (req.headers['content-type']?.split(';')[0] !== 'application/json') return send(res, 415, { error: 'JSON required' });
      // Do not trust arbitrary X-Forwarded-For supplied by a browser.
      if (await limited(`ip:${req.socket.remoteAddress}`, 100)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
      const chunks = []; let bytes = 0;
      for await (const chunk of req) {
        bytes += chunk.length;
        if (bytes > 4096) return send(res, 413, { error: 'Request too large' });
        chunks.push(chunk);
      }
      let body;
      try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(res, 400, { error: 'Invalid JSON' }); }
      if (!body || typeof body !== 'object' || typeof body.password !== 'string' || body.password.length > 128) return send(res, 400, { error: 'Invalid data' });
      let user;
      if (pathname.endsWith('/register')) {
        const { username, email, password } = body;
        if (typeof username !== 'string' || !/^[a-zA-Z0-9_]{3,24}$/.test(username) ||
          (email != null && (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) || password.length < 1) {
          return send(res, 400, { error: 'Username: 3–24 letters, numbers or _. Password: 1–128 characters.' });
        }
        if (isProfaneUsername(username)) return send(res, 400, { error: 'This username is not allowed. Please choose another one.', code: 'username_not_allowed' });
        if (await limited('register:global', 30)) return send(res, 429, { error: 'Registrations temporarily limited' });
        try {
          const result = await db.query('INSERT INTO users(id,username,email,password_hash) VALUES($1,$2,$3,$4) RETURNING id,username,email',
            [randomUUID(), username, email?.toLowerCase() ?? null, await passwordHash(password)]);
          user = result.rows[0];
        } catch (error) {
          if (error.code === '23505') return send(res, 409, { error: 'Username already in use' });
          throw error;
        }
      } else {
        const login = typeof body.login === 'string' ? body.login.toLowerCase().trim() : '';
        if (!login || login.length > 254) return send(res, 400, { error: 'Enter a username or email' });
        if (await limited(`login:${login}`, 10)) return send(res, 429, { error: 'Too many attempts. Try again in 15 minutes.' });
        const result = await db.query('SELECT * FROM users WHERE lower(username)=$1 OR lower(email)=$1', [login]);
        user = result.rows[0];
        const valid = await passwordMatches(body.password, user?.password_hash || await dummy);
        if (!user || !valid) return send(res, 401, { error: 'Invalid credentials' });
      }
      const nextToken = randomBytes(32).toString('hex');
      await db.query('INSERT INTO sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval \'7 days\')', [hash(nextToken), user.id]);
      if (token) await db.query('DELETE FROM sessions WHERE token_hash=$1', [hash(token)]);
      return send(res, pathname.endsWith('/register') ? 201 : 200, { user: publicUser(user) }, cookie(nextToken, lifetime));
    } catch (error) {
      // Never log request payloads, credentials, connection strings or SQL parameters.
      console.error('Authentication request failed', error.code || error.name);
      return send(res, 503, { error: 'Account service temporarily unavailable' });
    }
  };
}
