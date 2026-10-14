// Showcase Gerak v2 — promo 15 detik, 9:16, sinkron 120 BPM.
// Gaya: tinta di atas kertas. Tipografi raksasa yang ngisi layar,
// coretan kuas yang tergambar live (fitur khas Gerak), satu warna aksen.

import { project, ellipsePoints, catmullRom, withPressure } from 'gerak';

const PAPER = '#EFE8DA';
const INK = '#141210';
const ORANGE = '#FF4A1C';
const MUTED = '#8A8172';

const BPM = 120;
const p = project({ title: 'Gerak — showcase v2', preset: 'reels', fps: 30, background: PAPER });
const W = p.width;
const K = (p.fps * 60) / BPM; // 15 frame per ketuk

p.effects({ grain: 0.07, vignette: 0.12 });

const big = { weight: 800, align: 'center', valign: 'middle' };

// =====================================================================
// 1. HOOK — 4 kata, 4 ketuk, satu per baris, ngisi layar
// =====================================================================
const s1 = p.scene('Hook', { duration: 6 * K, background: PAPER });
s1.note({ action: 'BIKIN / VIDEO / PAKE / KODE. menghentak tiap ketuk, kuas melingkari KODE' });

const WORDS = [
  ['BIKIN', 520, INK],
  ['VIDEO', 770, INK],
  ['PAKE', 1020, INK],
  ['KODE.', 1280, ORANGE],
];
WORDS.forEach(([w, y, c], i) => {
  const l = s1.layer(`Kata ${w}`, { x: W / 2, y });
  l.text(w, 0, 0, { ...big, size: 240, color: c, fit: 920 });
  l.key(0, { opacity: 0 }, 'hold').key(i * K, { opacity: 1 });
  l.pop(i * K, { from: 1.7, dur: 7, ease: 'out-cubic', fade: false });
  s1.sfx(i === 3 ? 'impact' : 'kick', { at: i * K, volume: i === 3 ? -6 : -10 });
});

// lingkaran tinta di sekitar KODE.
const ring = s1.layer('Lingkar kuas');
ring.stroke(
  ellipsePoints(W / 2, 1280, 410, 150, { start: 200, end: 560, n: 80, pressure: (t) => 0.35 + 0.65 * Math.sin(Math.PI * t) }),
  { brush: 'ink', size: 22, color: INK, reveal: [3 * K + 4, 14, 'in-out-sine'] },
);
s1.sfx('swoosh', { at: 3 * K + 4, dur: 0.5, volume: -14 });

// catatan tangan
const note1 = s1.layer('Catatan', { x: 720, y: 1470, rotation: -5 });
note1.text('tanpa After Effects', 0, 0, { font: 'Caveat', weight: 700, size: 72, color: MUTED, align: 'center', valign: 'middle' });
note1.key(0, { opacity: 0 }, 'hold').key(4 * K, { opacity: 1 });
note1.slideIn(4 * K, { from: 'bottom', distance: 40, dur: 8 });

s1.camera.shake({ amp: 14, freq: 18, from: 3 * K, to: 3 * K + 8, decay: true });

// =====================================================================
// 2. KODE → HASIL — layar dibalik gelap, kode diketik, hasilnya nongol
// =====================================================================
const s2 = p.scene('Kode', {
  duration: 10 * K,
  background: INK,
  transition: { type: 'iris', duration: 10, at: [W / 2, 1280], ease: 'in-out-cubic' },
});
s2.note({ action: 'Kode diketik live, lalu hasil render-nya muncul di bawah' });

const head2 = s2.layer('Judul kode', { fixed: true });
head2.text('nulis ini…', 110, 300, { font: 'Caveat', weight: 700, size: 96, color: ORANGE, valign: 'middle', anim: { type: 'words', effect: 'rise', at: 2, dur: 8 } });

