// 018 · Ilustrasi sketsa rumah (gaya rough)
// kategori: brush
// fitur: shape sketch (garis tangan + arsir hachure / solid) · draw berurutan · boil · font Caveat · polygon
// pakai: ilustrasi penjelasan sederhana, gaya whiteboard/notebook, konten properti/KPR

import { project } from 'gerak';

const INK = '#2b2a27';
const p = project({ title: 'Sketsa rumah', preset: 'reels', fps: 24, background: '#fbf8f1' });
p.boil({ every: 3, amount: 0.7 });
const W = p.width;

const s = p.scene('Rumah', { duration: '6s' });

// sketch: true → digambar seperti tangan. fill 'hachure' = arsir garis, 'solid' = blok warna offset.
const sk = (extra = {}) => ({ brush: 'pen', size: 5, color: INK, roughness: 1.3, ...extra });
const l = s.layer('Gambar');
l.line(80, 1300, 1000, 1300, { stroke: INK, strokeWidth: 6, sketch: sk(), draw: [0, 10] });
l.rect(260, 900, 560, 400, { fill: '#ffd8a8', sketch: sk({ gap: 14, hatchSize: 3 }), draw: [8, 18] }); // badan rumah
l.polygon([[220, 910], [540, 640], [860, 910]], { fill: '#e8590c', sketch: sk({ fill: 'solid', offset: [10, 8] }), draw: [24, 16] }); // atap
l.rect(480, 1080, 120, 220, { fill: '#8d5524', sketch: sk({ fill: 'solid', offset: [6, 5] }), draw: [38, 10] }); // pintu
l.rect(320, 980, 120, 100, { fill: '#a5d8ff', sketch: sk({ gap: 10, angle: 40 }), draw: [46, 10] }); // jendela
l.rect(640, 980, 120, 100, { fill: '#a5d8ff', sketch: sk({ gap: 10, angle: 40 }), draw: [52, 10] });
l.circle(860, 420, 90, { fill: '#ffd43b', sketch: sk({ fill: 'solid', offset: [8, 8] }), draw: [60, 12] }); // matahari
l.rect(140, 1080, 34, 220, { fill: '#8d5524', sketch: sk({ fill: 'solid', offset: [4, 4] }), draw: [70, 8] }); // batang pohon
l.circle(157, 1010, 100, { fill: '#69db7c', sketch: sk({ gap: 12 }), draw: [74, 12] }); // daun
l.ellipse(320, 420, 110, 50, { fill: '#ffffff', sketch: sk({ fill: 'none' }), draw: [84, 10] }); // awan

const teks = s.layer('Caption', { fixed: true });
teks.text('Rumah impian,\ndicicil pakai sistem.', W / 2, 1520, { font: 'Caveat', weight: 700, size: 96, color: INK, align: 'center', valign: 'top', lineHeight: 1.05, anim: { type: 'words', effect: 'fade', at: 96, stagger: 4, dur: 10 } });

for (const at of [0, 8, 24, 38, 46, 60, 74]) s.sfx('scratch', { at, dur: 0.35, volume: -14 });

export default p;
