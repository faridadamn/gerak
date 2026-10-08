// 050 · Carousel 3 varian produk (satu gambar, filter warna)
// kategori: transisi
// fitur: transition push-left berantai · filter hue-rotate pada layer (varian warna dari 1 aset) · indikator titik · fungsi pembuat scene
// pakai: katalog varian rasa/warna, slide produk, "swipe untuk lihat", menu

import { project } from 'gerak';

const p = project({ title: 'Carousel produk', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const varian = [
  { nama: 'Original', harga: 'Rp18.000', bg: '#fff1e0', aksen: '#8d5524', filter: null }, // null = tanpa filter
  { nama: 'Pandan', harga: 'Rp20.000', bg: '#ebfbee', aksen: '#2b8a3e', filter: 'hue-rotate(75deg) saturate(1.2)' },
  { nama: 'Ube', harga: 'Rp22.000', bg: '#f3f0ff', aksen: '#6741d9', filter: 'hue-rotate(230deg) saturate(1.3)' },
];

varian.forEach((v, i) => {
  const s = p.scene(v.nama, { duration: '2.5s', background: v.bg, transition: i === 0 ? undefined : { type: 'push-left', duration: 12, ease: 'in-out-quart' } });
  // produk: filter pada layer mengubah warna gambar tanpa aset baru
  const produk = s.layer('Produk', { x: W / 2, y: 820, filter: v.filter });
  produk.image('assets/produk.png', 0, 0, { width: 860, anchor: 'center' });
  produk.float({ amp: 12, period: 2.2 });
  produk.zoomIn(4, { from: 0.9, dur: 14, fade: false });
  // teks
  const t = s.layer('Teks', { fixed: true });
  t.text('Es Kopi', W / 2, 1330, { size: 60, weight: 600, color: '#6b6b6b', align: 'center', valign: 'middle' });
  t.text(v.nama, W / 2, 1430, { size: 130, weight: 800, color: v.aksen, align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'rise', at: 8, stagger: 1.5 } });
  t.text(v.harga, W / 2, 1570, { size: 64, weight: 800, color: '#14161f', align: 'center', valign: 'middle', box: { color: '#ffffff', padX: 28, padY: 14, radius: 30 } });
  // indikator halaman
  varian.forEach((_, k) => t.circle(W / 2 - 40 + k * 40, 1720, k === i ? 12 : 8, { fill: k === i ? v.aksen : '#c9c9c9' }));
  s.sfx('swipe', { at: 0, volume: -12 });
});

export default p;
