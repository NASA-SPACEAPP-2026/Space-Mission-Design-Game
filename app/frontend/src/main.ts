import * as pc from "playcanvas";
import { missionPath, resolveRoute, type AppRoute } from "./router";
import "./style.css";

type Settings = {
  sensitivity: number;
  walkSpeed: number;
};

type Locale = "it" | "en";
type Direction = "forward" | "backward" | "left" | "right";

type WorldController = {
  activate: () => void;
  deactivate: () => void;
  setMovement: (direction: Direction, active: boolean) => void;
  look: (deltaX: number, deltaY: number) => void;
};

const SETTINGS_KEY = "space-mission-settings";
const DEFAULT_SETTINGS: Settings = { sensitivity: 0.15, walkSpeed: 6 };
const PLAYER_SPAWN = new pc.Vec3(0, 0, 9);

const appElement = document.getElementById("app");
const canvas = document.getElementById("scene");
const sceneFallback = document.getElementById("scene-fallback");
if (!(appElement instanceof HTMLElement) || !(canvas instanceof HTMLCanvasElement) ||
    !(sceneFallback instanceof HTMLElement)) {
  throw new Error("The PlayCanvas scene canvas is missing.");
}

let settings: Settings = { ...DEFAULT_SETTINGS };
try {
  const storedSettings = localStorage.getItem(SETTINGS_KEY);
  if (storedSettings) {
    const parsed: unknown = JSON.parse(storedSettings);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "sensitivity" in parsed &&
      "walkSpeed" in parsed &&
      typeof parsed.sensitivity === "number" &&
      Number.isFinite(parsed.sensitivity) &&
      typeof parsed.walkSpeed === "number" &&
      Number.isFinite(parsed.walkSpeed)
    ) {
      settings = {
        sensitivity: Math.max(0.05, Math.min(0.4, parsed.sensitivity)),
        walkSpeed: Math.max(2, Math.min(10, parsed.walkSpeed))
      };
    }
  }
} catch {
  // Settings are optional; the default controls remain available if storage is blocked.
}

function initializeWorld(): WorldController {

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
app.scene.ambientLight = new pc.Color(0.24, 0.29, 0.38);

const material = (
  color: pc.Color,
  options: { emissive?: pc.Color; metalness?: number; gloss?: number } = {}
): pc.StandardMaterial => {
  const result = new pc.StandardMaterial();
  result.diffuse = color;
  result.emissive = options.emissive ?? new pc.Color(0, 0, 0);
  result.metalness = options.metalness ?? 0;
  result.gloss = options.gloss ?? 0.2;
  result.update();
  return result;
};

const mats = {
  regolith: material(
    new pc.Color(0.4, 0.4, 0.38),
    { emissive: new pc.Color(0.055, 0.05, 0.04), gloss: 0.04 }
  ),
  shadow: material(new pc.Color(0.07, 0.11, 0.17), { metalness: 0.25, gloss: 0.35 }),
  hull: material(new pc.Color(0.63, 0.68, 0.72), { metalness: 0.45, gloss: 0.52 }),
  white: material(new pc.Color(0.81, 0.85, 0.87), { metalness: 0.18, gloss: 0.38 }),
  orange: material(new pc.Color(0.91, 0.36, 0.17), { emissive: new pc.Color(0.09, 0.025, 0.008) }),
  blue: material(new pc.Color(0.11, 0.39, 0.55), { emissive: new pc.Color(0.015, 0.08, 0.14), metalness: 0.15 }),
  glass: material(new pc.Color(0.035, 0.21, 0.28), { emissive: new pc.Color(0.04, 0.42, 0.55), metalness: 0.2, gloss: 0.75 }),
  gold: material(new pc.Color(0.83, 0.6, 0.23), { emissive: new pc.Color(0.13, 0.07, 0.015), metalness: 0.5 })
};

const addBox = (
  name: string,
  position: pc.Vec3,
  scale: pc.Vec3,
  surface: pc.StandardMaterial,
  parent: pc.Entity = app.root
): pc.Entity => {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type: "box" });
  entity.setPosition(position);
  entity.setLocalScale(scale);
  entity.render!.material = surface;
  parent.addChild(entity);
  return entity;
};

