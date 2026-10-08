// 045 · Pan panorama kota malam (16:9)
// kategori: kamera
// fitur: dunia 3× lebar layar · camera pan x dengan ease · gedung dari rng · jendela berkedip (blink beda periode) · bulan glow
// pakai: establishing shot, latar kota, transisi tempat, intro channel bertema urban

import { project, rng } from 'gerak';

const p = project({ title: 'Panorama kota', preset: 'youtube', fps: 30, background: '#0b1026' });
const W = p.width; // 1920
const H = p.height; // 1080
const LEBAR = W * 3;

const s = p.scene('Kota', { duration: '8s' });

// langit (fixed: tidak ikut pan → terasa sangat jauh)
const langit = s.layer('Langit', { fixed: true });
langit.rect(0, 0, W, H, { fill: { type: 'linear', angle: 90, stops: [[0, '#0b1026'], [1, '#2b2f6b']] } });
langit.circle(1500, 230, 180, { fill: { type: 'radial', stops: [[0, 'rgba(255,248,220,0.5)'], [1, 'rgba(255,248,220,0)']] } });
langit.circle(1500, 230, 70, { fill: '#fff8dc' });

// gedung-gedung: posisi & tinggi dari rng (selalu sama)
const R = rng('kota');
const gedung = s.layer('Gedung');
const jendelaGrup = [0, 1, 2].map((k) => s.layer(`Jendela ${k + 1}`));
let x = 0;
while (x < LEBAR) {
  const w = 120 + R() * 160;
  const h = 260 + R() * 520;
  const y = H - h;
  gedung.rect(x, y, w - 10, h, { fill: R() > 0.5 ? '#151a3d' : '#1b2150' });
  // jendela: grid kecil, dibagi ke 3 layer yang berkedip dengan ritme berbeda
  for (let wy = y + 30; wy < H - 40; wy += 46) {
    for (let wx = x + 18; wx < x + w - 34; wx += 36) {
      if (R() < 0.35) jendelaGrup[Math.floor(R() * 3)].rect(wx, wy, 16, 24, { fill: R() > 0.3 ? '#ffd166' : '#a5d8ff', opacity: 0.85 });
    }
  }
  x += w;
}
jendelaGrup.forEach((l, k) => l.blink({ period: 1.3 + k * 0.9, duty: 0.75 }));

// kamera menyapu dari kiri ke kanan dunia
s.camera.key(0, { x: 0 }, 'in-out-sine').key('8s', { x: LEBAR - W });

const teks = s.layer('Judul', { fixed: true });
teks.text('Kota yang tidak pernah tidur', 120, 170, { size: 72, weight: 800, color: '#ffffff', anim: { type: 'words', effect: 'blur', at: 10, stagger: 5, dur: 14 } });
teks.text('…dan bisnis yang tetap jalan saat lu tidur.', 120, 260, { size: 44, weight: 500, color: '#c5d0ff', anim: { type: 'lines', effect: 'fade', at: 60, dur: 16 } });

p.sfx('pad', { at: 0, dur: 8, root: 110, chord: [0, 3, 7, 10, 14], brightness: 900, volume: -16 });

export default p;
