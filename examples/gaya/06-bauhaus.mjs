// Gaya 06 · Bauhaus (bentuk dasar + warna primer, kinetik)
// standar: komposisi geometris yang menghentak di ketuk · huruf kecil tebal · 3 warna primer + hitam · 120 BPM
// pakai: manifesto/mindset, konten "sebelum vs sesudah sistem", opening brand berani

import { project } from 'gerak';

const p = project({ title: 'Bauhaus', preset: 'reels', fps: 30, background: '#ECE4D2' });
const W = p.width;
const BPM = 120;
const K = (p.fps * 60) / BPM; // 15

const PAPER = '#ECE4D2';
const RED = '#D7261E';
const BLUE = '#1E4FA3';
const YEL = '#F2B705';
const BLK = '#161616';
p.effects({ grain: 0.07 });

const sans = (o) => ({ weight: 800, case: 'lower', valign: 'middle', color: BLK, letterSpacing: -4, ...o });
const half = (r) => `M ${-r} 0 A ${r} ${r} 0 0 1 ${r} 0 Z`;          // setengah lingkaran (bawah)
const quarter = (r) => `M 0 0 L ${r} 0 A ${r} ${r} 0 0 1 0 ${r} Z`; // seperempat

// ---------------------------------------------------------------------
// 1. SEMANGAT ITU HABIS — komposisi tersusun, lalu runtuh
// ---------------------------------------------------------------------
const s1 = p.scene('Semangat', { duration: 9 * K });
s1.note({ action: 'Bentuk muncul per ketuk, teks "semangat itu habis.", bentuk runtuh di ketuk 7' });

const shapes = [];
const add = (name, opts, draw, at, enter) => {
  const l = s1.layer(name, opts);
  draw(l);
  l.key(0, { opacity: 0 }, 'hold').key(at, { opacity: 1 });
  enter(l, at);
  shapes.push(l);
  return l;
};
add('Lingkaran biru', { x: 700, y: 620 }, (l) => l.circle(0, 0, 330, { fill: BLUE }), 0, (l, at) => l.pop(at, { from: 0, dur: 9, ease: 'out-back' }));
add('Setengah merah', { x: 330, y: 820 }, (l) => l.path(half(270), { fill: RED }), K, (l, at) => l.spinIn(at, { turns: -0.5, dur: 10, ease: 'out-back' }));
add('Segitiga kuning', { x: 820, y: 1000 }, (l) => l.polygon([[0, -230], [210, 130], [-210, 130]], { fill: YEL, closed: true }), 2 * K, (l, at) => l.dropIn(at, { height: 700, dur: 12 }));
add('Batang hitam', { x: 540, y: 640, rotation: -35 }, (l) => l.rect(-520, -34, 1040, 68, { fill: BLK }), 3 * K, (l, at) => l.wipeIn(at, { dir: 'right', dur: 7, ease: 'out-cubic', rect: [-530, -40, 1060, 80] }));
[0, 1, 2, 3].forEach((i) => s1.sfx(i === 3 ? 'snare' : 'kick', { at: i * K, volume: -6 }));

const t1 = s1.layer('Semangat', { x: 80, y: 1290 });
t1.text('semangat', 0, 0, sans({ size: 250, fit: 920 }));
t1.wipeIn(4 * K, { dir: 'right', dur: 7, ease: 'out-cubic', rect: [0, -170, 1000, 340] });
const t2 = s1.layer('Habis', { x: 80, y: 1480 });
t2.text('itu habis.', 0, 0, sans({ size: 160, color: RED }));
t2.wipeIn(5 * K, { dir: 'right', dur: 7, ease: 'out-cubic', rect: [0, -110, 1000, 220] });
s1.sfx('tap', { at: 4 * K, volume: -6 });
s1.sfx('tap', { at: 5 * K, volume: -6 });

// runtuh
const FALL = 6 * K + 6;
shapes.forEach((l, i) => {
  l.animate({ at: FALL + i * 2, dur: 14, from: {}, to: { y: 2600, rotation: (i % 2 ? 1 : -1) * 60 }, ease: 'in-back' });
});
s1.sfx('boom', { at: FALL + 10, volume: -10 });
s1.camera.shake({ amp: 18, freq: 14, from: FALL + 12, to: FALL + 24, decay: true });

// ---------------------------------------------------------------------
// 2. SISTEM ITU JALAN TERUS — mesin 2×2 yang berputar tiap ketuk
// ---------------------------------------------------------------------
const s2 = p.scene('Sistem', { duration: 10 * K, background: BLUE, transition: { type: 'wipe-up', duration: 8, ease: 'in-out-quart' } });
s2.note({ action: 'Kotak 2x2, bentuk di dalamnya berputar 90° tiap ketuk seperti mesin. "sistem jalan terus."' });

