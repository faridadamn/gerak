// 065 · Template kartu testimoni (isi dengan testimoni ASLI)
// kategori: konten
// fitur: image avatar radius bulat · bintang pop berurutan · teks kutipan typewriter · konstanta data di atas file untuk diganti
// pakai: social proof — WAJIB pakai kutipan, nama, dan izin dari pelanggan sungguhan

import { project } from 'gerak';

// === GANTI DENGAN DATA ASLI (dengan izin pelanggan) ===
const DATA = {
  nama: 'Nama Pelanggan',
  info: 'Kota · jenis usaha',
  bintang: 5,
  kutipan: 'Tulis ulasan asli pelanggan di sini, apa adanya, sesuai yang mereka kirim.',
  foto: 'assets/avatar.png',
};

const p = project({ title: 'Testimoni template', preset: 'reels', fps: 30, background: { type: 'linear', angle: 150, stops: [[0, '#e7f5ff'], [1, '#f3f0ff']] } });
const W = p.width;

const s = p.scene('Testimoni', { duration: '6s' });

const kartu = s.layer('Kartu', { x: W / 2, y: 960 });
kartu.rect(-430, -520, 860, 1040, { fill: '#ffffff', r: 48, shadow: { color: 'rgba(45,62,141,0.15)', blur: 50, y: 20 } });
kartu.image(DATA.foto, 0, -340, { width: 220, height: 220, radius: 110, anchor: 'center', stroke: '#00B7B3', strokeWidth: 8 });
kartu.text(DATA.nama, 0, -170, { size: 60, weight: 800, color: '#14161f', align: 'center', valign: 'middle' });
kartu.text(DATA.info, 0, -105, { size: 38, weight: 500, color: '#868e96', align: 'center', valign: 'middle' });
kartu.pop(0, { dur: 16, from: 0.85 });

// bintang muncul satu-satu
for (let i = 0; i < 5; i++) {
  const b = s.layer(`Bintang ${i + 1}`, { x: W / 2 - 200 + i * 100, y: 960 - 10 });
  b.star(0, 0, 40, 17, 5, { fill: i < DATA.bintang ? '#fab005' : '#e9ecef' });
  b.pop(16 + i * 5, { dur: 12 });
  s.sfx('pop', { at: 16 + i * 5, volume: -14, pitch: 600 + i * 80 });
}

// kutipan diketik
const kutip = s.layer('Kutipan', { fixed: true });
kutip.text('“', W / 2 - 360, 1120, { size: 160, weight: 800, color: '#00B7B3', valign: 'middle' });
kutip.text(DATA.kutipan, W / 2, 1150, { size: 50, weight: 600, color: '#343a40', align: 'center', valign: 'top', maxWidth: 700, lineHeight: 1.35, anim: { type: 'typewriter', at: 46, cps: 28, cursor: false } });

s.sfx('typing', { at: 46, dur: DATA.kutipan.length / 28, volume: -14 });

export default p;
