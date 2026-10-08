// 086 · Musik dari file + equalizer bergoyang
// kategori: audio
// fitur: p.audio(file, {volume dB, trim, fadeIn, fadeOut}) · equalizer dari rng per ketuk (deterministik) · pulse sesuai BPM · judul lagu
// pakai: video dengan backsound sendiri, podcast/audiogram, preview musik, konten dengan lagu bebas royalti
// render: gerak render examples/resep/086-musik-dari-file.mjs -o musik.mp4

import { project, rng } from 'gerak';

const BPM = 100; // tempo musik di assets/musik.mp3
const p = project({ title: 'Musik dari file', preset: 'reels', fps: 30, background: '#120f24' });
const W = p.width;
const KETUK = (p.fps * 60) / BPM; // 18 frame

const s = p.scene('Audio', { duration: '7s' });

// musik: mulai dari detik 0 file, ambil 7 detik, fade in/out, volume −1 dB
p.audio('assets/musik.mp3', { at: 0, trim: [0, 7], volume: -1, fadeIn: 0.4, fadeOut: 1.2 });

// sampul + judul
const sampul = s.layer('Sampul', { x: W / 2, y: 640 });
sampul.rect(-300, -300, 600, 600, { fill: { type: 'linear', angle: 135, stops: [[0, '#7048e8'], [1, '#00B7B3']] }, r: 40, shadow: { color: 'rgba(0,0,0,0.4)', blur: 50, y: 20 } });
sampul.circle(0, 0, 160, { fill: 'rgba(255,255,255,0.15)' });
sampul.path('M -40 -80 L 90 0 L -40 80 Z', { fill: '#ffffff' });
for (let k = 0; k < 21; k++) sampul.key(k * KETUK, { scale: k % 4 === 0 ? 1.04 : 1.02 }, 'out-cubic').key(k * KETUK + KETUK - 1, { scale: 1 });

const info = s.layer('Info', { fixed: true });
info.text('Lagu Kerja Santai', W / 2, 1060, { size: 72, weight: 800, color: '#ffffff', align: 'center', anim: { type: 'chars', effect: 'rise', stagger: 1 } });
info.text('Gerak Sound · 100 BPM', W / 2, 1140, { size: 42, weight: 500, color: '#a5a3c9', align: 'center' });

// equalizer: 15 batang, tinggi baru tiap ketuk (rng dengan seed tetap)
const R = rng('eq');
for (let i = 0; i < 15; i++) {
  const x = W / 2 - 7 * 58 + i * 58;
  const bar = s.layer(`EQ ${i + 1}`, { x, y: 1500 });
  bar.rect(-20, -220, 40, 220, { fill: i % 3 === 0 ? '#00B7B3' : '#b197fc', r: 12 });
  for (let k = 0; k < 24; k++) bar.key(k * KETUK, { scaleY: 0.25 + R() * 0.75 }, 'out-quad').key(k * KETUK + KETUK * 0.7, { scaleY: 0.15 + R() * 0.2 }, 'in-quad');
}

// progress lagu
const pr = s.layer('Progres', { x: 140 });
pr.rect(0, 1640, W - 280, 10, { fill: '#ffffff', r: 5 });
pr.key(0, { scaleX: 0 }, 'linear').key('7s', { scaleX: 1 });
info.rect(140, 1640, W - 280, 10, { fill: 'rgba(255,255,255,0.15)', r: 5 });

export default p;
