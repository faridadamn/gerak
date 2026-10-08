// 023 · Lingkaran ensō kuas kering + stempel
// kategori: brush
// fitur: brush dry (serat kering) dengan pressure dinamis · ellipsePoints terbuka · stempel merah pop · grain kertas · font Caveat
// pakai: konten reflektif/mindset, opening tenang, estetika Jepang/zen

import { project, ellipsePoints } from 'gerak';

const INK = '#141210';
const p = project({ title: 'Enso kuas kering', preset: 'reels', fps: 24, background: '#efe8da' });
p.effects({ grain: 0.1, vignette: 0.2 });
const W = p.width;

const s = p.scene('Enso', { duration: '6s' });

// 1) ensō: lingkaran yang tidak menutup, tebal di awal lalu menipis & mengering
const enso = s.layer('Enso');
enso.stroke(
  ellipsePoints(W / 2, 820, 300, 290, { start: 110, end: 440, n: 90, pressure: (t) => 1 - 0.75 * t }),
  { brush: 'dry', size: 90, color: INK, dryness: 0.75, reveal: [6, 30, 'in-out-sine'] },
);

// 2) stempel merah (kotak dengan inisial)
const cap = s.layer('Stempel', { x: 820, y: 1210, rotation: 4 });
cap.rect(-56, -56, 112, 112, { fill: '#c0392b', r: 8 });
cap.rect(-46, -46, 92, 92, { fill: 'none', stroke: '#efe8da', strokeWidth: 4, r: 4 });
cap.text('FA', 0, 4, { size: 54, weight: 800, color: '#efe8da', align: 'center', valign: 'middle' });
cap.pop(44, { dur: 8, from: 1.5, ease: 'out-quad' });

// 3) kalimat tenang
const teks = s.layer('Teks', { fixed: true });
teks.text('Pelan-pelan,\nasal berulang.', W / 2, 1400, { font: 'Caveat', weight: 700, size: 100, color: INK, align: 'center', valign: 'top', lineHeight: 1.05, anim: { type: 'lines', effect: 'blur', at: 56, stagger: 12, dur: 16 } });

s.sfx('swoosh', { at: 6, dur: 1.2, volume: -14, low: 200, high: 1200 });
s.sfx('tap', { at: 44, volume: -8, pitch: 110 });
p.sfx('pad', { at: 0, dur: 6, root: 146.8, chord: [0, 7, 12, 14], brightness: 900, volume: -20 });

export default p;
