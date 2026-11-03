import * as pc from "playcanvas";
import "./style.css";

type MissionProfile = {
  id: string;
  title: string;
  objective: string;
  budgetMUsd: number;
  maxMassKg: number;
  maxPowerKw: number;
};

type TelemetryResponse = {
  missionId: string;
  accepted: boolean;
  reason: string;
};

const canvas = document.getElementById("scene");
if (!(canvas instanceof HTMLCanvasElement)) {
  throw new Error("Scene canvas not found.");
}

const app = new pc.Application(canvas, {
  graphicsDeviceOptions: {
    alpha: false,
    antialias: true
  },
  mouse: new pc.Mouse(canvas),
  touch: new pc.TouchDevice(canvas)
});

pc.WasmModule.setConfig("DracoDecoderModule", {
  glueUrl: "https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_wasm_wrapper.js",
  wasmUrl: "https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder.wasm",
  fallbackUrl: "https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder.js"
});

app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);
app.setCanvasResolution(pc.RESOLUTION_AUTO);
window.addEventListener("resize", () => app.resizeCanvas());

app.scene.skyboxMip = 1;
app.start();

const camera = new pc.Entity("camera");
camera.addComponent("camera", {
  clearColor: new pc.Color(0.02, 0.03, 0.08),
  farClip: 2500,
  toneMapping: pc.TONEMAP_ACES
});
camera.camera?.requestSceneColorMap(true);
camera.setLocalPosition(0, 28, 64);
camera.lookAt(0, 6, 0);
app.root.addChild(camera);

const keyLight = new pc.Entity("key-light");
keyLight.addComponent("light", {
  type: "directional",
  intensity: 2.1,
  castShadows: true,
  color: new pc.Color(0.86, 0.91, 1)
});
keyLight.setEulerAngles(45, 28, 0);
app.root.addChild(keyLight);

const fillLight = new pc.Entity("fill-light");
fillLight.addComponent("light", {
  type: "omni",
  intensity: 0.8,
  range: 240,
  color: new pc.Color(0.28, 0.42, 0.74)
});
fillLight.setPosition(-35, 35, 10);
app.root.addChild(fillLight);

const terrain = new pc.Entity("terrain");
terrain.addComponent("render", {
  type: "plane"
});
terrain.setLocalScale(240, 1, 240);
terrain.setEulerAngles(-90, 0, 0);
terrain.setLocalPosition(0, -0.1, 0);
const terrainMaterial = new pc.StandardMaterial();
terrainMaterial.diffuse = new pc.Color(0.06, 0.09, 0.13);
terrainMaterial.metalness = 0.2;
terrainMaterial.gloss = 0.1;
terrainMaterial.update();
terrain.render!.material = terrainMaterial;
app.root.addChild(terrain);

const earth = new pc.Entity("earth");
earth.addComponent("render", { type: "sphere" });
earth.setLocalPosition(-18, 9, 0);
earth.setLocalScale(12, 12, 12);
const earthMaterial = new pc.StandardMaterial();
earthMaterial.diffuse = new pc.Color(0.09, 0.35, 0.72);
earthMaterial.emissive = new pc.Color(0.02, 0.09, 0.24);
earthMaterial.metalness = 0.05;
earthMaterial.gloss = 0.2;
earthMaterial.update();
earth.render!.material = earthMaterial;
app.root.addChild(earth);

const orbit = new pc.Entity("orbit-ring");
orbit.addComponent("render", { type: "torus" });
orbit.setLocalPosition(-18, 9, 0);
orbit.setLocalScale(23, 23, 0.14);
orbit.setEulerAngles(90, 0, 0);
const orbitMaterial = new pc.StandardMaterial();
orbitMaterial.diffuse = new pc.Color(0.93, 0.65, 0.26);
orbitMaterial.emissive = new pc.Color(0.15, 0.08, 0.02);
orbitMaterial.metalness = 0.4;
orbitMaterial.gloss = 0.4;
orbitMaterial.update();
orbit.render!.material = orbitMaterial;
app.root.addChild(orbit);

