// 005 · Caption bergantian di atas foto
// kategori: teks
// fitur: scene.captions (subtitle berurutan) · image fit cover · overlay gradien · camera.push (Ken Burns)
// pakai: video slideshow/foto + narasi teks, B-roll dengan caption, cerita perjalanan

import { project } from 'gerak';

const p = project({ title: 'Caption di atas foto', preset: 'reels', fps: 30, background: '#111' });
const W = p.width;
const H = p.height;

const s = p.scene('Foto', { duration: '7s' });

// 1) foto memenuhi layar 9:16 (fit cover memotong sisi kiri/kanan). focus = titik yang dipertahankan.
const foto = s.layer('Foto');
foto.image('assets/pemandangan.jpg', 0, 0, { width: W, height: H, fit: 'cover', focus: [0.75, 0.5] });

// 2) gradien gelap di bawah supaya caption terbaca
const gelap = s.layer('Overlay', { fixed: true });
gelap.rect(0, H * 0.45, W, H * 0.55, { fill: { type: 'linear', angle: 90, stops: [[0, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,0.75)']] } });

// 3) caption: tiap item tampil dari `at` sampai caption berikutnya
s.captions(
  [
    { text: 'Dulu gw kira liburan itu', at: '0.2s' },
    { text: 'kabur dari kerjaan.', at: '1.8s' },
    { text: 'Ternyata liburan terbaik', at: '3.4s' },
    { text: 'itu kerjaan yang jalan sendiri.', at: '5s' },
  ],
  { y: H * 0.7, size: 66, anim: { type: 'words', effect: 'rise', stagger: 3, dur: 10 } },
);

// 4) Ken Burns: kamera zoom pelan dan geser sedikit (foto ikut, caption tidak)
s.camera.push({ zoom: 1.12, x: 40 });
p.sfx('pad', { at: 0, dur: 7, root: 220, chord: [0, 4, 7, 9], volume: -18 });

export default p;
