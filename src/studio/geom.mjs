// Editor geometry: node matrices (same math as the renderer), element bounds, hit testing,
// and moving/scaling element geometry.
import { evalTransform, evalCamera, evalDrawing } from '/core/keys.mjs';
import { shapeCommands, parsePath, pathToString } from '/core/path.mjs';
import { textBounds } from '/core/text.mjs';
import { resolveBrush } from '/core/brush.mjs';

const DEG = Math.PI / 180;

export function localMatrix(t) {
  let m = new DOMMatrix().translate(t.x, t.y);
  const px = t.pivotX;
  const py = t.pivotY;
  if (px || py) m = m.translate(px, py);
  if (t.rotation) m = m.rotate(t.rotation);
  if (t.skewX || t.skewY) m = m.multiply(new DOMMatrix([1, Math.tan(t.skewY * DEG), Math.tan(t.skewX * DEG), 1, 0, 0]));
  const sx = t.scale * t.scaleX;
  const sy = t.scale * t.scaleY;
  if (sx !== 1 || sy !== 1) m = m.scale(sx, sy);
  if (px || py) m = m.translate(-px, -py);
  return m;
}

export function cameraMatrix(cam, depth, W, H) {
  const d = depth > 0 ? depth : 1;
  const z = Math.pow(cam.zoom, 1 / d);
  let m = new DOMMatrix().translate(W / 2, H / 2);
  if (cam.rotation) m = m.rotate(-cam.rotation);
  if (z !== 1) m = m.scale(z, z);
  return m.translate(-W / 2 - cam.x / d, -H / 2 - cam.y / d);
}

/**
 * Matrices along a node path at local frame lf.
 * Returns [{node, t, parent, world}] — parent = matrix before the node's own transform.
 */
export function chain(path, lf, sc, doc) {
  const cam = evalCamera(sc.camera, lf, doc.fps);
  const out = [];
  let m = new DOMMatrix();
  path.forEach((node, i) => {
    const t = evalTransform(node, lf, doc.fps);
    const parent = i === 0 ? (node.fixed ? new DOMMatrix() : cameraMatrix(cam, t.depth, doc.width, doc.height)) : m;
    m = parent.multiply(localMatrix(t));
    out.push({ node, t, parent, world: m });
  });
  return out;
}

/** Matrix of the parent space for a new root layer (camera, depth 1). */
export function rootParentMatrix(sc, lf, doc, fixed = false) {
  if (fixed) return new DOMMatrix();
  return cameraMatrix(evalCamera(sc.camera, lf, doc.fps), 1, doc.width, doc.height);
}

export const apply = (m, x, y) => {
  const p = m.transformPoint(new DOMPoint(x, y));
  return [p.x, p.y];
};

/** Transform a vector (no translation). */
export const applyVec = (m, x, y) => [m.a * x + m.c * y, m.b * x + m.d * y];

export const matScale = (m) => Math.sqrt(Math.abs(m.a * m.d - m.b * m.c)) || 1;

// ------------------------------------------------------------ element bounds (local)

let measureCtx = null;
function mctx() {
  if (!measureCtx) measureCtx = document.createElement('canvas').getContext('2d');
  return measureCtx;
}

