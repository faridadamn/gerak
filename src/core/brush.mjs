// Brush engine: turns pen samples into marks.
// Three render modes:
//   solid — union of circles + tangent hulls (smooth, pressure-shaped ink/pen/marker)
//   dry   — solid core plus broken bristle strands (dry brush / sumi look)
//   dab   — stamped grain sprites (pencil, charcoal, chalk, airbrush)
import { normalizePoints, catmullRom, pathPoints } from './geom.mjs';
import { fbm1, noise1, rng } from './rng.mjs';
import { clamp } from './util.mjs';
import { parseColor } from './color.mjs';
import { GerakError } from './util.mjs';

export const BRUSHES = Object.freeze({
  pen: { mode: 'solid', size: 4, minWidth: 0.45, taper: [0.06, 0.1], wobble: 0.03 },
  ink: { mode: 'solid', size: 10, minWidth: 0.12, taper: [0.15, 0.28], wobble: 0.05, gamma: 0.85 },
  fineliner: { mode: 'solid', size: 3, minWidth: 0.85, taper: [0.02, 0.02], wobble: 0.02 },
  marker: { mode: 'solid', size: 16, minWidth: 0.88, taper: [0.01, 0.01], wobble: 0.02, opacity: 0.94 },
  highlighter: { mode: 'solid', size: 34, minWidth: 1, taper: [0, 0], wobble: 0.01, opacity: 0.42, blend: 'multiply' },
  brush: { mode: 'dry', size: 24, minWidth: 0.22, taper: [0.1, 0.22], wobble: 0.05, dryness: 0.35, gamma: 0.9 },
  dry: { mode: 'dry', size: 28, minWidth: 0.3, taper: [0.08, 0.3], wobble: 0.06, dryness: 0.7, gamma: 0.9 },
  pencil: { mode: 'dab', size: 3.2, minWidth: 0.55, taper: [0.05, 0.08], wobble: 0.04, flow: 0.42, hardness: 0.55, grain: 0.6, scatter: 0.12, spacing: 0.2 },
  charcoal: { mode: 'dab', size: 14, minWidth: 0.5, taper: [0.08, 0.15], wobble: 0.05, flow: 0.5, hardness: 0.35, grain: 0.85, scatter: 0.22, spacing: 0.14 },
  chalk: { mode: 'dab', size: 12, minWidth: 0.7, taper: [0.05, 0.08], wobble: 0.04, flow: 0.55, hardness: 0.8, grain: 0.9, scatter: 0.1, spacing: 0.16 },
  crayon: { mode: 'dab', size: 9, minWidth: 0.75, taper: [0.04, 0.06], wobble: 0.04, flow: 0.65, hardness: 0.9, grain: 0.72, scatter: 0.06, spacing: 0.16 },
  airbrush: { mode: 'dab', size: 46, minWidth: 0.6, taper: [0.1, 0.1], wobble: 0, flow: 0.05, hardness: 0, grain: 0, scatter: 0.02, spacing: 0.08 },
  neon: { mode: 'solid', size: 8, minWidth: 0.9, taper: [0.02, 0.02], wobble: 0.01, glow: 18 },
});

export const BRUSH_NAMES = Object.keys(BRUSHES);

/** Merge a preset (by name or object) with per-stroke overrides. */
export function resolveBrush(spec, overrides = {}) {
  let base;
  if (spec === undefined || spec === null) base = BRUSHES.ink;
  else if (typeof spec === 'string') {
    base = BRUSHES[spec];
    if (!base) throw new GerakError(`Brush "${spec}" tidak ada. Pilihan: ${BRUSH_NAMES.join(', ')}`, 'BAD_BRUSH');
  } else if (typeof spec === 'object') base = { ...(BRUSHES[spec.preset] || BRUSHES.ink), ...spec };
  const out = { ...base };
  for (const k of ['size', 'minWidth', 'taper', 'wobble', 'flow', 'hardness', 'grain', 'scatter', 'spacing', 'dryness', 'gamma', 'glow', 'mode', 'bristles', 'smooth']) {
    if (overrides[k] !== undefined) out[k] = overrides[k];
  }
  if (!Array.isArray(out.taper)) out.taper = [out.taper ?? 0, out.taper ?? 0];
  return out;
}

