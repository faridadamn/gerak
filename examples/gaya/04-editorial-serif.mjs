// Gaya 04 · Editorial / majalah (serif italic, tenang, mewah)
// standar: serif raksasa · garis tipis · foto dalam bingkai lengkung (clip) · ritme lambat 75 BPM
// pakai: brand story, produk premium/handmade, profil usaha, konten "di balik layar"

import { project, catmullRom, withPressure } from 'gerak';

const p = project({ title: 'Editorial serif', preset: 'reels', fps: 30, background: '#F2ECE2' });
const W = p.width;
const SERIF = p.font('fonts/InstrumentSerif-Regular.ttf', { family: 'Instrument Serif', weight: 400 });
p.font('fonts/InstrumentSerif-Italic.ttf', { family: 'Instrument Serif', weight: 400, style: 'italic' });
const BPM = 75;
const K = (p.fps * 60) / BPM; // 24 frame per ketuk

const PAPER = '#F2ECE2';
const INK = '#1C1B18';
const TERRA = '#9A4A2E';
const MUTED = '#77705F';
p.effects({ grain: 0.06, vignette: 0.1 });

const serif = (o) => ({ font: SERIF, weight: 400, color: INK, valign: 'baseline', ...o });
const caps = (o) => ({ weight: 700, size: 44, color: MUTED, letterSpacing: 8, case: 'upper', valign: 'middle', ...o });

function masthead(s, right) {
  const m = s.layer('Masthead', { fixed: true });
  m.text('Lereng', 80, 200, caps({ color: INK, size: 46 }));
  m.text(right, 1000, 200, caps({ align: 'right' }));
  m.line(80, 250, 1000, 250, { stroke: INK, strokeWidth: 2, draw: [0, 18, 'out-cubic'] });
  return m;
}

// ---------------------------------------------------------------------
// 1. SAMPUL — foto di bingkai lengkung + judul italic
// ---------------------------------------------------------------------
const s1 = p.scene('Sampul', { duration: 8 * K });
s1.note({ action: 'Masthead, foto dalam bingkai lengkung pelan zoom out, judul serif italic naik per baris' });
masthead(s1, 'Edisi 07 — Okt');

// bingkai lengkung: path di ruang lokal group (pusat atas lengkung di 0,0)
const AW = 820, AH = 820;
const arch = `M ${-AW / 2} ${AH} L ${-AW / 2} ${AW / 2} A ${AW / 2} ${AW / 2} 0 0 1 ${AW / 2} ${AW / 2} L ${AW / 2} ${AH} Z`;
const frame = s1.group('Bingkai', { x: W / 2, y: 330, clip: { d: arch } });
const photo = frame.layer('Foto');
photo.image('../resep/assets/pemandangan.jpg', 0, AH / 2, { width: AW + 160, height: AH + 160, anchor: 'center', fit: 'cover' });
photo.key(0, { scale: 1.25 }, 'out-cubic').key(8 * K, { scale: 1.02 });
frame.wipeIn(4, { dir: 'up', dur: 30, ease: 'in-out-cubic', rect: [-AW / 2 - 10, -10, AW + 20, AH + 20] });
const outline = s1.layer('Garis bingkai', { x: W / 2, y: 330 });
outline.path(arch, { stroke: INK, strokeWidth: 2, draw: [10, 30, 'in-out-cubic'] });
s1.sfx('swoosh', { at: 4, dur: 1.2, volume: -11 });

const head = s1.layer('Judul', { fixed: true });
head.text('Dipetik', 80, 1360, serif({ size: 210, anim: { type: 'words', effect: 'rise', at: 2 * K, dur: 18, distance: 60 } }));
head.text('pelan-pelan.', 80, 1540, serif({ size: 210, italic: true, color: TERRA, fit: 920, anim: { type: 'words', effect: 'rise', at: 3 * K, dur: 18, distance: 60 } }));
s1.sfx('chime', { at: 3 * K, volume: -10 });
s1.camera.push({ zoom: 1.03 });

