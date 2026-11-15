import { get } from "node:http";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliCompressSync, brotliDecompressSync, gzipSync, gunzipSync } from "node:zlib";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createStaticServer } from "../server.mjs";

let server;
let baseUrl;
let root;
let largeSource;

const rawGet = (url, headers = {}) =>
  new Promise((resolve, reject) => {
    const request = get(url, { headers }, (response) => {
      const chunks = [];
      response.on("data", (chunk) => chunks.push(chunk));
      response.on("end", () =>
        resolve({
          status: response.statusCode,
          headers: response.headers,
          body: Buffer.concat(chunks)
        })
      );
    });
    request.on("error", reject);
  });

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "gng-static-"));
  await mkdir(join(root, "assets"), { recursive: true });
  await mkdir(join(root, "audio"), { recursive: true });
  await mkdir(join(root, "fonts"), { recursive: true });
  await writeFile(join(root, "index.html"), "<!doctype html><title>Go No-Go</title>");
  await writeFile(join(root, "assets", "app-12345678.js"), "console.log('ok');");
  await writeFile(join(root, "audio", "theme.mp3"), "fake-mp3");
  await writeFile(join(root, "fonts", "font.woff2"), "fake-font");

  largeSource = "console.log('large asset');\n".repeat(400);
  await writeFile(join(root, "large.js"), largeSource);
  await writeFile(join(root, "large.js.gz"), gzipSync(largeSource, { level: 9 }));
  await writeFile(join(root, "large.js.br"), brotliCompressSync(largeSource));

  // No .gz/.br files: exercise the on-the-fly compression fallback.
  await writeFile(join(root, "fallback.js"), largeSource);

  server = createStaticServer({ root });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await rm(root, { recursive: true, force: true });
});

