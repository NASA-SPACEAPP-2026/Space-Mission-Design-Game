#!/usr/bin/env node
/*
 * Builds a standalone single-file "Go No-Go.html" from the production build in `dist/`:
 * the game script, the CSS and the fonts are inlined, so the file runs by double-click (file://) or from any static host.
 * The soundtrack stays a separate file, as in the normal build.
 *
 *   npm run package:single                 -> writes "Go No-Go.html" next to package.json (audio: public/audio/theme.mp3)
 *   node scripts/build-single-file.mjs --bundle out/   -> out/"Go No-Go.html" + out/audio/theme.mp3 (a folder you can move around)
 */
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const dist = resolve(root, "dist");
const args = process.argv.slice(2), arg = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
const bundle = arg("--bundle"), outFile = bundle ? resolve(bundle, "Go No-Go.html") : resolve(arg("--out") || resolve(root, "Go No-Go.html"));
const audioUrl = bundle ? "audio/theme.mp3" : "public/audio/theme.mp3";

let html = await readFile(resolve(dist, "index.html"), "utf8");

// 1. the game script (hashed file produced by scripts/build-game.mjs)
const sm = html.match(/<script src="(\/assets\/game-[^"]+\.js)"><\/script>/);
if (!sm) throw new Error("dist/index.html has no game script: run `npm run build` first");
const js = (await readFile(resolve(dist, sm[1].slice(1)), "utf8")).replace(/\/audio\/theme\.mp3/g, audioUrl).replace(/<\/script/gi, "<\\/script");
html = html.replace(sm[0], () => "<script>" + js + "</script>");
html = html.replace(/<link rel="preload"[^>]*>\s*/g, "");

// 2. fonts as data URIs
const fonts = new Map();
for (const f of await readdir(resolve(dist, "fonts"))) if (f.endsWith(".woff2")) fonts.set(f, (await readFile(resolve(dist, "fonts", f))).toString("base64"));
html = html.replace(/(['"(])\/fonts\/([\w.-]+\.woff2)(['")])/g, (m, a, name, b) => fonts.has(name) ? a + "data:font/woff2;base64," + fonts.get(name) + b : m);

// 3. icons (no external files)
const svg = await readFile(resolve(dist, "favicon.svg"));
html = html.replace(/<link rel="icon" href="\/favicon\.svg"[^>]*>/, () => `<link rel="icon" href="data:image/svg+xml;base64,${svg.toString("base64")}" type="image/svg+xml">`).replace(/<link rel="alternate icon"[^>]*>\s*/, "");

await mkdir(dirname(outFile), { recursive: true });
await writeFile(outFile, html);
if (bundle) { await mkdir(resolve(bundle, "audio"), { recursive: true }); await copyFile(resolve(root, "public/audio/theme.mp3"), resolve(bundle, "audio/theme.mp3")); }
const left = html.match(/(?:src|href)="\/(?!\/)[^"]*"/g) || [];
console.log(`wrote ${outFile} (${(html.length / 1048576).toFixed(2)} MB)${left.length ? "; absolute paths left: " + left.join(", ") : ""}`);
