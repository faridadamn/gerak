// Color parsing / interpolation. Isomorphic.
import { clamp, lerp } from './util.mjs';

const NAMED = {
  transparent: [0, 0, 0, 0],
  black: [0, 0, 0, 1],
  white: [255, 255, 255, 1],
  red: [255, 0, 0, 1],
  green: [0, 128, 0, 1],
  blue: [0, 0, 255, 1],
  yellow: [255, 255, 0, 1],
  orange: [255, 165, 0, 1],
  gray: [128, 128, 128, 1],
  grey: [128, 128, 128, 1],
};

const cache = new Map();

/** Parse a CSS color to [r,g,b,a] (r,g,b 0..255, a 0..1). Returns null when not parseable. */
export function parseColor(input) {
  if (Array.isArray(input)) return [input[0], input[1], input[2], input[3] ?? 1];
  if (typeof input !== 'string') return null;
  const key = input;
  if (cache.has(key)) return cache.get(key);
  const s = input.trim().toLowerCase();
  let out = null;
  if (NAMED[s]) out = NAMED[s].slice();
  else if (s[0] === '#') {
    const h = s.slice(1);
    if (h.length === 3 || h.length === 4) {
      out = [...h].map((c) => parseInt(c + c, 16));
      out[3] = h.length === 4 ? out[3] / 255 : 1;
    } else if (h.length === 6 || h.length === 8) {
      out = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
      out[3] = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
    }
  } else {
    let m = s.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      out = [0, 1, 2].map((i) => (p[i].endsWith('%') ? (parseFloat(p[i]) * 255) / 100 : parseFloat(p[i])));
      out[3] = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
    } else if ((m = s.match(/^hsla?\(([^)]+)\)$/))) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean);
      const hh = parseFloat(p[0]);
      const ss = parseFloat(p[1]) / 100;
      const ll = parseFloat(p[2]) / 100;
      const a = p[3] === undefined ? 1 : p[3].endsWith('%') ? parseFloat(p[3]) / 100 : parseFloat(p[3]);
      out = [...hslToRgb(hh, ss, ll), a];
    }
  }
  if (out && out.some((v) => !Number.isFinite(v))) out = null;
  cache.set(key, out);
  return out;
}

function hslToRgb(h, s, l) {
  h = (((h % 360) + 360) % 360) / 360;
  const f = (n) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return [f(0) * 255, f(8) * 255, f(4) * 255];
}

export function rgba([r, g, b, a]) {
  return `rgba(${Math.round(clamp(r, 0, 255))},${Math.round(clamp(g, 0, 255))},${Math.round(clamp(b, 0, 255))},${+clamp(a, 0, 1).toFixed(4)})`;
}

export function isColor(v) {
  return typeof v === 'string' && parseColor(v) !== null;
}

export function mixColor(a, b, t) {
  const A = parseColor(a);
  const B = parseColor(b);
  if (!A || !B) return t < 0.5 ? a : b;
  return rgba([lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t), lerp(A[3], B[3], t)]);
}

export function withAlpha(color, alpha) {
  const c = parseColor(color);
  if (!c) return color;
  return rgba([c[0], c[1], c[2], c[3] * alpha]);
}

/** Lighten (amt>0) or darken (amt<0) a color by mixing with white/black. */
export function shade(color, amt) {
  return amt >= 0 ? mixColor(color, '#ffffff', amt) : mixColor(color, '#000000', -amt);
}
