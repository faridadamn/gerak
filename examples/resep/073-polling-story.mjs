// 073 · Polling ala story (bar persen terisi)
// kategori: konten
// fitur: kartu sticker · bar terisi scaleX berporos kiri · count persen · pilihan terpilih disorot + centang · tap kursor
// pakai: hasil polling/vote, riset audiens, "kalian pilih mana?", engagement story

import { project } from 'gerak';

const p = project({ title: 'Polling story', preset: 'story', fps: 30, background: { type: 'linear', angle: 160, stops: [[0, '#ff8787'], [1, '#b197fc']] } });
const W = p.width;

const s = p.scene('Polling', { duration: '5s' });

const kartu = s.layer('Kartu', { x: W / 2, y: 900 });
kartu.rect(-400, -340, 800, 680, { fill: '#ffffff', r: 44, shadow: { color: 'rgba(0,0,0,0.18)', blur: 40, y: 16 } });
kartu.text('Lebih laku jualan di mana?', 0, -230, { size: 54, weight: 800, color: '#14161f', align: 'center', valign: 'middle', maxWidth: 680 });
kartu.pop(0, { dur: 14, from: 0.8 });

const opsi = [
  { label: 'Marketplace', persen: 38, warna: '#ced4da' },
  { label: 'Sosmed + WA', persen: 62, warna: '#7950f2' },
];
const X0 = W / 2 - 340;
const LEBAR = 680;
opsi.forEach((o, i) => {
  const y = 820 + i * 200;
  const at = 30 + i * 6;
  const jalur = s.layer(`Jalur ${i + 1}`);
  jalur.rect(X0, y - 60, LEBAR, 120, { fill: '#f1f3f5', r: 60 });
  // isi bar: layer di ujung kiri → scaleX dari kiri
  const isi = s.layer(`Isi ${i + 1}`, { x: X0, y });
  isi.rect(0, -60, LEBAR * (o.persen / 100), 120, { fill: o.warna, r: 60 });
  isi.key(0, { scaleX: 0 }, 'hold').key(at, { scaleX: 0 }, 'out-cubic').key(at + 30, { scaleX: 1 });
  const teks = s.layer(`Label ${i + 1}`, { fixed: true });
  teks.text(o.label, X0 + 40, y, { size: 46, weight: 800, color: '#14161f', valign: 'middle' });
  teks.text('0%', X0 + LEBAR - 40, y, { size: 46, weight: 800, color: '#14161f', align: 'right', valign: 'middle', anim: { type: 'count', from: 0, to: o.persen, at, dur: 30, suffix: '%' } });
});

// kursor "tap" ke pilihan kedua lalu centang
const tap = s.layer('Tap', { x: 760, y: 1300 });
tap.circle(0, 0, 40, { fill: 'rgba(255,255,255,0.85)', stroke: '#14161f', strokeWidth: 4 });
tap.move(8, { x: 700, y: 1030 }, { dur: 18 });
tap.key(26, { scale: 1 }).key(30, { scale: 0.7 }).key(36, { scale: 1 }).fadeOut(44, 8);
const centang = s.layer('Centang', { x: X0 + LEBAR + 60, y: 1020 });
centang.circle(0, 0, 36, { fill: '#7950f2' });
centang.polygon([[-16, 0], [-4, 12], [18, -12]], { closed: false, stroke: '#ffffff', strokeWidth: 8, draw: [64, 8] });
centang.pop(60, { dur: 10 });

s.sfx('tap', { at: 28, volume: -8, pitch: 300 });
s.sfx('success', { at: 64, volume: -12 });

export default p;
