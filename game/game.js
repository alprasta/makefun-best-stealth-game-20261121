/* MOTHLIGHT — A Quiet Heist.
 * A top-down stealth game, written from scratch for this entry. You are Wisp, a
 * moth-burglar slipping through a moonlit garden manor. Lantern wardens patrol
 * with visible cones of lamplight; shadow shrubs hide you, lamp pools expose
 * you. Gather every moonpetal, then reach the moon gate unseen. One canvas,
 * no libraries, no network, sounds made live with WebAudio. */
'use strict';

const W = 1280, H = 480;            // logical canvas size (the game is framed for it)
const HUD_H = 46;                   // top strip reserved for the HUD
const FLOOR = { x: 6, y: HUD_H + 4, w: W - 12, h: H - HUD_H - 10 };
const STEP = 1 / 60;
const TAU = Math.PI * 2;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');

/* ---------------- levels: walls, shrubs, lamps, wardens, petals, gate -------- */
function levelData(n) {
  if (n === 1) return {
    name: 'I · The Garden Gate', par: 95,
    start: { x: 86, y: 418 },
    gate: { x: 1168, y: 66, w: 78, h: 62 },
    petals: [{ x: 640, y: 122 }, { x: 296, y: 252 }, { x: 1004, y: 386 }],
    walls: [
      { x: 300, y: 50, w: 24, h: 190 }, { x: 300, y: 330, w: 24, h: 140 },
      { x: 560, y: 50, w: 24, h: 88 }, { x: 560, y: 204, w: 24, h: 266 },
      { x: 820, y: 132, w: 24, h: 338 }, { x: 820, y: 50, w: 24, h: 40 },
      { x: 96, y: 176, w: 150, h: 24 }, { x: 648, y: 344, w: 252, h: 24 },
      { x: 900, y: 216, w: 208, h: 24 }, { x: 1080, y: 330, w: 120, h: 24 },
    ],
    shrubs: [
      { x: 196, y: 386, r: 36 }, { x: 452, y: 118, r: 34 }, { x: 700, y: 424, r: 36 },
      { x: 948, y: 108, r: 34 }, { x: 1120, y: 300, r: 34 }, { x: 148, y: 92, r: 32 },
      { x: 430, y: 300, r: 30 },
    ],
    lamps: [
      { x: 420, y: 96, r: 92 }, { x: 700, y: 250, r: 96 }, { x: 1000, y: 196, r: 92 },
      { x: 500, y: 404, r: 88 },
    ],
    wardens: [
      { x: 452, y: 92, wp: [{ x: 452, y: 92 }, { x: 452, y: 402 }], speed: 52 },
      { x: 700, y: 386, wp: [{ x: 700, y: 386 }, { x: 1052, y: 386 }], speed: 58 },
    ],
  };
  if (n === 2) return {
    name: 'II · The Lantern Court', par: 115,
    start: { x: 86, y: 92 },
    gate: { x: 1168, y: 386, w: 78, h: 62 },
    petals: [{ x: 420, y: 380 }, { x: 760, y: 120 }, { x: 1080, y: 180 }],
    walls: [
      { x: 260, y: 50, w: 24, h: 150 }, { x: 260, y: 280, w: 24, h: 190 },
      { x: 520, y: 50, w: 24, h: 120 }, { x: 520, y: 250, w: 24, h: 220 },
      { x: 780, y: 50, w: 24, h: 220 }, { x: 780, y: 350, w: 24, h: 120 },
      { x: 1040, y: 50, w: 24, h: 120 }, { x: 1040, y: 250, w: 24, h: 220 },
      { x: 360, y: 300, w: 160, h: 24 }, { x: 880, y: 140, w: 160, h: 24 },
      { x: 620, y: 380, w: 160, h: 24 },
    ],
    shrubs: [
      { x: 150, y: 240, r: 34 }, { x: 400, y: 120, r: 32 }, { x: 660, y: 250, r: 36 },
      { x: 920, y: 420, r: 34 }, { x: 1160, y: 110, r: 32 }, { x: 1160, y: 300, r: 30 },
      { x: 400, y: 430, r: 30 },
    ],
    lamps: [
      { x: 400, y: 230, r: 92 }, { x: 660, y: 130, r: 90 }, { x: 920, y: 250, r: 96 },
      { x: 1140, y: 220, r: 88 }, { x: 660, y: 420, r: 88 },
    ],
    wardens: [
      { x: 390, y: 90, wp: [{ x: 390, y: 90 }, { x: 390, y: 420 }], speed: 60 },
      { x: 650, y: 90, wp: [{ x: 650, y: 90 }, { x: 650, y: 430 }], speed: 64 },
      { x: 910, y: 420, wp: [{ x: 910, y: 420 }, { x: 910, y: 90 }], speed: 60 },
    ],
  };
  return {
    name: 'III · The Moon Vault', par: 140,
    start: { x: 640, y: 428 },
    gate: { x: 1168, y: 66, w: 78, h: 62 },
    petals: [{ x: 150, y: 110 }, { x: 640, y: 110 }, { x: 1120, y: 400 }],
    walls: [
      { x: 300, y: 50, w: 24, h: 140 }, { x: 300, y: 270, w: 24, h: 200 },
      { x: 600, y: 50, w: 24, h: 100 }, { x: 600, y: 230, w: 24, h: 240 },
      { x: 900, y: 50, w: 24, h: 180 }, { x: 900, y: 310, w: 24, h: 160 },
      { x: 120, y: 250, w: 180, h: 24 }, { x: 420, y: 140, w: 180, h: 24 },
      { x: 720, y: 340, w: 180, h: 24 }, { x: 1020, y: 180, w: 180, h: 24 },
    ],
    shrubs: [
      { x: 180, y: 400, r: 34 }, { x: 460, y: 90, r: 32 }, { x: 760, y: 430, r: 34 },
      { x: 1060, y: 100, r: 32 }, { x: 1060, y: 300, r: 30 }, { x: 180, y: 180, r: 30 },
      { x: 760, y: 180, r: 32 },
    ],
    lamps: [
      { x: 300, y: 330, r: 92 }, { x: 600, y: 140, r: 90 }, { x: 900, y: 240, r: 96 },
      { x: 1120, y: 330, r: 88 }, { x: 150, y: 320, r: 86 }, { x: 760, y: 90, r: 88 },
    ],
    wardens: [
      { x: 160, y: 90, wp: [{ x: 160, y: 90 }, { x: 160, y: 430 }, { x: 450, y: 430 }], speed: 68 },
      { x: 460, y: 90, wp: [{ x: 460, y: 90 }, { x: 760, y: 90 }, { x: 760, y: 420 }], speed: 72 },
      { x: 1060, y: 90, wp: [{ x: 1060, y: 90 }, { x: 1060, y: 430 }], speed: 68 },
      { x: 760, y: 240, wp: [{ x: 760, y: 240 }, { x: 1060, y: 240 }], speed: 76 },
    ],
  };
}
const LEVEL_COUNT = 3;

