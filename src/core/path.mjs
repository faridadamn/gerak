// SVG path parsing, normalisation, flattening and shape builders. Isomorphic.
import { GerakError } from './util.mjs';

const CMD_RE = /([MmLlHhVvCcSsQqTtAaZz])|([-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?)/g;
const ARGC = { M: 2, L: 2, H: 1, V: 1, C: 6, S: 4, Q: 4, T: 2, A: 7, Z: 0 };

const parseCache = new Map();

/**
 * Parse an SVG path string into absolute commands using only M, L, C, Q, Z.
 * Supports every SVG command including relative forms, H/V, S/T and arcs.
 */
export function parsePath(d) {
  if (Array.isArray(d)) return d;
  if (typeof d !== 'string') throw new GerakError('Path harus string SVG "M ... L ..."', 'BAD_PATH');
  const hit = parseCache.get(d);
  if (hit) return hit;
  const tokens = [];
  for (const m of d.matchAll(CMD_RE)) tokens.push(m[1] ?? parseFloat(m[2]));
  const out = [];
  let i = 0;
  let cmd = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  let lcx = 0;
  let lcy = 0; // last control point (for S/T)
  let prev = '';
  while (i < tokens.length) {
    if (typeof tokens[i] === 'string') cmd = tokens[i++];
    else if (cmd === null) throw new GerakError(`Path harus diawali perintah (M): "${d.slice(0, 40)}"`, 'BAD_PATH');
    const up = cmd.toUpperCase();
    const rel = cmd !== up;
    const n = ARGC[up];
    if (up === 'Z') {
      out.push(['Z']);
      x = sx;
      y = sy;
      prev = 'Z';
      continue;
    }
    const a = tokens.slice(i, i + n);
    if (a.length < n || a.some((v) => typeof v !== 'number'))
      throw new GerakError(`Argumen path kurang untuk "${cmd}" di "${d.slice(0, 60)}"`, 'BAD_PATH');
    i += n;
    const ox = rel ? x : 0;
    const oy = rel ? y : 0;
    switch (up) {
      case 'M':
        x = a[0] + ox;
        y = a[1] + oy;
        sx = x;
        sy = y;
        out.push(['M', x, y]);
        cmd = rel ? 'l' : 'L'; // implicit lineto
        break;
      case 'L':
        x = a[0] + ox;
        y = a[1] + oy;
        out.push(['L', x, y]);
        break;
      case 'H':
        x = a[0] + (rel ? x : 0);
        out.push(['L', x, y]);
        break;
      case 'V':
        y = a[0] + (rel ? y : 0);
        out.push(['L', x, y]);
        break;
      case 'C': {
        const c = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy, a[4] + ox, a[5] + oy];
        out.push(['C', ...c]);
        lcx = c[2];
        lcy = c[3];
        x = c[4];
        y = c[5];
        break;
      }
      case 'S': {
        const r = prev === 'C' || prev === 'S';
        const c1x = r ? 2 * x - lcx : x;
        const c1y = r ? 2 * y - lcy : y;
        const c = [c1x, c1y, a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        out.push(['C', ...c]);
        lcx = c[2];
        lcy = c[3];
        x = c[4];
        y = c[5];
        break;
      }
      case 'Q': {
        const c = [a[0] + ox, a[1] + oy, a[2] + ox, a[3] + oy];
        out.push(['Q', ...c]);
        lcx = c[0];
        lcy = c[1];
        x = c[2];
        y = c[3];
        break;
      }
      case 'T': {
        const r = prev === 'Q' || prev === 'T';
        const qx = r ? 2 * x - lcx : x;
        const qy = r ? 2 * y - lcy : y;
        const ex = a[0] + ox;
        const ey = a[1] + oy;
        out.push(['Q', qx, qy, ex, ey]);
        lcx = qx;
        lcy = qy;
        x = ex;
        y = ey;
        break;
      }
      case 'A': {
        const ex = a[5] + ox;
        const ey = a[6] + oy;
        for (const c of arcToCubics(x, y, a[0], a[1], a[2], a[3], a[4], ex, ey)) out.push(c);
        x = ex;
        y = ey;
        break;
      }
    }
    prev = up;
  }
  if (parseCache.size > 2000) parseCache.clear();
  parseCache.set(d, out);
  return out;
}

/** SVG elliptical arc (endpoint form) to cubic Béziers. */
function arcToCubics(x1, y1, rx, ry, angle, largeArc, sweep, x2, y2) {
  if (rx === 0 || ry === 0) return [['L', x2, y2]];
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx);
  ry = Math.abs(ry);
  const phi = (angle * Math.PI) / 180;
  const cos = Math.cos(phi);
  const sin = Math.sin(phi);
  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy;
  const y1p = -sin * dx + cos * dy;
  const lam = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (lam > 1) {
    rx *= Math.sqrt(lam);
    ry *= Math.sqrt(lam);
  }
  const sign = largeArc === sweep ? -1 : 1;
  const num = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const den = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  const coef = sign * Math.sqrt(Math.max(0, num / den));
  const cxp = (coef * rx * y1p) / ry;
  const cyp = (-coef * ry * x1p) / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2;
  const cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const ang = (ux, uy, vx, vy) => {
    const a = Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
    return a;
  };
  const th1 = ang(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let dth = ang((x1p - cxp) / rx, (y1p - cyp) / ry, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!sweep && dth > 0) dth -= 2 * Math.PI;
  if (sweep && dth < 0) dth += 2 * Math.PI;
  const segs = Math.ceil(Math.abs(dth) / (Math.PI / 2));
  const delta = dth / segs;
  const t = (4 / 3) * Math.tan(delta / 4);
  const out = [];
  let th = th1;
  for (let i = 0; i < segs; i++) {
    const c1 = Math.cos(th);
    const s1 = Math.sin(th);
    const c2 = Math.cos(th + delta);
    const s2 = Math.sin(th + delta);
    const p = (px, py) => [cos * rx * px - sin * ry * py + cx, sin * rx * px + cos * ry * py + cy];
    const [ax, ay] = p(c1 - t * s1, s1 + t * c1);
    const [bx, by] = p(c2 + t * s2, s2 - t * c2);
    const [ex, ey] = p(c2, s2);
    out.push(['C', ax, ay, bx, by, ex, ey]);
    th += delta;
  }
  return out;
}

export function pathToString(cmds) {
  const f = (v) => +v.toFixed(2);
  return cmds.map((c) => c[0] + (c.length > 1 ? ' ' + c.slice(1).map(f).join(' ') : '')).join(' ');
}

/** Build/append commands onto a Path2D-like object (moveTo/lineTo/bezierCurveTo/...). */
export function tracePath(target, cmds) {
  for (const c of cmds) {
    switch (c[0]) {
      case 'M':
        target.moveTo(c[1], c[2]);
        break;
      case 'L':
        target.lineTo(c[1], c[2]);
        break;
      case 'C':
        target.bezierCurveTo(c[1], c[2], c[3], c[4], c[5], c[6]);
        break;
      case 'Q':
        target.quadraticCurveTo(c[1], c[2], c[3], c[4]);
        break;
      case 'Z':
        target.closePath();
        break;
    }
  }
  return target;
}

/**
 * Flatten commands into polylines: [{ pts: [x0,y0,x1,y1,...], closed }].
 * `tol` is the approximate max segment length in canvas units.
 */
export function flattenPath(cmds, tol = 2) {
  const polys = [];
  let cur = null;
  let x = 0;
  let y = 0;
  let sx = 0;
  let sy = 0;
  const push = (px, py) => {
    cur.pts.push(px, py);
    x = px;
    y = py;
  };
  for (const c of cmds) {
    switch (c[0]) {
      case 'M':
        cur = { pts: [], closed: false };
        polys.push(cur);
        push(c[1], c[2]);
        sx = x;
        sy = y;
        break;
      case 'L':
        if (!cur) {
          cur = { pts: [x, y], closed: false };
          polys.push(cur);
        }
        push(c[1], c[2]);
        break;
      case 'C': {
        if (!cur) {
          cur = { pts: [x, y], closed: false };
          polys.push(cur);
        }
        const [x0, y0] = [x, y];
        const est =
          Math.hypot(c[1] - x0, c[2] - y0) + Math.hypot(c[3] - c[1], c[4] - c[2]) + Math.hypot(c[5] - c[3], c[6] - c[4]);
        const n = Math.max(2, Math.min(200, Math.ceil(est / tol)));
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          const mt = 1 - t;
          const a = mt * mt * mt;
          const b = 3 * mt * mt * t;
          const cc = 3 * mt * t * t;
          const d = t * t * t;
          push(a * x0 + b * c[1] + cc * c[3] + d * c[5], a * y0 + b * c[2] + cc * c[4] + d * c[6]);
        }
        break;
      }
      case 'Q': {
        if (!cur) {
          cur = { pts: [x, y], closed: false };
          polys.push(cur);
        }
        const [x0, y0] = [x, y];
        const est = Math.hypot(c[1] - x0, c[2] - y0) + Math.hypot(c[3] - c[1], c[4] - c[2]);
        const n = Math.max(2, Math.min(200, Math.ceil(est / tol)));
        for (let i = 1; i <= n; i++) {
          const t = i / n;
          const mt = 1 - t;
          push(mt * mt * x0 + 2 * mt * t * c[1] + t * t * c[3], mt * mt * y0 + 2 * mt * t * c[2] + t * t * c[4]);
        }
        break;
      }
      case 'Z':
        if (cur) {
          if (x !== sx || y !== sy) cur.pts.push(sx, sy);
          cur.closed = true;
          x = sx;
          y = sy;
          cur = null;
        }
        break;
    }
  }
  return polys.filter((p) => p.pts.length >= 4);
}

