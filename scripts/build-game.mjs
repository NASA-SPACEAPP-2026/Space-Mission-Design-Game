#!/usr/bin/env node
/*
 * Builds the production game bundle.
 *
 * The source game is still a set of classic scripts in `public/game/` so Vite
 * can serve them unchanged in development. For production we concatenate them
 * in order, minify them with esbuild, hash the result and point the built
 * `dist/index.html` at the single hashed file.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transformSync } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
const files = [
  "00-three.js",
  "00-toon.js",
  "01-data.js",
  "02-orbit.js",
  "03-logic.js",
  "04-stubs.js",
  "05-campus.js",
  "06-rooms.js",
  "08-minigames.js",
  "07-main.js"
];

const source = (
  await Promise.all(files.map((file) => readFile(resolve(root, "public/game", file), "utf8")))
).join("\n;\n");

const result = transformSync(source, {
  loader: "js",
  target: "es2022",
  minify: true,
  format: "iife",
  charset: "utf8",
  legalComments: "eof",
  sourcemap: false
});

const code = result.code;
const hash = createHash("sha256").update(code).digest("hex").slice(0, 12);
const assetsDir = resolve(root, "dist/assets");
await mkdir(assetsDir, { recursive: true });

const bundleName = `game-${hash}.js`;
await writeFile(resolve(assetsDir, bundleName), code);

const indexPath = resolve(root, "dist/index.html");
const index = await readFile(indexPath, "utf8");
const scriptBlock = /(?:<script src="\/game\/[^"]+"><\/script>)+/;
if (!scriptBlock.test(index)) {
  throw new Error("dist/index.html does not contain the expected /game/ script block.");
}
const scriptTag = `<script src="/assets/${bundleName}"></script>`;
const preloadTag = `<link rel="preload" as="script" href="/assets/${bundleName}" fetchpriority="high">`;
let output = index.replace(scriptBlock, scriptTag);
if (!output.includes(preloadTag)) output = output.replace('</head>', `${preloadTag}</head>`);
await writeFile(indexPath, output);

// The source scripts are only needed by the dev server.
await rm(resolve(root, "dist/game"), { recursive: true, force: true });

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log(`Game bundle: ${bundleName} (${kb(Buffer.byteLength(code))}, from ${kb(Buffer.byteLength(source))})`);
