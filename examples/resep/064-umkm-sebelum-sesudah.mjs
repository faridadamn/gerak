// 064 · Perbandingan angka sebelum vs sesudah (2 kolom)
// kategori: konten
// fitur: tabel 2 kolom dari data · count di kedua kolom · panah naik muncul · kolom "sesudah" disorot · fit lebar teks
// pakai: studi kasus klien, hasil program/kelas, before-after bisnis dengan angka

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'UMKM sebelum sesudah', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const s = p.scene('Perbandingan', { duration: '6s' });

const judul = s.layer('Judul', { fixed: true });
judul.text('Toko Kue Bu Rina', W / 2, 260, { size: 76, weight: 800, color: '#14161f', align: 'center', anim: { type: 'words', effect: 'rise', stagger: 3 } });
judul.text('3 bulan setelah pakai sistem', W / 2, 340, { size: 44, weight: 500, color: '#868e96', align: 'center', anim: { type: 'lines', effect: 'fade', at: 10 } });

// header kolom
const KX = [330, 780]; // tengah kolom sebelum / sesudah
const kolom = s.layer('Kolom');
kolom.rect(KX[1] - 220, 430, 440, 1180, { fill: '#e6fcf5', r: 40 });
kolom.text('Sebelum', KX[0], 510, { size: 46, weight: 700, color: '#868e96', align: 'center' });
kolom.text('Sesudah', KX[1], 510, { size: 46, weight: 800, color: TEAL, align: 'center' });
kolom.slideIn(6, { from: 'bottom', distance: 60 });

const metrik = [
  { label: 'Pesanan / minggu', a: 18, b: 64 },
  { label: 'Waktu balas chat', a: 47, b: 2, suffix: ' mnt' },
  { label: 'Omzet / bulan (juta)', a: 6.5, b: 21.8, decimals: 1 },
];
metrik.forEach((m, i) => {
  const y = 720 + i * 300;
  const at = 20 + i * 20;
  const l = s.layer(`Baris ${i + 1}`, { fixed: true });
  l.text(m.label, W / 2, y - 90, { size: 38, weight: 600, color: '#495057', align: 'center', anim: { type: 'lines', effect: 'fade', at } });
  const opsi = { decimals: m.decimals ?? 0, suffix: m.suffix ?? '' };
  l.text('0', KX[0], y, { size: 80, weight: 800, color: '#adb5bd', align: 'center', valign: 'middle', fit: 300, anim: { type: 'count', from: 0, to: m.a, at, dur: 30, ...opsi } });
  l.text('0', KX[1], y, { size: 100, weight: 800, color: '#0b7285', align: 'center', valign: 'middle', fit: 340, anim: { type: 'count', from: 0, to: m.b, at: at + 10, dur: 40, ease: 'out-expo', ...opsi } });
  const panah = s.layer(`Panah ${i + 1}`, { x: W / 2 + 10, y });
  panah.arrow(-50, 0, 40, 0, { stroke: TEAL, strokeWidth: 10, head: 22, draw: [at + 8, 8] });
  if (i < metrik.length - 1) kolom.line(120, y + 150, W - 120, y + 150, { stroke: '#f1f3f5', strokeWidth: 4 });
  s.sfx('coin', { at: at + 50, volume: -14 });
});

export default p;
