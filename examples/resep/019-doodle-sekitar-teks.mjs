// 019 · Doodle tangan di sekitar judul
// kategori: brush
// fitur: brush ink/marker reveal berurutan · ellipsePoints · wobble · boil · pop judul · sparkle
// pakai: pengumuman ceria, launching, "save this!", thumbnail hidup

import { project, ellipsePoints, withPressure, wobble } from 'gerak';

const INK = '#1d1c1a';
const TEAL = '#00B7B3';
const p = project({ title: 'Doodle sekitar teks', preset: 'reels', fps: 24, background: '#fff6d6' });
p.boil({ every: 3, amount: 0.8 });
const W = p.width;

const s = p.scene('Doodle', { duration: '4.5s' });

const judul = s.layer('Judul', { x: W / 2, y: 900 });
judul.text('LAUNCHING\nBESOK!', 0, 0, { size: 150, weight: 800, color: INK, align: 'center', valign: 'middle', lineHeight: 1 });
judul.pop(0, { dur: 14 });

const d = s.layer('Doodle');
const goresan = (titik, at, opsi = {}) => d.stroke(titik, { brush: 'ink', size: 12, color: INK, reveal: [at, 8, 'out-cubic'], ...opsi });

// lingkaran longgar mengelilingi judul (elips yang tidak menutup sempurna + goyangan)
goresan(wobble(ellipsePoints(W / 2, 900, 470, 260, { start: 200, end: 555, n: 60, pressure: (t) => 0.5 + 0.5 * Math.sin(Math.PI * t) }), 6, { seed: 3 }), 14, { brush: 'marker', size: 10, color: TEAL });
// garis bawah bergelombang
goresan(withPressure([[260, 1130], [400, 1110], [540, 1140], [680, 1110], [820, 1135]], 'taper'), 26, { size: 14 });
// panah melengkung dari pojok
goresan(withPressure([[160, 420], [230, 520], [330, 600]], 'out'), 32);
goresan([[290, 610, 1], [330, 600, 1], [322, 560, 1]], 38, { smooth: false });
// tanda kilau (4 garis pendek)
for (const [cx, cy, r, at] of [[880, 520, 50, 40], [190, 1290, 40, 46], [900, 1300, 34, 50]]) {
  for (let k = 0; k < 4; k++) {
    const a = (k * Math.PI) / 2;
    goresan([[cx + Math.cos(a) * r * 0.4, cy + Math.sin(a) * r * 0.4, 0.4], [cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1]], at + k, { size: 9, smooth: false });
  }
}
// tulisan kecil tangan
const catatan = s.layer('Catatan', { fixed: true });
catatan.text('jam 19.00 WIB', W / 2, 1400, { font: 'Caveat', weight: 700, size: 80, color: '#e8590c', align: 'center', anim: { type: 'chars', effect: 'pop', at: 56, stagger: 1.2, dur: 8 } });

s.sfx('pop', { at: 0, volume: -8 });
for (const at of [14, 26, 32, 40, 46, 50]) s.sfx('scratch', { at, dur: 0.3, volume: -14 });

export default p;
