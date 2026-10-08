// 082 · Timeline vertikal zig-zag
// kategori: edukasi
// fitur: garis tengah tumbuh (scaleY dari atas) · kartu kiri/kanan bergantian (slideIn dari sisi) · titik tahun pop · data array
// pakai: perjalanan bisnis/karier, sejarah produk, milestone tahunan, "dari 0 sampai sekarang"

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Timeline vertikal', preset: 'reels', fps: 30, background: '#0f1424' });
const W = p.width;

const s = p.scene('Timeline', { duration: '8s' });

// contoh data — ganti dengan perjalanan sendiri
const ACARA = [
  { tahun: '2021', teks: 'Jualan pertama dari rumah' },
  { tahun: '2022', teks: '100 pelanggan tetap' },
  { tahun: '2023', teks: 'Mulai pakai sistem pesanan' },
  { tahun: '2024', teks: 'Buka reseller di 5 kota' },
  { tahun: '2025', teks: 'Semua chat dibalas otomatis' },
];
const Y0 = 420;
const JARAK = 270;
const PER = 30;

const judul = s.layer('Judul', { fixed: true });
judul.text('Perjalanan 5 tahun', W / 2, 260, { size: 76, weight: 800, color: '#ffffff', align: 'center', anim: { type: 'words', effect: 'rise', stagger: 3 } });

// garis tengah tumbuh dari atas ke bawah (origin layer di ujung atas)
const garis = s.layer('Garis', { x: W / 2, y: Y0 });
garis.rect(-5, 0, 10, JARAK * (ACARA.length - 1), { fill: '#343a52', r: 5 });
garis.key(0, { scaleY: 0 }, 'linear').key(PER * (ACARA.length - 1) + 10, { scaleY: 1 });

ACARA.forEach((a, i) => {
  const y = Y0 + i * JARAK;
  const at = 10 + i * PER;
  const kiri = i % 2 === 0;
  const titik = s.layer(`Titik ${a.tahun}`, { x: W / 2, y });
  titik.circle(0, 0, 26, { fill: i === ACARA.length - 1 ? '#FFD43B' : TEAL, stroke: '#0f1424', strokeWidth: 8 });
  titik.pop(at, { dur: 10 });
  const kartu = s.layer(`Kartu ${a.tahun}`, { x: kiri ? W / 2 - 60 : W / 2 + 60, y });
  const ax = kiri ? 'right' : 'left';
  kartu.text(a.tahun, 0, -40, { size: 64, weight: 800, color: i === ACARA.length - 1 ? '#FFD43B' : TEAL, align: ax, valign: 'middle' });
  kartu.text(a.teks, 0, 30, { size: 40, weight: 600, color: '#ced4da', align: ax, valign: 'top', maxWidth: 400, lineHeight: 1.2 });
  kartu.slideIn(at + 3, { from: kiri ? 'left' : 'right', distance: 80, dur: 12 });
  s.sfx('pop', { at, volume: -12, pitch: 420 + i * 60 });
});

export default p;