const addSphere = (
  name: string,
  position: pc.Vec3,
  scale: pc.Vec3,
  surface: pc.StandardMaterial,
  parent: pc.Entity = app.root
): pc.Entity => {
  const entity = new pc.Entity(name);
  entity.addComponent("render", { type: "sphere" });
  entity.setPosition(position);
  entity.setLocalScale(scale);
  entity.render!.material = surface;
  parent.addChild(entity);
  return entity;
};

const surface = new pc.Entity("lunar-surface");
surface.addComponent("render", { type: "plane" });
surface.setLocalScale(180, 1, 180);
surface.setPosition(0, -0.5, 0);
surface.render!.material = mats.regolith;
app.root.addChild(surface);

const floorGrid = new pc.Entity("landing-pad");
floorGrid.addComponent("render", { type: "plane" });
floorGrid.setLocalScale(76, 1, 64);
floorGrid.setPosition(0, -0.42, -4);
floorGrid.render!.material = mats.shadow;
app.root.addChild(floorGrid);

const keyLight = new pc.Entity("sunlight");
keyLight.addComponent("light", {
  type: "directional",
  intensity: 1.8,
  castShadows: true,
  color: new pc.Color(0.82, 0.88, 1)
});
keyLight.setEulerAngles(48, 36, 0);
app.root.addChild(keyLight);

const fillLight = new pc.Entity("base-light");
fillLight.addComponent("light", {
  type: "omni",
  intensity: 1.05,
  range: 48,
  color: new pc.Color(0.25, 0.56, 0.78)
});
fillLight.setPosition(0, 12, 1);
app.root.addChild(fillLight);

const distantMoon = addSphere(
  "distant-moon",
  new pc.Vec3(-40, 37, -96),
  new pc.Vec3(24, 24, 24),
  material(new pc.Color(0.33, 0.38, 0.45), { emissive: new pc.Color(0.045, 0.06, 0.09), gloss: 0.1 })
);
distantMoon.rotate(2, 0, 0);

const craterMaterial = material(new pc.Color(0.2, 0.22, 0.25), { gloss: 0.01 });
let randomSeed = 41;
const random = (): number => {
  randomSeed = (randomSeed * 16807) % 2147483647;
  return (randomSeed - 1) / 2147483646;
};

for (let index = 0; index < 70; index += 1) {
  const x = (random() - 0.5) * 145;
  const z = (random() - 0.5) * 130;
  if (Math.abs(x) < 14 && z > -26 && z < 22) {
    continue;
  }
  const radius = 0.4 + random() * 1.5;
  const rock = addSphere(
    `lunar-rock-${index}`,
    new pc.Vec3(x, -0.18 + radius * 0.16, z),
    new pc.Vec3(radius * 1.5, radius * 0.48, radius),
    craterMaterial
  );
  rock.setEulerAngles(random() * 20, random() * 360, random() * 15);
}

const habitat = new pc.Entity("habitat-complex");
app.root.addChild(habitat);
addBox("operations-hull", new pc.Vec3(0, 2.2, -10), new pc.Vec3(15, 4.4, 8), mats.hull, habitat);
addBox("operations-roof", new pc.Vec3(0, 4.55, -10), new pc.Vec3(15.7, 0.35, 8.7), mats.white, habitat);
addBox("operations-mark", new pc.Vec3(0, 4.83, -10), new pc.Vec3(4.4, 0.13, 0.18), mats.orange, habitat);
addBox("left-habitat", new pc.Vec3(-12, 1.75, -5), new pc.Vec3(7, 3.5, 7), mats.white, habitat);
addBox("left-habitat-roof", new pc.Vec3(-12, 3.64, -5), new pc.Vec3(7.5, 0.3, 7.5), mats.blue, habitat);
addBox("right-lab", new pc.Vec3(12, 1.75, -5), new pc.Vec3(7, 3.5, 7), mats.hull, habitat);
addBox("right-lab-roof", new pc.Vec3(12, 3.64, -5), new pc.Vec3(7.5, 0.3, 7.5), mats.white, habitat);

