// 027 · Karakter doodle dengan garis "hidup" (line boil)
// kategori: brush
// fitur: boil per elemen (every, variants, amount) · sway + float idle · balon kata sketch · Caveat
// pakai: maskot sederhana, karakter penjelas, vibe kartun gambar tangan

import { project, ellipsePoints } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Line boil karakter', preset: 'reels', fps: 24, background: '#e7f5ff' });
// boil untuk semua brush stroke & sketch di project ini
p.boil({ every: 3, variants: 3, amount: 1.2 });
const W = p.width;

const s = p.scene('Karakter', { duration: '5s' });

// karakter: layer di titik kaki → sway berporos di kaki
const tokoh = s.group('Tokoh', { x: W / 2, y: 1350 });
tokoh.sway({ angle: 3, period: 2 });
const badan = tokoh.layer('Badan');
badan.path('M -170 0 C -200 -200 -180 -460 0 -470 C 180 -460 200 -200 170 0 Z', { fill: '#ffe066' });
badan.stroke(ellipsePoints(0, -235, 180, 240, { n: 60 }), { brush: 'ink', size: 12, color: INK });
// mata & mulut: garis tinta (ikut boil)
const muka = tokoh.layer('Muka');
muka.circle(-60, -300, 20, { fill: INK });
muka.circle(60, -300, 20, { fill: INK });
muka.stroke(ellipsePoints(0, -230, 70, 40, { start: 20, end: 160, n: 20 }), { brush: 'ink', size: 10, color: INK });
// tangan melambai (group sendiri, berporos di bahu)
const tangan = tokoh.group('Tangan', { x: 160, y: -240 });
tangan.layer('Garis tangan').stroke([[0, 0, 1], [80, -60, 1], [130, -150, 0.8]], { brush: 'ink', size: 14, color: INK });
tangan.sway({ angle: 18, period: 0.6 });
// kaki
badan.stroke([[-70, 0, 1], [-80, 90, 1], [-120, 100, 1]], { brush: 'ink', size: 14, color: INK, smooth: false });
badan.stroke([[70, 0, 1], [80, 90, 1], [120, 100, 1]], { brush: 'ink', size: 14, color: INK, smooth: false });

// balon kata (rect sketch)
const balon = s.layer('Balon', { x: W / 2, y: 520 });
balon.rect(-300, -130, 600, 260, { fill: '#ffffff', r: 60, sketch: { brush: 'pen', size: 6, fill: 'solid', offset: [0, 0], roughness: 1.4 } });
balon.polygon([[-40, 125], [40, 125], [-10, 210]], { fill: '#ffffff', sketch: { brush: 'pen', size: 6, fill: 'solid', offset: [0, 0] } });
balon.text('Halo! Gw Doni.', 0, 0, { font: 'Caveat', weight: 700, size: 90, color: INK, align: 'center', valign: 'middle' });
balon.pop(12, { dur: 12 });
balon.float({ amp: 8, period: 2.2, from: 24 });

s.sfx('bubble', { at: 12, volume: -10 });

export default p;
