#!/usr/bin/env node
/*
 * Minimal static server for Azure App Service.
 *
 * The game is a static 2D single-page app: this process only serves `dist/`.
 * Authentication API and PostgreSQL sessions are optional locally. `/api/health`
 * is kept as a tiny liveness probe for the existing deployment smoke test.
 *
 * Text assets are served from build-time `.br`/`.gz` files when available,
 * with ETag/Last-Modified revalidation and Content-Length.
 */
import { createReadStream, readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createBrotliCompress, createGzip } from "node:zlib";
import { database } from './backend/database.mjs';
import { createAuth } from './backend/auth.mjs';
import { createConsortia } from './backend/consortia.mjs';

export const DEFAULT_ROOT = resolve(fileURLToPath(new URL("./dist", import.meta.url)));

const MIME = {
  ".avif": "image/avif",
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".map": "application/json; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".txt": "text/plain; charset=utf-8",
  ".wasm": "application/wasm",
  ".webmanifest": "application/manifest+json",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".xml": "application/xml; charset=utf-8"
};

const COMPRESSIBLE = new Set([
  ".css",
  ".html",
  ".js",
  ".json",
  ".map",
  ".mjs",
  ".svg",
  ".txt",
  ".webmanifest",
  ".xml"
]);

const MIN_COMPRESS_BYTES = 1024;

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN"
};

const statFile = async (path) => {
  try {
    const info = await stat(path);
    return info.isFile() ? info : null;
  } catch {
    return null;
  }
};

const isFile = async (path) => !!(await statFile(path));

const safeJoin = (root, pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return null;
  }
  if (decoded.includes("\0")) return null;
  if (decoded.split(/[\\/]/).includes("..")) return null;
  const full = resolve(root, `.${decoded}`);
  if (full !== root && !full.startsWith(root + sep)) return null;
  return full;
};

const cacheControl = (relative) => {
  if (relative === "/" || relative.endsWith("/index.html") || relative === "/index.html") {
    return "no-cache";
  }
  // Vite output in /assets/ has a content hash in the file name.
  if (relative.startsWith("/assets/")) {
    return "public, max-age=31536000, immutable";
  }
  // The source game scripts are not hashed: always revalidate.
  if (relative.startsWith("/game/")) {
    return "no-cache";
  }
  // Versioned audio (?v=hash) and stable self-hosted font files.
  if (relative.startsWith("/audio/") || relative.startsWith("/fonts/")) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=3600";
};

const acceptsEncoding = (request, encoding) => {
  const header = request.headers["accept-encoding"];
  if (!header) return false;
  return header
    .split(",")
    .map((part) => part.trim().toLowerCase().split(";")[0])
    .some((coding) => coding === encoding || coding === "*");
};

const etagFor = (info, encoding) =>
  `W/"${info.size.toString(16)}-${Math.round(info.mtimeMs).toString(16)}${encoding ? `-${encoding}` : ""}"`;

const normalizeEtag = (value) => value.trim().replace(/^W\//, "");

const matchesEtag = (header, etag) => {
  if (!header) return false;
  const wanted = normalizeEtag(etag);
  return header
    .split(",")
    .map((value) => value.trim())
    .some((value) => value === "*" || normalizeEtag(value) === wanted);
};

const notModified = (request, info, etag) => {
  const ifNoneMatch = request.headers["if-none-match"];
  if (ifNoneMatch) return matchesEtag(ifNoneMatch, etag);
  const ifModifiedSince = request.headers["if-modified-since"];
  if (ifModifiedSince) {
    const since = Date.parse(ifModifiedSince);
    return Number.isFinite(since) && Math.floor(info.mtimeMs / 1000) * 1000 <= since;
  }
  return false;
};

const sendJson = (response, status, body) => {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    ...SECURITY_HEADERS,
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(payload),
    "Cache-Control": "no-store"
  });
  response.end(payload);
};

const pipeError = (response) => () => {
  if (!response.headersSent) response.writeHead(500, SECURITY_HEADERS);
  response.destroy();
};

