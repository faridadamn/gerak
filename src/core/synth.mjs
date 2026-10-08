// Deterministic sound-effect synthesis (original, CC0). No samples, no recordings.
// Every generator returns a mono Float32Array at RATE.
import { rng } from './rng.mjs';

export const RATE = 48000;

function biquad(type, freq, q, rate = RATE) {
  const w0 = (2 * Math.PI * Math.min(freq, rate * 0.45)) / rate;
  const cos = Math.cos(w0);
  const alpha = Math.sin(w0) / (2 * q);
  let b0;
  let b1;
  let b2;
  let a0;
  let a1;
  let a2;
  if (type === 'lp') {
    b0 = (1 - cos) / 2;
    b1 = 1 - cos;
    b2 = (1 - cos) / 2;
  } else if (type === 'hp') {
    b0 = (1 + cos) / 2;
    b1 = -(1 + cos);
    b2 = (1 + cos) / 2;
  } else {
    b0 = alpha;
    b1 = 0;
    b2 = -alpha;
  }
  a0 = 1 + alpha;
  a1 = -2 * cos;
  a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function makeFilter(type, freq, q = 0.707) {
  let c = biquad(type, freq, q);
  let x1 = 0;
  let x2 = 0;
  let y1 = 0;
  let y2 = 0;
  const fn = (x) => {
    const y = c.b0 * x + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1;
    x1 = x;
    y2 = y1;
    y1 = y;
    return y;
  };
  fn.set = (f, qq = q) => {
    c = biquad(type, f, qq);
  };
  return fn;
}

const env = (t, a, d) => (t < a ? t / a : Math.exp(-(t - a) / d));

const G = {
  tone({ freq = 440, dur = 0.5, wave = 'sine' }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      ph += freq / RATE;
      const s = wave === 'square' ? Math.sign(Math.sin(2 * Math.PI * ph)) : wave === 'saw' ? 2 * (ph % 1) - 1 : Math.sin(2 * Math.PI * ph);
      out[i] = s * 0.5 * Math.min(1, t / 0.005, (dur - t) / 0.01);
    }
    return out;
  },
  pop({ pitch = 520, dur = 0.14 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const f = pitch * (1.9 - 0.9 * Math.min(1, t / (dur * 0.6))) ;
      ph += f / RATE;
      out[i] = Math.sin(2 * Math.PI * ph) * env(t, 0.002, dur * 0.22) * 0.8 + (R() * 2 - 1) * Math.exp(-t / 0.004) * 0.25;
    }
    return out;
  },
  bubble({ pitch = 380, dur = 0.12 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      ph += (pitch * (1 + 1.6 * (t / dur) ** 0.7)) / RATE;
      out[i] = Math.sin(2 * Math.PI * ph) * Math.sin((Math.PI * t) / dur) * 0.6;
    }
    return out;
  },
  click({ pitch = 2400, dur = 0.03 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const hp = makeFilter('hp', 1800);
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      out[i] = (hp(R() * 2 - 1) * 0.7 + Math.sin(2 * Math.PI * pitch * t) * 0.4) * Math.exp(-t / 0.004);
    }
    return out;
  },
  tick({ pitch = 4200 }, n, R) {
    return G.click({ pitch, dur: 0.018 }, n, R).map((v) => v * 0.7);
  },
  tap({ pitch = 155, dur = 0.18 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      out[i] = Math.sin(2 * Math.PI * pitch * t) * Math.exp(-t * 42) * 0.8 + (R() * 2 - 1) * 0.5 * Math.exp(-t * 115);
    }
    return out;
  },
  whoosh({ dur = 0.55, dir = 'up', low = 300, high = 3200, q = 1.4 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const bp = makeFilter('bp', low, q);
    const bp2 = makeFilter('bp', low, q);
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const p = t / dur;
      const sweep = dir === 'down' ? 1 - p : p;
      if (i % 64 === 0) {
        const f = low * Math.pow(high / low, sweep);
        bp.set(f, q);
        bp2.set(f, q);
      }
      const a = Math.sin(Math.PI * Math.min(1, p * 1.15)) ** 1.6;
      out[i] = bp2(bp(R() * 2 - 1)) * a * 3.2;
    }
    return out;
  },
  swoosh(p, n, R) {
    return G.whoosh({ dur: 0.32, low: 600, high: 5000, q: 1.1, ...p }, n, R);
  },
  swipe(p, n, R) {
    return G.whoosh({ dur: 0.22, low: 900, high: 6000, q: 0.9, ...p }, n, R).map((v) => v * 0.8);
  },
  riser({ dur = 1.6, from = 180, to = 1400 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const bp = makeFilter('bp', from, 2.5);
    let ph = 0;
    let ph2 = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const p = t / dur;
      const f = from * Math.pow(to / from, p * p);
      if (i % 64 === 0) bp.set(f * 2, 2.5);
      ph += f / RATE;
      ph2 += (f * 1.503) / RATE;
      const a = p ** 1.8 * Math.min(1, (dur - t) / 0.03);
      out[i] = (Math.sin(2 * Math.PI * ph) * 0.35 + Math.sin(2 * Math.PI * ph2) * 0.15 + bp(R() * 2 - 1) * 1.2) * a;
    }
    return out;
  },
  impact({ dur = 1.2, pitch = 110 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const lp = makeFilter('lp', 900);
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const f = pitch * (0.35 + 0.65 * Math.exp(-t * 9));
      ph += f / RATE;
      out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 3.2) * 0.9 + lp(R() * 2 - 1) * Math.exp(-t * 14) * 0.9;
    }
    return out;
  },
  boom(p, n, R) {
    return G.impact({ dur: 1.8, pitch: 70, ...p }, n, R);
  },
  kick({ dur = 0.4 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let ph = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      ph += (50 + 110 * Math.exp(-t * 30)) / RATE;
      out[i] = Math.sin(2 * Math.PI * ph) * Math.exp(-t * 9) * 0.95 + (R() * 2 - 1) * Math.exp(-t * 400) * 0.3;
    }
    return out;
  },
  hat({ dur = 0.06 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const hp = makeFilter('hp', 7000);
    for (let i = 0; i < out.length; i++) out[i] = hp(R() * 2 - 1) * Math.exp(-(i / RATE) * 60) * 0.5;
    return out;
  },
  snare({ dur = 0.25 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const bp = makeFilter('bp', 2500, 0.6);
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      out[i] = bp(R() * 2 - 1) * Math.exp(-t * 18) * 1.4 + Math.sin(2 * Math.PI * 190 * t) * Math.exp(-t * 30) * 0.4;
    }
    return out;
  },
  clap({ dur = 0.3 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const bp = makeFilter('bp', 1400, 0.8);
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const burst = [0, 0.011, 0.023].reduce((s, o) => s + (t >= o ? Math.exp(-(t - o) * 120) : 0), 0) + Math.exp(-t * 14) * 0.4;
      out[i] = bp(R() * 2 - 1) * burst * 1.3;
    }
    return out;
  },
  ding({ pitch = 880, dur = 1.4 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const partials = [
      [1, 1, 1.8],
      [2.01, 0.45, 1.1],
      [3.0, 0.22, 0.6],
      [4.2, 0.12, 0.35],
    ];
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      let v = 0;
      for (const [m, a, d] of partials) v += Math.sin(2 * Math.PI * pitch * m * t) * a * Math.exp(-t / (d * dur * 0.35));
      out[i] = v * 0.32 * Math.min(1, t / 0.002);
    }
    return out;
  },
  chime({ pitch = 784 }, n, R) {
    const a = G.ding({ pitch, dur: 1.2 }, n, R);
    const b = G.ding({ pitch: pitch * 1.335, dur: 1.4 }, n, R);
    const off = Math.round(0.12 * RATE);
    const out = new Float32Array(off + b.length);
    out.set(a.subarray(0, Math.min(a.length, out.length)));
    for (let i = 0; i < b.length; i++) out[off + i] += b[i];
    return out;
  },
  coin({ pitch = 1320 }, n, R) {
    const out = new Float32Array(Math.round(0.45 * RATE));
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const f = t < 0.07 ? pitch : pitch * 1.335;
      out[i] = Math.sign(Math.sin(2 * Math.PI * f * t)) * 0.18 * Math.exp(-Math.max(0, t - 0.07) * 9);
    }
    return out;
  },
  notify({ pitch = 988 }, n, R) {
    const out = new Float32Array(Math.round(0.42 * RATE));
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const on1 = t < 0.09 ? Math.exp(-t * 25) : 0;
      const t2 = t - 0.13;
      const on2 = t2 > 0 ? Math.exp(-t2 * 9) : 0;
      out[i] = Math.sin(2 * Math.PI * pitch * t) * on1 * 0.45 + Math.sin(2 * Math.PI * pitch * 1.5 * t) * on2 * 0.45;
    }
    return out;
  },
  success({ pitch = 523.25 }, n, R) {
    const notes = [1, 1.26, 1.5, 2];
    const out = new Float32Array(Math.round(0.9 * RATE));
    notes.forEach((m, k) => {
      const o = Math.round(k * 0.085 * RATE);
      for (let i = 0; o + i < out.length; i++) {
        const t = i / RATE;
        out[o + i] += (Math.sin(2 * Math.PI * pitch * m * t) + 0.3 * Math.sin(4 * Math.PI * pitch * m * t)) * Math.exp(-t * 5) * 0.22 * Math.min(1, t / 0.004);
      }
    });
    return out;
  },
  error({ pitch = 220 }, n, R) {
    const out = new Float32Array(Math.round(0.5 * RATE));
    const lp = makeFilter('lp', 1800);
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const f = t < 0.18 ? pitch : pitch * 0.84;
      const gate = t < 0.16 || (t > 0.2 && t < 0.46) ? 1 : 0;
      out[i] = lp(2 * ((f * t) % 1) - 1) * gate * 0.3 * Math.min(1, (0.5 - t) / 0.02);
    }
    return out;
  },
  typing({ dur = 1.2, rate = 11 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let t = 0.01;
    while (t < dur - 0.05) {
      const c = G.click({ pitch: 1800 + R() * 1600, dur: 0.035 }, n, R);
      const o = Math.round(t * RATE);
      const g = 0.5 + R() * 0.5;
      for (let i = 0; i < c.length && o + i < out.length; i++) out[o + i] += c[i] * g;
      t += (1 / rate) * (0.55 + R() * 0.9);
    }
    return out;
  },
  scratch({ dur = 0.4 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let prev = 0;
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      const nz = R() * 2 - 1;
      const e = Math.min(1, t / 0.015, (dur - t) / 0.02);
      out[i] = 0.5 * e * (nz - prev * 0.75) * (0.65 + 0.35 * Math.sin(t * 91) ** 2);
      prev = nz;
    }
    return out;
  },
  glitch({ dur = 0.35 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    let i = 0;
    while (i < out.length) {
      const len = Math.round((0.01 + R() * 0.04) * RATE);
      const kind = R();
      const f = 80 + R() * 1200;
      const hold = 1 + Math.floor(R() * 24);
      let v = 0;
      for (let j = 0; j < len && i < out.length; j++, i++) {
        if (j % hold === 0) v = kind < 0.4 ? R() * 2 - 1 : Math.sign(Math.sin((2 * Math.PI * f * j) / RATE));
        out[i] = kind < 0.15 ? 0 : v * 0.35;
      }
    }
    return out;
  },
  heartbeat({ bpm = 70, beats = 2 }, n, R) {
    const period = 60 / bpm;
    const out = new Float32Array(Math.round(period * beats * RATE));
    for (let b = 0; b < beats; b++) {
      for (const [off, g] of [
        [0, 1],
        [0.22, 0.7],
      ]) {
        const k = G.kick({ dur: 0.25 }, n, R);
        const o = Math.round((b * period + off) * RATE);
        for (let i = 0; i < k.length && o + i < out.length; i++) out[o + i] += k[i] * g * 0.8;
      }
    }
    return out;
  },
  /** Soft ambient chord pad. chord: semitone offsets from root. */
  pad({ dur = 6, root = 220, chord = [0, 4, 7, 11], brightness = 1400 }, n, R) {
    const out = new Float32Array(Math.round(dur * RATE));
    const lp = makeFilter('lp', brightness, 0.6);
    const voices = chord.flatMap((s) => [s, s + 0.07, s - 0.06]).map((s) => ({ f: root * 2 ** (s / 12), ph: R() }));
    for (let i = 0; i < out.length; i++) {
      const t = i / RATE;
      let v = 0;
      for (const vo of voices) {
        vo.ph += vo.f / RATE;
        v += 2 * (vo.ph % 1) - 1;
      }
      const a = Math.min(1, t / 1.2, (dur - t) / 1.5);
      out[i] = lp(v / voices.length) * a * 0.9;
    }
    return out;
  },
  /** Simple drum loop for drafts. pattern strings use x = hit, . = rest (16 steps per bar). */
  beat({ bpm = 100, bars = 4, kick = 'x...x...x...x...', snare = '....x.......x...', hat = 'x.x.x.x.x.x.x.x.' }, n, R) {
    const step = 60 / bpm / 4;
    const out = new Float32Array(Math.round(step * 16 * bars * RATE) + RATE);
    const kit = { kick: G.kick({}, n, R), snare: G.snare({}, n, R), hat: G.hat({}, n, R) };
    for (let b = 0; b < bars; b++) {
      for (let s = 0; s < 16; s++) {
        for (const [name, pat] of Object.entries({ kick, snare, hat })) {
          if (pat[s % pat.length] !== 'x') continue;
          const o = Math.round(((b * 16 + s) * step + (name === 'hat' && s % 2 ? step * 0.08 : 0)) * RATE);
          const smp = kit[name];
          const g = name === 'hat' ? 0.5 + R() * 0.3 : 0.9;
          for (let i = 0; i < smp.length && o + i < out.length; i++) out[o + i] += smp[i] * g;
        }
      }
    }
    return out;
  },
  silence({ dur = 1 }) {
    return new Float32Array(Math.round(dur * RATE));
  },
};

export const SFX_TYPES = Object.keys(G);

/** Generate a sound: returns {rate, data: Float32Array (mono)}. */
export function synth(type, params = {}) {
  const gen = G[type];
  if (!gen) throw new Error(`SFX "${type}" tidak ada. Pilihan: ${SFX_TYPES.join(', ')}`);
  const R = rng(`${type}:${params.seed ?? 1}`);
  let data = gen(params, 0, R);
  if (params.pitchShift && params.pitchShift !== 1) {
    // naive resample for variation
    const k = params.pitchShift;
    const out = new Float32Array(Math.floor(data.length / k));
    for (let i = 0; i < out.length; i++) {
      const x = i * k;
      const i0 = Math.floor(x);
      out[i] = data[i0] + ((data[i0 + 1] ?? 0) - data[i0]) * (x - i0);
    }
    data = out;
  }
  // soft clip to keep peaks safe
  let peak = 0;
  for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]));
  const norm = peak > 0.95 ? 0.95 / peak : 1;
  if (norm !== 1) for (let i = 0; i < data.length; i++) data[i] *= norm;
  return { rate: RATE, data };
}

/** Encode mono/stereo Float32 channels as 16-bit PCM WAV bytes. */
export function encodeWav(channels, rate = RATE) {
  const chs = Array.isArray(channels) ? channels : [channels];
  const n = chs[0].length;
  const nc = chs.length;
  const buf = new ArrayBuffer(44 + n * nc * 2);
  const v = new DataView(buf);
  const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  v.setUint32(4, 36 + n * nc * 2, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, nc, true);
  v.setUint32(24, rate, true);
  v.setUint32(28, rate * nc * 2, true);
  v.setUint16(32, nc * 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, n * nc * 2, true);
  let o = 44;
  for (let i = 0; i < n; i++) {
    for (let c = 0; c < nc; c++) {
      const s = Math.max(-1, Math.min(1, chs[c][i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
      o += 2;
    }
  }
  return new Uint8Array(buf);
}
