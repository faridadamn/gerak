// Gaya 02 · Swiss poster (International Typographic Style)
// standar: grid tegas · angka raksasa yang bleed keluar layar · satu warna merah · sinkron 120 BPM
// pakai: listicle "3 aturan / 3 kesalahan", konten edukasi tegas, carousel jadi video

import { project } from 'gerak';

const p = project({ title: 'Swiss poster', preset: 'reels', fps: 30, background: '#EFEDE8' });
const W = p.width;
const H = p.height;
const BLK = p.font('fonts/ArchivoBlack-Regular.ttf', { family: 'Archivo Black', weight: 400 });
const BPM = 120;
const K = (p.fps * 60) / BPM; // 15

const PAPER = '#EFEDE8';
const INK = '#111111';
const RED = '#E3001B';
const GREY = '#5E5B55';
p.effects({ grain: 0.04 });

const blk = (o) => ({ font: BLK, weight: 400, color: INK, valign: 'middle', ...o });
const body = (o) => ({ weight: 700, size: 54, color: GREY, valign: 'top', lineHeight: 1.3, maxWidth: 860, ...o });

// grid garis tipis — selalu sama di tiap scene biar terasa satu sistem
function grid(s, color = INK, at = 0) {
  const g = s.layer('Grid');
  [80, 1000].forEach((x, i) => g.line(x, 0, x, H, { stroke: color, strokeWidth: 3, draw: [at + i * 3, 14, 'out-cubic'] }));
  [260, 1560].forEach((y, i) => g.line(0, y, W, y, { stroke: color, strokeWidth: 3, draw: [at + 4 + i * 3, 14, 'out-cubic'] }));
  return g;
}
function label(s, text, right, color = INK) {
  const l = s.layer('Label', { fixed: true });
  l.text(text, 80, 200, { weight: 800, size: 44, color, valign: 'middle', letterSpacing: 2, case: 'upper' });
  l.text(right, 1000, 200, { weight: 800, size: 44, color, valign: 'middle', align: 'right' });
  l.fadeIn(0, 6);
}

// ---------------------------------------------------------------------
// 1. JUDUL — angka 3 merah raksasa + tiga kata
// ---------------------------------------------------------------------
const s1 = p.scene('Judul', { duration: 8 * K });
s1.note({ action: '3 merah raksasa naik dari bawah, ATURAN/HARGA/JUAL masuk per ketuk' });
grid(s1);
label(s1, 'seri jualan', '00/03');

const three = s1.layer('Tiga', { x: 1160, y: 1130 });
three.text('3', 0, 0, blk({ size: 1500, color: RED, align: 'right' }));
three.key(0, { y: 2400 }, 'out-expo').key(10, { y: 1130 });
s1.sfx('boom', { at: 2, volume: -8 });

['ATURAN', 'HARGA', 'JUAL.'].forEach((w, i) => {
  const at = K + i * K;
  const l = s1.layer(w, { x: 80, y: 560 + i * 230 });
  l.text(w, 0, 0, blk({ size: 210, fit: 900 }));
  l.wipeIn(at, { dir: 'right', dur: 6, ease: 'out-cubic', rect: [0, -140, 1000, 280] });
  s1.sfx('kick', { at, volume: -8 });
});
const s1sub = s1.layer('Sub', { fixed: true });
s1sub.text('biar nggak jualan rame\ntapi rugi.', 80, 1300, body({ color: INK, size: 64, anim: { type: 'lines', effect: 'rise', at: 4 * K + 4, stagger: 5, dur: 8 } }));

// ---------------------------------------------------------------------
// 2–4. TIGA ATURAN — tata letak berganti tiap scene
// ---------------------------------------------------------------------
const RULES = [
  { n: '01', head: 'HITUNG\nHPP\nDULU.', sub: 'Bahan, kemasan, ongkos. Tanpa angka ini, harga cuma tebakan.' },
  { n: '02', head: 'JANGAN\nIKUT\nPERANG\nHARGA.', sub: 'Yang menang perang harga cuma yang modalnya paling tebal.' },
  { n: '03', head: 'NAIKKAN\nNILAI,\nBUKAN\nDISKON.', sub: 'Bonus, garansi, layanan cepat. Pembeli bayar lebih buat yang jelas.' },
];
const TR = [
  { type: 'push-left', duration: 10, ease: 'in-out-quart' },
  { type: 'wipe-up', duration: 10, ease: 'in-out-quart' },
  { type: 'cover-left', duration: 10, ease: 'in-out-quart' },
];

