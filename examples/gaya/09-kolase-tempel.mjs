// Gaya 09 · Kolase tempel (huruf guntingan, selotip, kertas sobek, stiker)
// standar: tiap huruf beda kertas & font · elemen "ditempel" di ketuk · coretan spidol · 120 BPM
// pakai: flash sale, promo heboh, pengumuman giveaway, konten Gen Z

import { project, rng, catmullRom, withPressure, ellipsePoints } from 'gerak';

const p = project({ title: 'Kolase tempel', preset: 'reels', fps: 30, background: '#C9A57D' });
const W = p.width;
const F = {
  anton: p.font('fonts/Anton-Regular.ttf', { family: 'Anton', weight: 400 }),
  arch: p.font('fonts/ArchivoBlack-Regular.ttf', { family: 'Archivo Black', weight: 400 }),
  serif: p.font('fonts/InstrumentSerif-Italic.ttf', { family: 'Instrument Serif', weight: 400, style: 'italic' }),
  mono: p.font('fonts/SpaceMono-Bold.ttf', { family: 'Space Mono', weight: 700 }),
  groovy: p.font('fonts/Shrikhand-Regular.ttf', { family: 'Shrikhand', weight: 400 }),
};
const BPM = 120;
const K = (p.fps * 60) / BPM; // 15

const INK = '#141414';
const RED = '#E4312B';
const PINK = '#FF7EB6';
const YEL = '#FFE14D';
const WHITE = '#F7F4EC';
const NEWS = '#E3DED2';
p.effects({ grain: 0.13, vignette: 0.18 });

const R = rng('kolase');

// sobekan kertas: persegi dengan tepi bergerigi acak (deterministik)
function torn(l, x, y, w, h, fill, jag = 10) {
  const pts = [];
  const edge = (x0, y0, x1, y1, n) => { for (let i = 0; i < n; i++) { const t = i / n; pts.push([x0 + (x1 - x0) * t + (R() - 0.5) * jag, y0 + (y1 - y0) * t + (R() - 0.5) * jag]); } };
  edge(x, y, x + w, y, 18); edge(x + w, y, x + w, y + h, 10); edge(x + w, y + h, x, y + h, 18); edge(x, y + h, x, y, 10);
  l.polygon(pts, { fill, closed: true, shadow: { color: 'rgba(0,0,0,0.28)', blur: 14, x: 4, y: 8 } });
}
function tape(l, x, y, w, rot) {
  const g = l;
  g.polygon([[-w / 2, -26], [w / 2, -26], [w / 2, 26], [-w / 2, 26]].map(([px, py]) => {
    const a = rot * Math.PI / 180; return [x + px * Math.cos(a) - py * Math.sin(a), y + px * Math.sin(a) + py * Math.cos(a)];
  }), { fill: 'rgba(250,246,230,0.62)', closed: true });
}

// huruf guntingan ala surat kaleng
const PAPERS = [[WHITE, INK], [INK, WHITE], [YEL, INK], [PINK, INK], [NEWS, RED], [RED, WHITE]];
const FONTS = [[F.anton, 1], [F.arch, 0.82], [F.serif, 1.05], [F.mono, 0.86], [F.groovy, 0.8]];
function ransom(s, word, cx, y, cell, at, step) {
  const n = word.length;
  const x0 = cx - ((n - 1) * cell) / 2;
  [...word].forEach((ch, i) => {
    const [bg, fg] = PAPERS[(i * 2 + Math.floor(R() * 3)) % PAPERS.length];
    const [font, k] = FONTS[(i + Math.floor(R() * 5)) % FONTS.length];
    const rot = (R() - 0.5) * 16;
    const dy = (R() - 0.5) * 30;
    const l = s.layer(`Huruf ${word} ${i}`, { x: x0 + i * cell, y: y + dy, rotation: rot });
    torn(l, -cell * 0.47, -cell * 0.62, cell * 0.94, cell * 1.24, bg, 8);
    l.text(ch, 0, 4, { font, weight: font === F.mono ? 700 : 400, size: cell * 1.0 * k, color: fg, align: 'center', valign: 'middle' });
    const t = at + i * step;
    l.key(0, { opacity: 0 }, 'hold').key(t, { opacity: 1 });
    l.pop(t, { from: 1.8, dur: 5, ease: 'out-quad', fade: false });
    s.sfx('tap', { at: t, volume: -8, pitch: 0.9 + (i % 3) * 0.15 });
  });
}

// ---------------------------------------------------------------------
// 1. FLASH SALE
// ---------------------------------------------------------------------
const s1 = p.scene('Flash sale', { duration: 11 * K });
s1.note({ action: 'Huruf guntingan FLASH / SALE ditempel per setengah ketuk, foto produk + selotip, stiker -50%, spidol' });

// sobekan kertas koran di latar
const bg = s1.layer('Kertas latar');
torn(bg, -60, 180, 760, 520, NEWS, 26);
torn(bg, 420, 1180, 760, 640, '#2B2B2B', 26);
for (let i = 0; i < 9; i++) bg.line(-20, 230 + i * 50, 640, 230 + i * 50, { stroke: 'rgba(0,0,0,0.12)', strokeWidth: 10 });
bg.fadeIn(0, 4);

