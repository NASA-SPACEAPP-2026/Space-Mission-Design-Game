import express, { type Express } from "express";

/**
 * Builds an isolated Express application without opening a listening socket.
 * Network startup remains the responsibility of index.ts.
 */
export function createApp(): Express {
  const app = express();

  app.get("/api/health", (_request, response) => {
    response.json({
      status: "ok",
      service: "space-mission-design-game",
      game: "Go-No-Go"
    });
  });

  return app;
}
