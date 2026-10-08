// Bikin ulang aset contoh (gambar + musik) — semuanya digambar/disintesis pakai Gerak sendiri.
// Jalankan dari folder engine:  node examples/resep/assets/buat-aset.mjs
import { project, saveFrame, renderAudio } from '../../../src/index.mjs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------- pemandangan.jpg (1600×1000)
{
  const p = project({ width: 1600, height: 1000, fps: 30, background: '#1b2a6b' });
  p.effects({ grain: 0.04 });
  const s = p.scene('Pemandangan', { duration: 1 });
  const langit = s.layer('Langit');
  langit.rect(0, 0, 1600, 640, { fill: { type: 'linear', angle: 90, stops: [[0, '#1b2a6b'], [0.55, '#e0745a'], [1, '#ffd29a']] } });
  langit.circle(1250, 300, 260, { fill: { type: 'radial', stops: [[0, 'rgba(255,236,190,0.9)'], [1, 'rgba(255,236,190,0)']] } });
  langit.circle(1250, 300, 84, { fill: '#fff3cf' });
  const gunung = s.layer('Gunung');
  gunung.polygon([[0, 640], [0, 430], [220, 330], [420, 420], [640, 280], [900, 430], [1150, 340], [1400, 420], [1600, 360], [1600, 640]], { fill: '#7a4f7e', smooth: true, opacity: 0.85 });
  gunung.polygon([[0, 640], [0, 520], [300, 440], [560, 540], [820, 450], [1100, 560], [1350, 470], [1600, 540], [1600, 640]], { fill: '#43305f', smooth: true });
  const danau = s.layer('Danau');
  danau.rect(0, 640, 1600, 360, { fill: { type: 'linear', angle: 90, stops: [[0, '#f0a477'], [0.25, '#7b5a86'], [1, '#1d1f45']] } });
  for (let i = 0; i < 9; i++) danau.rect(1250 - 120 + i * 9, 660 + i * 26, 240 - i * 18, 6, { fill: '#fff3cf', opacity: 0.55 - i * 0.05, r: 3 });
  const bukit = s.layer('Bukit');
  bukit.polygon([[0, 1000], [0, 760], [260, 700], [520, 790], [700, 1000]], { fill: '#141331', smooth: true });
  bukit.polygon([[1000, 1000], [1180, 790], [1400, 720], [1600, 760], [1600, 1000]], { fill: '#141331', smooth: true });
  const burung = s.layer('Burung');
  for (const [x, y, k] of [[520, 260, 1], [580, 230, 0.8], [640, 270, 0.9]]) {
    burung.stroke([[x - 22 * k, y, 0.4], [x - 8 * k, y - 10 * k, 1], [x, y, 0.6], [x + 8 * k, y - 10 * k, 1], [x + 22 * k, y, 0.4]], { brush: 'ink', size: 5, color: '#1d1530' });
  }
  await saveFrame(p, 0, `${DIR}/pemandangan.jpg`);
}

// ---------------------------------------------------------------- produk.png (800×800, transparan)
{
  const p = project({ width: 800, height: 800, fps: 30, background: 'transparent' });
  const s = p.scene('Produk', { duration: 1 });
  const l = s.layer('Gelas', { x: 400, y: 400 });
  l.ellipse(0, 330, 210, 34, { fill: 'rgba(0,0,0,0.18)' });
  // badan gelas (es kopi susu)
  l.path('M -190 -150 L 190 -150 L 150 310 C 146 330 -146 330 -150 310 Z', { fill: { type: 'linear', angle: 90, stops: [[0, '#f3e3cc'], [0.35, '#c99a6b'], [1, '#6f4a2f']] } });
  l.path('M -190 -150 L 190 -150 L 150 310 C 146 330 -146 330 -150 310 Z', { stroke: 'rgba(255,255,255,0.7)', strokeWidth: 8, fill: 'none' });
  for (const [x, y, r] of [[-80, 0, 34], [40, 40, 30], [-20, 120, 28], [90, 150, 26]]) l.rect(x - r, y - r, r * 2, r * 2, { fill: 'rgba(255,255,255,0.35)', r: 10 });
  // label
  l.rect(-150, 60, 300, 120, { fill: '#2D3E8D', r: 22 });
  l.text('ES KOPI', 0, 122, { size: 54, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', letterSpacing: 3 });
  // tutup + sedotan
  l.path('M -210 -150 C -210 -260 210 -260 210 -150 Z', { fill: 'rgba(255,255,255,0.85)', stroke: '#d9dde8', strokeWidth: 6 });
  l.rect(-220, -165, 440, 30, { fill: '#e9edf5', r: 15 });
  l.path('M 40 -230 L 90 -380 L 122 -372 L 72 -222 Z', { fill: '#00B7B3' });
  l.line(-150, -110, -120, 260, { stroke: 'rgba(255,255,255,0.55)', strokeWidth: 14 });
  await saveFrame(p, 0, `${DIR}/produk.png`, { transparent: true });
}

// ---------------------------------------------------------------- avatar.png (600×600)
{
  const p = project({ width: 600, height: 600, fps: 30, background: '#00B7B3' });
  const s = p.scene('Avatar', { duration: 1 });
  const l = s.layer('Orang', { x: 300, y: 300 });
  l.circle(0, 0, 300, { fill: { type: 'radial', stops: [[0, '#3fd3cf'], [1, '#00968f']] } });
  l.path('M -210 320 C -200 150 -110 110 0 110 C 110 110 200 150 210 320 Z', { fill: '#2D3E8D' });
  l.path('M -40 60 L 40 60 L 46 130 C 20 150 -20 150 -46 130 Z', { fill: '#e6b48c' });
  l.ellipse(0, -30, 112, 130, { fill: '#f2c49b' });
  l.path('M -118 -40 C -130 -170 -40 -200 20 -190 C 110 -180 140 -110 120 -40 C 100 -100 40 -120 -10 -118 C -60 -116 -100 -90 -118 -40 Z', { fill: '#1d1c1a' });
  l.circle(-40, -20, 10, { fill: '#1d1c1a' });
  l.circle(40, -20, 10, { fill: '#1d1c1a' });
  l.arc(0, 20, 38, 20, 160, { stroke: '#1d1c1a', strokeWidth: 8 });
  await saveFrame(p, 0, `${DIR}/avatar.png`);
}

// ---------------------------------------------------------------- musik.mp3 (8 detik, beat + pad)
{
  const p = project({ preset: 'hd', fps: 30 });
  p.scene('Musik', { duration: '8s' });
  p.sfx('beat', { at: 0, bpm: 100, bars: 4, volume: 0 });
  p.sfx('pad', { at: 0, dur: 8, root: 196, chord: [0, 4, 7, 11], volume: -3 });
  await renderAudio(p, `${DIR}/musik.mp3`);
}

console.log('aset selesai →', DIR);
