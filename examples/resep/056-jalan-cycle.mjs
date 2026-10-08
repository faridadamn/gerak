// 056 · Walk cycle tokoh garis (4 pose)
// kategori: karakter
// fitur: fungsi pose dari sudut sendi · track.cycle tiap 3 frame · group bergerak menyeberang layar · bob naik-turun · tanah bergaris
// pakai: karakter berjalan/berangkat, "perjalanan", transisi naratif, animasi penjelas

import { project } from 'gerak';

const INK = '#1d1c1a';
const p = project({ title: 'Walk cycle', preset: 'reels', fps: 24, background: '#fff9db' });
const W = p.width;
const TANAH = 1300;

const s = p.scene('Jalan', { duration: '5s' });

// titik ujung dari sudut (derajat, 0 = lurus ke bawah, positif = ke depan/kanan)
const ujung = (x, y, sudut, pjg) => [x + Math.sin((sudut * Math.PI) / 180) * pjg, y + Math.cos((sudut * Math.PI) / 180) * pjg];
const tungkai = (l, pangkal, paha, lutut, warna = INK) => {
  const knee = ujung(pangkal[0], pangkal[1], paha, 110);
  const kaki = ujung(knee[0], knee[1], paha - lutut, 110);
  l.stroke([[...pangkal, 1], [...knee, 1], [...kaki, 1]], { brush: 'ink', size: 22, color: warna, smooth: false, minWidth: 1, taper: [0, 0] });
};
// satu pose = posisi semua sendi
function pose(l, { kaki1, lutut1, kaki2, lutut2, tangan1, tangan2, naik }) {
  const pinggul = [0, -230 - naik];
  const bahu = [0, -430 - naik];
  tungkai(l, bahu, tangan2, -20, '#868e96'); // tangan belakang (abu-abu)
  tungkai(l, pinggul, kaki2, lutut2, '#868e96'); // kaki belakang
  l.stroke([[...pinggul, 1], [...bahu, 1]], { brush: 'ink', size: 26, color: INK, smooth: false, minWidth: 1, taper: [0, 0] });
  l.circle(0, -500 - naik, 62, { fill: INK });
  tungkai(l, pinggul, kaki1, lutut1);
  tungkai(l, bahu, tangan1, -20);
}

const tokoh = s.group('Tokoh', { x: -150, y: TANAH });
const langkah = tokoh.track('Langkah');
const poses = [
  { nama: 'kontak', kaki1: 30, lutut1: 5, kaki2: -30, lutut2: 10, tangan1: -30, tangan2: 30, naik: 0 },
  { nama: 'turun', kaki1: 12, lutut1: 25, kaki2: -15, lutut2: 45, tangan1: -12, tangan2: 12, naik: -14 },
  { nama: 'lewat', kaki1: -5, lutut1: 10, kaki2: 10, lutut2: 70, tangan1: 0, tangan2: 0, naik: 6 },
  { nama: 'naik', kaki1: -20, lutut1: 5, kaki2: 25, lutut2: 40, tangan1: 15, tangan2: -15, naik: 12 },
];
// siklus lengkap = 4 pose kaki kiri + 4 pose kaki kanan (tukar kaki 1 & 2)
const gambar = [];
for (const tukar of [false, true]) {
  for (const ps of poses) {
    const g = langkah.drawing(`${ps.nama}${tukar ? ' B' : ' A'}`);
    const v = tukar ? { ...ps, kaki1: ps.kaki2, lutut1: ps.lutut2, kaki2: ps.kaki1, lutut2: ps.lutut1, tangan1: ps.tangan2, tangan2: ps.tangan1 } : ps;
    pose(g.layer('pose'), v);
    gambar.push(g);
  }
}
langkah.cycle(gambar, { every: 3 }); // 8 pose × 3 frame = 1 siklus per detik (24 fps)
tokoh.key(0, { x: -150 }, 'linear').key('5s', { x: W + 150 });

// tanah: garis + putus-putus
const tanah = s.layer('Tanah');
tanah.line(0, TANAH + 8, W, TANAH + 8, { stroke: INK, strokeWidth: 8 });
for (let x = 20; x < W; x += 90) tanah.line(x, TANAH + 40, x + 40, TANAH + 40, { stroke: '#c9b458', strokeWidth: 6 });

const teks = s.layer('Teks', { fixed: true });
teks.text('Satu langkah\nsetiap hari.', W / 2, 520, { size: 110, weight: 800, color: INK, align: 'center', valign: 'middle', lineHeight: 1.05, anim: { type: 'words', effect: 'rise', at: 6, stagger: 5 } });

for (let f = 0; f < 120; f += 12) s.sfx('tap', { at: f, volume: -22, pitch: 200 });

export default p;
