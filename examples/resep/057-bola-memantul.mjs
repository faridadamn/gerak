// 057 · Bola memantul dengan squash & stretch
// kategori: karakter
// fitur: prinsip animasi (ease out-quad naik, in-quad turun) · squash/stretch scaleX/scaleY di titik tumbukan · bayangan mengikuti tinggi · spin
// pakai: belajar timing animasi, ikon/logo memantul, transisi playful, maskot bola

import { project } from 'gerak';

const p = project({ title: 'Bola memantul', preset: 'reels', fps: 30, background: '#fff4e6' });
const W = p.width;
const TANAH = 1400;
const R = 90;

const s = p.scene('Pantul', { duration: '5s' });

// tumbukan: [frame, tinggi pantulan berikutnya]
const pantul = [
  [10, 700],
  [42, 420],
  [66, 240],
  [84, 120],
  [96, 50],
  [104, 0],
];

// bayangan di tanah: makin kecil & pudar saat bola tinggi
const bayangan = s.layer('Bayangan', { x: 200, y: TANAH });
bayangan.ellipse(0, 0, R, 22, { fill: 'rgba(0,0,0,0.18)' });

// bola: origin layer di DASAR bola → squash menempel ke tanah
const bola = s.layer('Bola', { x: 200, y: TANAH - 900 });
bola.circle(0, -R, R, { fill: '#f76707' });
bola.path(`M ${-R} ${-R} C ${-R / 2} ${-R * 1.4} ${R / 2} ${-R * 0.6} ${R} ${-R}`, { stroke: '#ffffff', strokeWidth: 10, fill: 'none' });

// jatuh pertama
bola.key(0, { y: TANAH - 900 }, 'in-quad');
bayangan.key(0, { scale: 0.4, opacity: 0.3 }, 'in-quad');
pantul.forEach(([f, h], i) => {
  const next = pantul[i + 1];
  bola.key(f, { y: TANAH }, 'out-quad');
  bayangan.key(f, { scale: 1, opacity: 1 }, 'out-quad');
  // squash saat menyentuh tanah, stretch sesaat sebelumnya (makin kecil kalau pantulan lemah)
  const k = h / 700;
  bola.key(f - 2, { scaleX: 1 - 0.12 * k, scaleY: 1 + 0.18 * k }).key(f, { scaleX: 1 + 0.35 * k, scaleY: 1 - 0.3 * k }).key(f + 4, { scaleX: 1, scaleY: 1 }, 'out-back');
  if (next && h > 0) {
    const puncak = f + (next[0] - f) / 2;
    bola.key(puncak, { y: TANAH - h }, 'in-quad');
    bayangan.key(puncak, { scale: 1 - 0.6 * k, opacity: 1 - 0.6 * k }, 'in-quad');
  }
  s.sfx('tap', { at: f, volume: -6 - i * 3, pitch: 220 });
});

// bola juga bergerak ke kanan & berputar
bola.key(0, { x: 200, rotation: 0 }, 'out-sine').key(104, { x: 820, rotation: 400 });
bayangan.key(0, { x: 200 }, 'out-sine').key(104, { x: 820 });

const tanah = s.layer('Tanah');
tanah.rect(0, TANAH, W, 600, { fill: '#ffd8a8' });
const teks = s.layer('Teks', { fixed: true });
teks.text('squash & stretch', W / 2, 360, { size: 90, weight: 800, color: '#d9480f', align: 'center', anim: { type: 'chars', effect: 'pop', at: 104, stagger: 1.5 } });

export default p;
