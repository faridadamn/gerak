// Gambar-gambar untuk contoh "Satu Orang, Satu Sistem". Semua digambar lewat kode.
import { withPressure, ellipsePoints, pathToString, polygonPath, ellipsePath } from 'gerak';

export const INK = '#1d1c1a';
export const PAPER = '#f3eee3';
export const TEAL = '#00B7B3';
export const BLUE = '#2D3E8D';
export const RED = '#c92a2a';
export const HAND = 'Caveat';
export const NOTE = 'Patrick Hand';

/** Coretan tangan: tekanan meruncing di ujung, opsional tergambar dari frame `at`. */
export function line(layer, pts, { size = 8, brush = 'ink', color = INK, at, dur = 8, ease = 'out-cubic', pressure = 'taper', ...rest } = {}) {
  return layer.stroke(withPressure(pts, pressure), {
    brush,
    size,
    color,
    ...(at === undefined ? {} : { reveal: [at, dur, ease] }),
    ...rest,
  });
}

// ---------------------------------------------------------------- orang (siluet)

const TORSO = {
  hunch: 'M -35 50 C -115 70 -165 190 -160 320 L -150 440 L 70 440 C 80 360 75 260 60 170 C 55 110 35 70 15 52 Z',
  relax: 'M -30 55 C -110 75 -175 170 -195 300 L -175 440 L 45 440 C 62 340 70 240 52 150 C 42 100 28 70 15 55 Z',
};
const BACK = {
  hunch: [[-38, 52, 0.3], [-118, 80, 0.9], [-160, 200, 1], [-158, 330, 0.8], [-148, 440, 0.3]],
  relax: [[-32, 58, 0.3], [-112, 84, 0.9], [-170, 180, 1], [-192, 300, 0.8], [-173, 440, 0.3]],
};

/**
 * Siluet orang duduk menghadap kanan. Titik (0,0) = pusat kepala.
 * Mengembalikan { group, body } — group bisa dianimasikan (key, float, dll).
 */
export function person(parent, { x, y, s = 1, pose = 'hunch', name = 'Orang' }) {
  const group = parent.group(name, { x, y, scale: s });
  const body = group.layer(`${name} badan`);
  // kaki (duduk)
  const hip = pose === 'relax' ? [-60, 430] : [-40, 430];
  line(body, [hip, [130, 450], [175, 452]], { size: 78, brush: 'brush', pressure: 'flat' });
  line(body, [[170, 450], [182, 560], [186, 650]], { size: 58, brush: 'brush', pressure: 'flat' });
  line(body, [[178, 660], [240, 664]], { size: 30, brush: 'ink', pressure: 'flat' });
  // badan + tepi kuas kering biar bertekstur
  body.path(TORSO[pose], { fill: INK });
  body.stroke(BACK[pose], { brush: 'dry', size: 34, color: INK });
  // kepala
  const hx = pose === 'relax' ? -14 : 8;
  const hy = pose === 'relax' ? -6 : 0;
  body.circle(hx, hy, 60, { fill: INK });
  body.stroke(ellipsePoints(hx - 2, hy + 1, 64, 63, { start: 150, end: 470, n: 36, pressure: (t) => 0.4 + 0.6 * Math.sin(Math.PI * t) }), {
    brush: 'brush',
    size: 9,
    color: INK,
  });
  return { group, body };
}

/** Lengan mengetik: track dengan 2 pose yang bergantian (substitusi gambar). */
export function typingArms(parent, { at = 0, until, every = 3 } = {}) {
  const arms = parent.track('Lengan ngetik');
  const up = arms.drawing('naik').layer('lengan naik');
  line(up, [[-5, 118], [92, 282], [205, 258]], { size: 40, brush: 'brush', pressure: 'flat' });
  const down = arms.drawing('turun').layer('lengan turun');
  line(down, [[-5, 118], [90, 290], [205, 276]], { size: 40, brush: 'brush', pressure: 'flat' });
  arms.expose(0, 'naik');
  arms.cycle(['naik', 'turun'], { from: at, to: until, every });
  return arms;
}

