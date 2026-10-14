// Gaya 10 · Data signal (jurnalisme data: hitam + kuning sinyal)
// standar: satu angka raksasa · grafik digambar sebagai satu goresan · anotasi serif italic · 120 BPM
// pakai: insight angka, edukasi berbasis data, laporan bulanan, "fakta yang jarang orang tahu"
// catatan: angka di sini ILUSTRASI — ganti dengan data asli sebelum dipakai.

import { project, catmullRom, withPressure } from 'gerak';

const p = project({ title: 'Data signal', preset: 'reels', fps: 30, background: '#0B0B0B' });
const W = p.width;
const MONO = p.font('fonts/SpaceMono-Bold.ttf', { family: 'Space Mono', weight: 700 });
p.font('fonts/SpaceMono-Regular.ttf', { family: 'Space Mono', weight: 400 });
const SERIF = p.font('fonts/InstrumentSerif-Italic.ttf', { family: 'Instrument Serif', weight: 400, style: 'italic' });
const BPM = 120;
const K = (p.fps * 60) / BPM; // 15

const BLK = '#0B0B0B';
const YEL = '#FFE600';
const WHITE = '#F2F2F2';
const GREY = '#8C8C8C';
p.effects({ grain: 0.05 });

const mono = (o) => ({ font: MONO, weight: 700, color: WHITE, valign: 'middle', ...o });
const note = (o) => ({ font: SERIF, weight: 400, italic: true, color: WHITE, valign: 'middle', ...o });

// ---------------------------------------------------------------------
// 1. PERTANYAAN + ANGKA RAKSASA
// ---------------------------------------------------------------------
const s1 = p.scene('Angka', { duration: 8 * K });
s1.note({ action: 'Pertanyaan, angka 5 raksasa kuning, cincin timer tergambar, "menit"' });
const q = s1.layer('Tanya', { fixed: true });
q.text('Batas sabar pembeli\nnunggu balasan chat:', 80, 300, { weight: 800, size: 74, color: WHITE, valign: 'top', lineHeight: 1.15, anim: { type: 'lines', effect: 'rise', at: 2, stagger: 6, dur: 8 } });

const ring = s1.layer('Cincin', { x: W / 2, y: 1020, rotation: -90 });
ring.circle(0, 0, 400, { stroke: '#222', strokeWidth: 26 });
ring.arc(0, 0, 400, 0, 300, { stroke: YEL, strokeWidth: 26, lineCap: 'round', draw: [2 * K, 3 * K, 'in-out-cubic'] });
for (let i = 0; i < 60; i += 5) {
  const a = (i / 60) * Math.PI * 2;
  ring.line(Math.cos(a) * 450, Math.sin(a) * 450, Math.cos(a) * 480, Math.sin(a) * 480, { stroke: GREY, strokeWidth: 4 });
}
ring.fadeIn(K, 8);
s1.sfx('tick', { at: 2 * K, volume: -12 });
for (let b = 3; b < 6; b++) s1.sfx('tick', { at: b * K, volume: -14 });

const big = s1.layer('Lima', { x: W / 2, y: 980 });
big.text('5', 0, 0, mono({ size: 620, color: YEL, align: 'center' }));
big.key(0, { opacity: 0 }, 'hold').key(2 * K, { opacity: 1 });
big.pop(2 * K, { from: 0.4, dur: 8, ease: 'out-back', fade: false });
const unit = s1.layer('Menit', { x: W / 2, y: 1300 });
unit.text('MENIT', 0, 0, mono({ size: 96, align: 'center', letterSpacing: 18 }));
unit.slideIn(3 * K, { from: 'bottom', distance: 40, dur: 8 });
s1.sfx('impact', { at: 2 * K, volume: -8 });

// ---------------------------------------------------------------------
// 2. GRAFIK — satu goresan
// ---------------------------------------------------------------------
const s2 = p.scene('Grafik', { duration: 12 * K, background: BLK, transition: { type: 'push-left', duration: 10, ease: 'in-out-quart' } });
s2.note({ action: 'Sumbu tipis, kurva peluang closing digambar spidol kuning, titik di 5 menit berdenyut, anotasi serif' });

const X0 = 120, X1 = 980, Y0 = 1380, Y1 = 520;
const axis = s2.layer('Sumbu');
axis.line(X0, Y0, X1, Y0, { stroke: GREY, strokeWidth: 3, draw: [0, 10] });
axis.line(X0, Y0, X0, Y1, { stroke: GREY, strokeWidth: 3, draw: [0, 10] });
const ticks = ['1m', '5m', '15m', '30m', '1j'];
const tx = (i) => X0 + 40 + i * ((X1 - X0 - 60) / 4);
ticks.forEach((t, i) => axis.text(t, tx(i), Y0 + 56, { font: MONO, weight: 400, size: 46, color: GREY, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'fade', at: 6 + i * 2, dur: 6 } }));
const title = s2.layer('Judul grafik', { fixed: true });
title.text('Peluang closing', X0, 300, mono({ size: 86, valign: 'top' }));
title.text('vs waktu balas chat', X0, 410, mono({ size: 54, color: GREY, valign: 'top' }));
title.fadeIn(0, 8);

