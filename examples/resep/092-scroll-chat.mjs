// 092 · Percakapan chat dengan auto-scroll
// kategori: lanjut
// fitur: pola clip + scroll: clip di group induk yang DIAM, isi di group anak yang DIGESER (key y) · tinggi bubble dihitung · bubble pop berurutan
// pakai: simulasi chat WhatsApp/DM, demo chatbot, cerita lewat percakapan, testimoni chat (pakai yang asli)

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Scroll chat', preset: 'reels', fps: 30, background: '#dfe7ee' });
const W = p.width;

const s = p.scene('Chat', { duration: '9s' });

// layar chat: area terlihat y 260..1660
const ATAS = 260;
const TINGGI_LAYAR = 1400;
const header = s.layer('Header', { fixed: true });
header.rect(0, 0, W, ATAS, { fill: '#075e54' });
header.circle(120, 170, 50, { fill: '#ffffff' });
header.text('Toko Kopi Senja', 200, 150, { size: 50, weight: 800, color: '#ffffff', valign: 'middle' });
header.text('online', 200, 205, { size: 34, weight: 500, color: '#c3fae8', valign: 'middle' });

const PESAN = [
  { dari: 'pembeli', teks: 'Kak, kopi susu aren masih ada?' },
  { dari: 'toko', teks: 'Masih kak! Mau ukuran 250 ml atau 1 liter?' },
  { dari: 'pembeli', teks: '1 liter, kirim ke Bandung bisa?' },
  { dari: 'toko', teks: 'Bisa kak. Ongkir Rp12.000, sampai besok.' },
  { dari: 'pembeli', teks: 'Oke kak, saya transfer sekarang ya' },
  { dari: 'toko', teks: 'Siap, sudah kami terima. Pesanan langsung diproses.' },
  { dari: 'pembeli', teks: 'Cepet banget balasnya kak, mantap' },
  { dari: 'toko', teks: 'Terima kasih kak! Ditunggu order berikutnya.' },
];

// induk diam dengan clip, anak berisi bubble yang digeser ke atas
const layar = s.group('Layar', { clip: { rect: [0, ATAS, W, TINGGI_LAYAR] } });
const isi = layar.group('Isi chat');

let y = ATAS + 50;
const JEDA = 28;
PESAN.forEach((m, i) => {
  const at = 10 + i * JEDA;
  const kanan = m.dari === 'toko';
  const baris = Math.ceil(m.teks.length / 26); // perkiraan jumlah baris (26 huruf/baris)
  const tinggi = baris * 58 + 50;
  const l = isi.layer(`Pesan ${i + 1}`, { x: kanan ? W - 60 : 60, y });
  l.text(m.teks, kanan ? -30 : 30, 30, { size: 44, weight: 500, color: '#111b21', align: kanan ? 'right' : 'left', valign: 'top', maxWidth: 640, lineHeight: 1.3, box: { color: kanan ? '#d9fdd3' : '#ffffff', padX: 30, padY: 18, radius: 26, mode: 'block' } });
  l.pop(at, { dur: 10, from: 0.7 });
  s.sfx(kanan ? 'pop' : 'notify', { at, volume: -14 });
  y += tinggi + 40;
  // kalau bubble terbawah melewati batas layar, geser isi ke atas sejauh kelebihannya
  const lebih = y - (ATAS + TINGGI_LAYAR - 40);
  if (lebih > 0) isi.move(at, { y: -lebih }, { dur: 12, ease: 'out-cubic' });
});

// kolom ketik di bawah (dekor)
const status = s.layer('Status', { fixed: true });
status.rect(0, ATAS + TINGGI_LAYAR, W, 260, { fill: '#f0f2f5' });
status.rect(50, ATAS + TINGGI_LAYAR + 50, W - 220, 110, { fill: '#ffffff', r: 55 });
status.text('Ketik pesan', 100, ATAS + TINGGI_LAYAR + 105, { size: 40, color: '#8696a0', valign: 'middle' });
status.circle(W - 100, ATAS + TINGGI_LAYAR + 105, 55, { fill: TEAL });

export default p;
