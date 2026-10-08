// 004 · Subtitle karaoke tersinkron per kata
// kategori: teks
// fitur: text anim karaoke (times per kata, color, dim, scale) · box caption · pulse bergelombang · gradien latar
// pakai: subtitle voice-over/talking head gaya TikTok — kata yang sedang diucapkan menyala

import { project } from 'gerak';

const p = project({ title: 'Karaoke subtitle', preset: 'reels', fps: 30, background: { type: 'linear', angle: 120, stops: [[0, '#2D3E8D'], [1, '#141b45']] } });
const W = p.width;

const s = p.scene('VO', { duration: '4s' });

// 1) "gelombang suara": 11 batang yang berdenyut dengan periode berbeda
const gel = s.layer('Gelombang', { x: W / 2, y: 760 });
for (let i = 0; i < 11; i++) {
  const b = gel.group(`batang ${i + 1}`, { x: (i - 5) * 56 });
  b.layer(`isi ${i + 1}`).rect(-16, -90, 32, 180, { fill: '#00B7B3', r: 16, opacity: 0.85 });
  b.pulse({ amount: 0.45, period: 0.35 + (i % 4) * 0.12 });
}

// 2) Waktu mulai tiap kata (detik). Dapatkan dari transkrip VO
//    (mis. Whisper word timestamps). Jumlahnya = jumlah kata.
const kalimat = 'Sistem yang baik bikin lu bebas, bukan sibuk.';
const waktu = ['0.3s', '0.75s', '1.05s', '1.4s', '1.75s', '2.0s', '2.5s', '2.85s'];

const sub = s.layer('Subtitle', { fixed: true });
sub.text(kalimat, W / 2, 1180, {
  size: 76,
  weight: 800,
  color: '#ffffff',
  align: 'center',
  valign: 'middle',
  maxWidth: 860,
  lineHeight: 1.25,
  box: { color: 'rgba(0,0,0,0.35)', padX: 24, padY: 12, radius: 20 },
  anim: { type: 'karaoke', times: waktu, color: '#FFD43B', dim: 'rgba(255,255,255,0.55)', scale: 1.1 },
});

// 3) nanti ganti dengan file VO asli:  s.audio('vo.mp3', { at: 0 })
s.sfx('tick', { at: '0.3s', volume: -20 });

export default p;
