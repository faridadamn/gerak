// Gaya 11 · Satu dunia: perjalanan satu pesanan (aksi kontinu)
// Arah: dunia flat vector hangat (krem, oranye, hijau, tinta), satu subjek yang tidak pernah hilang
// (kardus pesanan bermata), SATU scene tanpa ganti slide. Cerita dibawa kamera yang berganti ukuran
// shot: close-up → medium → close-up → wide → ... → extreme wide yang menyingkap seluruh rute.
// Latar selalu hidup: awan & bukit parallax (depth), matahari berdenyut. Teks ≤ 5 kata per shot,
// sentence case, tanpa titik; label di lapisan layar (fixed), papan/benda di dalam dunia.
// Bandingkan dengan 05-blueprint.mjs (isi sama, gaya "slide").

import { project, rng, catmullRom, withPressure } from 'gerak';

const p = project({ title: 'Satu dunia: perjalanan pesanan', preset: 'reels', fps: 30, background: '#FBEFDF' });
const W = p.width;
const H = p.height;
const BPM = 100;
const K = (p.fps * 60) / BPM; // 18 frame per ketuk

const INK = '#1D1B26';
const CREAM = '#FBEFDF';
const ORANGE = '#FF6B35';
const GREEN = '#2E8B6E';
const KRAFT = '#D9A066';
const ROAD_Y = 1250;
p.effects({ grain: 0.06, vignette: 0.16 });

const s = p.scene('Dunia', { duration: 23 * K, background: CREAM });
s.note({ action: 'Satu dunia horizontal. Kardus lahir dari HP, lompat ke QRIS, naik motor kurir, sampai di rumah. Kamera ganti ukuran shot; akhir extreme wide menyingkap rute.' });

// ---------------------------------------------------------------------
// LATAR — berlapis, parallax, selalu bergerak
// ---------------------------------------------------------------------
const sky = s.layer('Langit', { depth: 6 });
sky.rect(-6000, -6000, 16000, 7400, { fill: { type: 'linear', from: [0, -1500], to: [0, 1250], stops: [[0, '#F7C59F'], [1, '#FBEFDF']] } });

const sun = s.layer('Matahari', { x: 1500, y: 360, depth: 5 });
sun.circle(0, 0, 260, { fill: 'rgba(255,184,107,0.28)' });
sun.circle(0, 0, 170, { fill: '#FFB86B' });
sun.pulse({ amount: 0.04, period: (4 * K) / 30 });

const R = rng('awan');
for (let i = 0; i < 9; i++) {
  const X = -400 + i * 560 + R() * 200;
  const c = s.layer(`Awan ${i}`, { x: X, y: 120 + R() * 520, depth: 3 });
  const k = 0.7 + R() * 0.6;
  [[0, 0, 110], [90, 20, 80], [-90, 25, 75], [40, -40, 70]].forEach(([dx, dy, r]) => c.circle(dx * k, dy * k, r * k, { fill: 'rgba(255,255,255,0.92)' }));
  c.key(0, { x: X }, 'linear').key(23 * K, { x: X + 260 });
  c.float({ amp: 10, period: 5 + i % 3 });
}

const hills = s.layer('Bukit', { depth: 2 });
const hillPts = [[-3000, ROAD_Y]];
for (let x = -3000; x <= 7000; x += 250) hillPts.push([x, ROAD_Y - 130 - 90 * Math.sin(x / 520) - 50 * Math.sin(x / 190)]);
hillPts.push([7000, ROAD_Y]);
hills.polygon(hillPts, { fill: '#B9D6A5', closed: true });

const ground = s.layer('Tanah');
ground.rect(-3000, ROAD_Y, 10000, 6000, { fill: '#9CCB86' });
ground.rect(-3000, ROAD_Y, 10000, 90, { fill: '#3A3646' });
for (let x = -3000; x < 7000; x += 120) ground.rect(x, ROAD_Y + 40, 60, 10, { fill: 'rgba(251,239,223,0.75)' });

