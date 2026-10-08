// 098 · Banyak varian dari satu script (variabel lingkungan)
// kategori: lanjut
// fitur: process.env untuk memilih varian (teks, warna, preset) · satu file → banyak MP4 · loop bash untuk render massal
// pakai: A/B test hook, versi per produk/kota, konten massal, varian bahasa
// render: for v in 1 2 3; do VARIAN=$v gerak render examples/resep/098-varian-env.mjs -o varian-$v.mp4; done

import { project } from 'gerak';

const VARIAN = {
  1: { hook: 'Capek balas chat\nsatu-satu?', warna: '#2D3E8D', aksen: '#00B7B3' },
  2: { hook: 'Omzet naik,\ntapi lu makin sibuk?', warna: '#c2255c', aksen: '#ffd43b' },
  3: { hook: 'Libur 3 hari,\ntoko tetap jualan.', warna: '#0b7285', aksen: '#ffffff' },
};
const pilih = process.env.VARIAN ?? '1';
const v = VARIAN[pilih] ?? VARIAN[1];

const p = project({ title: `Varian ${pilih}`, preset: process.env.PRESET ?? 'reels', fps: 30, background: v.warna });
const W = p.width;
const H = p.height;

const s = p.scene('Hook', { duration: '3.5s' });
const t = s.layer('Hook', { fixed: true });
t.text(v.hook, W / 2, H / 2, { size: Math.round(W * 0.095), weight: 800, color: '#ffffff', align: 'center', valign: 'middle', lineHeight: 1.08, anim: { type: 'words', effect: 'pop', at: 2, stagger: 4 } });
t.text(`varian ${pilih}`, W / 2, H * 0.78, { size: Math.round(W * 0.04), weight: 700, color: v.aksen, align: 'center', letterSpacing: 6, case: 'upper' });
const garis = s.layer('Garis', { x: W / 2, y: H * 0.64 });
garis.rect(-W * 0.2, -6, W * 0.4, 12, { fill: v.aksen, r: 6 });
garis.key(20, { scaleX: 0 }, 'out-cubic').key(34, { scaleX: 1 });
s.sfx('pop', { at: 2, volume: -8 });

export default p;
