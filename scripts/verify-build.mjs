#!/usr/bin/env node
/* Fails the build if the production output is not the expected static bundle. */
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const index = await readFile(resolve(root, "index.html"), "utf8");
const matches = [...index.matchAll(/<script src="\/assets\/(game-[a-f0-9]+\.js)"><\/script>/g)];

if (matches.length !== 1) {
  throw new Error(`Expected exactly one hashed game bundle, found ${matches.length}.`);
}
if (index.includes('src="/game/')) {
  throw new Error("dist/index.html still references the dev-only /game/ scripts.");
}

const bundle = matches[0][1];
const check = async (path, label) => {
  const info = await stat(resolve(root, path));
  if (!info.isFile() || info.size === 0) throw new Error(`${label} is missing or empty.`);
  return info.size;
};

const raw = await check(`assets/${bundle}`, "game bundle");
const gzip = await check(`assets/${bundle}.gz`, "gzip game bundle");
const brotli = await check(`assets/${bundle}.br`, "brotli game bundle");
await check("index.html.gz", "gzip index");
await check("index.html.br", "brotli index");

if (raw > 1_200_000) throw new Error(`Game bundle is too large: ${raw} bytes.`);
if (gzip > 300_000) throw new Error(`Gzip game bundle is too large: ${gzip} bytes.`);
if (brotli > 300_000) throw new Error(`Brotli game bundle is too large: ${brotli} bytes.`);

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log(
  `Build verified: ${bundle} ${kb(raw)} raw, ${kb(gzip)} gzip, ${kb(brotli)} br`
);
