// 009 · Teks meme bergaris tepi
// kategori: teks
// fitur: text stroke (outline) + shadow · case upper · ilustrasi wajah dari bentuk · camera.shake di punchline · show range
// pakai: konten humor/relatable, format meme atas-bawah, reaction

import { project } from 'gerak';

const p = project({ title: 'Meme outline', preset: 'reels', fps: 30, background: { type: 'linear', angle: 135, stops: [[0, '#ff922b'], [1, '#f06595']] } });
const W = p.width;

const s = p.scene('Meme', { duration: '4s' });

// gaya teks meme: putih tebal, garis tepi hitam, bayangan
const gayaMeme = { size: 92, weight: 800, color: '#ffffff', align: 'center', valign: 'middle', case: 'upper', maxWidth: 940, lineHeight: 1.1, stroke: '#000000', strokeWidth: 9, shadow: { color: 'rgba(0,0,0,0.35)', blur: 0, x: 0, y: 8 } };

const atas = s.layer('Atas', { fixed: true });
atas.text('Bos: kapan selesai?', W / 2, 360, { ...gayaMeme, anim: { type: 'words', effect: 'drop', at: 2, stagger: 4, dur: 10 } });

// wajah panik dari bentuk dasar (layer di tengah supaya bisa wiggle di tempat)
const wajah = s.layer('Wajah', { x: W / 2, y: 960 });
wajah.circle(0, 0, 230, { fill: '#FFD43B', stroke: '#000', strokeWidth: 10 });
wajah.circle(-80, -40, 34, { fill: '#000' });
wajah.circle(80, -40, 34, { fill: '#000' });
wajah.circle(-70, -52, 10, { fill: '#fff' });
wajah.circle(90, -52, 10, { fill: '#fff' });
wajah.ellipse(0, 100, 70, 44, { fill: '#000' });
wajah.path('M 170 -150 C 200 -100 230 -60 200 -30 C 170 -10 150 -60 170 -150 Z', { fill: '#74c0fc', stroke: '#000', strokeWidth: 6 }); // keringat
wajah.pop(0, { dur: 12 }).wiggle({ amp: 5, rot: 3, freq: 3, from: 50 });

// punchline muncul di 1.6s (show = hanya tampil di rentang ini)
const bawah = s.layer('Bawah', { fixed: true });
bawah.text('Gw: masih render pake CPU', W / 2, 1450, { ...gayaMeme, show: ['1.6s', null], anim: { type: 'words', effect: 'stamp', at: '1.6s', stagger: 3, dur: 8 } });

s.camera.shake({ amp: 10, freq: 16, from: '1.6s', to: '2.2s', decay: true });
s.sfx('boom', { at: '1.6s', volume: -10 });

export default p;
