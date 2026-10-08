// 024 · Papan neon menyala berkedip
// kategori: brush
// fitur: brush neon (glow) · teks dengan shadow glow · blink (kedip) di awal · dinding bata dari rect · tone sebagai dengung
// pakai: suasana malam/kafe, "OPEN", promo hiburan, estetika retro

import { project } from 'gerak';

const PINK = '#ff4fd8';
const CYAN = '#3ff0ff';
const p = project({ title: 'Neon sign', preset: 'reels', fps: 30, background: '#120d16' });
p.effects({ vignette: 0.5 });
const W = p.width;
const H = p.height;

const s = p.scene('Neon', { duration: '5s' });

// 1) dinding bata gelap
const bata = s.layer('Bata', { opacity: 0.55 });
for (let row = 0; row < 26; row++) {
  for (let col = -1; col < 8; col++) {
    const x = col * 150 + (row % 2 ? 75 : 0);
    bata.rect(x + 4, row * 76 + 4, 142, 68, { fill: row % 3 ? '#2a1d26' : '#24182a', r: 4 });
  }
}

// 2) hati neon (stroke dengan brush neon = garis bercahaya)
const hati = s.layer('Hati', { x: W / 2, y: 760 });
hati.stroke('M 0 120 C -40 80 -220 -20 -200 -140 C -185 -230 -60 -240 0 -150 C 60 -240 185 -230 200 -140 C 220 -20 40 80 0 120', { brush: 'neon', size: 14, color: PINK, glowColor: PINK, pressure: 1 });
hati.blink({ period: 0.12, duty: 0.5, from: 8, to: 26 }); // kedip saat dinyalakan
hati.key(0, { opacity: 0 }, 'hold').key(8, { opacity: 1 });
hati.pulse({ amount: 0.03, period: 1.2, from: 30 });

// 3) tulisan neon: warna terang + glow lewat shadow
const tulisan = s.layer('Tulisan', { fixed: true });
const glow = (c) => ({ color: '#ffffff', shadow: { color: c, blur: 40, x: 0, y: 0 } });
tulisan.text('BUKA', W / 2, 1150, { size: 190, weight: 800, align: 'center', valign: 'middle', letterSpacing: 18, ...glow(CYAN), anim: { type: 'chars', effect: 'none', at: 30, stagger: 5 } });
tulisan.text('sampai jam 2 pagi', W / 2, 1330, { font: 'Caveat', weight: 700, size: 92, align: 'center', valign: 'middle', ...glow(PINK), anim: { type: 'lines', effect: 'fade', at: 56, dur: 8 } });

// dengung neon: nada rendah sangat pelan + klik saat menyala
s.sfx('tone', { at: 8, dur: 4.2, freq: 110, wave: 'saw', volume: -34 });
for (const at of [8, 30, 35, 40, 45]) s.sfx('click', { at, volume: -14 });

export default p;