/* ---------------- game state ---------------- */
let screen = 'title';            // title | play | won | lost
let levelIndex = 0;
let level = null;                // built level (walls, wardens, petals...)
let player = null;
let time = 0;                    // seconds in the current level
let totalTime = 0;
let spotted = 0;                 // times a warden fully raised the alarm
let caughtBy = null;
let frozen = false;              // screenshot mode: world staged, no updates
let best = 0;                    // best total time, from localStorage when available
try { best = Number(localStorage.getItem('mothlight-best') || 0) || 0; } catch (e) { /* private mode */ }

const keys = {};
let muted = false;
let audio = null;

function buildLevel(n) {
  const d = levelData(n);
  return {
    def: d,
    petals: d.petals.map(p => ({ x: p.x, y: p.y, taken: false })),
    wardens: d.wardens.map(w => ({
      x: w.x, y: w.y, wp: w.wp, wpi: 1, dir: Math.PI / 2, speed: w.speed,
      mode: 'patrol', suspicion: 0, lastSeen: null, loseT: 0, searchT: 0,
      scanT: 0, pauseT: 0, home: { x: w.x, y: w.y },
    })),
  };
}

function startLevel(n) {
  levelIndex = n;
  level = buildLevel(n);
  player = {
    x: level.def.start.x, y: level.def.start.y, r: 11,
    dir: -Math.PI / 2, sneaking: false, hidden: false, lit: false, moving: false,
  };
  time = 0;
  autoPath = null; autoTarget = null;
  screen = 'play';
  announce('Level ' + (n) + ': ' + level.def.name + '. Gather the moonpetals, reach the moon gate unseen.');
}

function resetRun() {
  totalTime = 0; spotted = 0; startLevel(1);
}

/* ---------------- helpers ---------------- */
function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
function dist(ax, ay, bx, by) { const dx = ax - bx, dy = ay - by; return Math.sqrt(dx * dx + dy * dy); }
function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; }
function announce(msg) { statusEl.textContent = msg; }

/* Segment (ax,ay)-(bx,by) vs axis-aligned rect: true when it crosses the rect. */
function segHitsRect(ax, ay, bx, by, r) {
  const dx = bx - ax, dy = by - ay;
  let t0 = 0, t1 = 1;
  const p = [-dx, dx, -dy, dy], q = [ax - r.x, r.x + r.w - ax, ay - r.y, r.y + r.h - ay];
  for (let i = 0; i < 4; i += 1) {
    if (p[i] === 0) { if (q[i] < 0) return false; }
    else {
      const t = q[i] / p[i];
      if (p[i] < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
      else { if (t < t0) return false; if (t < t1) t1 = t; }
    }
  }
  return true;
}
function losClear(ax, ay, bx, by) {
  for (const w of level.def.walls) if (segHitsRect(ax, ay, bx, by, w)) return false;
  return true;
}
function circleHitsWalls(x, y, r) {
  if (x - r < FLOOR.x || x + r > FLOOR.x + FLOOR.w || y - r < FLOOR.y || y + r > FLOOR.y + FLOOR.h) return true;
  for (const w of level.def.walls) {
    const cx = clamp(x, w.x, w.x + w.w), cy = clamp(y, w.y, w.y + w.h);
    if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < r * r) return true;
  }
  return false;
}
function moveCircle(e, dx, dy) {
  if (dx !== 0 && !circleHitsWalls(e.x + dx, e.y, e.r || 11)) e.x += dx;
  if (dy !== 0 && !circleHitsWalls(e.x, e.y + dy, e.r || 11)) e.y += dy;
}
function inShrub(x, y) {
  for (const s of level.def.shrubs) if (dist(x, y, s.x, s.y) < s.r - 4) return true;
  return false;
}
function inLampLight(x, y) {
  for (const l of level.def.lamps) if (dist(x, y, l.x, l.y) < l.r) return true;
  return false;
}

