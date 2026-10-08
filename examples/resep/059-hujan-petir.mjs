// 059 · Hujan deras + petir
// kategori: grafis
// fitur: lembar hujan berpola dari rng digerakkan linear (loop tanpa sambungan) · kilat petir (opacity hold) · awan float · payung siluet
// pakai: suasana sedih/sulit, "badai pasti berlalu", latar dramatis, cuaca

import { project, rng } from 'gerak';

const p = project({ title: 'Hujan petir', preset: 'reels', fps: 30, background: '#1c2433' });
const W = p.width;
const H = p.height;
const DUR = 5;

const s = p.scene('Hujan', { duration: `${DUR}s` });

// 1) lembar hujan: tinggi 6× layar, digeser ke bawah 5× layar selama scene (garis hujan acak tapi tetap)
const R = rng('hujan');
const hujan = s.layer('Hujan', { opacity: 0.6, skewX: -12 });
for (let i = 0; i < 420; i++) {
  const x = R() * (W + 400) - 200;
  const y = -5 * H + R() * 6 * H;
  const pjg = 40 + R() * 50;
  hujan.line(x, y, x, y + pjg, { stroke: '#a5b4cf', strokeWidth: 3 });
}
hujan.key(0, { y: 0 }, 'linear').key(`${DUR}s`, { y: 5 * H });

// 2) awan gelap melayang
const awan = s.layer('Awan', { y: 0 });
for (const [x, y, r] of [[150, 160, 200], [420, 120, 240], [720, 170, 220], [980, 130, 200]]) awan.circle(x, y, r, { fill: '#2b3445' });
awan.float({ amp: 10, period: 5, x: 20 });

// 3) siluet orang berpayung + genangan
const orang = s.layer('Orang', { x: W / 2, y: 1500 });
orang.path('M -260 -330 C -230 -480 230 -480 260 -330 Z', { fill: '#00B7B3' });
orang.line(0, -440, 0, -110, { stroke: '#0f1520', strokeWidth: 10 });
orang.circle(-10, -260, 46, { fill: '#0f1520' });
orang.path('M -70 -200 C -90 -100 -80 0 -60 80 L 50 80 C 70 0 70 -120 40 -200 Z', { fill: '#0f1520' });
orang.ellipse(0, 100, 240, 26, { fill: 'rgba(165,180,207,0.25)' });

// 4) petir: kilat putih + garis zig-zag, hanya beberapa frame
const PETIR = 70;
const kilat = s.layer('Kilat', { fixed: true });
kilat.rect(0, 0, W, H, { fill: '#ffffff' });
kilat.key(0, { opacity: 0 }, 'hold').key(PETIR, { opacity: 0.8 }, 'hold').key(PETIR + 2, { opacity: 0.1 }, 'hold').key(PETIR + 4, { opacity: 0.6 }, 'out-cubic').key(PETIR + 12, { opacity: 0 });
const zig = s.layer('Zigzag', { show: [PETIR, PETIR + 6] });
zig.polygon([[760, 260], [700, 480], [790, 470], [690, 760]], { closed: false, stroke: '#fff9db', strokeWidth: 12 });

const teks = s.layer('Teks', { fixed: true });
teks.text('Badai pasti berlalu.', W / 2, 720, { size: 92, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'blur', at: PETIR + 6, stagger: 5, dur: 14 } });

s.sfx('scratch', { at: 0, dur: DUR, volume: -24 }); // desis hujan
s.sfx('boom', { at: PETIR + 4, volume: -6 });

export default p;
