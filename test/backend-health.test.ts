import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { expect, test } from "vitest";

const repositoryRoot = resolve(fileURLToPath(new URL("../", import.meta.url)));

async function findAvailablePort(): Promise<number> {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not reserve a local TCP port for the backend smoke test.");
  }

  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  return address.port;
}

test(
  "backend health endpoint reports the running service",
  async () => {
    const port = await findAvailablePort();
    const backend = spawn(
      process.execPath,
      ["--import", "tsx", "app/backend/src/index.ts"],
      {
        cwd: repositoryRoot,
        env: {
          ...process.env,
          NODE_ENV: "test",
          NO_COLOR: "1",
          PORT: String(port)
        },
        windowsHide: true
      }
    );

    let output = "";
    let startupError: Error | undefined;
    backend.stdout?.on("data", (chunk: Buffer) => (output += chunk.toString()));
    backend.stderr?.on("data", (chunk: Buffer) => (output += chunk.toString()));
    backend.once("error", (error) => (startupError = error));

    try {
      const deadline = Date.now() + 10_000;
      let response: Response | undefined;
      let lastError: unknown;

      while (Date.now() < deadline) {
        if (startupError) {
          throw startupError;
        }
        if (backend.exitCode !== null) {
          throw new Error(`Backend exited with code ${backend.exitCode}. ${output}`);
        }

        try {
          response = await fetch(`http://127.0.0.1:${port}/api/health`, {
            signal: AbortSignal.timeout(500)
          });
          break;
        } catch (error) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      if (!response) {
        throw new Error(`Backend did not become healthy. ${String(lastError)} ${output}`);
      }

      expect(response.status).toBe(200);
      await expect(response.json()).resolves.toEqual({
        status: "ok",
        service: "space-mission-design-game",
        game: "Go-No-Go"
      });
    } finally {
      if (backend.pid !== undefined && backend.exitCode === null) {
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(
            () => reject(new Error("Backend did not stop after the smoke test.")),
            3_000
          );
          backend.once("exit", () => {
            clearTimeout(timer);
            resolve();
          });
          backend.kill();
        });
      }
    }
  },
  15_000
);
