// js/app.js
const W = 1200, H = 675;
const CX = W / 2, CY = H / 2;
const YSQUASH = 0.5;

const svg = document.getElementById('holo-svg');
const viewButtons = [...document.querySelectorAll('.map-toolbar [data-view]')];

let DATA = null;
let VIEW = getInitialView();         // 'system' | 'planet' | 'tactical'
let SELECTED_PLANET = getInitialPlanet() || 'Crusader';

async function main() {
  // Load data (file version). If you embedded JSON in HTML, swap this to the inline loader.
  const res = await fetch('data/stanton.json');
  DATA = await res.json();

  // Wire toolbar
  viewButtons.forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      setView(btn.dataset.view);
    });
  });

  render(); // initial draw
}

function setView(next) {
  VIEW = next;
  updateActiveButtons();
  render();
}

function updateActiveButtons() {
  viewButtons.forEach(b => b.classList.toggle('is-active', b.dataset.view === VIEW));
}

function render() {
  clear(svg);
  if (!DATA) return;

  if (VIEW === 'system') drawSystem(DATA);
  else if (VIEW === 'planet') drawPlanet(DATA, SELECTED_PLANET);
  else if (VIEW === 'tactical') drawTactical(DATA, SELECTED_PLANET);
}

/* =========================
   SYSTEM VIEW (macro map)
   ========================= */
function drawSystem(data) {
  // Star
  circle(CX, CY, data.star.r, { class: 'planet', fill: 'rgba(255,59,213,.12)', stroke: '#ff3bd5' });
  label(CX - 42, CY - 12, data.system.toUpperCase(), { fill: '#ffd6f5' });

  // Orbits (unique radii)
  const orbitRadii = new Set([
    ...data.planets.map(p => p.orbit),
    ...(data.jump_points || []).map(j => j.orbit)
  ]);
  [...orbitRadii].sort((a, b) => a - b).forEach(r => {
    ellipse(CX, CY, r, r * YSQUASH, { class: 'orbit' });
  });

  // Planets + click to focus
  for (const p of data.planets) {
    const pos = posOnOrbit(p.orbit, p.angle);
    const body = circle(pos.x, pos.y, p.r, { class: 'planet', style: 'cursor:pointer' });
    label(pos.x + 15, pos.y + 5, p.name.toUpperCase(), { fill: '#a9f6ff' });

    body.addEventListener('click', () => {
      SELECTED_PLANET = p.name;
      setView('planet');
    });
  }

  // Jump points
  for (const j of (data.jump_points || [])) {
    const pos = posOnOrbit(j.orbit, j.angle);
    poly([[pos.x, pos.y - 10],[pos.x + 10, pos.y + 8],[pos.x - 10, pos.y + 8]], { stroke: '#17e7ff', fill: 'none' });
    label(pos.x + 12, pos.y + 4, `JUMP → ${j.to.toUpperCase()}`, { fill: '#b6fbff' });
  }

  // Assets near their planets
  drawAssetsAttached(data);
}

/* =========================
   PLANET VIEW (zoomed to one planet)
   ========================= */
function drawPlanet(data, planetName) {
  const planet = data.planets.find(p => p.name.toLowerCase() === planetName.toLowerCase());
  if (!planet) {
    label(40, 40, `Planet not found: ${planetName}`, { fill: '#ffd6f5' });
    return;
  }
  // Paint a big glowing disc and a surface grid feel
  const R = 220;
  const cx = CX - 120, cy = CY + 10;

  circle(cx, cy, R, { class: 'planet' });
  label(cx - 24, cy - R - 16, planet.name.toUpperCase(), { fill: '#a9f6ff' });

  // Simple concentric rings as a "surface grid"
  for (let r = 40; r < R; r += 40) {
    circle(cx, cy, r, { class: 'orbit' });
  }
  // Longitudes/latitudes
  for (let i = -60; i <= 60; i += 30) {
    const x = cx + i * 2;
    line(x, cy - R + 10, x, cy + R - 10, { stroke: 'rgba(23,231,255,.15)' });
  }

  // Show assets attached to this planet
  const assets = (data.assets || []).filter(a =>
    (a.planet && a.planet.toLowerCase() === planet.name.toLowerCase()) ||
    (a.attachTo && a.attachTo.toLowerCase() === planet.name.toLowerCase())
  );
  let y = cy - R - 40;
  for (const a of assets) {
    y += 24;
    // place a pin on the rim with a small offset
    const pin = { x: cx + R - 20, y: cy - 10 + (y % 60) };
    circle(pin.x, pin.y, 6, { class: 'node' });
    label(pin.x + 10, pin.y + 4, `${a.kind === 'crew' ? '👤' : '🛸'} ${a.label}`, { fill: '#ffd6f5' });
  }

  // hint to switch to tactical
  label(cx - R, cy + R + 30, 'Tip: Tactical view shows a local grid and only active assets.', { fill: '#97c8d3' });
}