for (const x of [-5, -2.5, 2.5, 5]) {
  addBox(`ops-window-${x}`, new pc.Vec3(x, 2.55, -5.94), new pc.Vec3(1.65, 1.15, 0.08), mats.glass, habitat);
}
for (const x of [-13.7, -11.8, -9.9]) {
  addBox(`hab-window-${x}`, new pc.Vec3(x, 2.1, -1.43), new pc.Vec3(0.9, 0.9, 0.06), mats.glass, habitat);
}
for (const x of [10.1, 12, 13.9]) {
  addBox(`lab-window-${x}`, new pc.Vec3(x, 2.1, -1.43), new pc.Vec3(0.9, 0.9, 0.06), mats.glass, habitat);
}

const consolePosition = new pc.Vec3(0, 0, -2.5);
addBox("mission-console-plinth", new pc.Vec3(0, 0.62, -2.4), new pc.Vec3(3.2, 1.24, 1.1), mats.shadow);
addBox("mission-console-screen-frame", new pc.Vec3(0, 1.95, -2.91), new pc.Vec3(3.35, 1.45, 0.2), mats.orange);
addBox("mission-console-screen", new pc.Vec3(0, 1.98, -2.78), new pc.Vec3(3.03, 1.14, 0.07), mats.glass);
addBox("mission-console-foot", new pc.Vec3(0, 1.24, -2.6), new pc.Vec3(0.18, 0.5, 0.18), mats.gold);

const dish = new pc.Entity("deep-space-antenna");
dish.addComponent("render", { type: "cylinder" });
dish.setPosition(20, 2, -15);
dish.setLocalScale(4.4, 0.3, 4.4);
dish.setEulerAngles(90, 0, 0);
dish.render!.material = mats.white;
app.root.addChild(dish);
addBox("antenna-mast", new pc.Vec3(20, 1, -15), new pc.Vec3(0.28, 2, 0.28), mats.hull);

const lander = new pc.Entity("lunar-lander");
app.root.addChild(lander);
addBox("lander-body", new pc.Vec3(-19, 2.5, 4), new pc.Vec3(3.7, 3.4, 3.7), mats.gold, lander);
addBox("lander-top", new pc.Vec3(-19, 4.35, 4), new pc.Vec3(2.4, 0.35, 2.4), mats.white, lander);
for (const [x, z] of [[-21, 2], [-17, 2], [-21, 6], [-17, 6]]) {
  addBox(`lander-leg-${x}-${z}`, new pc.Vec3(x, 0.9, z), new pc.Vec3(0.16, 2.5, 0.16), mats.hull, lander);
  addBox(`lander-foot-${x}-${z}`, new pc.Vec3(x, 0.18, z), new pc.Vec3(0.9, 0.16, 0.55), mats.white, lander);
}

const satellite = new pc.Entity("satellite-display");
app.root.addChild(satellite);
addBox("satellite-body", new pc.Vec3(18, 2, 8), new pc.Vec3(1.2, 1.4, 1.2), mats.white, satellite);
addBox("satellite-panel-left", new pc.Vec3(15.8, 2, 8), new pc.Vec3(3.2, 0.08, 1.15), mats.blue, satellite);
addBox("satellite-panel-right", new pc.Vec3(20.2, 2, 8), new pc.Vec3(3.2, 0.08, 1.15), mats.blue, satellite);
addSphere("satellite-orbit-marker", new pc.Vec3(18, 5.2, 8), new pc.Vec3(0.25, 0.25, 0.25), mats.orange, satellite);

const menuCamera = new pc.Entity("menu-camera");
menuCamera.addComponent("camera", {
  clearColor: new pc.Color(0.015, 0.025, 0.05),
  farClip: 220,
  fov: 52,
  toneMapping: pc.TONEMAP_ACES
});
menuCamera.camera?.requestSceneColorMap(true);
menuCamera.setPosition(0, 10, 25);
menuCamera.lookAt(0, 2, -8);
app.root.addChild(menuCamera);

const camera = new pc.Entity("first-person-camera");
camera.addComponent("camera", {
  clearColor: new pc.Color(0.015, 0.025, 0.05),
  farClip: 220,
  fov: 76,
  toneMapping: pc.TONEMAP_ACES
});
camera.camera?.requestSceneColorMap(true);
camera.enabled = false;

