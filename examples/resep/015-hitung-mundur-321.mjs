// 015 · Hitung mundur 3-2-1
// kategori: teks
// fitur: show range per angka · pop + zoom per detik · arc draw (lingkaran progres) · stamp "MULAI!" · flash · tick/ding
// pakai: countdown sebelum reveal, giveaway, mulai live, opening tantangan

import { project } from 'gerak';

const p = project({ title: 'Hitung mundur', preset: 'reels', fps: 30, background: '#2D3E8D' });
const W = p.width;
const FPS = p.fps;

const s = p.scene('Countdown', { duration: '4.5s' });

const angka = ['3', '2', '1'];
angka.forEach((n, i) => {
  const mulai = i * FPS; // tiap angka 1 detik
  // lingkaran progres digambar penuh dalam 1 detik
  const cincin = s.layer(`Cincin ${n}`, { show: [mulai, mulai + FPS] });
  cincin.circle(W / 2, 900, 260, { fill: 'rgba(255,255,255,0.06)' });
  cincin.arc(W / 2, 900, 260, -90, 270, { stroke: '#00B7B3', strokeWidth: 22, draw: [mulai, FPS - 2, 'linear'] });
  // angka: pop masuk (layer di tengah, digambar di 0,0)
  const l = s.layer(`Angka ${n}`, { x: W / 2, y: 900, show: [mulai, mulai + FPS] });
  l.text(n, 0, 0, { size: 330, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
  l.pop(mulai, { dur: 10, from: 1.8, ease: 'out-cubic' });
  s.sfx('tick', { at: mulai, volume: -6 });
});

// "MULAI!" muncul setelah 3 detik
const go = s.layer('Mulai', { x: W / 2, y: 900, show: [3 * FPS, null] });
go.text('MULAI!', 0, 0, { size: 200, weight: 800, color: '#FFD43B', align: 'center', valign: 'middle', anim: { type: 'chars', effect: 'stamp', at: 3 * FPS, stagger: 2, dur: 8 } });
go.pulse({ amount: 0.04, period: 0.5, from: 3 * FPS + 14 });

// kilatan putih saat MULAI
const kilat = s.layer('Kilat', { fixed: true, opacity: 0 });
kilat.rect(0, 0, W, p.height, { fill: '#ffffff' });
// PENTING: sebelum key pertama, nilai key pertama yang berlaku.
// Jadi mulai dengan key(0, {opacity: 0}, 'hold') supaya kilat tidak tampil dari awal.
kilat.key(0, { opacity: 0 }, 'hold').key(3 * FPS, { opacity: 0.8 }, 'out-cubic').key(3 * FPS + 8, { opacity: 0 });

s.sfx('ding', { at: 3 * FPS, volume: -6, pitch: 1320 });
s.sfx('impact', { at: 3 * FPS, volume: -12 });

export default p;