// ---------------------------------------------------------------------
// 2. TIGA BABAK — angka romawi, garis tipis
// ---------------------------------------------------------------------
const s2 = p.scene('Babak', { duration: 9 * K, background: PAPER, transition: { type: 'fade', duration: 18, ease: 'in-out-sine' } });
s2.note({ action: 'I/II/III muncul tiap 2 ketuk, garis tipis tergambar, coretan pena di "seminggu sekali"' });
masthead(s2, 'Cara kami');

const ACTS = [
  ['I.', 'Dipetik', 'tangan.'],
  ['II.', 'Disangrai', 'seminggu sekali.'],
  ['III.', 'Dikirim', 'ke rumahmu.'],
];
ACTS.forEach(([n, a, b], i) => {
  const at = 6 + i * 2 * K;
  const y = 500 + i * 450;
  const l = s2.layer(`Babak ${n}`, { fixed: true });
  l.text(n, 80, y, serif({ size: 72, italic: true, color: TERRA, anim: { type: 'words', effect: 'fade', at, dur: 14 } }));
  l.text(a, 240, y, serif({ size: 170, anim: { type: 'words', effect: 'rise', at: at + 4, dur: 16, distance: 40 } }));
  l.text(b, 240, y + 150, serif({ size: 130, italic: true, color: MUTED, fit: 760, anim: { type: 'words', effect: 'rise', at: at + 10, stagger: 4, dur: 16, distance: 40 } }));
  if (i < 2) l.line(80, y + 245, 1000, y + 245, { stroke: INK, strokeWidth: 2, draw: [at + 14, 20, 'out-cubic'] });
  s2.sfx('tap', { at: at + 4, volume: -9, pitch: 0.8 });
});
const pen = s2.layer('Pena');
pen.stroke(withPressure(catmullRom([[240, 1120], [480, 1136], [760, 1116], [960, 1126]], 40), 'taper'), {
  brush: 'ink', size: 10, color: TERRA, reveal: [2 * K + 30, 18, 'in-out-sine'],
});

// ---------------------------------------------------------------------
// 3. PENUTUP — nama brand raksasa
// ---------------------------------------------------------------------
const s3 = p.scene('Penutup', { duration: 7 * K, background: INK, transition: { type: 'dip', color: INK, duration: 16 } });
s3.note({ action: 'Latar gelap, "Kopi Lereng." serif raksasa, daun digambar pena, ajakan pesan' });
const brand = s3.layer('Brand', { fixed: true });
brand.text('Kopi', W / 2, 820, serif({ size: 300, color: PAPER, align: 'center', anim: { type: 'chars', effect: 'blur', at: 8, stagger: 3, dur: 18 } }));
brand.text('Lereng.', W / 2, 1100, serif({ size: 300, italic: true, color: '#E2A27E', align: 'center', anim: { type: 'chars', effect: 'blur', at: 20, stagger: 3, dur: 18 } }));

const leaf = s3.layer('Daun', { x: 860, y: 520, rotation: 20 });
leaf.stroke('M 0 120 C -60 60 -40 -40 0 -110 C 40 -40 60 60 0 120', { brush: 'ink', size: 6, color: PAPER, reveal: [2 * K, 24, 'in-out-sine'] });
leaf.stroke('M 0 110 L 0 -90', { brush: 'pen', size: 4, color: PAPER, reveal: [2 * K + 10, 18, 'in-out-sine'] });
const rule = s3.layer('Garis');
rule.line(340, 1250, 740, 1250, { stroke: PAPER, strokeWidth: 2, draw: [3 * K, 18, 'out-cubic'] });
const cta = s3.layer('Ajakan', { fixed: true });
cta.text('pesan lewat WhatsApp', W / 2, 1340, caps({ color: PAPER, size: 48, align: 'center', anim: { type: 'words', effect: 'fade', at: 3 * K + 8, stagger: 4, dur: 14 } }));
s3.sfx('chime', { at: 20, volume: -9 });

p.sfx('pad', { at: 0, dur: 24 * K / 30, root: 146.8, chord: [0, 7, 11, 16], brightness: 700, volume: -12 });
p.sfx('beat', { at: 0, bpm: BPM, bars: 6, volume: -15, kick: 'x.......x.......', snare: '........x.......', hat: '..x...x...x...x.' });

export default p;
