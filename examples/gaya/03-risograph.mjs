// Gaya 03 · Risograph (cetak 2 tinta: pink fluoro + biru)
// standar: dua tinta multiply yang meleset (misregistration) · halftone · huruf condensed raksasa · 120 BPM
// pakai: open PO, launching produk, drop merch, event komunitas

import { project, rng } from 'gerak';

const p = project({ title: 'Risograph', preset: 'reels', fps: 30, background: '#F3EEE3' });
const W = p.width;
const ANTON = p.font('fonts/Anton-Regular.ttf', { family: 'Anton', weight: 400 });
const BPM = 120;
const K = (p.fps * 60) / BPM; // 15

const PAPER = '#F3EEE3';
const PINK = '#FF48B0';
const BLUE = '#0078BF';
p.effects({ grain: 0.11, vignette: 0.06 });

const anton = (o) => ({ font: ANTON, weight: 400, valign: 'middle', align: 'center', ...o });

// Dua cetakan dari satu teks: biru + pink, multiply, sedikit meleset & bergetar seperti mesin riso
function riso(s, name, text, x, y, size, at, { offset = [10, 7], seed = 1 } = {}) {
  const make = (color, dx, dy, sd) => {
    const l = s.layer(`${name} ${color === PINK ? 'pink' : 'biru'}`, { x: x + dx, y: y + dy, blend: 'multiply' });
    l.text(text, 0, 0, anton({ size, color, fit: 980 }));
    l.wiggle({ amp: 2.5, freq: 3, seed: sd });
    l.key(0, { opacity: 0 }, 'hold').key(at, { opacity: 1 });
    return l;
  };
  const b = make(BLUE, offset[0], offset[1], seed);
  const pk = make(PINK, 0, 0, seed + 7);
  b.pop(at, { from: 1.35, dur: 6, ease: 'out-cubic', fade: false });
  pk.pop(at + 2, { from: 1.35, dur: 6, ease: 'out-cubic', fade: false });
  return [b, pk];
}

// Halftone: titik-titik dengan jari-jari mengecil dari pusat
function halftone(layer, cx, cy, R, color, step = 30, maxR = 13) {
  for (let y = cy - R; y <= cy + R; y += step) {
    for (let x = cx - R; x <= cx + R; x += step) {
      const d = Math.hypot(x - cx, y - cy) / R;
      if (d > 1) continue;
      const r = maxR * (1 - d * d);
      if (r > 1.2) layer.circle(x, y, r, { fill: color });
    }
  }
}

// ---------------------------------------------------------------------
// 1. PRE-ORDER DIBUKA
// ---------------------------------------------------------------------
const s1 = p.scene('Buka', { duration: 10 * K });
s1.note({ action: 'Matahari halftone biru, PRE / ORDER pink+biru meleset, DIBUKA di kotak biru' });

const sun = s1.layer('Halftone', { x: 0, y: 0, blend: 'multiply' });
halftone(sun, 760, 520, 460, BLUE);
sun.key(0, { opacity: 0 }, 'hold').key(2, { opacity: 1 });
sun.zoomIn(2, { from: 0.6, dur: 16 });
sun.spin({ speed: 4 });
s1.sfx('swoosh', { at: 2, volume: -14 });

const R = rng('riso');
for (let i = 0; i < 7; i++) {
  const st = s1.layer(`Bintang ${i}`, { x: 120 + R() * 860, y: 260 + R() * 1300, blend: 'multiply' });
  st.star(0, 0, 26 + R() * 30, 10, 4, { fill: i % 2 ? PINK : BLUE });
  st.key(0, { opacity: 0 }, 'hold').key(4 * K + i * 2, { opacity: 1 });
  st.pop(4 * K + i * 2, { dur: 6 }).spin({ speed: i % 2 ? 40 : -40 });
}

riso(s1, 'PRE', 'PRE-', W / 2, 560, 470, K, { seed: 2 });
riso(s1, 'ORDER', 'ORDER', W / 2, 1000, 470, 2 * K, { seed: 4, offset: [-11, 8] });
s1.sfx('kick', { at: K, volume: -6 });
s1.sfx('kick', { at: 2 * K, volume: -6 });

