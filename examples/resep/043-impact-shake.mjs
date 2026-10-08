// 043 · Hantaman teks + guncangan kamera
// kategori: kamera
// fitur: key scale besar → normal (slam) · camera.shake decay · sinar sunburst (polygon berulang) spin · flash · boom/impact
// pakai: angka hasil besar, momen klimaks, "plot reveal", konten hype

import { project } from 'gerak';

const p = project({ title: 'Impact shake', preset: 'reels', fps: 30, background: '#ff6b00' });
const W = p.width;
const H = p.height;
const HIT = 18;

const s = p.scene('Impact', { duration: '3.5s' });

// 1) sunburst: segitiga tipis melingkar, berputar pelan
const sinar = s.layer('Sinar', { x: W / 2, y: 900, opacity: 0.25 });
for (let i = 0; i < 18; i++) {
  const a = (i / 18) * Math.PI * 2;
  const b = a + Math.PI / 18;
  sinar.polygon([[0, 0], [Math.cos(a) * 1600, Math.sin(a) * 1600], [Math.cos(b) * 1600, Math.sin(b) * 1600]], { fill: '#ffd43b' });
}
sinar.spin({ speed: 12 });
sinar.key(0, { scale: 0 }, 'hold').key(HIT, { scale: 0.3 }, 'out-expo').key(HIT + 12, { scale: 1 });

// 2) teks: jatuh dari skala 3 ke 1 tepat di frame HIT
const teks = s.layer('Teks', { x: W / 2, y: 900 });
teks.text('OMZET', 0, -130, { size: 150, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 8 });
teks.text('10X', 0, 90, { size: 330, weight: 800, color: '#14161f', align: 'center', valign: 'middle', stroke: '#ffffff', strokeWidth: 10 });
teks.key(0, { scale: 3.2, opacity: 0 }, 'in-expo').key(HIT, { scale: 1, opacity: 1 }, 'out-back').key(HIT + 8, { scale: 1.06 }).key(HIT + 16, { scale: 1 });

// 3) guncangan kamera mulai saat menghantam, mereda (decay)
s.camera.shake({ amp: 26, freq: 20, rot: 1.5, from: HIT, to: HIT + 24, decay: true });

// 4) kilatan
const kilat = s.layer('Kilat', { fixed: true });
kilat.rect(0, 0, W, H, { fill: '#ffffff' });
kilat.key(0, { opacity: 0 }, 'hold').key(HIT, { opacity: 0.9 }, 'out-cubic').key(HIT + 6, { opacity: 0 });

const sub = s.layer('Sub', { fixed: true });
sub.text('dalam 3 bulan', W / 2, 1330, { size: 70, weight: 700, color: '#ffffff', align: 'center', anim: { type: 'words', effect: 'rise', at: HIT + 16, stagger: 4 } });

s.sfx('riser', { at: 0, dur: HIT / 30, volume: -14 });
s.sfx('boom', { at: HIT, volume: -6 });
s.sfx('impact', { at: HIT, volume: -10 });

export default p;
