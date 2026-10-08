// Deterministic randomness. Every render of the same document gives identical pixels.

export function hashString(str) {
  let h = 2166136261 >>> 0;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seedOf(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return (v * 2654435761) >>> 0;
  return hashString(v ?? 'gerak');
}

/** mulberry32 PRNG -> function returning [0,1). */
export function rng(seed) {
  let a = seedOf(seed) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Hash-based random for an integer lattice point: [-1, 1]. */
function lattice(seed, i) {
  let h = Math.imul(seed ^ Math.imul(i, 0x27d4eb2d), 0x165667b1);
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

/** Smooth 1D value noise in [-1,1] (cosine-free quintic interpolation). */
export function noise1(seed) {
  const s = seedOf(seed);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const u = f * f * f * (f * (f * 6 - 15) + 10);
    const a = lattice(s, i);
    const b = lattice(s, i + 1);
    return a + (b - a) * u;
  };
}

/** Fractal noise (2 octaves) for organic wobble. */
export function fbm1(seed) {
  const n1 = noise1(seed);
  const n2 = noise1(`${seed}:2`);
  return (x) => n1(x) * 0.7 + n2(x * 2.3) * 0.3;
}
