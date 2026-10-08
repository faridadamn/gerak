// 030 · Grafik batang tumbuh
// kategori: data
// fitur: batang scaleY berporos di dasar · nilai count di atas batang · data array → layer · panah + label lonjakan · stagger
// pakai: pertumbuhan omzet/followers, perbandingan bulanan, laporan data

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'Grafik batang', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const s = p.scene('Grafik', { duration: '6s' });

const data = [
  { bulan: 'Mei', nilai: 12 },
  { bulan: 'Jun', nilai: 15 },
  { bulan: 'Jul', nilai: 14 },
  { bulan: 'Agu', nilai: 21 },
  { bulan: 'Sep', nilai: 28 },
  { bulan: 'Okt', nilai: 51 },
];
const DASAR = 1400; // garis dasar (y)
const SKALA = 15; // px per juta
const LEBAR = 110;
const JARAK = 150;
const X0 = W / 2 - ((data.length - 1) * JARAK) / 2;

const judul = s.layer('Judul', { fixed: true });
judul.text('Omzet (juta rupiah)', 100, 280, { size: 64, weight: 800, color: BLUE, anim: { type: 'words', effect: 'rise', at: 0, stagger: 3 } });
judul.text('6 bulan terakhir', 100, 360, { size: 44, weight: 500, color: '#8a90a2', anim: { type: 'lines', effect: 'fade', at: 8 } });

const sumbu = s.layer('Sumbu');
sumbu.line(80, DASAR, W - 80, DASAR, { stroke: '#d0d5e2', strokeWidth: 4, draw: [6, 14] });

data.forEach((d, i) => {
  const x = X0 + i * JARAK;
  const tinggi = d.nilai * SKALA;
  const at = 14 + i * 7;
  const terakhir = i === data.length - 1;
  // layer di dasar batang; batang digambar ke atas (y negatif) → scaleY tumbuh dari dasar
  const batang = s.layer(`Batang ${d.bulan}`, { x, y: DASAR });
  batang.rect(-LEBAR / 2, -tinggi, LEBAR, tinggi, { fill: terakhir ? TEAL : '#c5cbe0', r: [18, 18, 0, 0] });
  batang.key(at, { scaleY: 0 }, 'out-back').key(at + 20, { scaleY: 1 });
  // nilai di atas batang
  const nilai = s.layer(`Nilai ${d.bulan}`, { fixed: true });
  nilai.text('0', x, DASAR - tinggi - 30, { size: terakhir ? 64 : 44, weight: 800, color: terakhir ? TEAL : '#5a6178', align: 'center', show: [at + 14, null], anim: { type: 'count', from: 0, to: d.nilai, at, dur: 20 } });
  nilai.text(d.bulan, x, DASAR + 70, { size: 40, weight: 600, color: '#5a6178', align: 'center' });
});

// panah + label lonjakan di batang terakhir
const xAkhir = X0 + (data.length - 1) * JARAK;
const sorot = s.layer('Sorot');
sorot.arrow(xAkhir - 360, 700, xAkhir - 90, 560, { stroke: '#e8590c', strokeWidth: 10, head: 34, draw: [70, 14, 'out-cubic'] });
sorot.text('+82%', xAkhir - 420, 760, { size: 90, weight: 800, color: '#e8590c', align: 'center', anim: { type: 'words', effect: 'pop', at: 80, dur: 12 } });

for (let i = 0; i < data.length; i++) s.sfx('pop', { at: 14 + i * 7, volume: -12, pitch: 400 + i * 70 });
s.sfx('success', { at: 80, volume: -10 });

export default p;
