#!/usr/bin/env node
/*
 * Optional browser smoke test for the static game.
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
  if (!process.env.GNG_USERNAME || !process.env.GNG_PASSWORD) {
    throw new Error('Set GNG_USERNAME and GNG_PASSWORD for an existing test account, or use node scripts/smoke-account.mjs for a temporary database.');
  }
  await page.click('#entry-splash');
  await page.waitForSelector('#entry-panel', { timeout: 20_000 });
  await page.click('#account-toggle');
  await page.fill('[name="username"]', process.env.GNG_USERNAME);
  await page.fill('[name="password"]', process.env.GNG_PASSWORD);
  await page.click('#account-submit');
  await page.waitForSelector('#account-entry', { state: 'detached', timeout: 20_000 });
  await page.waitForSelector("#view:not(:empty)", { timeout: 10_000 });

  const hud = await page.locator("#hud").innerText();
  if (!/crediti|credits|Missione|Mission|Campus/i.test(hud)) {
    problems.push("HUD did not render after starting a game");
  }

  await page.screenshot({ path: "dist/game-smoke.png", fullPage: false });
  console.log(`Smoke test at ${baseUrl}`);
  console.log(`Title: ${await page.title()}`);
  console.log(`HUD: ${hud.replace(/\s+/g, " ").slice(0, 160)}`);
  console.log("Screenshot: dist/game-smoke.png");

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
