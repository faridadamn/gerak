// 031 · Grafik garis tergambar (16:9)
// kategori: data
// fitur: preset youtube 16:9 · polygon smooth closed:false dengan draw · area gradien fadeIn · titik pop bertahap · grid
// pakai: tren data di video YouTube/presentasi, pertumbuhan, harga naik turun

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Grafik garis', preset: 'youtube', fps: 30, background: '#0f1424' });
const W = p.width; // 1920
const H = p.height; // 1080

const s = p.scene('Tren', { duration: '6s' });

// area grafik
const X0 = 220;
const X1 = W - 160;
const Y0 = 860; // bawah
const Y1 = 300; // atas
const nilai = [20, 26, 22, 35, 31, 48, 44, 62, 70, 88];
const MAX = 100;
const titik = nilai.map((v, i) => [X0 + (i / (nilai.length - 1)) * (X1 - X0), Y0 - (v / MAX) * (Y0 - Y1)]);

// 1) grid + label
const grid = s.layer('Grid');
for (let k = 0; k <= 4; k++) {
  const y = Y0 - (k / 4) * (Y0 - Y1);
  grid.line(X0, y, X1, y, { stroke: 'rgba(255,255,255,0.08)', strokeWidth: 2 });
  grid.text(String(k * 25), X0 - 30, y, { size: 30, color: '#6c7590', align: 'right', valign: 'middle' });
}
grid.text('Pengunjung toko per minggu (ribu)', X0, 190, { size: 52, weight: 800, color: '#ffffff' });

// 2) area di bawah garis: polygon tertutup, muncul memudar setelah garis selesai
const area = s.layer('Area', { opacity: 0 });
area.polygon([...titik, [X1, Y0], [X0, Y0]], { fill: { type: 'linear', angle: 90, stops: [[0, 'rgba(0,183,179,0.45)'], [1, 'rgba(0,183,179,0)']] } });
area.key(0, { opacity: 0 }, 'hold').key(60, { opacity: 0 }, 'out-cubic').key(80, { opacity: 1 });

// 3) garis: polygon terbuka + smooth, tergambar dari kiri ke kanan
const garis = s.layer('Garis');
garis.polygon(titik, { closed: false, smooth: true, stroke: TEAL, strokeWidth: 10, draw: [10, 50, 'in-out-sine'] });

// 4) titik data muncul mengikuti garis
titik.forEach(([x, y], i) => {
  const at = 10 + Math.round((i / (nilai.length - 1)) * 50);
  const d = s.layer(`Titik ${i + 1}`, { x, y });
  d.circle(0, 0, 14, { fill: '#0f1424', stroke: TEAL, strokeWidth: 6 });
  d.pop(at, { dur: 10 });
  if (i === nilai.length - 1) {
    d.text(`${nilai[i]}rb`, 0, -50, { size: 56, weight: 800, color: '#ffffff', align: 'center', anim: { type: 'words', effect: 'pop', at: at + 6 } });
  }
});

s.camera.push({ zoom: 1.04 });
s.sfx('whoosh', { at: 10, dur: 1.6, volume: -16, low: 200, high: 2400 });
s.sfx('ding', { at: 66, volume: -12 });

export default p;
