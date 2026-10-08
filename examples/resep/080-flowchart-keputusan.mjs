// 080 · Flowchart keputusan (ya / tidak)
// kategori: edukasi
// fitur: belah ketupat (polygon) untuk keputusan · panah bercabang (path draw) · label Ya/Tidak · node muncul berurutan · fungsi pembuat node
// pakai: alur kerja/SOP, decision tree, logika chatbot, "kalau begini → lakukan itu"

import { project } from 'gerak';

const INK = '#1f2a44';
const p = project({ title: 'Flowchart keputusan', preset: 'reels', fps: 30, background: '#ffffff' });
const W = p.width;

const s = p.scene('Flowchart', { duration: '7s' });

const kotak = (nama, x, y, teks, at, warna) => {
  const l = s.layer(nama, { x, y });
  l.rect(-210, -90, 420, 180, { fill: warna, r: 30, stroke: INK, strokeWidth: 6 });
  l.text(teks, 0, 0, { size: 42, weight: 700, color: INK, align: 'center', valign: 'middle', maxWidth: 360, lineHeight: 1.15 });
  l.pop(at, { dur: 12 });
  s.sfx('pop', { at, volume: -12 });
  return l;
};
const ketupat = (nama, x, y, teks, at) => {
  const l = s.layer(nama, { x, y });
  l.polygon([[0, -170], [300, 0], [0, 170], [-300, 0]], { fill: '#fff3bf', stroke: INK, strokeWidth: 6, lineJoin: 'round' });
  l.text(teks, 0, 0, { size: 44, weight: 800, color: INK, align: 'center', valign: 'middle', maxWidth: 360, lineHeight: 1.15 });
  l.pop(at, { dur: 12 });
  s.sfx('pop', { at, volume: -12 });
};
const panah = (d, at, label, lx, ly) => {
  const l = s.layer(`Panah ${label ?? at}`);
  l.path(d, { stroke: INK, strokeWidth: 7, fill: 'none', draw: [at, 12, 'out-cubic'] });
  if (label) l.text(label, lx, ly, { size: 38, weight: 800, color: label === 'Ya' ? '#2f9e44' : '#e03131', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'pop', at: at + 8 } });
};
const kepala = (x, y, arah, at) => {
  const l = s.layer(`Kepala ${at}`, { x, y, rotation: arah });
  l.polygon([[0, 0], [-22, -36], [22, -36]], { fill: INK });
  l.pop(at + 12, { dur: 6 });
};

kotak('Mulai', W / 2, 330, 'Chat masuk', 6, '#e7f5ff');
panah(`M ${W / 2} 420 L ${W / 2} 560`, 18);
kepala(W / 2, 580, 0, 18);
ketupat('Keputusan', W / 2, 760, 'Tanya harga?', 30);
panah(`M ${W / 2 - 300} 760 L 210 760 L 210 1060`, 44, 'Ya', 300, 720);
kepala(210, 1080, 0, 44);
panah(`M ${W / 2 + 300} 760 L 870 760 L 870 1060`, 50, 'Tidak', 780, 720);
kepala(870, 1080, 0, 50);
kotak('Ya', 230, 1180, 'Kirim katalog + harga', 62, '#d3f9d8');
kotak('Tidak', 850, 1180, 'Sapa & tanya kebutuhan', 68, '#ffe3e3');
panah(`M 230 1270 L 230 1420 L ${W / 2 - 60} 1420`, 84);
panah(`M 850 1270 L 850 1420 L ${W / 2 + 60} 1420`, 84);
kotak('Selesai', W / 2, 1530, 'Catat di daftar pesanan', 98, '#e6fcf5');

export default p;