ransom(s1, 'FLASH', W / 2, 400, 190, 4, K / 2);
ransom(s1, 'SALE!', W / 2, 660, 190, 4 + 3 * K, K / 2);

// polaroid produk
const pol = s1.layer('Polaroid', { x: 420, y: 1160, rotation: -6 });
pol.rect(-260, -280, 520, 600, { fill: WHITE, shadow: { color: 'rgba(0,0,0,0.35)', blur: 24, x: 6, y: 14 } });
pol.image('../resep/assets/produk.png', 0, -20, { width: 460, height: 460, anchor: 'center', fit: 'contain' });
pol.text('es kopi favorit', 0, 262, { font: F.serif, weight: 400, size: 58, color: INK, align: 'center', valign: 'middle' });
tape(pol, -180, -280, 200, -30);
tape(pol, 180, -280, 200, 30);
pol.key(0, { opacity: 0, y: 1700 }, 'hold').key(6 * K, { opacity: 1, y: 1700 }, 'out-back').key(6 * K + 10, { y: 1160 });
s1.sfx('swoosh', { at: 6 * K, dur: 0.3, volume: -10 });

// stiker -50%
const st = s1.layer('Stiker', { x: 800, y: 1020, rotation: 12 });
st.star(0, 0, 200, 160, 18, { fill: RED, shadow: { color: 'rgba(0,0,0,0.3)', blur: 10, y: 6 } });
st.text('-50%', 0, 6, { font: F.anton, weight: 400, size: 150, color: WHITE, align: 'center', valign: 'middle' });
st.key(0, { opacity: 0 }, 'hold').key(7 * K, { opacity: 1 });
st.pop(7 * K, { from: 2.2, dur: 6, ease: 'out-quad', fade: false });
st.spin({ speed: 18, from: 7 * K + 6 });
s1.sfx('impact', { at: 7 * K, volume: -6 });
s1.camera.shake({ amp: 12, freq: 18, from: 7 * K, to: 7 * K + 8, decay: true });

// spidol: "cuma 3 jam!" + panah
const mk = s1.layer('Spidol');
const mkT = s1.layer('Spidol teks', { x: 760, y: 1440, rotation: -6 });
mkT.text('cuma 3 jam!', 0, 0, { font: 'Caveat', weight: 700, size: 104, color: YEL, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'fade', at: 8 * K, stagger: 1.2, dur: 3 } });
mk.stroke(withPressure(catmullRom([[760, 1370], [820, 1290], [800, 1200]], 24), 'taper'), { brush: 'marker', size: 12, color: YEL, reveal: [8 * K + 10, 6, 'out-cubic'] });
mk.stroke([[800, 1200, 1], [770, 1236, 0.7]], { brush: 'marker', size: 12, color: YEL, reveal: [8 * K + 16, 2] });
mk.stroke([[800, 1200, 1], [830, 1232, 0.7]], { brush: 'marker', size: 12, color: YEL, reveal: [8 * K + 17, 2] });
s1.sfx('scratch', { at: 8 * K, dur: 0.4, volume: -14 });

// ---------------------------------------------------------------------
// 2. WAKTU + CTA
// ---------------------------------------------------------------------
const s2 = p.scene('Kapan', { duration: 10 * K, background: INK, transition: { type: 'cover-up', duration: 8, ease: 'in-out-quart' } });
s2.note({ action: 'Latar hitam, JUMAT / 19.00 huruf guntingan, pita selotip kuning "pantengin story"' });
ransom(s2, 'JUMAT', W / 2, 560, 190, 4, K / 2);
ransom(s2, '19.00', W / 2, 860, 190, 4 + 3 * K, K / 2);

const strip = s2.layer('Pita', { x: W / 2, y: 1200, rotation: -4 });
torn(strip, -520, -90, 1040, 180, YEL, 14);
strip.text('pantengin story!', 0, 6, { font: F.arch, weight: 400, size: 92, color: INK, align: 'center', valign: 'middle', fit: 940 });
strip.key(0, { opacity: 0 }, 'hold').key(6 * K, { opacity: 1 });
strip.wipeIn(6 * K, { dir: 'right', dur: 6, ease: 'out-cubic', rect: [-560, -120, 1120, 240] });
s2.sfx('swipe', { at: 6 * K, volume: -10 });
const ring = s2.layer('Lingkar spidol');
ring.stroke(ellipsePoints(W / 2, 860, 470, 170, { start: 200, end: 560, n: 80, pressure: (t) => 0.5 + 0.5 * Math.sin(Math.PI * t) }), { brush: 'marker', size: 14, color: PINK, reveal: [5 * K, 10, 'in-out-sine'] });
const hand2 = s2.layer('Tulisan', { x: W / 2, y: 1420, rotation: 3 });
hand2.text('jangan sampe kelewatan', 0, 0, { font: 'Caveat', weight: 700, size: 96, color: WHITE, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'fade', at: 7 * K, stagger: 0.8, dur: 3 } });
s2.sfx('scratch', { at: 5 * K, dur: 0.4, volume: -14 });

p.sfx('beat', { at: 0, bpm: BPM, bars: 6, volume: -16, kick: 'x...x...x...x...', snare: '....x.......x..x', hat: 'xxxxxxxxxxxxxxxx' });

export default p;
