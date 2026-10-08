// 097 · Seni generatif dari seed
// kategori: lanjut
// fitur: rng(seed) → bentuk/warna/rotasi acak tapi identik tiap render · reveal berdasarkan jarak dari pusat · spin halus per tile · ganti SEED = karya baru
// pakai: latar abstrak unik, cover/thumbnail generatif, pola brand, konten "art of the day"

import { project, rng } from 'gerak';

const SEED = 'gerak-2026'; // ganti nilai ini → komposisi baru
const p = project({ title: 'Generatif seed', preset: 'reels', fps: 30, background: '#f8f5ee' });
const W = p.width;
const H = p.height;

const s = p.scene('Generatif', { duration: '6s' });
const R = rng(SEED);
const PALET = [['#264653', '#2a9d8f', '#e9c46a', '#f4a261', '#e76f51'], ['#2D3E8D', '#00B7B3', '#FFD43B', '#ff6b6b', '#14161f'], ['#5f0f40', '#9a031e', '#fb8b24', '#e36414', '#0f4c5c']][Math.floor(R() * 3)];

const UK = 135;
const KOL = 8;
const BAR = 14;
const X0 = (W - KOL * UK) / 2 + UK / 2;
const Y0 = (H - BAR * UK) / 2 + UK / 2;
for (let r = 0; r < BAR; r++) {
  for (let c = 0; c < KOL; c++) {
    const x = X0 + c * UK;
    const y = Y0 + r * UK;
    const jarak = Math.hypot(c - (KOL - 1) / 2, r - (BAR - 1) / 2);
    const at = Math.round(jarak * 5);
    const rot = Math.floor(R() * 4) * 90;
    const l = s.layer(`Tile ${r}-${c}`, { x, y, rotation: rot });
    const w1 = PALET[Math.floor(R() * PALET.length)];
    const w2 = PALET[Math.floor(R() * PALET.length)];
    const h = UK / 2 - 4;
    l.rect(-h, -h, h * 2, h * 2, { fill: w1 });
    const jenis = Math.floor(R() * 4);
    if (jenis === 0) l.circle(0, 0, h * 0.7, { fill: w2 });
    else if (jenis === 1) l.polygon([[-h, -h], [h, -h], [-h, h]], { fill: w2 });
    else if (jenis === 2) l.path(`M ${-h} ${-h} L ${h} ${-h} A ${h * 2} ${h * 2} 0 0 1 ${-h} ${h} Z`, { fill: w2 });
    else l.rect(-h * 0.35, -h, h * 0.7, h * 2, { fill: w2 });
    l.pop(at, { dur: 14, from: 0 });
    // sebagian kecil tile berputar 90° sekali di tengah video
    if (R() < 0.15) {
      const t = at + 60 + Math.floor(R() * 60);
      l.key(t, { rotation: rot }, 'in-out-back').key(t + 20, { rotation: rot + 90 });
    }
  }
}

s.sfx('swoosh', { at: 0, dur: 1, volume: -14 });
p.sfx('pad', { at: 0, dur: 6, root: 196, chord: [0, 5, 7, 12], volume: -18 });

export default p;
