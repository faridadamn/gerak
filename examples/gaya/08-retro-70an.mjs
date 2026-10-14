// Gaya 08 · Retro 70-an (sunburst, pelangi tebal, huruf groovy bertumpuk)
// standar: warna hangat terbatas · bayangan bertumpuk ala poster lawas · gerak memantul di ketuk · 100 BPM
// pakai: grand opening, event, promo musiman, konten nostalgia

import { project } from 'gerak';

const p = project({ title: 'Retro 70an', preset: 'reels', fps: 30, background: '#F4E2BE' });
const W = p.width;
const GROOVY = p.font('fonts/Shrikhand-Regular.ttf', { family: 'Shrikhand', weight: 400 });
const BPM = 100;
const K = (p.fps * 60) / BPM; // 18

const CREAM = '#F4E2BE';
const ORANGE = '#E8692C';
const RUST = '#B23A1C';
const MUSTARD = '#EFA92E';
const BROWN = '#4A2416';
const TEAL = '#2F6F62';
p.effects({ grain: 0.09, vignette: 0.22 });

const groovy = (o) => ({ font: GROOVY, weight: 400, align: 'center', valign: 'middle', ...o });

// teks dengan 3 lapis bayangan bertumpuk (khas poster 70-an)
function stacked(s, name, text, x, y, size, at, colors = [BROWN, RUST, MUSTARD, CREAM], step = 9) {
  const g = s.group(name, { x, y });
  colors.forEach((c, i) => {
    const d = (colors.length - 1 - i) * step;
    g.layer(`${name} ${i}`, { x: d, y: d }).text(text, 0, 0, groovy({ size, color: c, fit: 960 }));
  });
  g.key(0, { opacity: 0 }, 'hold').key(at, { opacity: 1 });
  g.pop(at, { from: 0.2, dur: 10, ease: 'spring-bouncy', fade: false });
  return g;
}

// sinar matahari (sunburst) yang berputar pelan
function sunburst(s, cx, cy, n = 28, R = 1800, color = 'rgba(239,169,46,0.35)') {
  const l = s.layer('Sunburst', { x: cx, y: cy });
  for (let i = 0; i < n; i += 2) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2;
    l.polygon([[0, 0], [Math.cos(a0) * R, Math.sin(a0) * R], [Math.cos(a1) * R, Math.sin(a1) * R]], { fill: color, closed: true });
  }
  l.spin({ speed: 8 });
  return l;
}

// pelangi: busur tebal yang tergambar satu per satu
function rainbow(s, cx, cy, at) {
  const l = s.layer('Pelangi');
  [[560, RUST], [470, ORANGE], [380, MUSTARD], [290, TEAL]].forEach(([r, c], i) => {
    l.arc(cx, cy, r, 180, 360, { stroke: c, strokeWidth: 84, lineCap: 'butt', draw: [at + i * 4, 14, 'out-cubic'] });
  });
  return l;
}

// ---------------------------------------------------------------------
// 1. GRAND OPENING
// ---------------------------------------------------------------------
const s1 = p.scene('Opening', { duration: 10 * K });
s1.note({ action: 'Sunburst berputar, pelangi tergambar, GRAND / OPENING memantul bertumpuk' });
sunburst(s1, W / 2, 1500);
rainbow(s1, W / 2, 1620, 4);
s1.sfx('riser', { at: 0, dur: 0.9, volume: -16 });

const top = s1.layer('Nama', { fixed: true });
top.text('Warung Sore', W / 2, 320, groovy({ size: 110, color: TEAL, anim: { type: 'chars', effect: 'drop', at: 6, stagger: 1.5, dur: 8 } }));
top.text('— presents —', W / 2, 430, { weight: 800, size: 46, color: BROWN, align: 'center', valign: 'middle', letterSpacing: 6, anim: { type: 'words', effect: 'fade', at: 18, dur: 8 } });

