// 044 · Gaya dokumenter: kamera handheld + REC + lower third
// kategori: kamera
// fitur: camera.handheld (goyang tangan) · grain animasi · titik REC blink · timecode count · lower third slideIn/slideOut
// pakai: konten "behind the scene", testimoni gaya dokumenter, vlog bisnis, liputan

import { project } from 'gerak';

const p = project({ title: 'Handheld dokumenter', preset: 'reels', fps: 30, background: '#000' });
p.effects({ grain: { amount: 0.12, animate: true, every: 1 }, vignette: 0.4 });
const W = p.width;
const H = p.height;

const s = p.scene('Dokumenter', { duration: '6s' });

// 1) "rekaman": foto penuh, sedikit lebih besar supaya goyangan tidak memperlihatkan tepi
const rekaman = s.layer('Rekaman', { filter: 'saturate(0.8) contrast(1.1)' });
rekaman.image('assets/pemandangan.jpg', -60, -60, { width: W + 120, height: H + 120, fit: 'cover', focus: [0.55, 0.5] });
s.camera.handheld({ amp: 10, freq: 0.7, rot: 0.6 });

// 2) HUD kamera (fixed, tidak ikut goyang)
const hud = s.layer('HUD', { fixed: true });
hud.circle(110, 150, 16, { fill: '#ff3b30' });
hud.text('REC', 140, 150, { size: 40, weight: 800, color: '#ffffff', valign: 'middle' });
const rec = s.layer('REC kedip', { fixed: true });
rec.circle(110, 150, 16, { fill: '#000000', opacity: 0.6 });
rec.blink({ period: 1, duty: 0.5 });
hud.text('00:00:12', W - 90, 150, { size: 40, weight: 600, color: '#ffffff', align: 'right', valign: 'middle' });
// sudut bingkai
for (const [x, y, dx, dy] of [[60, 220, 1, 1], [W - 60, 220, -1, 1], [60, H - 300, 1, -1], [W - 60, H - 300, -1, -1]]) {
  hud.polygon([[x, y + dy * 70], [x, y], [x + dx * 70, y]], { closed: false, stroke: 'rgba(255,255,255,0.8)', strokeWidth: 6 });
}

// 3) lower third: nama + keterangan (contoh, ganti dengan narasumber asli)
const lt = s.layer('Lower third', { fixed: true, x: 80, y: 1360 });
lt.rect(0, 0, 14, 170, { fill: '#00B7B3' });
lt.rect(14, 0, 720, 100, { fill: 'rgba(0,0,0,0.65)' });
lt.text('Nama Narasumber', 44, 52, { size: 54, weight: 800, color: '#ffffff', valign: 'middle' });
lt.rect(14, 100, 560, 70, { fill: '#00B7B3' });
lt.text('pemilik usaha · 6 tahun berjualan', 44, 136, { size: 36, weight: 600, color: '#04302f', valign: 'middle' });
lt.slideIn(20, { from: 'left', distance: 140, dur: 16 }).slideOut('5.2s', { to: 'left', distance: 140, dur: 12 });

p.sfx('pad', { at: 0, dur: 6, root: 130.8, chord: [0, 7, 10, 15], brightness: 700, volume: -18 });

export default p;
