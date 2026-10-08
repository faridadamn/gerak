// 099 · Satu desain untuk 9:16, 1:1, dan 16:9 (layout responsif)
// kategori: lanjut
// fitur: FORMAT dari env · posisi & ukuran relatif (persen W/H, satuan U = sisi terpendek) · tata letak kolom vs baris otomatis
// pakai: satu konten untuk Reels + feed + YouTube sekaligus tanpa menulis 3 script
// render: for f in reels square youtube; do FORMAT=$f gerak render examples/resep/099-multi-format.mjs -o promo-$f.mp4; done

import { project } from 'gerak';

const FORMAT = process.env.FORMAT ?? 'reels';
const p = project({ title: `Multi format (${FORMAT})`, preset: FORMAT, fps: 30, background: '#f5f7fb' });
const W = p.width;
const H = p.height;
const U = Math.min(W, H) / 100; // 1 U = 1% sisi terpendek → ukuran teks konsisten di semua format
const LANDSCAPE = W > H * 1.2;
const KOTAK = !LANDSCAPE && H < W * 1.4; // 1:1 atau 4:5
const K = KOTAK ? 0.72 : 1; // gambar diperkecil di format kotak

const s = p.scene('Promo', { duration: '4s' });

// area gambar & teks: berdampingan (landscape) atau atas-bawah (portrait/square)
const gambar = LANDSCAPE ? { x: W * 0.28, y: H * 0.5 } : { x: W * 0.5, y: H * (KOTAK ? 0.3 : 0.36) };
const teks = LANDSCAPE ? { x: W * 0.52, y: H * 0.42, align: 'left', maxW: W * 0.42 } : { x: W * 0.5, y: H * (KOTAK ? 0.68 : 0.66), align: 'center', maxW: W * 0.86 };

const g = s.layer('Gambar', { x: gambar.x, y: gambar.y });
g.circle(0, 0, 34 * U * K, { fill: '#e3e8ff' });
g.image('assets/produk.png', 0, 0, { width: 60 * U * K, anchor: 'center' });
g.zoomIn(0, { from: 0.8, dur: 16 }).float({ amp: 1.2 * U, period: 2.5, from: 16 });

const t = s.layer('Teks', { fixed: true });
t.text('Es Kopi Senja', teks.x, teks.y, { size: 9 * U, weight: 800, color: '#14161f', align: teks.align, valign: 'middle', maxWidth: teks.maxW, anim: { type: 'words', effect: 'rise', at: 6, stagger: 3 } });
t.text('Pesan sekarang, diantar hari ini.', teks.x, teks.y + 10 * U, { size: 4.4 * U, weight: 500, color: '#6b7186', align: teks.align, valign: 'middle', maxWidth: teks.maxW, anim: { type: 'lines', effect: 'fade', at: 18 } });
t.text('Rp18.000', teks.x, teks.y + 21 * U, { size: 6 * U, weight: 800, color: '#ffffff', align: teks.align, valign: 'middle', box: { color: '#00B7B3', padX: 3 * U, padY: 1.5 * U, radius: 3 * U }, anim: { type: 'words', effect: 'pop', at: 26 } });

s.sfx('pop', { at: 26, volume: -10 });

export default p;