/* =========================
   TACTICAL VIEW (tight grid around a planet)
   ========================= */
function drawTactical(data, planetName) {
  const planet = data.planets.find(p => p.name.toLowerCase() === planetName.toLowerCase());
  label(40, 40, `TACTICAL · ${planet ? planet.name.toUpperCase() : planetName.toUpperCase()}`, { fill: '#a9f6ff' });

  // Grid
  const step = 40;
  for (let x = 0; x <= W; x += step) line(x, 0, x, H, { stroke: 'rgba(23,231,255,.08)' });
  for (let y = 0; y <= H; y += step) line(0, y, W, y, { stroke: 'rgba(23,231,255,.08)' });

  // Place ONLY assets on this planet, clustered mid-screen with offsets
  const center = { x: CX, y: CY };
  const assets = (data.assets || []).filter(a =>
    !planetName ? true :
    (a.planet && a.planet.toLowerCase() === planetName.toLowerCase()) ||
    (a.attachTo && a.attachTo.toLowerCase() === planetName.toLowerCase())
  );

  const radius = 90;
  assets.forEach((a, i) => {
    const theta = (i / Math.max(1, assets.length)) * Math.PI * 2;
    const x = center.x + radius * Math.cos(theta);
    const y = center.y + radius * Math.sin(theta);
    circle(x, y, 6, { class: 'node' });
    label(x + 10, y + 4, `${a.kind === 'crew' ? '👤' : '🛸'} ${a.label}`, { fill: '#ffd6f5' });
  });

  // Mini planet badge (bottom-right)
  if (planet) {
    circle(W - 120, H - 100, 40, { class: 'planet' });
    label(W - 150, H - 60, planet.name.toUpperCase(), { fill: '#a9f6ff' });
  }
}

/* ---------- shared bits ---------- */

function drawAssetsAttached(data) {
  // Index planets by name → position in system view
  const index = Object.create(null);
  for (const p of data.planets) {
    index[p.name] = posOnOrbit(p.orbit, p.angle);
  }
  for (const a of (data.assets || [])) {
    const anchor = index[a.planet] || index[a.attachTo];
    if (!anchor) continue;
    const x = anchor.x + (a.dx || 0);
    const y = anchor.y + (a.dy || 0);
    circle(x, y, 6, { class: 'node' });
    label(x + 10, y + 4, `${a.kind === 'crew' ? '👤' : '🛸'} ${a.label}`, { fill: '#ffd6f5' });
  }
}

/* ---------- primitives ---------- */

function posOnOrbit(rx, angleDeg) {
  const theta = (angleDeg * Math.PI) / 180;
  const x = CX + rx * Math.cos(theta);
  const y = CY + (rx * YSQUASH) * Math.sin(theta);
  return { x, y };
}

function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

function circle(cx, cy, r, attrs = {}) {
  const c = make('circle', { cx, cy, r, ...attrs });
  svg.appendChild(c);
  return c;
}

function ellipse(cx, cy, rx, ry, attrs = {}) {
  const e = make('ellipse', { cx, cy, rx, ry, ...attrs });
  svg.appendChild(e);
  return e;
}

function line(x1, y1, x2, y2, attrs = {}) {
  const l = make('line', { x1, y1, x2, y2, ...attrs });
  svg.appendChild(l);
  return l;
}

function poly(points, attrs = {}) {
  const p = make('polygon', { points: points.map(([x, y]) => `${x},${y}`).join(' '), ...attrs });
  svg.appendChild(p);
  return p;
}

function label(x, y, text, style = {}) {
  const t = make('text', { x, y, 'font-size': 14, 'font-family': 'var(--mono)', ...style });
  t.textContent = text;
  svg.appendChild(t);
  return t;
}

function make(tag, attrs) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/* ---------- URL helpers (optional deep links) ---------- */
function getInitialView() {
  const u = new URL(location.href);
  return u.searchParams.get('view') || 'system';
}
function getInitialPlanet() {
  const u = new URL(location.href);
  return u.searchParams.get('planet');
}

main().catch(console.error);