stacked(s1, 'Grand', 'Grand', W / 2, 700, 300, 2 * K);
stacked(s1, 'Opening', 'Opening!', W / 2, 1010, 250, 3 * K);
s1.sfx('kick', { at: 2 * K, volume: -6 });
s1.sfx('kick', { at: 3 * K, volume: -6 });
s1.sfx('chime', { at: 3 * K + 4, volume: -14 });

const wave = s1.layer('Gelombang', { x: 0, y: 1260 });
const wavePath = (amp, len) => { let d = `M -200 0`; for (let x = -200; x <= W + 400; x += len) d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`; return d; };
wave.path(wavePath(26, 160), { stroke: BROWN, strokeWidth: 12, lineCap: 'round', draw: [4 * K, 16, 'out-cubic'] });
wave.key(4 * K, { x: 0 }, 'linear').key(10 * K, { x: -160 * 2 });

// ---------------------------------------------------------------------
// 2. INFO + LENCANA GRATIS
// ---------------------------------------------------------------------
const s2 = p.scene('Info', { duration: 9 * K, background: ORANGE, transition: { type: 'iris', duration: 12, at: [W / 2, 1620], ease: 'in-out-cubic' } });
s2.note({ action: 'Latar oranye, SABTU 25 OKT, jam 4 sore, lencana bergerigi berputar "gratis es teh"' });
sunburst(s2, W / 2, 700, 32, 1800, 'rgba(244,226,190,0.16)');
stacked(s2, 'Sabtu', 'Sabtu', W / 2, 420, 260, 4, [BROWN, RUST, MUSTARD, CREAM]);
const date = s2.layer('Tanggal', { fixed: true });
date.text('25 Okt · jam 4 sore', W / 2, 640, groovy({ size: 92, color: BROWN, anim: { type: 'words', effect: 'pop', at: K + 4, stagger: 3, dur: 8 } }));
s2.sfx('kick', { at: 4, volume: -6 });
s2.sfx('tap', { at: K + 4, volume: -8 });

const badge = s2.group('Lencana', { x: W / 2, y: 1120 });
const rays = badge.layer('Gerigi');
rays.star(0, 0, 380, 330, 24, { fill: MUSTARD });
rays.spin({ speed: -20 });
const face = badge.layer('Isi');
face.circle(0, 0, 300, { fill: CREAM });
face.circle(0, 0, 270, { stroke: RUST, strokeWidth: 6, dash: [14, 10] });
face.text('gratis', 0, -90, groovy({ size: 110, color: RUST }));
face.text('ES TEH', 0, 30, { weight: 800, size: 110, color: BROWN, align: 'center', valign: 'middle', letterSpacing: 2 });
face.text('50 orang pertama', 0, 140, { weight: 800, size: 46, color: BROWN, align: 'center', valign: 'middle' });
badge.key(0, { opacity: 0 }, 'hold').key(3 * K, { opacity: 1 });
badge.pop(3 * K, { from: 0, dur: 14, ease: 'spring-bouncy', fade: false });
badge.sway({ angle: 4, period: (4 * K) / 30, from: 4 * K });
s2.sfx('pop', { at: 3 * K, volume: -6 });
s2.sfx('coin', { at: 3 * K + 8, volume: -12 });

// ---------------------------------------------------------------------
// 3. PENUTUP
// ---------------------------------------------------------------------
const s3 = p.scene('Sampai', { duration: 6 * K, background: CREAM, transition: { type: 'wipe-down', duration: 10, ease: 'in-out-quart' } });
s3.note({ action: 'Pelangi lagi dari bawah, "sampai ketemu!" bertumpuk' });
sunburst(s3, W / 2, 1500);
rainbow(s3, W / 2, 1620, 0);
stacked(s3, 'Sampai', 'sampai', W / 2, 640, 230, 6);
stacked(s3, 'Ketemu', 'ketemu!', W / 2, 900, 230, K);
s3.sfx('kick', { at: 6, volume: -6 });
s3.sfx('success', { at: K, volume: -10 });

p.sfx('beat', { at: 0, bpm: BPM, bars: 7, volume: -16, kick: 'x..x....x..x....', snare: '....x.......x...', hat: 'x.xxx.xxx.xxx.xx' });

export default p;
