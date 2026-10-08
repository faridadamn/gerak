// 081 · Kuis pilihan ganda dengan timer
// kategori: edukasi
// fitur: bar timer menyusut (scaleX 1→0) · 4 opsi dari data · reveal jawaban: opsi benar hijau + centang, opsi lain meredup (show range) · tick/ding
// pakai: kuis interaktif, tebak-tebakan, materi belajar, engagement "jawab di komen"

import { project } from 'gerak';

const p = project({ title: 'Kuis', preset: 'reels', fps: 30, background: '#2D3E8D' });
const W = p.width;

const s = p.scene('Kuis', { duration: '8s' });
const SOAL = 'Berapa lama rata-rata pembeli mau menunggu balasan chat?';
const OPSI = ['30 menit', '10 menit', '5 menit', '1 jam'];
const BENAR = 2; // index jawaban benar
const TIMER = 5 * 30; // 5 detik
const REVEAL = 14 + TIMER;

const t = s.layer('Soal', { fixed: true });
t.text('KUIS', W / 2, 260, { size: 44, weight: 800, color: '#00B7B3', align: 'center', letterSpacing: 10 });
t.text(SOAL, W / 2, 420, { size: 70, weight: 800, color: '#ffffff', align: 'center', valign: 'top', maxWidth: 900, lineHeight: 1.12, anim: { type: 'words', effect: 'rise', stagger: 2 } });

// timer bar
const jalur = s.layer('Jalur timer');
jalur.rect(90, 740, W - 180, 22, { fill: 'rgba(255,255,255,0.15)', r: 11 });
const timer = s.layer('Timer', { x: 90 });
timer.rect(0, 740, W - 180, 22, { fill: '#FFD43B', r: 11 });
timer.key(14, { scaleX: 1 }, 'linear').key(REVEAL, { scaleX: 0 });

OPSI.forEach((o, i) => {
  const y = 900 + i * 190;
  const huruf = 'ABCD'[i];
  const l = s.layer(`Opsi ${huruf}`, { x: 90, y });
  l.rect(0, -75, W - 180, 150, { fill: '#ffffff', r: 34 });
  l.circle(80, 0, 44, { fill: '#e7ecff' });
  l.text(huruf, 80, 0, { size: 46, weight: 800, color: '#2D3E8D', align: 'center', valign: 'middle' });
  l.text(o, 160, 0, { size: 54, weight: 700, color: '#14161f', valign: 'middle' });
  l.slideIn(10 + i * 5, { from: 'right', distance: 200, dur: 12 });
  // setelah reveal: benar → hijau, salah → redup
  const hasil = s.layer(`Hasil ${huruf}`, { x: 90, y, show: [REVEAL, null] });
  if (i === BENAR) {
    hasil.rect(0, -75, W - 180, 150, { fill: '#2f9e44', r: 34 });
    hasil.text(o, 160, 0, { size: 54, weight: 800, color: '#ffffff', valign: 'middle' });
    hasil.circle(80, 0, 44, { fill: '#ffffff' });
    hasil.polygon([[60, 0], [76, 16], [102, -16]], { closed: false, stroke: '#2f9e44', strokeWidth: 10, draw: [REVEAL + 2, 8] });
    hasil.key(REVEAL, { scale: 1 }, 'out-back').key(REVEAL + 4, { scale: 1.03 }).key(REVEAL + 10, { scale: 1 });
  } else {
    hasil.rect(0, -75, W - 180, 150, { fill: '#2D3E8D', r: 34, opacity: 0.55 });
  }
});

for (let d = 0; d < 5; d++) s.sfx('tick', { at: 14 + d * 30, volume: -10 });
s.sfx('ding', { at: REVEAL, volume: -6, pitch: 1047 });

const cta = s.layer('CTA', { fixed: true });
cta.text('Kamu jawab apa? Tulis di komen!', W / 2, 1720, { size: 46, weight: 700, color: '#ffffff', align: 'center', anim: { type: 'words', effect: 'fade', at: REVEAL + 14, stagger: 2 } });

export default p;
