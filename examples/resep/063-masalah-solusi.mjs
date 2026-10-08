// 063 · Format masalah → solusi
// kategori: konten
// fitur: dua scene kontras (merah/teal) · tanda X dan centang digambar (draw) · shake di masalah · wipe-up transisi · sfx error/success
// pakai: konten problem-solution, iklan produk, "kesalahan umum → cara benar"

import { project } from 'gerak';

const p = project({ title: 'Masalah solusi', preset: 'reels', fps: 30, background: '#fff5f5' });
const W = p.width;

// ---- MASALAH
const s1 = p.scene('Masalah', { duration: '3s' });
const x = s1.layer('Tanda X', { x: W / 2, y: 640 });
x.circle(0, 0, 150, { fill: '#ffe3e3' });
x.line(-60, -60, 60, 60, { stroke: '#e03131', strokeWidth: 28, draw: [6, 8, 'out-cubic'] });
x.line(60, -60, -60, 60, { stroke: '#e03131', strokeWidth: 28, draw: [12, 8, 'out-cubic'] });
x.pop(0, { dur: 12 });
const t1 = s1.layer('Teks', { fixed: true });
t1.text('MASALAH', W / 2, 920, { size: 48, weight: 800, color: '#e03131', align: 'center', letterSpacing: 10 });
t1.text('Chat numpuk, pembeli kabur ke toko sebelah.', W / 2, 1060, { size: 80, weight: 800, color: '#14161f', align: 'center', valign: 'top', maxWidth: 900, lineHeight: 1.1, anim: { type: 'words', effect: 'drop', at: 10, stagger: 3, dur: 10 } });
t1.shake({ amp: 5, freq: 14, from: 40, to: 52, decay: true });
s1.sfx('error', { at: 8, volume: -10 });

// ---- SOLUSI
const s2 = p.scene('Solusi', { duration: '3.5s', background: '#e6fcf5', transition: { type: 'wipe-up', duration: 12, ease: 'in-out-cubic' } });
const v = s2.layer('Centang', { x: W / 2, y: 640 });
v.circle(0, 0, 150, { fill: '#c3fae8' });
v.polygon([[-70, 0], [-20, 50], [75, -55]], { closed: false, stroke: '#0ca678', strokeWidth: 30, draw: [10, 12, 'out-cubic'] });
v.pop(4, { dur: 14 });
const t2 = s2.layer('Teks', { fixed: true });
t2.text('SOLUSI', W / 2, 920, { size: 48, weight: 800, color: '#0ca678', align: 'center', letterSpacing: 10 });
t2.text('Auto-balas 24 jam + katalog otomatis.', W / 2, 1060, {
  size: 80,
  weight: 800,
  color: '#14161f',
  align: 'center',
  valign: 'top',
  maxWidth: 900,
  lineHeight: 1.1,
  anim: { type: 'words', effect: 'pop', at: 14, stagger: 3, dur: 12 },
  highlight: { words: ['24', 'jam'], style: 'marker', color: '#63e6be', at: 44, dur: 10, opacity: 0.6 },
});
s2.sfx('success', { at: 12, volume: -8 });

export default p;
