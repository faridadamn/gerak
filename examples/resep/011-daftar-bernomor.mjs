// 011 · Daftar bernomor muncul satu per satu
// kategori: teks
// fitur: loop data → layer per item · slideIn bertahap · lingkaran nomor · teks wrap maxWidth · sfx pop
// pakai: listicle "5 cara/5 kebiasaan", poin-poin materi, agenda

import { project } from 'gerak';

const BLUE = '#2D3E8D';
const TEAL = '#00B7B3';
const p = project({ title: 'Daftar bernomor', preset: 'reels', fps: 30, background: '#f5f7fb' });
const W = p.width;

const s = p.scene('Daftar', { duration: '7s' });

const judul = s.layer('Judul', { fixed: true });
judul.text('5 kebiasaan seller\nyang omzetnya naik', 100, 300, {
  size: 82,
  weight: 800,
  color: BLUE,
  valign: 'top',
  lineHeight: 1.08,
  anim: { type: 'words', effect: 'rise', at: 0, stagger: 3, dur: 10 },
});

const poin = ['Balas chat di bawah 5 menit', 'Posting konten setiap hari', 'Catat semua transaksi', 'Follow up pembeli lama', 'Evaluasi angka tiap minggu'];

poin.forEach((teks, i) => {
  const at = 24 + i * 18; // tiap item muncul 18 frame setelah sebelumnya
  const y = 700 + i * 190;
  const item = s.layer(`Poin ${i + 1}`, { x: 100, y });
  item.rect(0, -70, W - 200, 140, { fill: '#ffffff', r: 28, shadow: { color: 'rgba(20,22,31,0.08)', blur: 24, y: 8 } });
  item.circle(80, 0, 44, { fill: i % 2 ? TEAL : BLUE });
  item.text(String(i + 1), 80, 0, { size: 52, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
  item.text(teks, 150, 0, { size: 52, weight: 700, color: '#14161f', valign: 'middle', maxWidth: W - 420 });
  item.slideIn(at, { from: 'left', distance: 200, dur: 14, ease: 'out-back' });
  s.sfx('pop', { at, volume: -10, pitch: 440 + i * 60 });
});

export default p;