const grass = s.layer('Rumput depan', { depth: 0.85 });
const G = rng('rumput');
for (let x = -1500; x < 5500; x += 140) {
  const gx = x + G() * 80, gy = ROAD_Y + 170 + G() * 60;
  grass.stroke([[gx - 14, gy, 0.6], [gx - 20, gy - 40, 0.2]], { brush: 'ink', size: 8, color: '#5E9C5A' });
  grass.stroke([[gx, gy, 0.6], [gx + 4, gy - 52, 0.2]], { brush: 'ink', size: 8, color: '#5E9C5A' });
  grass.stroke([[gx + 14, gy, 0.6], [gx + 22, gy - 38, 0.2]], { brush: 'ink', size: 8, color: '#5E9C5A' });
}

// ---------------------------------------------------------------------
// STASIUN 1 — meja + HP dengan chat
// ---------------------------------------------------------------------
const desk = s.layer('Meja');
desk.rect(330, 1100, 420, 150, { fill: '#C98B55', r: [14, 14, 0, 0] });
desk.rect(330, 1100, 420, 22, { fill: '#B07443' });

const phone = s.layer('HP', { x: 540, y: 820 });
phone.rect(-150, -280, 300, 560, { fill: INK, r: 40 });
phone.rect(-132, -250, 264, 500, { fill: '#F4F1EA', r: 26 });
phone.rect(-132, -250, 264, 64, { fill: GREEN, r: [26, 26, 0, 0] });
phone.text('Bu Rina', -100, -218, { weight: 700, size: 30, color: '#fff', valign: 'middle' });
phone.rect(-118, -160, 220, 120, { fill: '#DDF5C7', r: 20, show: [8, null] });
phone.text('kopi susu\n2, kak', -100, -100, { weight: 600, size: 34, color: INK, valign: 'middle', lineHeight: 1.1, show: [8, null], anim: { type: 'words', effect: 'pop', at: 8, dur: 6 } });
phone.rect(-6, -10, 124, 70, { fill: '#fff', r: 20, show: [K + 6, null] });
phone.text('siap!', 56, 25, { weight: 700, size: 34, color: GREEN, align: 'center', valign: 'middle', show: [K + 6, null], anim: { type: 'words', effect: 'pop', at: K + 6, dur: 6 } });
phone.shake({ amp: 8, freq: 22, from: 2 * K - 8, to: 2 * K + 2 });
s.sfx('ding', { at: 8, volume: -8 });
s.sfx('pop', { at: K + 6, volume: -10 });
s.sfx('notify', { at: 2 * K - 8, volume: -12 });

// ---------------------------------------------------------------------
// STASIUN 2 — papan QRIS + palang
// ---------------------------------------------------------------------
const qr = s.layer('QRIS', { x: 1500, y: 820 });
qr.rect(-12, 180, 24, 250, { fill: INK });
qr.rect(-200, -200, 400, 400, { fill: '#fff', stroke: INK, strokeWidth: 10, r: 24 });
const Q = rng('qr');
const M = 13, CELL = 22, O = -(M * CELL) / 2;
for (let r = 0; r < M; r++) for (let c = 0; c < M; c++) {
  const finder = (r < 4 && c < 4) || (r < 4 && c > M - 5) || (r > M - 5 && c < 4);
  if (finder || Q() < 0.5) continue;
  qr.rect(O + c * CELL, O + r * CELL, CELL - 2, CELL - 2, { fill: INK });
}
[[0, 0], [0, M - 4], [M - 4, 0]].forEach(([r, c]) => {
  qr.rect(O + c * CELL, O + r * CELL, CELL * 4 - 2, CELL * 4 - 2, { fill: INK, r: 6 });
  qr.rect(O + c * CELL + CELL * 0.7, O + r * CELL + CELL * 0.7, CELL * 2.6 - 2, CELL * 2.6 - 2, { fill: '#fff', r: 4 });
  qr.rect(O + c * CELL + CELL * 1.2, O + r * CELL + CELL * 1.2, CELL * 1.6 - 2, CELL * 1.6 - 2, { fill: INK, r: 3 });
});
qr.text('QRIS', 0, -250, { weight: 800, size: 64, color: INK, align: 'center', valign: 'middle', letterSpacing: 6 });

const SCAN = 7 * K;
const beam = s.layer('Sinar scan', { x: 1500, y: 640, show: [SCAN, SCAN + 2 * K] });
beam.rect(-190, -6, 380, 12, { fill: ORANGE, shadow: { color: 'rgba(255,107,53,0.9)', blur: 24 } });
beam.key(SCAN, { y: 640 }, 'in-out-sine').key(SCAN + K, { y: 1000 }, 'in-out-sine').key(SCAN + 2 * K - 4, { y: 660 });
s.sfx('riser', { at: SCAN, dur: 1.1, volume: -18 });

