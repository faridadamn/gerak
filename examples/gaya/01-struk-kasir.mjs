// Gaya 01 · Struk kasir (thermal receipt)
// standar: layar penuh · teks ≥ 44px · sinkron 100 BPM · fitur khas: coretan pulpen (brush) + stempel sketch
// pakai: konten "jualan langsung tanpa potongan", rekap pesanan, promo kasir, konten UMKM F&B

import { project, catmullRom, withPressure, ellipsePoints } from 'gerak';

const p = project({ title: 'Struk kasir', preset: 'reels', fps: 30, background: '#1F3B30' });
const W = p.width;
const MONO = p.font('fonts/SpaceMono-Regular.ttf', { family: 'Space Mono', weight: 400 });
p.font('fonts/SpaceMono-Bold.ttf', { family: 'Space Mono', weight: 700 });
const BPM = 100;
const K = (p.fps * 60) / BPM; // 18 frame per ketuk

const PAPER = '#F7F3EA';
const INK = '#1A1A1A';
const RED = '#D7261E';
const GREEN = '#1F3B30';
p.effects({ grain: 0.06, vignette: 0.28 });

// ---------------------------------------------------------------------
// 1. STRUK KELUAR DARI PRINTER — tiap baris dicetak di ketukan
// ---------------------------------------------------------------------
const s1 = p.scene('Cetak', { duration: 14 * K });
s1.note({ action: 'Struk keluar dari printer baris demi baris, komisi dicoret pulpen merah, stempel LUNAS' });

const X0 = 80;           // tepi kiri struk
const RW = 920;           // lebar struk
const LH = 88;            // tinggi baris
const mono = (o = {}) => ({ font: MONO, size: 54, color: INK, valign: 'middle', ...o });

const LINES = [
  { t: 'TOKO KITA', o: { size: 100, weight: 700, align: 'center' }, center: true, h: 120 },
  { t: 'struk #0718 · 14/10', o: { size: 46, color: '#6B6B6B', align: 'center' }, center: true },
  { rule: true },
  { l: 'Kopi susu x2', r: '36.000' },
  { l: 'Roti bakar x1', r: '22.000' },
  { l: 'Ongkir', r: '10.000' },
  { rule: true },
  { l: 'Subtotal', r: '68.000' },
  { l: 'Komisi 15%', r: '-10.200', id: 'komisi' },
  { rule: true },
  { total: true, h: 140 },
];

// printer di bawah, struk naik keluar dari mulutnya. Group induk diam + clip, group anak bergerak.
const SLOT = 1560;
const frame = s1.group('Area struk', { clip: { rect: [0, 0, W, SLOT] } });
const paper = frame.group('Struk');

let y = 60;
const rows = [];
LINES.forEach((ln) => { const h = ln.h ?? LH; rows.push({ ...ln, y: y + h / 2, h }); y += h; });
const PH = y + 70; // tinggi kertas
const FINAL_Y = SLOT - PH - 10;

const sheet = paper.layer('Kertas');
const zig = [];
for (let x = 0; x <= RW; x += 30) zig.push([X0 + x, PH + (x / 30) % 2 * 22]);
sheet.polygon([[X0, 0], [X0 + RW, 0], ...zig.reverse()], { fill: PAPER, closed: true, shadow: { color: 'rgba(0,0,0,0.35)', blur: 40, y: 18 } });

const txt = paper.layer('Isi');
const PRINT_AT = (i) => 6 + i * (K / 2);   // tiap setengah ketuk satu baris
rows.forEach((r, i) => {
  const at = PRINT_AT(i);
  const show = [at, null];
  if (r.rule) txt.line(X0 + 40, r.y, X0 + RW - 40, r.y, { stroke: INK, strokeWidth: 3, dash: [10, 10], show });
  else if (r.center) txt.text(r.t, X0 + RW / 2, r.y, mono({ ...r.o, show }));
  else if (r.total) {
    txt.text('TOTAL', X0 + 40, r.y, mono({ size: 76, weight: 700, show }));
    txt.text('Rp68.000', X0 + RW - 40, r.y, mono({ size: 92, weight: 700, align: 'right', show, anim: { type: 'count', from: 57800, to: 68000, at: 10 * K, dur: 14, prefix: 'Rp', ease: 'out-cubic' } }));
  } else {
    txt.text(r.l, X0 + 40, r.y, mono({ show, id: r.id }));
    txt.text(r.r, X0 + RW - 40, r.y, mono({ align: 'right', show }));
  }
  s1.sfx('tick', { at, volume: -12, pitch: 1400 + (i % 3) * 120 });
});

// kertas naik setiap satu baris tercetak (baris terakhir selalu tepat di atas mulut printer)
paper.key(0, { y: SLOT }, 'hold');
rows.forEach((r, i) => paper.key(PRINT_AT(i), { y: SLOT - (r.y + r.h / 2) - 20 }, 'out-cubic'));
paper.key(PRINT_AT(rows.length - 1) + 8, { y: FINAL_Y });

