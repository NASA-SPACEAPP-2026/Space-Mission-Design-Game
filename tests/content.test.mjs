import { readFile, readdir, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { runInNewContext } from "node:vm";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const gameSources = async () => {
  const directory = new URL("../public/game/", import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith(".js")).sort();
  const contents = await Promise.all(files.map((name) => readFile(new URL(name, directory), "utf8")));
  return { files, joined: contents.join("\n") };
};

describe("game shell", () => {
  it("keeps the game entry point and loads the split scripts in order", async () => {
    const html = await read("index.html");
    expect(html).toContain("<title>Go No-Go</title>");
    const scripts = [...html.matchAll(/<script src="\/game\/([^"]+)"/g)].map((match) => match[1]);
    expect(scripts).toEqual([
      "00-three.js",
      "00-toon.js",
      "01-data.js",
      "02-orbit.js",
      "03-logic.js",
      "04-stubs.js",
      "05-campus.js",
      "06-rooms.js",
      "08-minigames.js",
      "09-consortia.js",
      "07-main.js"
    ]);
  });

  it("keeps the save contract in the game sources", async () => {
    const { joined } = await gameSources();
    expect(joined).toContain("gng32.save");
    expect(joined).toContain("localStorage");
  });

  it("loads the satellite and orbit 3D editors", async () => {
    const three = await read("public/game/00-three.js");
    const editors = await read("public/game/04-stubs.js");
    expect(three).toContain("THREE");
    expect(editors).toContain("const S3 =");
    expect(editors).toContain("const FD3 =");
  });

  it("streams the soundtrack instead of embedding it", async () => {
    const { joined } = await gameSources();
    expect(joined).not.toContain("b64:");
    expect(joined).toMatch(/MUS=\{url:'\/audio\/theme\.mp3\?v=[a-f0-9]+'/);
    const audio = await stat(new URL("../public/audio/theme.mp3", import.meta.url));
    expect(audio.size).toBeGreaterThan(500_000);
  });


  it("self-hosts the fonts", async () => {
    const html = await read("index.html");
    expect(html).toContain("@font-face");
    expect(html).toContain("/fonts/ibm-plex-sans.woff2");
    const fonts = (await readdir(new URL("../public/fonts/", import.meta.url))).filter((name) =>
      name.endsWith(".woff2")
    );
    expect(fonts.length).toBeGreaterThanOrEqual(6);
  });

  it("keeps the HTML shell small", async () => {
    const shell = await stat(new URL("../index.html", import.meta.url));
    expect(shell.size).toBeLessThan(200_000);
  });

  it("does not reference the removed backend or 3D scene", async () => {
    const html = await read("index.html");
    const { joined } = await gameSources();
    for (const text of [html, joined]) {
      expect(text).not.toContain("app/backend");
      expect(text).not.toContain("localhost:8080");
      expect(text).not.toContain("playcanvas");
      expect(text).not.toContain("Astronaut.glb");
    }
  });
});


describe("ported mission rules", () => {
  it("connects each new destination to its orbit and launcher", async () => {
    const sources = await Promise.all(["01-data.js", "02-orbit.js", "03-logic.js"].map((name) => read(`public/game/${name}`)));
    const { E, O, L } = runInNewContext(`${sources.join("\n")}\n;({ E, O, L })`);
    expect(Object.keys(E.EXT)).toHaveLength(7);
    for (const [key, body] of Object.entries(E.EXT)) {
      expect(E.DEST[key]).toBeDefined();
      expect(O.BODY[key]).toBeDefined();
      expect(O.ZONES[key]).toHaveLength(body.zones.length);
      expect(E.LV[body.ride].dest).toContain(key);
      expect(E.lvCost({ lv: body.ride, dest: key })).toBe(body.c);
    }
    expect(L.LW.joy).toBe(25);
    expect(L.LW.pay).toBe(0.15);
    expect(L.TIME.win).toBe(0);
  });

  it("makes the thruster take two or three times the cells with a bigger tank", async () => {
    const sources = await Promise.all(["01-data.js"].map((name) => read(`public/game/${name}`)));
    const { E } = runInNewContext(`${sources.join("\n")}\n;({ E })`);
    const cells = (tank) => E.shape("BASE-CG", 0, "S3", tank).length;
    expect(cells(2)).toBe(cells(1) * 2);
    expect(cells(3)).toBe(cells(1) * 3);
    const sat = { ride: "S3", placed: {}, heat: {}, acc: {}, stake: [], tank: 2 };
    const placed = E.autoPlace(sat, "BASE-CG", 0);
    expect(placed.tk).toBe(2);
    expect(E.cellsOf(placed, "S3")).toHaveLength(cells(2));
    const other = Object.keys(E.PARTS).find((id) => E.PARTS[id].cat !== "prop");
    expect(E.shape(other, 0, "S3", 3)).toHaveLength(E.shape(other, 0, "S3").length);
  });

  it("applies the launch-window reduction to future instalments", async () => {
    const sources = await Promise.all(["01-data.js", "02-orbit.js", "03-logic.js"].map((name) => read(`public/game/${name}`)));
    const { L } = runInNewContext(`${sources.join("\n")}\n;({ L })`);
    const mission = L.newMission("test", "Mission");
    mission.stake = ["nasa"];
    const original = L.installment(mission, "FRR");
    mission.payK = 0.85;
    expect(original).toBeGreaterThan(0);
    expect(Math.abs(L.installment(mission, "FRR") - original * 0.85)).toBeLessThanOrEqual(1);
  });
});

describe("level 1 battery", () => {
  it("a starter Earth satellite with the camera passes the battery check before the orbit is planned", async () => {
    const mod = { exports: {} };
    new Function("module", await read("public/game/01-data.js"))(mod);
    const E = mod.exports;
    const d = { dest: "leo", ride: "S3", sol: "BASE-SOL3D", heat: {}, acc: {}, placed: {}, stake: [] };
    for (const [cat, id] of [["avi", "BASE-OBC"], ["adcs", "BASE-MAG"], ["bat", "BASE-BAT20"], ["com", "BASE-UHF"], ["ray", "BASE-CAM"]]) d.placed[cat] = { id };
    const b = E.budget(d);
    expect(b.wh).toBe(30);
    expect(b.dod).toBeLessThanOrEqual(E.M.dodMax);
    expect(E.checks(d).list.find((x) => x.k === "bat").ok).toBe(true);
  });
});

describe("unlocks follow doability", () => {
  const load = async () => {
    const sources = await Promise.all(["01-data.js", "02-orbit.js", "03-logic.js"].map((name) => read(`public/game/${name}`)));
    return runInNewContext(`${sources.join("\n")}\n;({ E, O, L })`);
  };
  const mission = (L, dest, zone, type, lvl) => {
    const m = L.newMission("t", `p-${dest}-${zone}-${type}-${lvl}`);
    Object.assign(m, { zone, type, lvl, lvlNow: lvl, seed: 12345, stake: ["nasa"], padOwned: lvl >= 20 });
    m.sat.dest = dest;
    m.sat.stake = m.stake;
    return m;
  };
  const types = (E, O, dest, z) =>
    Object.keys(O.TYPES).filter((t) => !(z.surf && ["tel", "com", "deb"].includes(t)) && (!E.EXT[dest] || E.EXT[dest].types.includes(t)));

  it("every zone has a doable mission at the level it unlocks", async () => {
    const { E, O, L } = await load();
    for (const [dest, zones] of Object.entries(O.ZONES)) {
      expect(E.DEST[dest].lvl, dest).toBe(Math.min(...zones.map((z) => z.lvl)));
      for (const z of zones) {
        const ok = types(E, O, dest, z).some((t) => L.typeOK(mission(L, dest, z.k, t, z.lvl)));
        expect(ok, `${dest}/${z.k} at level ${z.lvl}`).toBe(true);
      }
    }
  }, 300_000);

  it("Mars surface and debris beyond Earth are doable by level 20", async () => {
    const { L } = await load();
    for (const [dest, zone, type] of [["mars", "surf", "sci"], ["moon", "low", "deb"], ["mars", "low", "deb"], ["venus", "low", "deb"]])
      expect(L.typeOK(mission(L, dest, zone, type, 20)), `${dest}/${zone}/${type}`).toBeTruthy();
  }, 120_000);
});
