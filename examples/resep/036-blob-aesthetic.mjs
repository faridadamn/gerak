// 036 · Latar blob blur + kartu kaca (glassmorphism)
// kategori: grafis
// fitur: layer blur (channel blur) · float/wiggle lambat · kartu transparan + stroke · blurIn teks · pad ambient
// pakai: latar estetik untuk quote/pengumuman, intro kalem, template konten "soft"

import { project } from 'gerak';

const p = project({ title: 'Blob aesthetic', preset: 'reels', fps: 30, background: { type: 'linear', angle: 160, stops: [[0, '#1e1b4b'], [1, '#0f766e']] } });
const W = p.width;

const s = p.scene('Blob', { duration: '6s' });

// 1) blob besar yang di-blur (blur: px), bergerak pelan
const blob = [
  { x: 260, y: 520, r: 300, c: '#f472b6', amp: 60 },
  { x: 860, y: 760, r: 340, c: '#22d3ee', amp: 70 },
  { x: 420, y: 1360, r: 360, c: '#a78bfa', amp: 80 },
  { x: 900, y: 1600, r: 240, c: '#fbbf24', amp: 50 },
];
blob.forEach((b, i) => {
  const l = s.layer(`Blob ${i + 1}`, { x: b.x, y: b.y, blur: 90, opacity: 0.85 });
  l.circle(0, 0, b.r, { fill: b.c });
  l.wiggle({ amp: b.amp, freq: 0.25, seed: i });
  l.pulse({ amount: 0.06, period: 3 + i });
});

// 2) kartu kaca: putih transparan + garis tepi tipis
const kartu = s.layer('Kartu', { x: W / 2, y: 980, fixed: true });
kartu.rect(-420, -330, 840, 660, { fill: 'rgba(255,255,255,0.14)', stroke: 'rgba(255,255,255,0.45)', strokeWidth: 3, r: 48, shadow: { color: 'rgba(0,0,0,0.18)', blur: 50, y: 20 } });
kartu.text('Tenang itu\nbukan malas.', 0, -80, { size: 96, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', lineHeight: 1.08 });
kartu.text('Itu tanda sistemmu jalan.', 0, 150, { size: 50, weight: 500, color: 'rgba(255,255,255,0.85)', align: 'center', valign: 'middle' });
kartu.blurIn(6, { amount: 20, dur: 24 });

p.sfx('pad', { at: 0, dur: 6, root: 196, chord: [0, 4, 7, 11, 14], brightness: 1200, volume: -16 });

export default p;
