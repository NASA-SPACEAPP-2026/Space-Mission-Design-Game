import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

// Which GMAT service the dev server talks to: GMAT_URL, else what `npm run dev` decided (.gmat-target: the local container when Docker is up,
// otherwise the shared cloud service from gmat-service.json), else the cloud service.
const read = (f) => { try { return readFileSync(new URL(f, import.meta.url), "utf8"); } catch { return ""; } };
const gmatTarget = (process.env.GMAT_URL && process.env.GMAT_URL !== "off" ? process.env.GMAT_URL : read(".gmat-target").trim()) || (JSON.parse(read("gmat-service.json") || "{}").url ?? "") || "http://localhost:8787";

export default defineConfig({
  build: {
    target: "es2022",
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1600
  },
  server: {
    host: true,
    port: 5173,
    // GMAT (NASA) runs in a container: its routes go there, everything else under /api goes to the app server (first match wins)
    proxy: { "/api/gmat": { target: gmatTarget, changeOrigin: true, secure: true }, "/api": "http://127.0.0.1:8080" }
  },
  preview: {
    host: true,
    port: 4173
  }
});
