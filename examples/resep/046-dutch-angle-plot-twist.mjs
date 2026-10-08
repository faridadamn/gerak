// 046 · Plot twist: kamera miring (dutch angle) + tint merah
// kategori: kamera
// fitur: camera rotation (derajat) + zoom · overlay warna dengan blend multiply · teks shake · heartbeat sfx · 2 scene cut
// pakai: twist cerita, "tapi ternyata…", ketegangan, konten storytelling dramatis

import { project } from 'gerak';

const p = project({ title: 'Dutch angle', preset: 'reels', fps: 30, background: '#f8f9fa' });
const W = p.width;
const H = p.height;

// --- scene 1: kondisi normal
const s1 = p.scene('Normal', { duration: '2.5s' });
const t1 = s1.layer('Teks', { x: W / 2, y: 900 });
t1.text('Semua kelihatan\nbaik-baik saja…', 0, 0, { size: 96, weight: 800, color: '#14161f', align: 'center', valign: 'middle', lineHeight: 1.1, anim: { type: 'words', effect: 'fade', at: 4, stagger: 5, dur: 12 } });
t1.float({ amp: 6, period: 3 });
s1.sfx('pad', { at: 0, dur: 2.5, root: 261.6, chord: [0, 4, 7], volume: -18 });

// --- scene 2: twist — langsung potong (cut), kamera miring
const s2 = p.scene('Twist', { duration: '3.5s', background: '#1a1a1a' });
const t2 = s2.layer('Teks', { x: W / 2, y: 900 });
t2.text('TAPI…', 0, -120, { size: 220, weight: 800, color: '#ffffff', align: 'center', valign: 'middle' });
t2.text('stok habis pas lagi viral.', 0, 110, { size: 70, weight: 700, color: '#ffa8a8', align: 'center', valign: 'middle', anim: { type: 'words', effect: 'drop', at: 20, stagger: 4 } });
t2.shake({ amp: 6, freq: 18, from: 0, to: 12, decay: true });

// tint merah menyeluruh
const tint = s2.layer('Tint', { fixed: true, blend: 'multiply' });
tint.rect(0, 0, W, H, { fill: '#ff6b6b', opacity: 0.6 });

// kamera miring 9° dan zoom masuk
s2.camera.key(0, { rotation: 0, zoom: 1.3 }, 'out-expo').key(10, { rotation: -9, zoom: 1.08 }).key('3.5s', { rotation: -11, zoom: 1.18 }, 'linear');

s2.sfx('boom', { at: 0, volume: -8 });
s2.sfx('heartbeat', { at: 12, bpm: 90, beats: 3, volume: -6 });

export default p;
