// Gaya 05 · Blueprint / gambar teknik
// standar: grid biru · garis putih yang tergambar · label mono · kamera menelusuri diagram tinggi · 100 BPM
// pakai: "cara kerja" sistem/alur, SOP, arsitektur produk, edukasi proses

import { project } from 'gerak';

const p = project({ title: 'Blueprint', preset: 'reels', fps: 30, background: '#0F4A80' });
const W = p.width;
const H = p.height;
const MONO = p.font('fonts/SpaceMono-Regular.ttf', { family: 'Space Mono', weight: 400 });
p.font('fonts/SpaceMono-Bold.ttf', { family: 'Space Mono', weight: 700 });
const BPM = 100;
const K = (p.fps * 60) / BPM; // 18

const LINE = '#F4F8FF';
const FAINT = 'rgba(244,248,255,0.13)';
const MID = 'rgba(244,248,255,0.28)';
const SUB = 'rgba(244,248,255,0.7)';
const YEL = '#FFD23F';
p.effects({ grain: 0.05, vignette: 0.3 });

const mono = (o) => ({ font: MONO, weight: 400, size: 46, color: LINE, valign: 'middle', ...o });

const s = p.scene('Gambar', { duration: 22 * K, background: '#0F4A80' });
s.note({ action: 'Kamera turun menelusuri 3 kotak alur, paket kuning bergerak, akhir zoom out + stempel' });

// grid luas (kamera bergerak & zoom out)
const grid = s.layer('Grid');
for (let x = -900; x <= 2000; x += 60) grid.line(x, -900, x, 3600, { stroke: x % 300 === 0 ? MID : FAINT, strokeWidth: x % 300 === 0 ? 2 : 1 });
for (let y = -900; y <= 3600; y += 60) grid.line(-900, y, 2000, y, { stroke: y % 300 === 0 ? MID : FAINT, strokeWidth: y % 300 === 0 ? 2 : 1 });

// judul
const title = s.layer('Judul');
title.text('SISTEM TOKO', 80, 360, mono({ weight: 700, size: 104, anim: { type: 'typewriter', at: 4, cps: 22, cursor: false } }));
title.text('OTOMATIS', 80, 480, mono({ weight: 700, size: 104, color: YEL, anim: { type: 'typewriter', at: 4 + 11 * 30 / 22, cps: 22, cursor: false } }));
title.text('GBR. 07 · SKALA 1:1 · REV 02', 80, 580, mono({ size: 44, color: SUB, anim: { type: 'typewriter', at: 2 * K, cps: 40, cursor: false } }));
s.sfx('typing', { at: 4, dur: 1.2, volume: -16 });

// tiga kotak alur
const NODES = [
  { id: '01', a: 'PESANAN', b: 'masuk dari WA', y: 900 },
  { id: '02', a: 'BAYAR QRIS', b: 'nominal otomatis', y: 1600 },
  { id: '03', a: 'KIRIM', b: 'resi ke pembeli', y: 2300 },
];
const BW = 820, BH = 330, BX = (W - BW) / 2;
NODES.forEach((n, i) => {
  const at = (4 + i * 6) * K;
  const l = s.layer(`Kotak ${n.id}`);
  l.rect(BX, n.y, BW, BH, { stroke: LINE, strokeWidth: 5, draw: [at, 14, 'in-out-cubic'] });
  // tanda sudut
  [[BX, n.y], [BX + BW, n.y], [BX, n.y + BH], [BX + BW, n.y + BH]].forEach(([cx, cy]) => {
    l.line(cx - 28, cy, cx + 28, cy, { stroke: YEL, strokeWidth: 3, draw: [at + 10, 6] });
    l.line(cx, cy - 28, cx, cy + 28, { stroke: YEL, strokeWidth: 3, draw: [at + 10, 6] });
  });
  l.text(n.id, BX + 40, n.y + 70, mono({ weight: 700, size: 52, color: YEL, anim: { type: 'typewriter', at: at + 8, cps: 30, cursor: false } }));
  l.text(n.a, BX + 40, n.y + 175, mono({ weight: 700, size: 92, fit: BW - 80, anim: { type: 'typewriter', at: at + 12, cps: 26, cursor: false } }));
  l.text(n.b, BX + 40, n.y + 265, mono({ size: 48, color: SUB, anim: { type: 'typewriter', at: at + 22, cps: 34, cursor: false } }));
  s.sfx('click', { at, volume: -10 });
  s.sfx('typing', { at: at + 12, dur: 0.5, volume: -18 });

  // panah + garis ukur ke kotak berikutnya
  if (i < NODES.length - 1) {
    const y1 = n.y + BH + 20, y2 = NODES[i + 1].y - 20;
    const a = s.layer(`Panah ${n.id}`);
    a.arrow(W / 2, y1, W / 2, y2, { stroke: LINE, strokeWidth: 5, head: 30, draw: [at + 2 * K, 14, 'in-out-cubic'] });
    // garis ukur di kanan
    const dx = BX + BW + 50;
    a.line(dx, y1, dx, y2, { stroke: MID, strokeWidth: 2, dash: [8, 8], draw: [at + 2 * K + 6, 12] });
    a.line(dx - 16, y1, dx + 16, y1, { stroke: MID, strokeWidth: 2, draw: [at + 2 * K + 6, 4] });
    a.line(dx - 16, y2, dx + 16, y2, { stroke: MID, strokeWidth: 2, draw: [at + 2 * K + 16, 4] });
    a.text('± 5 dtk', W / 2 + 40, (y1 + y2) / 2, mono({ size: 48, color: YEL, anim: { type: 'typewriter', at: at + 3 * K, cps: 30, cursor: false } }));
  }
});