// ------------------------------------------------------------ geometry

const geomCache = new WeakMap();

function resample(pts, spacing) {
  const xs = [pts[0].x];
  const ys = [pts[0].y];
  const ps = [pts[0].p];
  const ss = [0];
  let total = 0;
  let need = spacing;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (seg === 0) continue;
    let t = 0;
    let rem = seg;
    while (rem >= need) {
      t += need / seg;
      rem -= need;
      total += need;
      xs.push(a.x + (b.x - a.x) * t);
      ys.push(a.y + (b.y - a.y) * t);
      ps.push(a.p + (b.p - a.p) * t);
      ss.push(total);
      need = spacing;
    }
    need -= rem;
    total += rem;
  }
  const last = pts[pts.length - 1];
  if (ss.length === 1 || total - ss[ss.length - 1] > spacing * 0.15) {
    xs.push(last.x);
    ys.push(last.y);
    ps.push(last.p);
    ss.push(total);
  }
  return { xs, ys, ps, ss, L: total };
}

function taperFactor(s, L, taper, minT) {
  let ts = taper[0] <= 1 ? taper[0] * L : taper[0];
  let te = taper[1] <= 1 ? taper[1] * L : taper[1];
  if (ts + te > L) {
    const k = L / (ts + te || 1);
    ts *= k;
    te *= k;
  }
  let f = 1;
  if (ts > 0 && s < ts) f = Math.min(f, Math.sin((s / ts) * (Math.PI / 2)));
  if (te > 0 && L - s < te) f = Math.min(f, Math.sin(((L - s) / te) * (Math.PI / 2)));
  return Math.max(minT, f);
}

/** Compute (and cache) sampled geometry for a stroke element. */
export function strokeGeometry(el) {
  const hit = geomCache.get(el);
  if (hit) return hit;
  const brush = resolveBrush(el.brush, el);
  const size = brush.size;
  let pts;
  if (el.path) pts = pathPoints(el.path, { spacing: Math.max(1, size * 0.3), pressure: el.pressure ?? 1 });
  else pts = normalizePoints(el.points);
  if (pts.length === 0) {
    const g = { n: 0, L: 0, brush };
    geomCache.set(el, g);
    return g;
  }
  if (pts.length === 1) pts = [pts[0], { ...pts[0], x: pts[0].x + 0.01 }];
  if (!el.path && brush.smooth !== false && pts.length >= 3) {
    let len = 0;
    for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
    const per = clamp(Math.round(len / (pts.length - 1) / 3), 2, 24);
    pts = catmullRom(pts, per);
  }
  const spacing = brush.mode === 'dab' ? Math.max(0.4, size * (brush.spacing ?? 0.18)) : clamp(size * 0.1, 0.5, 2.5);
  const r = resample(pts, spacing);
  const n = r.xs.length;
  const x = new Float32Array(n);
  const y = new Float32Array(n);
  const w = new Float32Array(n);
  const p = new Float32Array(n);
  const s = new Float32Array(n);
  const nx = new Float32Array(n);
  const ny = new Float32Array(n);
  const wob = (brush.wobble ?? 0) * size;
  const nz = fbm1(`${el.seed ?? 0}:wobble`);
  const pnz = noise1(`${el.seed ?? 0}:press`);
  const period = size * 2.5 + 40;
  const gamma = brush.gamma ?? 1;
  const minW = brush.minWidth ?? 0.3;
  for (let i = 0; i < n; i++) {
    const a = Math.min(n - 1, i + 1);
    const b = Math.max(0, i - 1);
    let tx = r.xs[a] - r.xs[b];
    let ty = r.ys[a] - r.ys[b];
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    nx[i] = -ty;
    ny[i] = tx;
    const o = wob ? nz(r.ss[i] / period) * wob : 0;
    x[i] = r.xs[i] + nx[i] * o;
    y[i] = r.ys[i] + ny[i] * o;
    const pr = clamp(r.ps[i] + (wob ? pnz(r.ss[i] / (period * 0.7)) * 0.06 : 0), 0, 1);
    p[i] = pr;
    s[i] = r.ss[i];
    w[i] = size * (minW + (1 - minW) * Math.pow(pr, gamma)) * taperFactor(r.ss[i], r.L, brush.taper, brush.taperMin ?? 0.06);
  }
  const g = { n, x, y, w, p, s, nx, ny, L: r.L, brush, cache: new Map() };
  geomCache.set(el, g);
  return g;
}