describe("static server", () => {
  it("serves the game shell", async () => {
    const response = await fetch(`${baseUrl}/`);
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(await response.text()).toContain("Go No-Go");
  });

  it("keeps the deployment health probe", async () => {
    const response = await fetch(`${baseUrl}/api/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
  });

  it("caches hashed assets for a year", async () => {
    const response = await fetch(`${baseUrl}/assets/app-12345678.js`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toContain("immutable");
    expect(await response.text()).toBe("console.log('ok');");
  });

  it("caches audio and fonts as immutable", async () => {
    const audio = await rawGet(`${baseUrl}/audio/theme.mp3?v=test`);
    expect(audio.headers["cache-control"]).toContain("immutable");
    const font = await rawGet(`${baseUrl}/fonts/font.woff2`);
    expect(font.headers["cache-control"]).toContain("immutable");
  });

  it("always revalidates unhashed top-level scripts and styles", async () => {
    const script = await rawGet(`${baseUrl}/fallback.js`);
    expect(script.headers["cache-control"]).toBe("no-cache");
    expect(script.headers.etag).toBeTruthy();
  });

  it("serves precompressed brotli with a length and Vary", async () => {
    const response = await rawGet(`${baseUrl}/large.js`, { "accept-encoding": "br" });
    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("br");
    expect(response.headers.vary).toContain("Accept-Encoding");
    expect(Number(response.headers["content-length"])).toBeLessThan(largeSource.length);
    expect(brotliDecompressSync(response.body).toString()).toBe(largeSource);
  });

  it("falls back to on-the-fly gzip", async () => {
    const response = await rawGet(`${baseUrl}/fallback.js`, { "accept-encoding": "gzip" });
    expect(response.status).toBe(200);
    expect(response.headers["content-encoding"]).toBe("gzip");
    expect(response.headers.vary).toContain("Accept-Encoding");
    expect(response.body.length).toBeLessThan(largeSource.length);
  });

  it("sends Content-Length for identity responses", async () => {
    const response = await rawGet(`${baseUrl}/fallback.js`, { "accept-encoding": "identity" });
    expect(response.status).toBe(200);
    expect(Number(response.headers["content-length"])).toBe(Buffer.byteLength(largeSource));
  });

  it("revalidates with ETag", async () => {
    const first = await rawGet(`${baseUrl}/`);
    expect(first.headers.etag).toBeTruthy();
    const second = await rawGet(`${baseUrl}/`, { "if-none-match": first.headers.etag });
    expect(second.status).toBe(304);
    expect(second.body.length).toBe(0);
  });

  it("serves the SPA fallback for unknown routes", async () => {
    const response = await fetch(`${baseUrl}/missions/42`);
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Go No-Go");
  });

  it("returns 404 for missing files with an extension", async () => {
    const response = await fetch(`${baseUrl}/missing.png`);
    expect(response.status).toBe(404);
  });

  it("rejects path traversal", async () => {
    const response = await fetch(`${baseUrl}/%2e%2e%2fpackage.json`);
    expect(response.status).toBe(400);
  });

  it("answers HEAD without a body", async () => {
    const response = await fetch(`${baseUrl}/`, { method: "HEAD" });
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("");
  });

  it.each([
    ['br;q=0, gzip', 'gzip'], ['gzip;q=0, br', 'br'],
    ['br;q=0, gzip;q=0', null], ['*;q=0', null],
    ['br;q=0, *;q=1', 'gzip'], ['gzip;q=1, br;q=0.2', 'gzip'],
    ['identity', null], ['BR', 'br'], ['gzip;q=0.9, br;q=1', 'br'],
    ['br;q=0, gzip;q=1, *;q=0.5', 'gzip']
  ])('honors encoding quality and exclusions: %s', async (header, encoding) => {
    for (const path of ['/large.js', '/fallback.js']) {
      const response = await rawGet(`${baseUrl}${path}`, {'accept-encoding':header});
      expect(response.status).toBe(200);
      expect(response.headers['content-encoding'] ?? null).toBe(encoding);
      const decoded=encoding==='br'?brotliDecompressSync(response.body):encoding==='gzip'?gunzipSync(response.body):response.body;
      expect(decoded.toString()).toBe(largeSource);
    }
  });

  it.each(['//[', '/%', '/%GG', '/%00', '/%2e%2e%5cpackage.json', '/%2e%2e%2fpackage.json', '/assets/%2e%2e%2f%2e%2e%2fpackage.json'])('rejects malformed or escaping paths: %s', async path => {
    const response=await rawGet(`${baseUrl}${path}`);
    expect(response.status).toBe(400);
  });

  it('keeps validator precedence and representation-specific ETags', async () => {
    const identity=await rawGet(`${baseUrl}/large.js`);
    const compressed=await rawGet(`${baseUrl}/large.js`,{'accept-encoding':'br'});
    expect(identity.headers.etag).not.toBe(compressed.headers.etag);
    const stale=await rawGet(`${baseUrl}/large.js`,{'if-none-match':'"obsolete"','if-modified-since':'Tue, 01 Jan 2099 00:00:00 GMT'});
    expect(stale.status).toBe(200);
    const list=await rawGet(`${baseUrl}/large.js`,{'if-none-match':`"obsolete", ${identity.headers.etag}`});
    expect(list.status).toBe(304);expect(list.body.length).toBe(0);
  });

  it('serves 200 concurrent mixed requests without corrupting compressed bodies', async () => {
    const results=await Promise.all(Array.from({length:200},(_,i)=>rawGet(`${baseUrl}${i%2?'/large.js':'/fallback.js'}`,{'accept-encoding':i%3?'gzip':'br'})));
    for(const r of results){expect(r.status).toBe(200);expect((r.headers['content-encoding']==='br'?brotliDecompressSync(r.body):gunzipSync(r.body)).toString()).toBe(largeSource);}
  });

  it("keeps the game on / when there is no landing page", async () => {
    const response = await fetch(`${baseUrl}/?clan=demo`, { redirect: "manual" });
    expect(response.status).toBe(200);
    expect(await response.text()).toContain("Go No-Go");
  });
});

describe("landing page routes", () => {
  let landingServer;
  let landingUrl;
  let landingRoot;

  beforeAll(async () => {
    landingRoot = await mkdtemp(join(tmpdir(), "gng-landing-"));
    await mkdir(join(landingRoot, "landing", "assets"), { recursive: true });
    await writeFile(join(landingRoot, "index.html"), "<!doctype html><title>Go No-Go game</title>");
    await writeFile(join(landingRoot, "landing", "index.html"), "<!doctype html><title>Landing IT</title>");
    await writeFile(join(landingRoot, "landing", "en.html"), "<!doctype html><title>Landing EN</title>");
    await writeFile(join(landingRoot, "landing", "assets", "system.css"), "body{}");
    landingServer = createStaticServer({ root: landingRoot });
    await new Promise((resolve) => landingServer.listen(0, "127.0.0.1", resolve));
    landingUrl = `http://127.0.0.1:${landingServer.address().port}`;
  });

  afterAll(async () => {
    await new Promise((resolve) => landingServer.close(resolve));
    await rm(landingRoot, { recursive: true, force: true });
  });

  it("serves the landing page on / and its English version on /en", async () => {
    const italian = await fetch(`${landingUrl}/`);
    expect(italian.status).toBe(200);
    expect(italian.headers.get("content-type")).toContain("text/html");
    expect(italian.headers.get("cache-control")).toBe("no-cache");
    expect(await italian.text()).toContain("Landing IT");
    const english = await fetch(`${landingUrl}/en`);
    expect(english.headers.get("cache-control")).toBe("no-cache");
    expect(await english.text()).toContain("Landing EN");
  });

  it("serves the game on /play", async () => {
    const response = await fetch(`${landingUrl}/play`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
    expect(await response.text()).toContain("Go No-Go game");
    expect(await (await fetch(`${landingUrl}/play?clan=demo`)).text()).toContain("Go No-Go game");
  });

  it("sends old game links with a query from / to /play", async () => {
    const response = await fetch(`${landingUrl}/?clan=demo&q=2`, { redirect: "manual" });
    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/play?clan=demo&q=2");
  });

  it("revalidates the landing kit files", async () => {
    const response = await fetch(`${landingUrl}/landing/assets/system.css`);
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-cache");
  });
});