/* ---------------- sound: tiny WebAudio bleeps, generated live ---------------- */
function ensureAudio() {
  if (!audio) {
    try { audio = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { audio = null; }
  }
  if (audio && audio.state === 'suspended') audio.resume();
}
function tone(freq, dur, type, gain, delay) {
  if (!audio || muted) return;
  const t0 = audio.currentTime + (delay || 0);
  const o = audio.createOscillator(), g = audio.createGain();
  o.type = type || 'sine'; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain || 0.08, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(g); g.connect(audio.destination);
  o.start(t0); o.stop(t0 + dur + 0.05);
}
const sfx = {
  pickup() { tone(880, 0.12, 'sine', 0.09); tone(1318, 0.18, 'sine', 0.07, 0.07); },
  suspect() { tone(520, 0.1, 'triangle', 0.07); },
  alarm() { tone(196, 0.32, 'sawtooth', 0.1); tone(147, 0.4, 'sawtooth', 0.09, 0.12); },
  caught() { tone(82, 0.5, 'sawtooth', 0.12); tone(55, 0.7, 'square', 0.07, 0.1); },
  win() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, 'sine', 0.08, i * 0.09)); },
  step() { tone(140 + Math.random() * 40, 0.03, 'sine', 0.015); },
  click() { tone(660, 0.06, 'square', 0.04); },
};

/* ---------------- detection ---------------- */
const VIEW_RANGE = 185, VIEW_HALF = 0.62;   // warden sight: range and half-angle
function wardenSees(w) {
  const d = dist(w.x, w.y, player.x, player.y);
  if (d > VIEW_RANGE) return 0;
  const ang = Math.atan2(player.y - w.y, player.x - w.x);
  if (Math.abs(angleDiff(ang, w.dir)) > VIEW_HALF) return 0;
  if (!losClear(w.x, w.y, player.x, player.y)) return 0;
  if (player.hidden && d > 46) return 0;              // shrubs hide you unless he is close
  let rate = 95 * (1.15 - d / VIEW_RANGE);            // closer = faster to notice
  if (player.lit) rate *= 1.45; else rate *= 0.7;     // lamp pools expose, dark hides
  if (player.sneaking) rate *= 0.55;
  if (player.hidden) rate *= 0.5;
  return rate;
}
function alertLevel() {
  let m = 0;
  for (const w of level.wardens) m = Math.max(m, w.mode === 'chase' ? 100 : w.suspicion);
  return m;
}
function anyChasing() { return level.wardens.some(w => w.mode === 'chase'); }

/* ---------------- update ---------------- */
function updatePlayer(dt) {
  let ix = 0, iy = 0;
  if (keys.ArrowLeft || keys.KeyA) ix -= 1;
  if (keys.ArrowRight || keys.KeyD) ix += 1;
  if (keys.ArrowUp || keys.KeyW) iy -= 1;
  if (keys.ArrowDown || keys.KeyS) iy += 1;
  player.sneaking = !!(keys.ShiftLeft || keys.ShiftRight);
  player.moving = ix !== 0 || iy !== 0;
  if (player.moving) {
    const len = Math.hypot(ix, iy), sp = (player.sneaking ? 82 : 148) * dt;
    moveCircle(player, ix / len * sp, iy / len * sp);
    player.dir = Math.atan2(iy, ix);
    if (Math.random() < dt * (player.sneaking ? 1.2 : 2.6)) sfx.step();
  }
  player.hidden = inShrub(player.x, player.y);
  player.lit = inLampLight(player.x, player.y);
  // petals
  for (const p of level.petals) {
    if (!p.taken && dist(player.x, player.y, p.x, p.y) < 26) {
      p.taken = true; sfx.pickup();
      announce('Moonpetal gathered. ' + petalsLeft() + ' left.');
    }
  }
  // the moon gate
  const g = level.def.gate, gx = g.x + g.w / 2, gy = g.y + g.h / 2;
  if (petalsLeft() === 0 && dist(player.x, player.y, gx, gy) < 36) winLevel();
}
function petalsLeft() { return level.petals.filter(p => !p.taken).length; }

function updateWarden(w, dt) {
  const seen = wardenSees(w);
  const wasSuspect = w.suspicion >= 35;
  if (seen > 0) {
    w.suspicion = Math.min(100, w.suspicion + seen * dt);
    w.lastSeen = { x: player.x, y: player.y };
    w.loseT = 0;
    if (w.suspicion >= 35 && !wasSuspect) sfx.suspect();
    if (w.suspicion >= 100 && w.mode !== 'chase') {
      w.mode = 'chase'; spotted += 1; sfx.alarm();
      announce('Spotted! A warden is chasing you — break line of sight!');
    }
  } else {
    w.suspicion = Math.max(0, w.suspicion - 30 * dt);
    if (w.mode === 'chase') {
      w.loseT += dt;
      if (w.loseT > 3.5) { w.mode = 'search'; w.searchT = 0; }
    }
  }

  if (w.mode === 'patrol') {
    if (w.pauseT > 0) { w.pauseT -= dt; return; }
    const t = w.wp[w.wpi];
    const d = dist(w.x, w.y, t.x, t.y);
    if (d < 6) { w.wpi = (w.wpi + 1) % w.wp.length; w.pauseT = 0.7; return; }
    const sp = w.speed * dt;
    moveCircle(w, (t.x - w.x) / d * sp, (t.y - w.y) / d * sp);
    w.dir = Math.atan2(t.y - w.y, t.x - w.x);
  } else if (w.mode === 'chase') {
    const t = w.lastSeen || player;
    const d = dist(w.x, w.y, t.x, t.y);
    if (d > 4) {
      const sp = 128 * dt;
      moveCircle(w, (t.x - w.x) / d * sp, (t.y - w.y) / d * sp);
      w.dir = Math.atan2(t.y - w.y, t.x - w.x);
    }
    if (dist(w.x, w.y, player.x, player.y) < 22) loseLevel(w);
  } else if (w.mode === 'search') {
    if (w.lastSeen) {
      const d = dist(w.x, w.y, w.lastSeen.x, w.lastSeen.y);
      if (d > 8) {
        const sp = 95 * dt;
        moveCircle(w, (w.lastSeen.x - w.x) / d * sp, (w.lastSeen.y - w.y) / d * sp);
        w.dir = Math.atan2(w.lastSeen.y - w.y, w.lastSeen.x - w.x);
      } else {
        w.searchT += dt; w.scanT += dt;
        w.dir += Math.sin(w.scanT * 2.2) * 0.9 * dt * 2.2;
        if (w.searchT > 2.2) { w.mode = 'return'; }
      }
    } else w.mode = 'return';
  } else if (w.mode === 'return') {
    // walk back to the nearest patrol waypoint, then resume the rounds
    let bi = 0, bd = Infinity;
    w.wp.forEach((p, i) => { const d = dist(w.x, w.y, p.x, p.y); if (d < bd) { bd = d; bi = i; } });
    const t = w.wp[bi], d = dist(w.x, w.y, t.x, t.y);
    if (d < 8) { w.wpi = (bi + 1) % w.wp.length; w.mode = 'patrol'; w.suspicion = 0; return; }
    const sp = 95 * dt;
    moveCircle(w, (t.x - w.x) / d * sp, (t.y - w.y) / d * sp);
    w.dir = Math.atan2(t.y - w.y, t.x - w.x);
  }
}

