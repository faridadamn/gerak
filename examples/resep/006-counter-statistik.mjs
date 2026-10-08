// 006 · Kartu statistik dengan angka berjalan
// kategori: teks
// fitur: text anim count (prefix Rp, decimals, suffix, separator) · fit lebar · slideIn bertahap · sfx coin
// pakai: pamer hasil/omzet/pencapaian, laporan bulanan, social proof angka

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'Counter statistik', preset: 'reels', fps: 30, background: '#f5f7fb' });
const W = p.width;

const s = p.scene('Statistik', { duration: '5s' });

const judul = s.layer('Judul', { fixed: true });
judul.text('Rekap Oktober', 120, 330, { size: 92, weight: 800, color: BLUE, anim: { type: 'chars', effect: 'rise', at: 0, stagger: 1, dur: 10 } });

// data kartu: label + opsi animasi count
const data = [
  { label: 'Omzet', count: { from: 0, to: 48750000, prefix: 'Rp' } },
  { label: 'Pelanggan baru', count: { from: 0, to: 1284 } },
  { label: 'Rating toko', count: { from: 0, to: 4.9, decimals: 1, suffix: ' / 5' } },
];

data.forEach((d, i) => {
  const y = 620 + i * 360;
  const at = 12 + i * 10; // muncul bertahap
  const kartu = s.layer(`Kartu ${i + 1}`, { x: W / 2, y });
  kartu.rect(-440, -150, 880, 300, { fill: '#ffffff', r: 36, shadow: { color: 'rgba(45,62,141,0.12)', blur: 30, y: 12 } });
  kartu.rect(-440, -150, 18, 300, { fill: i === 1 ? TEAL : BLUE, r: [36, 0, 0, 36] });
  kartu.text(d.label, -380, -60, { size: 44, weight: 600, color: '#6b7186' });
  kartu.text('0', -380, 70, {
    size: 110,
    weight: 800,
    color: '#14161f',
    fit: 780, // kecilkan otomatis kalau angkanya kepanjangan
    anim: { type: 'count', at: at + 6, dur: 45, ease: 'out-expo', ...d.count },
  });
  kartu.slideIn(at, { from: 'right', distance: 300, dur: 16, ease: 'out-cubic' });
  s.sfx('swipe', { at, volume: -14 });
  s.sfx('coin', { at: at + 51, volume: -12 });
});

export default p;