const card = s2.layer('Kartu kode');
card.rect(70, 370, 940, 560, { fill: '#1F1C19', r: 32, stroke: '#2E2A25', strokeWidth: 3 });
[['#FF5F57', 0], ['#FEBC2E', 1], ['#28C840', 2]].forEach(([c, i]) => card.circle(124 + i * 40, 420, 11, { fill: c }));
card.fadeIn(0, 6);

const CODE = [
  "s.layer('Judul')",
  "  .text('Halo!', { size: 200 })",
  "  .pop(0);",
  "",
  "s.sfx('pop');",
];
const code = s2.layer('Kode');
code.text(CODE.join('\n'), 120, 490, {
  size: 54, weight: 600, color: PAPER, valign: 'top', lineHeight: 1.45,
  anim: { type: 'typewriter', at: 8, cps: 38, cursor: ORANGE },
});
s2.sfx('typing', { at: 8, dur: 2.0, volume: -14 });

const mid = s2.layer('Jadi ini', { fixed: true });
mid.text('…jadi ini:', 110, 990, { font: 'Caveat', weight: 700, size: 96, color: ORANGE, valign: 'middle', anim: { type: 'words', effect: 'rise', at: 6 * K, dur: 8 } });

const out = s2.layer('Hasil', { x: W / 2, y: 1270 });
out.rect(-470, -200, 940, 400, { fill: PAPER, r: 32 });
out.key(0, { opacity: 0 }, 'hold').key(6 * K + 6, { opacity: 1 });
out.pop(6 * K + 6, { from: 0.85, dur: 8, ease: 'out-back', fade: false });

const halo = s2.layer('Halo', { x: W / 2, y: 1250 });
halo.text('Halo!', 0, 0, { ...big, size: 200, color: ORANGE });
halo.key(0, { opacity: 0 }, 'hold').key(7 * K, { opacity: 1 });
halo.pop(7 * K, { from: 0.2, dur: 10, ease: 'out-back', fade: false });
s2.sfx('pop', { at: 7 * K, volume: -6 });

const under = s2.layer('Garis Halo');
under.stroke(withPressure(catmullRom([[320, 1370], [520, 1385], [760, 1362]], 30), 'taper'), {
  brush: 'marker', size: 20, color: INK, reveal: [7 * K + 8, 10, 'out-cubic'],
});

// =====================================================================
// 3. ISINYA — tiga angka raksasa, tiap 2 ketuk
// =====================================================================
const s3 = p.scene('Isi', {
  duration: 8 * K,
  background: PAPER,
  transition: { type: 'push-up', duration: 10, ease: 'in-out-quart' },
});
s3.note({ action: '13 kuas / 29 SFX / 100 resep — angka menghitung naik di ketuk' });

const head3 = s3.layer('Isinya', { fixed: true });
head3.text('di dalemnya ada:', 90, 290, { font: 'Caveat', weight: 700, size: 88, color: MUTED, valign: 'middle', anim: { type: 'words', effect: 'rise', at: 0, dur: 8 } });

const hl = s3.layer('Stabilo');
hl.stroke([[590, 1382, 1], [920, 1382, 1]], { brush: 'highlighter', size: 80, color: '#FFD43B', reveal: [4 * K + 14, 8, 'out-cubic'] });

const ROWS = [
  { n: 13, label: 'kuas', y: 560 },
  { n: 29, label: 'SFX', y: 960 },
  { n: 100, label: 'resep', y: 1360 },
];
ROWS.forEach(({ n, label, y }, i) => {
  const at = 4 + i * 2 * K;
  const row = s3.layer(`Baris ${label}`, { fixed: true });
  row.key(0, { opacity: 0 }, 'hold').key(at, { opacity: 1 });
  row.text(String(n), 90, y, {
    size: 250, weight: 800, color: ORANGE, valign: 'middle', fit: 520,
    anim: { type: 'count', from: 0, to: n, at, dur: 12, ease: 'out-cubic' },
  });
  row.text(label, 600, y + 20, { size: 104, weight: 800, color: INK, valign: 'middle', anim: { type: 'words', effect: 'slide', at: at + 4, dur: 8 } });
  s3.sfx(i === 1 ? 'coin' : 'kick', { at, volume: -10 });
});

