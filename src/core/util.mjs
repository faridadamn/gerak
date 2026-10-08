// Small shared helpers. Isomorphic: no Node or DOM imports.

export class GerakError extends Error {
  constructor(message, code = 'GERAK', details) {
    super(message);
    this.name = 'GerakError';
    this.code = code;
    if (details) this.details = details;
  }
}

export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (a === b ? 1 : (v - a) / (b - a));
export const smoothstep = (a, b, v) => {
  const t = clamp(invLerp(a, b, v), 0, 1);
  return t * t * (3 - 2 * t);
};
export const DEG = Math.PI / 180;
export const round2 = (v) => Math.round(v * 100) / 100;

/**
 * Convert a time value to frames.
 * Accepts: number (frames), "12f", "1.5s", "500ms", "1:20" (m:ss).
 */
export function toFrames(v, fps, label = 'waktu') {
  if (v === undefined || v === null) return v;
  if (typeof v === 'number') {
    if (!Number.isFinite(v)) throw new GerakError(`${label} harus angka yang valid, dapat ${v}`, 'BAD_TIME');
    return v;
  }
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase();
    let m;
    if ((m = s.match(/^(-?\d*\.?\d+)\s*ms$/))) return (+m[1] / 1000) * fps;
    if ((m = s.match(/^(-?\d*\.?\d+)\s*(s|sec|detik)$/))) return +m[1] * fps;
    if ((m = s.match(/^(-?\d*\.?\d+)\s*f$/))) return +m[1];
    if ((m = s.match(/^(\d+):(\d+(?:\.\d+)?)$/))) return (+m[1] * 60 + +m[2]) * fps;
    if ((m = s.match(/^-?\d*\.?\d+$/))) return +s;
  }
  throw new GerakError(
    `${label} tidak valid: ${JSON.stringify(v)}. Pakai angka frame (36), "1.5s", "500ms", "12f", atau "0:02".`,
    'BAD_TIME',
  );
}

/** Convert a time value to seconds (numbers are treated as frames). */
export function toSeconds(v, fps, label) {
  if (v === undefined || v === null) return v;
  return toFrames(v, fps, label) / fps;
}

export function slug(s) {
  return (
    String(s ?? '')
      .normalize('NFKD')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'item'
  );
}

/** Make a readable unique id from a base name. */
export function uniqueId(base, used) {
  const b = slug(base);
  if (!used.has(b)) {
    used.add(b);
    return b;
  }
  for (let i = 2; ; i++) {
    const id = `${b}-${i}`;
    if (!used.has(id)) {
      used.add(id);
      return id;
    }
  }
}

export function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

export function deepClone(v) {
  return v === undefined ? v : JSON.parse(JSON.stringify(v));
}

/** Format a frame count as m:ss.ff */
export function fmtTime(frame, fps) {
  const sec = frame / fps;
  const m = Math.floor(sec / 60);
  const s = sec - m * 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

export function binarySearchLast(arr, frame, key = 'f') {
  // index of last item with item[key] <= frame, or -1
  let lo = 0;
  let hi = arr.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (arr[mid][key] <= frame) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
