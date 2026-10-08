// 068 · Quote harian (square 1:1)
// kategori: konten
// fitur: preset square · gradien diagonal · words blur bertahap · garis kuas di bawah kata kunci · handle akun di pojok · vignette
// pakai: quote/motivasi harian untuk feed IG/Threads/FB, konten rutin harian dari template

import { project, withPressure } from 'gerak';

// ganti dua baris ini tiap hari
const QUOTE = 'Yang membedakan bukan bakat, tapi sistem yang lu jalankan setiap hari.';
const HANDLE = '@akunmu';

const p = project({ title: 'Quote harian', preset: 'square', fps: 30, background: { type: 'linear', angle: 135, stops: [[0, '#0b7285'], [1, '#2D3E8D']] } });
p.effects({ vignette: 0.25, grain: 0.04 });
const W = p.width;

const s = p.scene('Quote', { duration: '5s' });

const tanda = s.layer('Tanda kutip', { x: 120, y: 230 });
tanda.text('“', 0, 0, { size: 260, weight: 800, color: 'rgba(255,255,255,0.25)', valign: 'middle' });
tanda.pop(0, { dur: 12 });

const q = s.layer('Quote', { fixed: true });
q.text(QUOTE, 120, 360, { size: 74, weight: 800, color: '#ffffff', valign: 'top', maxWidth: 840, lineHeight: 1.18, anim: { type: 'words', effect: 'blur', at: 8, stagger: 3, dur: 14 } });

const garis = s.layer('Garis kuas');
garis.stroke(withPressure([[120, 830], [400, 818], [700, 834]], 'taper'), { brush: 'brush', size: 26, color: '#63e6be', reveal: [70, 14, 'out-cubic'] });

q.text(HANDLE, W - 80, W - 80, { size: 40, weight: 700, color: 'rgba(255,255,255,0.75)', align: 'right', anim: { type: 'lines', effect: 'fade', at: 84 } });

p.sfx('pad', { at: 0, dur: 5, root: 220, chord: [0, 4, 7, 11], volume: -18 });

export default p;
