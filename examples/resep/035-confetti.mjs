// 035 · Ledakan confetti perayaan
// kategori: grafis
// fitur: partikel dari rng (deterministik) · key berantai naik (out-quad) lalu jatuh (in-quad) · spin per partikel · stamp teks · clap/success
// pakai: milestone tercapai, pesanan ke-1000, ulang tahun, pengumuman pemenang giveaway

import { project, rng } from 'gerak';

const p = project({ title: 'Confetti', preset: 'reels', fps: 30, background: '#2D3E8D' });
const W = p.width;
const H = p.height;

const s = p.scene('Rayakan', { duration: '5s' });
const LEDAK = 10; // frame ledakan

// 1) teks utama
const teks = s.layer('Teks', { x: W / 2, y: 860 });
teks.text('SELAMAT!', 0, 0, { size: 170, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'stamp', at: LEDAK, stagger: 2, dur: 8 } });
teks.text('pesanan ke-1.000 masuk', 0, 150, { size: 60, weight: 600, color: '#c5d0ff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'rise', at: LEDAK + 20, stagger: 3 } });

// 2) confetti: tiap partikel layer sendiri
const R = rng('confetti'); // ganti seed → pola lain, tapi render selalu sama
const WARNA = ['#00B7B3', '#FFD43B', '#ff6b6b', '#ffffff', '#74c0fc', '#b197fc'];
for (let i = 0; i < 90; i++) {
  const x0 = W / 2 + (R() - 0.5) * 120;
  const y0 = 1150;
  const xPuncak = x0 + (R() - 0.5) * 1300;
  const yPuncak = 250 + R() * 500;
  const xAkhir = xPuncak + (R() - 0.5) * 300;
  const tNaik = 14 + R() * 10;
  const tJatuh = 60 + R() * 50;
  const l = s.layer(`Confetti ${i + 1}`, { x: x0, y: y0, opacity: 0 });
  const warna = WARNA[i % WARNA.length];
  if (i % 3 === 0) l.circle(0, 0, 10 + R() * 6, { fill: warna });
  else l.rect(-8, -16, 16 + R() * 8, 30, { fill: warna, r: 3 });
  l.key(0, { opacity: 0 }, 'hold').key(LEDAK, { opacity: 1 });
  l.key(LEDAK, { x: x0, y: y0 }, 'out-quad')
    .key(LEDAK + tNaik, { x: xPuncak, y: yPuncak }, 'in-quad')
    .key(LEDAK + tNaik + tJatuh, { x: xAkhir, y: H + 80 });
  l.spin({ speed: (R() - 0.5) * 1400, from: LEDAK });
  l.wiggle({ amp: [18, 0], freq: 2 + R() * 2, from: LEDAK + tNaik });
}

s.sfx('boom', { at: LEDAK, volume: -12 });
s.sfx('clap', { at: LEDAK + 2, volume: -10 });
s.sfx('clap', { at: LEDAK + 9, volume: -12 });
s.sfx('success', { at: LEDAK + 20, volume: -8 });

export default p;