const missionMarker = new pc.Entity("mission-marker");
missionMarker.addComponent("render", { type: "cone" });
missionMarker.setLocalScale(1.2, 2.8, 1.2);
missionMarker.setLocalPosition(10, 2, -8);
const markerMaterial = new pc.StandardMaterial();
markerMaterial.diffuse = new pc.Color(0.25, 0.82, 0.63);
markerMaterial.emissive = new pc.Color(0.1, 0.38, 0.33);
markerMaterial.update();
missionMarker.render!.material = markerMaterial;
app.root.addChild(missionMarker);

const addNasaAsset = (
  name: string,
  url: string,
  position: pc.Vec3,
  scale: pc.Vec3,
  yawDeg: number
): void => {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);
  asset.ready(() => {
    if (!asset.resource) {
      throw new Error(`Unable to load NASA asset: ${name}`);
    }
    const model = asset.resource.instantiateRenderEntity();
    model.setPosition(position);
    model.setLocalScale(scale);
    model.setEulerAngles(0, yawDeg, 0);
    app.root.addChild(model);
  });
  app.assets.load(asset);
};

addNasaAsset(
  "astronaut",
  "/assets/nasa/Astronaut.glb",
  new pc.Vec3(8, 0.2, 6),
  new pc.Vec3(1.5, 1.5, 1.5),
  160
);

addNasaAsset(
  "crab-nebula",
  "/assets/nasa/Crab-Nebula.glb",
  new pc.Vec3(-48, 30, -90),
  new pc.Vec3(9, 9, 9),
  10
);

const station = new pc.Entity("station");
station.addComponent("render", { type: "box" });
station.setLocalScale(5, 2, 5);
station.setLocalPosition(10, 1, -8);
const stationMaterial = new pc.StandardMaterial();
stationMaterial.diffuse = new pc.Color(0.21, 0.29, 0.4);
stationMaterial.emissive = new pc.Color(0.04, 0.08, 0.13);
stationMaterial.update();
station.render!.material = stationMaterial;
app.root.addChild(station);

const satellite = new pc.Entity("satellite");
satellite.addComponent("render", { type: "capsule" });
satellite.setLocalScale(0.8, 1.8, 0.8);
satellite.setLocalPosition(-6, 16, 0);
const satelliteMaterial = new pc.StandardMaterial();
satelliteMaterial.diffuse = new pc.Color(0.84, 0.86, 0.9);
satelliteMaterial.emissive = new pc.Color(0.2, 0.2, 0.26);
satelliteMaterial.update();
satellite.render!.material = satelliteMaterial;
app.root.addChild(satellite);

const goButton = document.getElementById("goButton");
const noGoButton = document.getElementById("noGoButton");
const power = document.getElementById("power");
const budget = document.getElementById("budget");
const mass = document.getElementById("mass");
const objective = document.getElementById("objective");
const missionSelectElement = document.getElementById("missionSelect");
const statusText = document.getElementById("statusText");

if (
  !goButton ||
  !noGoButton ||
  !power ||
  !budget ||
  !mass ||
  !objective ||
  !(missionSelectElement instanceof HTMLSelectElement) ||
  !statusText
) {
  throw new Error("HUD controls not found.");
}

const missionSelect = missionSelectElement;

const setStatus = (message: string, kind: "idle" | "ok" | "err"): void => {
  statusText.textContent = message;
  statusText.className = `status ${kind}`;
};

const missions = new Map<string, MissionProfile>();
let activeMissionId = "";
let currentBudgetMUsd = 1200;
let currentPowerKw = 4.8;

const renderMissionStats = (mission: MissionProfile): void => {
  budget.textContent = `$${currentBudgetMUsd.toFixed(0)}M / $${mission.budgetMUsd.toFixed(0)}M`;
  mass.textContent = `5.4 t / ${(mission.maxMassKg / 1000).toFixed(1)} t`;
  power.textContent = `${currentPowerKw.toFixed(1)} kW / ${mission.maxPowerKw.toFixed(1)} kW`;
  objective.textContent = `${mission.title}: ${mission.objective}`;
};

