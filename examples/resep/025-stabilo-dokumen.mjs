// 025 · Stabilo di atas dokumen
// kategori: brush
// fitur: brush highlighter (transparan + multiply) digoreskan di atas teks · kamera zoom ke paragraf · kertas dengan shadow
// pakai: membedah dokumen/artikel/kontrak, menunjukkan kalimat penting, review bacaan

import { project } from 'gerak';

const p = project({ title: 'Stabilo dokumen', preset: 'reels', fps: 30, background: '#d9dee8' });
const W = p.width;

const s = p.scene('Dokumen', { duration: '6s' });

// 1) kertas + teks (layer di 0,0 → koordinat layar)
const kertas = s.layer('Kertas');
kertas.rect(110, 280, 860, 1360, { fill: '#ffffff', r: 10, shadow: { color: 'rgba(0,0,0,0.15)', blur: 30, y: 12 } });
kertas.text('Catatan rapat tim', 180, 400, { size: 54, weight: 800, color: '#1d2433' });
const kalimat = [
  'Penjualan naik 18% bulan ini.',
  'Tapi 40% chat tidak terbalas',
  'di luar jam kerja.',
  'Usulan: pasang auto-balas',
  'dan katalog otomatis.',
  'Target: semua chat dibalas',
  'di bawah 5 menit.',
];
kalimat.forEach((t, i) => kertas.text(t, 180, 540 + i * 110, { size: 48, weight: 500, color: '#3a4256' }));

// 2) stabilo: goresan highlighter di baris tertentu (berurutan)
//    highlighter sudah memakai blend multiply → teks tetap terbaca
const stabilo = s.layer('Stabilo');
const sapuan = [
  { baris: 1, x1: 175, x2: 840, warna: '#ffd43b', at: 30 },
  { baris: 3, x1: 175, x2: 800, warna: '#8ce99a', at: 60 },
  { baris: 5, x1: 175, x2: 830, warna: '#74c0fc', at: 90 },
  { baris: 6, x1: 175, x2: 520, warna: '#74c0fc', at: 104 },
];
for (const sp of sapuan) {
  const y = 540 + sp.baris * 110 - 16;
  stabilo.stroke([[sp.x1, y + 3, 0.9], [(sp.x1 + sp.x2) / 2, y - 2, 1], [sp.x2, y + 2, 0.9]], { brush: 'highlighter', size: 56, color: sp.warna, reveal: [sp.at, 12, 'in-out-sine'] });
  s.sfx('swipe', { at: sp.at, volume: -14 });
}

// 3) kamera mendekat ke paragraf yang di-stabilo
s.camera.key(0, { zoom: 1 }, 'in-out-cubic').key(40, { zoom: 1.25, y: 120 }).key(140, { zoom: 1.25, y: 220 }, 'in-out-cubic').key(175, { zoom: 1, y: 0 });

export default p;
