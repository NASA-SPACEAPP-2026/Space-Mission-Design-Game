import { createServer, request } from "node:http";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createStaticServer } from "../server.mjs";

const post = (port, path, body, headers = {}) => new Promise((resolve, reject) => {
  const r = request({ host: "127.0.0.1", port, path, method: "POST", headers: { "content-type": "application/json", ...headers } }, res => { const c = []; res.on("data", d => c.push(d)); res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(c).toString() })); });
  r.on("error", reject); r.end(body);
});
const get = (port, path) => new Promise((resolve, reject) => request({ host: "127.0.0.1", port, path }, res => { res.resume(); res.on("end", () => resolve(res.statusCode)); }).on("error", reject).end());
const listen = s => new Promise(r => s.listen(0, "127.0.0.1", () => r(s.address().port)));

let upstream, site, bare, seen = {}, upPort, sitePort, barePort;
beforeAll(async () => {
  upstream = createServer((req, res) => { const c = []; req.on("data", d => c.push(d)); req.on("end", () => { seen = { url: req.url, method: req.method, xff: req.headers["x-forwarded-for"], body: Buffer.concat(c).toString() }; res.writeHead(200, { "content-type": "application/json" }); res.end('{"legs":[{"dv":1}]}'); }); });
  upPort = await listen(upstream);
  site = createStaticServer({ gmatUrl: `http://127.0.0.1:${upPort}` }); sitePort = await listen(site);
  bare = createStaticServer({}); barePort = await listen(bare);
});
afterAll(() => { for (const s of [upstream, site, bare]) s.close(); });

describe("GMAT proxy in the site server", () => {
  it("forwards the call and the real client address, same origin", async () => {
    const r = await post(sitePort, "/api/gmat/analysis", '{"dest":"leo"}', { "x-forwarded-for": "203.0.113.7:51234, 10.0.0.1" });
    expect(r.status).toBe(200); expect(JSON.parse(r.body).legs[0].dv).toBe(1);
    expect(seen).toMatchObject({ url: "/api/gmat/analysis", method: "POST", xff: "203.0.113.7", body: '{"dest":"leo"}' });
  });
  it("answers 'no-gmat' when GMAT_URL is not set, so the game keeps its own numbers", async () => {
    const r = await post(barePort, "/api/gmat", "{}"); expect(r.status).toBe(503); expect(JSON.parse(r.body).error).toBe("no-gmat");
  });
  it("only accepts POST on the GMAT routes and never opens other /api paths", async () => {
    expect(await get(sitePort, "/api/gmat")).toBe(405);
    expect(await get(sitePort, "/api/secret")).toBe(404);
  });
  it("reports 502 when the GMAT service is down", async () => {
    const dead = createStaticServer({ gmatUrl: "http://127.0.0.1:1" }), port = await listen(dead);
    const r = await post(port, "/api/gmat", "{}"); dead.close(); expect(r.status).toBe(502); expect(JSON.parse(r.body).error).toBe("gmat-unreachable");
  });
});