function cmdBounds(cmds) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const c of cmds) {
    for (let i = 1; i + 1 < c.length; i += 2) {
      if (c[i] < x0) x0 = c[i];
      if (c[i] > x1) x1 = c[i];
      if (c[i + 1] < y0) y0 = c[i + 1];
      if (c[i + 1] > y1) y1 = c[i + 1];
    }
  }
  return x0 === Infinity ? null : { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function pad(b, p) {
  return b ? { x: b.x - p, y: b.y - p, w: b.w + 2 * p, h: b.h + 2 * p } : null;
}

export function strokeSize(el) {
  try {
    return el.size ?? resolveBrush(el.brush ?? 'ink', {}).size ?? 8;
  } catch {
    return el.size ?? 8;
  }
}

function strokePoints(el) {
  if (el.points) return el.points;
  if (el.path) {
    const pts = [];
    for (const c of parsePath(el.path)) for (let i = 1; i + 1 < c.length; i += 2) pts.push([c[i], c[i + 1]]);
    return pts;
  }
  return [];
}

export function imageSize(el, env) {
  const img = env.images?.get(el.src);
  const iw = img ? img.naturalWidth || img.width : 400;
  const ih = img ? img.naturalHeight || img.height : 300;
  let w = el.width;
  let h = el.height;
  if (w === undefined && h === undefined) {
    w = iw;
    h = ih;
  } else if (w === undefined) w = (h * iw) / ih;
  else if (h === undefined) h = (w * ih) / iw;
  return { w, h, iw, ih };
}

/** Bounds of an element in its layer's coordinates: {x, y, w, h} or null. */
export function elementBounds(el, env) {
  try {
    switch (el.type) {
      case 'shape': {
        const b = cmdBounds(shapeCommands(el));
        return pad(b, (el.stroke ? (el.strokeWidth ?? 2) / 2 : 0) + (el.sketch ? 4 : 0));
      }
      case 'stroke': {
        const pts = strokePoints(el);
        if (!pts.length) return null;
        let x0 = Infinity;
        let y0 = Infinity;
        let x1 = -Infinity;
        let y1 = -Infinity;
        for (const q of pts) {
          if (q[0] < x0) x0 = q[0];
          if (q[0] > x1) x1 = q[0];
          if (q[1] < y0) y0 = q[1];
          if (q[1] > y1) y1 = q[1];
        }
        return pad({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 }, strokeSize(el) / 2 + (el.glow ?? 0) * 0.3);
      }
      case 'text': {
        const ctx = mctx();
        const b = textBounds(ctx, el, env.fontEpoch ?? 0);
        let out = { x: b.x, y: b.y, w: b.width, h: b.height };
        if (el.fit && b.width > el.fit) {
          const k = el.fit / b.width;
          const ax = el.x ?? 0;
          const ay = el.y ?? 0;
          out = { x: ax + (out.x - ax) * k, y: ay + (out.y - ay) * k, w: out.w * k, h: out.h * k };
        }
        if (el.box) {
          const bx = el.box === true ? {} : el.box;
          const size = el.size ?? 48;
          out = { x: out.x - (bx.padX ?? size * 0.35), y: out.y - (bx.padY ?? size * 0.18), w: out.w + 2 * (bx.padX ?? size * 0.35), h: out.h + 2 * (bx.padY ?? size * 0.18) };
        }
        if (out.w < 4) out = { ...out, x: out.x - 10, w: out.w + 20 };
        return out;
      }
      case 'image': {
        const { w, h } = imageSize(el, env);
        let x = el.x ?? 0;
        let y = el.y ?? 0;
        if (el.anchor === 'center') {
          x -= w / 2;
          y -= h / 2;
        }
        return { x, y, w, h };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function unionBounds(a, b) {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, w: Math.max(a.x + a.w, b.x + b.w) - x, h: Math.max(a.y + a.h, b.y + b.h) - y };
}

function boundsCorners(b, m) {
  return [apply(m, b.x, b.y), apply(m, b.x + b.w, b.y), apply(m, b.x + b.w, b.y + b.h), apply(m, b.x, b.y + b.h)];
}

/** Bounds of a node's content in the node's own coordinates (children mapped through their transforms). */
export function nodeLocalBounds(node, lf, doc, env) {
  let b = null;
  for (const el of node.elements || []) if (!el.hidden) b = unionBounds(b, elementBounds(el, env));
  let kids = node.children || [];
  if (node.type === 'track' && node.drawings?.length) {
    const active = evalDrawing(node.drawings, lf);
    kids = kids.filter((c) => c.id === active);
  }
  for (const c of kids) {
    if (c.id === node.mask) continue;
    const cb = nodeLocalBounds(c, lf, doc, env);
    if (!cb) continue;
    const m = localMatrix(evalTransform(c, lf, doc.fps));
    const pts = boundsCorners(cb, m);
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    b = unionBounds(b, { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) });
  }
  return b;
}

/** Corners of local bounds mapped by a matrix (4 points). */
export function quad(b, m) {
  return boundsCorners(b, m);
}

// ------------------------------------------------------------ hit testing

function distToSeg(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const L = dx * dx + dy * dy;
  let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function inBounds(b, x, y, tol = 0) {
  return b && x >= b.x - tol && x <= b.x + b.w + tol && y >= b.y - tol && y <= b.y + b.h + tol;
}

function hitElement(el, x, y, tolLocal, env) {
  if (el.type === 'stroke' && el.points && el.points.length > 1) {
    const r = strokeSize(el) / 2 + tolLocal;
    const pts = el.points;
    for (let i = 1; i < pts.length; i++) if (distToSeg(x, y, pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1]) <= r) return true;
    return false;
  }
  if (el.type === 'shape' && (el.shape === 'line' || el.shape === 'arrow') && !el.sketch) {
    return distToSeg(x, y, el.x1, el.y1, el.x2, el.y2) <= (el.strokeWidth ?? 4) / 2 + tolLocal;
  }
  return inBounds(elementBounds(el, env), x, y, tolLocal);
}

/**
 * Top-most element under doc point (px, py) in a scene at local frame lf.
 * opts.tol: tolerance in doc px; opts.skip(node) → true to ignore a node subtree.
 * Returns { path:[nodes], el } or null.
 */
export function hitTest(sc, lf, doc, env, px, py, { tol = 6, skip } = {}) {
  const cam = evalCamera(sc.camera, lf, doc.fps);
  const visit = (nodes, parentM, isRoot, path) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i];
      if (node.visible === false) continue;
      if (skip && skip(node)) continue;
      if (node.exposure && (lf < node.exposure[0] || lf >= node.exposure[1])) continue;
      const t = evalTransform(node, lf, doc.fps);
      if (t.opacity <= 0.01) continue;
      const parent = isRoot ? (node.fixed ? new DOMMatrix() : cameraMatrix(cam, t.depth, doc.width, doc.height)) : parentM;
      const m = parent.multiply(localMatrix(t));
      const p = [...path, node];
      // children are drawn after elements → test them first
      let kids = node.children || [];
      if (node.type === 'track' && node.drawings?.length) {
        const active = evalDrawing(node.drawings, lf);
        kids = kids.filter((c) => c.id === active).map((c) => ({ ...c, visible: true, __orig: c }));
      }
      kids = kids.filter((c) => c.id !== node.mask);
      const hit = visit(kids, m, false, p);
      if (hit) return hit;
      const inv = m.inverse();
      const [lx, ly] = apply(inv, px, py);
      const tl = tol / matScale(m);
      const els = node.elements || [];
      for (let k = els.length - 1; k >= 0; k--) {
        const el = els[k];
        if (el.hidden || el.erase) continue;
        if (el.show && (lf < el.show[0] || lf >= (el.show[1] ?? Infinity))) continue;
        if (hitElement(el, lx, ly, tl, env)) return { path: p.map((n) => n.__orig ?? n), el };
      }
    }
    return null;
  };
  return visit(sc.layers || [], new DOMMatrix(), true, []);
}

