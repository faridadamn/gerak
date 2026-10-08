// 001 · Hook kata per kata (pop)
// kategori: teks
// fitur: text anim words + effect pop · highlight marker · layer fixed · camera.push · sfx pop per kata
// pakai: pembuka video 9:16 — kalimat hook di 3 detik pertama yang menahan scroll

import { project } from 'gerak';

// ---- palet
const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const INK = '#14161f';

// ---- project 9:16 (TikTok/Reels/Shorts)
const p = project({ title: 'Hook kata per kata', preset: 'reels', fps: 30, background: '#f5f7fb' });
const W = p.width; // 1080
const H = p.height; // 1920

const s = p.scene('Hook', { duration: '3.5s' });

// 1) dekor latar: lingkaran transparan yang melayang pelan
const dekor = s.layer('Dekor');
dekor.circle(W - 140, 420, 260, { fill: TEAL, opacity: 0.12 });
dekor.circle(150, 1480, 210, { fill: BLUE, opacity: 0.08 });
dekor.float({ amp: 12, period: 4 });

// 2) judul: kata muncul satu per satu (pop), lalu kata kunci diberi stabilo
//    fixed: true → tidak ikut gerak kamera (cocok untuk teks utama/caption)
const judul = s.layer('Judul', { fixed: true });
judul.text('Berhenti kerja keras.\nMulai kerja pakai sistem.', W / 2, 900, {
  size: 104,
  weight: 800,
  color: INK,
  align: 'center',
  valign: 'middle',
  maxWidth: 900,
  lineHeight: 1.12,
  anim: { type: 'words', effect: 'pop', at: 4, stagger: 4, dur: 12 },
  // kata dicocokkan tanpa tanda baca: 'sistem' cocok dengan 'sistem.'
  highlight: { words: ['sistem'], style: 'marker', color: TEAL, at: 44, dur: 10, opacity: 0.4 },
});

// 3) kamera mendorong pelan sepanjang scene (dekor ikut, judul tidak karena fixed)
s.camera.push({ zoom: 1.06 });

// 4) suara: pop di setiap kata (7 kata, jeda 4 frame), swoosh saat stabilo
for (let i = 0; i < 7; i++) s.sfx('pop', { at: 4 + i * 4, volume: -10, pitch: 480 + i * 30 });
s.sfx('swoosh', { at: 44, volume: -10 });

export default p;
