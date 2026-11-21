/* Screenshot + playtest driver for MOTHLIGHT. Usage:
 *   node shots.mjs shots     — capture the 4 screenshots to screenshots/
 *   node shots.mjs playtest  — drive the real game: move, get spotted, win
 * Served from http://localhost:8080 (node serve.ts).
 */
import { chromium } from 'playwright-core';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8080';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
const SHOTS = JSON.parse(readFileSync(new URL('./shots.json', import.meta.url), 'utf8'));

async function launch() {
  return chromium.launch({ args: ['--no-sandbox', '--disable-gpu'] });
}

async function shot(browser, name, query) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 480 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  const requests = [];
  page.on('request', r => requests.push(r.url()));
  await page.goto(BASE + '/' + query, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  const path = OUT + name;
  await page.screenshot({ path, type: 'jpeg', quality: 88 });
  console.log(name, 'errors:', errors.length ? errors : 'none',
    '| requests:', requests.length, requests.join(' ') || '(none — but page load itself counts)');
  await page.close();
}

async function playtest(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 480 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push(String(e)));
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const state = () => page.evaluate(() => ({
    screen, levelIndex, time: Math.round(time * 10) / 10,
    player: { x: Math.round(player.x), y: Math.round(player.y) },
    petalsLeft: petalsLeft(), alert: Math.round(alertLevel()),
    wardens: level.wardens.map(w => ({ mode: w.mode, sus: Math.round(w.suspicion) })),
  }));

  console.log('title:', JSON.stringify(await state()));
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  console.log('after Enter:', JSON.stringify(await state()));

  // Move right + down for a while; player must actually move.
  const before = (await state()).player;
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyD');
  await page.keyboard.down('KeyS');
  await page.waitForTimeout(800);
  await page.keyboard.up('KeyS');
  const after = (await state()).player;
  console.log('moved from', JSON.stringify(before), 'to', JSON.stringify(after),
    '| moved:', before.x !== after.x || before.y !== after.y);

  // Walk into the open in front of warden 1 and stand still: he must spot us
  // (suspicion -> 100), chase, and catch us (lose path).
  await page.evaluate(() => {
    const w = level.wardens[0];
    player.x = w.x + Math.cos(w.dir) * 70;
    player.y = w.y + Math.sin(w.dir) * 70;
    player.hidden = false;
  });
  let lost = false;
  for (let i = 0; i < 20; i += 1) {
    const s = await state();
    console.log('spot check t=' + s.time + 's alert=' + s.alert + ' wardens=' + JSON.stringify(s.wardens) + ' screen=' + s.screen);
    if (s.screen === 'lost') { lost = true; break; }
    await page.waitForTimeout(500);
  }
  console.log('LOSE confirmed:', lost);
  await page.screenshot({ path: '/tmp/playtest-lose.jpg', type: 'jpeg', quality: 85 });

  // Restart and win: drive with the game's own autopilot + update loop
  // (the same steering the play screenshot uses), through all petals to the gate.
  await page.keyboard.press('KeyR');
  await page.waitForTimeout(300);
  console.log('after R:', JSON.stringify(await state()));
  await page.evaluate(() => {
    window.__drive = setInterval(() => {
      if (screen !== 'play') { clearInterval(window.__drive); return; }
      autopilot(STEP);
      update(STEP);
    }, 16);
  });
  let won = false;
  for (let i = 0; i < 90; i += 1) {
    await page.waitForTimeout(2000);
    const s = await state();
    if (i % 5 === 0) console.log('win drive t=' + s.time + 's petalsLeft=' + s.petalsLeft + ' player=' + JSON.stringify(s.player) + ' screen=' + s.screen);
    if (s.screen === 'won') { won = true; break; }
    if (s.screen === 'lost') { console.log('autopilot got CAUGHT at', JSON.stringify(s)); break; }
  }
  console.log('WIN confirmed:', won, JSON.stringify(await state()));
  await page.screenshot({ path: '/tmp/playtest-win.jpg', type: 'jpeg', quality: 85 });
  console.log('console errors:', errors.length ? errors : 'none');
  await page.close();
}

const mode = process.argv[2] || 'shots';
const browser = await launch();
try {
  if (mode === 'playtest') await playtest(browser);
  else { mkdirSync(OUT, { recursive: true }); for (const s of SHOTS) await shot(browser, s.name, s.query); }
} finally { await browser.close(); }
console.log('done');