/** Lengan pegang cangkir (pose santai) + cangkir + uap yang "boil". */
export function cupArm(parent, { steamAt = 0 } = {}) {
  const l = parent.layer('Lengan & cangkir');
  line(l, [[-40, 120], [70, 262], [118, 150]], { size: 40, brush: 'brush', pressure: 'flat' });
  // cangkir
  l.path('M 92 92 L 172 92 L 164 172 C 160 186 104 186 100 172 Z', { fill: '#ffffff', stroke: INK, strokeWidth: 6 });
  l.stroke([[168, 110, 1], [196, 118, 1], [196, 146, 1], [166, 152, 1]], { brush: 'pen', size: 6, color: INK });
  // uap
  const steam = parent.layer('Uap', { x: 132, y: 70 });
  for (const [dx, d] of [[-18, 0], [6, 4], [30, 8]]) {
    line(steam, [[dx, 0], [dx - 14, -40], [dx + 10, -80], [dx - 6, -120]], { size: 7, brush: 'pen', color: '#6b6760', at: steamAt + d, dur: 14 });
  }
  steam.float({ amp: 6, period: 2 });
  return l;
}

// ---------------------------------------------------------------- properti

export function desk(layer, { y = 1300, x0 = 40, x1 = 1040, at, legs = true } = {}) {
  line(layer, [[x0, y + 6], [(x0 + x1) / 2, y - 4], [x1, y + 4]], { size: 54, brush: 'dry', pressure: 'swell', ...(at !== undefined ? { at, dur: 10 } : {}) });
  line(layer, [[x0 + 30, y + 30], [x1 - 40, y + 32]], { size: 10, brush: 'ink', pressure: 'taper', ...(at !== undefined ? { at: at + 4, dur: 8 } : {}) });
  if (legs) {
    line(layer, [[x0 + 140, y + 30], [x0 + 132, y + 300]], { size: 22, brush: 'brush', pressure: 'flat' });
    line(layer, [[x1 - 130, y + 30], [x1 - 120, y + 300]], { size: 22, brush: 'brush', pressure: 'flat' });
  }
}

export function chair(layer, { x, y }) {
  line(layer, [[x - 20, y], [x + 260, y + 4]], { size: 20, brush: 'brush', pressure: 'flat' });
  line(layer, [[x - 10, y + 2], [x - 30, y - 300]], { size: 16, brush: 'brush', pressure: 'flat' });
  line(layer, [[x + 10, y + 10], [x + 4, y + 230]], { size: 14, brush: 'brush', pressure: 'flat' });
  line(layer, [[x + 240, y + 10], [x + 250, y + 230]], { size: 14, brush: 'brush', pressure: 'flat' });
}

export function laptop(layer, { x, y }) {
  // alas di meja + layar miring menjauh
  line(layer, [[x, y], [x + 230, y - 2]], { size: 14, brush: 'pen', pressure: 'flat' });
  line(layer, [[x + 222, y - 4], [x + 262, y - 210]], { size: 16, brush: 'pen', pressure: 'flat' });
}

export function lamp(layer, { x, y }) {
  line(layer, [[x - 50, y], [x + 50, y]], { size: 16, brush: 'pen', pressure: 'flat' });
  line(layer, [[x, y], [x - 30, y - 170], [x + 50, y - 260]], { size: 10, brush: 'pen', pressure: 'flat' });
  layer.path(`M ${x + 20} ${y - 290} L ${x + 120} ${y - 250} L ${x + 70} ${y - 200} Z`, { fill: INK });
}

export function lightCone(layer, pts, color, opacity = 0.18) {
  return layer.polygon(pts, { fill: { type: 'linear', angle: 90, stops: [[0, color], [1, 'rgba(255,255,255,0)']] }, opacity });
}

/** Jam dinding: muka dibuat sketsa, jarum di layer sendiri supaya bisa diputar. */
export function clock(scene, { x, y, r = 90, fast = 720 }) {
  const face = scene.layer('Jam', { x, y });
  face.circle(0, 0, r, { fill: '#fbf8f1', sketch: { brush: 'pen', size: 5, fill: 'solid', roughness: 1.2, offset: [0, 0] } });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = r * (i % 3 === 0 ? 0.72 : 0.8);
    line(face, [[Math.cos(a) * r1, Math.sin(a) * r1], [Math.cos(a) * r * 0.88, Math.sin(a) * r * 0.88]], { size: i % 3 === 0 ? 6 : 4, brush: 'pen', pressure: 'flat' });
  }
  const minute = scene.layer('Jarum menit', { x, y });
  line(minute, [[0, 8], [0, -r * 0.72]], { size: 7, brush: 'pen', pressure: 'flat' });
  minute.spin({ speed: fast });
  const hour = scene.layer('Jarum jam', { x, y, rotation: 60 });
  line(hour, [[0, 8], [0, -r * 0.48]], { size: 10, brush: 'pen', pressure: 'flat' });
  hour.spin({ speed: fast / 12 });
  face.circle(0, 0, 8, { fill: INK });
  return { face, minute, hour };
}