// ------------------------------------------------------------ element geometry edits

function mapCmds(d, fn) {
  return pathToString(
    parsePath(d).map((c) => {
      const out = [c[0]];
      for (let i = 1; i + 1 < c.length; i += 2) out.push(...fn(c[i], c[i + 1]));
      return out;
    }),
  );
}

const r2 = (v) => Math.round(v * 100) / 100;

/** Apply a point mapping (x,y)→[x,y] and a uniform size factor to an element. Returns a new element. */
export function mapElement(el, fn, k = 1) {
  const e = { ...el };
  const P = (x, y) => fn(x, y).map(r2);
  switch (el.type) {
    case 'shape':
      switch (el.shape) {
        case 'rect': {
          const [x, y] = P(el.x, el.y);
          Object.assign(e, { x, y, w: r2(el.w * k), h: r2(el.h * k) });
          if (el.r) e.r = r2(el.r * k);
          break;
        }
        case 'circle': {
          const [cx, cy] = P(el.cx, el.cy);
          Object.assign(e, { cx, cy, r: r2(el.r * k) });
          break;
        }
        case 'ellipse': {
          const [cx, cy] = P(el.cx, el.cy);
          Object.assign(e, { cx, cy, rx: r2(el.rx * k), ry: r2(el.ry * k) });
          break;
        }
        case 'star': {
          const [cx, cy] = P(el.cx, el.cy);
          Object.assign(e, { cx, cy, r1: r2(el.r1 * k), r2: r2(el.r2 * k) });
          break;
        }
        case 'arc': {
          const [cx, cy] = P(el.cx, el.cy);
          Object.assign(e, { cx, cy, r: r2(el.r * k) });
          break;
        }
        case 'line':
        case 'arrow': {
          const [x1, y1] = P(el.x1, el.y1);
          const [x2, y2] = P(el.x2, el.y2);
          Object.assign(e, { x1, y1, x2, y2 });
          if (el.head) e.head = r2(el.head * k);
          break;
        }
        case 'polygon':
          e.points = el.points.map((q) => P(q[0], q[1]));
          break;
        case 'path':
          e.d = mapCmds(el.d, P);
          break;
        default:
          break;
      }
      if (el.strokeWidth && k !== 1) e.strokeWidth = r2(el.strokeWidth * k);
      break;
    case 'stroke':
      if (el.points) e.points = el.points.map((q) => [...P(q[0], q[1]), q[2] ?? 1]);
      else if (el.path) e.path = mapCmds(el.path, P);
      if (k !== 1) e.size = r2(strokeSize(el) * k);
      break;
    case 'text': {
      const [x, y] = P(el.x ?? 0, el.y ?? 0);
      Object.assign(e, { x, y });
      if (k !== 1) {
        e.size = r2((el.size ?? 48) * k);
        if (el.maxWidth) e.maxWidth = r2(el.maxWidth * k);
        if (el.fit) e.fit = r2(el.fit * k);
        if (el.strokeWidth) e.strokeWidth = r2(el.strokeWidth * k);
      }
      break;
    }
    case 'image': {
      const [x, y] = P(el.x ?? 0, el.y ?? 0);
      Object.assign(e, { x, y });
      if (k !== 1) {
        if (el.width !== undefined) e.width = r2(el.width * k);
        if (el.height !== undefined) e.height = r2(el.height * k);
        if (el.width === undefined && el.height === undefined) e.width = r2(400 * k);
        if (el.radius) e.radius = r2(el.radius * k);
      }
      break;
    }
    default:
      break;
  }
  return e;
}

