import express from "express";

const app = express();

app.get("/api/health", (_request, response) => {
  response.json({
    status: "ok",
    service: "space-mission-design-game",
    game: "Go-No-Go"
  });
});

const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.listen(port, () => {
  console.log(`Game backend listening on http://localhost:${port}`);
});