export function polyLength(pts) {
  let L = 0;
  for (let i = 2; i < pts.length; i += 2) L += Math.hypot(pts[i] - pts[i - 2], pts[i + 1] - pts[i - 1]);
  return L;
}

const lenCache = new Map();
export function pathLength(d) {
  const key = typeof d === 'string' ? d : null;
  if (key && lenCache.has(key)) return lenCache.get(key);
  const L = flattenPath(parsePath(d), 1).reduce((s, p) => s + polyLength(p.pts), 0);
  if (key) {
    if (lenCache.size > 2000) lenCache.clear();
    lenCache.set(key, L);
  }
  return L;
}

export function pathBounds(d) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of flattenPath(parsePath(d), 2)) {
    for (let i = 0; i < p.pts.length; i += 2) {
      x0 = Math.min(x0, p.pts[i]);
      x1 = Math.max(x1, p.pts[i]);
      y0 = Math.min(y0, p.pts[i + 1]);
      y1 = Math.max(y1, p.pts[i + 1]);
    }
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
}

/**
 * Sample a path as evenly spaced points ({x, y}) along its length.
 * All subpaths are concatenated; pass {subpath: i} to pick one.
 */
export function samplePath(d, spacing = 4, { subpath } = {}) {
  const polys = flattenPath(parsePath(d), Math.max(0.5, spacing / 2));
  const chosen = subpath === undefined ? polys : [polys[subpath]].filter(Boolean);
  const out = [];
  for (const poly of chosen) {
    const p = poly.pts;
    out.push({ x: p[0], y: p[1] });
    let carry = 0;
    for (let i = 2; i < p.length; i += 2) {
      const ax = p[i - 2];
      const ay = p[i - 1];
      const seg = Math.hypot(p[i] - ax, p[i + 1] - ay);
      if (seg === 0) continue;
      let t = spacing - carry;
      while (t <= seg) {
        out.push({ x: ax + ((p[i] - ax) * t) / seg, y: ay + ((p[i + 1] - ay) * t) / seg });
        t += spacing;
      }
      carry = seg - (t - spacing);
    }
    const lx = p[p.length - 2];
    const ly = p[p.length - 1];
    const last = out[out.length - 1];
    if (Math.hypot(last.x - lx, last.y - ly) > 0.01) out.push({ x: lx, y: ly });
  }
  return out;
}