const PTS = [[tx(0), 590], [tx(1) - 40, 640], [tx(1), 700], [tx(1) + 70, 930], [tx(2), 1080], [tx(3), 1190], [tx(4), 1250]];
const curve = s2.layer('Kurva');
curve.stroke(withPressure(catmullRom(PTS, 90), 'flat'), { brush: 'marker', size: 16, color: YEL, reveal: [K, 3 * K, 'in-out-sine'] });
// area di bawah kurva tipis
s2.sfx('swoosh', { at: K, dur: 1.4, volume: -16 });

const dot = s2.layer('Titik', { x: tx(1), y: 700 });
dot.circle(0, 0, 26, { fill: YEL });
dot.circle(0, 0, 52, { stroke: YEL, strokeWidth: 4 });
dot.key(0, { opacity: 0 }, 'hold').key(2 * K + 4, { opacity: 1 });
dot.pop(2 * K + 4, { from: 0, dur: 8, ease: 'out-back', fade: false });
dot.pulse({ amount: 0.18, period: (2 * K) / 30, from: 3 * K });
s2.sfx('ding', { at: 2 * K + 4, volume: -10 });

const ann = s2.layer('Anotasi');
ann.text('di sini pembeli\nmulai pergi.', 450, 640, note({ size: 84, lineHeight: 1.0, valign: 'top', anim: { type: 'lines', effect: 'rise', at: 5 * K, stagger: 6, dur: 10 } }));
ann.stroke(withPressure(catmullRom([[460, 700], [380, 690], [tx(1) + 70, 700]], 20), 'taper'), { brush: 'pen', size: 6, color: WHITE, reveal: [5 * K + 14, 8, 'out-cubic'] });

const foot = s2.layer('Catatan kaki', { fixed: true });
foot.text('*ilustrasi, bukan data riset', X0, 495, { font: MONO, weight: 400, size: 40, color: GREY, valign: 'middle', anim: { type: 'words', effect: 'fade', at: 6 * K, dur: 8 } });
s2.camera.key(0, { zoom: 1 }, 'hold').key(4 * K, { zoom: 1 }, 'in-out-cubic').key(6 * K, { zoom: 1.07, x: -40, y: -120 }, 'hold').key(10 * K, { zoom: 1.07, x: -40, y: -120 }, 'in-out-cubic').key(11 * K + 10, { zoom: 1, x: 0, y: 0 });

// ---------------------------------------------------------------------
// 3. CEPAT = LAKU
// ---------------------------------------------------------------------
const s3 = p.scene('Simpulan', { duration: 6 * K, background: BLK, transition: { type: 'cut' } });
s3.note({ action: 'Layar terbelah kuning/hitam, CEPAT masuk dari kiri, = LAKU dari kanan' });
const topH = s3.layer('Atas');
topH.rect(0, 0, W, 960, { fill: YEL });
topH.wipeIn(0, { dir: 'right', dur: 7, ease: 'out-expo', rect: [0, 0, W, 960] });
const t1 = s3.layer('Cepat', { x: W / 2, y: 600 });
t1.text('CEPAT', 0, 0, mono({ size: 250, color: BLK, align: 'center', fit: 960 }));
t1.slideIn(4, { from: 'left', distance: 300, dur: 8, ease: 'out-expo' });
const t2 = s3.layer('Laku', { x: W / 2, y: 1240 });
t2.text('= LAKU', 0, 0, mono({ size: 250, color: YEL, align: 'center', fit: 960 }));
t2.key(0, { opacity: 0 }, 'hold').key(K, { opacity: 1 });
t2.slideIn(K, { from: 'right', distance: 300, dur: 8, ease: 'out-expo', fade: false });
s3.sfx('whoosh', { at: 0, dur: 0.4, volume: -10 });
s3.sfx('impact', { at: K, volume: -6 });
const sub = s3.layer('Sub', { fixed: true });
sub.text('balas di bawah 5 menit.', W / 2, 1450, { font: SERIF, weight: 400, italic: true, size: 84, color: WHITE, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'fade', at: 2 * K, stagger: 3, dur: 8 } });

p.sfx('beat', { at: 0, bpm: BPM, bars: 7, volume: -18, kick: 'x.......x.......', snare: '....x.......x...', hat: 'x.x.x.x.x.x.x.x.' });
p.sfx('pad', { at: 0, dur: 13, root: 110, chord: [0, 3, 7, 10], brightness: 500, volume: -24 });

export default p;