const player = new pc.Entity("astronaut-player");
player.setPosition(PLAYER_SPAWN);
camera.setLocalPosition(0, 1.66, 0);
player.addChild(camera);
app.root.addChild(player);

const assetErrors = new Map<string, string>();
const addNasaAsset = (
  name: string,
  url: string,
  position: pc.Vec3,
  targetHeight: number,
  modelYaw: number,
  parent: pc.Entity = app.root,
  onLoaded?: (model: pc.Entity) => void
): void => {
  const asset = new pc.Asset(name, "container", { url });
  app.assets.add(asset);
  asset.on("error", (error: Error) => {
    assetErrors.set(name, error.message);
    console.error(`NASA 3D asset "${name}" failed to load.`, error);
  });
  asset.ready(() => {
    if (!asset.resource) {
      assetErrors.set(name, "Asset was loaded without a renderable resource.");
      return;
    }
    const model = (asset.resource as pc.ContainerResource).instantiateRenderEntity();
    const renderComponents = model.findComponents("render") as pc.RenderComponent[];
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const component of renderComponents) {
      for (const instance of component.meshInstances) {
        minY = Math.min(minY, instance.aabb.getMin().y);
        maxY = Math.max(maxY, instance.aabb.getMax().y);
      }
    }
    const measuredHeight = maxY - minY;
    const scale = Number.isFinite(measuredHeight) && measuredHeight > 0
      ? targetHeight / measuredHeight
      : 1;
    model.setLocalScale(scale, scale, scale);
    model.setEulerAngles(0, modelYaw, 0);
    if (parent === player) {
      model.setLocalPosition(0, -minY * scale, 0);
    } else {
      model.setPosition(position.x, position.y - minY * scale, position.z);
    }
    parent.addChild(model);
    onLoaded?.(model);
  });
  app.assets.load(asset);
};

addNasaAsset(
  "NASA astronaut display",
  "/assets/nasa/Astronaut.glb",
  new pc.Vec3(-7.8, 0, 2.5),
  1.8,
  155
);

let astronautBody: pc.Entity | null = null;
let firstPerson = true;
addNasaAsset(
  "NASA astronaut player",
  "/assets/nasa/Astronaut.glb",
  new pc.Vec3(0, 0, 0),
  1.8,
  0,
  player,
  (model) => {
    astronautBody = model;
    for (const component of astronautBody.findComponents("render")) {
      component.enabled = !firstPerson;
    }
  }
);
addNasaAsset(
  "NASA Crab Nebula",
  "/assets/nasa/Crab-Nebula.glb",
  new pc.Vec3(26, 22, -56),
  10,
  24
);

const mainMenuButton = byId("newGame", HTMLButtonElement);
const optionsButton = byId("openOptions", HTMLButtonElement);
const closeOptionsButton = byId("closeOptions", HTMLButtonElement);
const pauseButton = byId("pauseGame", HTMLButtonElement);
const resumeButton = byId("resumeGame", HTMLButtonElement);
const pauseOptionsButton = byId("pauseOptions", HTMLButtonElement);
const backToMenuButton = byId("backToMenu", HTMLButtonElement);
const openConsoleButton = byId("openConsole", HTMLButtonElement);
const closeConsoleButton = byId("closeConsole", HTMLButtonElement);

let inWorld = false;
let paused = false;
let consoleOpen = false;
let optionsReturn: "menu" | "pause" = "menu";
let canUseConsole = false;
let yaw = 0;
let pitch = 0;
let elapsed = 0;

const saveSettings = (): void => {
  settings = {
    sensitivity: Number(mouseSensitivity.value),
    walkSpeed: Number(walkSpeed.value)
  };
  sensitivityValue.value = settings.sensitivity.toFixed(2);
  speedValue.value = settings.walkSpeed.toFixed(1);
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    saveHint.textContent = "Impossibile salvare le opzioni in questo browser.";
  }
};

mouseSensitivity.addEventListener("input", saveSettings);
walkSpeed.addEventListener("input", saveSettings);

const requestPointerLock = (): void => {
  if (inWorld && !paused && !consoleOpen && document.pointerLockElement !== canvas) {
    void canvas.requestPointerLock();
  }
};

