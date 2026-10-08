// 008 · Harga dicoret → harga promo
// kategori: teks
// fitur: highlight strike · anim words stamp · image produk + float · star badge pop + spin · pivot · sfx impact/coin
// pakai: promo diskon, flash sale, harga spesial produk

import { project } from 'gerak';

const RED = '#e03131';
const p = project({ title: 'Harga coret', preset: 'reels', fps: 30, background: { type: 'radial', stops: [[0, '#fff4e0'], [1, '#ffd8a8']] } });
const W = p.width;

const s = p.scene('Promo', { duration: '4.5s' });

// 1) produk melayang (layer di tengah, gambar anchor center)
const produk = s.layer('Produk', { x: W / 2, y: 720 });
produk.image('assets/produk.png', 0, 0, { width: 900, anchor: 'center' });
produk.zoomIn(0, { from: 0.85, dur: 16 }).float({ amp: 14, period: 2.4, from: 16 });

// 2) harga lama, lalu dicoret
const harga = s.layer('Harga', { fixed: true });
harga.text('Rp45.000', W / 2, 1200, {
  size: 84,
  weight: 700,
  color: '#8c6d4f',
  align: 'center',
  valign: 'middle',
  anim: { type: 'lines', effect: 'fade', at: 10, dur: 8 },
  highlight: { words: ['Rp45.000'], style: 'strike', color: RED, at: 30, dur: 8, width: 9 },
});
// 3) harga baru: efek stamp (jatuh dari besar ke ukuran normal)
harga.text('Rp25.000', W / 2, 1360, { size: 150, weight: 800, color: RED, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'stamp', at: 42, dur: 10 } });

// 4) badge bintang di pojok produk: pop lalu berputar pelan
const badge = s.layer('Badge', { x: 810, y: 470 });
badge.star(0, 0, 130, 100, 14, { fill: RED });
badge.text('-44%', 0, 0, { size: 62, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
badge.pop(48, { dur: 14 }).sway({ angle: 6, period: 1.6, from: 62 });

s.sfx('whoosh', { at: 0, volume: -12 });
s.sfx('scratch', { at: 30, dur: 0.3, volume: -8 });
s.sfx('impact', { at: 42, volume: -10 });
s.sfx('coin', { at: 50, volume: -8 });

export default p;
