// 095 · Video dari data JSON (satu scene per item)
// kategori: lanjut
// fitur: baca file JSON dengan readFileSync + import.meta.url · loop data → scene · format Rupiah via count · filter varian · ranking
// pakai: video katalog otomatis, laporan produk terlaris, konten massal dari spreadsheet/database (ekspor ke JSON)

import { project } from 'gerak';
import { readFileSync } from 'node:fs';

// path relatif terhadap file script ini (bukan terhadap folder tempat perintah dijalankan)
const DATA = JSON.parse(readFileSync(new URL('./data/produk.json', import.meta.url), 'utf8'));

const p = project({ title: 'Produk terlaris', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

// intro
const intro = p.scene('Intro', { duration: '2s', background: '#14161f' });
intro.layer('Judul', { fixed: true }).text(`Top ${DATA.length} terlaris\nbulan ini`, W / 2, 900, { size: 100, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', lineHeight: 1.05, anim: { type: 'words', effect: 'pop', stagger: 4 } });

// satu scene per produk, urut dari peringkat terakhir ke #1
const urut = [...DATA].sort((a, b) => a.terjual - b.terjual);
urut.forEach((d, i) => {
  const rank = urut.length - i;
  const s = p.scene(d.nama, { duration: '3s', background: rank === 1 ? '#fff9db' : '#ffffff', transition: { type: 'push-up', duration: 12 } });
  const foto = s.layer('Foto', { x: W / 2, y: 760, ...(d.filter ? { filter: d.filter } : {}) });
  foto.image('assets/produk.png', 0, 0, { width: 820, anchor: 'center' });
  foto.zoomIn(0, { from: 0.85, dur: 16 });
  const t = s.layer('Teks', { fixed: true });
  t.text(`#${rank}`, 90, 260, { size: 150, weight: 800, color: d.warna, anim: { type: 'words', effect: 'stamp', at: 4 } });
  t.text(d.nama, W / 2, 1290, { size: 90, weight: 800, color: '#14161f', align: 'center', valign: 'middle', fit: 920, anim: { type: 'words', effect: 'rise', at: 8, stagger: 3 } });
  t.text('0', W / 2, 1420, { size: 64, weight: 700, color: d.warna, align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: d.harga, at: 14, dur: 24, prefix: 'Rp' } });
  t.text('0', W / 2, 1540, { size: 48, weight: 600, color: '#868e96', align: 'center', valign: 'middle', anim: { type: 'count', from: 0, to: d.terjual, at: 20, dur: 30, suffix: ' terjual' } });
  s.sfx(rank === 1 ? 'success' : 'pop', { at: 4, volume: -10 });
});

export default p;
