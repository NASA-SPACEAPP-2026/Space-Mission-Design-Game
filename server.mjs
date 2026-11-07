#!/usr/bin/env node
/*
 * Minimal static server for Azure App Service.
 *
 * The game is a static 2D single-page app: this process only serves `dist/`.
 * There is no API, no database and no game state on the server. `/api/health`
 * is kept as a tiny liveness probe for the existing deployment smoke test.
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

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

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "X-Frame-Options": "SAMEORIGIN"
};

const isFile = async (path) => {
  try {
    return (await stat(path)).isFile();
  } catch {
    return false;
  }
};

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
  // The game scripts are not hashed yet: always revalidate after a deploy.
  if (relative.startsWith("/game/")) {
    return "no-cache";
  }
  return "public, max-age=3600";
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

const sendFile = (request, response, file, relative) => {
  const type = MIME[extname(file).toLowerCase()] ?? "application/octet-stream";
  response.writeHead(200, {
    ...SECURITY_HEADERS,
    "Content-Type": type,
    "Cache-Control": cacheControl(relative)
  });
  if (request.method === "HEAD") {
    response.end();
    return;
  }
  createReadStream(file).on("error", () => response.destroy()).pipe(response);
};

/**
 * @param {{ root?: string, health?: boolean }} [options]
 */
export const createStaticServer = (options = {}) => {
  const root = resolve(options.root ?? DEFAULT_ROOT);

  return createServer(async (request, response) => {
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

    sendFile(request, response, target, relative);
  });
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const port = Number(process.env.PORT ?? 8080);
  const server = createStaticServer();
  server.listen(port, "0.0.0.0", () => {
    console.log(`Go No-Go static server on http://0.0.0.0:${port} (root: ${DEFAULT_ROOT})`);
  });
  const shutdown = () => server.close(() => process.exit(0));
  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}
