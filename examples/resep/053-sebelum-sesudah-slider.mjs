// 053 · Slider sebelum / sesudah
// kategori: transisi
// fitur: group mask dengan layer mask yang dianimasikan (scaleX berporos kiri) · filter grayscale/blur untuk "sebelum" · garis slider ikut bergerak
// pakai: before-after foto/edit/desain, hasil filter, perbandingan kualitas, renovasi

import { project } from 'gerak';

const p = project({ title: 'Slider sebelum sesudah', preset: 'reels', fps: 30, background: '#000' });
const W = p.width;
const H = p.height;

const s = p.scene('Slider', { duration: '6s' });
const foto = (l) => l.image('assets/pemandangan.jpg', 0, 0, { width: W, height: H, fit: 'cover', focus: [0.7, 0.5] });

// 1) SEBELUM: foto pudar & buram (filter pada layer)
foto(s.layer('Sebelum', { filter: 'grayscale(0.85) brightness(0.8) blur(3px)' }));

// 2) SESUDAH: foto asli, hanya terlihat di area mask
//    mask = layer anak (id 'mask-sesudah') berisi kotak penuh layar yang skalanya dianimasikan
const sesudah = s.group('Sesudah', { mask: 'mask-sesudah' });
foto(sesudah.layer('Foto asli'));
// layer mask di tepi KANAN (x = W) dan kotaknya digambar ke kiri → scaleX berporos di kanan,
// jadi 'sesudah' muncul dari kanan dan 'sebelum' tetap di kiri
const mask = sesudah.layer('Mask', { id: 'mask-sesudah', x: W });
mask.rect(-W, 0, W, H, { fill: '#000' });

// porsi 'sesudah' yang terlihat (0..1) di beberapa waktu; dipakai untuk mask & garis supaya selalu sinkron
const posisi = [[0, 0.08, 'in-out-cubic'], [40, 0.5, 'in-out-cubic'], [80, 0.5, 'in-out-cubic'], [115, 0.92, 'in-out-cubic'], [140, 0.92, 'in-out-cubic'], [175, 0.5]];
const garis = s.layer('Garis slider');
garis.rect(-4, 0, 8, H, { fill: '#ffffff' });
garis.circle(0, H / 2, 52, { fill: '#ffffff', shadow: { color: 'rgba(0,0,0,0.3)', blur: 16 } });
garis.text('‹ ›', 0, H / 2, { size: 54, weight: 800, color: '#14161f', align: 'center', valign: 'middle' });
for (const [f, v, e] of posisi) {
  mask.key(f, { scaleX: v }, e);
  garis.key(f, { x: W - v * W }, e);
}

// 3) label
const label = s.layer('Label', { fixed: true });
label.text('SEBELUM', 60, 240, { size: 50, weight: 800, color: '#ffffff', letterSpacing: 4, box: { color: 'rgba(0,0,0,0.5)', padX: 20, padY: 10, radius: 12 } });
label.text('SESUDAH', W - 60, 240, { size: 50, weight: 800, color: '#14161f', align: 'right', letterSpacing: 4, box: { color: '#ffffff', padX: 20, padY: 10, radius: 12 } });

for (const [f] of posisi.slice(1)) s.sfx('swipe', { at: f - 10, volume: -16 });

export default p;
