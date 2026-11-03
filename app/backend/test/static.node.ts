import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createApp } from "../src/app.js";

async function withServer(
  staticDir: string | undefined,
  run: (baseUrl: string) => Promise<void>
): Promise<void> {
  const server = createServer(createApp({ staticDir }));
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.close();
    await once(server, "close");
  }
}

test("serves the built frontend, SPA routes and keeps /api intact", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smg-static-"));
  try {
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "index.html"), "<!doctype html><title>INDEX-MARKER</title>");
    writeFileSync(join(dir, "legacy-game.html"), "<!doctype html><title>LEGACY-MARKER</title>");
    writeFileSync(join(dir, "assets", "app.js"), "console.log('asset');");

    await withServer(dir, async (baseUrl) => {
      const root = await fetch(`${baseUrl}/`);
      assert.equal(root.status, 200);
      assert.match(await root.text(), /INDEX-MARKER/);

      const route = await fetch(`${baseUrl}/missions/abc`);
      assert.equal(route.status, 200);
      assert.match(await route.text(), /INDEX-MARKER/);

      const legacy = await fetch(`${baseUrl}/legacy-game.html`);
      assert.equal(legacy.status, 200);
      assert.match(await legacy.text(), /LEGACY-MARKER/);

      const asset = await fetch(`${baseUrl}/assets/app.js`);
      assert.equal(asset.status, 200);
      assert.match(await asset.text(), /asset/);

      const health = await fetch(`${baseUrl}/api/health`);
      assert.equal(health.status, 200);
      assert.equal(((await health.json()) as { status: string }).status, "ok");

      const unknownApi = await fetch(`${baseUrl}/api/nope`);
      assert.equal(unknownApi.status, 404);
      assert.doesNotMatch(await unknownApi.text(), /INDEX-MARKER/);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("does not serve a frontend when the directory has no index.html", async () => {
  const dir = mkdtempSync(join(tmpdir(), "smg-empty-"));
  try {
    await withServer(dir, async (baseUrl) => {
      assert.equal((await fetch(`${baseUrl}/`)).status, 404);
      assert.equal((await fetch(`${baseUrl}/api/health`)).status, 200);
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
