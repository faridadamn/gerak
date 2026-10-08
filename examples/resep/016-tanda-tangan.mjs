// 016 · Tanda tangan digoreskan + stempel
// kategori: brush
// fitur: stroke dari SVG path (brush pen, pressure taper) · reveal lambat · stempel sketch rotasi + pop · sfx scratch
// pakai: "deal/disetujui", kontrak, sertifikat, closing penjualan, legalitas

import { project } from 'gerak';

const INK = '#1b2a6b';
const p = project({ title: 'Tanda tangan', preset: 'reels', fps: 30, background: '#ece7dc' });
p.effects({ grain: 0.06 });
const W = p.width;

const s = p.scene('TTD', { duration: '5s' });

// 1) kertas dokumen dengan garis-garis teks
const kertas = s.layer('Kertas', { x: W / 2, y: 960 });
kertas.rect(-420, -620, 840, 1240, { fill: '#fffdf8', r: 12, shadow: { color: 'rgba(0,0,0,0.15)', blur: 30, y: 10 } });
kertas.text('SURAT KERJA SAMA', 0, -520, { size: 46, weight: 800, color: '#333', align: 'center', letterSpacing: 4 });
for (let i = 0; i < 9; i++) kertas.rect(-340, -430 + i * 56, i % 3 === 2 ? 420 : 680, 14, { fill: '#e2ddd2', r: 7 });
kertas.text('Disetujui oleh,', -340, 140, { size: 38, weight: 600, color: '#555' });
kertas.line(-340, 380, 200, 380, { stroke: '#bbb', strokeWidth: 3, dash: [12, 10] });

// 2) tanda tangan: satu path SVG, digoreskan dengan brush pen
//    (koordinat path = koordinat layar karena layer di 0,0)
const ttd = s.layer('Tanda tangan');
const jalur =
  'M 220 1240 C 260 1110 330 1090 310 1210 C 300 1270 270 1280 280 1230 C 300 1140 390 1130 400 1210 ' +
  'C 405 1250 430 1250 450 1190 C 470 1140 490 1160 485 1220 C 482 1260 515 1250 540 1180 ' +
  'C 560 1130 590 1140 580 1210 C 575 1250 610 1240 630 1190 L 670 1110 C 660 1190 670 1240 710 1220 ' +
  'C 750 1200 770 1180 810 1190';
ttd.stroke(jalur, { brush: 'pen', size: 8, color: INK, pressure: 'taper', reveal: [12, 40, 'in-out-sine'] });
ttd.stroke('M 240 1300 C 420 1270 620 1280 820 1250', { brush: 'pen', size: 7, color: INK, pressure: 'taper', reveal: [54, 10, 'out-cubic'] });

// 3) stempel: lingkaran gaya tangan, miring, pop dengan efek "cap"
const cap = s.layer('Stempel', { x: 760, y: 1110, rotation: -14, opacity: 0.9 });
cap.circle(0, 0, 120, { fill: 'none', stroke: '#c92a2a', strokeWidth: 10, sketch: { brush: 'marker', size: 9, fill: 'none', roughness: 1.2 } });
cap.circle(0, 0, 92, { fill: 'none', stroke: '#c92a2a', strokeWidth: 4 });
cap.text('SAH', 0, 4, { size: 70, weight: 800, color: '#c92a2a', align: 'center', valign: 'middle', letterSpacing: 4 });
cap.pop(72, { dur: 8, from: 1.6, ease: 'out-quad' });

s.sfx('scratch', { at: 12, dur: 1.3, volume: -8 });
s.sfx('tap', { at: 72, volume: -4, pitch: 120 });

export default p;
