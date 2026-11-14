// Tiny HTTP wrapper around the GMAT bridge: POST /api/gmat, GET /healthz
import { createServer } from 'node:http';
import { createBridge } from './gmat-bridge.mjs';

const bridge = createBridge(), PORT = +process.env.PORT || 8787, MAX_BODY = 32 * 1024;
const hits = new Map(); // per-IP rate limit: 90 requests / minute
const limited = ip => { const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 60000); a.push(now); hits.set(ip, a); return a.length > 90; };

createServer((req, res) => {
  const send = (code, obj) => { res.writeHead(code, { 'content-type': 'application/json', 'cache-control': 'no-store' }); res.end(JSON.stringify(obj)); };
  if (req.method === 'GET' && req.url === '/healthz') return send(200, { ok: true });
  const analysis = req.url === '/api/gmat/analysis', lifetime = req.url === '/api/gmat/lifetime';
  if (req.method !== 'POST' || (req.url !== '/api/gmat' && !analysis && !lifetime)) return send(404, { error: 'not-found' });
  if (limited(req.socket.remoteAddress)) return send(429, { error: 'rate-limited' });
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > MAX_BODY) { send(413, { error: 'too-large' }); req.destroy(); } else chunks.push(c); });
  req.on('end', async () => {
    if (res.writableEnded) return;
    let body; try { body = JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { return send(400, { error: 'bad-json' }); }
    const r = lifetime ? await bridge.lifetime(body) : analysis ? await bridge.analyze(body) : await bridge.handle(body);
    send(r.error === 'bad-plan' ? 400 : r.error === 'busy' ? 503 : r.error ? 502 : 200, r);
  });
}).listen(PORT, () => console.log('GMAT bridge on :' + PORT));
