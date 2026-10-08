// 049 · Transisi iris dari titik tertentu
// kategori: transisi
// fitur: transition iris dengan at:[x,y] (lingkaran membesar dari tombol) · pulse tombol · ripple · scene kedua dengan isi baru
// pakai: "klik untuk membuka", masuk ke detail, transisi dari ikon/logo/avatar

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Iris dari titik', preset: 'reels', fps: 30, background: '#14161f' });
const W = p.width;
const TOMBOL = [W / 2, 1300]; // titik asal lingkaran

// --- scene 1: tombol play berdenyut
const s1 = p.scene('Tombol', { duration: '2.5s' });
const judul = s1.layer('Judul', { fixed: true });
judul.text('Mau lihat\ncaranya?', W / 2, 700, { size: 120, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', lineHeight: 1.05, anim: { type: 'words', effect: 'rise', stagger: 4 } });
const tombol = s1.layer('Tombol', { x: TOMBOL[0], y: TOMBOL[1] });
tombol.circle(0, 0, 110, { fill: TEAL });
tombol.path('M -30 -50 L 55 0 L -30 50 Z', { fill: '#ffffff' });
tombol.pop(10, { dur: 14 }).pulse({ amount: 0.06, period: 0.7, from: 24 });
const riak = s1.layer('Riak', { x: TOMBOL[0], y: TOMBOL[1] });
riak.circle(0, 0, 110, { fill: 'none', stroke: TEAL, strokeWidth: 6 });
riak.key(24, { scale: 1, opacity: 0.8 }, 'out-cubic').key(54, { scale: 2, opacity: 0 });

// --- scene 2: terbuka dari tombol (iris at = titik tombol)
const s2 = p.scene('Isi', { duration: '3s', background: TEAL, transition: { type: 'iris', duration: 18, at: TOMBOL, ease: 'in-out-cubic' } });
const isi = s2.layer('Isi', { fixed: true });
isi.text('Langkah 1', W / 2, 760, { size: 70, weight: 700, color: '#04302f', align: 'center', valign: 'middle' });
isi.text('Tulis semua\npertanyaan pembeli', W / 2, 960, { size: 96, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', lineHeight: 1.08, anim: { type: 'words', effect: 'pop', at: 14, stagger: 3 } });

s1.sfx('click', { at: 60, volume: -6 });
s2.sfx('whoosh', { at: 0, volume: -10 });

export default p;
