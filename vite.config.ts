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
    proxy: { '/api': 'http://127.0.0.1:8080' }
  },
  preview: {
    host: true,
    port: 4173
  }
});
