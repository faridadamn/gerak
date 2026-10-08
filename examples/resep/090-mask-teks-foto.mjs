// 090 · Foto di dalam huruf (mask teks)
// kategori: lanjut
// fitur: group.mask = layer teks (foto hanya terlihat di dalam huruf) · foto bergerak di dalam mask · outline teks di atasnya · zoomIn
// pakai: title card travel/produk, judul dengan tekstur foto, poster tipografi

import { project } from 'gerak';

const p = project({ title: 'Mask teks foto', preset: 'reels', fps: 30, background: '#0d0d12' });
const W = p.width;
const H = p.height;

const s = p.scene('Judul', { duration: '5s' });
const gaya = { size: 300, weight: 800, align: 'center', valign: 'middle', lineHeight: 0.92, case: 'upper' };
const TEKS = 'libur\nan';

// group dengan mask: anak "Foto" hanya kelihatan di dalam bentuk anak "Huruf"
const g = s.group('Foto dalam huruf', { mask: 'huruf-mask', x: W / 2, y: 900 });
const foto = g.layer('Foto');
foto.image('assets/pemandangan.jpg', 0, 0, { width: 1500, height: 1100, anchor: 'center', fit: 'cover' });
foto.key(0, { x: 220, scale: 1.15 }, 'in-out-sine').key('5s', { x: -220, scale: 1 }); // foto bergeser pelan di dalam huruf
const huruf = g.layer('Huruf', { id: 'huruf-mask' });
huruf.text(TEKS, 0, 0, { ...gaya, color: '#000000' });
g.zoomIn(0, { from: 0.85, dur: 24 });

// garis tepi tipis di atas huruf
const tepi = s.layer('Tepi', { x: W / 2, y: 900 });
tepi.text(TEKS, 0, 0, { ...gaya, color: 'rgba(0,0,0,0)', stroke: 'rgba(255,255,255,0.6)', strokeWidth: 2 });
tepi.zoomIn(0, { from: 0.85, dur: 24 });

const sub = s.layer('Sub', { fixed: true });
sub.text('dimulai dari sistem yang jalan sendiri', W / 2, 1420, { size: 48, weight: 600, color: '#ced4da', align: 'center', anim: { type: 'words', effect: 'fade', at: 24, stagger: 3 } });
sub.line(W / 2 - 80, 1500, W / 2 + 80, 1500, { stroke: '#00B7B3', strokeWidth: 8, draw: [40, 12] });

p.sfx('pad', { at: 0, dur: 5, root: 220, chord: [0, 4, 7, 11], volume: -18 });
s.sfx('whoosh', { at: 0, dur: 0.9, volume: -16 });

export default p;