const LUNAS = 8 * K + 14;
const stamp = s.layer('Lunas', { x: 1500, y: 820, rotation: -12 });
stamp.rect(-175, -66, 350, 132, { fill: 'rgba(255,255,255,0.88)', stroke: ORANGE, strokeWidth: 10, r: 14 });
stamp.text('LUNAS', 0, 4, { weight: 800, size: 96, color: ORANGE, align: 'center', valign: 'middle', letterSpacing: 6 });
stamp.key(0, { opacity: 0 }, 'hold').key(LUNAS, { opacity: 1 });
stamp.pop(LUNAS, { from: 2.2, dur: 6, ease: 'out-quad', fade: false });
s.sfx('impact', { at: LUNAS, volume: -8 });
s.sfx('coin', { at: LUNAS + 3, volume: -10 });

const post = s.layer('Tiang palang');
post.rect(1648, 1050, 24, 200, { fill: INK, r: 6 });
const arm = s.layer('Palang', { x: 1660, y: 1080 });
for (let i = 0; i < 6; i++) arm.rect(-300 + i * 50, -14, 50, 28, { fill: i % 2 ? '#fff' : ORANGE });
arm.circle(0, 0, 18, { fill: INK });
arm.key(0, { rotation: 0 }, 'hold').key(9 * K + 2, { rotation: 0 }, 'out-back').key(9 * K + 14, { rotation: 80 });
s.sfx('click', { at: 9 * K + 2, volume: -8 });

// ---------------------------------------------------------------------
// STASIUN 3 — motor kurir
// ---------------------------------------------------------------------
const MOTOR_IN = 9 * K + 6, MOTOR_STOP = 10 * K + 6, RIDE0 = 11 * K + 12, RIDE1 = 15 * K;
const moto = s.group('Motor', { x: 2700, y: ROAD_Y });
moto.key(0, { x: 2700 }, 'hold').key(MOTOR_IN, { x: 2700 }, 'out-cubic').key(MOTOR_STOP, { x: 1960 }, 'hold')
  .key(RIDE0, { x: 1960 }, 'in-out-sine').key(RIDE1, { x: 2900 });
const body = moto.layer('Bodi');
body.polygon([[-150, -70], [120, -70], [160, -120], [120, -150], [-40, -150], [-70, -100], [-150, -100]], { fill: ORANGE, closed: true });
body.rect(-130, -128, 150, 26, { fill: INK, r: 10 });
body.rect(-170, -138, 70, 16, { fill: INK, r: 4 });
body.line(120, -150, 150, -220, { stroke: INK, strokeWidth: 10, lineCap: 'round' });
body.line(130, -220, 175, -220, { stroke: INK, strokeWidth: 10, lineCap: 'round' });
const rider = moto.layer('Kurir');
rider.rect(-30, -330, 120, 200, { fill: GREEN, r: 50 });
rider.circle(40, -380, 56, { fill: '#F2C6A0' });
rider.path('M -16 -392 A 58 58 0 0 1 98 -392 L 98 -380 L -16 -380 Z', { fill: INK });
rider.line(80, -260, 150, -215, { stroke: GREEN, strokeWidth: 30, lineCap: 'round' });
rider.sway({ angle: 2, period: (2 * K) / 30, from: RIDE0, to: RIDE1 });
[-95, 105].forEach((wx, i) => {
  const wheel = moto.layer(`Roda ${i}`, { x: wx, y: -46 });
  wheel.circle(0, 0, 46, { fill: INK });
  wheel.circle(0, 0, 18, { fill: '#C9C4BA' });
  wheel.line(-30, 0, 30, 0, { stroke: '#C9C4BA', strokeWidth: 6 });
  wheel.line(0, -30, 0, 30, { stroke: '#C9C4BA', strokeWidth: 6 });
  wheel.key(0, { rotation: 0 }, 'hold').key(MOTOR_IN, { rotation: 0 }, 'out-cubic').key(MOTOR_STOP, { rotation: -720 }, 'hold')
    .key(RIDE0, { rotation: -720 }, 'in-out-sine').key(RIDE1, { rotation: 1080 });
});
moto.wiggle({ amp: [0, 3], freq: 3, from: RIDE0, to: RIDE1 });
s.sfx('whoosh', { at: MOTOR_IN, dur: 0.6, volume: -10 });
s.sfx('swoosh', { at: RIDE0, dur: 1.4, volume: -14 });

