// 041 · Parallax multiplane (depth)
// kategori: kamera
// fitur: depth per layer root (jauh > 1 bergerak lambat, dekat < 1 bergerak cepat) · camera pan x · layer lebih lebar dari layar · fixed teks
// pakai: kesan kedalaman/sinematik dari gambar datar, opening dramatis, scene perjalanan

import { project } from 'gerak';

const p = project({ title: 'Parallax', preset: 'reels', fps: 30, background: '#1b2a6b' });
const W = p.width;
const H = p.height;

const s = p.scene('Parallax', { duration: '6s' });

// semua lapisan digambar lebih lebar dari layar (x -600..W+1400) karena kamera menggeser
const KIRI = -600;
const KANAN = W + 1400;

// depth 4: langit + matahari (paling jauh, hampir diam)
const langit = s.layer('Langit', { depth: 4 });
langit.rect(KIRI, 0, KANAN - KIRI, H, { fill: { type: 'linear', angle: 90, stops: [[0, '#1b2a6b'], [0.6, '#e0745a'], [1, '#ffd29a']] } });
langit.circle(700, 900, 140, { fill: '#fff3cf' });

// depth 2.5: gunung jauh
const jauh = s.layer('Gunung jauh', { depth: 2.5 });
jauh.polygon([[KIRI, H], [KIRI, 1050], [-200, 880], [200, 1000], [600, 820], [1000, 980], [1400, 840], [1800, 990], [KANAN, 900], [KANAN, H]], { fill: '#7a4f7e', smooth: true });

// depth 1.5: bukit tengah
const tengah = s.layer('Bukit', { depth: 1.5 });
tengah.polygon([[KIRI, H], [KIRI, 1250], [0, 1150], [500, 1280], [1000, 1150], [1500, 1300], [2000, 1180], [KANAN, 1260], [KANAN, H]], { fill: '#43305f', smooth: true });

// depth 0.7: pohon di depan (bergerak paling cepat)
const depan = s.layer('Pohon depan', { depth: 0.7 });
depan.rect(KIRI, 1560, KANAN - KIRI, H, { fill: '#141331' });
for (let i = 0; i < 12; i++) {
  const x = KIRI + 120 + i * 260;
  const t = 260 + (i % 3) * 80;
  depan.polygon([[x - 90, 1580], [x, 1580 - t], [x + 90, 1580]], { fill: '#141331' });
}

// teks tetap (tidak ikut kamera)
const teks = s.layer('Teks', { fixed: true });
teks.text('Pelan tapi\nterus jalan.', 90, 360, { size: 110, weight: 800, color: '#ffffff', valign: 'top', lineHeight: 1.05, shadow: { color: 'rgba(0,0,0,0.3)', blur: 20, y: 6 }, anim: { type: 'words', effect: 'rise', at: 10, stagger: 5, dur: 14 } });

// kamera geser ke kanan + sedikit zoom: lapisan dekat bergeser jauh, langit hampir diam
s.camera.key(0, { x: -200, zoom: 1.05 }, 'in-out-sine').key('6s', { x: 500, zoom: 1.1 });

p.sfx('pad', { at: 0, dur: 6, root: 164.8, chord: [0, 4, 7, 11], volume: -16 });
s.sfx('whoosh', { at: 0, dur: 2, low: 150, high: 900, volume: -20 });

export default p;