const sendFile = async (request, response, file, relative) => {
  const info = await statFile(file);
  if (!info) {
    response.writeHead(404, { ...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }

  const extension = extname(file).toLowerCase();
  const type = MIME[extension] ?? "application/octet-stream";
  const compressible = COMPRESSIBLE.has(extension) && info.size >= MIN_COMPRESS_BYTES;

  let encoding = null;
  let bodyPath = file;
  let bodyInfo = info;
  if (compressible) {
    if (acceptsEncoding(request, "br")) {
      const br = await statFile(`${file}.br`);
      if (br) {
        encoding = "br";
        bodyPath = `${file}.br`;
        bodyInfo = br;
      }
    }
    if (!encoding && acceptsEncoding(request, "gzip")) {
      const gz = await statFile(`${file}.gz`);
      if (gz) {
        encoding = "gzip";
        bodyPath = `${file}.gz`;
        bodyInfo = gz;
      }
    }
    // Fallback for a build without precompressed files (e.g. manual dist).
    if (!encoding && acceptsEncoding(request, "br")) encoding = "br";
    else if (!encoding && acceptsEncoding(request, "gzip")) encoding = "gzip";
  }

  const etag = etagFor(info, encoding);
  const headers = {
    ...SECURITY_HEADERS,
    "Content-Type": type,
    "Cache-Control": cacheControl(relative),
    ETag: etag,
    "Last-Modified": info.mtime.toUTCString()
  };
  if (compressible) headers.Vary = "Accept-Encoding";
  if (encoding) headers["Content-Encoding"] = encoding;

  if (notModified(request, info, etag)) {
    response.writeHead(304, headers);
    response.end();
    return;
  }

  if (request.method === "HEAD") {
    if (bodyPath !== file || !encoding) headers["Content-Length"] = bodyInfo.size;
    response.writeHead(200, headers);
    response.end();
    return;
  }

  if (bodyPath !== file) {
    headers["Content-Length"] = bodyInfo.size;
    response.writeHead(200, headers);
    createReadStream(bodyPath).on("error", pipeError(response)).pipe(response);
    return;
  }

  if (!encoding) {
    headers["Content-Length"] = info.size;
    response.writeHead(200, headers);
    createReadStream(file).on("error", pipeError(response)).pipe(response);
    return;
  }

  response.writeHead(200, headers);
  const compressor = encoding === "br" ? createBrotliCompress() : createGzip();
  createReadStream(file)
    .on("error", pipeError(response))
    .pipe(compressor)
    .on("error", pipeError(response))
    .pipe(response);
};

/* NASA GMAT runs in its own container (see documentation/deployment.md). The browser keeps calling /api/gmat* on this site; we forward the call, so no CORS and no public URL in the page.
   Without GMAT_URL the game simply keeps using its own numbers (503 'no-gmat'). */
const GMAT_PATHS = new Set(["/api/gmat", "/api/gmat/analysis", "/api/gmat/lifetime"]);
const proxyGmat = async (request, response, pathname, gmatUrl) => {
  if (!gmatUrl) return sendJson(response, 503, { error: "no-gmat" });
  if (request.method !== "POST") return sendJson(response, 405, { error: "method-not-allowed" });
  const chunks = []; let size = 0;
  for await (const chunk of request) { size += chunk.length; if (size > 32 * 1024) return sendJson(response, 413, { error: "too-large" }); chunks.push(chunk); }
  const client = String(request.headers["x-forwarded-for"] ?? "").split(",")[0].trim().replace(/:\d+$/, "") || request.socket.remoteAddress || "";
  try {
    const upstream = await fetch(new URL(pathname, gmatUrl), { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": client }, body: Buffer.concat(chunks), signal: AbortSignal.timeout(pathname === "/api/gmat" ? 90_000 : 240_000) });
    const body = await upstream.text();
    response.writeHead(upstream.status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(body);
  } catch {
    sendJson(response, 502, { error: "gmat-unreachable" });
  }
};

/**
 * @param {{ root?: string, health?: boolean, auth?: Function, consortia?: Function, gmatUrl?: string }} [options]
 */
export const createStaticServer = (options = {}) => {
  const root = resolve(options.root ?? DEFAULT_ROOT);

  return createServer(async (request, response) => {
    const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
    if (pathname.startsWith('/api/auth/')) {
      if (options.auth) return options.auth(request, response, pathname);
      sendJson(response, 503, { error: 'Account non configurati' });
      return;
    }
    if (pathname === '/api/consortia' || pathname.startsWith('/api/consortia/')) {
      if (options.consortia) return options.consortia(request, response, pathname);
      sendJson(response, 503, { error: 'unavailable' });
      return;
    }
    if (GMAT_PATHS.has(pathname)) return proxyGmat(request, response, pathname, options.gmatUrl);
    if (pathname.startsWith('/api/') && pathname !== '/api/health') {
      sendJson(response, 404, { error: 'Endpoint non trovato' });
      return;
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { ...SECURITY_HEADERS, Allow: "GET, HEAD" });
      response.end("Method Not Allowed");
      return;
    }

    const url = new URL(request.url ?? "/", "http://localhost");
    if ((options.health ?? true) && url.pathname === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    const file = safeJoin(root, url.pathname);
    if (!file) {
      response.writeHead(400, SECURITY_HEADERS);
      response.end("Bad Request");
      return;
    }

    let target = file;
    let relative = url.pathname;
    if (!(await isFile(target))) {
      // SPA fallback: only for routes without a file extension.
      if (extname(url.pathname) === "") {
        target = resolve(root, "index.html");
        relative = "/index.html";
      }
      if (!(await isFile(target))) {
        response.writeHead(404, { ...SECURITY_HEADERS, "Content-Type": "text/plain; charset=utf-8" });
        response.end("Not Found");
        return;
      }
    }

    try {
      await sendFile(request, response, target, relative);
    } catch {
      pipeError(response)();
    }
  });
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.PORT ?? 8080);
  const db = process.env.DATABASE_URL ? database() : null;
  if (process.env.NODE_ENV === 'production' && !db) throw new Error('DATABASE_URL is required in production');
  const auth = db ? createAuth({ db, origin: process.env.APP_ORIGIN, secure: process.env.NODE_ENV === 'production' }) : null;
  const consortia = db ? createConsortia({ db, origin: process.env.APP_ORIGIN }) : null;
  // GMAT service: GMAT_URL if set (GMAT_URL=off disables it), else the shared default in gmat-service.json, so a fresh deployment works without any setting.
  let defaultGmat = ""; try { defaultGmat = JSON.parse(readFileSync(new URL("./gmat-service.json", import.meta.url), "utf8")).url || ""; } catch {}
  const gmatUrl = process.env.GMAT_URL === "off" ? "" : process.env.GMAT_URL || defaultGmat;
  const server = createStaticServer({ auth, consortia, gmatUrl });
  server.listen(port, "0.0.0.0", () => {
    console.log(`Go No-Go static server on http://0.0.0.0:${port} (root: ${DEFAULT_ROOT})`);
  });
  const shutdown = () => server.close(async () => { if (db) await db.end(); process.exit(0); });
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