// debu di belakang motor saat jalan
const D = rng('debu');
for (let i = 0; i < 12; i++) {
  const f = RIDE0 + 6 + i * 4;
  const u = (f - RIDE0) / (RIDE1 - RIDE0);
  const mx = 1960 + (2900 - 1960) * (0.5 - 0.5 * Math.cos(Math.PI * u));
  const puff = s.layer(`Debu ${i}`, { x: mx - 190, y: ROAD_Y - 20, show: [f, f + 16] });
  puff.circle(0, 0, 22 + D() * 14, { fill: 'rgba(251,239,223,0.9)' });
  puff.animate({ at: f, dur: 16, from: { scale: 0.4, opacity: 1 }, to: { scale: 1.6, opacity: 0, x: mx - 260, y: ROAD_Y - 60 }, ease: 'out-cubic' });
}

// ---------------------------------------------------------------------
// STASIUN 4 — rumah pembeli
// ---------------------------------------------------------------------
const house = s.layer('Rumah');
house.rect(2980, 820, 600, 430, { fill: '#F2D6B3' });
house.polygon([[2930, 830], [3280, 560], [3630, 830]], { fill: GREEN, closed: true });
house.rect(3105, 1010, 150, 240, { fill: INK, r: [12, 12, 0, 0] });
house.circle(3235, 1130, 8, { fill: '#FFB86B' });
house.rect(3360, 920, 150, 130, { fill: '#BFE3F2', stroke: INK, strokeWidth: 8 });
house.line(3435, 920, 3435, 1050, { stroke: INK, strokeWidth: 6 });
house.rect(3080, 1240, 200, 14, { fill: ORANGE });

// ---------------------------------------------------------------------
// SUBJEK — kardus pesanan (tidak pernah hilang setelah lahir)
// ---------------------------------------------------------------------
const box = s.group('Paket', { x: 540, y: 820 });
const bod = box.layer('Kardus');
bod.rect(-80, -140, 160, 140, { fill: KRAFT, stroke: INK, strokeWidth: 6, r: 10 });
bod.rect(-80, -140, 160, 34, { fill: '#C68B50', stroke: INK, strokeWidth: 6, r: [10, 10, 0, 0] });
bod.rect(-14, -140, 28, 34, { fill: ORANGE });

// mata: titik (kedip sesekali), lalu lengkung senang di akhir
const HAPPY = 16 * K + 14;
const eyes = box.layer('Mata');
const BLINKS = [70, 150, 230];
let from = 0;
[...BLINKS, HAPPY].forEach((b, i) => {
  [[-28, -66], [32, -66]].forEach(([ex, ey]) => eyes.circle(ex + 6, ey, 11, { fill: INK, show: [from, b] }));
  if (i < BLINKS.length) [[-28, -66], [32, -66]].forEach(([ex, ey]) => eyes.line(ex - 4, ey, ex + 16, ey, { stroke: INK, strokeWidth: 6, lineCap: 'round', show: [b, b + 4] }));
  from = b + 4;
});
[[-28, -62], [32, -62]].forEach(([ex, ey]) => eyes.path(`M ${ex - 10} ${ey} Q ${ex + 6} ${ey - 22} ${ex + 22} ${ey}`, { stroke: INK, strokeWidth: 7, lineCap: 'round', show: [HAPPY, null] }));
eyes.circle(-30, -40, 9, { fill: 'rgba(255,107,53,0.5)', show: [HAPPY, null] });
eyes.circle(56, -40, 9, { fill: 'rgba(255,107,53,0.5)', show: [HAPPY, null] });

