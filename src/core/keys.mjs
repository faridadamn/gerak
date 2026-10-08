// Keyframe channels, transforms and procedural behaviors.
import { resolveEase } from './easing.mjs';
import { isColor, mixColor } from './color.mjs';
import { binarySearchLast, clamp, smoothstep } from './util.mjs';
import { noise1 } from './rng.mjs';

/** Transform channels a node supports, with defaults. Rotation/skew in degrees. */
export const TRANSFORM_DEFAULTS = Object.freeze({
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  scaleX: 1,
  scaleY: 1,
  skewX: 0,
  skewY: 0,
  pivotX: 0,
  pivotY: 0,
  opacity: 1,
  blur: 0,
  depth: 1,
});

export const CAMERA_DEFAULTS = Object.freeze({ x: 0, y: 0, zoom: 1, rotation: 0 });

/**
 * Evaluate one channel: keys = [{f, v, e}] sorted by f.
 * Before the first key the first value holds; after the last key the last value holds.
 * The easing of the key at the start of a segment shapes that segment.
 */
export function evalChannel(keys, frame, fallback) {
  if (!keys || keys.length === 0) return fallback;
  if (frame <= keys[0].f) return keys[0].v;
  const last = keys[keys.length - 1];
  if (frame >= last.f) return last.v;
  const i = binarySearchLast(keys, frame);
  const k0 = keys[i];
  const k1 = keys[i + 1];
  const fn = resolveEase(k0.e);
  if (fn.hold) return k0.v;
  const t = (frame - k0.f) / (k1.f - k0.f);
  const p = fn(t);
  if (typeof k0.v === 'number' && typeof k1.v === 'number') return k0.v + (k1.v - k0.v) * p;
  if (isColor(k0.v) && isColor(k1.v)) return mixColor(k0.v, k1.v, clamp(p, 0, 1));
  return p < 1 ? k0.v : k1.v;
}

/** Insert/merge a key into a channel array (keeps sort order, same frame overwrites). */
export function putKey(keys, f, v, e) {
  const k = { f, v };
  if (e !== undefined && e !== null && e !== 'linear') k.e = e;
  const i = keys.findIndex((q) => Math.abs(q.f - f) < 1e-9);
  if (i >= 0) keys[i] = k;
  else {
    keys.push(k);
    keys.sort((a, b) => a.f - b.f);
  }
  return keys;
}

// ------------------------------------------------------------ behaviors

function windowWeight(b, f) {
  // fade a behavior in/out at its window edges so motion never pops
  const from = b.from ?? -Infinity;
  const to = b.to ?? Infinity;
  if (f < from || f >= to) return 0;
  const ramp = b.ramp ?? 0;
  if (!ramp) return 1;
  return Math.min(smoothstep(from, from + ramp, f), 1 - smoothstep(to - ramp, to, f));
}

/**
 * Evaluate behaviors at frame f (fps for Hz-based params).
 * Returns additive deltas: {x, y, rotation, scaleMul, opacityMul}.
 */
