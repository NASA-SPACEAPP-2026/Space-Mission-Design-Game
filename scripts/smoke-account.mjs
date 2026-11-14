// Real-browser entry/account smoke with temporary PostgreSQL. Never uses real accounts.
import { PGlite } from '@electric-sql/pglite';
import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createStaticServer } from '../server.mjs';
import { createAuth } from '../backend/auth.mjs';
import { migrate } from '../backend/database.mjs';
const db = new PGlite(); await db.waitReady;
await migrate({query: sql => db.exec(sql)});
let auth;
const server = createStaticServer({auth:(...args)=>auth(...args)});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
auth = createAuth({db,origin,secure:false});
let browser;
try {
  browser = await chromium.launch({executablePath:process.env.CHROME_PATH,headless:true});
  const context = await browser.newContext({viewport:{width:1440,height:900}});
  const page = await context.newPage(); const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const newGame = '#title [data-act="ttl"][data-s="modes"]';
  await page.goto(origin);
  // The game's own title screen is the home page: no splash, no account form until the visitor tries to enter.
  await page.locator('#title .tmenu').waitFor({state:'visible',timeout:8000});
  assert.equal(await page.locator('#entry-splash').count(),0);
  assert.ok(await page.locator('#account-entry').isHidden());
  assert.ok(await page.locator('#entry-art svg').count());
  await page.screenshot({path:'dist/entry-title.png'});
  await page.waitForTimeout(2000);
  assert.ok(await page.locator('#account-entry').isHidden());
  // Settings stay reachable without an account; entering the game does not.
  await page.locator(newGame).click();
  await page.locator('#entry-panel').waitFor({state:'visible',timeout:8000});
  assert.equal(await page.locator('#title .tmodes').count(),0);
  assert.equal(await page.locator('#account-form input').count(),2);
  await page.screenshot({path:'dist/entry-register.png'});
  await page.setViewportSize({width:390,height:844});
  assert.ok(await page.locator('#account-submit').isVisible());
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:'dist/entry-mobile.png'});
  await page.setViewportSize({width:1440,height:900});
  // Dismissing the form (button or Escape) returns to the menu without granting access.
  await page.locator('#account-back').click();
  await page.locator('#account-entry').waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>window.gngUser),undefined);
  await page.locator('#title .tmenu').waitFor({state:'visible'});
  await page.locator(newGame).click();
  await page.locator('#entry-panel').waitFor({state:'visible'});
  await page.keyboard.press('Escape');
  await page.locator('#account-entry').waitFor({state:'hidden'});
  await page.locator(newGame).click();
  await page.locator('#entry-panel').waitFor({state:'visible'});
  await page.locator('[name=username]').fill('BrowserPilot');
  await page.locator('[name=password]').fill('my unique browser password 123');
  await page.locator('#password-show').click();
  assert.equal(await page.locator('[name=password]').getAttribute('type'),'text');
  await page.locator('#account-submit').click();
  // After signing up the interrupted action continues: the mode picker opens on the title screen.
  await page.locator('#account-entry').waitFor({state:'hidden'});
  await page.locator('#title .tmodes').waitFor({state:'visible'});
  assert.equal((await page.evaluate(()=>window.gngUser)).username,'BrowserPilot');
  const cookie=(await context.cookies()).find(c=>c.name==='gng_session');
  assert.equal(cookie.httpOnly,true); assert.equal(cookie.sameSite,'Lax');
  assert.equal((await db.query('SELECT email FROM users')).rows[0].email,null);
  await page.reload();
  await page.locator('#title .tmenu').waitFor({state:'visible'});
  await page.locator(newGame).click();
  await page.locator('#title .tmodes').waitFor({state:'visible'});
  assert.ok(await page.locator('#account-entry').isHidden());
  // The account button hides on menu screens with their own bottom-right buttons; the main menu shows it.
  assert.ok(await page.locator('#account-open').isHidden());
  await page.locator('#title [data-act="tback"]').click();
  await page.locator('#account-open').click();
  await page.locator('#account-logout').click();
  await page.locator('#title .tmenu').waitFor({state:'visible'});
  await page.locator(newGame).click();
  await page.locator('#entry-panel').waitFor({state:'visible'});
  await page.locator('#account-toggle').click();
  await page.locator('[name=username]').fill('BrowserPilot');
  await page.locator('[name=password]').fill('wrong password');
  await page.locator('#account-submit').click();
  await page.waitForFunction(()=>document.querySelector('#account-message')?.textContent.includes('Credenziali'));
  assert.ok(await page.locator('#account-entry').isVisible());
  await page.locator('[name=password]').fill('my unique browser password 123');
  await page.locator('#account-submit').click();
  await page.locator('#account-entry').waitFor({state:'hidden'});
  await page.locator('#title .tmodes').waitFor({state:'visible'});
  await context.close();
  // Service failure must not grant access or hide the form.
  const other = await browser.newContext({viewport:{width:844,height:390}});
  const failed = await other.newPage();
  await failed.route('**/api/auth/**',route=>route.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Servizio account temporaneamente non disponibile'})}));
  await failed.goto(origin); await failed.locator(newGame).click();
  await failed.locator('#entry-panel').waitFor({state:'visible'});
  await failed.locator('[name=username]').fill('Unavailable');
  await failed.locator('[name=password]').fill('my unique browser password 123');
  await failed.locator('#account-submit').click();
  await failed.waitForFunction(()=>!document.querySelector('#account-submit').disabled);
  assert.equal(await failed.locator('#title .tmodes').count(),0);
  assert.equal(await failed.evaluate(()=>window.gngUser),undefined);
  assert.ok(await failed.locator('#account-message').innerText());
  await other.close();
  // Exercise the regular gameplay smoke against this disposable server/account too.
  const gameplay = await promisify(execFile)(process.execPath, ['scripts/smoke.mjs'], {
    env: {...process.env, BASE_URL:origin, GNG_USERNAME:'BrowserPilot', GNG_PASSWORD:'my unique browser password 123'},
    timeout:60000
  });
  console.log(gameplay.stdout);
  const english = await browser.newContext({reducedMotion:'reduce'});
  await english.addInitScript(()=>localStorage.setItem('gngLang','en'));
  const keyboard = await english.newPage();
  await keyboard.goto(origin);
  await keyboard.locator('#title .tmenu').waitFor({state:'visible'});
  await keyboard.locator(newGame).focus();
  await keyboard.keyboard.press('Enter');
  await keyboard.locator('#entry-panel').waitFor({state:'visible'});
  assert.equal(await keyboard.locator('#account-submit').textContent(),'Create account & play');
  await english.close();
  assert.deepEqual(errors,[]);
  console.log('Entry smoke passed: original title screen as home page, account gate on New game, dismiss with button/Escape, username-only signup, continuing the interrupted action, session reload, logout, wrong password, service failure, mobile, cookies. Screenshots in dist/entry-*.png');
} finally { if(browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); await db.close(); }