/** Number of samples visible at reveal length R, and the interpolated tail sample. */
function visibleCount(g, R) {
  if (R >= g.L) return { count: g.n, tail: null };
  if (R <= 0) return { count: 0, tail: null };
  let lo = 0;
  let hi = g.n - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (g.s[mid] <= R) lo = mid;
    else hi = mid - 1;
  }
  const i = lo;
  if (i >= g.n - 1) return { count: g.n, tail: null };
  const seg = g.s[i + 1] - g.s[i] || 1;
  const t = (R - g.s[i]) / seg;
  return {
    count: i + 1,
    tail: { x: g.x[i] + (g.x[i + 1] - g.x[i]) * t, y: g.y[i] + (g.y[i + 1] - g.y[i]) * t, w: g.w[i] + (g.w[i + 1] - g.w[i]) * t },
  };
}

// ------------------------------------------------------------ solid / dry path building
// Paths are built as SVG strings and parsed once: Path2D.arc() is very slow in some
// canvas backends, while string parsing is fast everywhere.

const r2 = (v) => Math.round(v * 100) / 100;

class PathBuilder {
  constructor() {
    this.parts = [];
  }

  circle(x, y, r) {
    if (r <= 0.02) return;
    const a = r2(x + r);
    const b = r2(x - r);
    const yy = r2(y);
    const rr = r2(r);
    this.parts.push(`M${a} ${yy}A${rr} ${rr} 0 1 1 ${b} ${yy}A${rr} ${rr} 0 1 1 ${a} ${yy}Z`);
  }

  quad(p) {
    this.parts.push(`M${r2(p[0])} ${r2(p[1])}L${r2(p[2])} ${r2(p[3])}L${r2(p[4])} ${r2(p[5])}L${r2(p[6])} ${r2(p[7])}Z`);
  }

  build(Path2DCtor) {
    return new Path2DCtor(this.parts.join(''));
  }
}

function addHull(pb, x0, y0, r0, x1, y1, r1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const d = Math.hypot(dx, dy);
  if (d <= Math.abs(r0 - r1) + 1e-6) return; // one circle contains the other
  const th = Math.atan2(dy, dx);
  const be = Math.acos(clamp((r0 - r1) / d, -1, 1));
  const a1 = th + be;
  const a2 = th - be;
  const p = [
    x0 + r0 * Math.cos(a1),
    y0 + r0 * Math.sin(a1),
    x1 + r1 * Math.cos(a1),
    y1 + r1 * Math.sin(a1),
    x1 + r1 * Math.cos(a2),
    y1 + r1 * Math.sin(a2),
    x0 + r0 * Math.cos(a2),
    y0 + r0 * Math.sin(a2),
  ];
  // enforce positive (canvas clockwise) orientation so nonzero fill unions everything
  let area = 0;
  for (let i = 0; i < 8; i += 2) {
    const j = (i + 2) % 8;
    area += p[i] * p[j + 1] - p[j] * p[i + 1];
  }
  if (area >= 0) pb.quad(p);
  else pb.quad([p[6], p[7], p[4], p[5], p[2], p[3], p[0], p[1]]);
}

function traceRibbon(pb, pts) {
  // pts: array of [x, y, r]. A circle at every sample plus tangent hulls between
  // neighbours gives an exact union even where width changes quickly.
  for (let i = 0; i < pts.length; i++) {
    const [x, y, r] = pts[i];
    if (i > 0) {
      const [px, py, pr] = pts[i - 1];
      if (pr > 0.02 || r > 0.02) addHull(pb, px, py, Math.max(pr, 0.01), x, y, Math.max(r, 0.01));
    }
    pb.circle(x, y, r);
  }
}

