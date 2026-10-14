// Gaya 07 · Buku tulis (tulisan tangan pulpen biru di kertas bergaris)
// standar: tulisan pas di garis buku · coretan pulpen & stabilo yang tergambar · kamera ikut fokus · 90 BPM
// pakai: tutorial hitungan (HPP, margin, ongkir), catatan belajar, tips step-by-step

import { project, catmullRom, withPressure, ellipsePoints } from 'gerak';

const p = project({ title: 'Buku tulis', preset: 'reels', fps: 30, background: '#FBFAF4' });
const W = p.width;
const H = p.height;
const BPM = 90;
const K = (p.fps * 60) / BPM; // 20

const PEN = '#1E3A8A';
const RED = '#C62828';
const RULE = '#AFC9E8';
const MARGIN = '#E79A9A';
p.effects({ grain: 0.06, vignette: 0.14 });

const L = (n) => 240 + 120 * n;      // baseline garis ke-n
const hand = (o) => ({ font: 'Patrick Hand', size: 98, color: PEN, valign: 'baseline', ...o });
const write = (at, n) => ({ type: 'chars', effect: 'fade', at, stagger: Math.max(0.6, 14 / n), dur: 3 });

const s = p.scene('Catatan', { duration: 21 * K });
s.note({ action: 'HPP ditulis tangan baris demi baris, dijumlah, dilingkari merah, harga jual distabilo, sticky note' });

// kertas: garis, margin, lubang
const paper = s.layer('Kertas');
for (let n = 0; L(n) < H + 200; n++) paper.line(-100, L(n) + 12, W + 100, L(n) + 12, { stroke: RULE, strokeWidth: 2 });
paper.line(150, -100, 150, H + 200, { stroke: MARGIN, strokeWidth: 3 });
paper.line(160, -100, 160, H + 200, { stroke: MARGIN, strokeWidth: 2 });
[400, 960, 1520].forEach((y) => paper.circle(70, y, 24, { fill: '#E9E5D8' }));

// judul
const title = s.layer('Judul');
title.text('Cara hitung HPP', 190, L(1) + 20, hand({ font: 'Caveat', weight: 700, size: 170, fit: 830, anim: write(6, 15) }));
title.stroke(withPressure(catmullRom([[190, L(1) + 50], [500, L(1) + 62], [900, L(1) + 48]], 30), 'taper'), { brush: 'ink', size: 10, color: PEN, reveal: [K + 6, 10, 'out-cubic'] });
s.sfx('scratch', { at: 6, dur: 0.6, volume: -14 });

// rincian biaya
const ROWS = [
  ['bahan', 'Rp8.000'],
  ['kemasan', 'Rp1.500'],
  ['gas+listrik', 'Rp1.000'],
  ['tenaga', 'Rp2.000'],
];
const rows = s.layer('Rincian');
ROWS.forEach(([a, b], i) => {
  const at = (2 + i) * K;
  rows.text(a, 190, L(3 + i), hand({ anim: write(at, a.length) }));
  rows.text(b, 1000, L(3 + i), hand({ align: 'right', anim: write(at + 6, b.length) }));
  s.sfx('scratch', { at, dur: 0.35, volume: -15 });
});
const sum = s.layer('Garis jumlah');
sum.stroke(withPressure(catmullRom([[600, L(6) + 50], [800, L(6) + 46], [1000, L(6) + 50]], 20), 'flat'), { brush: 'pen', size: 6, color: PEN, reveal: [6 * K, 6, 'out-cubic'] });
sum.text('+', 1012, L(6) + 30, hand({ size: 80, anim: write(6 * K + 4, 1) }));

