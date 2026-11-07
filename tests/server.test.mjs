import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createStaticServer } from "../server.mjs";

let server;
let baseUrl;
let root;

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), "gng-static-"));
  await mkdir(join(root, "assets"), { recursive: true });
  await mkdir(join(root, "audio"), { recursive: true });
  await writeFile(join(root, "index.html"), "<!doctype html><title>Go No-Go</title>");
  await writeFile(join(root, "assets", "app-12345678.js"), "console.log('ok');");
  await writeFile(join(root, "audio", "theme.mp3"), "fake-mp3");
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
