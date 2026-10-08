// 048 · Galeri semua transisi
// kategori: transisi
// fitur: 12 scene, tiap scene masuk dengan transisi berbeda (fade, dip, flash, wipe, slide, push, cover, iris, zoom, blur) + potongan kode-nya
// pakai: referensi memilih transisi; salin spesifikasi { type, duration } yang tertulis di layar

import { project } from 'gerak';

const p = project({ title: 'Galeri transisi', preset: 'reels', fps: 30, background: '#14161f' });
const W = p.width;

const daftar = [
  { type: 'cut' },
  { type: 'fade', duration: 12 },
  { type: 'dip', duration: 16, color: '#000000' },
  { type: 'flash', duration: 10 },
  { type: 'wipe-left', duration: 12 },
  { type: 'wipe-up', duration: 12 },
  { type: 'slide-left', duration: 12 },
  { type: 'push-up', duration: 12, ease: 'in-out-quart' },
  { type: 'cover-right', duration: 14 },
  { type: 'iris', duration: 16 },
  { type: 'zoom', duration: 14 },
  { type: 'blur', duration: 14 },
];
const WARNA = ['#2D3E8D', '#00B7B3', '#f76707', '#7048e8', '#e03131', '#2f9e44', '#1971c2', '#c2255c', '#5f3dc4', '#0b7285', '#e8590c', '#343a40'];

daftar.forEach((tr, i) => {
  const s = p.scene(tr.type, { duration: '1.4s', background: WARNA[i], transition: i === 0 ? undefined : tr });
  const l = s.layer('Label', { x: W / 2, y: 900 });
  l.text(String(i + 1).padStart(2, '0'), 0, -250, { size: 70, weight: 800, color: 'rgba(255,255,255,0.5)', align: 'center', valign: 'middle' });
  l.text(tr.type, 0, 0, { size: 150, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', fit: 960 });
  const kode = i === 0 ? "(tanpa transition)" : `transition: ${JSON.stringify(tr).replace(/"(\w+)":/g, '$1: ').replace(/"/g, "'").replace(/,/g, ', ')}`;
  l.text(kode, 0, 160, { size: 34, weight: 600, color: 'rgba(255,255,255,0.85)', align: 'center', valign: 'middle', maxWidth: 940 });
  s.sfx('swipe', { at: 0, volume: -16 });
});

export default p;
