// 089 · Visualizer radial di sekitar foto (audiogram)
// kategori: audio
// fitur: 48 batang melingkar (rotation per layer) · scaleY per ketuk dari rng · foto bulat berdenyut di ketuk · p.audio musik
// pakai: audiogram podcast, potongan siaran/VO, preview musik dengan foto profil

import { project, rng } from 'gerak';

const BPM = 100;
const p = project({ title: 'Visualizer radial', preset: 'reels', fps: 30, background: { type: 'radial', stops: [[0, '#1b2559'], [1, '#090b1a']] } });
const W = p.width;
const CX = W / 2;
const CY = 900;
const KETUK = (p.fps * 60) / BPM;

const s = p.scene('Audiogram', { duration: '7s' });
p.audio('assets/musik.mp3', { at: 0, trim: [0, 7], volume: -1, fadeOut: 1 });

// batang melingkar: tiap batang layer sendiri, diputar ke sudutnya; scaleY berporos di dasar batang
const R = rng('radial');
const N = 48;
for (let i = 0; i < N; i++) {
  const sudut = (i / N) * 360;
  // group di pusat yang diputar ke sudutnya; layer di dalamnya punya pivot di dasar batang
  // (rotasi & skala memakai pivot yang sama, jadi dipisah ke dua node)
  const arah = s.group(`Sudut ${i + 1}`, { x: CX, y: CY, rotation: sudut });
  const batang = arah.layer(`Batang ${i + 1}`, { pivot: [0, -280] });
  batang.rect(-7, -400, 14, 120, { fill: i % 2 ? '#00B7B3' : '#74c0fc', r: 7 }); // dari radius 280 ke 400
  for (let k = 0; k < 24; k++) {
    const kuat = k % 4 === 0 ? 1 : 0.6;
    batang.key(k * KETUK, { scaleY: 0.3 + R() * 0.9 * kuat }, 'out-quad').key(k * KETUK + KETUK - 2, { scaleY: 0.2 + R() * 0.2 }, 'in-quad');
  }
}

// foto bulat
const foto = s.layer('Foto', { x: CX, y: CY });
foto.circle(0, 0, 250, { fill: '#ffffff' });
foto.image('assets/avatar.png', 0, 0, { width: 480, height: 480, radius: 240, anchor: 'center' });
for (let k = 0; k < 24; k++) foto.key(k * KETUK, { scale: k % 4 === 0 ? 1.05 : 1.025 }, 'out-cubic').key(k * KETUK + KETUK - 1, { scale: 1 });

const teks = s.layer('Teks', { fixed: true });
teks.text('Podcast Sistem Bisnis', W / 2, 1460, { size: 66, weight: 800, color: '#ffffff', align: 'center' });
teks.text('Eps. 12 · Kenapa otomasi dulu, baru iklan', W / 2, 1540, { size: 40, weight: 500, color: '#a5b4fc', align: 'center' });

export default p;
