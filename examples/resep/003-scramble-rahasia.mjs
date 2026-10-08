// 003 · Scramble huruf "RAHASIA"
// kategori: teks
// fitur: text anim scramble · letterSpacing · case upper · scanline bergerak (key y) · glitch sfx
// pakai: hook misteri/teaser, reveal kata kunci, gaya hacker/tech

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Scramble rahasia', preset: 'reels', fps: 30, background: '#0d0f14' });
const W = p.width;
const H = p.height;

const s = p.scene('Reveal', { duration: '3.5s' });

// 1) grid tipis sebagai latar
const grid = s.layer('Grid', { opacity: 0.25 });
for (let x = 0; x <= W; x += 90) grid.line(x, 0, x, H, { stroke: '#1f2a3a', strokeWidth: 2 });
for (let y = 0; y <= H; y += 90) grid.line(0, y, W, y, { stroke: '#1f2a3a', strokeWidth: 2 });

// 2) garis scan yang turun terus (keyframe y dari atas ke bawah)
const scan = s.layer('Scan');
scan.rect(0, -40, W, 80, { fill: { type: 'linear', angle: 90, stops: [[0, 'rgba(0,183,179,0)'], [0.5, 'rgba(0,183,179,0.18)'], [1, 'rgba(0,183,179,0)']] } });
scan.key(0, { y: 0 }, 'linear').key('3.5s', { y: H });

// 3) kata utama: huruf acak lalu terkunci satu per satu
const kata = s.layer('Kata', { fixed: true });
kata.text('rahasia', W / 2, 880, {
  size: 170,
  weight: 800,
  color: TEAL,
  align: 'center',
  valign: 'middle',
  case: 'upper',
  letterSpacing: 10,
  anim: { type: 'scramble', at: 4, dur: 30 },
});
// 4) subjudul masuk setelah kata terbuka
kata.text('yang jarang dibahas seller', W / 2, 1030, {
  size: 54,
  weight: 500,
  color: '#9aa4b8',
  align: 'center',
  valign: 'middle',
  anim: { type: 'words', effect: 'fade', at: 38, stagger: 3, dur: 10 },
});

s.sfx('glitch', { at: 4, dur: 0.9, volume: -16 });
s.sfx('impact', { at: 34, volume: -14 });

export default p;
