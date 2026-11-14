import { defineConfig } from "vite";

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
    proxy: { "/api/gmat": "http://localhost:8787", "/api": "http://127.0.0.1:8080" }
  },
  preview: {
    host: true,
    port: 4173
  }
});
