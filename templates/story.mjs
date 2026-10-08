// Template cerita gambar tangan (animatic). Ganti teks & gambar sesuai cerita lu.
//   gerak preview story.mjs
import { project, withPressure } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Cerita', preset: 'reels', fps: 24, background: '#f3eee3' });
p.effects({ grain: { amount: 0.08, animate: true }, vignette: 0.15 });
p.boil({ every: 3, amount: 0.6 }); // garis "hidup"

// coretan tangan yang tergambar mulai frame `at`
const ink = (layer, pts, size, at, dur = 10, opts = {}) =>
  layer.stroke(withPressure(pts, 'taper'), { brush: 'brush', size, color: INK, reveal: [at, dur, 'out-cubic'], ...opts });

// ---------------------------------------------------------------- Panel 1
const s1 = p.scene('Panel 1', { duration: '3s' });
s1.note({ action: 'Tokoh muncul, melihat ke kanan.', camera: 'push-in' });
const tokoh = s1.layer('Tokoh', { x: 400, y: 1000 });
tokoh.circle(0, -260, 70, { fill: INK, draw: [2, 10] });
tokoh.path('M -60 -180 C -140 -120 -150 120 -110 260 L 110 260 C 140 100 120 -120 60 -180 Z', { fill: INK, draw: [6, 14] });
const tanah = s1.layer('Tanah');
ink(tanah, [[60, 1270], [540, 1258], [1020, 1272]], 40, 0, 12, { brush: 'dry' });
const teks = s1.layer('Teks', { fixed: true });
teks.text('Suatu malam…', 540, 360, { font: 'Caveat', weight: 700, size: 130, color: INK, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'drop', at: 8, stagger: 6, dur: 10 } });
s1.camera.push({ zoom: 1.08 });
s1.sfx('scratch', { at: 0, dur: 0.5, volume: -10 });

// ---------------------------------------------------------------- Panel 2
const s2 = p.scene('Panel 2', { duration: '3s', transition: { type: 'wipe-left', duration: 10 } });
s2.note({ action: 'Ide muncul.' });
const ide = s2.layer('Ide', { x: 540, y: 820, pivot: [0, 0] });
ide.star(0, 0, 160, 70, 5, { fill: '#ffd43b', stroke: INK, strokeWidth: 8, draw: [4, 16] });
ide.pop(4).wiggle({ amp: 4, rot: 3, freq: 2, from: 20 });
const t2 = s2.layer('Teks', { fixed: true });
t2.text('…ada ide.', 540, 1300, { font: 'Caveat', weight: 700, size: 140, color: INK, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'pop', at: 18, stagger: 2, dur: 8 } });
s2.sfx('ding', { at: 18, volume: -8 });

export default p;