function buildSolid(Path2DCtor, g, count, tail, widthMul = 1, pb = new PathBuilder()) {
  const pts = [];
  for (let i = 0; i < count; i++) pts.push([g.x[i], g.y[i], (g.w[i] * widthMul) / 2]);
  if (tail) pts.push([tail.x, tail.y, (tail.w * widthMul) / 2]);
  traceRibbon(pb, pts);
  return Path2DCtor ? pb.build(Path2DCtor) : pb;
}

function buildDry(Path2DCtor, g, count, tail, seed) {
  // Bristles tile the full width; dry streaks appear where bristles skip.
  const brush = g.brush;
  const dry = clamp(brush.dryness ?? 0.4, 0, 1);
  const pb = new PathBuilder();
  buildSolid(null, g, count, tail, dry > 0.5 ? 0.22 : 0.42, pb);
  const K = brush.bristles && brush.bristles !== 'auto' ? brush.bristles : clamp(Math.round(brush.size / 2.2), 6, 22);
  const R = rng(`${seed}:bristles`);
  const n = tail ? count + 1 : count;
  const last = Math.max(0, count - 1);
  const at = (i) =>
    i < count
      ? [g.x[i], g.y[i], g.w[i], g.p[i], g.s[i], g.nx[i], g.ny[i]]
      : [tail.x, tail.y, tail.w, g.p[last], g.s[last], g.nx[last], g.ny[last]];
  for (let k = 0; k < K; k++) {
    const off = (K === 1 ? 0 : k / (K - 1) - 0.5) * 0.92 + (R() - 0.5) * (0.6 / K);
    const thick = (1 / K) * (1.15 + R() * 0.5);
    const nzf = noise1(`${seed}:b${k}`);
    const freq = 1 / (brush.size * (1.5 + R() * 3));
    const edge = Math.abs(off) * 2; // 0 center .. 1 edge
    const bias = (R() - 0.5) * 0.3;
    let run = [];
    for (let i = 0; i < n; i++) {
      const [x, y, w, pr, s, nx, ny] = at(i);
      const along = g.L > 0 ? s / g.L : 0;
      const thr = -0.85 + dry * (0.55 + 0.75 * along) + edge * edge * 0.55 * (0.4 + dry) - (pr - 0.55) * 0.6 + bias;
      if (nzf(s * freq) > thr) {
        const o = off * w;
        run.push([x + nx * o, y + ny * o, (w * thick) / 2]);
      } else if (run.length) {
        traceRibbon(pb, run);
        run = [];
      }
    }
    if (run.length) traceRibbon(pb, run);
  }
  return pb.build(Path2DCtor);
}

// ------------------------------------------------------------ dab sprites

const spriteCache = new Map();

function dabSprite(env, color, hardness, grain, seed) {
  const key = `${color}|${hardness}|${grain}|${seed}`;
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const S = 64;
  const cv = env.createCanvas(S, S);
  const cx = cv.getContext('2d');
  const img = cx.createImageData(S, S);
  const [r, gg, b, a] = parseColor(color) || [0, 0, 0, 1];
  const R = rng(`${seed}:grain`);
  // coarse grain lattice for paper-like texture
  const G = 16;
  const lat = new Float32Array((G + 1) * (G + 1)).map(() => R());
  const latAt = (u, v) => {
    const x = u * G;
    const y = v * G;
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;
    const q = (ii, jj) => lat[Math.min(G, jj) * (G + 1) + Math.min(G, ii)];
    return (q(i, j) * (1 - fx) + q(i + 1, j) * fx) * (1 - fy) + (q(i, j + 1) * (1 - fx) + q(i + 1, j + 1) * fx) * fy;
  };
  for (let yy = 0; yy < S; yy++) {
    for (let xx = 0; xx < S; xx++) {
      const dx = (xx + 0.5) / S - 0.5;
      const dy = (yy + 0.5) / S - 0.5;
      const d = Math.hypot(dx, dy) * 2; // 0 center .. 1 edge
      let al;
      if (d >= 1) al = 0;
      else {
        const h = clamp(hardness, 0, 0.99);
        al = d <= h ? 1 : 1 - (d - h) / (1 - h);
        al = al * al * (3 - 2 * al);
      }
      if (grain > 0 && al > 0) {
        const fine = R();
        const coarse = latAt((xx + 0.5) / S, (yy + 0.5) / S);
        const tex = clamp(0.35 * fine + 0.65 * coarse, 0, 1);
        al *= clamp(1 - grain + grain * (tex * 1.6 - 0.3), 0, 1);
      }
      const o = (yy * S + xx) * 4;
      img.data[o] = r;
      img.data[o + 1] = gg;
      img.data[o + 2] = b;
      img.data[o + 3] = Math.round(al * a * 255);
    }
  }
  cx.putImageData(img, 0, 0);
  if (spriteCache.size > 256) spriteCache.clear();
  spriteCache.set(key, cv);
  return cv;
}

