import * as pc from "playcanvas";
import "./style.css";

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

const goButton = document.getElementById("goButton");
const noGoButton = document.getElementById("noGoButton");
const power = document.getElementById("power");

if (!goButton || !noGoButton || !power) {
  throw new Error("HUD controls not found.");
}

goButton.addEventListener("click", () => {
  power.textContent = "5.4 kW / 6.0 kW";
  missionMarker.setLocalPosition(10, 2.6, -8);
});

noGoButton.addEventListener("click", () => {
  power.textContent = "6.4 kW / 6.0 kW";
  missionMarker.setLocalPosition(10, 1.5, -8);
});

let elapsed = 0;
app.on("update", (dt: number) => {
  elapsed += dt;
  earth.rotate(0, 8 * dt, 0);
  orbit.rotate(0, 0, 4 * dt);
  missionMarker.setLocalEulerAngles(0, 0, Math.sin(elapsed * 3) * 6);
  camera.setLocalPosition(Math.sin(elapsed * 0.12) * 8, 28, 64);
  camera.lookAt(0, 6, 0);
});
