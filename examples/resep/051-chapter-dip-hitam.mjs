// 051 · Kartu bab dengan dip ke hitam + letterbox
// kategori: transisi
// fitur: transition dip (color) · letterbox sinematik (fixed rect) · fungsi pembuat scene · typewriter judul bab · lines blur
// pakai: video panjang dengan bab, cerita bersambung, mini-dokumenter, materi kursus

import { project } from 'gerak';

const p = project({ title: 'Kartu bab', preset: 'reels', fps: 24, background: '#0e0e10' });
p.effects({ grain: { amount: 0.08, animate: true }, vignette: 0.35 });
const W = p.width;
const H = p.height;

const bab = [
  { no: 'BAB 1', judul: 'Kerja sampai lupa makan', warna: '#c92a2a' },
  { no: 'BAB 2', judul: 'Mulai mencatat semuanya', warna: '#f59f00' },
  { no: 'BAB 3', judul: 'Sistem yang bekerja sendiri', warna: '#00B7B3' },
];

bab.forEach((b, i) => {
  const s = p.scene(b.no, { duration: '3s', transition: i === 0 ? undefined : { type: 'dip', duration: 18, color: '#000000' } });
  const garis = s.layer('Aksen', { x: W / 2, y: 820 });
  garis.rect(-60, -4, 120, 8, { fill: b.warna, r: 4 });
  garis.key(4, { scaleX: 0 }, 'out-cubic').key(16, { scaleX: 1 }); // garis melebar dari tengah
  const t = s.layer('Teks', { fixed: true });
  t.text(b.no, W / 2, 740, { size: 64, weight: 700, color: b.warna, align: 'center', valign: 'middle', letterSpacing: 16, anim: { type: 'typewriter', at: 4, cps: 12, cursor: false } });
  t.text(b.judul, W / 2, 960, { size: 92, weight: 800, color: '#f1f3f5', align: 'center', valign: 'middle', maxWidth: 880, lineHeight: 1.1, anim: { type: 'lines', effect: 'blur', at: 16, stagger: 6, dur: 18 } });
  s.sfx('tap', { at: 4, volume: -12, pitch: 90 });
});

// letterbox: dua bar hitam atas-bawah di semua scene → pakai fixed layer di tiap scene
for (const sc of p.scenes) {
  const lb = sc.layer('Letterbox', { fixed: true });
  lb.rect(0, 0, W, 240, { fill: '#000' });
  lb.rect(0, H - 240, W, 240, { fill: '#000' });
}

p.sfx('pad', { at: 0, dur: p.seconds, root: 130.8, chord: [0, 3, 7, 10], brightness: 700, volume: -16 });

export default p;
