// 032 · Tiga donut persentase
// kategori: data
// fitur: arc draw sebagai progres (start -90°) · count persen di tengah · loop data · lineCap round
// pakai: survei, tingkat penyelesaian, skill bar, komposisi/proporsi

import { project } from 'gerak';

const p = project({ title: 'Donut persen', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const s = p.scene('Donut', { duration: '5s' });

const judul = s.layer('Judul', { fixed: true });
judul.text('Hasil survei pelanggan', W / 2, 240, { size: 70, weight: 800, color: '#14161f', align: 'center', anim: { type: 'words', effect: 'rise', stagger: 3 } });

const data = [
  { label: 'Puas dengan respon cepat', persen: 92, warna: '#00B7B3' },
  { label: 'Akan beli lagi', persen: 78, warna: '#2D3E8D' },
  { label: 'Rekomendasikan ke teman', persen: 64, warna: '#f76707' },
];

data.forEach((d, i) => {
  const y = 560 + i * 430;
  const at = 10 + i * 12;
  const cx = 300;
  const R = 150;
  const l = s.layer(`Donut ${i + 1}`);
  l.circle(cx, y, R, { fill: 'none', stroke: '#eef0f5', strokeWidth: 36 });
  // busur dari jam 12 (−90°) sejauh persen × 360°
  l.arc(cx, y, R, -90, -90 + (d.persen / 100) * 360, { stroke: d.warna, strokeWidth: 36, lineCap: 'round', draw: [at, 40, 'out-cubic'] });
  l.text('0%', cx, y, { size: 74, weight: 800, color: '#14161f', align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: d.persen, at, dur: 40, ease: 'out-cubic', suffix: '%' } });
  l.text(d.label, 520, y, { size: 52, weight: 700, color: '#3a4256', valign: 'middle', maxWidth: 480, lineHeight: 1.15, anim: { type: 'lines', effect: 'slide', at: at + 4, dur: 12, distance: 60 } });
  s.sfx('swoosh', { at, volume: -14 });
});

export default p;
