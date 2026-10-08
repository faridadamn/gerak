// 020 · Whiteboard explainer (alur 3 langkah)
// kategori: brush
// fitur: kotak & panah digambar marker (stroke titik) · font Patrick Hand · camera.move turun mengikuti alur · boil
// pakai: video penjelasan alur/proses, funnel bisnis, cara kerja produk, gaya papan tulis

import { project, withPressure } from 'gerak';

const INK = '#1f2a44';
const p = project({ title: 'Whiteboard explainer', preset: 'reels', fps: 24, background: '#ffffff' });
p.boil({ every: 4, amount: 0.6 });
const W = p.width;

const s = p.scene('Alur', { duration: '8s' });

// kotak tangan: 4 sisi digambar sebagai satu goresan marker
const kotakTangan = (l, x, y, w, h, at, warna) => {
  l.rect(x + 8, y + 10, w, h, { fill: warna, r: 18, opacity: 0.6 }); // blok warna offset di belakang
  l.stroke([[x, y, 1], [x + w, y + 4, 1], [x + w - 4, y + h, 1], [x + 2, y + h - 4, 1], [x + 4, y + 10, 1]], { brush: 'marker', size: 8, color: INK, smooth: false, reveal: [at, 12, 'in-out-sine'] });
};
const panah = (l, x, y1, y2, at) => {
  l.stroke(withPressure([[x, y1], [x + 10, (y1 + y2) / 2], [x, y2]], 'flat'), { brush: 'marker', size: 8, color: INK, reveal: [at, 8, 'out-cubic'] });
  l.stroke([[x - 30, y2 - 34, 1], [x, y2, 1], [x + 30, y2 - 34, 1]], { brush: 'marker', size: 8, color: INK, smooth: false, reveal: [at + 8, 4] });
};

const langkah = [
  { teks: 'Bikin konten', warna: '#ffe066' },
  { teks: 'Kumpulin leads', warna: '#96f2d7' },
  { teks: 'Closing otomatis', warna: '#a5d8ff' },
];
const papan = s.layer('Papan');
const teks = s.layer('Teks');
langkah.forEach((k, i) => {
  const y = 500 + i * 520;
  const at = 10 + i * 40;
  kotakTangan(papan, 190, y, 700, 220, at, k.warna);
  teks.text(k.teks, W / 2, y + 112, { font: 'Patrick Hand', size: 76, color: INK, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'fade', at: at + 10, stagger: 0.8, dur: 6 } });
  if (i < langkah.length - 1) panah(papan, W / 2, y + 250, y + 480, at + 26);
  s.sfx('scratch', { at, dur: 0.5, volume: -10 });
});

// judul ikut papan (tidak fixed) supaya tidak menabrak kotak saat kamera turun
const judul = s.layer('Judul');
judul.text('Cara kerja funnel', W / 2, 330, { font: 'Patrick Hand', size: 84, color: INK, align: 'center', anim: { type: 'words', effect: 'drop', at: 0, stagger: 4 } });

// kamera turun pelan mengikuti langkah yang sedang digambar
s.camera.key(0, { y: -120, zoom: 1.1 }, 'in-out-sine').key(130, { y: 260, zoom: 1.1 }, 'in-out-cubic').key(175, { y: 120, zoom: 0.95 });

export default p;
