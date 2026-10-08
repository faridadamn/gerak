// 072 · Stiker badge "BARU!" yang loop mulus (GIF)
// kategori: grafis
// fitur: ukuran kustom 600×600 · loop mulus: semua periode membagi durasi (2 detik) · spin 180°/s · pulse · sway · render GIF
// pakai: stiker/badge animasi untuk story, website, katalog, chat; elemen loop berulang
// render: gerak render examples/resep/072-stiker-loop-gif.mjs -o stiker.gif --gif-width 400

import { project } from 'gerak';

const p = project({ title: 'Stiker loop', width: 600, height: 600, fps: 30, background: '#fff9db' });
const C = 300;

// durasi 2 detik: spin 180°/s → tepat 360° per loop; pulse 1 s dan sway 2 s → kembali ke awal di detik 2
const s = p.scene('Loop', { duration: '2s' });

const sinar = s.layer('Sinar', { x: C, y: C });
for (let i = 0; i < 12; i++) {
  const a = (i / 12) * Math.PI * 2;
  sinar.line(Math.cos(a) * 200, Math.sin(a) * 200, Math.cos(a) * 270, Math.sin(a) * 270, { stroke: '#ff922b', strokeWidth: 14 });
}
sinar.spin({ speed: 90 }); // 180° dalam 2 s; karena 12 sinar simetris, tetap mulus

const badge = s.group('Badge', { x: C, y: C });
badge.sway({ angle: 6, period: 2 });
badge.pulse({ amount: 0.05, period: 1 });
const bentuk = badge.layer('Bentuk');
bentuk.star(0, 0, 190, 160, 18, { fill: '#e03131' });
bentuk.circle(0, 0, 145, { fill: 'none', stroke: '#ffffff', strokeWidth: 6, dash: [14, 10] });
const teks = badge.layer('Teks');
teks.text('BARU!', 0, 6, { size: 96, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', stroke: '#a51111', strokeWidth: 6 });

// kilau kecil berkedip (periode 0.5 s → 4 kali per loop)
const kilau = s.layer('Kilau', { x: 470, y: 130 });
kilau.star(0, 0, 34, 8, 4, { fill: '#ffd43b' });
kilau.blink({ period: 0.5, duty: 0.6 });

export default p;
