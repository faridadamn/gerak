// 033 · Roadmap horizontal dengan kamera pan
// kategori: edukasi
// fitur: dunia lebih lebar dari layar · camera.key x (pan) · milestone pop saat kamera sampai · garis draw · 16:9
// pakai: roadmap produk, perjalanan bisnis, rencana kuartal, sejarah singkat

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Roadmap', preset: 'youtube', fps: 30, background: '#f5f7fb' });
const W = p.width;

const s = p.scene('Roadmap', { duration: '9s' });

const milestone = [
  { waktu: 'Jan', judul: 'Riset pasar', isi: 'Wawancara 30 calon pembeli' },
  { waktu: 'Mar', judul: 'MVP', isi: 'Versi pertama, 10 pengguna beta' },
  { waktu: 'Jun', judul: 'Launching', isi: 'Buka untuk umum + promo' },
  { waktu: 'Sep', judul: 'Otomasi', isi: 'Chat & invoice otomatis' },
  { waktu: 'Des', judul: '1.000 pelanggan', isi: 'Target akhir tahun' },
];
const JARAK = 820; // jarak antar milestone di dunia (lebih lebar dari layar)
const X0 = 400;
const Y = 560;
const PER = 50; // frame per milestone

// garis panjang: digambar sepanjang durasi pan
const jalur = s.layer('Jalur');
jalur.line(X0, Y, X0 + JARAK * (milestone.length - 1), Y, { stroke: '#cfd5e6', strokeWidth: 10, draw: [0, PER * (milestone.length - 1) + 10, 'linear'] });

milestone.forEach((m, i) => {
  const x = X0 + i * JARAK;
  const at = 8 + i * PER;
  const titik = s.layer(`Titik ${m.waktu}`, { x, y: Y });
  titik.circle(0, 0, 40, { fill: i === milestone.length - 1 ? '#f76707' : TEAL, stroke: '#ffffff', strokeWidth: 10 });
  titik.pop(at, { dur: 12 });
  const kartu = s.layer(`Kartu ${m.waktu}`, { x, y: Y });
  kartu.text(m.waktu, 0, -110, { size: 64, weight: 800, color: '#2D3E8D', align: 'center' });
  kartu.text(m.judul, 0, 130, { size: 60, weight: 800, color: '#14161f', align: 'center', valign: 'top' });
  kartu.text(m.isi, 0, 210, { size: 38, weight: 500, color: '#6b7186', align: 'center', valign: 'top', maxWidth: 560 });
  kartu.slideIn(at + 4, { from: 'bottom', distance: 60, dur: 14 });
  s.sfx('pop', { at, volume: -10, pitch: 500 + i * 60 });
});

// kamera: titik ke-i ada di tengah layar saat x kamera = X0 + i*JARAK - W/2
s.camera.set({ x: X0 - W / 2 + 200 });
milestone.forEach((m, i) => s.camera.key(i * PER, { x: X0 + i * JARAK - W / 2 }, 'in-out-cubic'));
s.camera.key(PER * (milestone.length - 1) + 30, { x: X0 + (milestone.length - 1) * JARAK - W / 2, zoom: 1.1 });

const judul = s.layer('Judul', { fixed: true });
judul.text('Roadmap 2026', 80, 120, { size: 56, weight: 800, color: '#2D3E8D' });

export default p;
