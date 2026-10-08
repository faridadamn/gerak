// Pen-sample helpers for brush strokes. A point is {x, y, p} (p = pressure 0..1).
import { rng, noise1 } from './rng.mjs';
import { samplePath } from './path.mjs';
import { clamp } from './util.mjs';

/** Normalise input points: [x,y,p] arrays, {x,y,p|pressure} objects. */
export function normalizePoints(points, defaultPressure = 1) {
  if (!Array.isArray(points)) return [];
  return points.map((q) => {
    if (Array.isArray(q)) return { x: +q[0], y: +q[1], p: q[2] ?? defaultPressure };
    return { x: +q.x, y: +q.y, p: q.p ?? q.pressure ?? defaultPressure };
  });
}

/** Compact storage form [[x,y,p], ...] rounded to 2 decimals. */
export function packPoints(points) {
  const r = (v) => Math.round(v * 100) / 100;
  return normalizePoints(points).map((q) => [r(q.x), r(q.y), r(clamp(q.p, 0, 1))]);
}

/** Smooth curve through control points (centripetal-ish Catmull-Rom), `n` samples per segment. */
export function catmullRom(points, n = 16) {
  const p = normalizePoints(points);
  if (p.length < 3) return p;
  const out = [];
  const get = (i) => p[Math.max(0, Math.min(p.length - 1, i))];
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    for (let j = 0; j < n; j++) {
      const t = j / n;
      const t2 = t * t;
      const t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push({ x: f(p0.x, p1.x, p2.x, p3.x), y: f(p0.y, p1.y, p2.y, p3.y), p: p1.p + (p2.p - p1.p) * t });
    }
  }
  out.push({ ...p[p.length - 1] });
  return out;
}

export function line(x1, y1, x2, y2, { pressure = 1, n = 2 } = {}) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1);
    out.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t, p: typeof pressure === 'function' ? pressure(t) : pressure });
  }
  return out;
}

/** Points along an ellipse arc. Angles in degrees. */
export function ellipsePoints(cx, cy, rx, ry = rx, { start = 0, end = 360, n = 48, pressure = 1 } = {}) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = ((start + (end - start) * t) * Math.PI) / 180;
    out.push({ x: cx + Math.cos(a) * rx, y: cy + Math.sin(a) * ry, p: typeof pressure === 'function' ? pressure(t) : pressure });
  }
  return out;
}

/** Sample an SVG path into pen points with an optional pressure profile. */
export function pathPoints(d, { spacing = 4, pressure = 1 } = {}) {
  const pts = samplePath(d, spacing);
  const prof = pressureProfile(pressure);
  return pts.map((q, i) => ({ x: q.x, y: q.y, p: prof(pts.length === 1 ? 0 : i / (pts.length - 1)) }));
}

/**
 * Pressure profiles: number, function(t), or a name:
 *  'taper' (thin-thick-thin), 'in' (thin->thick), 'out' (thick->thin), 'swell', 'flat'.
 */
export function pressureProfile(spec) {
  if (typeof spec === 'function') return spec;
  if (typeof spec === 'number') return () => spec;
  switch (spec) {
    case 'taper':
      return (t) => 0.25 + 0.75 * Math.sin(Math.PI * t);
    case 'in':
      return (t) => 0.2 + 0.8 * Math.min(1, t * 2.5);
    case 'out':
      return (t) => 1 - 0.8 * Math.max(0, (t - 0.4) / 0.6);
    case 'swell':
      return (t) => 0.5 + 0.5 * Math.sin(Math.PI * t) ** 0.6;
    case 'flat':
    case undefined:
    case null:
      return () => 1;
    default:
      return () => 1;
  }
}

export function withPressure(points, spec) {
  const p = normalizePoints(points);
  const prof = pressureProfile(spec);
  return p.map((q, i) => ({ ...q, p: prof(p.length === 1 ? 0 : i / (p.length - 1)) }));
}

/** Hand-drawn wobble: offsets points perpendicular to the path with smooth noise. */
export function wobble(points, amount = 2, { seed = 1, freq = 0.03 } = {}) {
  const p = normalizePoints(points);
  const nz = noise1(seed);
  let s = 0;
  return p.map((q, i) => {
    if (i > 0) s += Math.hypot(q.x - p[i - 1].x, q.y - p[i - 1].y);
    const a = p[Math.min(p.length - 1, i + 1)];
    const b = p[Math.max(0, i - 1)];
    const ang = Math.atan2(a.y - b.y, a.x - b.x);
    const o = nz(s * freq) * amount;
    return { x: q.x - Math.sin(ang) * o, y: q.y + Math.cos(ang) * o, p: q.p };
  });
}

/** Random jitter of control points (for sketchy, deliberately imperfect marks). */
export function jitter(points, amount = 2, seed = 1) {
  const r = rng(seed);
  return normalizePoints(points).map((q) => ({ x: q.x + (r() * 2 - 1) * amount, y: q.y + (r() * 2 - 1) * amount, p: q.p }));
}

export function translate(points, dx, dy) {
  return normalizePoints(points).map((q) => ({ ...q, x: q.x + dx, y: q.y + dy }));
}

export function scale(points, sx, sy = sx, ox = 0, oy = 0) {
  return normalizePoints(points).map((q) => ({ ...q, x: ox + (q.x - ox) * sx, y: oy + (q.y - oy) * sy }));
}

export function rotate(points, deg, ox = 0, oy = 0) {
  const a = (deg * Math.PI) / 180;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return normalizePoints(points).map((q) => ({
    ...q,
    x: ox + (q.x - ox) * c - (q.y - oy) * s,
    y: oy + (q.x - ox) * s + (q.y - oy) * c,
  }));
}

export function mirror(points, axisX) {
  return normalizePoints(points).map((q) => ({ ...q, x: 2 * axisX - q.x }));
}
