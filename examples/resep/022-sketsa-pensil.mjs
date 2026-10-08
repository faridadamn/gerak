// 022 · Dari sketsa pensil ke ilustrasi berwarna
// kategori: brush
// fitur: brush pencil (garis bantu + arsir) · ellipsePoints · airbrush sebagai cat air · urutan sketsa → tinta → warna
// pakai: proses menggambar, konten desain/ilustrator, "behind the scenes" produk

import { project, ellipsePoints, line } from 'gerak';

const p = project({ title: 'Sketsa pensil', preset: 'reels', fps: 24, background: '#f7f4ec' });
p.effects({ grain: 0.07 });
const W = p.width;

const s = p.scene('Sketsa', { duration: '7s' });
const cx = W / 2;
const cy = 960;

// 1) WARNA (paling bawah): sapuan airbrush muncul terakhir
const warna = s.layer('Warna', { opacity: 0 });
warna.stroke([[cx - 170, cy - 120, 1], [cx + 170, cy - 110, 1], [cx + 160, cy + 160, 1], [cx - 160, cy + 170, 1], [cx - 150, cy - 40, 1]], { brush: 'airbrush', size: 240, color: '#ff8787' });
warna.stroke([[cx - 200, cy + 260, 0.8], [cx + 220, cy + 270, 0.8]], { brush: 'airbrush', size: 90, color: '#adb5bd' });
warna.key(0, { opacity: 0 }, 'hold').key(100, { opacity: 0 }, 'in-out-sine').key(130, { opacity: 0.55 });

// 2) SKETSA: garis bantu pensil tipis (abu-abu)
const sketsa = s.layer('Sketsa');
const pensil = (pts, at, dur = 10, size = 5, color = '#6d675c') => sketsa.stroke(pts, { brush: 'pencil', size, color, reveal: [at, dur, 'in-out-sine'] });
pensil(line(cx, cy - 330, cx, cy + 300, { n: 2 }), 0, 8, 3.5, '#a39d90'); // sumbu tengah
pensil(ellipsePoints(cx, cy - 200, 210, 60, { n: 50 }), 6, 12); // bibir cangkir
pensil(line(cx - 210, cy - 200, cx - 170, cy + 200), 16, 8);
pensil(line(cx + 210, cy - 200, cx + 170, cy + 200), 20, 8);
pensil(ellipsePoints(cx, cy + 200, 170, 48, { start: 0, end: 180, n: 30 }), 26, 8);
pensil(ellipsePoints(cx + 230, cy - 20, 90, 120, { start: -90, end: 90, n: 30 }), 32, 10); // gagang
// arsir bayangan di sisi kanan
for (let i = 0; i < 10; i++) pensil(line(cx + 60 + i * 12, cy - 120 + i * 8, cx + 40 + i * 12, cy + 190 - i * 2), 44 + i * 2, 4, 4, '#5f5a50');

// 3) TINTA: garis final ditebalkan dengan fineliner
const tinta = s.layer('Tinta');
const fine = (pts, at, dur = 8) => tinta.stroke(pts, { brush: 'fineliner', size: 6, color: '#2b2925', reveal: [at, dur, 'in-out-sine'] });
fine(ellipsePoints(cx, cy - 200, 210, 60, { n: 50 }), 70);
fine([...line(cx - 210, cy - 200, cx - 170, cy + 200), ...ellipsePoints(cx, cy + 200, 170, 48, { start: 180, end: 0, n: 30 }), ...line(cx + 170, cy + 200, cx + 210, cy - 200)], 78, 12);
fine(ellipsePoints(cx + 230, cy - 20, 90, 120, { start: -90, end: 90, n: 30 }), 92);

const cap = s.layer('Caption', { fixed: true });
cap.text('sketsa → tinta → warna', W / 2, 1500, { font: 'Caveat', weight: 700, size: 90, color: '#2b2925', align: 'center', anim: { type: 'words', effect: 'fade', at: 120, stagger: 8, dur: 10 } });

s.sfx('scratch', { at: 0, dur: 2.5, volume: -16 });
s.sfx('scratch', { at: 70, dur: 1.2, volume: -12 });

export default p;