const loadMissions = async (): Promise<void> => {
  setStatus("Loading mission profiles...", "idle");

  const response = await fetch("/api/missions");
  if (!response.ok) {
    throw new Error(`Mission profiles request failed (${response.status})`);
  }

  const payload = (await response.json()) as MissionProfile[];
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("No mission profiles available from backend.");
  }

  missionSelect.innerHTML = "";
  missions.clear();

  for (const mission of payload) {
    missions.set(mission.id, mission);
    const option = document.createElement("option");
    option.value = mission.id;
    option.textContent = mission.title;
    missionSelect.append(option);
  }

  activeMissionId = payload[0].id;
  currentBudgetMUsd = payload[0].budgetMUsd;
  currentPowerKw = payload[0].maxPowerKw * 0.8;
  renderMissionStats(payload[0]);
  setStatus("Mission profiles loaded.", "ok");
};

const submitTelemetry = async (status: "go" | "no-go"): Promise<void> => {
  const mission = missions.get(activeMissionId);
  if (!mission) {
    throw new Error("No active mission selected.");
  }

  const response = await fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      missionId: mission.id,
      status,
      powerKw: currentPowerKw,
      budgetMUsd: currentBudgetMUsd
    })
  });

  const payload = (await response.json()) as TelemetryResponse | { error: string };
  if (!response.ok && !("accepted" in payload)) {
    const message = "error" in payload ? payload.error : "Telemetry request failed.";
    throw new Error(message);
  }

  const result = payload as TelemetryResponse;
  setStatus(
    `${status.toUpperCase()} for ${mission.title}: ${result.reason}`,
    result.accepted ? "ok" : "err"
  );
};

missionSelect.addEventListener("change", () => {
  const selectedId = missionSelect.value;
  const mission = missions.get(selectedId);
  if (!mission) {
    setStatus("Selected mission is not available.", "err");
    return;
  }

  activeMissionId = mission.id;
  currentBudgetMUsd = mission.budgetMUsd;
  currentPowerKw = mission.maxPowerKw * 0.8;
  missionMarker.setLocalPosition(10, 2.2, -8);
  renderMissionStats(mission);
  setStatus(`Mission selected: ${mission.title}`, "idle");
});

goButton.addEventListener("click", async () => {
  const mission = missions.get(activeMissionId);
  if (!mission) {
    setStatus("Cannot run GO without an active mission.", "err");
    return;
  }

  currentPowerKw = mission.maxPowerKw * 0.9;
  renderMissionStats(mission);
  missionMarker.setLocalPosition(10, 2.6, -8);

  try {
    await submitTelemetry("go");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telemetry submission failed.";
    setStatus(message, "err");
  }
});

noGoButton.addEventListener("click", async () => {
  const mission = missions.get(activeMissionId);
  if (!mission) {
    setStatus("Cannot run NO-GO without an active mission.", "err");
    return;
  }

  currentPowerKw = mission.maxPowerKw * 1.1;
  renderMissionStats(mission);
  missionMarker.setLocalPosition(10, 1.5, -8);

  try {
    await submitTelemetry("no-go");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Telemetry submission failed.";
    setStatus(message, "err");
  }
});

let elapsed = 0;
app.on("update", (dt: number) => {
  elapsed += dt;
  earth.rotate(0, 8 * dt, 0);
  orbit.rotate(0, 0, 4 * dt);
  missionMarker.setLocalEulerAngles(0, 0, Math.sin(elapsed * 3) * 6);
  satellite.setLocalPosition(
    -18 + Math.cos(elapsed * 0.7) * 16,
    9 + Math.sin(elapsed * 0.7) * 3,
    Math.sin(elapsed * 0.7) * 16
  );
  camera.setLocalPosition(Math.sin(elapsed * 0.12) * 8, 28, 64);
  camera.lookAt(0, 6, 0);
});

loadMissions().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Mission loading failed.";
  setStatus(message, "err");
});
