// 012 · Kata raksasa masuk dengan wipe
// kategori: teks
// fitur: wipeIn arah bergantian (clip yang membesar) · case upper · letterSpacing · box di kata terakhir · camera.shake
// pakai: kalimat manifesto, pernyataan tegas, opening bertenaga, typography poster

import { project } from 'gerak';

const p = project({ title: 'Teks raksasa wipe', preset: 'reels', fps: 30, background: '#14161f' });
const W = p.width;

const s = p.scene('Manifesto', { duration: '4s' });

const kata = [
  { teks: 'kerja', warna: '#ffffff', arah: 'right' },
  { teks: 'cerdas', warna: '#00B7B3', arah: 'left' },
  { teks: 'bukan', warna: '#ffffff', arah: 'right' },
  { teks: 'keras', warna: '#FFD43B', arah: 'up' },
];

// PENTING: wipe memakai kotak [0,0,W,H] di koordinat layer.
// Layer dibiarkan di (0,0) dan teks ditaruh dengan koordinat layar.
kata.forEach((k, i) => {
  const at = 4 + i * 12;
  const l = s.layer(`Kata ${i + 1}`);
  l.text(k.teks, W / 2, 600 + i * 250, {
    size: 196,
    weight: 800,
    color: i === 3 ? '#14161f' : k.warna,
    align: 'center',
    valign: 'middle',
    case: 'upper',
    letterSpacing: 6,
    ...(i === 3 ? { box: { color: k.warna, padX: 40, padY: 10, radius: 14 } } : {}),
  });
  l.wipeIn(at, { dir: k.arah, dur: 10, ease: 'out-quart' });
  s.sfx('swipe', { at, volume: -10 });
});

s.camera.shake({ amp: 9, freq: 18, from: 40, to: 52, decay: true });
s.sfx('impact', { at: 40, volume: -10 });

export default p;