// label resi menempel di kardus
const RESI = 11 * K + 14;
const tag = box.layer('Resi', { x: 70, y: -150, rotation: 14 });
tag.rect(0, -30, 150, 60, { fill: '#fff', stroke: INK, strokeWidth: 4, r: 8 });
tag.text('RESI 0718', 75, 2, { weight: 800, size: 26, color: INK, align: 'center', valign: 'middle' });
tag.line(0, 0, -20, 10, { stroke: INK, strokeWidth: 3 });
tag.key(0, { opacity: 0 }, 'hold').key(RESI, { opacity: 1 });
tag.pop(RESI, { from: 0, dur: 8, ease: 'out-back', fade: false });
tag.sway({ angle: 6, period: 0.6, from: RIDE0, to: RIDE1 + K });
s.sfx('tap', { at: RESI, volume: -8 });

// lahir dari layar HP → mendarat di jalan
const BORN = 2 * K;
box.key(0, { opacity: 0, scale: 0.25 }, 'hold');
box.key(BORN, { x: 540, y: 820, opacity: 1, scale: 0.25 }, 'out-quad').key(BORN + 8, { x: 660, y: 760, scale: 1 }, 'in-quad').key(BORN + 16, { x: 760, y: ROAD_Y });
s.sfx('bubble', { at: BORN, volume: -8 });

const squash = (f) => bod.key(f - 1, { scaleX: 1, scaleY: 1 }, 'out-quad').key(f + 1, { scaleX: 1.22, scaleY: 0.74 }, 'out-back').key(f + 9, { scaleX: 1, scaleY: 1 });
function hop(f0, x0, x1, { y0 = ROAD_Y, y1 = ROAD_Y, h = 130, dur = 12, sfx = 'tap' } = {}) {
  box.key(f0, { x: x0 }, 'in-out-sine').key(f0 + dur, { x: x1 });
  box.key(f0, { y: y0 }, 'out-quad').key(f0 + dur / 2, { y: Math.min(y0, y1) - h }, 'in-quad').key(f0 + dur, { y: y1 });
  squash(f0 + dur);
  s.sfx(sfx, { at: f0 + dur, volume: -10 });
}
squash(BORN + 16);
s.sfx('tap', { at: BORN + 16, volume: -8 });
hop(3 * K, 760, 940);
hop(4 * K, 940, 1120);
hop(5 * K, 1120, 1300);
hop(10 * K, 1300, 1560);
hop(11 * K, 1560, 1900, { y1: ROAD_Y - 150, h: 170, sfx: 'kick' });           // naik ke boncengan
box.key(RIDE0, { x: 1900 }, 'in-out-sine').key(RIDE1, { x: 2840 });           // ikut motor
box.wiggle({ amp: [0, 3], freq: 3, from: RIDE0, to: RIDE1 });
hop(15 * K + 4, 2840, 3010, { y0: ROAD_Y - 150 });                             // turun
hop(16 * K, 3010, 3180, { h: 110 });                                           // ke depan pintu

// hati di atas kardus
const heart = s.layer('Hati', { x: 3180, y: 1000 });
heart.path('M 0 30 C -60 -10 -40 -60 0 -30 C 40 -60 60 -10 0 30 Z', { fill: ORANGE });
heart.key(0, { opacity: 0 }, 'hold').key(HAPPY + 2, { opacity: 1 });
heart.pop(HAPPY + 2, { from: 0, dur: 8, ease: 'out-back', fade: false });
heart.animate({ at: HAPPY + 10, dur: 30, from: {}, to: { y: 930 }, ease: 'out-sine' });
s.sfx('success', { at: HAPPY, volume: -10 });

// ---------------------------------------------------------------------
// PENUTUP — rute tergambar di extreme wide
// ---------------------------------------------------------------------
const WIDE = 19 * K + 6;
const route = s.layer('Rute');
route.stroke(withPressure(catmullRom([[540, 1060], [760, 1330], [1300, 1360], [1900, 1340], [2500, 1370], [3180, 1330]], 120), 'flat'), {
  brush: 'marker', size: 44, color: ORANGE, reveal: [WIDE - 4, 2 * K, 'in-out-sine'],
});
[[540, 1060], [1500, 1360], [1960, 1340], [3180, 1330]].forEach(([x, y], i) => {
  const pin = s.layer(`Titik ${i}`, { x, y });
  pin.circle(0, 0, 60, { fill: ORANGE, stroke: CREAM, strokeWidth: 14 });
  pin.key(0, { opacity: 0 }, 'hold').key(WIDE + i * 8, { opacity: 1 });
  pin.pop(WIDE + i * 8, { from: 0, dur: 8, ease: 'out-back', fade: false });
  s.sfx('tap', { at: WIDE + i * 8, volume: -12 });
});