function update(dt) {
  time += dt;
  updatePlayer(dt);
  if (screen !== 'play') return;
  for (const w of level.wardens) updateWarden(w, dt);
}

function winLevel() {
  totalTime += time;
  sfx.win();
  if (levelIndex >= LEVEL_COUNT) {
    screen = 'won';
    const t = Math.round(totalTime);
    if (!best || t < best) { best = t; try { localStorage.setItem('mothlight-best', String(t)); } catch (e) {} }
    announce('All three gardens crossed unseen. Total time ' + fmtTime(totalTime) + '.');
  } else {
    screen = 'won';
    announce('Level clear in ' + fmtTime(time) + '. Press Enter for the next garden.');
  }
}
function loseLevel(w) {
  caughtBy = w; screen = 'lost'; sfx.caught();
  announce('Caught by a lantern warden. Press R to try the level again.');
}
function fmtTime(s) {
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return m + ':' + String(ss).padStart(2, '0');
}
function score() {
  const par = levelData(1).par + levelData(2).par + levelData(3).par;
  return Math.max(100, Math.round(3000 + (par - totalTime) * 12 - spotted * 200));
}
function rating() {
  if (spotted === 0) return 'GHOST';
  if (spotted <= 2) return 'SHADOW';
  return 'BRASH';
}

