import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const legacyGamePath = fileURLToPath(new URL("../../Go-No-Go.html", import.meta.url));

const legacyGamePlugin = {
  name: "serve-existing-go-no-go-game",
  configureServer(server: import("vite").ViteDevServer) {
    server.middlewares.use("/legacy-game.html", (_request, response, next) => {
      try {
        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.end(readFileSync(legacyGamePath));
      } catch (error) {
        next(error);
      }
    });
  },
  writeBundle(options: { dir?: string }) {
    const frontendDirectory = fileURLToPath(new URL(".", import.meta.url));
    const outputDirectory = options.dir ?? resolve(frontendDirectory, "dist");
    mkdirSync(outputDirectory, { recursive: true });
    copyFileSync(legacyGamePath, resolve(outputDirectory, "legacy-game.html"));
  }
};

export default defineConfig({
  plugins: [legacyGamePlugin],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});
