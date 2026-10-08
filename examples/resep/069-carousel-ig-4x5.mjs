// 069 · Carousel 4 slide jadi video (4:5)
// kategori: konten
// fitur: preset feed · array slide → scene · indikator "1/4" + titik · ajakan "geser →" berayun · slide-left transition
// pakai: ubah carousel IG/LinkedIn jadi video, edukasi berurutan, poin-poin per halaman

import { project } from 'gerak';

const p = project({ title: 'Carousel 4x5', preset: 'feed', fps: 30, background: '#fffaf0' });
const W = p.width;
const H = p.height;

const SLIDE = [
  { judul: '4 tanda bisnis lu butuh sistem', isi: null, warna: '#2D3E8D', teks: '#ffffff' },
  { judul: '1. Lu nggak bisa libur', isi: 'Kalau lu berhenti, penjualan ikut berhenti.', warna: '#fffaf0', teks: '#14161f' },
  { judul: '2. Pertanyaan yang sama terus', isi: 'Ongkir? Ready? COD? Dijawab manual tiap hari.', warna: '#fffaf0', teks: '#14161f' },
  { judul: '3. Catatan di mana-mana', isi: 'Buku, chat, kepala. Nggak ada yang lengkap.', warna: '#fffaf0', teks: '#14161f' },
];

SLIDE.forEach((sl, i) => {
  const s = p.scene(`Slide ${i + 1}`, { duration: '3s', background: sl.warna, transition: i === 0 ? undefined : { type: 'slide-left', duration: 12, ease: 'in-out-quart' } });
  const t = s.layer('Isi', { fixed: true });
  if (i === 0) {
    t.text(sl.judul, 90, H / 2, { size: 100, weight: 800, color: sl.teks, valign: 'middle', maxWidth: 880, lineHeight: 1.05, anim: { type: 'words', effect: 'rise', stagger: 3 } });
  } else {
    t.text(sl.judul, 90, 330, { size: 78, weight: 800, color: sl.teks, valign: 'top', maxWidth: 880, lineHeight: 1.08, anim: { type: 'words', effect: 'rise', at: 6, stagger: 3 } });
    t.text(sl.isi, 90, 680, { size: 54, weight: 500, color: '#495057', valign: 'top', maxWidth: 860, lineHeight: 1.3, anim: { type: 'lines', effect: 'fade', at: 22, stagger: 6 } });
    t.rect(90, 250, 120, 12, { fill: '#00B7B3', r: 6 });
  }
  // indikator halaman
  const ind = s.layer('Indikator', { fixed: true });
  ind.text(`${i + 1}/${SLIDE.length}`, W - 90, 120, { size: 40, weight: 700, color: i === 0 ? 'rgba(255,255,255,0.7)' : '#868e96', align: 'right' });
  SLIDE.forEach((_, k) => ind.circle(W / 2 - 45 + k * 30, H - 90, k === i ? 10 : 7, { fill: k === i ? '#00B7B3' : i === 0 ? 'rgba(255,255,255,0.4)' : '#ced4da' }));
  // ajakan geser
  if (i < SLIDE.length - 1) {
    const geser = s.layer('Geser', { x: W - 90, y: H - 180 });
    geser.text('geser →', 0, 0, { size: 42, weight: 700, color: i === 0 ? '#ffffff' : '#2D3E8D', align: 'right' });
    geser.float({ amp: 0, x: 12, period: 1 });
  }
  s.sfx('swipe', { at: 0, volume: -14 });
});

export default p;
