// 083 · Penjelasan rumus (Pythagoras 3-4-5)
// kategori: edukasi
// fitur: segitiga polygon draw · label sisi pop · kotak siku-siku · rumus chars rise · contoh angka count · highlight circle
// pakai: konten belajar matematika/fisika, menjelaskan rumus dengan gambar, edukasi singkat

import { project } from 'gerak';

const INK = '#212529';
const p = project({ title: 'Rumus Pythagoras', preset: 'reels', fps: 30, background: '#fff9db' });
const W = p.width;

const s = p.scene('Rumus', { duration: '8s' });

// segitiga siku-siku: alas b = 4 satuan, tinggi a = 3 satuan (1 satuan = 140 px)
const U = 140;
const A = [240, 1100]; // sudut siku-siku
const B = [240, 1100 - 3 * U];
const C = [240 + 4 * U, 1100];

const seg = s.layer('Segitiga');
seg.polygon([A, B, C], { fill: '#ffe066', stroke: INK, strokeWidth: 8, lineJoin: 'round', draw: [6, 24, 'in-out-sine'] });
seg.rect(A[0], A[1] - 40, 40, 40, { fill: 'none', stroke: INK, strokeWidth: 5 }); // tanda siku-siku

const label = (teks, x, y, at, warna) => {
  const l = s.layer(`Label ${teks}`, { x, y });
  l.text(teks, 0, 0, { size: 76, weight: 800, color: warna, align: 'center', valign: 'middle' });
  l.pop(at, { dur: 10 });
};
label('a = 3', A[0] - 120, (A[1] + B[1]) / 2, 32, '#e8590c');
label('b = 4', (A[0] + C[0]) / 2, A[1] + 80, 40, '#1971c2');
label('c = ?', (B[0] + C[0]) / 2 + 90, (B[1] + C[1]) / 2 - 50, 48, '#2f9e44');

// rumus
const r = s.layer('Rumus', { fixed: true });
r.text('a² + b² = c²', W / 2, 360, { size: 120, weight: 800, color: INK, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'rise', at: 60, stagger: 2, dur: 10 } });
r.text('3² + 4² = 9 + 16 = 25', W / 2, 1360, { size: 64, weight: 700, color: '#495057', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'fade', at: 100, stagger: 6, dur: 10 } });
r.text('c = √25 = 5', W / 2, 1520, {
  size: 110,
  weight: 800,
  color: '#2f9e44',
  align: 'center',
  valign: 'middle',
  anim: { type: 'words', effect: 'pop', at: 150, stagger: 6, dur: 12 },
  highlight: { words: ['5'], style: 'circle', color: '#2f9e44', at: 180, dur: 14 },
});

s.sfx('scratch', { at: 6, dur: 0.8, volume: -14 });
for (const at of [32, 40, 48]) s.sfx('pop', { at, volume: -12 });
s.sfx('success', { at: 180, volume: -10 });

export default p;