// mulut printer (di atas segalanya)
const printer = s1.layer('Printer');
printer.rect(90, SLOT, W - 180, 200, { fill: '#121212', r: [0, 0, 24, 24] });
printer.rect(120, SLOT, W - 240, 18, { fill: '#000' });
printer.circle(W - 170, SLOT + 80, 12, { fill: '#3BD16F' });
printer.text('KASIR', 150, SLOT + 82, { font: MONO, weight: 700, size: 40, color: '#5C5C5C', valign: 'middle', letterSpacing: 6 });

// coretan pulpen merah di baris komisi + tulisan tangan "0"
const komisiRow = rows.find((r) => r.id === 'komisi');
const yK = FINAL_Y + komisiRow.y;
const STRIKE = 8 * K;
const pen = s1.layer('Pulpen');
pen.stroke(withPressure(catmullRom([[X0 + 30, yK + 6], [X0 + 380, yK - 6], [X0 + RW - 20, yK + 4]], 30), 'swell'), {
  brush: 'ink', size: 14, color: RED, reveal: [STRIKE, 8, 'out-cubic'],
});
pen.stroke(withPressure(catmullRom([[X0 + 40, yK - 8], [X0 + 420, yK + 10], [X0 + RW - 30, yK - 6]], 30), 'swell'), {
  brush: 'ink', size: 12, color: RED, reveal: [STRIKE + 5, 8, 'out-cubic'],
});
const nol = s1.layer('Nol', { x: X0 + RW - 250, y: yK - 20, rotation: -8 });
nol.text('0', 0, 0, { font: 'Caveat', weight: 700, size: 150, color: RED, align: 'center', valign: 'middle' });
nol.key(0, { opacity: 0 }, 'hold').key(STRIKE + 12, { opacity: 1 });
nol.pop(STRIKE + 12, { from: 1.6, dur: 6, fade: false });
s1.sfx('scratch', { at: STRIKE, dur: 0.4, volume: -10 });

// stempel LUNAS
const STAMP = 11 * K;
const stamp = s1.layer('Stempel', { x: X0 + RW / 2 + 40, y: FINAL_Y + rows[4].y, rotation: -10 });
stamp.rect(-270, -95, 540, 190, { stroke: RED, strokeWidth: 10, r: 12, sketch: { roughness: 1.2, passes: 1, fill: 'none', seed: 4 } });
stamp.text('LUNAS', 0, 4, { font: MONO, weight: 700, size: 136, color: RED, align: 'center', valign: 'middle', letterSpacing: 6 });
stamp.key(0, { opacity: 0 }, 'hold').key(STAMP, { opacity: 0.92 });
stamp.pop(STAMP, { from: 2.4, dur: 5, ease: 'out-quad', fade: false });
s1.sfx('impact', { at: STAMP, volume: -6 });
s1.camera.key(0, { zoom: 1 }, 'in-out-sine').key(10 * K, { zoom: 1.04, y: 30 });
s1.camera.shake({ amp: 16, freq: 20, from: STAMP + 4, to: STAMP + 12, decay: true });

// ---------------------------------------------------------------------
// 2. PUNCHLINE
// ---------------------------------------------------------------------
const s2 = p.scene('Punchline', { duration: 8 * K, background: PAPER, transition: { type: 'wipe-up', duration: 8, ease: 'in-out-quart' } });
s2.note({ action: 'Struk lu, uang lu. Teks mono raksasa menghentak per ketuk' });

const big = (t, y, at, c = INK) => {
  const l = s2.layer(t, { x: 80, y });
  l.text(t, 0, 0, { font: MONO, weight: 700, size: 250, color: c, valign: 'middle', fit: 920 });
  l.key(0, { opacity: 0 }, 'hold').key(at, { opacity: 1 });
  l.slideIn(at, { from: 'left', distance: 90, dur: 6, fade: false });
  s2.sfx('kick', { at, volume: -8 });
  return l;
};
big('STRUK', 380, 2);
big('LU,', 640, 2 + K);
big('UANG', 940, 2 + 2 * K, RED);
big('LU.', 1200, 2 + 3 * K, RED);

const circ = s2.layer('Lingkar');
circ.stroke(ellipsePoints(390, 945, 380, 165, { start: 190, end: 560, n: 80, pressure: (t) => 0.4 + 0.6 * Math.sin(Math.PI * t) }), {
  brush: 'ink', size: 16, color: INK, reveal: [3 * K + 6, 12, 'in-out-sine'],
});
s2.sfx('swoosh', { at: 3 * K + 6, dur: 0.4, volume: -14 });

const tear = s2.layer('Garis');
tear.line(80, 1380, 1000, 1380, { stroke: INK, strokeWidth: 4, dash: [14, 12], draw: [4 * K, 10] });
const sub = s2.layer('Sub', { fixed: true });
sub.text('jualan langsung,\ntanpa potongan komisi.', 80, 1430, { font: MONO, size: 54, color: '#333', valign: 'top', lineHeight: 1.35, anim: { type: 'lines', effect: 'rise', at: 4 * K + 6, stagger: 6, dur: 8 } });
s2.camera.push({ zoom: 1.04 });

// musik
p.sfx('beat', { at: 0, bpm: BPM, bars: 6, volume: -18, kick: 'x.....x...x.....', snare: '....x.......x...', hat: '..x...x...x...x.' });

export default p;