const enterWorld = (loadSavedGame: boolean): void => {
  if (!loadSavedGame && saveExists()) {
    const confirmed = window.confirm(
      "Iniziando una nuova partita, il salvataggio Go-No-Go esistente verrà sostituito. Continuare?"
    );
    if (!confirmed) {
      return;
    }
  }

  inWorld = true;
  paused = false;
  consoleOpen = false;
  mainMenu.hidden = true;
  optionsMenu.hidden = true;
  pauseMenu.hidden = true;
  missionConsole.hidden = true;
  gameHud.hidden = false;
  menuCamera.enabled = false;
  camera.enabled = true;
  legacyGame.src = "about:blank";
  if (!loadSavedGame) {
    legacyGame.dataset.startMode = "new";
    worldMessage.textContent = "La missione inizia qui. Avvicinati alla console operativa.";
  } else {
    legacyGame.dataset.startMode = "load";
    worldMessage.textContent = "Partita caricata. Interagisci con la console per riprendere la missione.";
  }
  player.setPosition(PLAYER_SPAWN);
  yaw = 0;
  pitch = 0;
  requestPointerLock();
};

const openMissionConsole = (): void => {
  if (!inWorld || !canUseConsole) {
    worldMessage.textContent = "Avvicinati alla console di missione per interagire.";
    return;
  }
  consoleOpen = true;
  interactionPrompt.hidden = true;
  missionConsole.hidden = false;
  if (legacyGame.src === "about:blank" || legacyGame.src === "") {
    const mode = legacyGame.dataset.startMode === "new" ? "?new=1" : "";
    legacyGame.src = `/legacy-game.html${mode}`;
  }
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
};

const closeMissionConsole = (): void => {
  consoleOpen = false;
  missionConsole.hidden = true;
  updateLoadButton();
};

const showOptions = (returnTo: "menu" | "pause"): void => {
  optionsReturn = returnTo;
  optionsMenu.hidden = false;
  if (returnTo === "pause") {
    pauseMenu.hidden = true;
  } else {
    mainMenu.hidden = true;
  }
};

const closeOptions = (): void => {
  optionsMenu.hidden = true;
  if (optionsReturn === "pause") {
    pauseMenu.hidden = false;
  } else {
    mainMenu.hidden = false;
  }
};

const pause = (): void => {
  if (!inWorld || consoleOpen) {
    return;
  }
  paused = true;
  pauseMenu.hidden = false;
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
};

const resume = (): void => {
  paused = false;
  pauseMenu.hidden = true;
  requestPointerLock();
};

const returnToMenu = (): void => {
  inWorld = false;
  paused = false;
  consoleOpen = false;
  pauseMenu.hidden = true;
  gameHud.hidden = true;
  missionConsole.hidden = true;
  mainMenu.hidden = false;
  camera.enabled = false;
  menuCamera.enabled = true;
  firstPerson = true;
  camera.setLocalPosition(0, 1.66, 0);
  if (astronautBody) {
    for (const component of astronautBody.findComponents("render")) {
      component.enabled = false;
    }
  }
  legacyGame.src = "about:blank";
  updateLoadButton();
  if (document.pointerLockElement) {
    document.exitPointerLock();
  }
};

mainMenuButton.addEventListener("click", () => enterWorld(false));
loadGameButton.addEventListener("click", () => {
  if (saveExists()) {
    enterWorld(true);
  }
});
optionsButton.addEventListener("click", () => showOptions("menu"));
closeOptionsButton.addEventListener("click", closeOptions);
pauseButton.addEventListener("click", pause);
resumeButton.addEventListener("click", resume);
pauseOptionsButton.addEventListener("click", () => showOptions("pause"));
backToMenuButton.addEventListener("click", returnToMenu);
openConsoleButton.addEventListener("click", openMissionConsole);
closeConsoleButton.addEventListener("click", closeMissionConsole);
canvas.addEventListener("click", requestPointerLock);
document.addEventListener("pointerlockchange", () => {
  pointerHint.textContent = document.pointerLockElement === canvas
    ? "WASD · mouse · E interagisci · Esc libera il mouse"
    : "Clicca nel mondo per catturare il mouse";
});

