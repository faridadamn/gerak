// 078 · Tabel perbandingan fitur (✓ / ✗ digambar)
// kategori: edukasi
// fitur: grid baris × kolom dari data · ikon centang/silang dengan draw bertahap · kolom unggulan disorot · zebra baris
// pakai: membandingkan paket/harga/produk/tools, "kenapa pilih kami", A vs B fitur

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Tabel perbandingan', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const s = p.scene('Tabel', { duration: '7s' });

const KOLOM = ['Manual', 'Sistem'];
const BARIS = [
  ['Balas chat 24 jam', false, true],
  ['Catatan pesanan rapi', false, true],
  ['Bisa ditinggal libur', false, true],
  ['Butuh admin tambahan', true, false],
  ['Laporan otomatis', false, true],
];
const X_LABEL = 80;
const X_KOL = [660, 900];
const Y0 = 520;
const TINGGI = 170;

const t = s.layer('Tabel', { fixed: true });
t.text('Manual vs Sistem', W / 2, 300, { size: 84, weight: 800, color: '#14161f', align: 'center', anim: { type: 'words', effect: 'rise', stagger: 4 } });
// sorot kolom unggulan
t.rect(X_KOL[1] - 105, Y0 - 90, 210, TINGGI * BARIS.length + 120, { fill: '#e6fcf5', r: 30 });
KOLOM.forEach((k, i) => t.text(k, X_KOL[i], Y0 - 30, { size: 40, weight: 800, color: i ? TEAL : '#868e96', align: 'center', valign: 'middle' }));

BARIS.forEach(([label, a, b], i) => {
  const y = Y0 + 60 + i * TINGGI;
  const at = 16 + i * 16;
  const baris = s.layer(`Baris ${i + 1}`);
  if (i % 2 === 0) baris.rect(40, y - TINGGI / 2 + 10, W - 80, TINGGI - 20, { fill: 'rgba(0,0,0,0.025)', r: 20 });
  baris.text(label, X_LABEL, y, { size: 46, weight: 700, color: '#343a40', valign: 'middle', maxWidth: 480, anim: { type: 'lines', effect: 'slide', at, distance: 40 } });
  [a, b].forEach((ya, k) => {
    const ikon = s.layer(`Ikon ${i + 1}-${k + 1}`, { x: X_KOL[k], y });
    if (ya) ikon.polygon([[-28, 0], [-8, 22], [30, -22]], { closed: false, stroke: k ? TEAL : '#495057', strokeWidth: 12, draw: [at + 6 + k * 4, 8] });
    else {
      ikon.line(-22, -22, 22, 22, { stroke: '#fa5252', strokeWidth: 12, draw: [at + 6 + k * 4, 5] });
      ikon.line(22, -22, -22, 22, { stroke: '#fa5252', strokeWidth: 12, draw: [at + 10 + k * 4, 5] });
    }
  });
  s.sfx('tick', { at: at + 6, volume: -14 });
});

export default p;
