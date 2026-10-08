// 014 · Teks gradien dengan kilau lewat mask
// kategori: teks
// fitur: fill gradien linear pada teks · group mask (kilau hanya di dalam huruf) · skewX · blurIn · letterSpacing
// pakai: judul premium, nama brand, title card mewah, pengumuman

import { project } from 'gerak';

const p = project({ title: 'Teks gradien kilau', preset: 'reels', fps: 30, background: { type: 'radial', stops: [[0, '#1d2558'], [1, '#090b18']] } });
const W = p.width;

const s = p.scene('Judul', { duration: '4s' });

const gaya = { size: 200, weight: 800, align: 'center', valign: 'middle', case: 'upper', letterSpacing: 4, lineHeight: 0.95 };
const TEKS = 'naik\nlevel';

// 1) teks dengan isi gradien (gradien relatif ke kotak teks)
const teks = s.layer('Teks', { x: W / 2, y: 900 });
teks.text(TEKS, 0, 0, { ...gaya, color: { type: 'linear', angle: 90, stops: [[0, '#ffffff'], [0.45, '#9ff5f2'], [1, '#00B7B3']] } });
teks.blurIn(2, { amount: 30, dur: 18 });

// 2) kilau: pita putih miring yang lewat, dipotong (mask) persis bentuk huruf
//    group.mask = id layer anak yang jadi "cetakan"
const kilau = s.group('Kilau', { x: W / 2, y: 900, mask: 'cetakan-kilau' });
const pita = kilau.layer('Pita', { skewX: -20, opacity: 0.85 });
pita.rect(-70, -400, 140, 800, { fill: { type: 'linear', angle: 0, stops: [[0, 'rgba(255,255,255,0)'], [0.5, 'rgba(255,255,255,1)'], [1, 'rgba(255,255,255,0)']] } });
pita.key(30, { x: -700 }, 'in-out-sine').key(70, { x: 700 });
const cetakan = kilau.layer('Cetakan', { id: 'cetakan-kilau' });
cetakan.text(TEKS, 0, 0, { ...gaya, color: '#000000' }); // warna apa saja, yang dipakai bentuknya

// 3) subjudul
const sub = s.layer('Sub', { fixed: true });
sub.text('Kelas otomasi bisnis · batch 3', W / 2, 1180, { size: 46, weight: 500, color: '#b7c2ff', align: 'center', letterSpacing: 2, anim: { type: 'chars', effect: 'fade', at: 24, stagger: 0.8, dur: 10 } });

s.sfx('riser', { at: 0, dur: 1, volume: -18 });
s.sfx('chime', { at: 36, volume: -12 });

export default p;
