// 070 · Intro channel YouTube (16:9, 4 detik)
// kategori: konten
// fitur: preset youtube · pita miring menyapu layar (key x berantai) · logo pop + spin cincin · nama chars rise · riser → impact → chime
// pakai: intro/outro channel, opening video tutorial, bumper brand

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'YouTube intro', preset: 'youtube', fps: 30, background: '#0f1430' });
const W = p.width; // 1920
const H = p.height; // 1080

const s = p.scene('Intro', { duration: '4s' });

// 1) tiga pita miring menyapu dari kiri ke kanan bergantian
[TEAL, '#ffffff', BLUE].forEach((warna, i) => {
  const pita = s.layer(`Pita ${i + 1}`, { rotation: -18, y: H / 2 });
  pita.rect(-W, -110 + i * 40, W * 1.2, 120 - i * 30, { fill: warna });
  pita.key(i * 4, { x: -W * 0.3 }, 'in-out-expo').key(16 + i * 4, { x: W * 2.4 }); // keluar penuh di kanan
});

// 2) logo: lingkaran + segitiga, pop setelah pita lewat
const logo = s.layer('Logo', { x: W / 2, y: 430 });
logo.circle(0, 0, 130, { fill: TEAL });
logo.path('M -36 -62 L 70 0 L -36 62 Z', { fill: '#ffffff' });
logo.pop(20, { dur: 16 });
const cincin = s.layer('Cincin', { x: W / 2, y: 430 });
cincin.arc(0, 0, 170, 0, 260, { stroke: '#ffffff', strokeWidth: 8, draw: [24, 18, 'out-cubic'] });
cincin.spin({ speed: 120, from: 24 });

// 3) nama channel + tagline
const nama = s.layer('Nama', { fixed: true });
nama.text('Farid Adam', W / 2, 700, { size: 120, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'rise', at: 34, stagger: 1.5, dur: 12 } });
nama.text('otomasi · sistem · enablement', W / 2, 810, { size: 44, weight: 600, color: '#9fb0ff', align: 'center', valign: 'middle', letterSpacing: 4, anim: { type: 'chars', effect: 'fade', at: 52, stagger: 0.6 } });

// 4) keluar: semuanya zoom & fade di detik terakhir
for (const l of [logo, cincin, nama]) l.fadeOut('3.5s', 12);

s.sfx('riser', { at: 0, dur: 0.66, volume: -14 });
s.sfx('impact', { at: 20, volume: -8 });
s.sfx('chime', { at: 34, volume: -14 });

export default p;
