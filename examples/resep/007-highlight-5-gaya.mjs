// 007 · Lima gaya highlight kata
// kategori: teks
// fitur: highlight style marker / underline / strike / circle / box / color · anim lines fade · berurutan
// pakai: menekankan kata kunci di teks edukasi, poin penting, before/after kata

import { project } from 'gerak';

const INK = '#14161f';
const p = project({ title: 'Highlight 5 gaya', preset: 'reels', fps: 30, background: '#fffaf0' });

const s = p.scene('Highlight', { duration: '6.5s' });

// tiap baris: teks, kata yang ditandai, gaya, warna
const baris = [
  { teks: 'Fokus pada satu hal.', kata: ['satu'], style: 'marker', color: '#FFD43B' },
  { teks: 'Ukur hasilnya.', kata: ['ukur'], style: 'underline', color: '#00B7B3' },
  { teks: 'Buang yang tidak perlu.', kata: ['tidak', 'perlu'], style: 'strike', color: '#e03131' },
  { teks: 'Ulangi yang berhasil.', kata: ['berhasil'], style: 'circle', color: '#2D3E8D' },
  { teks: 'Otomatiskan sisanya.', kata: ['otomatiskan'], style: 'box', color: '#c3f0ef' },
  { teks: 'Lalu istirahat.', kata: ['istirahat'], style: 'color', color: '#f76707' },
];

const l = s.layer('Daftar', { fixed: true });
baris.forEach((b, i) => {
  const at = 6 + i * 22;
  l.text(b.teks, 120, 470 + i * 190, {
    size: 76,
    weight: 800,
    color: INK,
    anim: { type: 'lines', effect: 'rise', at, dur: 10 },
    highlight: { words: b.kata, style: b.style, color: b.color, at: at + 10, dur: 10 },
  });
  // label kecil nama gaya (buat referensi)
  l.text(`style: '${b.style}'`, 124, 470 + i * 190 + 56, { size: 30, weight: 500, color: '#a39e90', anim: { type: 'lines', effect: 'fade', at: at + 12, dur: 8 } });
  s.sfx(b.style === 'strike' || b.style === 'circle' ? 'scratch' : 'pop', { at: at + 10, dur: 0.3, volume: -12 });
});

export default p;
