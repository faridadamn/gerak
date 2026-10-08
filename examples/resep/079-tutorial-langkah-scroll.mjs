// 079 · Tutorial 5 langkah dengan kamera scroll vertikal
// kategori: edukasi
// fitur: konten lebih tinggi dari layar · camera.key y mengikuti langkah aktif · garis penghubung draw · langkah aktif disorot (pulse)
// pakai: tutorial step-by-step panjang, cara setting aplikasi, alur pendaftaran, SOP

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Tutorial scroll', preset: 'reels', fps: 30, background: '#f8f9fa' });
const W = p.width;
const H = p.height;

const s = p.scene('Tutorial', { duration: '10s' });

const LANGKAH = [
  ['Buka pengaturan toko', 'Masuk ke menu Akun → Pengaturan.'],
  ['Aktifkan auto-balas', 'Geser tombol "Balasan otomatis" ke kanan.'],
  ['Tulis pesan sapaan', 'Halo kak! Mau tanya produk yang mana?'],
  ['Tambah katalog cepat', 'Pilih 5 produk terlaris untuk dikirim otomatis.'],
  ['Simpan & tes', 'Kirim chat dari nomor lain untuk mencoba.'],
];
const JARAK = 520;
const Y0 = 520;
const PER = 54; // frame per langkah

// garis penghubung vertikal, digambar sepanjang tutorial
const garis = s.layer('Garis');
garis.line(170, Y0, 170, Y0 + JARAK * (LANGKAH.length - 1), { stroke: '#ced4da', strokeWidth: 10, draw: [0, PER * (LANGKAH.length - 1), 'linear'] });

LANGKAH.forEach(([judul, isi], i) => {
  const y = Y0 + i * JARAK;
  const at = i * PER;
  const titik = s.layer(`Nomor ${i + 1}`, { x: 170, y });
  titik.circle(0, 0, 66, { fill: TEAL, stroke: '#ffffff', strokeWidth: 10 });
  titik.text(String(i + 1), 0, 0, { size: 64, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
  titik.pop(at, { dur: 12 });
  titik.pulse({ amount: 0.06, period: 0.8, from: at + 12, to: at + PER, ramp: 6 });
  const kartu = s.layer(`Kartu ${i + 1}`, { x: 280, y });
  kartu.rect(0, -150, W - 340, 300, { fill: '#ffffff', r: 32, shadow: { color: 'rgba(0,0,0,0.06)', blur: 24, y: 8 } });
  kartu.text(judul, 50, -50, { size: 54, weight: 800, color: '#14161f', valign: 'middle', maxWidth: W - 440 });
  kartu.text(isi, 50, 40, { size: 40, weight: 500, color: '#6c757d', valign: 'top', maxWidth: W - 440, lineHeight: 1.3 });
  kartu.slideIn(at + 4, { from: 'right', distance: 120, dur: 14 });
  // kamera: pusatkan langkah ke-i di layar
  s.camera.key(at, { y: y - H / 2 + 100 }, 'in-out-cubic');
  s.sfx('pop', { at, volume: -12, pitch: 500 + i * 50 });
});
s.camera.key(PER * LANGKAH.length + 20, { y: Y0 + JARAK * 2 - H / 2 + 100, zoom: 0.62 }, 'in-out-cubic'); // akhir: zoom out lihat semua

const judul = s.layer('Judul', { fixed: true });
judul.rect(0, 0, W, 200, { fill: '#f8f9fa' });
judul.text('Setting auto-balas (5 langkah)', W / 2, 130, { size: 52, weight: 800, color: '#2D3E8D', align: 'center', valign: 'middle' });

export default p;
