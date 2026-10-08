// 096 · Komponen & template lewat fungsi
// kategori: lanjut
// fitur: fungsi komponen (judul, badge, kartuPoin) dipakai ulang · fungsi scene(p, opsi) · konfigurasi di satu array · gaya konsisten
// pakai: bikin "design system" video sendiri: sekali tulis komponen, puluhan video tinggal ganti data

import { project } from 'gerak';

// ---- tema
const TEMA = { biru: '#2D3E8D', teal: '#00B7B3', tinta: '#14161f', abu: '#6b7186', latar: '#f5f7fb', font: 'Plus Jakarta Sans' };

// ---- komponen: tiap fungsi menerima scene/layer + opsi, mengembalikan handle
function judul(scene, teks, { y = 380, at = 0, warna = TEMA.tinta } = {}) {
  const l = scene.layer('Judul', { fixed: true });
  l.text(teks, 90, y, { size: 88, weight: 800, color: warna, valign: 'top', maxWidth: 900, lineHeight: 1.06, anim: { type: 'words', effect: 'rise', at, stagger: 3 } });
  return l;
}
function badge(scene, teks, { x = 90, y = 260, at = 0, warna = TEMA.teal } = {}) {
  const l = scene.layer(`Badge ${teks}`, { x, y });
  l.text(teks, 0, 0, { size: 36, weight: 800, color: '#ffffff', valign: 'middle', letterSpacing: 3, box: { color: warna, padX: 22, padY: 12, radius: 30 } });
  l.pop(at, { dur: 10 });
  return l;
}
function kartuPoin(scene, poin, { y0 = 820, at = 10 } = {}) {
  poin.forEach((teks, i) => {
    const l = scene.layer(`Poin ${i + 1}`, { x: 90, y: y0 + i * 170 });
    l.rect(0, -60, 900, 120, { fill: '#ffffff', r: 26 });
    l.circle(60, 0, 16, { fill: TEMA.teal });
    l.text(teks, 100, 0, { size: 46, weight: 700, color: TEMA.tinta, valign: 'middle' });
    l.slideIn(at + i * 8, { from: 'left', distance: 120, dur: 12 });
    scene.sfx('pop', { at: at + i * 8, volume: -14 });
  });
}

// ---- template scene: satu fungsi = satu jenis slide
function slideMateri(p, { label, judulTeks, poin, transisi = 'push-left' }) {
  const s = p.scene(label, { duration: '4s', transition: { type: transisi, duration: 10 } });
  badge(s, label.toUpperCase(), { at: 2 });
  judul(s, judulTeks, { at: 4 });
  kartuPoin(s, poin, { at: 24 });
  return s;
}

// ---- data → video
const p = project({ title: 'Template fungsi', preset: 'reels', fps: 30, background: TEMA.latar });
const MATERI = [
  { label: 'Bagian 1', judulTeks: 'Catat dulu prosesnya', poin: ['Tulis langkah kerja harian', 'Tandai yang paling sering diulang', 'Hitung waktunya'] },
  { label: 'Bagian 2', judulTeks: 'Pilih yang diotomasi', poin: ['Mulai dari yang paling repetitif', 'Pakai tools yang sudah ada', 'Uji seminggu'] },
  { label: 'Bagian 3', judulTeks: 'Ukur & perbaiki', poin: ['Bandingkan waktu sebelum-sesudah', 'Tanya feedback pembeli', 'Ulangi tiap bulan'] },
];
MATERI.forEach((m, i) => slideMateri(p, { ...m, transisi: i === 0 ? 'fade' : 'push-left' }));

export default p;
