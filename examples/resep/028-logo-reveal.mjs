// 028 · Logo reveal (garis tergambar lalu terisi)
// kategori: grafis
// fitur: preset square · shape draw (stroke tergambar, fill memudar) · spinIn · letterSpacing chars rise · flash · riser + impact
// pakai: intro/outro brand, watermark animasi, pembuka channel

import { project } from 'gerak';

const TEAL = '#00B7B3';
const p = project({ title: 'Logo reveal', preset: 'square', fps: 30, background: '#2D3E8D' });
const W = p.width; // 1080
const H = p.height; // 1080

const s = p.scene('Logo', { duration: '4s' });

// 1) simbol: lingkaran + segitiga play. draw: [at, dur] → garis tepi tergambar, isi muncul di akhir
const simbol = s.layer('Simbol', { x: W / 2, y: 430 });
simbol.circle(0, 0, 150, { fill: 'rgba(255,255,255,0.08)', stroke: '#ffffff', strokeWidth: 12, draw: [4, 22, 'in-out-cubic'] });
simbol.path('M -40 -70 L 80 0 L -40 70 Z', { fill: TEAL, stroke: TEAL, strokeWidth: 10, lineJoin: 'round', draw: [16, 16, 'out-cubic'] });
simbol.key(30, { scale: 1 }, 'out-back').key(36, { scale: 1.12 }).key(44, { scale: 1 }); // "denyut" setelah selesai

// 2) cincin tipis berputar
const cincin = s.layer('Cincin', { x: W / 2, y: 430 });
cincin.arc(0, 0, 200, 0, 120, { stroke: TEAL, strokeWidth: 6 });
cincin.arc(0, 0, 200, 180, 300, { stroke: 'rgba(255,255,255,0.5)', strokeWidth: 6 });
cincin.spinIn(10, { turns: 0.5, dur: 24 }).spin({ speed: 40, from: 34 });

// 3) nama brand dengan spasi huruf lebar
const nama = s.layer('Nama', { fixed: true });
nama.text('GERAK', W / 2, 760, { size: 120, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 24, anim: { type: 'chars', effect: 'rise', at: 34, stagger: 3, dur: 12 } });
nama.text('video dari kode', W / 2, 870, { size: 42, weight: 500, color: '#b7c2ff', align: 'center', valign: 'middle', letterSpacing: 6, anim: { type: 'chars', effect: 'fade', at: 52, stagger: 0.8, dur: 10 } });

// 4) kilatan putih saat simbol selesai
const kilat = s.layer('Kilat', { fixed: true });
kilat.rect(0, 0, W, H, { fill: '#ffffff' });
kilat.key(0, { opacity: 0 }, 'hold').key(32, { opacity: 0.6 }, 'out-cubic').key(42, { opacity: 0 });

s.sfx('riser', { at: 0, dur: 1.05, volume: -14 });
s.sfx('impact', { at: 32, volume: -8 });
s.sfx('chime', { at: 52, volume: -14 });

export default p;