/* ---------------- rendering ---------------- */
function drawFloor(t) {
  ctx.fillStyle = '#101c16';
  ctx.fillRect(0, 0, W, H);
  // garden tiles, two quiet greens, with a few fireflies of dew
  for (let y = FLOOR.y; y < FLOOR.y + FLOOR.h; y += 40) {
    for (let x = FLOOR.x; x < FLOOR.x + FLOOR.w; x += 40) {
      ctx.fillStyle = ((x + y) / 40) % 2 === 0 ? '#122019' : '#0e1a14';
      ctx.fillRect(x + 1, y + 1, 38, 38);
    }
  }
  ctx.fillStyle = 'rgba(180,220,190,0.10)';
  for (let i = 0; i < 60; i += 1) {
    const x = FLOOR.x + ((i * 173) % FLOOR.w), y = FLOOR.y + ((i * 97) % FLOOR.h);
    ctx.fillRect(x, y, 2, 2);
  }
  // moonlight wash from the top-left
  const g = ctx.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, 'rgba(140,170,255,0.07)');
  g.addColorStop(1, 'rgba(0,0,0,0.12)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}
function drawLamps(t) {
  for (const l of level.def.lamps) {
    const pulse = 0.85 + Math.sin(t * 1.6 + l.x) * 0.08;
    const g = ctx.createRadialGradient(l.x, l.y, 6, l.x, l.y, l.r * pulse);
    g.addColorStop(0, 'rgba(255,214,130,0.34)');
    g.addColorStop(0.6, 'rgba(255,196,100,0.12)');
    g.addColorStop(1, 'rgba(255,196,100,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r * pulse, 0, TAU); ctx.fill();
    // the lamp post
    ctx.fillStyle = '#3a2f22'; ctx.fillRect(l.x - 3, l.y - 5, 6, 10);
    ctx.fillStyle = '#ffd782';
    ctx.beginPath(); ctx.arc(l.x, l.y - 7, 6, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,190,0.9)';
    ctx.beginPath(); ctx.arc(l.x, l.y - 7, 3, 0, TAU); ctx.fill();
  }
}
function coneColor(w) {
  if (w.mode === 'chase') return 'rgba(255,64,48,0.34)';
  if (w.suspicion >= 35) return 'rgba(255,166,40,0.30)';
  return 'rgba(255,226,130,0.20)';
}
function drawCones() {
  for (const w of level.wardens) {
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    ctx.arc(w.x, w.y, VIEW_RANGE, w.dir - VIEW_HALF, w.dir + VIEW_HALF);
    ctx.closePath();
    const g = ctx.createRadialGradient(w.x, w.y, 10, w.x, w.y, VIEW_RANGE);
    const c = coneColor(w);
    g.addColorStop(0, c);
    g.addColorStop(1, 'rgba(255,226,130,0)');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = w.mode === 'chase' ? 'rgba(255,80,60,0.5)' : 'rgba(255,226,130,0.28)';
    ctx.lineWidth = 1.5; ctx.stroke();
  }
}
function drawWalls() {
  for (const r of level.def.walls) {
    ctx.fillStyle = '#2b3442';
    ctx.fillRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#46536a';
    ctx.fillRect(r.x, r.y, r.w, 4);
    ctx.fillRect(r.x, r.y, 4, r.h);
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(r.x, r.y + r.h - 4, r.w, 4);
    ctx.fillRect(r.x + r.w - 4, r.y, 4, r.h);
    // stone seams
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    if (r.w > r.h) { for (let x = r.x + 22; x < r.x + r.w - 6; x += 24) { ctx.beginPath(); ctx.moveTo(x, r.y + 4); ctx.lineTo(x, r.y + r.h - 4); ctx.stroke(); } }
    else { for (let y = r.y + 22; y < r.y + r.h - 6; y += 24) { ctx.beginPath(); ctx.moveTo(r.x + 4, y); ctx.lineTo(r.x + r.w - 4, y); ctx.stroke(); } }
  }
  // garden border
  ctx.strokeStyle = '#3d4a5e'; ctx.lineWidth = 3;
  ctx.strokeRect(FLOOR.x, FLOOR.y, FLOOR.w, FLOOR.h);
}
function drawShrubs(t) {
  for (const s of level.def.shrubs) {
    ctx.fillStyle = '#16301f';
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();
    ctx.fillStyle = '#1e4028';
    for (let i = 0; i < 5; i += 1) {
      const a = i * 1.256 + s.x * 0.01;
      ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * s.r * 0.45, s.y + Math.sin(a) * s.r * 0.45, s.r * 0.42, 0, TAU); ctx.fill();
    }
    ctx.fillStyle = '#2c5a38';
    for (let i = 0; i < 7; i += 1) {
      const a = i * 0.9 + s.y * 0.02;
      ctx.beginPath(); ctx.arc(s.x + Math.cos(a) * s.r * 0.6, s.y + Math.sin(a) * s.r * 0.6, 3.5, 0, TAU); ctx.fill();
    }
  }
}
function drawPetals(t) {
  for (const p of level.petals) {
    if (p.taken) continue;
    const pulse = 1 + Math.sin(t * 2.4 + p.x) * 0.12;
    const g = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, 26 * pulse);
    g.addColorStop(0, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(p.x, p.y, 26 * pulse, 0, TAU); ctx.fill();
    ctx.fillStyle = '#f5f0ff';
    for (let i = 0; i < 5; i += 1) {
      const a = i * TAU / 5 - Math.PI / 2;
      ctx.beginPath();
      ctx.ellipse(p.x + Math.cos(a) * 7, p.y + Math.sin(a) * 7, 6, 4, a, 0, TAU);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd76a';
    ctx.beginPath(); ctx.arc(p.x, p.y, 3.5, 0, TAU); ctx.fill();
  }
}
function drawGate(t) {
  const g = level.def.gate, cx = g.x + g.w / 2, cy = g.y + g.h / 2;
  const open = petalsLeft() === 0;
  const glow = open ? 0.5 + Math.sin(t * 3) * 0.15 : 0.12;
  const gg = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
  gg.addColorStop(0, 'rgba(190,220,255,' + glow + ')');
  gg.addColorStop(1, 'rgba(190,220,255,0)');
  ctx.fillStyle = gg;
  ctx.beginPath(); ctx.arc(cx, cy, 60, 0, TAU); ctx.fill();
  // arch
  ctx.fillStyle = '#31405a';
  ctx.fillRect(g.x, g.y + 14, 8, g.h - 14);
  ctx.fillRect(g.x + g.w - 8, g.y + 14, 8, g.h - 14);
  ctx.beginPath(); ctx.arc(cx, g.y + 16, g.w / 2, Math.PI, 0); ctx.fill();
  ctx.fillStyle = open ? '#cfe6ff' : '#141a26';
  ctx.beginPath(); ctx.arc(cx, g.y + 18, g.w / 2 - 10, Math.PI, 0); ctx.fill();
  ctx.fillRect(g.x + 10, g.y + 18, g.w - 20, g.h - 18);
  if (open) {
    ctx.fillStyle = '#eef6ff';
    ctx.font = 'bold 15px monospace'; ctx.textAlign = 'center';
    ctx.fillText('EXIT', cx, cy + 22);
  } else {
    // chained shut: count the petals still owed
    ctx.strokeStyle = '#8a94a8'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(g.x + 12, g.y + 30); ctx.lineTo(g.x + g.w - 12, g.y + 44); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(g.x + g.w - 12, g.y + 30); ctx.lineTo(g.x + 12, g.y + 44); ctx.stroke();
    ctx.fillStyle = '#c8d2e4'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText(petalsLeft() + ' ✿', cx, cy + 24);
  }
}
function drawPlayer(t) {
  const p = player;
  const bob = p.moving ? Math.sin(t * (p.sneaking ? 7 : 11)) * 1.5 : 0;
  ctx.save();
  ctx.globalAlpha = p.hidden ? 0.55 : 1;
  // moth-wing cape
  ctx.fillStyle = '#5b4a8a';
  ctx.beginPath();
  ctx.ellipse(p.x - Math.cos(p.dir) * 4, p.y - Math.sin(p.dir) * 4 + bob * 0.3, 13, 9, p.dir, 0, TAU);
  ctx.fill();
  // hooded body
  ctx.fillStyle = '#2e2450';
  ctx.beginPath(); ctx.arc(p.x, p.y + bob * 0.3, p.r, 0, TAU); ctx.fill();
  ctx.fillStyle = '#8f7fd0';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.dir) * 4, p.y + Math.sin(p.dir) * 4, 5.5, 0, TAU); ctx.fill();
  // eyes in the dark
  ctx.fillStyle = '#ffe9a8';
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.dir) * 6 - Math.sin(p.dir) * 2.4, p.y + Math.sin(p.dir) * 6 + Math.cos(p.dir) * 2.4, 1.4, 0, TAU); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x + Math.cos(p.dir) * 6 + Math.sin(p.dir) * 2.4, p.y + Math.sin(p.dir) * 6 - Math.cos(p.dir) * 2.4, 1.4, 0, TAU); ctx.fill();
  ctx.restore();
  if (p.hidden) {
    ctx.fillStyle = 'rgba(200,230,200,0.9)'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', p.x, p.y - 20);
  }
  if (p.sneaking && !p.hidden) {
    ctx.fillStyle = 'rgba(200,200,220,0.7)'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('sneaking', p.x, p.y - 20);
  }
}
function drawWarden(w, t) {
  // lantern glow at his feet
  const g = ctx.createRadialGradient(w.x, w.y, 2, w.x, w.y, 30);
  g.addColorStop(0, 'rgba(255,210,120,0.30)');
  g.addColorStop(1, 'rgba(255,210,120,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(w.x, w.y, 30, 0, TAU); ctx.fill();
  // body: dark blue coat, brass buttons
  ctx.fillStyle = '#1d2f52';
  ctx.beginPath(); ctx.arc(w.x, w.y, 12, 0, TAU); ctx.fill();
  ctx.fillStyle = '#c8a24a';
  ctx.beginPath(); ctx.arc(w.x + Math.cos(w.dir) * 5, w.y + Math.sin(w.dir) * 5, 3, 0, TAU); ctx.fill();
  // helmet brim + lantern in hand
  ctx.strokeStyle = '#0f1830'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(w.x - Math.sin(w.dir) * 8, w.y + Math.cos(w.dir) * 8);
  ctx.lineTo(w.x + Math.sin(w.dir) * 8, w.y - Math.cos(w.dir) * 8); ctx.stroke();
  ctx.fillStyle = '#ffd782';
  ctx.beginPath(); ctx.arc(w.x + Math.cos(w.dir + 0.7) * 13, w.y + Math.sin(w.dir + 0.7) * 13, 3.5, 0, TAU); ctx.fill();
  // state marks
  if (w.mode === 'chase') {
    ctx.fillStyle = '#ff5040'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
    ctx.fillText('!', w.x, w.y - 20);
  } else if (w.suspicion >= 35) {
    ctx.fillStyle = '#ffa828'; ctx.font = 'bold 18px monospace'; ctx.textAlign = 'center';
    ctx.fillText('?', w.x, w.y - 20);
  }
  // suspicion arc over his head
  if (w.suspicion > 2 && w.mode !== 'chase') {
    ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(w.x, w.y - 16, 9, -Math.PI / 2, Math.PI * 1.5); ctx.stroke();
    ctx.strokeStyle = w.suspicion >= 35 ? '#ffa828' : '#ffe282'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(w.x, w.y - 16, 9, -Math.PI / 2, -Math.PI / 2 + TAU * w.suspicion / 100); ctx.stroke();
  }
}

/* ---------------- HUD and screens ---------------- */
function drawHUD() {
  ctx.fillStyle = '#0a0f18';
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = '#233047';
  ctx.fillRect(0, HUD_H - 2, W, 2);
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#e8eefc'; ctx.font = 'bold 17px monospace';
  ctx.fillText('MOTHLIGHT', 16, HUD_H / 2 - 1);
  ctx.fillStyle = '#8fa3c8'; ctx.font = '13px monospace';
  ctx.fillText(level.def.name, 150, HUD_H / 2);
  // petals
  ctx.fillStyle = '#f5f0ff'; ctx.font = '15px monospace';
  const got = level.petals.filter(p => p.taken).length;
  ctx.fillText('✿ ' + got + '/' + level.petals.length, 470, HUD_H / 2);
  // alert meter
  const a = alertLevel();
  ctx.fillStyle = '#8fa3c8'; ctx.font = '13px monospace';
  ctx.fillText(anyChasing() ? 'SPOTTED!' : 'ALERT', 580, HUD_H / 2);
  ctx.fillStyle = '#1c2739';
  ctx.fillRect(650, HUD_H / 2 - 7, 150, 14);
  ctx.fillStyle = a >= 100 ? '#ff5040' : a >= 35 ? '#ffa828' : '#ffe282';
  ctx.fillRect(650, HUD_H / 2 - 7, 150 * a / 100, 14);
  ctx.strokeStyle = '#3d4a5e'; ctx.lineWidth = 1;
  ctx.strokeRect(650, HUD_H / 2 - 7, 150, 14);
  // timer + hints
  ctx.fillStyle = '#e8eefc'; ctx.font = 'bold 15px monospace'; ctx.textAlign = 'right';
  ctx.fillText(fmtTime(time), 930, HUD_H / 2);
  ctx.fillStyle = '#8fa3c8'; ctx.font = '12px monospace';
  ctx.fillText('WASD move · SHIFT sneak · M mute · R restart', 1264, HUD_H / 2);
  ctx.textAlign = 'left';
}
function dim() { ctx.fillStyle = 'rgba(4,8,14,0.72)'; ctx.fillRect(0, 0, W, H); }
function panel(x, y, w, h) {
  ctx.fillStyle = 'rgba(10,16,28,0.94)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#4a5a78'; ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
}
function drawTitle(t) {
  drawHUD();
  dim();
  panel(330, 92, 620, 300);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffe9a8';
  ctx.font = 'bold 54px monospace';
  ctx.fillText('MOTHLIGHT', W / 2, 168);
  ctx.fillStyle = '#b9c8e8'; ctx.font = '19px monospace';
  ctx.fillText('— A Quiet Heist —', W / 2, 202);
  ctx.fillStyle = '#dbe4f5'; ctx.font = '15px monospace';
  ctx.fillText('You are Wisp, a moth-burglar. Slip through the moonlit gardens,', W / 2, 244);
  ctx.fillText('gather every moonpetal, and reach the moon gate unseen.', W / 2, 266);
  ctx.fillStyle = '#ffe282'; ctx.font = '14px monospace';
  ctx.fillText('Lantern wardens watch with cones of light. Shrubs hide you;', W / 2, 300);
  ctx.fillText('lamp pools expose you. Hold SHIFT to sneak. If a warden\'s', W / 2, 320);
  ctx.fillText('suspicion fills, he chases — and catching means the night is over.', W / 2, 340);
  const blink = Math.sin(t * 4) > -0.2;
  if (blink) {
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 17px monospace';
    ctx.fillText('PRESS ENTER TO BEGIN', W / 2, 374);
  }
  if (best > 0) {
    ctx.fillStyle = '#8fa3c8'; ctx.font = '13px monospace';
    ctx.fillText('Best full run: ' + fmtTime(best), W / 2, 404);
  }
  ctx.textAlign = 'left';
}
function drawWon() {
  drawHUD();
  dim();
  panel(340, 110, 600, 268);
  ctx.textAlign = 'center';
  const last = levelIndex >= LEVEL_COUNT;
  ctx.fillStyle = '#ffe9a8'; ctx.font = 'bold 34px monospace';
  ctx.fillText(last ? 'THE NIGHT IS YOURS' : 'THE GATE IS OPEN', W / 2, 168);
  ctx.fillStyle = '#dbe4f5'; ctx.font = '16px monospace';
  if (last) {
    ctx.fillText('All three gardens crossed. Rating: ' + rating(), W / 2, 212);
    ctx.fillText('Total time ' + fmtTime(totalTime) + '  ·  Score ' + score(), W / 2, 240);
    ctx.fillText('Alarms raised: ' + spotted, W / 2, 268);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
    ctx.fillText('PRESS R TO STEAL AGAIN', W / 2, 318);
  } else {
    ctx.fillText('Level clear in ' + fmtTime(time) + '  ·  Alarms raised: ' + spotted, W / 2, 212);
    ctx.fillText('Next: ' + levelData(levelIndex + 1).name, W / 2, 240);
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
    ctx.fillText('PRESS ENTER FOR THE NEXT GARDEN', W / 2, 300);
    ctx.fillStyle = '#8fa3c8'; ctx.font = '13px monospace';
    ctx.fillText('or R to replay this garden', W / 2, 330);
  }
  ctx.textAlign = 'left';
}
function drawLost() {
  drawHUD();
  dim();
  panel(340, 120, 600, 240);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6a55'; ctx.font = 'bold 40px monospace';
  ctx.fillText('SPOTTED!', W / 2, 182);
  ctx.fillStyle = '#dbe4f5'; ctx.font = '16px monospace';
  ctx.fillText('A lantern warden caught Wisp in the open.', W / 2, 224);
  ctx.fillText('The garden keeps its moonpetals tonight.', W / 2, 248);
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 16px monospace';
  ctx.fillText('PRESS R TO TRY AGAIN', W / 2, 300);
  ctx.fillStyle = '#8fa3c8'; ctx.font = '13px monospace';
  ctx.fillText('Tip: wait in a shrub until his cone sweeps past, then sneak behind him.', W / 2, 330);
  ctx.textAlign = 'left';
}

function render() {
  const t = frozen ? stageTime : time;
  ctx.clearRect(0, 0, W, H);
  drawFloor(t);
  drawLamps(t);
  drawCones();
  drawWalls();
  drawShrubs(t);
  drawPetals(t);
  drawGate(t);
  for (const w of level.wardens) drawWarden(w, t);
  drawPlayer(t);
  if (screen === 'title') drawTitle(t);
  else if (screen === 'won') drawWon();
  else if (screen === 'lost') drawLost();
  else drawHUD();
}

/* ---------------- screenshot staging (?shot=) ---------------- */
let stageTime = 0;
let autoPath = null, autoTarget = null;
/* Breadth-first path over a coarse grid, so the autopilot walks around walls
 * instead of grinding into a corner pocket. */
function findPath(sx, sy, tx, ty) {
  const cell = 24, cols = Math.ceil(W / cell), rows = Math.ceil(H / cell);
  const key = (cx, cy) => cy * cols + cx;
  const blocked = (cx, cy) => {
    const x = cx * cell + cell / 2, y = cy * cell + cell / 2;
    if (x < FLOOR.x + 12 || x > FLOOR.x + FLOOR.w - 12 || y < FLOOR.y + 12 || y > FLOOR.y + FLOOR.h - 12) return true;
    return circleHitsWalls(x, y, 13);
  };
  const start = { x: Math.floor(sx / cell), y: Math.floor(sy / cell) };
  const goal = { x: Math.floor(tx / cell), y: Math.floor(ty / cell) };
  if (blocked(goal.x, goal.y)) return null;
  const prev = new Map(), seen = new Set([key(start.x, start.y)]), queue = [start];
  while (queue.length) {
    const c = queue.shift();
    if (c.x === goal.x && c.y === goal.y) {
      const pts = [];
      let cur = c;
      while (cur) { pts.unshift({ x: cur.x * cell + cell / 2, y: cur.y * cell + cell / 2 }); cur = prev.get(key(cur.x, cur.y)); }
      return pts;
    }
    for (const d of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = c.x + d[0], ny = c.y + d[1];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || seen.has(key(nx, ny)) || blocked(nx, ny)) continue;
      seen.add(key(nx, ny)); prev.set(key(nx, ny), c); queue.push({ x: nx, y: ny });
    }
  }
  return null;
}
function autopilot(dt) {
  // steer Wisp toward the nearest petal, then the gate, following a real path
  let target = null, bestD = Infinity;
  for (const p of level.petals) {
    if (p.taken) continue;
    const d = dist(player.x, player.y, p.x, p.y);
    if (d < bestD) { bestD = d; target = p; }
  }
  if (!target) { const g = level.def.gate; target = { x: g.x + g.w / 2, y: g.y + g.h / 2 }; }
  if (!autoPath || !autoTarget || autoTarget.x !== target.x || autoTarget.y !== target.y) {
    autoTarget = target;
    autoPath = findPath(player.x, player.y, target.x, target.y);
  }
  let step = target;
  if (autoPath && autoPath.length > 1) {
    while (autoPath.length > 1 && dist(player.x, player.y, autoPath[0].x, autoPath[0].y) < 16) autoPath.shift();
    step = autoPath[0];
  }
  const dx = step.x - player.x, dy = step.y - player.y, len = Math.hypot(dx, dy) || 1;
  const sp = 82 * dt;   // sneak: slow, quiet, and photogenic
  player.sneaking = true;
  moveCircle(player, dx / len * sp, dy / len * sp);
  player.dir = Math.atan2(dy, dx);
  player.moving = true;
  player.hidden = inShrub(player.x, player.y);
  player.lit = inLampLight(player.x, player.y);
  for (const p of level.petals) if (!p.taken && dist(player.x, player.y, p.x, p.y) < 26) p.taken = true;
}
function stageShot(name) {
  frozen = true;
  if (name === 'play2') {
    // Garden II, mid-heist: two petals in the bag, Wisp crouched in a shrub
    // while a warden's cone sweeps toward her.
    startLevel(2);
    level.petals[0].taken = true; level.petals[1].taken = true;
    player.x = 660; player.y = 250; player.sneaking = true; player.dir = Math.PI;
    player.hidden = true;
    const w = level.wardens[1];
    w.x = 650; w.y = 150; w.dir = Math.PI / 2; w.suspicion = 58; w.mode = 'patrol';
    const w2 = level.wardens[0];
    w2.x = 390; w2.y = 300; w2.dir = -Math.PI / 2;
    time = 47; stageTime = 47;
    screen = 'play';
    return;
  }
  if (name === 'end') {
    // A completed heist: the win screen, with a real run's numbers.
    startLevel(1);
    level.petals.forEach(p => { p.taken = true; });
    totalTime = 107; time = 107; spotted = 0;
    screen = 'won'; stageTime = 107;
    return;
  }
  if (name === 'play') {
    // Garden I played forward by the autopilot for a fixed stretch, frozen
    // mid-sneak with a warden's cone closing in.
    startLevel(1);
    for (let i = 0; i < 11 / STEP; i += 1) {
      time += STEP; stageTime = time;
      autopilot(STEP);
      for (const w of level.wardens) updateWarden(w, STEP);
      if (screen !== 'play') break;
    }
    screen = 'play';
    return;
  }
  // start (default): title screen over garden I. Freeze the blink on, so the
  // "press enter" line is always visible in the title screenshot.
  startLevel(1);
  for (let i = 0; i < 3 / STEP; i += 1) { time += STEP; for (const w of level.wardens) updateWarden(w, STEP); }
  stageTime = 0.4;
  screen = 'title';
}

