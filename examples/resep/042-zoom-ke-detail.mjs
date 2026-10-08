// 042 · Kamera zoom ke detail UI satu per satu
// kategori: kamera
// fitur: rumus kamera memusatkan titik (x = px − W/2, y = py − H/2) · zoom bertahap · caption fixed bergantian (show) · mockup aplikasi dari bentuk
// pakai: demo fitur aplikasi/dashboard, menunjuk bagian penting layar, review produk digital

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'Zoom ke detail', preset: 'reels', fps: 30, background: '#e9edf6' });
const W = p.width;
const H = p.height;

const s = p.scene('Demo', { duration: '9s' });

// 1) mockup HP + isi aplikasi (layer di 0,0 → koordinat layar)
const ui = s.layer('Mockup');
ui.rect(190, 300, 700, 1320, { fill: '#14161f', r: 80 });
ui.rect(215, 325, 650, 1270, { fill: '#ffffff', r: 60 });
// bagian A: kartu omzet
ui.rect(250, 400, 580, 260, { fill: BLUE, r: 32 });
ui.text('Omzet hari ini', 290, 470, { size: 34, weight: 600, color: '#c5d0ff' });
ui.text('Rp3.450.000', 290, 570, { size: 72, weight: 800, color: '#ffffff' });
// bagian B: grafik kecil
ui.rect(250, 700, 580, 360, { fill: '#f3f5fa', r: 32 });
[120, 170, 140, 230, 200, 290].forEach((h, i) => ui.rect(300 + i * 85, 1010 - h, 52, h, { fill: i === 5 ? TEAL : '#c5cbe0', r: 12 }));
// bagian C: daftar pesanan
['Pesanan #1042 · Lunas', 'Pesanan #1041 · Dikirim', 'Pesanan #1040 · Lunas'].forEach((t, i) => {
  ui.rect(250, 1100 + i * 140, 580, 112, { fill: '#f3f5fa', r: 24 });
  ui.circle(310, 1156 + i * 140, 26, { fill: i === 1 ? '#ffa94d' : TEAL });
  ui.text(t, 360, 1156 + i * 140, { size: 36, weight: 600, color: '#3a4256', valign: 'middle' });
});

// 2) titik fokus + caption untuk tiap bagian
const fokus = [
  { x: 540, y: 530, zoom: 1.7, at: 30, teks: 'Omzet langsung kelihatan' },
  { x: 540, y: 880, zoom: 1.7, at: 110, teks: 'Grafik 6 hari terakhir' },
  { x: 540, y: 1240, zoom: 1.6, at: 190, teks: 'Status pesanan otomatis' },
];
s.camera.key(0, { x: 0, y: 0, zoom: 0.95 }, 'in-out-cubic');
const cap = s.layer('Caption', { fixed: true });
fokus.forEach((f, i) => {
  // pusatkan titik (f.x, f.y) di layar
  s.camera.key(f.at, { x: f.x - W / 2, y: f.y - H / 2, zoom: f.zoom }, 'in-out-cubic');
  s.camera.key(f.at + 60, { x: f.x - W / 2, y: f.y - H / 2, zoom: f.zoom }, 'in-out-cubic');
  cap.text(f.teks, W / 2, 1720, { size: 60, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', box: { color: '#14161f', padX: 30, padY: 16, radius: 24 }, show: [f.at, f.at + 70], anim: { type: 'words', effect: 'rise', at: f.at, stagger: 3 } });
  s.sfx('whoosh', { at: f.at - 14, dur: 0.6, volume: -14 });
});
s.camera.key(260, { x: 0, y: 0, zoom: 0.95 });

export default p;
