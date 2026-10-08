// 040 · Ken Burns dua potongan foto + judul lokasi
// kategori: kamera
// fitur: image fit cover + focus berbeda · camera.key zoom & pan · crossfade antar scene · ikon pin path · vignette
// pakai: slideshow foto produk/lokasi, travel, properti, dokumentasi acara

import { project } from 'gerak';

const p = project({ title: 'Ken Burns', preset: 'reels', fps: 30, background: '#000' });
p.effects({ vignette: 0.35 });
const W = p.width;
const H = p.height;

// judul lokasi: pin + teks, dipakai di kedua scene
function judulLokasi(scene, tempat, sub) {
  const l = scene.layer('Lokasi', { fixed: true, x: 90, y: 1460 });
  l.path('M 0 -40 C -26 -40 -40 -20 -40 0 C -40 26 0 70 0 70 C 0 70 40 26 40 0 C 40 -20 26 -40 0 -40 Z', { fill: '#ff6b6b' });
  l.circle(0, -2, 14, { fill: '#ffffff' });
  l.text(tempat, 70, 0, { size: 84, weight: 800, color: '#ffffff', valign: 'middle', shadow: { color: 'rgba(0,0,0,0.4)', blur: 20, y: 4 }, anim: { type: 'chars', effect: 'rise', at: 8, stagger: 1.2 } });
  l.text(sub, 72, 80, { size: 44, weight: 500, color: 'rgba(255,255,255,0.85)', valign: 'middle', anim: { type: 'lines', effect: 'fade', at: 22 } });
  l.slideIn(4, { from: 'left', distance: 60, dur: 14 });
}

// scene 1: fokus ke matahari (kanan), zoom pelan masuk
const s1 = p.scene('Senja', { duration: '4s' });
s1.layer('Foto').image('assets/pemandangan.jpg', 0, 0, { width: W, height: H, fit: 'cover', focus: [0.8, 0.5] });
judulLokasi(s1, 'Danau Senja', 'golden hour, 17.40');
s1.camera.key(0, { zoom: 1.0, x: 0 }, 'in-out-sine').key('4s', { zoom: 1.18, x: 60, y: -40 });

// scene 2: potongan kiri (burung & gunung), zoom keluar
const s2 = p.scene('Gunung', { duration: '4s', transition: { type: 'fade', duration: 18 } });
s2.layer('Foto').image('assets/pemandangan.jpg', 0, 0, { width: W, height: H, fit: 'cover', focus: [0.25, 0.4] });
judulLokasi(s2, 'Bukit Ungu', 'jalur pendakian 2 jam');
s2.camera.key(0, { zoom: 1.25, x: -40, y: -120 }, 'in-out-sine').key('4s', { zoom: 1.02, x: 0, y: 0 });

p.sfx('pad', { at: 0, dur: p.seconds, root: 220, chord: [0, 4, 7, 9, 14], volume: -16 });
s2.sfx('whoosh', { at: 0, dur: 0.8, volume: -16 });

export default p;