export function gearPath(r, teeth = 10, depth = 0.2, hole = 0.34) {
  const pts = [];
  const n = teeth * 4;
  for (let i = 0; i < n; i++) {
    const a = ((i + 0.5) / n) * Math.PI * 2;
    const outer = i % 4 === 1 || i % 4 === 2;
    const rr = outer ? r : r * (1 - depth);
    pts.push([Math.cos(a) * rr, Math.sin(a) * rr]);
  }
  return `${pathToString(polygonPath(pts))} ${pathToString(ellipsePath(0, 0, r * hole, r * hole))}`;
}

export function gear(scene, { x, y, r, teeth, color, speed, name }) {
  const g = scene.layer(name, { x, y });
  g.path(gearPath(r, teeth), { fill: color, fillRule: 'evenodd', stroke: INK, strokeWidth: 6 });
  g.circle(0, 0, r * 0.12, { fill: INK });
  g.spin({ speed });
  return g;
}

/** Bola lampu ide: digambar tinta + cahaya kuning yang berdenyut. */
export function bulb(scene, { x, y, at = 0 }) {
  const glow = scene.layer('Cahaya', { x, y: y - 20, opacity: 0 });
  glow.circle(0, 0, 210, { fill: { type: 'radial', stops: [[0, 'rgba(255,212,59,0.85)'], [1, 'rgba(255,212,59,0)']] } });
  glow.key(at + 16, { opacity: 0 }).key(at + 22, { opacity: 1 }, 'out-cubic');
  glow.pulse({ amount: 0.05, period: 1.2, from: at + 22 });
  const b = scene.layer('Bohlam', { x, y });
  b.path('M -70 20 C -110 -40 -90 -150 0 -155 C 90 -150 110 -40 70 20 C 50 45 44 60 42 90 L -42 90 C -44 60 -50 45 -70 20 Z', {
    fill: '#fff8db',
    stroke: INK,
    strokeWidth: 8,
    draw: [at, 16, 'in-out-sine'],
  });
  line(b, [[-26, 90], [-18, 40], [0, 70], [18, 40], [26, 90]], { size: 6, brush: 'pen', at: at + 8, dur: 8, pressure: 'flat' });
  line(b, [[-44, 108], [44, 106]], { size: 12, brush: 'pen', at: at + 12, dur: 4, pressure: 'flat' });
  line(b, [[-36, 128], [36, 126]], { size: 12, brush: 'pen', at: at + 14, dur: 4, pressure: 'flat' });
  const rays = scene.layer('Sinar', { x, y: y - 40 });
  for (let i = 0; i < 7; i++) {
    const a = ((-160 + i * 23.3) * Math.PI) / 180;
    line(rays, [[Math.cos(a) * 165, Math.sin(a) * 165], [Math.cos(a) * 225, Math.sin(a) * 225]], { size: 10, brush: 'ink', at: at + 22 + i, dur: 5 });
  }
  return { glow, b, rays };
}

/** Kotak flowchart sketsa dengan label tulisan tangan. */
export function box(scene, { x, y, w = 560, h = 150, label, at, color = TEAL, name }) {
  const l = scene.layer(name ?? label, { x, y, pivot: [0, 0] });
  l.rect(-w / 2, -h / 2, w, h, { fill: color, r: 26, sketch: { brush: 'pen', size: 5, fill: 'solid', offset: [7, 6], roughness: 1.3 } });
  l.text(label, 0, 0, { font: NOTE, size: 64, color: INK, align: 'center', valign: 'middle' });
  l.pop(at, { dur: 14, from: 0.4 });
  return l;
}

export function arrow(layer, { x1, y1, x2, y2, at }) {
  layer.arrow(x1, y1, x2, y2, { stroke: INK, strokeWidth: 8, head: 30, draw: [at, 10, 'out-cubic'] });
}