// ---------------------------------------------------------------- shapes

export function rectPath(x, y, w, h, r = 0) {
  if (w < 0) {
    x += w;
    w = -w;
  }
  if (h < 0) {
    y += h;
    h = -h;
  }
  const rr = Array.isArray(r) ? r : [r, r, r, r];
  const lim = Math.min(w, h) / 2;
  const [tl, tr, br, bl] = rr.map((v) => Math.max(0, Math.min(lim, v || 0)));
  if (!tl && !tr && !br && !bl) return [['M', x, y], ['L', x + w, y], ['L', x + w, y + h], ['L', x, y + h], ['Z']];
  const k = 0.5522847498;
  return [
    ['M', x + tl, y],
    ['L', x + w - tr, y],
    ['C', x + w - tr + tr * k, y, x + w, y + tr - tr * k, x + w, y + tr],
    ['L', x + w, y + h - br],
    ['C', x + w, y + h - br + br * k, x + w - br + br * k, y + h, x + w - br, y + h],
    ['L', x + bl, y + h],
    ['C', x + bl - bl * k, y + h, x, y + h - bl + bl * k, x, y + h - bl],
    ['L', x, y + tl],
    ['C', x, y + tl - tl * k, x + tl - tl * k, y, x + tl, y],
    ['Z'],
  ];
}

export function ellipsePath(cx, cy, rx, ry = rx) {
  const k = 0.5522847498;
  const ox = rx * k;
  const oy = ry * k;
  return [
    ['M', cx + rx, cy],
    ['C', cx + rx, cy + oy, cx + ox, cy + ry, cx, cy + ry],
    ['C', cx - ox, cy + ry, cx - rx, cy + oy, cx - rx, cy],
    ['C', cx - rx, cy - oy, cx - ox, cy - ry, cx, cy - ry],
    ['C', cx + ox, cy - ry, cx + rx, cy - oy, cx + rx, cy],
    ['Z'],
  ];
}

