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
<<<<<<< HEAD
    // GMAT (NASA) runs in a container; the game calls it through the same origin
    proxy: { "/api/gmat": "http://localhost:8787" }
=======
    proxy: { '/api': 'http://127.0.0.1:8080' }
>>>>>>> origin/dev
  },
  preview: {
    host: true,
    port: 4173
  }
});