/* ---------------- input and main loop ---------------- */
function onKey(e, down) {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (down) ensureAudio();
  keys[e.code] = down;
  if (!down) return;
  if (e.code === 'KeyM') { muted = !muted; announce(muted ? 'Sound off.' : 'Sound on.'); return; }
  if (screen === 'title' && (e.code === 'Enter' || e.code === 'Space')) { sfx.click(); resetRun(); return; }
  if (screen === 'won' && e.code === 'Enter') {
    sfx.click();
    if (levelIndex >= LEVEL_COUNT) resetRun(); else startLevel(levelIndex + 1);
    return;
  }
  if ((screen === 'won' || screen === 'lost') && e.code === 'KeyR') { sfx.click(); spotted = 0; startLevel(levelIndex); return; }
  if (screen === 'play' && e.code === 'KeyR') { sfx.click(); spotted = 0; startLevel(levelIndex); }
}
window.addEventListener('keydown', e => onKey(e, true));
window.addEventListener('keyup', e => onKey(e, false));
canvas.addEventListener('pointerdown', () => { ensureAudio(); if (screen === 'title') resetRun(); });

let last = 0, acc = 0;
function loop(ts) {
  requestAnimationFrame(loop);
  if (!last) last = ts;
  let dt = (ts - last) / 1000;
  last = ts;
  if (dt > 0.25) dt = 0.25;
  if (!frozen && screen === 'play') {
    acc += dt;
    while (acc >= STEP) { acc -= STEP; update(STEP); if (screen !== 'play') { acc = 0; break; } }
  }
  render();
}

(function init() {
  const q = new URLSearchParams(location.search);
  const shot = q.get('shot');
  if (shot) stageShot(shot);
  else { startLevel(1); screen = 'title'; }
  requestAnimationFrame(loop);
})();
