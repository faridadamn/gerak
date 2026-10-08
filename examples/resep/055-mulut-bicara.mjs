// 055 · Mulut bicara sinkron dengan subtitle (lip-flap)
// kategori: karakter
// fitur: track mulut 4 bentuk (tutup/A/E/O) · data viseme [waktu, bentuk] → expose · karaoke subtitle · alis naik turun
// pakai: karakter narator, maskot yang "ngomong", animasi edukasi dengan dialog

import { project } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Mulut bicara', preset: 'reels', fps: 24, background: '#e7f5ff' });
const W = p.width;
const s = p.scene('Bicara', { duration: '4.5s' });

const kepala = s.group('Kepala', { x: W / 2, y: 860 });
kepala.sway({ angle: 2, period: 1.6 });
const wajah = kepala.layer('Wajah');
wajah.rect(-300, -340, 600, 680, { fill: '#74c0fc', r: 260, stroke: INK, strokeWidth: 10 });
wajah.circle(-110, -110, 36, { fill: INK });
wajah.circle(110, -110, 36, { fill: INK });
const alis = kepala.layer('Alis');
alis.line(-160, -200, -60, -210, { stroke: INK, strokeWidth: 14 });
alis.line(60, -210, 160, -200, { stroke: INK, strokeWidth: 14 });
alis.key(0, { y: 0 }).key(30, { y: -16 }, 'out-back').key(40, { y: 0 }).key(70, { y: -20 }, 'out-back').key(82, { y: 0 });

// MULUT: satu drawing per bentuk
const mulut = kepala.track('Mulut');
const bentuk = {
  X: (l) => l.line(-70, 120, 70, 120, { stroke: INK, strokeWidth: 14 }), // tertutup
  A: (l) => l.ellipse(0, 130, 80, 70, { fill: '#c92a2a', stroke: INK, strokeWidth: 12 }),
  E: (l) => l.ellipse(0, 125, 100, 34, { fill: '#c92a2a', stroke: INK, strokeWidth: 12 }),
  O: (l) => l.ellipse(0, 130, 44, 56, { fill: '#c92a2a', stroke: INK, strokeWidth: 12 }),
};
const d = {};
for (const [k, gambar] of Object.entries(bentuk)) {
  d[k] = mulut.drawing(`mulut ${k}`);
  gambar(d[k].layer(`bentuk ${k}`));
}

// data viseme: [detik, bentuk]. Bisa diisi dari tool lip-sync (mis. Rhubarb) atau ditulis manual.
const viseme = [
  [0, 'X'], [0.25, 'A'], [0.4, 'E'], [0.55, 'O'], [0.7, 'A'], [0.85, 'X'],
  [1.0, 'E'], [1.15, 'A'], [1.3, 'O'], [1.45, 'E'], [1.6, 'A'], [1.8, 'X'],
  [2.1, 'O'], [2.25, 'A'], [2.4, 'E'], [2.55, 'A'], [2.75, 'O'], [2.9, 'E'], [3.1, 'X'],
];
for (const [detik, b] of viseme) mulut.expose(`${detik}s`, d[b]);

// subtitle karaoke dengan waktu yang sama
const sub = s.layer('Subtitle', { fixed: true });
sub.text('Halo! Hari ini kita bahas sistem.', W / 2, 1480, {
  size: 64,
  weight: 800,
  color: '#1d2b53',
  align: 'center',
  valign: 'middle',
  maxWidth: 900,
  anim: { type: 'karaoke', times: ['0.25s', '1.0s', '1.3s', '1.6s', '2.1s', '2.4s'], color: '#e8590c', scale: 1.08 },
});

export default p;