window.addEventListener("mousemove", (event) => {
  if (!inWorld || paused || consoleOpen || document.pointerLockElement !== canvas) {
    return;
  }
  yaw -= event.movementX * settings.sensitivity * 0.01;
  pitch = Math.max(-1.35, Math.min(1.35, pitch - event.movementY * settings.sensitivity * 0.01));
});

window.addEventListener("keydown", (event) => {
  if (event.code === "Escape") {
    if (consoleOpen) {
      closeMissionConsole();
    }
    return;
  }
  if (!inWorld || paused || consoleOpen || event.repeat) {
    return;
  }
  if (event.code === "KeyE" && canUseConsole) {
    openMissionConsole();
  } else if (event.code === "KeyP") {
    pause();
  } else if (event.code === "KeyV") {
    firstPerson = !firstPerson;
    camera.setLocalPosition(0, firstPerson ? 1.66 : 3.2, firstPerson ? 0 : 5.2);
    if (astronautBody) {
      for (const component of astronautBody.findComponents("render")) {
        component.enabled = !firstPerson;
      }
    }
    worldMessage.textContent = firstPerson
      ? "Vista in prima persona attiva. Premi V per vedere l’astronauta."
      : "Vista esterna attiva. Premi V per tornare in prima persona.";
  }
});

const movementKeys = new pc.Keyboard(window);
app.on("update", (dt: number) => {
  elapsed += dt;
  satellite.rotate(0, 8 * dt, 0);
  distantMoon.rotate(0, 0.2 * dt, 0);

  if (!inWorld || paused || consoleOpen) {
    return;
  }

  const forwardInput =
    Number(movementKeys.isPressed(pc.KEY_W) || movementKeys.isPressed(pc.KEY_UP)) -
    Number(movementKeys.isPressed(pc.KEY_S) || movementKeys.isPressed(pc.KEY_DOWN));
  const sideInput =
    Number(movementKeys.isPressed(pc.KEY_D) || movementKeys.isPressed(pc.KEY_RIGHT)) -
    Number(movementKeys.isPressed(pc.KEY_A) || movementKeys.isPressed(pc.KEY_LEFT));
  const inputLength = Math.hypot(forwardInput, sideInput);

  if (inputLength > 0) {
    const forwardX = Math.sin(yaw);
    const forwardZ = -Math.cos(yaw);
    const rightX = Math.cos(yaw);
    const rightZ = Math.sin(yaw);
    const distance = settings.walkSpeed * dt / inputLength;
    const nextX = player.getPosition().x + (forwardX * forwardInput + rightX * sideInput) * distance;
    const nextZ = player.getPosition().z + (forwardZ * forwardInput + rightZ * sideInput) * distance;
    player.setPosition(Math.max(-40, Math.min(40, nextX)), 0, Math.max(-40, Math.min(35, nextZ)));
  }

  camera.setLocalEulerAngles(pitch * pc.math.RAD_TO_DEG, yaw * pc.math.RAD_TO_DEG, 0);
  const playerPosition = player.getPosition();
  const distanceToConsole = Math.hypot(
    playerPosition.x - consolePosition.x,
    playerPosition.z - consolePosition.z
  );
  canUseConsole = distanceToConsole < 5.3;
  interactionPrompt.hidden = !canUseConsole;
  if (canUseConsole) {
    worldMessage.textContent = "Console operativa disponibile: premi E per aprire il gioco Go-No-Go.";
  }
});

const healthStatus = document.createElement("span");
healthStatus.id = "backendStatus";
healthStatus.textContent = "BACKEND · verifica…";
document.querySelector(".menu-footer")?.prepend(healthStatus);

fetch("/api/health")
  .then((response) => {
    if (!response.ok) {
      throw new Error(`Backend returned ${response.status}.`);
    }
    return response.json() as Promise<{ status?: string }>;
  })
  .then((health) => {
    healthStatus.textContent = health.status === "ok" ? "BACKEND · online" : "BACKEND · risposta inattesa";
  })
  .catch((error: unknown) => {
    healthStatus.textContent = "BACKEND · non raggiungibile";
    console.error("Game backend health check failed.", error);
  });

app.start();
updateLoadButton();
window.setTimeout(() => loadingScreen.classList.add("ready"), 550);
