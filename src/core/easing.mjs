// Easing functions. Every easing maps t in [0,1] to progress (may overshoot for back/elastic/spring).
import { GerakError, clamp } from './util.mjs';

const PI = Math.PI;
const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * PI) / 3;
const c5 = (2 * PI) / 4.5;

function bounceOut(x) {
  const n1 = 7.5625;
  const d1 = 2.75;
  if (x < 1 / d1) return n1 * x * x;
  if (x < 2 / d1) return n1 * (x -= 1.5 / d1) * x + 0.75;
  if (x < 2.5 / d1) return n1 * (x -= 2.25 / d1) * x + 0.9375;
  return n1 * (x -= 2.625 / d1) * x + 0.984375;
}

const families = {
  sine: {
    in: (x) => 1 - Math.cos((x * PI) / 2),
    out: (x) => Math.sin((x * PI) / 2),
    'in-out': (x) => -(Math.cos(PI * x) - 1) / 2,
  },
  quad: { in: (x) => x * x, out: (x) => 1 - (1 - x) * (1 - x), 'in-out': (x) => (x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2) },
  cubic: { in: (x) => x ** 3, out: (x) => 1 - (1 - x) ** 3, 'in-out': (x) => (x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2) },
  quart: { in: (x) => x ** 4, out: (x) => 1 - (1 - x) ** 4, 'in-out': (x) => (x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2) },
  quint: { in: (x) => x ** 5, out: (x) => 1 - (1 - x) ** 5, 'in-out': (x) => (x < 0.5 ? 16 * x ** 5 : 1 - (-2 * x + 2) ** 5 / 2) },
  expo: {
    in: (x) => (x === 0 ? 0 : 2 ** (10 * x - 10)),
    out: (x) => (x === 1 ? 1 : 1 - 2 ** (-10 * x)),
    'in-out': (x) => (x === 0 ? 0 : x === 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2),
  },
  circ: {
    in: (x) => 1 - Math.sqrt(1 - x * x),
    out: (x) => Math.sqrt(1 - (x - 1) ** 2),
    'in-out': (x) => (x < 0.5 ? (1 - Math.sqrt(1 - (2 * x) ** 2)) / 2 : (Math.sqrt(1 - (-2 * x + 2) ** 2) + 1) / 2),
  },
  back: {
    in: (x) => c3 * x ** 3 - c1 * x * x,
    out: (x) => 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2,
    'in-out': (x) =>
      x < 0.5 ? ((2 * x) ** 2 * ((c2 + 1) * 2 * x - c2)) / 2 : ((2 * x - 2) ** 2 * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2,
  },
  elastic: {
    in: (x) => (x === 0 ? 0 : x === 1 ? 1 : -(2 ** (10 * x - 10)) * Math.sin((x * 10 - 10.75) * c4)),
    out: (x) => (x === 0 ? 0 : x === 1 ? 1 : 2 ** (-10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1),
    'in-out': (x) =>
      x === 0
        ? 0
        : x === 1
          ? 1
          : x < 0.5
            ? -(2 ** (20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
            : (2 ** (-20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1,
  },
  bounce: {
    in: (x) => 1 - bounceOut(1 - x),
    out: bounceOut,
    'in-out': (x) => (x < 0.5 ? (1 - bounceOut(1 - 2 * x)) / 2 : (1 + bounceOut(2 * x - 1)) / 2),
  },
};

/** CSS-style cubic-bezier timing function. */
export function cubicBezier(x1, y1, x2, y2) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t) => ((ax * t + bx) * t + cx) * t;
  const sy = (t) => ((ay * t + by) * t + cy) * t;
  const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      if (Math.abs(err) < 1e-6) return sy(t);
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    let lo = 0;
    let hi = 1;
    t = x;
    for (let i = 0; i < 30; i++) {
      const v = sx(t);
      if (Math.abs(v - x) < 1e-6) break;
      if (v < x) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return sy(t);
  };
}

/** Damped spring, normalised so it starts at 0 and settles at 1 by t=1. */
export function spring({ stiffness = 170, damping = 14, mass = 1, velocity = 0 } = {}) {
  // simulate until settled, then normalise duration to 1
  const dt = 1 / 600;
  const samples = [];
  let x = 0;
  let v = velocity;
  let t = 0;
  let still = 0;
  while (t < 10) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    t += dt;
    samples.push(x);
    if (Math.abs(x - 1) < 0.0005 && Math.abs(v) < 0.005) {
      if (++still > 30) break;
    } else still = 0;
  }
  const n = samples.length;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    const i = p * (n - 1);
    const i0 = Math.floor(i);
    const f = i - i0;
    return samples[i0] + (samples[Math.min(n - 1, i0 + 1)] - samples[i0]) * f;
  };
}

function steps(n, jump = 'end') {
  return (x) => {
    if (x >= 1) return 1;
    return jump === 'start' ? Math.min(1, Math.ceil(x * n) / n) : Math.floor(x * n) / n;
  };
}

export const HOLD = Object.freeze(Object.assign(() => 0, { hold: true }));
const linear = (x) => x;

const named = {
  linear,
  hold: HOLD,
  ease: cubicBezier(0.25, 0.1, 0.25, 1),
  'ease-in': cubicBezier(0.42, 0, 1, 1),
  'ease-out': cubicBezier(0, 0, 0.58, 1),
  'ease-in-out': cubicBezier(0.42, 0, 0.58, 1),
  in: families.cubic.in,
  out: families.cubic.out,
  'in-out': families.cubic['in-out'],
  smooth: families.sine['in-out'],
  snap: families.expo.out,
  pop: families.back.out,
  anticipate: families.back.in,
  spring: spring(),
  'spring-soft': spring({ stiffness: 120, damping: 12 }),
  'spring-stiff': spring({ stiffness: 300, damping: 22 }),
  'spring-bouncy': spring({ stiffness: 220, damping: 8 }),
};
for (const [fam, fns] of Object.entries(families)) {
  for (const [dir, fn] of Object.entries(fns)) {
    named[`${dir}-${fam}`] = fn; // in-cubic, out-back, in-out-sine
    named[`${fam}-${dir}`] = fn; // cubic-in, back-out (alias)
  }
}

export const EASINGS = Object.keys(named);

const cache = new Map();

/**
 * Resolve an easing spec to a function.
 * Spec: name string ("out-back", "ease-in-out", "spring"), "cubic-bezier(a,b,c,d)", "steps(4)",
 * array [x1,y1,x2,y2], {type:'cubic-bezier', x1,y1,x2,y2}, {type:'spring', stiffness, damping}, or a function.
 */
export function resolveEase(spec) {
  if (spec === undefined || spec === null) return linear;
  if (typeof spec === 'function') return spec;
  if (Array.isArray(spec)) {
    if (spec.length !== 4) throw new GerakError('cubic-bezier array harus 4 angka [x1,y1,x2,y2]', 'BAD_EASE');
    const k = spec.join(',');
    if (!cache.has(k)) cache.set(k, cubicBezier(...spec));
    return cache.get(k);
  }
  if (typeof spec === 'object') {
    const k = JSON.stringify(spec);
    if (cache.has(k)) return cache.get(k);
    let fn;
    if (spec.type === 'cubic-bezier') fn = cubicBezier(spec.x1, spec.y1, spec.x2, spec.y2);
    else if (spec.type === 'spring') fn = spring(spec);
    else if (spec.type === 'steps') fn = steps(spec.n ?? spec.steps ?? 4, spec.jump);
    else throw new GerakError(`Easing object tidak dikenal: ${k}`, 'BAD_EASE');
    cache.set(k, fn);
    return fn;
  }
  const s = String(spec).trim().toLowerCase();
  if (named[s]) return named[s];
  if (cache.has(s)) return cache.get(s);
  let m;
  if ((m = s.match(/^cubic-bezier\(([^)]+)\)$/))) {
    const nums = m[1].split(',').map(Number);
    if (nums.length === 4 && nums.every(Number.isFinite)) {
      const fn = cubicBezier(...nums);
      cache.set(s, fn);
      return fn;
    }
  }
  if ((m = s.match(/^steps\((\d+)(?:\s*,\s*(start|end))?\)$/))) {
    const fn = steps(+m[1], m[2]);
    cache.set(s, fn);
    return fn;
  }
  throw new GerakError(
    `Easing "${spec}" tidak dikenal. Contoh: linear, hold, ease-in-out, out-back, in-out-sine, spring, cubic-bezier(.2,0,.2,1), steps(4).`,
    'BAD_EASE',
  );
}

export function ease(spec, t) {
  return resolveEase(spec)(clamp(t, 0, 1));
}