const hpp = s.layer('HPP');
hpp.text('HPP', 190, L(7), hand({ size: 120, anim: write(7 * K, 3) }));
hpp.text('Rp12.500', 1000, L(7), hand({ size: 120, align: 'right', anim: write(7 * K + 4, 8) }));
const circ = s.layer('Lingkar merah');
circ.stroke(ellipsePoints(790, L(7) - 38, 250, 84, { start: 200, end: 570, n: 70, pressure: (t) => 0.4 + 0.6 * Math.sin(Math.PI * t) }), {
  brush: 'ink', size: 9, color: RED, reveal: [8 * K, 12, 'in-out-sine'],
});
s.sfx('scratch', { at: 8 * K, dur: 0.5, volume: -16 });

// harga jual
const jual = s.layer('Harga jual');
jual.text('harga jual = HPP × 2', 190, L(8) + 20, hand({ anim: write(10 * K, 20) }));
const hl = s.layer('Stabilo');
hl.stroke([[200, L(9) - 40, 1], [860, L(9) - 40, 1]], { brush: 'highlighter', size: 120, color: '#FFE14D', reveal: [12 * K, 8, 'out-cubic'] });
const total = s.layer('Total');
total.text('= Rp25.000', 210, L(9) + 10, hand({ size: 140, anim: write(11 * K, 10) }));
s.sfx('ding', { at: 12 * K, volume: -12 });

const star = s.layer('Bintang', { x: 950, y: L(9) - 50 });
star.stroke('M 0 -50 L 14 -14 L 52 -14 L 22 8 L 32 46 L 0 24 L -32 46 L -22 8 L -52 -14 L -14 -14 Z', { brush: 'pen', size: 6, color: RED, reveal: [13 * K, 10, 'in-out-sine'] });

// sticky note + panah
const NOTE_AT = 15 * K;
const note = s.layer('Sticky', { x: 400, y: L(11) + 60, rotation: -4 });
note.rect(-230, -170, 460, 340, { fill: '#FFE873', shadow: { color: 'rgba(0,0,0,0.18)', blur: 24, y: 10 } });
note.rect(-230, -170, 460, 40, { fill: 'rgba(0,0,0,0.05)' });
note.text('jangan jual\ndi bawah\nangka ini!', 0, 0, { font: 'Caveat', weight: 700, size: 92, color: '#3B2F00', align: 'center', valign: 'middle', lineHeight: 0.95 });
note.key(0, { opacity: 0 }, 'hold').key(NOTE_AT, { opacity: 1 });
note.dropIn(NOTE_AT, { height: 500, dur: 12 });
s.sfx('pop', { at: NOTE_AT + 8, volume: -8 });
const arrow = s.layer('Panah');
arrow.stroke(withPressure(catmullRom([[640, L(11)], [1010, L(10) - 30], [1030, L(8)], [900, L(7) + 40]], 40), 'taper'), {
  brush: 'ink', size: 9, color: RED, reveal: [NOTE_AT + 14, 12, 'in-out-sine'],
});
arrow.stroke([[900, L(7) + 40, 1], [960, L(7) + 30, 0.6]], { brush: 'ink', size: 9, color: RED, reveal: [NOTE_AT + 26, 3] });
arrow.stroke([[900, L(7) + 40, 1], [930, L(7) + 96, 0.6]], { brush: 'ink', size: 9, color: RED, reveal: [NOTE_AT + 27, 3] });

// kamera: sedikit goyang tangan, maju ke HPP, mundur lagi
s.camera.handheld({ amp: 4 });
const focus = (x, y, z) => ({ x: x - W / 2, y: y - H / 2, zoom: z });
s.camera.key(0, { zoom: 1, x: 0, y: 0 }, 'hold').key(7 * K, { zoom: 1, x: 0, y: 0 }, 'in-out-cubic');
s.camera.key(8 * K, focus(620, L(6), 1.15), 'hold').key(9 * K + 10, focus(620, L(6), 1.15), 'in-out-cubic');
s.camera.key(10 * K + 10, { zoom: 1, x: 0, y: 0 });

p.sfx('beat', { at: 0, bpm: BPM, bars: 6, volume: -15, kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' });
p.sfx('pad', { at: 0, dur: 14, root: 196, chord: [0, 4, 7, 11], brightness: 900, volume: -17 });

export default p;
