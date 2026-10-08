// 071 · Lower third dengan latar transparan (overlay)
// kategori: konten
// fitur: background 'transparent' · render --transparent ke .webm/.mov (alpha) · wipeIn per bar + wipeOut di group · 16:9
// pakai: overlay nama narasumber/judul untuk ditumpuk di editor video (CapCut, Premiere, DaVinci)
// render: gerak render examples/resep/071-lower-third-transparan.mjs --transparent -o lower-third.webm

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Lower third transparan', preset: 'youtube', fps: 30, background: 'transparent' });
const H = p.height;

const s = p.scene('Lower third', { duration: '5s' });

// group pembungkus: menangani animasi KELUAR (wipeOut).
// Tiap layer di dalamnya menangani animasi MASUK (wipeIn) sendiri — satu layer hanya punya satu wipe.
// rect wipe ada di koordinat lokal group/layer.
const lt = s.group('Lower third', { x: 120, y: H - 300 });
lt.wipeOut('4.3s', { dir: 'left', dur: 12, rect: [-10, -10, 900, 200] });

// aksen kotak teal tumbuh ke bawah duluan (scaleY dari origin di atas)
const aksen = lt.layer('Aksen');
aksen.rect(0, 0, 24, 170, { fill: TEAL });
aksen.key(0, { scaleY: 0 }, 'out-cubic').key(10, { scaleY: 1 });

// bar nama & jabatan: wipe dari kiri, bertahap
const bar = lt.layer('Bar nama', { x: 24 });
bar.rect(0, 0, 760, 104, { fill: '#14161f' });
bar.text('Farid Adam', 36, 54, { size: 60, weight: 800, color: '#ffffff', valign: 'middle' });
bar.wipeIn(8, { dir: 'right', dur: 14, rect: [0, 0, 760, 104] });

const bar2 = lt.layer('Bar jabatan', { x: 24, y: 104 });
bar2.rect(0, 0, 560, 66, { fill: TEAL });
bar2.text('Founder · Automation Builder', 36, 34, { size: 36, weight: 700, color: '#04302f', valign: 'middle' });
bar2.wipeIn(16, { dir: 'right', dur: 12, rect: [0, 0, 560, 66] });

s.sfx('swoosh', { at: 8, volume: -14 });
s.sfx('swoosh', { at: '4.3s', volume: -16, dir: 'down' });

export default p;
