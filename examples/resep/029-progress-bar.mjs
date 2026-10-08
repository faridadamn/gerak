// 029 · Progress bar dengan tahapan
// kategori: grafis
// fitur: scaleX dengan pivot kiri (bar mengisi) · count persen · label tahap bergantian (show) · ikon centang draw · square
// pakai: proses loading, "lagi diproses", progres proyek, tahapan onboarding

import { project } from 'gerak';

const TEAL = '#00B7B3';
const INK = '#14161f';
const p = project({ title: 'Progress bar', preset: 'square', fps: 30, background: '#f5f7fb' });
const W = p.width;

const s = p.scene('Progres', { duration: '5s' });
const X0 = 140; // kiri bar
const BW = W - 280; // lebar bar
const Y = 600;
const SELESAI = 110; // frame bar penuh

// 1) jalur bar (abu-abu)
const jalur = s.layer('Jalur');
jalur.rect(X0, Y - 24, BW, 48, { fill: '#e2e6f0', r: 24 });

// 2) isi bar: layer ditaruh di ujung kiri (x = X0) lalu scaleX 0 → 1
//    karena digambar mulai x=0, skala berporos di ujung kiri
const isi = s.layer('Isi', { x: X0, y: Y });
isi.rect(0, -24, BW, 48, { fill: { type: 'linear', angle: 0, stops: [[0, '#2D3E8D'], [1, TEAL]] }, r: 24 });
isi.key(0, { scaleX: 0 }, 'in-out-sine').key(40, { scaleX: 0.35 }, 'in-out-cubic').key(75, { scaleX: 0.72 }, 'in-out-cubic').key(SELESAI, { scaleX: 1 });

// 3) persen berjalan (count) sinkron dengan bar
const teks = s.layer('Teks', { fixed: true });
teks.text('0%', W / 2, 440, { size: 150, weight: 800, color: INK, align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: 100, at: 0, dur: SELESAI, ease: 'in-out-sine', suffix: '%' } });

// 4) label tahap: tampil bergantian
const tahap = [
  ['Mengunduh data…', 0, 40],
  ['Menganalisis…', 40, 75],
  ['Menyusun laporan…', 75, SELESAI],
  ['Selesai!', SELESAI, null],
];
for (const [label, a, b] of tahap) {
  teks.text(label, W / 2, 720, { size: 52, weight: 600, color: label === 'Selesai!' ? TEAL : '#6b7186', align: 'center', valign: 'middle', show: [a, b], anim: { type: 'lines', effect: 'rise', at: a, dur: 8 } });
}

// 5) centang di akhir
const centang = s.layer('Centang', { x: W / 2, y: 880 });
centang.circle(0, 0, 70, { fill: TEAL });
centang.polygon([[-30, 0], [-8, 24], [34, -22]], { closed: false, stroke: '#ffffff', strokeWidth: 14, draw: [SELESAI + 8, 10, 'out-cubic'] });
centang.pop(SELESAI, { dur: 12 });

s.sfx('tick', { at: 40, volume: -12 });
s.sfx('tick', { at: 75, volume: -12 });
s.sfx('success', { at: SELESAI, volume: -8 });

export default p;
