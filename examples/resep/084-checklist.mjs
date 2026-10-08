// 084 · Checklist dicentang satu per satu + progres
// kategori: edukasi
// fitur: kotak + centang draw · teks dicoret setelah centang (highlight strike) · counter "x/5 selesai" · bar progres per langkah
// pakai: to-do harian, checklist persiapan launching, SOP, daftar kebiasaan

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Checklist', preset: 'reels', fps: 30, background: '#f8f9fa' });
const W = p.width;

const s = p.scene('Checklist', { duration: '7s' });
const ITEM = ['Foto produk siap', 'Caption & hashtag ditulis', 'Harga & stok dicek', 'Auto-balas diaktifkan', 'Jadwal posting diatur'];
const PER = 30;
const MULAI = 20;

const judul = s.layer('Judul', { fixed: true });
judul.text('Sebelum launching', 100, 300, { size: 84, weight: 800, color: '#14161f' });
// counter: satu teks per angka, masing-masing tampil di rentang waktunya (show)
for (let n = 0; n <= ITEM.length; n++) {
  const dari = n === 0 ? 0 : MULAI + (n - 1) * PER;
  const sampai = n === ITEM.length ? null : MULAI + n * PER;
  judul.text(`${n}/${ITEM.length} selesai`, 100, 400, { size: 48, weight: 700, color: TEAL, show: [dari, sampai] });
}

// bar progres
const jalur = s.layer('Jalur');
jalur.rect(100, 480, W - 200, 16, { fill: '#e9ecef', r: 8 });
const isi = s.layer('Isi bar', { x: 100 });
isi.rect(0, 480, W - 200, 16, { fill: TEAL, r: 8 });
isi.key(0, { scaleX: 0 }, 'hold');
ITEM.forEach((_, i) => isi.key(MULAI + 8 + i * PER, { scaleX: (i + 1) / ITEM.length }, 'out-cubic').key(MULAI + 8 + i * PER - 6, { scaleX: i / ITEM.length }, 'out-cubic'));

ITEM.forEach((teks, i) => {
  const y = 660 + i * 190;
  const at = MULAI + i * PER;
  const l = s.layer(`Item ${i + 1}`, { x: 100, y });
  l.rect(0, -50, 100, 100, { fill: '#ffffff', stroke: '#adb5bd', strokeWidth: 6, r: 22 });
  l.text(teks, 140, 0, { size: 54, weight: 700, color: '#343a40', valign: 'middle', highlight: { words: teks.split(' '), style: 'strike', color: '#adb5bd', at: at + 10, dur: 8, width: 6 } });
  const centang = s.layer(`Centang ${i + 1}`, { x: 100, y });
  centang.rect(0, -50, 100, 100, { fill: TEAL, r: 22 });
  centang.polygon([[24, 0], [44, 22], [78, -20]], { closed: false, stroke: '#ffffff', strokeWidth: 12, draw: [at + 2, 6] });
  centang.pop(at, { dur: 10, from: 0.6 });
  s.sfx('click', { at, volume: -8 });
});
s.sfx('success', { at: MULAI + PER * ITEM.length, volume: -8 });

export default p;
