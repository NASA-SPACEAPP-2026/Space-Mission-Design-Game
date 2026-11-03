import { existsSync } from "node:fs";
import { join } from "node:path";
import express, { type Express } from "express";

export interface AppOptions {
  /**
   * Directory containing the built frontend (Vite `dist`). When it holds an
   * index.html, the API server also serves the frontend from the same origin,
   * which is how the app is deployed. Omit it for API-only usage (tests, dev).
   */
  staticDir?: string;
}

/**
 * Builds an isolated Express application without opening a listening socket.
 * Network startup remains the responsibility of index.ts.
 */
export function createApp(options: AppOptions = {}): Express {
  const app = express();

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "space-mission-design-game",
      game: "Go-No-Go"
    });
  });

  const { staticDir } = options;
  if (staticDir && existsSync(join(staticDir, "index.html"))) {
    app.use(express.static(staticDir));

    // The frontend uses History API routes (/profile, /missions/:id), so any
    // other GET must return index.html. Unknown /api/* paths keep their 404.
    app.use((request, response, next) => {
      if (request.method !== "GET" || request.path.startsWith("/api")) {
        next();
        return;
      }
      response.sendFile(join(staticDir, "index.html"));
    });
  }

  return app;
}