function drawDabs(ctx, env, g, count, tail, color, seed) {
  const brush = g.brush;
  const R = rng(`${seed}:dabs`);
  const variants = [0, 1, 2].map((v) => dabSprite(env, color, brush.hardness ?? 0.5, brush.grain ?? 0.5, `${seed}:${v}`));
  const m = ctx.getTransform();
  const flow = brush.flow ?? 0.4;
  const scatter = brush.scatter ?? 0;
  const baseAlpha = ctx.globalAlpha;
  const n = tail ? count + 1 : count;
  for (let i = 0; i < n; i++) {
    const x = i < count ? g.x[i] : tail.x;
    const y = i < count ? g.y[i] : tail.y;
    const w = i < count ? g.w[i] : tail.w;
    const pr = i < count ? g.p[i] : g.p[Math.max(0, count - 1)];
    const rot = R() * Math.PI * 2;
    const jx = (R() - 0.5) * 2 * scatter * w;
    const jy = (R() - 0.5) * 2 * scatter * w;
    const sz = w * (0.9 + R() * 0.2);
    const v = variants[(R() * 3) | 0];
    ctx.globalAlpha = baseAlpha * flow * (0.35 + 0.65 * pr);
    const c = Math.cos(rot);
    const s = Math.sin(rot);
    const px = x + jx;
    const py = y + jy;
    ctx.setTransform(m.a * c + m.c * s, m.b * c + m.d * s, -m.a * s + m.c * c, -m.b * s + m.d * c, m.a * px + m.c * py + m.e, m.b * px + m.d * py + m.f);
    ctx.drawImage(v, -sz / 2, -sz / 2, sz, sz);
  }
  ctx.setTransform(m);
  ctx.globalAlpha = baseAlpha;
}

// ------------------------------------------------------------ public draw

function strokeBounds(g) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  const extra = g.brush.mode === 'dab' ? 1 + (g.brush.scatter ?? 0) * 2 : 1;
  for (let i = 0; i < g.n; i++) {
    const r = (g.w[i] / 2) * extra + 1;
    if (g.x[i] - r < x0) x0 = g.x[i] - r;
    if (g.x[i] + r > x1) x1 = g.x[i] + r;
    if (g.y[i] - r < y0) y0 = g.y[i] - r;
    if (g.y[i] + r > y1) y1 = g.y[i] + r;
  }
  return { x0, y0, x1, y1 };
}

/** Rasterise the stroke body (no reveal) with the current transform state. */
function paintStroke(ctx, env, el, g, count, tail) {
  const brush = g.brush;
  const color = el.color ?? '#141414';
  const seed = el.seed ?? 0;
  if (brush.glow) {
    const m = ctx.getTransform();
    ctx.shadowColor = el.glowColor ?? color;
    ctx.shadowBlur = brush.glow * Math.hypot(m.a, m.b);
  }
  if (brush.mode === 'dab') {
    drawDabs(ctx, env, g, count, tail, el.erase ? '#000000' : color, seed);
    return;
  }
  let path;
  const full = count === g.n && !tail;
  if (full && g.cache.has('full')) path = g.cache.get('full');
  else {
    path = brush.mode === 'dry' ? buildDry(env.Path2D, g, count, tail, seed) : buildSolid(env.Path2D, g, count, tail);
    if (full) g.cache.set('full', path);
  }
  ctx.fillStyle = color;
  ctx.fill(path);
  if (brush.glow) {
    const m = ctx.getTransform();
    ctx.shadowBlur = (brush.glow * Math.hypot(m.a, m.b)) / 3;
    ctx.fill(path);
  }
}

