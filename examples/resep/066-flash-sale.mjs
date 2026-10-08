// 066 · Flash sale energik (3 scene cepat)
// kategori: konten
// fitur: garis diagonal berjalan (linear x) · stamp + shake · count mundur timer · harga coret · flash transition · beat cepat
// pakai: promo kilat, harbolnas 10.10/11.11/12.12, diskon terbatas, launching promo

import { project } from 'gerak';

const RED = '#e03131';
const YEL = '#FFD43B';
const p = project({ title: 'Flash sale', preset: 'reels', fps: 30, background: RED });
const W = p.width;
const H = p.height;

// latar garis diagonal yang terus bergerak (dipakai di semua scene)
function garisJalan(scene, warna) {
  const l = scene.layer('Garis', { rotation: -20, x: -400, opacity: 0.25 });
  for (let i = 0; i < 16; i++) l.rect(i * 160 - 400, -600, 70, H + 1200, { fill: warna });
  l.key(0, { x: -400 }, 'linear').key(scene.duration, { x: -80 });
}

// ---- 1: FLASH SALE
const s1 = p.scene('Judul', { duration: '2s' });
garisJalan(s1, YEL);
const t1 = s1.layer('Judul', { x: W / 2, y: 900 });
t1.text('FLASH', 0, -120, { size: 230, weight: 800, color: YEL, align: 'center', valign: 'middle', anim: { type: 'words', effect: 'stamp', at: 2, dur: 8 } });
t1.text('SALE', 0, 110, { size: 230, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'stamp', at: 10, dur: 8 } });
t1.shake({ amp: 10, freq: 18, from: 10, to: 20, decay: true });
s1.sfx('impact', { at: 2, volume: -10 });
s1.sfx('impact', { at: 10, volume: -10 });

// ---- 2: produk + harga
const s2 = p.scene('Produk', { duration: '3s', background: '#c92a2a', transition: { type: 'flash', duration: 6 } });
garisJalan(s2, '#ff8787');
const produk = s2.layer('Produk', { x: W / 2, y: 760 });
produk.image('assets/produk.png', 0, 0, { width: 900, anchor: 'center' });
produk.dropIn(0, { height: 500, dur: 18 });
const harga = s2.layer('Harga', { fixed: true });
harga.text('Rp45.000', W / 2, 1260, { size: 80, weight: 700, color: '#ffc9c9', align: 'center', valign: 'middle', highlight: { words: ['Rp45.000'], style: 'strike', color: '#ffffff', at: 20, dur: 6, width: 8 } });
harga.text('Rp19.000', W / 2, 1420, { size: 170, weight: 800, color: YEL, align: 'center', valign: 'middle', stroke: '#7a1010', strokeWidth: 8, anim: { type: 'words', effect: 'stamp', at: 28, dur: 8 } });
const badge = s2.layer('Badge', { x: 840, y: 420 });
badge.star(0, 0, 140, 110, 16, { fill: YEL });
badge.text('-58%', 0, 0, { size: 64, weight: 800, color: RED, align: 'center', valign: 'middle' });
badge.pop(30, { dur: 10 }).spin({ speed: 30, from: 40 });
s2.sfx('coin', { at: 30, volume: -8 });

// ---- 3: timer
const s3 = p.scene('Timer', { duration: '3s', background: '#14161f', transition: { type: 'flash', duration: 6 } });
garisJalan(s3, RED);
const t3 = s3.layer('Timer', { fixed: true });
t3.text('BERAKHIR DALAM', W / 2, 720, { size: 56, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 6 });
t3.text('00:59', W / 2, 900, { size: 220, weight: 800, color: YEL, align: 'center', valign: 'middle', anim: { type: 'count', from: 59, to: 56, at: 0, dur: 89, ease: 'linear', prefix: '00:' } });
t3.text('Checkout sekarang →', W / 2, 1120, { size: 64, weight: 800, color: '#14161f', align: 'center', valign: 'middle', box: { color: YEL, padX: 34, padY: 18, radius: 40 }, anim: { type: 'words', effect: 'pop', at: 12, stagger: 3 } });
t3.pulse({ amount: 0.02, period: 0.5, from: 24 });
for (let d = 0; d < 3; d++) s3.sfx('tick', { at: d * 30, volume: -8 });

p.sfx('beat', { at: 0, bpm: 128, bars: 5, volume: -14, kick: 'x...x...x...x...', snare: '....x.......x...', hat: 'xxxxxxxxxxxxxxxx' });

export default p;
