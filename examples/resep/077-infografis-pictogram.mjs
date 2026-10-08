// 077 · Infografis pictogram "7 dari 10"
// kategori: data
// fitur: ikon orang dari bentuk diulang dalam grid · ikon terisi muncul bertahap (stagger) · count angka besar · sumber data kecil
// pakai: statistik survei, proporsi populasi, fakta angka yang mudah dicerna

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Pictogram', preset: 'reels', fps: 30, background: '#14161f' });
const W = p.width;

const s = p.scene('Pictogram', { duration: '6s' });
const JUMLAH = 10;
const AKTIF = 7;

const teks = s.layer('Teks', { fixed: true });
teks.text('0', W / 2, 470, { size: 260, weight: 800, color: TEAL, align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: AKTIF, at: 20, dur: AKTIF * 6, ease: 'linear', suffix: ' dari 10' }, fit: 940 });
teks.text('pembeli memilih toko\nyang membalas chat paling cepat', W / 2, 700, { size: 54, weight: 600, color: '#dee2e6', align: 'center', valign: 'top', lineHeight: 1.25, anim: { type: 'lines', effect: 'fade', at: 8, stagger: 8 } });

// ikon orang (kepala + badan) di sekitar (0,0)
const orang = (l, warna) => {
  l.circle(0, -70, 36, { fill: warna });
  l.path('M -56 70 L -56 0 C -56 -30 -30 -24 0 -24 C 30 -24 56 -30 56 0 L 56 70 Z', { fill: warna });
};
for (let i = 0; i < JUMLAH; i++) {
  const col = i % 5;
  const row = Math.floor(i / 5);
  const x = W / 2 - 2 * 170 + col * 170;
  const y = 1150 + row * 240;
  // dasar abu-abu
  orang(s.layer(`Dasar ${i + 1}`, { x, y }), '#343a40');
  // versi terisi muncul untuk 7 pertama
  if (i < AKTIF) {
    const isi = s.layer(`Isi ${i + 1}`, { x, y });
    orang(isi, TEAL);
    isi.pop(20 + i * 6, { dur: 10, from: 0.5 });
    s.sfx('bubble', { at: 20 + i * 6, volume: -16, pitch: 380 + i * 30 });
  }
}

teks.text('*contoh data — ganti dengan sumber riset asli', W / 2, 1720, { size: 30, weight: 500, color: '#6c757d', align: 'center' });

export default p;