const MAX_CACHE_PX = 4096 * 4096;

/**
 * Draw a completed stroke from a cached bitmap. The bitmap is keyed on the linear part of the
 * current transform; pure translation reuses it. Strokes whose scale/rotation keeps changing
 * fall back to direct drawing.
 */
function drawCached(ctx, env, el, g) {
  const m = ctx.getTransform();
  const L = [m.a, m.b, m.c, m.d];
  let c = g.cache.get('bitmap');
  const same = c && Math.abs(c.L[0] - L[0]) < 1e-4 && Math.abs(c.L[1] - L[1]) < 1e-4 && Math.abs(c.L[2] - L[2]) < 1e-4 && Math.abs(c.L[3] - L[3]) < 1e-4;
  if (!same) {
    const misses = (c?.misses ?? 0) + 1;
    if (misses > 3) {
      g.cache.set('bitmap', { ...c, L, misses, dead: true });
      return false;
    }
    const b = g.bounds || (g.bounds = strokeBounds(g));
    const glow = (g.brush.glow ?? 0) * Math.hypot(m.a, m.b) * 1.5;
    const pad = 2 + glow;
    const corners = [
      [b.x0, b.y0],
      [b.x1, b.y0],
      [b.x0, b.y1],
      [b.x1, b.y1],
    ].map(([x, y]) => [m.a * x + m.c * y, m.b * x + m.d * y]);
    // integer-aligned bitmap; the fractional translation is baked in so static frames match exactly
    const fe = m.e - Math.floor(m.e);
    const ff = m.f - Math.floor(m.f);
    const dx0 = Math.floor(Math.min(...corners.map((q) => q[0])) - pad);
    const dy0 = Math.floor(Math.min(...corners.map((q) => q[1])) - pad);
    const dx1 = Math.ceil(Math.max(...corners.map((q) => q[0])) + pad + 1);
    const dy1 = Math.ceil(Math.max(...corners.map((q) => q[1])) + pad + 1);
    const w = dx1 - dx0;
    const h = dy1 - dy0;
    if (w <= 0 || h <= 0 || w * h > MAX_CACHE_PX) return false;
    const cv = env.createCanvas(w, h);
    const x = cv.getContext('2d');
    x.setTransform(m.a, m.b, m.c, m.d, -dx0 + fe, -dy0 + ff);
    if (g.brush.opacity !== undefined) x.globalAlpha = g.brush.opacity;
    paintStroke(x, env, el, g, g.n, null);
    c = { L, cv, dx0, dy0, misses: same ? 0 : misses };
    g.cache.set('bitmap', c);
  } else if (c.dead) return false;
  else c.misses = 0;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(c.cv, Math.floor(m.e) + c.dx0, Math.floor(m.f) + c.dy0);
  ctx.restore();
  return true;
}

/**
 * Draw a stroke element.
 * progress: 0..1 portion of the stroke length to reveal.
 */
export function drawStroke(ctx, env, el, progress = 1) {
  const g = strokeGeometry(el);
  if (g.n === 0 || progress <= 0) return;
  const brush = g.brush;
  ctx.save();
  if (el.erase) ctx.globalCompositeOperation = 'destination-out';
  else if (brush.blend && !el.blend) ctx.globalCompositeOperation = brush.blend;
  if (progress >= 1 && !el.noCache && drawCached(ctx, env, el, g)) {
    ctx.restore();
    return;
  }
  const R = progress >= 1 ? g.L + 1 : progress * g.L;
  const { count, tail } = visibleCount(g, R);
  if (count === 0 && !tail) {
    ctx.restore();
    return;
  }
  if (brush.opacity !== undefined) ctx.globalAlpha *= brush.opacity;
  paintStroke(ctx, env, el, g, count, tail);
  ctx.restore();
}

export function strokeLength(el) {
  return strokeGeometry(el).L;
}
