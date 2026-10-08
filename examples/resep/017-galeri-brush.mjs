// 017 · Galeri semua brush
// kategori: brush
// fitur: 13 preset brush (pen, ink, fineliner, marker, highlighter, brush, dry, pencil, charcoal, chalk, crayon, airbrush, neon) · withPressure · reveal bertahap
// pakai: referensi memilih brush — lihat karakter tiap kuas sebelum menggambar

import { project, withPressure, BRUSH_NAMES } from 'gerak';

const p = project({ title: 'Galeri brush', preset: 'reels', fps: 30, background: '#f4f1ea' });
const W = p.width;

const s = p.scene('Brush', { duration: '6s' });

const label = s.layer('Label', { fixed: true });
label.text('13 brush bawaan', W / 2, 150, { size: 64, weight: 800, color: '#1d1c1a', align: 'center' });

const kuas = s.layer('Kuas');
BRUSH_NAMES.forEach((nama, i) => {
  const y = 280 + i * 124;
  const at = 6 + i * 6;
  label.text(nama, 80, y + 12, { size: 38, weight: 700, color: '#555048', anim: { type: 'lines', effect: 'fade', at, dur: 6 } });
  // garis bergelombang dengan tekanan tipis → tebal → tipis
  const titik = [[330, y + 10], [500, y - 25], [680, y + 25], [860, y - 15], [1000, y + 8]];
  kuas.stroke(withPressure(titik, 'taper'), {
    brush: nama,
    color: nama === 'neon' ? '#00e5ff' : nama === 'highlighter' ? '#ffd43b' : '#1d1c1a',
    reveal: [at, 18, 'out-cubic'],
  });
});

export default p;
