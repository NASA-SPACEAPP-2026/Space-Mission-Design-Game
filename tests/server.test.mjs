import { get } from "node:http";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { brotliCompressSync, brotliDecompressSync, gzipSync } from "node:zlib";
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
});