export function polygonPath(points, closed = true) {
  const pts = points.map((p) => (Array.isArray(p) ? p : [p.x, p.y]));
  const out = pts.map((p, i) => [i === 0 ? 'M' : 'L', p[0], p[1]]);
  if (closed) out.push(['Z']);
  return out;
}

/** Smooth closed/open curve through points (Catmull-Rom converted to cubic Béziers). */
export function smoothPath(points, closed = false, tension = 0.5) {
  const p = points.map((q) => (Array.isArray(q) ? q : [q.x, q.y]));
  if (p.length < 3) return polygonPath(p, closed);
  const n = p.length;
  const get = (i) => (closed ? p[(i + n) % n] : p[Math.max(0, Math.min(n - 1, i))]);
  const out = [['M', p[0][0], p[0][1]]];
  const segs = closed ? n : n - 1;
  const k = tension / 3 * 2;
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1);
    const p1 = get(i);
    const p2 = get(i + 1);
    const p3 = get(i + 2);
    out.push([
      'C',
      p1[0] + ((p2[0] - p0[0]) * k) / 2,
      p1[1] + ((p2[1] - p0[1]) * k) / 2,
      p2[0] - ((p3[0] - p1[0]) * k) / 2,
      p2[1] - ((p3[1] - p1[1]) * k) / 2,
      p2[0],
      p2[1],
    ]);
  }
  if (closed) out.push(['Z']);
  return out;
}

export function starPath(cx, cy, outer, inner, points = 5, rotationDeg = -90) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rotationDeg + (i * 180) / points) * Math.PI) / 180;
    pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return polygonPath(pts, true);
}

export function arrowPath(x1, y1, x2, y2, head = 18, headAngle = 28) {
  const a = Math.atan2(y2 - y1, x2 - x1);
  const ha = (headAngle * Math.PI) / 180;
  return [
    ['M', x1, y1],
    ['L', x2, y2],
    ['M', x2 - head * Math.cos(a - ha), y2 - head * Math.sin(a - ha)],
    ['L', x2, y2],
    ['L', x2 - head * Math.cos(a + ha), y2 - head * Math.sin(a + ha)],
  ];
}

export function arcPath(cx, cy, r, startDeg, endDeg) {
  const s = (startDeg * Math.PI) / 180;
  const e = (endDeg * Math.PI) / 180;
  const sweep = e - s;
  const segs = Math.max(1, Math.ceil(Math.abs(sweep) / (Math.PI / 2)));
  const out = [['M', cx + Math.cos(s) * r, cy + Math.sin(s) * r]];
  const d = sweep / segs;
  const t = (4 / 3) * Math.tan(d / 4);
  let th = s;
  for (let i = 0; i < segs; i++) {
    const c1 = Math.cos(th);
    const s1 = Math.sin(th);
    const c2 = Math.cos(th + d);
    const s2 = Math.sin(th + d);
    out.push([
      'C',
      cx + r * (c1 - t * s1),
      cy + r * (s1 + t * c1),
      cx + r * (c2 + t * s2),
      cy + r * (s2 - t * c2),
      cx + r * c2,
      cy + r * s2,
    ]);
    th += d;
  }
  return out;
}

/** Commands for a `shape` element. */
export function shapeCommands(el) {
  switch (el.shape) {
    case 'rect':
      return rectPath(el.x, el.y, el.w, el.h, el.r ?? 0);
    case 'circle':
      return ellipsePath(el.cx, el.cy, el.r, el.r);
    case 'ellipse':
      return ellipsePath(el.cx, el.cy, el.rx, el.ry);
    case 'line':
      return [['M', el.x1, el.y1], ['L', el.x2, el.y2]];
    case 'arrow':
      return arrowPath(el.x1, el.y1, el.x2, el.y2, el.head ?? 18, el.headAngle ?? 28);
    case 'polygon':
      return el.smooth ? smoothPath(el.points, el.closed !== false) : polygonPath(el.points, el.closed !== false);
    case 'star':
      return starPath(el.cx, el.cy, el.r1, el.r2, el.n ?? 5, el.rotation ?? -90);
    case 'arc':
      return arcPath(el.cx, el.cy, el.r, el.start ?? 0, el.end ?? 360);
    case 'path':
      return parsePath(el.d);
    default:
      throw new GerakError(`Shape "${el.shape}" tidak dikenal`, 'BAD_SHAPE');
  }
}