export function evalBehaviors(list, f, fps, seedBase = '') {
  const d = { x: 0, y: 0, rotation: 0, scaleMul: 1, opacityMul: 1 };
  if (!list || list.length === 0) return d;
  const sec = f / fps;
  list.forEach((b, idx) => {
    const w = windowWeight(b, f);
    if (w === 0) return;
    const seed = `${seedBase}:${idx}:${b.seed ?? ''}`;
    switch (b.type) {
      case 'wiggle': {
        // smooth random drift; amp px, rot degrees, freq Hz
        const fr = b.freq ?? 1.5;
        const ax = Array.isArray(b.amp) ? b.amp[0] : (b.amp ?? 6);
        const ay = Array.isArray(b.amp) ? b.amp[1] : (b.amp ?? 6);
        d.x += noise1(`${seed}x`)(sec * fr) * ax * w;
        d.y += noise1(`${seed}y`)(sec * fr) * ay * w;
        if (b.rot) d.rotation += noise1(`${seed}r`)(sec * fr) * b.rot * w;
        if (b.scale) d.scaleMul *= 1 + noise1(`${seed}s`)(sec * fr) * b.scale * w;
        break;
      }
      case 'float': {
        const period = b.period ?? 3; // seconds
        const ph = (b.phase ?? 0) * Math.PI * 2;
        const a = b.amp ?? 10;
        d.y += Math.sin((sec / period) * Math.PI * 2 + ph) * a * w;
        if (b.x) d.x += Math.cos((sec / period) * Math.PI * 2 + ph) * b.x * w;
        if (b.rot) d.rotation += Math.sin((sec / period) * Math.PI * 2 + ph + 1) * b.rot * w;
        break;
      }
      case 'spin': {
        // degrees per second
        const start = b.from ?? 0;
        d.rotation += ((f - (Number.isFinite(start) ? start : 0)) / fps) * (b.speed ?? 90) * w;
        break;
      }
      case 'pulse': {
        const period = b.period ?? 1;
        const amt = b.amount ?? 0.06;
        d.scaleMul *= 1 + Math.sin((sec / period) * Math.PI * 2) * amt * w;
        break;
      }
      case 'blink': {
        const period = b.period ?? 1;
        const on = b.duty ?? 0.5;
        if ((sec / period) % 1 > on) d.opacityMul *= 1 - w;
        break;
      }
      case 'shake': {
        // high-frequency jitter with optional decay over the window
        const fr = b.freq ?? 12;
        let a = b.amp ?? 8;
        if (b.decay && Number.isFinite(b.from) && Number.isFinite(b.to)) {
          const t = clamp((f - b.from) / (b.to - b.from), 0, 1);
          a *= 1 - t;
        }
        d.x += noise1(`${seed}x`)(sec * fr) * a * w;
        d.y += noise1(`${seed}y`)(sec * fr) * a * w;
        if (b.rot) d.rotation += noise1(`${seed}r`)(sec * fr) * b.rot * w;
        break;
      }
      case 'sway': {
        const period = b.period ?? 2;
        d.rotation += Math.sin((sec / period) * Math.PI * 2 + (b.phase ?? 0) * Math.PI * 2) * (b.angle ?? 4) * w;
        break;
      }
      default:
        break;
    }
  });
  return d;
}

/** Full transform of a node at local frame f. */
export function evalTransform(node, f, fps) {
  const base = node.transform || {};
  const keys = node.keys || {};
  const t = {};
  for (const ch in TRANSFORM_DEFAULTS) {
    const b = base[ch] ?? TRANSFORM_DEFAULTS[ch];
    t[ch] = keys[ch] ? evalChannel(keys[ch], f, b) : b;
  }
  if (node.behaviors && node.behaviors.length) {
    const d = evalBehaviors(node.behaviors, f, fps, node.id);
    t.x += d.x;
    t.y += d.y;
    t.rotation += d.rotation;
    t.scale *= d.scaleMul;
    t.opacity *= d.opacityMul;
  }
  return t;
}

export function evalCamera(camera, f, fps) {
  const c = { ...CAMERA_DEFAULTS };
  if (!camera) return c;
  const base = camera.base || {};
  const keys = camera.keys || {};
  for (const ch in CAMERA_DEFAULTS) {
    const b = base[ch] ?? CAMERA_DEFAULTS[ch];
    c[ch] = keys[ch] ? evalChannel(keys[ch], f, b) : b;
  }
  if (camera.behaviors && camera.behaviors.length) {
    const d = evalBehaviors(camera.behaviors, f, fps, 'camera');
    c.x += d.x;
    c.y += d.y;
    c.rotation += d.rotation;
    c.zoom *= d.scaleMul;
  }
  if (!(c.zoom > 0)) c.zoom = 0.0001;
  return c;
}

/** Active drawing id of a track at frame f (null = blank). */
export function evalDrawing(drawings, f) {
  if (!drawings || drawings.length === 0) return undefined;
  const i = binarySearchLast(drawings, f);
  return i < 0 ? null : drawings[i].id;
}