// paket kuning yang lewat jalur
const pkt = s.layer('Paket', { x: W / 2, y: 900 });
pkt.circle(0, 0, 26, { fill: YEL, shadow: { color: 'rgba(255,210,63,0.8)', blur: 30 } });
pkt.key(0, { opacity: 0, y: 1230 }, 'hold');
pkt.key(6 * K, { opacity: 1, y: 1250 }, 'in-out-cubic').key(9 * K, { y: 1580 }, 'hold');
pkt.key(12 * K, { y: 1950 }, 'in-out-cubic').key(15 * K, { y: 2280 }, 'hold');
pkt.key(16 * K, { opacity: 1 }).key(16 * K + 6, { opacity: 0 });
s.sfx('whoosh', { at: 6 * K, dur: 0.6, volume: -16 });
s.sfx('whoosh', { at: 12 * K, dur: 0.6, volume: -16 });
s.sfx('success', { at: 15 * K, volume: -12 });

// stempel di akhir
const ok = s.layer('Stempel', { x: 760, y: 2780, rotation: -10 });
ok.rect(-250, -90, 500, 180, { stroke: YEL, strokeWidth: 8, r: 10, sketch: { roughness: 1.4, fill: 'none', seed: 3 } });
ok.text('SIAP JALAN', 0, 4, mono({ weight: 700, size: 70, color: YEL, align: 'center' }));
ok.key(0, { opacity: 0 }, 'hold').key(18 * K, { opacity: 1 });
ok.pop(18 * K, { from: 2.2, dur: 5, ease: 'out-quad', fade: false });
s.sfx('impact', { at: 18 * K, volume: -8 });

// kamera: judul → kotak 1 → 2 → 3 → zoom out lihat semua
const cy = (y) => y - H / 2;
s.camera.key(0, { x: 0, y: 0, zoom: 1 }, 'hold');
s.camera.key(3 * K, { y: 0 }, 'in-out-cubic').key(4 * K + 6, { y: cy(1060), zoom: 1 }, 'hold');
s.camera.key(9 * K, { y: cy(1060) }, 'in-out-cubic').key(10 * K + 6, { y: cy(1760) }, 'hold');
s.camera.key(15 * K, { y: cy(1760) }, 'in-out-cubic').key(16 * K + 6, { y: cy(2460) }, 'hold');
s.camera.key(17 * K, { y: cy(2460), zoom: 1 }, 'in-out-cubic').key(18 * K, { y: cy(1650), zoom: 0.58 });
s.sfx('swoosh', { at: 17 * K, dur: 0.8, volume: -14 });

p.sfx('beat', { at: 0, bpm: BPM, bars: 6, volume: -20, kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' });
p.sfx('pad', { at: 0, dur: 13, root: 110, chord: [0, 7, 12, 19], brightness: 600, volume: -24 });

export default p;