export const translateElement = (el, dx, dy) => mapElement(el, (x, y) => [x + dx, y + dy]);

export const scaleElement = (el, k, ox, oy) => mapElement(el, (x, y) => [ox + (x - ox) * k, oy + (y - oy) * k], k);

/** Centre of an element's bounds (local). */
export function elementCenter(el, env) {
  const b = elementBounds(el, env);
  return b ? [b.x + b.w / 2, b.y + b.h / 2] : [0, 0];
}

/**
 * Move a node's pivot to the centre of its content when that cannot change how it looks
 * (no scale/rotation/skew anywhere in its animation). Makes pop/zoom/rotate/handles behave
 * around the object instead of the canvas origin. Returns true when the pivot moved.
 */
export function autoPivotTarget(node, lf, doc, env) {
  const t = node.transform || {};
  const k = node.keys || {};
  for (const ch of ['scale', 'scaleX', 'scaleY', 'rotation', 'skewX', 'skewY', 'pivotX', 'pivotY']) if (k[ch]?.length) return null;
  if ((t.scale ?? 1) !== 1 || (t.scaleX ?? 1) !== 1 || (t.scaleY ?? 1) !== 1 || (t.rotation ?? 0) !== 0 || (t.skewX ?? 0) !== 0 || (t.skewY ?? 0) !== 0) return null;
  if ((node.behaviors || []).some((b) => b.rot || b.scale || ['spin', 'pulse', 'sway'].includes(b.type))) return null;
  const b = nodeLocalBounds(node, lf, doc, env);
  if (!b) return null;
  const px = Math.round(b.x + b.w / 2);
  const py = Math.round(b.y + b.h / 2);
  if ((t.pivotX ?? 0) === px && (t.pivotY ?? 0) === py) return null;
  return [px, py];
}

export function autoPivot(node, lf, doc, env) {
  const p = autoPivotTarget(node, lf, doc, env);
  if (!p) return false;
  node.transform = { ...(node.transform || {}), pivotX: p[0], pivotY: p[1] };
  return true;
}
