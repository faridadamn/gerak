// 054 · Karakter berkedip & melirik
// kategori: karakter
// fitur: track + drawing (mata buka / tutup) · sequence dengan handle drawing · pupil dianimasikan key x (melirik) · pulse napas
// pakai: maskot hidup, avatar penjelas, reaksi karakter, konten anak/edukasi

import { project } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Kedip mata', preset: 'reels', fps: 24, background: '#d3f9d8' });
const W = p.width;

const s = p.scene('Kedip', { duration: '5s' });

// kepala (layer di tengah)
const kepala = s.group('Kepala', { x: W / 2, y: 980 });
kepala.pulse({ amount: 0.012, period: 2.5 }); // seperti bernapas
const wajah = kepala.layer('Wajah');
wajah.circle(0, 0, 330, { fill: '#ffd8a8', stroke: INK, strokeWidth: 10 });
wajah.circle(-180, 90, 48, { fill: '#ffa8a8', opacity: 0.7 }); // pipi
wajah.circle(180, 90, 48, { fill: '#ffa8a8', opacity: 0.7 });
wajah.arc(0, 90, 80, 20, 160, { stroke: INK, strokeWidth: 12 }); // senyum

// MATA: track berisi 2 drawing. Track hanya menampilkan satu drawing di satu waktu.
const mata = kepala.track('Mata');
const buka = mata.drawing('buka');
const putih = buka.layer('Bola mata');
putih.ellipse(-120, -70, 70, 82, { fill: '#ffffff', stroke: INK, strokeWidth: 8 });
putih.ellipse(120, -70, 70, 82, { fill: '#ffffff', stroke: INK, strokeWidth: 8 });
const pupil = buka.layer('Pupil');
pupil.circle(-120, -60, 32, { fill: INK });
pupil.circle(120, -60, 32, { fill: INK });
pupil.circle(-108, -74, 10, { fill: '#ffffff' });
pupil.circle(132, -74, 10, { fill: '#ffffff' });
// pupil melirik kiri → kanan → tengah
pupil.key(20, { x: 0 }, 'in-out-cubic').key(28, { x: -26 }).key(56, { x: -26 }, 'in-out-cubic').key(64, { x: 26 }).key(90, { x: 26 }, 'in-out-cubic').key(98, { x: 0 });

const tutup = mata.drawing('tutup');
const garis = tutup.layer('Garis tutup');
garis.arc(-120, -80, 60, 20, 160, { stroke: INK, strokeWidth: 10 });
garis.arc(120, -80, 60, 20, 160, { stroke: INK, strokeWidth: 10 });

// jadwal kedip: tutup 3 frame lalu buka lagi (kedip ganda di akhir)
mata.sequence([
  [0, buka],
  [40, tutup], [43, buka],
  [104, tutup], [107, buka], [110, tutup], [113, buka],
]);

const teks = s.layer('Teks', { fixed: true });
teks.text('Track = ganti gambar,\nkey = gerakkan gambar.', W / 2, 1520, { size: 56, weight: 700, color: '#2b8a3e', align: 'center', valign: 'top', lineHeight: 1.2 });

export default p;
