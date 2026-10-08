// 002 · Mesin ketik di kartu catatan
// kategori: teks
// fitur: text anim typewriter (cps + kursor) · rect r + shadow · pop kartu · sfx typing sepanjang ketikan
// pakai: konten "catatan/insight" yang diketik pelan, video storytelling, thread jadi video

import { project } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Typewriter catatan', preset: 'reels', fps: 30, background: '#efe9dc' });
const W = p.width;

const s = p.scene('Catatan', { duration: '7.5s' });

// 1) kartu putih di tengah. Gambar di sekitar (0,0) lalu taruh layer di tengah layar
//    → pop() membesar dari tengah kartu.
const kartu = s.layer('Kartu', { x: W / 2, y: 960 });
kartu.rect(-430, -470, 860, 940, { fill: '#ffffff', r: 40, shadow: { color: 'rgba(0,0,0,0.12)', blur: 40, y: 16 } });
kartu.rect(-430, -470, 860, 110, { fill: '#2D3E8D', r: [40, 40, 0, 0] });
for (let i = 0; i < 3; i++) kartu.circle(-370 + i * 44, -415, 13, { fill: 'rgba(255,255,255,0.6)' });
kartu.text('catatan.txt', 360, -402, { size: 36, weight: 600, color: '#ffffff', align: 'right' });
kartu.pop(0, { dur: 14, from: 0.8 });

// 2) teks diketik: cps = karakter per detik. Kursor berkedip saat selesai.
const isi = 'Hal yang gw pelajari setelah 1 tahun jualan online:\n\n1. Konsisten > viral\n2. Sistem > semangat\n3. Data > feeling';
const CPS = 20;
const mulai = 14; // frame
const teks = s.layer('Teks', { x: W / 2, y: 960 });
teks.text(isi, -370, -300, {
  size: 56,
  weight: 600,
  color: INK,
  valign: 'top',
  maxWidth: 740,
  lineHeight: 1.3,
  anim: { type: 'typewriter', at: mulai, cps: CPS, cursor: '#00B7B3' },
});

// 3) suara ketik selama teks diketik: durasi = jumlah huruf / cps
s.sfx('typing', { at: mulai, dur: isi.replace(/\n/g, '').length / CPS, volume: -8 });
s.sfx('ding', { at: '6.4s', volume: -12, pitch: 1175 });

export default p;