const box = s1.layer('Kotak dibuka', { x: W / 2, y: 1390 });
box.rect(-450, -125, 900, 250, { fill: BLUE });
box.text('DIBUKA', 0, 6, anton({ size: 220, color: PAPER }));
box.key(0, { opacity: 0, rotation: -2 }, 'hold').key(3 * K, { opacity: 1, rotation: -2 });
box.wipeIn(3 * K, { dir: 'right', dur: 6, ease: 'out-cubic', rect: [-460, -140, 920, 280] });
s1.sfx('impact', { at: 3 * K, volume: -8 });
s1.camera.shake({ amp: 10, freq: 16, from: 3 * K, to: 3 * K + 8, decay: true });

// ---------------------------------------------------------------------
// 2. BATCH & KUOTA
// ---------------------------------------------------------------------
const s2 = p.scene('Kuota', { duration: 9 * K, background: PAPER, transition: { type: 'slide-up', duration: 10, ease: 'in-out-quart' } });
s2.note({ action: 'Batch 07, tanggal, sisa kuota menghitung turun (angka contoh)' });

const band = s2.layer('Pita', { blend: 'multiply' });
band.rect(0, 220, W, 300, { fill: PINK });
band.wipeIn(0, { dir: 'right', dur: 8, ease: 'out-cubic', rect: [0, 200, W, 340] });
riso(s2, 'BATCH', 'BATCH 07', W / 2, 375, 250, 4, { seed: 9 });

const dates = s2.layer('Tanggal', { fixed: true });
dates.text('20—27 OKTOBER', W / 2, 650, anton({ size: 130, color: BLUE, anim: { type: 'chars', effect: 'drop', at: K + 4, stagger: 1, dur: 6 } }));
s2.sfx('tap', { at: K + 4, volume: -10 });

const dots = s2.layer('Halftone 2', { blend: 'multiply' });
halftone(dots, 540, 1130, 340, PINK, 26, 11);
dots.key(0, { opacity: 0 }, 'hold').key(2 * K, { opacity: 1 });
dots.zoomIn(2 * K, { from: 0.7, dur: 14 });

const sisa = s2.layer('Sisa', { x: W / 2, y: 1090, blend: 'multiply' });
sisa.text('0', 0, 0, anton({ size: 560, color: BLUE, anim: { type: 'count', from: 50, to: 12, at: 3 * K, dur: 3 * K, ease: 'out-cubic' } }));
sisa.key(0, { opacity: 0 }, 'hold').key(3 * K, { opacity: 1 });
const lbl = s2.layer('Label sisa', { fixed: true });
lbl.text('SISA KUOTA', W / 2, 1460, anton({ size: 120, color: PINK, anim: { type: 'words', effect: 'rise', at: 3 * K + 6, dur: 8 } }));
s2.sfx('riser', { at: 3 * K, dur: 1.4, volume: -16 });
s2.sfx('ding', { at: 6 * K, volume: -10 });

// ---------------------------------------------------------------------
// 3. CTA
// ---------------------------------------------------------------------
const s3 = p.scene('CTA', { duration: 7 * K, background: BLUE, transition: { type: 'iris', duration: 10, at: [W / 2, 1090] } });
s3.note({ action: 'Latar biru, KETIK "PO" raksasa pink, di DM/WhatsApp' });
const k1 = s3.layer('Ketik', { x: W / 2, y: 520 });
k1.text('KETIK', 0, 0, anton({ size: 260, color: PAPER }));
k1.pop(0, { from: 1.4, dur: 6, fade: false });
const po = s3.layer('PO', { x: W / 2, y: 1000, blend: 'screen' });
po.text('"PO"', 0, 0, anton({ size: 620, color: PINK, fit: 940 }));
po.key(0, { opacity: 0 }, 'hold').key(K, { opacity: 1 });
po.pop(K, { from: 1.6, dur: 7, ease: 'out-back', fade: false });
po.pulse({ amount: 0.03, period: (2 * K) / 30, from: 2 * K });
s3.sfx('impact', { at: K, volume: -6 });
const dm = s3.layer('DM', { fixed: true });
dm.text('di DM / WhatsApp', W / 2, 1420, anton({ size: 110, color: PAPER, anim: { type: 'words', effect: 'rise', at: 2 * K, stagger: 3, dur: 8 } }));

p.sfx('beat', { at: 0, bpm: BPM, bars: 7, volume: -17, kick: 'x..x..x.x..x..x.', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.xx' });

export default p;
