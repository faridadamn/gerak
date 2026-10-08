// 052 · Efek glitch RGB split
// kategori: transisi
// fitur: salinan teks merah/cyan dengan blend screen · shake dengan jendela waktu (from/to) · garis distorsi blink · flash · glitch sfx
// pakai: transisi gaya digital/tech, "versi baru", reveal produk tech, error → solved

import { project } from 'gerak';

const p = project({ title: 'Glitch RGB', preset: 'reels', fps: 30, background: '#0a0a0f' });
const W = p.width;

// teks dengan efek RGB split: 3 lapis (merah, cyan, putih) — lapis warna digeser + digoyang saat glitch
function teksGlitch(scene, teks, y, jendela) {
  const gaya = { size: 150, weight: 800, align: 'center', valign: 'middle', case: 'upper', letterSpacing: 4 };
  const merah = scene.layer(`${teks} merah`, { x: W / 2 - 6, y, blend: 'screen' });
  merah.text(teks, 0, 0, { ...gaya, color: '#ff1f4b' });
  const cyan = scene.layer(`${teks} cyan`, { x: W / 2 + 6, y, blend: 'screen' });
  cyan.text(teks, 0, 0, { ...gaya, color: '#1fe3ff' });
  const putih = scene.layer(`${teks} putih`, { x: W / 2, y, blend: 'screen' });
  putih.text(teks, 0, 0, { ...gaya, color: '#ffffff' });
  for (const [a, b] of jendela) {
    merah.shake({ amp: 30, freq: 25, from: a, to: b });
    cyan.shake({ amp: 30, freq: 25, from: a, to: b, seed: 7 });
    putih.shake({ amp: 8, freq: 25, from: a, to: b, seed: 3 });
  }
}

// garis-garis distorsi horizontal yang berkedip saat glitch
function garisDistorsi(scene, a, b) {
  const l = scene.layer('Distorsi', { fixed: true, show: [a, b] });
  for (const [y, h, c] of [[700, 26, '#1fe3ff'], [860, 12, '#ff1f4b'], [1010, 40, '#ffffff'], [1180, 18, '#1fe3ff']]) l.rect(0, y, W, h, { fill: c, opacity: 0.35 });
  l.blink({ period: 0.1, duty: 0.5 });
  l.shake({ amp: 60, freq: 30 });
}

const s1 = p.scene('Lama', { duration: '2.2s' });
teksGlitch(s1, 'versi lama', 900, [[0, 6], [50, 66]]);
garisDistorsi(s1, 50, 66);
s1.sfx('glitch', { at: 0, dur: 0.25, volume: -12 });
s1.sfx('glitch', { at: 50, dur: 0.55, volume: -10 });

const s2 = p.scene('Baru', { duration: '2.8s', transition: { type: 'flash', duration: 6 } });
teksGlitch(s2, 'versi baru', 820, [[0, 10]]);
garisDistorsi(s2, 0, 10);
const sub = s2.layer('Sub', { fixed: true });
sub.text('lebih cepat 3× · tanpa error', W / 2, 1000, { size: 54, weight: 600, color: '#1fe3ff', align: 'center', valign: 'middle', anim: { type: 'scramble', at: 14, dur: 20 } });
s2.sfx('glitch', { at: 0, dur: 0.35, volume: -10 });
s2.sfx('success', { at: 34, volume: -12 });

export default p;
