// 100 · Showcase lengkap (gabungan banyak teknik dalam 1 video)
// kategori: lanjut
// fitur: hook kinetik + scramble · brush reveal · grafik naik · parallax kamera · mask foto · counter · confetti · outro brand · 6 transisi · SFX + musik
// pakai: contoh struktur video utuh ±16 detik — salin kerangkanya lalu ganti isi tiap scene

import { project, rng, withPressure } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const INK = '#14161f';
const p = project({ title: 'Showcase Gerak', preset: 'reels', fps: 30, background: '#f5f7fb' });
p.effects({ grain: 0.035 });
const W = p.width;
const H = p.height;

// ================================================================ 1. HOOK
const s1 = p.scene('Hook', { duration: '2.6s', background: INK });
const h1 = s1.layer('Hook', { fixed: true });
h1.text('Video ini', W / 2, 760, { size: 110, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'rise', at: 2, stagger: 4 } });
h1.text('100% KODE', W / 2, 900, { size: 150, weight: 800, color: TEAL, align: 'center', valign: 'middle', anim: { type: 'scramble', at: 12, dur: 22 } });
h1.text('tanpa editor video', W / 2, 1040, { size: 60, weight: 600, color: '#adb5bd', align: 'center', valign: 'middle', anim: { type: 'lines', effect: 'fade', at: 40 } });
s1.camera.push({ zoom: 1.06 });
s1.sfx('glitch', { at: 12, dur: 0.7, volume: -16 });

// ================================================================ 2. GAMBAR TANGAN
const s2 = p.scene('Gambar', { duration: '2.8s', background: '#fdfaf3', transition: { type: 'wipe-up', duration: 10 } });
const kuas = s2.layer('Kuas');
kuas.stroke(withPressure([[160, 1100], [380, 820], [620, 1000], [900, 700]], 'taper'), { brush: 'ink', size: 40, color: INK, reveal: [4, 22, 'in-out-sine'] });
kuas.stroke(withPressure([[150, 1260], [540, 1236], [920, 1270]], 'taper'), { brush: 'dry', size: 50, color: TEAL, reveal: [24, 14, 'out-cubic'] });
const t2 = s2.layer('Teks', { fixed: true });
t2.text('Digambar kuas', W / 2, 460, { font: 'Caveat', weight: 700, size: 130, color: INK, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'pop', at: 6, stagger: 1.5 } });
s2.sfx('scratch', { at: 4, dur: 1.2, volume: -12 });

// ================================================================ 3. DATA
const s3 = p.scene('Data', { duration: '2.8s', transition: { type: 'push-left', duration: 10, ease: 'in-out-quart' } });
[22, 30, 26, 44, 58, 90].forEach((v, i) => {
  const b = s3.layer(`Batang ${i + 1}`, { x: 190 + i * 140, y: 1350 });
  b.rect(-46, -v * 8, 92, v * 8, { fill: i === 5 ? TEAL : '#c5cbe0', r: [16, 16, 0, 0] });
  b.key(4 + i * 4, { scaleY: 0 }, 'out-back').key(22 + i * 4, { scaleY: 1 });
});
const t3 = s3.layer('Teks', { fixed: true });
t3.text('0%', W / 2, 420, { size: 170, weight: 800, color: BLUE, align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: 309, at: 6, dur: 40, ease: 'out-expo', prefix: '+', suffix: '%' } });
t3.text('pertumbuhan bisa dianimasikan', W / 2, 560, { size: 50, weight: 600, color: '#6b7186', align: 'center', valign: 'middle' });
s3.sfx('coin', { at: 46, volume: -10 });

// ================================================================ 4. FOTO + MASK + PARALLAX
const s4 = p.scene('Foto', { duration: '3s', background: '#0d0d12', transition: { type: 'iris', duration: 14 } });
const g4 = s4.group('Foto dalam huruf', { mask: 'mask-s4', x: W / 2, y: 900, depth: 0.8 });
g4.layer('Foto').image('assets/pemandangan.jpg', 0, 0, { width: 1500, height: 1000, anchor: 'center' });
g4.layer('Mask', { id: 'mask-s4' }).text('FOTO', 0, 0, { size: 320, weight: 800, color: '#000', align: 'center', valign: 'middle' });
const t4 = s4.layer('Teks', { fixed: true });
t4.text('masker, kamera, parallax', W / 2, 1220, { size: 56, weight: 700, color: '#ffffff', align: 'center', anim: { type: 'words', effect: 'blur', at: 10, stagger: 4, dur: 12 } });
s4.camera.key(0, { x: -80, zoom: 1.1 }, 'in-out-sine').key('3s', { x: 80, zoom: 1 });
s4.sfx('whoosh', { at: 0, dur: 0.6, volume: -14 });

// ================================================================ 5. PERAYAAN
const s5 = p.scene('Rayakan', { duration: '2.8s', background: BLUE, transition: { type: 'flash', duration: 8 } });
const R = rng('showcase');
for (let i = 0; i < 50; i++) {
  const c = s5.layer(`Confetti ${i + 1}`, { x: W / 2, y: 1100 });
  c.rect(-8, -14, 16, 28, { fill: ['#00B7B3', '#FFD43B', '#ff6b6b', '#ffffff'][i % 4], r: 3 });
  const xp = W / 2 + (R() - 0.5) * 1200;
  c.key(4, { x: W / 2, y: 1100 }, 'out-quad').key(22, { x: xp, y: 300 + R() * 400 }, 'in-quad').key(84, { x: xp + (R() - 0.5) * 200, y: H + 60 });
  c.spin({ speed: (R() - 0.5) * 1200 });
}
const t5 = s5.layer('Teks', { x: W / 2, y: 880 });
t5.text('100 contoh', 0, 0, { size: 150, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'stamp', at: 4, stagger: 2, dur: 8 } });
t5.text('siap disalin', 0, 140, { size: 70, weight: 700, color: '#FFD43B', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'rise', at: 30, stagger: 4 } });
s5.sfx('boom', { at: 4, volume: -10 });
s5.sfx('clap', { at: 6, volume: -10 });

// ================================================================ 6. OUTRO
const s6 = p.scene('Outro', { duration: '2.6s', background: INK, transition: { type: 'zoom', duration: 12 } });
const logo = s6.layer('Logo', { x: W / 2, y: 780 });
logo.circle(0, 0, 120, { fill: TEAL });
logo.path('M -34 -58 L 66 0 L -34 58 Z', { fill: '#ffffff' });
logo.pop(4, { dur: 14 });
const t6 = s6.layer('Teks', { fixed: true });
t6.text('GERAK', W / 2, 1020, { size: 120, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 22, anim: { type: 'chars', effect: 'rise', at: 14, stagger: 3 } });
t6.text('gambar lewat kode → video', W / 2, 1130, { size: 46, weight: 600, color: '#9fb0ff', align: 'center', valign: 'middle', anim: { type: 'lines', effect: 'fade', at: 34 } });
s6.sfx('chime', { at: 14, volume: -12 });

// musik sepanjang video
p.sfx('beat', { at: 0, bpm: 105, bars: 7, volume: -18 });
p.sfx('pad', { at: 0, dur: p.seconds, root: 196, chord: [0, 4, 7, 11], volume: -22 });

export default p;
