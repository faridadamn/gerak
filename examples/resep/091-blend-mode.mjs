// 091 · Blend mode: screen vs multiply
// kategori: lanjut
// fitur: opsi layer blend ('screen', 'multiply', 'overlay', 'difference'…) · lingkaran RGB bergerak (float beda fase) · dua panel perbandingan
// pakai: efek cahaya (screen), bayangan/tinta (multiply), tekstur & overlay warna, gaya poster

import { project } from 'gerak';

const p = project({ title: 'Blend mode', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;
const H = p.height;

const s = p.scene('Blend', { duration: '6s' });

// panel atas gelap (screen = mencerahkan), panel bawah terang (multiply = menggelapkan)
const latar = s.layer('Latar');
latar.rect(0, 0, W, H / 2, { fill: '#0b0d17' });
latar.rect(0, H / 2, W, H / 2, { fill: '#fdfcf7' });

const panel = [
  { blend: 'screen', y: H / 4 + 40, warna: ['#ff2a55', '#22e06b', '#2a7bff'], label: "blend: 'screen'", teks: '#ffffff' },
  { blend: 'multiply', y: (3 * H) / 4 + 20, warna: ['#00d5ff', '#ff3bd5', '#ffe600'], label: "blend: 'multiply'", teks: '#14161f' },
];
for (const pn of panel) {
  pn.warna.forEach((c, i) => {
    const a = (i / 3) * Math.PI * 2 - Math.PI / 2;
    const l = s.layer(`${pn.blend} ${i + 1}`, { x: W / 2 + Math.cos(a) * 110, y: pn.y + Math.sin(a) * 110, blend: pn.blend });
    l.circle(0, 0, 200, { fill: c });
    l.float({ amp: 40, x: 40, period: 3, phase: i / 3 });
  });
  const t = s.layer(`Label ${pn.blend}`, { fixed: true });
  t.text(pn.label, 70, pn.y - 330, { size: 46, weight: 800, color: pn.teks });
}

export default p;
