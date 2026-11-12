import { readFile, readdir, stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";

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
