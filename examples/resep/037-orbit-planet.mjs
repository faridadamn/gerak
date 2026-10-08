// 037 · Orbit planet (group bersarang berputar)
// kategori: grafis
// fitur: spin pada group (anak ikut berputar) · group bersarang (bulan mengorbit planet) · blink bintang · radial glow · dash orbit
// pakai: ekosistem produk, "semua terhubung", penjelasan hub & integrasi, intro sci-fi

import { project, rng } from 'gerak';

const p = project({ title: 'Orbit planet', preset: 'reels', fps: 30, background: '#070a18' });
const W = p.width;
const H = p.height;
const CX = W / 2;
const CY = 1000;

const s = p.scene('Orbit', { duration: '6s' });

// 1) bintang berkedip (5 kelompok dengan periode berbeda)
const R = rng('bintang');
for (let g = 0; g < 5; g++) {
  const l = s.layer(`Bintang ${g + 1}`);
  for (let i = 0; i < 24; i++) l.circle(R() * W, R() * H, 1.5 + R() * 2.5, { fill: '#ffffff', opacity: 0.4 + R() * 0.6 });
  l.blink({ period: 1.2 + g * 0.37, duty: 0.7 });
}

// 2) matahari dengan cahaya
const pusat = s.layer('Pusat', { x: CX, y: CY });
pusat.circle(0, 0, 260, { fill: { type: 'radial', stops: [[0, 'rgba(0,183,179,0.55)'], [1, 'rgba(0,183,179,0)']] } });
pusat.circle(0, 0, 110, { fill: '#00B7B3' });
pusat.text('BISNIS', 0, 0, { size: 46, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 4 });
pusat.pulse({ amount: 0.04, period: 2 });

// 3) orbit: group di pusat yang berputar; planet digambar di (radius, 0)
const orbit = [
  { r: 260, uk: 46, c: '#FFD43B', speed: 60, sudut: 0 },
  { r: 400, uk: 62, c: '#ff8787', speed: 36, sudut: 120 },
  { r: 520, uk: 54, c: '#74c0fc', speed: 24, sudut: 230 },
];
orbit.forEach((o, i) => {
  const cincin = s.layer(`Cincin ${i + 1}`, { x: CX, y: CY });
  cincin.circle(0, 0, o.r, { fill: 'none', stroke: 'rgba(255,255,255,0.32)', strokeWidth: 4, dash: [12, 14] });
  const g = s.group(`Orbit ${i + 1}`, { x: CX, y: CY, rotation: o.sudut });
  g.spin({ speed: o.speed });
  g.layer(`Planet ${i + 1}`).circle(o.r, 0, o.uk, { fill: o.c });
  if (i === 1) {
    // bulan: group di posisi planet, berputar lebih cepat
    const bulan = g.group('Orbit bulan', { x: o.r, y: 0 });
    bulan.spin({ speed: -180 });
    bulan.layer('Bulan').circle(100, 0, 20, { fill: '#e9ecef' });
  }
  g.zoomIn(i * 6, { from: 0.4, dur: 20 });
});

const teks = s.layer('Judul', { fixed: true });
teks.text('Semua terhubung.', W / 2, 260, { size: 92, weight: 800, color: '#ffffff', align: 'center', anim: { type: 'words', effect: 'blur', at: 10, stagger: 6, dur: 14 } });

p.sfx('pad', { at: 0, dur: 6, root: 110, chord: [0, 7, 12, 19], brightness: 800, volume: -16 });

export default p;
