// 075 · Resep minuman: bahan + langkah
// kategori: edukasi
// fitur: scene bahan (daftar dengan centang draw) → scene langkah (kartu bernomor) · image produk · transisi cover-up · tick sfx
// pakai: resep masakan/minuman, tutorial DIY, daftar alat & bahan, cara pakai produk

import { project } from 'gerak';

const BROWN = '#8d5524';
const p = project({ title: 'Resep es kopi', preset: 'reels', fps: 30, background: '#fff4e6' });
const W = p.width;

// ---- scene 1: bahan
const s1 = p.scene('Bahan', { duration: '5s' });
const foto = s1.layer('Foto', { x: 780, y: 520 });
foto.image('assets/produk.png', 0, 0, { width: 620, anchor: 'center' });
foto.float({ amp: 10, period: 2.5 });
const judul = s1.layer('Judul', { fixed: true });
judul.text('Es Kopi Susu\nala Kafe', 90, 260, { size: 92, weight: 800, color: BROWN, valign: 'top', lineHeight: 1.02, anim: { type: 'words', effect: 'rise', stagger: 4 } });
const bahan = ['2 shot espresso', '150 ml susu segar', '30 ml gula aren cair', 'Es batu secukupnya'];
bahan.forEach((b, i) => {
  const at = 24 + i * 16;
  const baris = s1.layer(`Bahan ${i + 1}`, { x: 100, y: 1000 + i * 130 });
  baris.rect(0, -40, 80, 80, { fill: '#ffffff', stroke: BROWN, strokeWidth: 6, r: 18 });
  baris.polygon([[18, 0], [34, 18], [62, -16]], { closed: false, stroke: '#2f9e44', strokeWidth: 10, draw: [at + 8, 6] });
  baris.text(b, 120, 0, { size: 54, weight: 700, color: '#3d2a1c', valign: 'middle' });
  baris.slideIn(at, { from: 'left', distance: 80, dur: 12 });
  s1.sfx('tick', { at: at + 8, volume: -10 });
});

// ---- scene 2: langkah
const s2 = p.scene('Langkah', { duration: '6s', background: '#ffe8cc', transition: { type: 'cover-up', duration: 14 } });
const t2 = s2.layer('Judul', { fixed: true });
t2.text('Cara bikin', 90, 260, { size: 84, weight: 800, color: BROWN });
const langkah = ['Larutkan gula aren dengan espresso.', 'Isi gelas dengan es batu sampai penuh.', 'Tuang susu dingin perlahan.', 'Siram campuran kopi di atasnya. Aduk saat diminum.'];
langkah.forEach((t, i) => {
  const at = 14 + i * 26;
  const kartu = s2.layer(`Langkah ${i + 1}`, { x: 90, y: 420 + i * 290 });
  kartu.rect(0, 0, W - 180, 240, { fill: '#ffffff', r: 32 });
  kartu.circle(90, 120, 54, { fill: BROWN });
  kartu.text(String(i + 1), 90, 120, { size: 60, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
  kartu.text(t, 180, 120, { size: 48, weight: 700, color: '#3d2a1c', valign: 'middle', maxWidth: W - 420, lineHeight: 1.2 });
  kartu.slideIn(at, { from: 'right', distance: 200, dur: 14 });
  s2.sfx('pop', { at, volume: -12 });
});

export default p;
