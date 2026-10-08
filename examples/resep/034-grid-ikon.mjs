// 034 · Grid ikon muncul acak (square)
// kategori: grafis
// fitur: preset square · rng (acak tapi deterministik) untuk urutan · pop stagger · ikon vektor dari path · hover float
// pakai: daftar fitur aplikasi, isi paket bundling, layanan, kategori produk

import { project, rng } from 'gerak';

const TEAL = '#00B7B3';
const BLUE = '#2D3E8D';
const p = project({ title: 'Grid ikon', preset: 'square', fps: 30, background: '#eef2fb' });
const W = p.width;

const s = p.scene('Grid', { duration: '4.5s' });

// ikon sederhana digambar di sekitar (0,0), ukuran ±60
const ikon = {
  chat: (l, c) => { l.rect(-60, -50, 120, 80, { fill: c, r: 22 }); l.polygon([[-30, 28], [-46, 60], [0, 30]], { fill: c }); },
  bintang: (l, c) => l.star(0, 0, 64, 28, 5, { fill: c }),
  hati: (l, c) => l.path('M 0 50 C -60 10 -70 -30 -40 -50 C -20 -62 0 -50 0 -30 C 0 -50 20 -62 40 -50 C 70 -30 60 10 0 50 Z', { fill: c }),
  petir: (l, c) => l.polygon([[10, -64], [-40, 8], [-4, 8], [-14, 64], [40, -10], [4, -10]], { fill: c }),
  centang: (l, c) => l.polygon([[-44, 0], [-12, 32], [46, -30]], { closed: false, stroke: c, strokeWidth: 20 }),
  jam: (l, c) => { l.circle(0, 0, 58, { fill: 'none', stroke: c, strokeWidth: 12 }); l.polygon([[0, -32], [0, 0], [26, 14]], { closed: false, stroke: c, strokeWidth: 12 }); },
  grafik: (l, c) => { for (let i = 0; i < 3; i++) l.rect(-50 + i * 38, 40 - (i + 1) * 30, 26, (i + 1) * 30, { fill: c, r: 6 }); },
  kunci: (l, c) => { l.rect(-44, -6, 88, 64, { fill: c, r: 12 }); l.arc(0, -10, 30, 180, 360, { stroke: c, strokeWidth: 14 }); },
  roket: (l, c) => { l.path('M 0 -64 C 30 -40 34 10 22 40 L -22 40 C -34 10 -30 -40 0 -64 Z', { fill: c }); l.circle(0, -14, 12, { fill: '#ffffff' }); l.polygon([[-22, 20], [-44, 50], [-20, 40]], { fill: c }); l.polygon([[22, 20], [44, 50], [20, 40]], { fill: c }); },
};
const nama = Object.keys(ikon);
const label = ['Auto chat', 'Ulasan', 'Loyalitas', 'Cepat', 'Checklist', 'Jadwal', 'Laporan', 'Aman', 'Growth'];

// urutan acak tapi selalu sama (seed tetap)
const acak = rng('urutan-grid');
const urutan = nama.map((_, i) => i).sort(() => acak() - 0.5);

const UK = 260;
const GAP = 30;
const X0 = W / 2 - UK - GAP;
const Y0 = W / 2 - UK - GAP; // grid 3×3 tepat di tengah kanvas
nama.forEach((n, i) => {
  const col = i % 3;
  const row = Math.floor(i / 3);
  const at = 6 + urutan.indexOf(i) * 4;
  const tile = s.layer(`Tile ${n}`, { x: X0 + col * (UK + GAP), y: Y0 + row * (UK + GAP) });
  tile.rect(-UK / 2, -UK / 2, UK, UK, { fill: '#ffffff', r: 40, shadow: { color: 'rgba(45,62,141,0.10)', blur: 24, y: 10 } });
  const g = tile.group(`Ikon ${n}`, { y: -26 });
  ikon[n](g.layer(`gambar ${n}`), i % 2 ? TEAL : BLUE);
  tile.text(label[i], 0, 92, { size: 34, weight: 700, color: '#3a4256', align: 'center', valign: 'middle' });
  tile.pop(at, { dur: 14, from: 0.3 });
  g.float({ amp: 6, period: 1.6 + (i % 3) * 0.3, from: at + 14 });
  s.sfx('bubble', { at, volume: -14, pitch: 360 + urutan.indexOf(i) * 30 });
});

export default p;
