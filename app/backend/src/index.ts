import express, { type Request, type Response } from "express";

type MissionProfile = {
  id: string;
  title: string;
  objective: string;
  budgetMUsd: number;
  maxMassKg: number;
  maxPowerKw: number;
};

type TelemetryEvent = {
  missionId: string;
  status: "go" | "no-go";
  powerKw: number;
  budgetMUsd: number;
};

const app = express();
app.use(express.json({ limit: "256kb" }));

const missionProfiles: MissionProfile[] = [
  {
    id: "lunar-geology-01",
    title: "Lunar Geology Survey",
    objective: "Map mineral signatures near Aristarchus region.",
    budgetMUsd: 1200,
    maxMassKg: 7000,
    maxPowerKw: 6
  },
  {
    id: "earth-observatory-02",
    title: "Earth Atmosphere Monitor",
    objective: "Track upper-atmosphere changes and cloud dynamics.",
    budgetMUsd: 900,
    maxMassKg: 5400,
    maxPowerKw: 5.2
  }
];

app.get("/api/health", (_request: Request, response: Response) => {
  response.json({ status: "ok" });
});

app.get("/api/missions", (_request: Request, response: Response) => {
  response.json(missionProfiles);
});

app.post("/api/telemetry", (request: Request, response: Response) => {
  const payload = request.body as Partial<TelemetryEvent>;
  if (!payload || typeof payload !== "object") {
    response.status(400).json({ error: "Invalid telemetry payload." });
    return;
  }

  const { missionId, status, powerKw, budgetMUsd } = payload;
  const mission = missionProfiles.find((entry) => entry.id === missionId);

  if (!mission) {
    response.status(404).json({ error: "Mission not found." });
    return;
  }

  if (status !== "go" && status !== "no-go") {
    response.status(400).json({ error: "Status must be go or no-go." });
    return;
  }

  if (typeof powerKw !== "number" || !Number.isFinite(powerKw)) {
    response.status(400).json({ error: "powerKw must be a valid number." });
    return;
  }

  if (typeof budgetMUsd !== "number" || !Number.isFinite(budgetMUsd)) {
    response.status(400).json({ error: "budgetMUsd must be a valid number." });
    return;
  }

  const accepted = powerKw <= mission.maxPowerKw && budgetMUsd <= mission.budgetMUsd;

  response.status(accepted ? 202 : 409).json({
    missionId,
    accepted,
    reason: accepted
      ? "Mission profile constraints satisfied."
      : "Mission profile constraints exceeded."
  });
});

const port = Number(process.env.PORT ?? 8080);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}

app.listen(port, () => {
  console.log(`Mission backend listening on http://localhost:${port}`);
});
