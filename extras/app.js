// js/app.js
const W = 1200, H = 675;
const CX = W / 2, CY = H / 2;         // center
const YSQUASH = 0.5;                  // ellipse vertical squish to look holo

const svg = document.getElementById('holo-svg');

async function main() {
  const res = await fetch('data/stanton.json');
  const data = await res.json();
  drawSystem(data);
}

function drawSystem(data) {
  clear(svg);

  // Star
  circle(CX, CY, data.star.r, { class: 'planet', fill: 'rgba(255,59,213,.12)', stroke: '#ff3bd5' });
  label(CX - 42, CY - 12, data.system.toUpperCase(), { fill: '#ffd6f5' });

  // Orbits (unique radii from planets + jumps)
  const orbitRadii = new Set([
    ...data.planets.map(p => p.orbit),
    ...(data.jump_points || []).map(j => j.orbit)
  ]);
  [...orbitRadii].sort((a, b) => a - b).forEach(r => {
    ellipse(CX, CY, r, r * YSQUASH, { class: 'orbit' });
  });

  // Planets
  const planetIndex = Object.create(null);
  for (const p of data.planets) {
    const pos = posOnOrbit(p.orbit, p.angle);
    circle(pos.x, pos.y, p.r, { class: 'planet' });
    label(pos.x + 15, pos.y + 5, p.name.toUpperCase(), { fill: '#a9f6ff' });
    planetIndex[p.name] = pos;
  }

  // Jump points
  for (const j of (data.jump_points || [])) {
    const pos = posOnOrbit(j.orbit, j.angle);
    // little delta marker for a jump gate
    poly([
      [pos.x, pos.y - 10],
      [pos.x + 10, pos.y + 8],
      [pos.x - 10, pos.y + 8]
    ], { stroke: '#17e7ff', fill: 'none' });
    label(pos.x + 12, pos.y + 4, `JUMP → ${j.to.toUpperCase()}`, { fill: '#b6fbff' });
  }

  // Assets (ships/crew pins) that attach to planets
  for (const a of (data.assets || [])) {
    const anchor = planetIndex[a.planet] || planetIndex[a.attachTo];
    if (!anchor) continue;
    const x = anchor.x + (a.dx || 0);
    const y = anchor.y + (a.dy || 0);
    circle(x, y, 6, { class: 'node' });
    label(x + 10, y + 4, `${a.kind === 'crew' ? '👤' : '🛸'} ${a.label}`, { fill: '#ffd6f5' });
  }
}

/* ---------- helpers ---------- */

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

main().catch(console.error);