// ---------------------------------------------------------------------
// LABEL LAYAR (HUD) — satu per shot, ≤ 5 kata, sentence case
// ---------------------------------------------------------------------
const hud = s.layer('Label', { fixed: true });
const label = (t, at, until, { y = 300, size = 100, align = 'left', x = 80 } = {}) => hud.text(t, x, y, {
  weight: 700, size, color: INK, align, valign: 'middle', maxWidth: 920, lineHeight: 1.05,
  show: [at, until], anim: { type: 'words', effect: 'rise', at, stagger: 3, dur: 9 }, exit: { type: 'words', effect: 'fade', at: until - 8, dur: 7 },
});
label('Pesanan masuk', 12, 2 * K + 4);
label('Bayar sekali scan', 7 * K + 2, 9 * K + 10);
label('Resi otomatis', RESI + 4, 15 * K);
label('Sampai tanpa ribet', HAPPY + 4, WIDE - 2);
// tulisan raksasa "dicat" di ladang — bagian dari dunia, bukan teks tempelan
const paint = s.layer('Tulisan ladang', { x: 1860, y: 2150 });
paint.text('jualan', 0, -330, { weight: 800, size: 560, color: CREAM, align: 'center', valign: 'middle', letterSpacing: -10, fit: 2500, anim: { type: 'words', effect: 'rise', at: WIDE + 2 * K, dur: 12, distance: 160 } });
paint.text('jalan sendiri', 0, 230, { weight: 800, size: 560, color: ORANGE, align: 'center', valign: 'middle', letterSpacing: -10, fit: 2600, anim: { type: 'words', effect: 'rise', at: WIDE + 2 * K + 8, stagger: 5, dur: 12, distance: 160 } });
s.sfx('chime', { at: WIDE + 2 * K, volume: -10 });

// ---------------------------------------------------------------------
// KAMERA — ukuran shot berganti ke elemen yang sedang bercerita
// ---------------------------------------------------------------------
const C = (px, py, zoom) => ({ x: px - W / 2, y: py - H / 2, zoom });
const cam = [
  [0, C(540, 860, 1.7), 'in-out-sine'],                 // close-up: chat di HP
  [2 * K - 2, C(540, 840, 1.8), 'in-out-cubic'],         // push pelan saat menahan
  [2 * K + 14, C(760, 900, 1.0), 'in-out-sine'],         // mundur: kardus lahir & mendarat
  [6 * K, C(1320, 890, 1.05), 'in-out-cubic'],           // medium: ikut lompatan
  [7 * K - 2, C(1500, 840, 1.75), 'in-out-sine'],        // close-up: QRIS
  [9 * K, C(1500, 830, 1.84), 'in-out-cubic'],
  [9 * K + 18, C(1780, 930, 0.8), 'in-out-sine'],       // wide: palang naik, motor datang
  [11 * K, C(1880, 930, 0.86), 'in-out-cubic'],
  [11 * K + 12, C(1980, 900, 1.08), 'in-out-sine'],     // medium: ikut motor
  [15 * K, C(2900, 900, 1.08), 'in-out-cubic'],
  [16 * K + 4, C(3180, 1110, 1.85), 'in-out-sine'],      // close-up: kardus di depan pintu
  [18 * K + 6, C(3180, 1100, 1.95), 'in-out-cubic'],
  [WIDE + 12, C(1860, 1560, 0.33), 'in-out-sine'],       // extreme wide: seluruh rute
  [23 * K, C(1860, 1540, 0.35), 'linear'],
];
cam.forEach(([f, v, e]) => s.camera.key(f, v, e));
s.camera.shake({ amp: 10, freq: 18, from: LUNAS, to: LUNAS + 8, decay: true });
s.sfx('swoosh', { at: 7 * K - 14, dur: 0.4, volume: -16 });
s.sfx('swoosh', { at: WIDE - 6, dur: 0.8, volume: -14 });

p.sfx('beat', { at: 0, bpm: BPM, bars: 6, volume: -18, kick: 'x.....x...x.....', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' });
p.sfx('pad', { at: 0, dur: 14, root: 130.8, chord: [0, 4, 7, 11], brightness: 900, volume: -22 });

export default p;
