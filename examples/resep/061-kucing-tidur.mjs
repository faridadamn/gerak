// 061 · Kucing tidur bernapas + "Zzz" melayang
// kategori: karakter
// fitur: napas = pulse scaleY dengan origin di dasar badan · huruf Z naik-memudar berulang (key loop) · jendela + bulan · Caveat
// pakai: "bisnis jalan saat tidur", konten santai/istirahat, maskot lucu, malam hari

import { project } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Kucing tidur', preset: 'reels', fps: 24, background: '#1b1f3b' });
const W = p.width;
const LANTAI = 1400;

const s = p.scene('Tidur', { duration: '6s' });

// jendela dengan bulan
const jendela = s.layer('Jendela');
jendela.rect(600, 300, 360, 440, { fill: '#2b3270', stroke: '#c5b8a5', strokeWidth: 18, r: 12 });
jendela.line(780, 300, 780, 740, { stroke: '#c5b8a5', strokeWidth: 12 });
jendela.line(600, 520, 960, 520, { stroke: '#c5b8a5', strokeWidth: 12 });
jendela.circle(870, 400, 50, { fill: '#fff3bf' });

// lantai + karpet
const lantai = s.layer('Lantai');
lantai.rect(0, LANTAI, W, 520, { fill: '#2a2f55' });
lantai.ellipse(W / 2, LANTAI + 20, 380, 70, { fill: '#e8590c', opacity: 0.8 });

// kucing: group di titik tengah bawah badan → scaleY berporos di lantai
const kucing = s.group('Kucing', { x: W / 2, y: LANTAI });
const badan = kucing.layer('Badan');
badan.ellipse(0, -110, 300, 130, { fill: '#ffa94d', stroke: INK, strokeWidth: 8 });
badan.path('M 250 -60 C 360 -40 380 -160 300 -190', { stroke: INK, strokeWidth: 26, lineCap: 'round', fill: 'none' }); // ekor (garis)
badan.path('M 250 -60 C 360 -40 380 -160 300 -190', { stroke: '#ffa94d', strokeWidth: 14, lineCap: 'round', fill: 'none' });
badan.circle(-200, -170, 110, { fill: '#ffa94d', stroke: INK, strokeWidth: 8 }); // kepala
badan.polygon([[-290, -230], [-270, -330], [-215, -260]], { fill: '#ffa94d', stroke: INK, strokeWidth: 8, lineJoin: 'round' });
badan.polygon([[-170, -270], [-120, -340], [-110, -250]], { fill: '#ffa94d', stroke: INK, strokeWidth: 8, lineJoin: 'round' });
badan.arc(-240, -170, 22, 20, 160, { stroke: INK, strokeWidth: 7 }); // mata terpejam
badan.arc(-160, -170, 22, 20, 160, { stroke: INK, strokeWidth: 7 });
// napas: naik turun pelan (pulse memakai scale; group berporos di lantai)
kucing.pulse({ amount: 0.025, period: 2.4 });

// Zzz: tiap huruf naik & memudar, diulang tiap 2 detik dengan jeda berbeda
const PERIODE = 48;
['z', 'Z', 'Z'].forEach((huruf, i) => {
  const z = s.layer(`Z ${i + 1}`, { x: W / 2 - 160 + i * 40, y: LANTAI - 330 });
  z.text(huruf, 0, 0, { font: 'Caveat', weight: 700, size: 70 + i * 20, color: '#dbe4ff', align: 'center', valign: 'middle' });
  z.key(0, { opacity: 0 }, 'hold');
  for (let t = i * 14; t < 144; t += PERIODE) {
    z.key(t, { y: LANTAI - 330, opacity: 0, scale: 0.6 }, 'out-sine')
      .key(t + 10, { opacity: 1 }, 'linear')
      .key(t + 40, { y: LANTAI - 620, opacity: 0, scale: 1.2 }, 'hold');
  }
});

const teks = s.layer('Teks', { fixed: true });
teks.text('Lu tidur,\npesanan tetap diproses.', W / 2, 1640, { font: 'Caveat', weight: 700, size: 84, color: '#ffffff', align: 'center', valign: 'middle', lineHeight: 1.05, anim: { type: 'lines', effect: 'fade', at: 24, stagger: 14, dur: 18 } });

p.sfx('pad', { at: 0, dur: 6, root: 174.6, chord: [0, 4, 7, 11, 14], brightness: 700, volume: -18 });

export default p;