// dekorasi per baris — dipamerin langsung pakai fiturnya
const BRUSHES = [['ink', INK], ['dry', ORANGE], ['neon', '#FF8A3D']];
const deco = s3.layer('Kuas contoh');
BRUSHES.forEach(([b, c], i) => {
  const y = 720;
  const x0 = 90 + i * 300;
  deco.stroke(withPressure(catmullRom([[x0, y + 10], [x0 + 120, y - 18], [x0 + 250, y + 6]], 24), 'swell'), {
    brush: b, size: 22, color: c, reveal: [8 + i * 4, 10, 'out-cubic'],
  });
});

for (let i = 0; i < 18; i++) {
  const h = 12 + Math.round(30 * Math.abs(Math.sin(i * 1.7)));
  const bar = s3.layer(`Bar ${i}`, { x: 96 + i * 50, y: 1125, pivot: [0, 0] });
  bar.rect(-10, -h, 20, h * 2, { fill: INK, r: 10 });
  bar.key(0, { opacity: 0, scaleY: 0.1 }, 'hold').key(2 * K + 6, { opacity: 1, scaleY: 0.1 }, 'out-back').key(2 * K + 12 + (i % 6), { scaleY: 1 });
  bar.pulse({ amount: 0.35, period: (2 * K) / 30, from: 2 * K + 20 });
}


// =====================================================================
// 4. CTA — layar oranye, GERAK menghentak, link
// =====================================================================
const s4 = p.scene('CTA', {
  duration: 6 * K,
  background: ORANGE,
  transition: { type: 'cover-left', duration: 8, ease: 'in-out-quart' },
});
s4.note({ action: 'GERAK per huruf, sapuan kuas, tagline, link' });

const logo = s4.layer('Logo', { x: W / 2, y: 720 });
logo.text('GERAK', 0, 0, { ...big, size: 300, color: PAPER, fit: 900, anim: { type: 'chars', effect: 'stamp', at: 2, stagger: 3, dur: 6 } });
s4.sfx('impact', { at: 2, volume: -8 });

const swipe = s4.layer('Sapuan');
swipe.stroke(withPressure(catmullRom([[150, 900], [420, 930], [700, 905], [930, 870]], 40), (t) => 1 - 0.7 * t), {
  brush: 'dry', size: 60, color: INK, dryness: 0.6, reveal: [K + 4, 10, 'out-cubic'],
});
s4.sfx('swoosh', { at: K + 4, dur: 0.4, volume: -12 });

const tag = s4.layer('Tagline', { fixed: true });
tag.text('gambar lewat kode.', W / 2, 1060, { ...big, size: 76, color: INK, anim: { type: 'words', effect: 'rise', at: 2 * K, stagger: 3, dur: 8 } });

const pill = s4.layer('Link', { x: W / 2, y: 1270 });
pill.rect(-400, -66, 800, 132, { fill: INK, r: 66 });
pill.text('faridadamn.my.id/gerak', 0, 2, { ...big, size: 54, color: PAPER });
pill.key(0, { opacity: 0 }, 'hold').key(3 * K, { opacity: 1 });
pill.pop(3 * K, { from: 0.6, dur: 9, ease: 'out-back', fade: false });
pill.pulse({ amount: 0.03, period: (2 * K) / 30, from: 4 * K });
s4.sfx('pop', { at: 3 * K, volume: -6 });

const foot = s4.layer('Footer', { fixed: true });
foot.text('open source · MIT', W / 2, 1430, { font: 'Caveat', weight: 700, size: 70, color: INK, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'fade', at: 4 * K, dur: 8 } });

s4.camera.push({ zoom: 1.05 });

// musik: beat 120 BPM sepanjang video
p.sfx('beat', { at: 0, bpm: BPM, bars: 7, volume: -16 });
p.sfx('pad', { at: 6 * K, dur: 12, root: 110, chord: [0, 7, 12, 15], brightness: 900, volume: -24 });

export default p;
