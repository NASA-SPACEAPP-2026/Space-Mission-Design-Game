#!/usr/bin/env node
/*
 * Precompresses text assets in `dist/` so `server.mjs` can serve `.br`/`.gz`
 * files with Content-Length and no per-request compression cost.
 */
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { constants } from "node:zlib";
import { brotliCompressSync, gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../dist/", import.meta.url));
const TEXT = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".svg",
  ".webmanifest",
  ".xml"
]);
const MIN_BYTES = 1024;

const files = [];
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (TEXT.has(extname(entry.name).toLowerCase())) files.push(path);
  }
};
await walk(root);

let sourceBytes = 0;
let gzipBytes = 0;
let brotliBytes = 0;
let compressed = 0;

for (const file of files) {
  const info = await stat(file);
  if (info.size < MIN_BYTES) continue;
  const source = await readFile(file);
  const gz = gzipSync(source, { level: 9 });
  const br = brotliCompressSync(source, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
  });
  await writeFile(`${file}.gz`, gz);
  await writeFile(`${file}.br`, br);
  sourceBytes += source.length;
  gzipBytes += gz.length;
  brotliBytes += br.length;
  compressed += 1;
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} kB`;
console.log(
  `Precompressed ${compressed} files: ${kb(sourceBytes)} -> gzip ${kb(gzipBytes)}, br ${kb(brotliBytes)}`
);
