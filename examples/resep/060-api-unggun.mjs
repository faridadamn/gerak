// 060 · Api unggun (siklus api + percikan)
// kategori: karakter
// fitur: track 3 bentuk api cycle tiap 3 frame · percikan naik & pudar (key berulang) · glow radial pulse · boil · bintang blink
// pakai: suasana hangat/cerita malam, "semangat menyala", latar storytelling

import { project, rng } from 'gerak';

const p = project({ title: 'Api unggun', preset: 'reels', fps: 24, background: '#0b0f1e' });
p.boil({ every: 3, amount: 0.8 });
const W = p.width;
const X = W / 2;
const Y = 1380;

const s = p.scene('Api', { duration: '5s' });
const R = rng('api');

// bintang
const bintang = s.layer('Bintang');
for (let i = 0; i < 60; i++) bintang.circle(R() * W, R() * 900, 1.5 + R() * 2, { fill: '#ffffff', opacity: 0.3 + R() * 0.7 });
bintang.blink({ period: 2.3, duty: 0.85 });

// cahaya hangat berdenyut
const cahaya = s.layer('Cahaya', { x: X, y: Y - 120 });
cahaya.circle(0, 0, 520, { fill: { type: 'radial', stops: [[0, 'rgba(255,146,43,0.45)'], [1, 'rgba(255,146,43,0)']] } });
cahaya.pulse({ amount: 0.06, period: 0.4 });

// kayu bersilang
const kayu = s.layer('Kayu');
kayu.stroke([[X - 230, Y + 70, 1], [X + 220, Y - 10, 1]], { brush: 'brush', size: 56, color: '#5c3d2e' });
kayu.stroke([[X + 230, Y + 70, 1], [X - 220, Y - 10, 1]], { brush: 'brush', size: 56, color: '#4a3024' });

// api: 3 bentuk bergantian
const api = s.track('Api');
const bentukApi = (l, k) => {
  const g = (dx, h, w, c) => l.path(`M ${X - w + dx} ${Y} C ${X - w + dx} ${Y - h * 0.5} ${X + dx - w * 0.2} ${Y - h * 0.7} ${X + dx + (k - 1) * 18} ${Y - h} C ${X + dx + w * 0.3} ${Y - h * 0.6} ${X + w + dx} ${Y - h * 0.4} ${X + w + dx} ${Y} Z`, { fill: c });
  g(0, 420 + k * 30, 170, '#f76707');
  g(10 - k * 8, 300 + (2 - k) * 30, 120, '#ffa94d');
  g(-6 + k * 6, 170 + k * 20, 70, '#fff3bf');
};
const gambarApi = [0, 1, 2].map((k) => {
  const d = api.drawing(`api ${k}`);
  bentukApi(d.layer('lidah api'), k);
  return d;
});
api.cycle(gambarApi, { every: 3 });

// percikan: titik kecil naik & pudar, berulang dengan jeda acak
for (let i = 0; i < 14; i++) {
  const l = s.layer(`Percikan ${i + 1}`, { x: X + (R() - 0.5) * 200, y: Y - 200, opacity: 0 });
  l.circle(0, 0, 5 + R() * 4, { fill: '#ffd43b' });
  const periode = 30 + Math.floor(R() * 20);
  l.key(0, { opacity: 0 }, 'hold'); // tersembunyi sampai percikan pertama
  for (let t = 1 + Math.floor(R() * periode); t < 120; t += periode) {
    l.key(t, { y: Y - 200, opacity: 1 }, 'out-quad').key(t + periode - 2, { y: Y - 600 - R() * 300, opacity: 0 }, 'hold');
  }
  l.wiggle({ amp: [30, 0], freq: 1.5, seed: i });
}

const teks = s.layer('Teks', { fixed: true });
teks.text('Jaga apinya tetap menyala.', W / 2, 520, { font: 'Caveat', weight: 700, size: 104, color: '#ffe8cc', align: 'center', valign: 'middle', maxWidth: 900, anim: { type: 'words', effect: 'fade', at: 12, stagger: 5, dur: 14 } });

for (let i = 0; i < 12; i++) s.sfx('scratch', { at: Math.floor(R() * 110), dur: 0.08 + R() * 0.12, volume: -18 - R() * 6 });
p.sfx('pad', { at: 0, dur: 5, root: 146.8, chord: [0, 4, 7, 9], brightness: 800, volume: -18 });

export default p;
