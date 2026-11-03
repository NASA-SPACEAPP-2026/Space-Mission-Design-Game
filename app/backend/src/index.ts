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

const color = (code: number, value: string): string =>
  process.stdout.isTTY && !process.env.NO_COLOR
    ? `\u001b[${code}m${value}\u001b[0m`
    : value;

const server = app.listen(port, () => {
  const cyan = (value: string): string => color(96, value);
  const blue = (value: string): string => color(94, value);
  const muted = (value: string): string => color(90, value);

  console.log("");
  console.log(cyan("  .----------------------------------------------------------."));
  console.log(cyan("  |") + "          GO / NO-GO  ::  MISSION CONTROL API           " + cyan("|"));
  console.log(cyan("  '----------------------------------------------------------'"));
  console.log(`  ${blue("ORBIT")}     http://localhost:${port}`);
  console.log(`  ${blue("STATUS")}    ONLINE`);
  console.log(`  ${blue("HEALTH")}    /api/health`);
  console.log(`  ${muted("DATABASE")}  Not configured yet; health-only backend`);
  console.log(`  ${muted("MODE")}      ${(process.env.NODE_ENV ?? "development").toUpperCase()}`);
  console.log("");
});

server.on("error", (error: Error) => {
  console.error(JSON.stringify({
    level: "error",
    event: "backend.listener.failed",
    message: error.message,
    port
  }));
  process.exitCode = 1;
});
