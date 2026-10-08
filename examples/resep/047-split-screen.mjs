// 047 · Split screen atas-bawah: manual vs otomatis
// kategori: kamera
// fitur: group dengan clip rect (isi tidak bocor ke panel lain) · konten beranimasi di tiap panel · garis pembagi draw · count jam
// pakai: perbandingan before/after berdampingan, A vs B, cara lama vs cara baru

import { project } from 'gerak';

const p = project({ title: 'Split screen', preset: 'reels', fps: 30, background: '#000' });
const W = p.width;
const H = p.height;
const HALF = H / 2;

const s = p.scene('Split', { duration: '6s' });

// panel: group dengan clip seukuran setengah layar (koordinat lokal group)
function panel(nama, y, warna, judul, jam, warnaAksen) {
  const g = s.group(nama, { y, clip: { rect: [0, 0, W, HALF] } });
  const bg = g.layer(`${nama} latar`);
  bg.rect(0, 0, W, HALF, { fill: warna });
  // tumpukan "tugas" yang bergerak (kertas untuk manual, roda gigi untuk otomatis)
  const isi = g.layer(`${nama} isi`, { x: 860, y: HALF / 2 + 40 });
  if (nama === 'Manual') {
    for (let i = 0; i < 6; i++) isi.rect(-110 + i * 6, -150 + i * 22, 220, 150, { fill: '#ffffff', stroke: '#c92a2a', strokeWidth: 4, r: 10 });
    isi.wiggle({ amp: 6, rot: 4, freq: 2 });
  } else {
    isi.star(0, 0, 140, 110, 12, { fill: warnaAksen });
    isi.circle(0, 0, 50, { fill: warna });
    isi.spin({ speed: 120 });
  }
  const teks = g.layer(`${nama} teks`);
  teks.text(judul, 80, 180, { size: 84, weight: 800, color: '#ffffff', anim: { type: 'chars', effect: 'rise', at: 6, stagger: 1.5 } });
  teks.text('0 jam', 80, 420, { size: 132, weight: 800, color: warnaAksen, anim: { type: 'count', from: 0, to: jam, at: 20, dur: 70, decimals: jam < 1 ? 2 : 0, suffix: ' jam' } });
  teks.text('per hari untuk balas chat', 84, 520, { size: 40, weight: 600, color: 'rgba(255,255,255,0.75)' });
  return g;
}

panel('Manual', 0, '#2b1d1d', 'Manual', 8, '#ff8787');
panel('Otomatis', HALF, '#0d2b2a', 'Otomatis', 0.25, '#63e6be');

// garis pembagi + label VS
const pembagi = s.layer('Pembagi', { fixed: true });
pembagi.line(0, HALF, W, HALF, { stroke: '#ffffff', strokeWidth: 8, draw: [0, 16, 'out-cubic'] });
pembagi.circle(W / 2, HALF, 70, { fill: '#ffffff' });
pembagi.text('VS', W / 2, HALF, { size: 60, weight: 800, color: '#14161f', align: 'center', valign: 'middle' });

s.sfx('swipe', { at: 0, volume: -12 });
s.sfx('error', { at: 90, volume: -16 });
s.sfx('success', { at: 100, volume: -10 });

export default p;