const CELLS = [
  { x: 80, y: 250, bg: RED, fg: PAPER, kind: 'quarter' },
  { x: 560, y: 250, bg: YEL, fg: BLK, kind: 'half' },
  { x: 80, y: 730, bg: PAPER, fg: BLUE, kind: 'tri' },
  { x: 560, y: 730, bg: BLK, fg: YEL, kind: 'quarter' },
];
const S = 440;
CELLS.forEach((c, i) => {
  const box = s2.layer(`Kotak ${i}`, { x: c.x + S / 2, y: c.y + S / 2 });
  box.rect(-S / 2, -S / 2, S, S, { fill: c.bg });
  box.pop(i * 3, { from: 0.4, dur: 8, ease: 'out-back' });
  const sh = s2.layer(`Bentuk ${i}`, { x: c.x + S / 2, y: c.y + S / 2 });
  if (c.kind === 'quarter') sh.path(quarter(170), { fill: c.fg });
  if (c.kind === 'half') sh.path(half(170), { fill: c.fg });
  if (c.kind === 'tri') sh.polygon([[0, -160], [150, 110], [-150, 110]], { fill: c.fg, closed: true });
  sh.pop(6 + i * 3, { from: 0, dur: 8, ease: 'out-back' });
  // berputar 90° tiap ketuk (arah bergantian)
  for (let b = 2; b < 10; b++) {
    const dir = i % 2 ? -1 : 1;
    sh.key(b * K, { rotation: dir * 90 * (b - 2) }, 'out-back').key(b * K + 8, { rotation: dir * 90 * (b - 1) });
  }
});
for (let b = 2; b < 10; b++) s2.sfx(b % 2 ? 'hat' : 'click', { at: b * K, volume: -12 });

const t3 = s2.layer('Sistem', { x: 80, y: 1330 });
t3.text('sistem', 0, 0, sans({ size: 270, color: PAPER, fit: 920 }));
t3.wipeIn(3 * K, { dir: 'right', dur: 7, ease: 'out-cubic', rect: [0, -180, 1000, 360] });
const t4 = s2.layer('Jalan terus', { x: 80, y: 1510 });
t4.text('jalan terus.', 0, 0, sans({ size: 150, color: YEL }));
t4.wipeIn(4 * K, { dir: 'right', dur: 7, ease: 'out-cubic', rect: [0, -110, 1000, 220] });
s2.sfx('impact', { at: 3 * K, volume: -8 });

// ---------------------------------------------------------------------
// 3. BIKIN SEKALI — lingkaran hitam, seperempat merah mengorbit
// ---------------------------------------------------------------------
const s3 = p.scene('Sekali', { duration: 7 * K, background: YEL, transition: { type: 'iris', duration: 10, at: [W / 2, 800], ease: 'in-out-cubic' } });
s3.note({ action: 'Lingkaran hitam besar berisi "bikin sekali.", seperempat lingkaran merah mengorbit' });
const orbit = s3.group('Orbit', { x: W / 2, y: 800 });
const q = orbit.layer('Seperempat', { x: 330, y: -330 });
q.path(quarter(180), { fill: RED });
orbit.spin({ speed: 90 });
const disk = s3.layer('Lingkaran', { x: W / 2, y: 800 });
disk.circle(0, 0, 400, { fill: BLK });
disk.pop(0, { from: 0.3, dur: 10, ease: 'out-back' });
disk.pulse({ amount: 0.025, period: (2 * K) / 30, from: K });
const in1 = s3.layer('Dalam', { fixed: true });
in1.text('bikin\nsekali.', W / 2, 800, sans({ size: 170, color: PAPER, align: 'center', lineHeight: 0.95, anim: { type: 'lines', effect: 'pop', at: 6, stagger: 6, dur: 8 } }));
const t5 = s3.layer('Selamanya', { fixed: true });
t5.text('jalan selamanya.', W / 2, 1420, sans({ size: 110, align: 'center', anim: { type: 'words', effect: 'rise', at: 2 * K, stagger: 4, dur: 8 } }));
s3.sfx('pop', { at: 0, volume: -6 });
s3.sfx('success', { at: 2 * K, volume: -10 });

p.sfx('beat', { at: 0, bpm: BPM, bars: 7, volume: -16, kick: 'x...x...x...x...', snare: '....x.......x...', hat: '..x...x...x...x.' });

export default p;
