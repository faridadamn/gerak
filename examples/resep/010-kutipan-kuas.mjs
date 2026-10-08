// 010 · Kartu kutipan dengan tanda kutip kuas
// kategori: teks
// fitur: brush stroke reveal (SVG path + pressure) · font Caveat · anim lines fade · line boil · grain kertas
// pakai: quote harian, kata mutiara, kutipan buku, closing reflektif

import { project, withPressure } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Kutipan kuas', preset: 'reels', fps: 24, background: '#f3eee3' });
p.effects({ grain: 0.08 });
p.boil({ every: 4, amount: 0.5 }); // garis kuas sedikit "hidup"
const W = p.width;

const s = p.scene('Kutipan', { duration: '5.5s' });

// 1) tanda kutip besar digambar dengan kuas (dua koma terbalik)
const kutip = s.layer('Tanda kutip', { x: 150, y: 470 });
for (const dx of [0, 130]) {
  kutip.stroke(withPressure([[dx + 70, 0], [dx + 20, 40], [dx + 10, 100], [dx + 50, 130], [dx + 90, 100], [dx + 70, 60]], 'swell'), {
    brush: 'brush',
    size: 46,
    color: '#00B7B3',
    reveal: [2 + dx / 26, 10, 'out-cubic'],
  });
}

// 2) isi kutipan baris per baris (font tulisan tangan)
const teks = s.layer('Isi', { fixed: true });
teks.text('Kerja keras itu penting.\nTapi kerja yang diulang-ulang\nseharusnya dikerjakan mesin.', 140, 760, {
  font: 'Caveat',
  weight: 700,
  size: 92,
  color: INK,
  valign: 'top',
  maxWidth: 800,
  lineHeight: 1.15,
  anim: { type: 'lines', effect: 'rise', at: 18, stagger: 14, dur: 14 },
});

// 3) garis kuas di bawah + atribusi
const garis = s.layer('Garis');
garis.stroke(withPressure([[140, 1400], [480, 1386], [820, 1404]], 'taper'), { brush: 'dry', size: 26, color: INK, reveal: [64, 14, 'out-cubic'] });
teks.text('— catatan harian', W - 140, 1500, { font: 'Caveat', size: 64, color: '#6b6457', align: 'right', anim: { type: 'chars', effect: 'fade', at: 76, stagger: 1, dur: 8 } });

s.sfx('scratch', { at: 2, dur: 0.6, volume: -12 });
s.sfx('scratch', { at: 64, dur: 0.5, volume: -12 });
p.sfx('pad', { at: 0, dur: 5.5, root: 174.6, chord: [0, 3, 7, 10], volume: -20 });

export default p;
