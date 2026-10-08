// 039 · Kursor mengklik tombol CTA
// kategori: grafis
// fitur: kursor path bergerak (move) · tekan tombol (key scale) · riak lingkaran membesar & memudar · ganti label via show · click/success
// pakai: tutorial "klik di sini", ajakan daftar, demo UI, CTA link di bio

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Tombol CTA klik', preset: 'reels', fps: 30, background: '#f5f7fb' });
const W = p.width;
const BX = W / 2;
const BY = 1000;
const KLIK = 46; // frame saat diklik

const s = p.scene('CTA', { duration: '4.5s' });

const judul = s.layer('Judul', { fixed: true });
judul.text('Gratis selama\nmasa beta', W / 2, 560, { size: 96, weight: 800, color: '#14161f', align: 'center', valign: 'middle', lineHeight: 1.08, anim: { type: 'words', effect: 'rise', stagger: 3 } });

// 1) riak: lingkaran membesar dan hilang setelah klik
const riak = s.layer('Riak', { x: BX, y: BY, opacity: 0 });
riak.circle(0, 0, 200, { fill: 'none', stroke: TEAL, strokeWidth: 10 });
riak.key(0, { opacity: 0, scale: 0.5 }, 'hold').key(KLIK, { opacity: 0.8, scale: 1 }, 'out-cubic').key(KLIK + 20, { opacity: 0, scale: 2.4 });

// 2) tombol: berdenyut menunggu, ditekan saat klik, label berganti
const tombol = s.layer('Tombol', { x: BX, y: BY });
tombol.rect(-330, -90, 660, 180, { fill: TEAL, r: 90, shadow: { color: 'rgba(0,183,179,0.35)', blur: 30, y: 14 } });
tombol.text('Daftar sekarang', 0, 0, { size: 62, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', show: [0, KLIK + 4] });
tombol.text('Berhasil terdaftar!', 0, 0, { size: 58, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', show: [KLIK + 4, null], anim: { type: 'words', effect: 'pop', at: KLIK + 4, stagger: 3 } });
tombol.pop(4, { dur: 14 });
tombol.pulse({ amount: 0.03, period: 0.8, from: 18, to: KLIK - 4, ramp: 4 });
tombol.key(KLIK - 2, { scale: 1 }, 'out-quad').key(KLIK + 2, { scale: 0.92 }, 'out-back').key(KLIK + 10, { scale: 1 });

// 3) kursor: panah, bergerak ke tombol lalu "tekan"
const kursor = s.layer('Kursor', { x: 940, y: 1500 });
kursor.path('M 0 0 L 0 84 L 22 64 L 38 100 L 54 92 L 38 58 L 66 56 Z', { fill: '#14161f', stroke: '#ffffff', strokeWidth: 5, lineJoin: 'round' });
kursor.move(14, { x: BX + 120, y: BY + 30 }, { dur: 28, ease: 'in-out-cubic' });
kursor.key(KLIK - 2, { scale: 1 }).key(KLIK + 2, { scale: 0.85 }).key(KLIK + 8, { scale: 1 });

s.sfx('swoosh', { at: 14, volume: -16 });
s.sfx('click', { at: KLIK, volume: -4 });
s.sfx('success', { at: KLIK + 6, volume: -8 });

export default p;