RULES.forEach((r, i) => {
  const inv = i === 2; // scene terakhir dibalik: latar merah
  const bg = inv ? RED : PAPER;
  const fg = inv ? PAPER : INK;
  const acc = inv ? INK : RED;
  const s = p.scene(`Aturan ${r.n}`, { duration: 9 * K, background: bg, transition: TR[i] });
  s.note({ action: `Aturan ${r.n}: angka wipe, judul per baris di ketuk, garis merah tumbuh` });
  grid(s, fg);
  label(s, 'aturan', `${r.n}/03`, fg);

  // angka besar — kiri di 01 & 03, kanan di 02
  const right = i === 1;
  const num = s.layer('Nomor', { x: right ? 1000 : 80, y: 470 });
  num.text(r.n, 0, 0, blk({ size: 380, color: acc, align: right ? 'right' : 'left' }));
  num.wipeIn(2, { dir: 'up', dur: 8, ease: 'out-cubic', rect: [-1100, -260, 2200, 520] });
  s.sfx('impact', { at: 2, volume: -10 });

  const bar = s.layer('Bar', { x: right ? 1000 : 80, y: 690, pivot: [0, 0] });
  bar.rect(right ? -920 : 0, 0, 920, 18, { fill: acc });
  bar.key(0, { scaleX: 0 }, 'hold').key(6, { scaleX: 0 }, 'out-expo').key(16, { scaleX: 1 });

  const lines = r.head.split('\n');
  const size = lines.length > 3 ? 148 : 172;
  lines.forEach((ln, j) => {
    const at = K + j * (K / 2) + 2;
    const l = s.layer(`Judul ${j}`, { x: right ? 1000 : 80, y: 820 + j * size * 0.98 });
    l.text(ln, 0, 0, blk({ size, color: fg, align: right ? 'right' : 'left', fit: 920 }));
    l.wipeIn(at, { dir: right ? 'left' : 'right', dur: 5, ease: 'out-cubic', rect: [-1100, -size, 2200, size * 2] });
    s.sfx('tap', { at, volume: -10 });
  });
  const subY = 820 + lines.length * size * 0.98 + 10;
  const sb = s.layer('Sub', { fixed: true });
  sb.text(r.sub, right ? 1000 : 80, subY, body({ color: inv ? PAPER : GREY, align: right ? 'right' : 'left', maxWidth: 800, anim: { type: 'words', effect: 'fade', at: 4 * K, stagger: 1, dur: 6 } }));
  s.camera.push({ zoom: 1.03 });
});

// ---------------------------------------------------------------------
// 5. CTA — hitam, simpan
// ---------------------------------------------------------------------
const s5 = p.scene('CTA', { duration: 6 * K, background: INK, transition: { type: 'cut' } });
s5.note({ action: 'SIMPAN / BIAR / NGGAK / LUPA. kata per ketuk' });
grid(s5, '#333');
['SIMPAN', 'BIAR', 'NGGAK', 'LUPA.'].forEach((w, i) => {
  const l = s5.layer(w, { x: 80, y: 520 + i * 250 });
  l.text(w, 0, 0, blk({ size: 240, color: i === 0 ? RED : PAPER, fit: 920 }));
  l.key(0, { opacity: 0 }, 'hold').key(i * K, { opacity: 1 });
  l.pop(i * K, { from: 1.25, dur: 5, ease: 'out-cubic', fade: false });
  s5.sfx(i === 0 ? 'impact' : 'kick', { at: i * K, volume: -8 });
});

p.sfx('beat', { at: 0, bpm: BPM, bars: 9, volume: -17, kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx' });

export default p;
