#!/usr/bin/env node
/*
 * Optional browser smoke test for the static 2D game.
 *
 * Usage:
 *   npm run build && npm start
 *   BASE_URL=http://localhost:8080 npm run smoke
 *
 * Set CHROME_PATH to use a specific browser. Otherwise the script looks in the
 * Playwright cache and in the usual macOS application path.
 */
import { existsSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

const baseUrl = process.env.BASE_URL ?? "http://localhost:8080";

const browserCandidates = [];
if (process.env.CHROME_PATH) browserCandidates.push(process.env.CHROME_PATH);
for (const cache of [
  join(homedir(), "Library/Caches/ms-playwright"),
  join(homedir(), ".cache/ms-playwright")
]) {
  if (!existsSync(cache)) continue;
  for (const entry of readdirSync(cache)) {
    if (!entry.startsWith("chromium-")) continue;
    const base = join(cache, entry);
    browserCandidates.push(
      join(base, "chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
      join(base, "chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing"),
      join(base, "chrome-linux/chrome"),
      join(base, "chrome-headless-shell-mac-arm64/chrome-headless-shell"),
      join(base, "chrome-headless-shell-mac-x64/chrome-headless-shell"),
      join(base, "chrome-headless-shell-linux/chrome-headless-shell")
    );
  }
}
browserCandidates.push(
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium"
);
const executablePath = browserCandidates.find((path) => existsSync(path));

if (!executablePath) {
  console.error("No Chromium found. Set CHROME_PATH or install a browser.");
  process.exit(1);
}

const problems = [];
const browser = await chromium.launch({ executablePath, headless: true });
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    locale: "it-IT"
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => problems.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(`console: ${message.text()}`);
  });

  await page.goto(baseUrl, { waitUntil: "load" });
  await page.waitForSelector("#ov:not([hidden])", { timeout: 10_000 });
  const welcome = await page.locator("#ov").innerText();
  if (!/Fonda la tua agenzia|Found your space agency/i.test(welcome)) {
    problems.push("welcome dialog not found");
  }

  await page.click('[data-act="startskip"]');
  await page.waitForFunction(() => document.querySelector("#ov")?.hidden === true, null, {
    timeout: 10_000
  });
  await page.waitForSelector("#view:not(:empty)", { timeout: 10_000 });

  const hud = await page.locator("#hud").innerText();
  if (!/crediti|Crediti|Missione|Campus/i.test(hud)) {
    problems.push("HUD did not render after starting a game");
  }

  await page.screenshot({ path: "/tmp/gng-smoke.png", fullPage: false });
  console.log(`Smoke test at ${baseUrl}`);
  console.log(`Title: ${await page.title()}`);
  console.log(`HUD: ${hud.replace(/\s+/g, " ").slice(0, 160)}`);
  console.log("Screenshot: /tmp/gng-smoke.png");

  if (problems.length) {
    console.error("Problems:");
    for (const problem of problems) console.error(`- ${problem}`);
    process.exitCode = 1;
  } else {
    console.log("No page or console errors.");
  }
} finally {
  await browser.close();
}
